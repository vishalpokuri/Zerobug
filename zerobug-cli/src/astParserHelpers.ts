import fs from "fs";
import path from "path";
import readline from "readline";
import { execSync } from "child_process";

/**
 * Search patterns that indicate an Express backend file
 */
const EXPRESS_PATTERNS = [
  "express()",
  'require("express")',
  "import express",
  "app.get(",
  "app.post(",
  "app.use(",
  "app.listen(",
];

/**
 * Priority patterns for common backend file names
 */
const FILENAME_PRIORITIES = [
  /server\.(js|ts|mjs)$/,
  /index\.(js|ts|mjs)$/,
  /app\.(js|ts|mjs)$/,
  /main\.(js|ts|mjs)$/,
];

/**
 * Automatically detects backend entry file based on express usage.
 */
export function findBackendFile(): string | null {
  for (const pattern of EXPRESS_PATTERNS) {
    try {
      const result = execSync(
        `grep -r "${pattern}" . --include="*.js" --include="*.ts" --include="*.mjs" 2>/dev/null`,
        { encoding: "utf-8" }
      );

      if (result.trim()) {
        const lines = result.trim().split("\n");
        const filePaths = lines.map((line) => line.split(":")[0]);
        const uniquePaths = Array.from(new Set(filePaths));

        // Sort based on filename priority
        for (const priority of FILENAME_PRIORITIES) {
          const match = uniquePaths.find((file) => priority.test(file));
          if (match) return path.resolve(match);
        }

        // Fallback: return first found file
        return path.resolve(uniquePaths[0]);
      }
    } catch {
      continue; // Try next pattern
    }
  }

  return null;
}

/**
 * Prompts user to manually enter backend path if auto-detection fails
 */
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

/**
 * Returns backend source code content as string
 */
export async function getBackendCode(): Promise<string> {
  let backendPath = findBackendFile();

  if (!backendPath) {
    console.log("❌ Could not find backend file automatically.");
    backendPath = await promptForBackendPath();
  } else {
    console.log(`✅ Found backend file: ${backendPath}`);
  }

  if (!fs.existsSync(backendPath)) {
    throw new Error(`Backend file not found: ${backendPath}`);
  }

  return fs.readFileSync(backendPath, "utf-8");
}
