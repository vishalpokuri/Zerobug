import fs from "fs";
import { execSync } from "child_process";
import path from "path";
import readline from "readline";

export function findBackendFile(): string | null {
  // Express-specific search patterns (in order of reliability)
  const expressPatterns = [
    "express()", // require('express')() or import express
    'require("express")',
    "app.get", // Express route methods
    "app.post", // Express route methods
    "app.use(", // Express middleware
    "app.listen(", // Express app.listen()
  ];

  for (const pattern of expressPatterns) {
    try {
      const result = execSync(
        `grep -r "${pattern}" . --include="*.js" --include="*.ts" --include="*.mjs" 2>/dev/null`,
        {
          encoding: "utf8",
        }
      );

      if (result.trim()) {
        const lines = result.trim().split("\n");
        // console.log(`Found ${lines.length} matches for pattern: ${pattern}`);

        // Extract file paths and prioritize common backend file names
        const filePaths = lines.map((line) => line.split(":")[0]);

        // Priority order for backend files
        const priorities = [
          /server\.(js|ts|mjs)$/,
          /index\.(js|ts|mjs)$/,
          /app\.(js|ts|mjs)$/,
          /main\.(js|ts|mjs)$/,
        ];

        // Find the highest priority match
        for (const priority of priorities) {
          const match = filePaths.find((file) => priority.test(file));
          if (match) {
            return path.resolve(match);
          }
        }

        // If no priority match, use the first one
        return path.resolve(filePaths[0]);
      }
    } catch (error) {
      // Continue to next pattern if this one fails
      continue;
    }
  }

  return null;
}

export async function promptForBackendPath(): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("Please enter the path to your backend file: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function getBackendCode(): Promise<string> {
  let backendPath = findBackendFile();

  if (!backendPath) {
    console.log("No backend file with app.listen() found automatically.");
    backendPath = await promptForBackendPath();
  } else {
    console.log(`Found backend file: ${backendPath}`);
  }

  if (!fs.existsSync(backendPath)) {
    throw new Error(`Backend file not found: ${backendPath}`);
  }

  return fs.readFileSync(backendPath, "utf-8");
}
