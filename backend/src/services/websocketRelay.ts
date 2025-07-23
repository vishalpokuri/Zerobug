import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";

interface CliConnection {
  socket: WebSocket;
  projectId: string;
  isAlive: boolean;
}

interface FrontendConnection {
  socket: WebSocket;
  projectId: string;
  isAlive: boolean;
}

class WebSocketRelay {
  private wss: WebSocketServer;
  private cliConnections = new Map<string, CliConnection>(); // projectId -> CLI connection
  private frontendConnections = new Map<string, FrontendConnection[]>(); // projectId -> frontend connections

  constructor(server: Server) {
    this.wss = new WebSocketServer({
      server,
      path: "/ws",
    });

    this.setupWebSocketServer();
    this.startHeartbeat();
  }

  private setupWebSocketServer() {
    this.wss.on("connection", (ws, req) => {
      const url = new URL(req.url || "", `http://${req.headers.host}`);
      const projectId = url.searchParams.get("projectId");
      const clientType = url.searchParams.get("type"); // 'cli' or 'frontend'

      if (!projectId || !clientType) {
        ws.close(1008, "Missing projectId or type parameter");
        return;
      }

      console.log(
        `🔗 ${clientType.toUpperCase()} connected for project: ${projectId}`
      );

      if (clientType === "cli") {
        this.handleCliConnection(ws, projectId);
      } else if (clientType === "frontend") {
        this.handleFrontendConnection(ws, projectId);
      } else {
        ws.close(1008, 'Invalid client type. Must be "cli" or "frontend"');
      }
    });
  }

  private handleCliConnection(ws: WebSocket, projectId: string) {
    // Check if CLI already connected for this project
    if (this.cliConnections.has(projectId)) {
      ws.close(1008, "CLI already connected for this project");
      return;
    }
    //Creating a cliConnection and putting it in the cliConnections private object
    const cliConnection: CliConnection = {
      socket: ws,
      projectId,
      isAlive: true,
    };

    this.cliConnections.set(projectId, cliConnection);

    // When a message is received from CLI
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        // Forward CLI messages to all connected frontends for this project
        const frontendConnections =
          this.frontendConnections.get(projectId) || [];
        frontendConnections.forEach((frontend) => {
          this.msgFrontendConnections(frontend, { ...message, source: "cli" });
        });

        console.log(
          `📤 CLI -> Frontend: ${
            message.type || "unknown"
          } for project ${projectId}`
        );
      } catch (error) {
        console.error("Invalid JSON from CLI:", error);
      }
    });

    ws.on("pong", () => {
      cliConnection.isAlive = true;
    });

    ws.on("close", () => {
      this.cliConnections.delete(projectId);
      console.log(`❌ CLI disconnected from project: ${projectId}`);

      // Notify frontend connections that CLI is disconnected
      const frontendConnections = this.frontendConnections.get(projectId) || [];
      frontendConnections.forEach((frontend) => {
        this.msgFrontendConnections(frontend, {
          type: "cli_disconnected",
          source: "relay",
        });
      });
    });

    ws.on("error", (error) => {
      console.error(`CLI WebSocket error for project ${projectId}:`, error);
    });

    // Notify frontend connections that CLI is connected
    const frontendConnections = this.frontendConnections.get(projectId) || [];
    frontendConnections.forEach((frontend) => {
      this.msgFrontendConnections(frontend, {
        type: "cli_connected",
        source: "relay",
      });
    });
  }

  //Sends the data to the connected frontend clients
  private msgFrontendConnections(frontend: FrontendConnection, data: any) {
    if (frontend.socket.readyState === WebSocket.OPEN) {
      frontend.socket.send(JSON.stringify(data));
    }
  }

  private handleFrontendConnection(ws: WebSocket, projectId: string) {
    const frontendConnection: FrontendConnection = {
      socket: ws,
      projectId,
      isAlive: true,
    };

    if (!this.frontendConnections.has(projectId)) {
      this.frontendConnections.set(projectId, []);
    }
    this.frontendConnections.get(projectId)!.push(frontendConnection);

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        // Forward frontend messages to CLI for this project
        const cliConnection = this.cliConnections.get(projectId);
        if (
          cliConnection &&
          cliConnection.socket.readyState === WebSocket.OPEN
        ) {
          cliConnection.socket.send(
            JSON.stringify({
              ...message,
              source: "frontend",
            })
          );
          console.log(
            `📤 Frontend -> CLI: ${
              message.type || "unknown"
            } for project ${projectId}`
          );
        } else {
          // CLI not connected, send error back to frontend
          ws.send(
            JSON.stringify({
              type: "error",
              message: "CLI not connected for this project",
              source: "relay",
            })
          );
        }
      } catch (error) {
        console.error("Invalid JSON from frontend:", error);
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Invalid JSON message",
            source: "relay",
          })
        );
      }
    });

    ws.on("pong", () => {
      frontendConnection.isAlive = true;
    });

    ws.on("close", () => {
      const connections = this.frontendConnections.get(projectId) || [];
      const updatedConnections = connections.filter(
        (conn) => conn.socket !== ws
      );

      if (updatedConnections.length === 0) {
        this.frontendConnections.delete(projectId);
      } else {
        this.frontendConnections.set(projectId, updatedConnections);
      }

      console.log(`❌ Frontend disconnected from project: ${projectId}`);
    });

    ws.on("error", (error) => {
      console.error(
        `Frontend WebSocket error for project ${projectId}:`,
        error
      );
    });

    // Send initial connection status
    const cliConnected = this.cliConnections.has(projectId);
    ws.send(
      JSON.stringify({
        type: cliConnected ? "cli_connected" : "cli_disconnected",
        source: "relay",
      })
    );
  }

  private startHeartbeat() {
    setInterval(() => {
      // Check CLI connections
      this.cliConnections.forEach((connection, projectId) => {
        if (!connection.isAlive) {
          console.log(`💔 CLI heartbeat failed for project: ${projectId}`);
          connection.socket.terminate();
          this.cliConnections.delete(projectId);
          return;
        }

        connection.isAlive = false;
        if (connection.socket.readyState === WebSocket.OPEN) {
          connection.socket.ping();
        }
      });

      // Check frontend connections
      this.frontendConnections.forEach((connections, projectId) => {
        const aliveConnections = connections.filter((connection) => {
          if (!connection.isAlive) {
            console.log(
              `💔 Frontend heartbeat failed for project: ${projectId}`
            );
            connection.socket.terminate();
            return false;
          }

          connection.isAlive = false;
          if (connection.socket.readyState === WebSocket.OPEN) {
            connection.socket.ping();
          }
          return true;
        });

        if (aliveConnections.length === 0) {
          this.frontendConnections.delete(projectId);
        } else {
          this.frontendConnections.set(projectId, aliveConnections);
        }
      });
    }, 30000); // Check every 30 seconds
  }

  public getConnectionStats() {
    return {
      cliConnections: Array.from(this.cliConnections.keys()),
      frontendConnections: Object.fromEntries(
        Array.from(this.frontendConnections.entries()).map(
          ([projectId, connections]) => [projectId, connections.length]
        )
      ),
    };
  }
}

export default WebSocketRelay;
