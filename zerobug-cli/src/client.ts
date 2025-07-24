import WebSocket from "ws";
import {
  getBackendCode,
  getBackendFilePath,
  getProjectRoot,
} from "./astParserHelpers";
import { parseExpressRoutes } from "./astParser";
import { parseExpressRoutesRobust } from "./robustAstParser";
import chokidar, { FSWatcher } from "chokidar";
import figlet from "figlet";
import fetch from "node-fetch";
import { Logger } from "./logger";
import * as readline from "readline";

interface ClientConfig {
  projectId: string;
  backendPort: string;
  relayUrl?: string;
}

class ZerobugClient {
  private ws: WebSocket | null = null;
  private config: ClientConfig;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private connectionTimeout: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private watcher: FSWatcher | null = null;
  private retryCount = 0;
  private maxRetries = 5;
  private isShuttingDown = false;

  constructor(config: ClientConfig) {
    this.config = {
      ...config,
      // relayUrl: "ws://localhost:3401/ws",
      relayUrl: "wss://backend.canum.xyz/api3/ws",
    };
  }

  async start() {
    // Show ASCII art
    await this.showLogo();

    // Start file watching
    await this.startFileWatching();

    // Connect to relay
    try {
      await this.connect();
    } catch (err: any) {
      Logger.error(`Initial connection failed: ${err.message}`);
      await this.scheduleReconnect();
    }
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
        Logger.watcher("File changed, reparsing routes");
        this.parseAndSendRoutes();
      });

      Logger.watcher(`Watching: ${filePath}`);
    } catch (error) {
      console.error("Error setting up file watcher:", error);
    }
  }

  private async connect(): Promise<void> {
    if (this.isConnecting || this.isShuttingDown) {
      return;
    }

    this.isConnecting = true;
    this.cleanupConnection();

    const url = `${this.config.relayUrl}?projectId=${this.config.projectId}&type=cli`;
    Logger.connection(
      `Connecting to relay (attempt ${this.retryCount + 1}/${this.maxRetries})`
    );

    return new Promise((resolve, reject) => {
      let connectionResolved = false;

      try {
        this.ws = new WebSocket(url);
      } catch (error) {
        this.isConnecting = false;
        reject(error);
        return;
      }

      // 4-second connection timeout
      this.connectionTimeout = setTimeout(() => {
        if (!connectionResolved) {
          connectionResolved = true;
          Logger.error("Connection timeout after 4 seconds");
          this.cleanupConnection();
          this.isConnecting = false;
          reject(new Error("Connection timeout"));
        }
      }, 4000);

      this.ws.on("open", () => {
        if (!connectionResolved) {
          connectionResolved = true;
          this.clearTimeouts();
          Logger.connection("Connected to relay successfully");
          this.isConnecting = false;
          this.retryCount = 0;
          this.parseAndSendRoutes();
          resolve();
        }
      });

      this.ws.on("message", async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(message);
        } catch (error) {
          Logger.error(`Error parsing message: ${error}`);
        }
      });

      this.ws.on("close", (code) => {
        if (!connectionResolved) {
          connectionResolved = true;
          this.clearTimeouts();
          this.isConnecting = false;
          reject(new Error(`Connection closed (${code})`));
        } else {
          this.clearTimeouts();
          Logger.connection(`Connection closed (${code})`);
          this.isConnecting = false;

          if (!this.isShuttingDown) {
            this.scheduleReconnect();
          }
        }
      });

      this.ws.on("error", (error) => {
        if (!connectionResolved) {
          connectionResolved = true;
          this.clearTimeouts();
          this.isConnecting = false;
          this.cleanupConnection();
          reject(error);
        }
      });
    });
  }

  private cleanupConnection() {
    if (this.ws) {
      this.ws.removeAllListeners();
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, "Reconnecting");
      } else {
        this.ws.terminate();
      }
      this.ws = null;
    }
  }

  private clearTimeouts() {
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private async scheduleReconnect() {
    if (this.isShuttingDown || this.isConnecting) {
      return;
    }

    this.retryCount++;

    if (this.retryCount > this.maxRetries) {
      Logger.error(`Max retry attempts (${this.maxRetries}) reached`);
      await this.promptForRetry();
      return;
    }

    Logger.retry(`Retry ${this.retryCount}/${this.maxRetries} in 4 seconds`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        // Connection failed, schedule next retry
        if (!this.isShuttingDown) {
          await this.scheduleReconnect();
        }
      }
    }, 4000);
  }

  private async promptForRetry(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise<void>((resolve) => {
      rl.question(
        "\nDo you want to retry connecting? (y/n): ",
        async (answer) => {
          rl.close();

          if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
            Logger.connection("Retrying connection...");
            this.retryCount = 0;
            try {
              await this.connect();
            } catch (error) {
              Logger.error("Retry failed, will continue retrying...");
            }
          } else {
            Logger.error("Connection abandoned by user");
            this.isShuttingDown = true;
            process.exit(1);
          }
          resolve();
        }
      );
    });
  }

  private async handleMessage(message: any) {
    try {
      if (message.type === "ping") {
        this.send({ type: "pong" });
      } else if (message.type === "request_test") {
        await this.handleRequestTest(message);
      }
    } catch (error) {
      console.error("Error handling message:", error);
    }
  }

  private async handleRequestTest(message: any) {
    const { method, path, headers, body } = message.requestData;
    const backendPort = this.config.backendPort;

    try {
      Logger.request(`Testing ${method} ${path}`);

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

      Logger.success(`Response: ${response.status}`);
    } catch (err: any) {
      Logger.error(`Request failed: ${err.message}`);

      this.send({
        type: "response_result",
        error: err.message,
      });
    }
  }

  private async parseAndSendRoutes() {
    try {
      // Use robust parser for project-wide analysis
      const projectRoot = getProjectRoot();
      Logger.parsing(`Starting robust analysis of project: ${projectRoot}`);

      const routes = await parseExpressRoutesRobust(projectRoot);

      this.send({
        type: "routes_update",
        routes: routes,
        projectId: this.config.projectId,
      });

      Logger.routes(`Sent ${routes.length || 0} routes to relay`);
    } catch (error) {
      Logger.error(`Failed to parse routes with robust parser: ${error}`);

      // Fallback to old parser if robust fails
      try {
        Logger.parsing("Falling back to basic parser...");
        const backendCode = await getBackendCode();
        const routes = parseExpressRoutes(backendCode);

        this.send({
          type: "routes_update",
          routes: routes,
          projectId: this.config.projectId,
        });

        Logger.routes(`Sent ${routes.length || 0} routes to relay (fallback)`);
      } catch (fallbackError) {
        Logger.error(`Both parsers failed: ${fallbackError}`);
      }
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
    Logger.connection("Stopping client");
    this.isShuttingDown = true;

    this.clearTimeouts();

    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    this.cleanupConnection();
    Logger.success("Client stopped");
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

  // Handle graceful shutdown (cross-platform)
  process.on("SIGINT", () => {
    console.log("\n🛑 Received SIGINT, shutting down gracefully...");
    client.stop();
    process.exit(0);
  });

  // SIGTERM is not supported on Windows the same way, so only add it on non-Windows platforms
  if (process.platform !== "win32") {
    process.on("SIGTERM", () => {
      console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
      client.stop();
      process.exit(0);
    });
  } else {
    // On Windows, handle Ctrl+Break (SIGBREAK) if available
    process.on("SIGBREAK", () => {
      console.log("\n🛑 Received SIGBREAK, shutting down gracefully...");
      client.stop();
      process.exit(0);
    });
  }

  await client.start();
}
