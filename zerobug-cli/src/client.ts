import WebSocket from "ws";
import { getBackendCode, getBackendFilePath } from "./astParserHelpers";
import { parseExpressRoutes } from "./astParser";
import chokidar, { FSWatcher } from "chokidar";
import figlet from "figlet";
import fetch from "node-fetch";

interface ClientConfig {
  projectId: string;
  backendPort: string;
  relayUrl?: string;
}

class ZerobugClient {
  private ws: WebSocket | null = null;
  private config: ClientConfig;
  private reconnectInterval: NodeJS.Timeout | null = null;
  private isReconnecting = false;
  private watcher: FSWatcher | null = null;

  constructor(config: ClientConfig) {
    this.config = {
      ...config,
      relayUrl: config.relayUrl || "wss://backend.canum.xyz/api3/ws",
    };
  }

  async start() {
    // Show ASCII art
    await this.showLogo();

    // Start file watching
    await this.startFileWatching();

    // Connect to relay
    this.connect();
  }

  private async showLogo() {
    return new Promise<void>((resolve) => {
      figlet("zerobug", { font: "Larry 3D 2" }, (err, data) => {
        if (err) {
          console.error("Figlet error:", err);
        } else {
          console.log(data);
        }
        resolve();
      });
    });
  }

  private async startFileWatching() {
    try {
      const filePath = await getBackendFilePath();
      this.watcher = chokidar.watch(filePath, {
        persistent: true,
      });

      this.watcher.on("change", () => {
        console.log(`🔄️ File changed, reparsing and sending routes...`);
        this.parseAndSendRoutes();
      });

      console.log(`👀 Watching files at: ${filePath}`);
    } catch (error) {
      console.error("Error setting up file watcher:", error);
    }
  }

  private connect() {
    if (this.isReconnecting) return;

    const url = `${this.config.relayUrl}?projectId=${this.config.projectId}&type=cli`;
    console.log(`🔗 Connecting to relay: ${url}`);

    this.ws = new WebSocket(url);

    this.ws.on("open", () => {
      console.log(
        `✅ Connected to Zerobug relay for project: ${this.config.projectId}`
      );
      this.isReconnecting = false;

      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }

      // Send initial routes
      this.parseAndSendRoutes();
    });

    this.ws.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        await this.handleMessage(message);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    });

    this.ws.on("close", (code, reason) => {
      console.log(`❌ Connection closed: ${code} - ${reason.toString()}`);
      this.ws = null;
      this.scheduleReconnect();
    });

    this.ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  }

  private scheduleReconnect() {
    if (this.isReconnecting) return;

    this.isReconnecting = true;
    console.log("🔄 Scheduling reconnection in 5 seconds...");

    this.reconnectInterval = setTimeout(() => {
      console.log("🔄 Attempting to reconnect...");
      this.connect();
    }, 5000);
  }

  private async handleMessage(message: any) {
    try {
      if (message.type === "ping") {
        this.send({ type: "pong" });
      } else if (message.type === "request_test") {
        await this.handleRequestTest(message);
      } else {
        console.log("📥 Received message:", message.type || "unknown");
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  }

  private async handleRequestTest(message: any) {
    const { method, path, headers, body } = message.requestData;
    const backendPort = this.config.backendPort;

    try {
      console.log(`🚀 Testing ${method} ${path} on port ${backendPort}`);

      const response = await fetch(`http://localhost:${backendPort}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const resBody = await response.text();

      this.send({
        type: "response_result",
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: resBody,
      });

      console.log(`✅ Response: ${response.status}`);
    } catch (err: any) {
      console.error(`❌ Request failed: ${err.message}`);

      this.send({
        type: "response_result",
        error: err.message,
      });
    }
  }

  private async parseAndSendRoutes() {
    try {
      const backendCode = await getBackendCode();
      const routes = parseExpressRoutes(backendCode);

      this.send({
        type: "routes_update",
        routes: routes,
        projectId: this.config.projectId,
      });

      console.log(`📤 Sent ${routes.length || 0} routes to relay`);
    } catch (error) {
      console.error("Error parsing and sending routes:", error);
    }
  }

  private send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn("⚠️ Cannot send message - WebSocket not connected");
    }
  }

  public stop() {
    console.log("🛑 Stopping Zerobug client...");

    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }

    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    if (this.ws) {
      this.ws.close(1000, "Client shutdown");
      this.ws = null;
    }

    console.log("✅ Zerobug client stopped");
  }
}

export async function startZerobugClient(
  projectId: string,
  backendPort: string,
  relayUrl?: string
) {
  const client = new ZerobugClient({
    projectId,
    backendPort,
    relayUrl,
  });

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Received SIGINT, shutting down gracefully...");
    client.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
    client.stop();
    process.exit(0);
  });

  await client.start();
}
