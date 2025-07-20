import WebSocket, { WebSocketServer } from "ws";
import figlet from "figlet";
import { getBackendCode } from "./astParserHelpers";
import { parseExpressRoutes } from "./astParser";

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

  wss.on("connection", (ws, req) => {
    //Constructing the whole http url, for initial handshake
    //req.headers.host gives localhost:9229
    //req.url gives 9229/<this>
    const url = new URL(req.url || "", `http://${req.headers.host}`);
    const clientId = url.searchParams.get("id");
    console.log(`🚀 Starting Zerobug sniffing for project: ${clientId}`);

    //project id will be generated in the client side, a command will be given to copy paste in the terminal, it will start to run
    //checks if the clientId and the received project id is correct. project id will come from command zerobug sniff --id=<here>
    if (!clientId || clientId !== projectId) {
      ws.close(1008, "Invalid project ID");
      return;
    }
    //check in the clients Map, if its not present then pushes it there.
    if (!clients.has(clientId)) clients.set(clientId, []);
    clients.get(clientId)?.push(ws);

    console.log(`✅ Client connected for project ID: ${clientId}`);

    // Send welcome or dummy test data
    // ws.send(
    //   JSON.stringify({
    //     type: "connected",
    //     message: `Subscribed to ${clientId}`,
    //   })
    // );

    //Step-1: Parse the backend code.
    // Main execution
    (async () => {
      try {
        const backendCode = await getBackendCode();
        const routes = parseExpressRoutes(backendCode);
        console.log(JSON.stringify(routes, null, 2));
      } catch (error) {
        console.error(
          "Error:",
          error instanceof Error ? error.message : String(error)
        );
        process.exit(1);
      }
    })();

    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        // Handle different message types here
        if (message.type === "ping") {
          ws.send(JSON.stringify({ type: "pong" }));
        } else {
          // Echo or custom logic
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
