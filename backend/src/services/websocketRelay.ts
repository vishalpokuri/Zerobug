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

interface ProjectData {
  routes?: any[];
  lastUpdate?: Date;
  metadata?: any;
}

class WebSocketRelay {
  private wss: WebSocketServer;
  private cliConnections = new Map<string, CliConnection>(); // projectId -> CLI connection
  private frontendConnections = new Map<string, FrontendConnection[]>(); // projectId -> frontend connections
  private projectData = new Map<string, ProjectData>(); // projectId -> latest data from CLI

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
        `\x1b[36m\x1b[1m[CONNECTION]\x1b[0m \x1b[37m${clientType.toUpperCase()} connected (${projectId})\x1b[0m`
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

    // Notify all frontends that CLI is connected
    const connectedFrontends = this.frontendConnections.get(projectId) || [];
    connectedFrontends.forEach((frontend) => {
      this.msgFrontendConnections(frontend, {
        type: "cli_connected",
        source: "relay",
      });
    });

    // When a message is received from CLI
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());

        // Store latest data from CLI
        this.storeProjectData(projectId, message);

        // Forward CLI messages to all connected frontends for this project
        const frontendConnections =
          this.frontendConnections.get(projectId) || [];
        frontendConnections.forEach((frontend) => {
          this.msgFrontendConnections(frontend, { ...message, source: "cli" });
        });

        console.log(
          `\x1b[33m\x1b[1m[RELAY]\x1b[0m \x1b[37mCLI → Frontend: ${
            message.type || "unknown"
          }\x1b[0m`
        );
      } catch (error) {
        console.log(
          `\x1b[31m\x1b[1m[ERROR]\x1b[0m \x1b[37mInvalid JSON from CLI: ${
            error instanceof Error ? error.message : String(error)
          }\x1b[0m`
        );
      }
    });

    ws.on("pong", () => {
      cliConnection.isAlive = true;
    });

    ws.on("close", () => {
      this.cliConnections.delete(projectId);
      console.log(
        `\x1b[31m\x1b[1m[DISCONNECT]\x1b[0m \x1b[37mCLI disconnected from project: ${projectId}\x1b[0m`
      );

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
      console.log(
        `\x1b[31m\x1b[1m[ERROR]\x1b[0m \x1b[37mCLI WebSocket error for project ${projectId}: ${error.message}\x1b[0m`
      );
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

  // Store latest data from CLI for each project
  private storeProjectData(projectId: string, message: any) {
    if (!this.projectData.has(projectId)) {
      this.projectData.set(projectId, {});
    }

    const projectData = this.projectData.get(projectId)!;

    // Store different types of data
    if (message.type === "routes_update" && message.routes) {
      projectData.routes = message.routes;
    }

    // Always update timestamp and metadata
    projectData.lastUpdate = new Date();
    if (message.projectId) {
      projectData.metadata = {
        ...projectData.metadata,
        projectId: message.projectId,
      };
    }

    console.log(
      `\x1b[35m\x1b[1m[STORAGE]\x1b[0m \x1b[37mStored ${
        message.type || "unknown"
      } data for project ${projectId}\x1b[0m`
    );
  }

  // Send stored data to newly connected frontend
  private sendStoredDataToFrontend(ws: WebSocket, projectId: string) {
    const storedData = this.projectData.get(projectId);
    if (!storedData) {
      console.log(
        `\x1b[90m\x1b[1m[STORAGE]\x1b[0m \x1b[37mNo stored data for project ${projectId}\x1b[0m`
      );
      return;
    }

    // Send stored routes if available
    if (storedData.routes) {
      ws.send(
        JSON.stringify({
          type: "routes_update",
          routes: storedData.routes,
          projectId: projectId,
          source: "relay",
          fromStorage: true, // Flag to indicate this is from storage
          lastUpdate: storedData.lastUpdate,
        })
      );
      console.log(
        `\x1b[35m\x1b[1m[STORAGE]\x1b[0m \x1b[37mSent stored routes to new frontend for project ${projectId}\x1b[0m`
      );
    }

    // Send any other stored data types here if needed
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
            `\x1b[33m\x1b[1m[RELAY]\x1b[0m \x1b[37mFrontend → CLI: ${
              message.type || "unknown"
            } for project ${projectId}\x1b[0m`
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
        console.log(
          `\x1b[31m\x1b[1m[ERROR]\x1b[0m \x1b[37mInvalid JSON from frontend: ${
            error instanceof Error ? error.message : String(error)
          }\x1b[0m`
        );
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

      console.log(
        `\x1b[31m\x1b[1m[DISCONNECT]\x1b[0m \x1b[37mFrontend disconnected from project: ${projectId}\x1b[0m`
      );
    });

    ws.on("error", (error) => {
      console.log(
        `\x1b[31m\x1b[1m[ERROR]\x1b[0m \x1b[37mFrontend WebSocket error for project ${projectId}: ${error.message}\x1b[0m`
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

    // Send stored project data immediately if available
    this.sendStoredDataToFrontend(ws, projectId);
    
    // Send current CLI connection status to newly connected frontend
    const isCliConnected = this.cliConnections.has(projectId);
    ws.send(JSON.stringify({
      type: isCliConnected ? "cli_connected" : "cli_disconnected",
      source: "relay",
    }));
  }

  private startHeartbeat() {
    setInterval(() => {
      // Check CLI connections
      this.cliConnections.forEach((connection, projectId) => {
        if (!connection.isAlive) {
          console.log(
            `\x1b[91m\x1b[1m[HEARTBEAT]\x1b[0m \x1b[37mCLI heartbeat failed for project: ${projectId}\x1b[0m`
          );
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
              `\x1b[91m\x1b[1m[HEARTBEAT]\x1b[0m \x1b[37mFrontend heartbeat failed for project: ${projectId}\x1b[0m`
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
