import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import fs from "fs";
import path from "path";
import { EndpointData, ParamType } from "./types";
import { Logger } from "./logger";

interface ImportInfo {
  source: string;
  importedNames: string[];
  defaultImport?: string;
  namespaceImport?: string;
}

interface RouteMount {
  prefix: string;
  routerName: string;
  filePath?: string;
}

interface FileAnalysis {
  filePath: string;
  ast: t.File;
  imports: ImportInfo[];
  exports: string[];
  routes: EndpointData[];
  routeMounts: RouteMount[];
  functions: Map<string, t.Function>;
  variables: Map<string, any>;
}

export class RobustExpressParser {
  private analysisCache = new Map<string, FileAnalysis>();
  private projectRoot: string;
  private allRoutes: EndpointData[] = [];
  private processedFiles = new Set<string>();

  constructor(projectRoot: string) {
    this.projectRoot = path.resolve(projectRoot);
  }

  /**
   * Main entry point - parses the entire project for routes
   */
  async parseProject(): Promise<EndpointData[]> {
    Logger.parsing("Starting robust project-wide route analysis...");

    // Find all potential backend files
    const entryFiles = await this.findBackendEntryPoints();

    Logger.parsing(`Found ${entryFiles.length} potential entry files`);

    // Analyze each entry file and follow its dependencies
    for (const entryFile of entryFiles) {
      await this.analyzeFileRecursively(entryFile);
    }

    // Post-process to resolve cross-file references
    await this.resolveCrossFileReferences();

    Logger.parsing(`Total routes discovered: ${this.allRoutes.length}`);
    return this.allRoutes;
  }

