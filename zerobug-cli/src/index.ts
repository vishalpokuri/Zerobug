#!/usr/bin/env node

import { Command } from "commander";
import { startWebSocketServer } from "./server";

const program = new Command();

program
  .command("sniff")
  .description("Start Zerobug WebSocket server and backend sniffing")
  .requiredOption("--id <id>", "Unique project ID")
  .requiredOption("--backend <port>", "Backend port (e.g. 8000)")
  .action((options) => {
    startWebSocketServer(options.id);
  });

program.parse();
