import WebSocket, { WebSocketServer } from "ws";
import figlet from "figlet";
import chokidar from "chokidar";
import { getBackendCode, getBackendFilePath } from "./astParserHelpers";
import { parseExpressRoutes } from "./astParser";
import fetch from "node-fetch";

const clients = new Map<string, WebSocket[]>(); // id -> [sockets]

export async function startWebSocketServer(projectId: string) {
  const wss = new WebSocketServer({ port: 9229 });

  // Wait for figlet to finish before proceeding
  await new Promise<void>((resolve) => {
    figlet("zerobug", { font: "Larry 3D 2" }, (err, data) => {
      if (err) {
        console.error("Figlet error:", err);
      } else {
        console.log(data);
      }
      resolve();
    });
  });

  const filePath = await getBackendFilePath();
  const watcher = chokidar.watch(filePath, {
    persistent: true,
  });

  const parseAndSendRoutes = async (clientId: string) => {
    try {
      const backendCode = await getBackendCode();
      const routes = parseExpressRoutes(backendCode);
      const clientSockets = clients.get(clientId);
      if (clientSockets) {
        for (const ws of clientSockets) {
          ws.send(JSON.stringify(routes));
        }
      }
    } catch (error) {
      console.error(
        "Error:",
        error instanceof Error ? error.message : String(error)
      );
      process.exit(1);
    }
  };

  watcher.on("change", () => {
    console.log(`🔄️ File changed, reparsing and sending routes...`);
    parseAndSendRoutes(projectId);
  });

  wss.on("connection", (ws, req) => {
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const clientId = url.searchParams.get("id");
    console.log(`🚀 Starting Zerobug sniffing for project: ${clientId}`);

    if (!clientId || clientId !== projectId) {
      ws.close(1008, "Invalid project ID");
      return;
    }

    if (!clients.has(clientId)) clients.set(clientId, []);
    clients.get(clientId)?.push(ws);

    console.log(`✅ Client connected for project ID: ${clientId}`);

    parseAndSendRoutes(clientId);

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        } else if (message.type === "request_test") {
          const { method, path, headers, body } = message.requestData;
          const { backendPort } = message;
          try {
            const response = await fetch(
              `http://localhost:${backendPort}${path}`,
              {
                method,
                headers,
                body: body ? JSON.stringify(body) : undefined,
              }
            );

            const resBody = await response.text();

            ws.send(
              JSON.stringify({
                type: "response_result",
                status: response.status,
                headers: Object.fromEntries(response.headers.entries()),
                body: resBody,
              })
            );
          } catch (err: any) {
            ws.send(
              JSON.stringify({
                type: "response_result",
                error: err.message,
              })
            );
          }
        } else {
          ws.send(JSON.stringify({ type: "received", payload: message }));
        }
      } catch (err) {
        ws.send(JSON.stringify({ type: "error", message: "Invalid JSON" }));
      }
    });

    ws.on("close", () => {
      clients.set(
        clientId,
        (clients.get(clientId) || []).filter((s) => s !== ws)
      );
      console.log(`❌ Client disconnected from ${clientId}`);
    });
  });

  console.log(`🧠 WebSocket Server running on ws://localhost:9229`);
}