  /**
   * Find all potential backend entry points
   */
  private async findBackendEntryPoints(): Promise<string[]> {
    const entryFiles: string[] = [];

    // Priority file patterns
    const priorityPatterns = [
      "server.{js,ts,mjs}",
      "index.{js,ts,mjs}",
      "app.{js,ts,mjs}",
      "main.{js,ts,mjs}",
      "src/server.{js,ts,mjs}",
      "src/index.{js,ts,mjs}",
      "src/app.{js,ts,mjs}",
    ];

    // Check for package.json main field
    const packageJsonPath = path.join(this.projectRoot, "package.json");
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf-8")
        );
        if (packageJson.main) {
          const mainFile = path.resolve(this.projectRoot, packageJson.main);
          if (fs.existsSync(mainFile)) {
            entryFiles.push(mainFile);
          }
        }
      } catch (error) {
        Logger.error(`Error reading package.json: ${error}`);
      }
    }

    // Find files matching priority patterns
    for (const pattern of priorityPatterns) {
      const files = await this.findFilesByPattern(pattern);
      entryFiles.push(...files);
    }

    // Find any file that imports express or creates express app
    const expressFiles = await this.findExpressFiles();
    entryFiles.push(...expressFiles);

    // Remove duplicates and non-existent files
    return Array.from(new Set(entryFiles)).filter(
      (file) => fs.existsSync(file) && !this.isNodeModulesFile(file)
    );
  }

  /**
   * Find files by glob-like pattern
   */
  private async findFilesByPattern(pattern: string): Promise<string[]> {
    const files: string[] = [];

    // Convert simple pattern to regex
    const regexPattern = pattern
      .replace(/\./g, "\\.")
      .replace(/\{([^}]+)\}/g, "($1)")
      .replace(/,/g, "|");

    const regex = new RegExp(`^${regexPattern}$`);

    const searchPaths = [this.projectRoot];
    const srcPath = path.join(this.projectRoot, "src");
    if (fs.existsSync(srcPath)) {
      searchPaths.push(srcPath);
    }

    for (const searchPath of searchPaths) {
      try {
        const entries = fs.readdirSync(searchPath, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile() && regex.test(entry.name)) {
            files.push(path.join(searchPath, entry.name));
          }
        }
      } catch (error) {
        // Directory might not exist, continue
      }
    }

    return files;
  }

  /**
   * Find files that import or use Express
   */
  private async findExpressFiles(): Promise<string[]> {
    const expressFiles: string[] = [];

    const searchDirs = [
      this.projectRoot,
      path.join(this.projectRoot, "src"),
      path.join(this.projectRoot, "server"),
      path.join(this.projectRoot, "backend"),
      path.join(this.projectRoot, "api"),
    ];

    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        await this.searchForExpressInDirectory(dir, expressFiles);
      }
    }

    return expressFiles;
  }

  /**
   * Recursively search directory for Express usage
   */
  private async searchForExpressInDirectory(
    dir: string,
    result: string[]
  ): Promise<void> {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules and common ignore directories
          if (!this.shouldSkipDirectory(entry.name)) {
            await this.searchForExpressInDirectory(fullPath, result);
          }
        } else if (entry.isFile() && this.isJavaScriptFile(entry.name)) {
          if (await this.fileContainsExpress(fullPath)) {
            result.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
    }
  }

  /**
   * Check if directory should be skipped
   */
  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = [
      "node_modules",
      ".git",
      "dist",
      "build",
      "coverage",
      ".nyc_output",
      "logs",
      "tmp",
      "temp",
      ".cache",
      "public",
      "static",
      "assets",
      "uploads",
      "__pycache__",
      ".vscode",
      ".idea",
    ];

    return skipDirs.includes(dirName) || dirName.startsWith(".");
  }

  /**
   * Check if file is a JavaScript/TypeScript file
   */
  private isJavaScriptFile(filename: string): boolean {
    return /\.(js|ts|mjs|jsx|tsx)$/.test(filename);
  }

  /**
   * Check if file is in node_modules
   */
  private isNodeModulesFile(filePath: string): boolean {
    // Use path.normalize to handle both Windows and Unix paths
    const normalizedPath = path.normalize(filePath);
    return (
      normalizedPath.includes(`node_modules${path.sep}`) ||
      normalizedPath.includes(`${path.sep}node_modules${path.sep}`) ||
      normalizedPath.endsWith(`${path.sep}node_modules`)
    );
  }

  /**
   * Check if file contains Express usage
   */
  private async fileContainsExpress(filePath: string): Promise<boolean> {
    try {
      const content = fs.readFileSync(filePath, "utf-8");

      const expressPatterns = [
        /require\s*\(\s*['"]express['"]\s*\)/,
        /import\s+.*\s+from\s+['"]express['"]/,
        /import\s*\*\s*as\s+\w+\s+from\s+['"]express['"]/,
        /\.get\s*\(/,
        /\.post\s*\(/,
        /\.put\s*\(/,
        /\.patch\s*\(/,
        /\.delete\s*\(/,
        /\.use\s*\(/,
        /\.listen\s*\(/,
        /Router\s*\(/,
        /express\s*\(\s*\)/,
      ];

      return expressPatterns.some((pattern) => pattern.test(content));
    } catch (error) {
      return false;
    }
  }

  /**
   * Analyze a file and recursively follow its imports
   */
  private async analyzeFileRecursively(
    filePath: string
  ): Promise<FileAnalysis | null> {
    const normalizedPath = path.resolve(filePath);

    // Skip if already processed or is node_modules
    if (
      this.processedFiles.has(normalizedPath) ||
      this.isNodeModulesFile(normalizedPath)
    ) {
      return this.analysisCache.get(normalizedPath) || null;
    }

    this.processedFiles.add(normalizedPath);

    try {
      const content = fs.readFileSync(normalizedPath, "utf-8");
      const ast = parse(content, {
        sourceType: "module",
        plugins: ["typescript", "jsx", "decorators-legacy", "objectRestSpread"],
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        strictMode: false,
      });

      const analysis: FileAnalysis = {
        filePath: normalizedPath,
        ast,
        imports: [],
        exports: [],
        routes: [],
        routeMounts: [],
        functions: new Map(),
        variables: new Map(),
      };

      // Analyze the AST
      await this.analyzeAST(ast, analysis);

      // Cache the analysis
      this.analysisCache.set(normalizedPath, analysis);

      // Recursively analyze imported files
      for (const importInfo of analysis.imports) {
        const importedFilePath = this.resolveImportPath(
          importInfo.source,
          normalizedPath
        );
        if (importedFilePath) {
          await this.analyzeFileRecursively(importedFilePath);
        }
      }

      return analysis;
    } catch (error) {
      Logger.error(`Failed to parse ${filePath}: ${error}`);
      return null;
    }
  }

  /**
   * Analyze AST to extract routes, imports, exports, functions
   */
  private async analyzeAST(ast: t.File, analysis: FileAnalysis): Promise<void> {
    // First pass: collect imports, exports, functions, variables
    traverse(ast, {
      // Handle imports
      ImportDeclaration: (path) => {
        const importInfo = this.extractImportInfo(path.node);
        if (importInfo) {
          analysis.imports.push(importInfo);
        }
      },

      // Handle CommonJS requires
      VariableDeclarator: (path) => {
        if (
          t.isCallExpression(path.node.init) &&
          t.isIdentifier(path.node.init.callee) &&
          path.node.init.callee.name === "require"
        ) {
          const requireArg = path.node.init.arguments[0];
          if (t.isStringLiteral(requireArg)) {
            const importInfo: ImportInfo = {
              source: requireArg.value,
              importedNames: [],
            };

            if (t.isIdentifier(path.node.id)) {
              importInfo.defaultImport = path.node.id.name;
            } else if (t.isObjectPattern(path.node.id)) {
              importInfo.importedNames = this.extractObjectPatternNames(
                path.node.id
              );
            }

            analysis.imports.push(importInfo);
          }
        }

        // Store variable declarations
        if (t.isIdentifier(path.node.id)) {
          analysis.variables.set(path.node.id.name, path.node.init);
        }
      },

      // Handle function declarations
      FunctionDeclaration: (path) => {
        if (path.node.id) {
          analysis.functions.set(path.node.id.name, path.node);
        }
      },

      // Handle exports
      ExportDefaultDeclaration: (_path) => {
        analysis.exports.push("default");
      },

      ExportNamedDeclaration: (path) => {
        if (path.node.declaration) {
          if (
            t.isFunctionDeclaration(path.node.declaration) &&
            path.node.declaration.id
          ) {
            analysis.exports.push(path.node.declaration.id.name);
          } else if (t.isVariableDeclaration(path.node.declaration)) {
            path.node.declaration.declarations.forEach((decl) => {
              if (t.isIdentifier(decl.id)) {
                analysis.exports.push(decl.id.name);
              }
            });
          }
        }

        if (path.node.specifiers) {
          path.node.specifiers.forEach((spec) => {
            if (t.isExportSpecifier(spec) && t.isIdentifier(spec.exported)) {
              analysis.exports.push(spec.exported.name);
            }
          });
        }
      },

      // Handle route definitions and app.use() calls
      CallExpression: (path) => {
        // Check for app.use() route mounting
        const routeMount = this.extractRouteMountFromCallExpression(
          path,
          analysis
        );
        if (routeMount) {
          analysis.routeMounts.push(routeMount);
          return;
        }

        // Check for regular route definitions
        const route = this.extractRouteFromCallExpression(path, analysis);
        if (route) {
          analysis.routes.push(route);
          this.allRoutes.push(route);
        }
      },
    });
  }

  /**
   * Extract import information from ImportDeclaration
   */
  private extractImportInfo(node: t.ImportDeclaration): ImportInfo {
    const importInfo: ImportInfo = {
      source: node.source.value,
      importedNames: [],
    };

    node.specifiers.forEach((spec) => {
      if (t.isImportDefaultSpecifier(spec)) {
        importInfo.defaultImport = spec.local.name;
      } else if (t.isImportNamespaceSpecifier(spec)) {
        importInfo.namespaceImport = spec.local.name;
      } else if (t.isImportSpecifier(spec)) {
        importInfo.importedNames.push(spec.local.name);
      }
    });

    return importInfo;
  }

  /**
   * Extract names from object destructuring pattern
   */
  private extractObjectPatternNames(pattern: t.ObjectPattern): string[] {
    const names: string[] = [];

    pattern.properties.forEach((prop) => {
      if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
        names.push(prop.key.name);
      } else if (t.isRestElement(prop) && t.isIdentifier(prop.argument)) {
        names.push(prop.argument.name);
      }
    });

    return names;
  }

  /**
   * Resolve import path to absolute file path
   */
  private resolveImportPath(
    importSource: string,
    fromFile: string
  ): string | null {
    // Skip non-relative imports that don't point to local files
    if (!importSource.startsWith(".") && !importSource.startsWith("/")) {
      return null;
    }

    const fromDir = path.dirname(fromFile);
    let resolvedPath: string;

    if (importSource.startsWith(".")) {
      resolvedPath = path.resolve(fromDir, importSource);
    } else {
      resolvedPath = path.resolve(this.projectRoot, importSource.substring(1));
    }

    // Try different extensions
    const extensions = [".js", ".ts", ".mjs", ".jsx", ".tsx"];

    // First try exact path
    if (fs.existsSync(resolvedPath) && fs.statSync(resolvedPath).isFile()) {
      return resolvedPath;
    }

    // Try with extensions
    for (const ext of extensions) {
      const withExt = resolvedPath + ext;
      if (fs.existsSync(withExt)) {
        return withExt;
      }
    }

    // Try index files in directory
    if (
      fs.existsSync(resolvedPath) &&
      fs.statSync(resolvedPath).isDirectory()
    ) {
      for (const ext of extensions) {
        const indexFile = path.join(resolvedPath, "index" + ext);
        if (fs.existsSync(indexFile)) {
          return indexFile;
        }
      }
    }

    return null;
  }

  /**
   * Extract route mount information from app.use() CallExpression
   */
  private extractRouteMountFromCallExpression(
    path: any,
    analysis: FileAnalysis
  ): RouteMount | null {
    const { node } = path;

    if (!t.isCallExpression(node) || !t.isMemberExpression(node.callee)) {
      return null;
    }

    const property = node.callee.property;
    if (!t.isIdentifier(property) || property.name !== "use") {
      return null;
    }

    const args = node.arguments;
    if (args.length < 2) {
      return null;
    }

    // Extract prefix (first argument)
    const prefixArg = args[0];
    let prefix = "";

    if (t.isStringLiteral(prefixArg)) {
      prefix = prefixArg.value;
    } else {
      return null; // Not a route mount with string prefix
    }

    // Extract router reference (second argument)
    const routerArg = args[1];
    let routerName = "";

    if (t.isIdentifier(routerArg)) {
      routerName = routerArg.name;
    } else {
      return null; // Not a simple router reference
    }

    // Find the import/require for this router
    let routerFilePath: string | undefined | null;

    // Look for require() calls
    const routerVar = analysis.variables.get(routerName);
    if (
      routerVar &&
      t.isCallExpression(routerVar) &&
      t.isIdentifier(routerVar.callee) &&
      routerVar.callee.name === "require"
    ) {
      const requireArg = routerVar.arguments[0];
      if (t.isStringLiteral(requireArg)) {
        routerFilePath = this.resolveImportPath(
          requireArg.value,
          analysis.filePath
        );
      }
    }

    // Look for ES6 imports
    const importInfo = analysis.imports.find(
      (imp) =>
        imp.defaultImport === routerName ||
        imp.importedNames.includes(routerName)
    );
    if (importInfo) {
      routerFilePath = this.resolveImportPath(
        importInfo.source,
        analysis.filePath
      );
    }

    return {
      prefix,
      routerName,
      filePath: routerFilePath || undefined,
    };
  }

  /**
   * Extract route information from CallExpression
   */
  private extractRouteFromCallExpression(
    path: any,
    _analysis: FileAnalysis
  ): EndpointData | null {
    const { node } = path;

    if (!t.isCallExpression(node) || !t.isMemberExpression(node.callee)) {
      return null;
    }

    const property = node.callee.property;
    if (!t.isIdentifier(property)) {
      return null;
    }

    const method = property.name.toLowerCase();
    const httpMethods = [
      "get",
      "post",
      "put",
      "patch",
      "delete",
      "head",
      "options",
      "all",
    ];

    if (!httpMethods.includes(method)) {
      return null;
    }

    const args = node.arguments;
    if (args.length < 2) {
      return null;
    }

    // Extract URL
    const urlArg = args[0];
    let url = "";

    if (t.isStringLiteral(urlArg)) {
      url = urlArg.value;
    } else if (t.isTemplateLiteral(urlArg)) {
      url = this.templateLiteralToString(urlArg);
    }

    if (!url) {
      return null;
    }

    // Find handler function (last argument, skipping middleware)
    // The actual route handler is typically the last function argument
    let handlerFunction: t.Function | null = null;

    // Start from the last argument and work backwards to find the route handler
    for (let i = args.length - 1; i >= 1; i--) {
      const arg = args[i];

      if (t.isFunction(arg)) {
        // Found a function - this is likely the route handler
        handlerFunction = arg;
        break;
      } else if (t.isIdentifier(arg)) {
        // Look for function in current file first
        const foundFunction = _analysis.functions.get(arg.name);
        if (foundFunction) {
          handlerFunction = foundFunction;
          break;
        }

        // Check if this is an imported function (cross-file handler)
        const importedHandler = this.findImportedHandler(arg.name, _analysis);
        if (importedHandler) {
          handlerFunction = importedHandler;
          break;
        }

        // If it's an identifier but not a known function, it might be middleware
        // Continue looking for the actual handler
      }
      // Skip other types of arguments (middleware, etc.)
    }

    const route: EndpointData = {
      method: method.toUpperCase(),
      url,
      headers: [],
      requestDataType: "none",
      paramTypes: this.extractUrlParams(url),
      queryParamTypes: [],
      bodyParamTypes: [],
    };

    // Analyze handler if found
    if (handlerFunction) {
      this.analyzeRouteHandler(handlerFunction, route, path);
    }

    return route;
  }

  /**
   * Convert template literal to string
   */
  private templateLiteralToString(node: t.TemplateLiteral): string {
    let result = "";
    for (let i = 0; i < node.quasis.length; i++) {
      result += node.quasis[i].value.cooked || node.quasis[i].value.raw;
      if (i < node.expressions.length) {
        result += "${...}";
      }
    }
    return result;
  }

  /**
   * Extract URL parameters from route pattern
   */
  private extractUrlParams(url: string): ParamType[] {
    const params: ParamType[] = [];
    const paramRegex = /:([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    let match;

    while ((match = paramRegex.exec(url)) !== null) {
      params.push({
        name: match[1],
        type: "string",
        required: true,
      });
    }

    return params;
  }

  /**
   * Analyze route handler function
   */
  private analyzeRouteHandler(
    handler: t.Function,
    route: EndpointData,
    _handlerPath: any
  ): void {
    const params = handler.params;
    if (params.length === 0) return;

    const reqParam = params[0];

    try {
      // Simple traversal of handler body if it exists
      if (handler.body && t.isBlockStatement(handler.body)) {
        const tempAst = t.file(t.program(handler.body.body));

        traverse(tempAst, {
          MemberExpression: (path) => {
            this.analyzeMemberExpression(path, route, reqParam);
          },
          VariableDeclarator: (path) => {
            this.analyzeVariableDeclarator(path, route, reqParam);
          },
          CallExpression: (path) => {
            this.analyzeCallExpression(path, route, reqParam);
          },
        });
      }
    } catch (error) {
      // Silently continue - handler analysis is supplementary
    }

    // Determine request data type
    if (route.bodyParamTypes.length > 0) {
      route.requestDataType = "body";
    } else if (route.queryParamTypes.length > 0) {
      route.requestDataType = "query";
    } else if (route.paramTypes.length > 0) {
      route.requestDataType = "params";
    }
  }

  /**
   * Analyze member expression for request parameter access
   */
  private analyzeMemberExpression(
    path: any,
    route: EndpointData,
    reqParam: any
  ): void {
    const { node } = path;

    if (!t.isMemberExpression(node) || !this.isRequestAccess(node, reqParam)) {
      return;
    }

    const property = node.property;
    if (!t.isIdentifier(property)) return;

    switch (property.name) {
      case "body":
        this.analyzeBodyAccess(path, route);
        break;
      case "query":
        this.analyzeQueryAccess(path, route);
        break;
      case "params":
        this.analyzeParamsAccess(path, route);
        break;
      case "headers":
        this.analyzeHeadersAccess(path, route);
        break;
    }
  }

  /**
   * Check if member expression accesses request object
   */
  private isRequestAccess(node: t.MemberExpression, reqParam: any): boolean {
    if (!t.isIdentifier(node.object) || !t.isIdentifier(reqParam)) {
      return false;
    }
    return node.object.name === reqParam.name;
  }

  /**
   * Analyze body parameter access
   */
  private analyzeBodyAccess(path: any, route: EndpointData): void {
    const parent = path.parent;

    if (t.isMemberExpression(parent) && t.isIdentifier(parent.property)) {
      const fieldName = parent.property.name;

      if (!route.bodyParamTypes.some((p) => p.name === fieldName)) {
        route.bodyParamTypes.push({
          name: fieldName,
          type: this.inferType(path.parentPath),
          required: true,
        });
      }
    }
  }

  /**
   * Analyze query parameter access
   */
  private analyzeQueryAccess(path: any, route: EndpointData): void {
    const parent = path.parent;

    if (t.isMemberExpression(parent) && t.isIdentifier(parent.property)) {
      const fieldName = parent.property.name;

      if (!route.queryParamTypes.some((p) => p.name === fieldName)) {
        route.queryParamTypes.push({
          name: fieldName,
          type: this.inferType(path.parentPath),
          required: false,
        });
      }
    }
  }

  /**
   * Analyze URL parameter access
   */
  private analyzeParamsAccess(path: any, route: EndpointData): void {
    const parent = path.parent;

    if (t.isMemberExpression(parent) && t.isIdentifier(parent.property)) {
      const fieldName = parent.property.name;

      const existingParam = route.paramTypes.find((p) => p.name === fieldName);
      if (existingParam) {
        existingParam.type = this.inferType(path.parentPath);
      } else {
        route.paramTypes.push({
          name: fieldName,
          type: this.inferType(path.parentPath),
          required: true,
        });
      }
    }
  }

  /**
   * Analyze headers access
   */
  private analyzeHeadersAccess(path: any, route: EndpointData): void {
    const parent = path.parent;

    if (t.isMemberExpression(parent) && t.isIdentifier(parent.property)) {
      const headerName = parent.property.name;
      if (!route.headers.includes(headerName)) {
        route.headers.push(headerName);
      }
    } else if (t.isCallExpression(parent) && parent.arguments.length > 0) {
      const arg = parent.arguments[0];
      if (t.isStringLiteral(arg)) {
        const headerName = arg.value;
        if (!route.headers.includes(headerName)) {
          route.headers.push(headerName);
        }
      }
    }
  }

  /**
   * Analyze variable declarations for destructuring
   */
  private analyzeVariableDeclarator(
    path: any,
    route: EndpointData,
    reqParam: any
  ): void {
    const { node } = path;

    if (!node.init || !t.isMemberExpression(node.init)) return;

    if (this.isRequestAccess(node.init, reqParam)) {
      const property = node.init.property;

      if (t.isIdentifier(property)) {
        const requestType = property.name;

        if (t.isObjectPattern(node.id)) {
          const properties = node.id.properties;

          properties.forEach((prop: any) => {
            if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
              const fieldName = prop.key.name;
              const paramType = {
                name: fieldName,
                type: "string",
                required: true,
              };

              switch (requestType) {
                case "body":
                  if (!route.bodyParamTypes.some((p) => p.name === fieldName)) {
                    route.bodyParamTypes.push(paramType);
                  }
                  break;
                case "query":
                  if (
                    !route.queryParamTypes.some((p) => p.name === fieldName)
                  ) {
                    route.queryParamTypes.push({
                      ...paramType,
                      required: false,
                    });
                  }
                  break;
                case "params":
                  const existingParam = route.paramTypes.find(
                    (p) => p.name === fieldName
                  );
                  if (!existingParam) {
                    route.paramTypes.push(paramType);
                  }
                  break;
              }
            }
          });
        }
      }
    }
  }

  /**
   * Analyze function calls for type inference
   */
  private analyzeCallExpression(
    path: any,
    route: EndpointData,
    reqParam: any
  ): void {
    const { node } = path;

    if (!t.isCallExpression(node) || !t.isIdentifier(node.callee)) return;

    const funcName = node.callee.name;

    if (
      ["parseInt", "parseFloat", "Number"].includes(funcName) &&
      node.arguments.length > 0
    ) {
      const arg = node.arguments[0];

      if (t.isMemberExpression(arg)) {
        this.updateParameterType(arg, route, reqParam, "number");
      }
    }
  }

  /**
   * Update parameter type based on usage
   */
  private updateParameterType(
    memberExpr: any,
    route: EndpointData,
    reqParam: any,
    type: string
  ): void {
    if (!this.isRequestAccess(memberExpr, reqParam)) return;

    // Handle nested access like req.params.id
    if (
      t.isMemberExpression(memberExpr.object) &&
      t.isIdentifier(memberExpr.object.property) &&
      t.isIdentifier(memberExpr.property)
    ) {
      const parentProp = memberExpr.object.property.name;
      const fieldName = memberExpr.property.name;

      switch (parentProp) {
        case "params":
          const paramIndex = route.paramTypes.findIndex(
            (p) => p.name === fieldName
          );
          if (paramIndex >= 0) {
            route.paramTypes[paramIndex].type = type;
          }
          break;
        case "query":
          const queryIndex = route.queryParamTypes.findIndex(
            (p) => p.name === fieldName
          );
          if (queryIndex >= 0) {
            route.queryParamTypes[queryIndex].type = type;
          }
          break;
        case "body":
          const bodyIndex = route.bodyParamTypes.findIndex(
            (p) => p.name === fieldName
          );
          if (bodyIndex >= 0) {
            route.bodyParamTypes[bodyIndex].type = type;
          }
          break;
      }
    }
  }

  /**
   * Infer parameter type from usage context
   */
  private inferType(path: any): string {
    const parent = path.parent;

    if (t.isBinaryExpression(parent)) {
      const operator = parent.operator;
      if (["+", "-", "*", "/", "%"].includes(operator)) {
        return "number";
      }
    }

    if (t.isCallExpression(parent)) {
      const callee = parent.callee;
      if (t.isMemberExpression(callee) && t.isIdentifier(callee.property)) {
        const method = callee.property.name;
        if (["parseInt", "parseFloat", "Number"].includes(method)) {
          return "number";
        }
        if (["toString", "toLowerCase", "toUpperCase"].includes(method)) {
          return "string";
        }
      }
    }

    return "string";
  }

  /**
   * Resolve cross-file references and apply route prefixes
   */
  private async resolveCrossFileReferences(): Promise<void> {
    // First, ensure all imported controller files are analyzed
    await this.analyzeImportedControllerFiles();

    // Second pass: re-analyze routes to extract parameters from imported handlers
    await this.analyzeImportedHandlers();

    // Apply route prefixes from app.use() mounts
    for (const [_filePath, analysis] of this.analysisCache) {
      for (const routeMount of analysis.routeMounts) {
        if (routeMount.filePath) {
          const mountedFileAnalysis = this.analysisCache.get(
            routeMount.filePath
          );
          if (mountedFileAnalysis) {
            // Apply prefix to all routes in the mounted file
            for (const route of mountedFileAnalysis.routes) {
              const prefixedRoute: EndpointData = {
                ...route,
                url: this.combinePaths(routeMount.prefix, route.url),
              };

              // Add to main routes list if not already added
              const routeExists = this.allRoutes.some(
                (existingRoute) =>
                  existingRoute.method === prefixedRoute.method &&
                  existingRoute.url === prefixedRoute.url
              );

              if (!routeExists) {
                this.allRoutes.push(prefixedRoute);
                Logger.parsing(
                  `Applied prefix ${routeMount.prefix} to route: ${prefixedRoute.method} ${prefixedRoute.url}`
                );
              }
            }
          }
        }
      }
    }

    // Remove routes that are only base routes without prefixes (avoid duplicates)
    this.allRoutes = this.allRoutes.filter((route, index, array) => {
      // Keep routes that have prefixes or are not duplicated by prefixed versions
      const hasPrefix =
        route.url.startsWith("/api/") && route.url.split("/").length > 2;
      const hasPrefixedVersion = array.some(
        (otherRoute, otherIndex) =>
          otherIndex !== index &&
          otherRoute.method === route.method &&
          otherRoute.url.includes(route.url) &&
          otherRoute.url !== route.url
      );

      return hasPrefix || !hasPrefixedVersion;
    });
  }

  /**
   * Analyze all imported controller files that haven't been analyzed yet
   */
  private async analyzeImportedControllerFiles(): Promise<void> {
    const importedFiles = new Set<string>();

    // Collect all imported files from route files
    for (const [_filePath, analysis] of this.analysisCache) {
      for (const importInfo of analysis.imports) {
        // Skip non-relative imports (node_modules)
        if (!importInfo.source.startsWith(".")) {
          continue;
        }

        const importedFilePath = this.resolveImportPath(
          importInfo.source,
          analysis.filePath
        );
        if (importedFilePath && !this.analysisCache.has(importedFilePath)) {
          importedFiles.add(importedFilePath);
        }
      }
    }

    // Analyze all missing imported files
    const analysisPromises = Array.from(importedFiles).map((filePath) =>
      this.analyzeFileRecursively(filePath)
    );

    await Promise.all(analysisPromises);
  }

  /**
   * Re-analyze all routes to extract parameters from imported handlers
   */
  private async analyzeImportedHandlers(): Promise<void> {
    for (const route of this.allRoutes) {
      for (const [_filePath, analysis] of this.analysisCache) {
        const routeInAnalysis = analysis.routes.find(
          (r) => r.method === route.method && r.url === route.url
        );

        if (
          routeInAnalysis &&
          routeInAnalysis.bodyParamTypes.length === 0 &&
          routeInAnalysis.queryParamTypes.length === 0
        ) {
          await this.enrichRouteWithImportedHandler(routeInAnalysis, analysis);
        }
      }
    }
  }

  /**
   * Enrich a route with parameter information from imported handler
   */
  private async enrichRouteWithImportedHandler(
    route: EndpointData,
    analysis: FileAnalysis
  ): Promise<void> {
    traverse(analysis.ast, {
      CallExpression: (path) => {
        const extractedRoute = this.extractRouteFromCallExpression(
          path,
          analysis
        );
        if (
          extractedRoute &&
          extractedRoute.method === route.method &&
          extractedRoute.url === route.url
        ) {
          const { node } = path;
          const args = node.arguments;

          // Look for the handler argument (last function-like argument)
          for (let i = args.length - 1; i >= 1; i--) {
            const arg = args[i];

            if (t.isIdentifier(arg)) {
              const importedHandler = this.findImportedHandler(
                arg.name,
                analysis
              );
              if (importedHandler) {
                this.analyzeRouteHandler(importedHandler, route, path);
                return;
              }
            }
          }
        }
      },
    });
  }

  /**
   * Find an imported handler function in the imported file
   */
  private findImportedHandler(
    handlerName: string,
    analysis: FileAnalysis
  ): t.Function | null {
    // Find the import that brought in this handler
    const importInfo = analysis.imports.find(
      (imp) =>
        imp.importedNames.includes(handlerName) ||
        imp.defaultImport === handlerName
    );

    if (!importInfo) {
      return null;
    }

    // Resolve the imported file path
    const importedFilePath = this.resolveImportPath(
      importInfo.source,
      analysis.filePath
    );
    if (!importedFilePath) {
      return null;
    }

    // Get the analysis for the imported file
    const importedAnalysis = this.analysisCache.get(importedFilePath);
    if (!importedAnalysis) {
      return null;
    }

    // Look for the handler function in the imported file
    if (importInfo.importedNames.includes(handlerName)) {
      // Named import - look in exports
      return this.findExportedFunction(handlerName, importedAnalysis);
    } else if (importInfo.defaultImport === handlerName) {
      // Default import - look for default export
      return this.findDefaultExportFunction(importedAnalysis);
    }

    return null;
  }

  /**
   * Find an exported function by name
   */
  private findExportedFunction(
    functionName: string,
    analysis: FileAnalysis
  ): t.Function | null {
    let foundFunction: t.Function | null = null;

    traverse(analysis.ast, {
      AssignmentExpression: (path) => {
        const { node } = path;

        // Check for exports.functionName = function or module.exports.functionName = function
        if (
          t.isMemberExpression(node.left) &&
          t.isIdentifier(node.left.property) &&
          node.left.property.name === functionName
        ) {
          let isValidExport = false;

          // Check for exports.functionName
          if (
            t.isIdentifier(node.left.object) &&
            node.left.object.name === "exports"
          ) {
            isValidExport = true;
          }

          // Check for module.exports.functionName
          if (
            t.isMemberExpression(node.left.object) &&
            t.isIdentifier(node.left.object.object) &&
            node.left.object.object.name === "module" &&
            t.isIdentifier(node.left.object.property) &&
            node.left.object.property.name === "exports"
          ) {
            isValidExport = true;
          }

          if (isValidExport) {
            if (t.isFunction(node.right)) {
              foundFunction = node.right;
            } else if (t.isIdentifier(node.right)) {
              // exports.functionName = someFunction - look up the function
              foundFunction = analysis.functions.get(node.right.name) || null;
            }
          }
        }
      },
    });

    return foundFunction;
  }

  /**
   * Find the default export function
   */
  private findDefaultExportFunction(analysis: FileAnalysis): t.Function | null {
    let foundFunction: t.Function | null = null;

    traverse(analysis.ast, {
      AssignmentExpression: (path) => {
        const { node } = path;

        // Check for module.exports = function
        if (
          t.isMemberExpression(node.left) &&
          t.isMemberExpression(node.left.object) &&
          t.isIdentifier(node.left.object.object) &&
          node.left.object.object.name === "module" &&
          t.isIdentifier(node.left.object.property) &&
          node.left.object.property.name === "exports"
        ) {
          if (t.isFunction(node.right)) {
            foundFunction = node.right;
          } else if (t.isIdentifier(node.right)) {
            foundFunction = analysis.functions.get(node.right.name) || null;
          }
        }
      },
    });

    return foundFunction;
  }

  /**
   * Combine two URL paths properly (always use forward slashes for URLs)
   */
  private combinePaths(prefix: string, path: string): string {
    // Always use forward slashes for URL paths (even on Windows)
    // Remove trailing slash from prefix
    const cleanPrefix = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;

    // Remove leading slash from path if prefix doesn't end with one
    const cleanPath = path.startsWith("/") ? path : "/" + path;

    // Handle root path
    if (cleanPath === "/") {
      return cleanPrefix;
    }

    return cleanPrefix + cleanPath;
  }

  /**
   * Get all file paths that have been analyzed (for file watching)
   */
  public getAnalyzedFiles(): string[] {
    return Array.from(this.analysisCache.keys());
  }
}

/**
 * Main export function for robust route parsing
 */
export async function parseExpressRoutesRobust(
  projectRoot: string = process.cwd()
): Promise<EndpointData[]> {
  const parser = new RobustExpressParser(projectRoot);
  return await parser.parseProject();
}

/**
 * Parse routes and return both routes and analyzed files for watching
 */
export async function parseExpressRoutesRobustWithFiles(
  projectRoot: string = process.cwd()
): Promise<{ routes: EndpointData[]; analyzedFiles: string[] }> {
  const parser = new RobustExpressParser(projectRoot);
  const routes = await parser.parseProject();
  const analyzedFiles = parser.getAnalyzedFiles();
  return { routes, analyzedFiles };
}
