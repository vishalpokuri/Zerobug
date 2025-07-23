#!/usr/bin/env node

import { Command } from "commander";
import { startZerobugClient } from "./client";
import fs from "fs";
import path from "path";

const program = new Command();
const configFilePath = path.join(process.cwd(), ".zerobugrc");

function saveConfig(config: Record<string, any>) {
  fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
}

function loadConfig(): Record<string, any> {
  if (fs.existsSync(configFilePath)) {
    return JSON.parse(fs.readFileSync(configFilePath, "utf-8"));
  }
  return {};
}

// INIT command
program
  .command("init")
  .description("Initialize Zerobug project")
  .requiredOption("--id <id>", "Unique project ID")
  .requiredOption("--backend <port>", "Backend port (e.g. 8000)")
  .action((options) => {
    const config = {
      projectId: options.id,
      backendPort: options.backend,
    };
    saveConfig(config);
    console.log("🚀 Project initialized for sniffing.");
  });

// SNIFF command
program
  .command("sniff")
  .description("Start Zerobug client and connect to relay")
  .option("--id <id>", "Override project ID")
  .option("--backend <port>", "Override backend port")
  .action(async (options) => {
    // Load existing config (if exists)
    const existingConfig = loadConfig();

    // Override only if new options provided
    const updatedConfig = {
      ...existingConfig,
      ...(options.id && { projectId: options.id }),
      ...(options.backend && { backendPort: options.backend }),
    };

    // Validate required fields
    if (!updatedConfig.projectId || !updatedConfig.backendPort) {
      console.error(
        "❌ Error: Project ID and backend port are required.\nPlease run:\n  zerobug init --id <id> --backend <port>\nor pass both options to sniff."
      );
      process.exit(1);
    }

    // Save the updated config
    saveConfig(updatedConfig);

    // Zerobug relay URL is constant - always port 3401
    const relayUrl = "ws://localhost:3401/ws";

    // Start the client
    await startZerobugClient(
      updatedConfig.projectId, 
      updatedConfig.backendPort,
      relayUrl
    );
  });

program.parse();
