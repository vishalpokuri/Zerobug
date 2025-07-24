import fs from "fs";
import path from "path";
import readline from "readline";
import { Logger } from "./logger";

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
 * Cross-platform file search function that replaces grep
 */
function searchFilesForPatterns(patterns: string[], extensions: string[]): string[] {
  const results: string[] = [];
  const projectRoot = getProjectRoot();
  const excludeDirs = ['node_modules', 'dist', 'build', 'coverage', '.git'];

  function searchDirectory(dir: string): void {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // Skip excluded directories
          if (!excludeDirs.includes(entry.name)) {
            searchDirectory(fullPath);
          }
        } else if (entry.isFile()) {
          // Check if file has valid extension
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            try {
              const content = fs.readFileSync(fullPath, 'utf-8');
              for (const pattern of patterns) {
                if (content.includes(pattern)) {
                  results.push(fullPath);
                  break; // Found pattern, no need to check others for this file
                }
              }
            } catch {
              // Skip files that can't be read
            }
          }
        }
      }
    } catch {
      // Skip directories that can't be read
    }
  }

  searchDirectory(projectRoot);
  return results;
}

/**
 * Automatically detects backend entry file based on express usage.
 * Cross-platform implementation that works on Windows and Unix.
 */
export function findBackendFile(): string | null {
  try {
    const extensions = ['.js', '.ts', '.mjs'];
    const filePaths = searchFilesForPatterns(EXPRESS_PATTERNS, extensions);
    
    if (filePaths.length === 0) {
      return null;
    }

    const uniquePaths = Array.from(new Set(filePaths));

    // Sort based on filename priority
    for (const priority of FILENAME_PRIORITIES) {
      const match = uniquePaths.find((file) => priority.test(path.basename(file)));
      if (match) return path.resolve(match);
    }

    // Fallback: return first found file
    if (uniquePaths.length > 0) {
      return path.resolve(uniquePaths[0]);
    }
  } catch (error) {
    Logger.parsing(`Error during backend file search: ${error}`);
  }

  return null;
}

/**
 * Get project root directory
 */
export function getProjectRoot(): string {
  let currentDir = process.cwd();
  
  // Look for package.json to identify project root
  while (currentDir !== path.dirname(currentDir)) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }
  
  // Fallback to current working directory
  return process.cwd();
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
export async function getBackendFilePath(): Promise<string> {
  let backendPath = findBackendFile();

  if (!backendPath) {
    console.log("❌ Could not find backend file automatically.");
    backendPath = await promptForBackendPath();
  } else {
    Logger.parsing(`Parsing backend file: ${backendPath}`);
  }

  if (!fs.existsSync(backendPath)) {
    throw new Error(`⚠️ Backend file not found: ${backendPath}`);
  }

  return backendPath;
}

export async function getBackendCode(): Promise<string> {
  const backendPath = await getBackendFilePath();
  return fs.readFileSync(backendPath, "utf-8");
}
