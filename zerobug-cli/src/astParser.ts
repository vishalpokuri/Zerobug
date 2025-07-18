import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import fs from "fs";

interface ParamType {
  name: string;
  type: string;
  required?: boolean;
}

interface EndpointData {
  method: string;
  url: string;
  headers: string[];
  requestDataType: "params" | "query" | "body" | "none";
  paramTypes: ParamType[];
  queryParamTypes: ParamType[];
  bodyParamTypes: ParamType[];
}

class ExpressRouteParser {
  private routes: EndpointData[] = [];

  parse(code: string): EndpointData[] {
    this.routes = [];

    try {
      const ast = parse(code, {
        sourceType: "module",
        plugins: ["typescript", "jsx", "decorators-legacy"],
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
        strictMode: false,
      });

      traverse(ast, {
        CallExpression: (path) => {
          this.handleCallExpression(path);
        },
      });

      return this.routes;
    } catch (error) {
      console.error("AST parsing error:", error);
      return [];
    }
  }

  private handleCallExpression(path: any) {
    const { node } = path;

    // Check if it's a route method call (app.get, router.post, etc.)
    if (this.isRouteCall(node)) {
      const routeInfo = this.extractRouteInfo(node, path);
      if (routeInfo) {
        this.routes.push(routeInfo);
      }
    }
  }

  private isRouteCall(node: t.CallExpression): boolean {
    if (!t.isMemberExpression(node.callee)) return false;

    const methods = [
      "get",
      "post",
      "put",
      "patch",
      "delete",
      "head",
      "options",
      "all",
    ];
    const property = node.callee.property;

    if (t.isIdentifier(property)) {
      return methods.includes(property.name);
    }

    return false;
  }

  private extractRouteInfo(
    node: t.CallExpression,
    path: any
  ): EndpointData | null {
    if (
      !t.isMemberExpression(node.callee) ||
      !t.isIdentifier(node.callee.property)
    ) {
      return null;
    }

    const method = node.callee.property.name.toUpperCase();
    const args = node.arguments;

    if (args.length < 2) return null;

    // Extract URL (first argument)
    const urlArg = args[0];
    let url = "";

    if (t.isStringLiteral(urlArg)) {
      url = urlArg.value;
    } else if (t.isTemplateLiteral(urlArg)) {
      url = this.templateLiteralToString(urlArg);
    }

    // Find the handler function (usually the last argument)
    const handlerArg = args[args.length - 1];
    let handler: t.Function | null = null;
    let handlerPath: any = null;

    if (t.isFunction(handlerArg)) {
      handler = handlerArg;
      // Get the path for the handler function
      handlerPath = path.get(`arguments.${args.length - 1}`);
    } else if (t.isIdentifier(handlerArg)) {
      // Try to find the function definition
      const result = this.findFunctionDefinition(handlerArg.name, path);
      if (result) {
        handler = result.handler;
        handlerPath = result.path;
      }
    }

    const endpointData: EndpointData = {
      method,
      url,
      headers: [],
      requestDataType: "none",
      paramTypes: [],
      queryParamTypes: [],
      bodyParamTypes: [],
    };

    if (handler && handlerPath) {
      this.analyzeHandler(handler, endpointData, url, handlerPath);
    }

    return endpointData;
  }

  private templateLiteralToString(node: t.TemplateLiteral): string {
    let result = "";
    for (let i = 0; i < node.quasis.length; i++) {
      result += node.quasis[i].value.cooked || node.quasis[i].value.raw;
      if (i < node.expressions.length) {
        result += "${...}"; // Placeholder for expressions
      }
    }
    return result;
  }

  private findFunctionDefinition(
    name: string,
    path: any
  ): { handler: t.Function; path: any } | null {
    let foundFunction: t.Function | null = null;
    let foundPath: any = null;

    try {
      // Traverse up to find the function definition in the same scope
      const programPath =
        path.getFunctionParent() || path.scope.getProgramParent();

      programPath.traverse({
        FunctionDeclaration: (funcPath: any) => {
          if (funcPath.node.id && funcPath.node.id.name === name) {
            foundFunction = funcPath.node;
            foundPath = funcPath;
          }
        },
        VariableDeclarator: (varPath: any) => {
          if (
            t.isIdentifier(varPath.node.id) &&
            varPath.node.id.name === name
          ) {
            if (t.isFunction(varPath.node.init)) {
              foundFunction = varPath.node.init;
              foundPath = varPath.get("init");
            }
          }
        },
      });
    } catch (error) {
      console.warn("Error finding function definition:", error);
      return null;
    }

    return foundFunction && foundPath
      ? { handler: foundFunction, path: foundPath }
      : null;
  }

  private analyzeHandler(
    handler: t.Function,
    endpointData: EndpointData,
    url: string,
    handlerPath: any
  ) {
    const params = handler.params;

    // Extract URL parameters from route pattern
    endpointData.paramTypes = this.extractUrlParams(url);

    // Analyze function parameters (req, res, next)
    if (params.length > 0) {
      const reqParam = params[0];

      // Traverse the handler function body to find usage patterns
      // Use the handlerPath to traverse with proper scope and parentPath
      try {
        handlerPath.traverse({
          MemberExpression: (path: any) => {
            this.analyzeMemberExpression(path, endpointData, reqParam);
          },
          VariableDeclarator: (path: any) => {
            this.analyzeVariableDeclarator(path, endpointData, reqParam);
          },
          CallExpression: (path: any) => {
            this.analyzeCallExpression(path, endpointData, reqParam);
          },
        });
      } catch (error) {
        console.warn("Error traversing handler function:", error);
        // Continue without detailed analysis
      }
    }

    // Determine primary request data type
    if (endpointData.bodyParamTypes.length > 0) {
      endpointData.requestDataType = "body";
    } else if (endpointData.queryParamTypes.length > 0) {
      endpointData.requestDataType = "query";
    } else if (endpointData.paramTypes.length > 0) {
      endpointData.requestDataType = "params";
    }
  }

  private extractUrlParams(url: string): ParamType[] {
    const paramTypes: ParamType[] = [];
    const paramRegex = /:([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    let match;

    while ((match = paramRegex.exec(url)) !== null) {
      paramTypes.push({
        name: match[1],
        type: "string",
        required: true,
      });
    }

    return paramTypes;
  }

  private analyzeMemberExpression(
    path: any,
    endpointData: EndpointData,
    reqParam: any
  ) {
    const { node } = path;

    if (!t.isMemberExpression(node)) return;

    // Check if it's accessing req.something
    if (this.isRequestAccess(node, reqParam)) {
      const property = node.property;

      if (t.isIdentifier(property)) {
        switch (property.name) {
          case "body":
            this.analyzeBodyAccess(path, endpointData);
            break;
          case "query":
            this.analyzeQueryAccess(path, endpointData);
            break;
          case "params":
            this.analyzeParamsAccess(path, endpointData);
            break;
          case "headers":
            this.analyzeHeadersAccess(path, endpointData);
            break;
        }
      }
    }
  }

  private isRequestAccess(node: t.MemberExpression, reqParam: any): boolean {
    if (!t.isIdentifier(node.object)) return false;
    if (!t.isIdentifier(reqParam)) return false;

    return node.object.name === reqParam.name;
  }

  private analyzeBodyAccess(path: any, endpointData: EndpointData) {
    const parent = path.parent;

    if (t.isMemberExpression(parent) && t.isIdentifier(parent.property)) {
      const fieldName = parent.property.name;

      if (!endpointData.bodyParamTypes.some((p) => p.name === fieldName)) {
        endpointData.bodyParamTypes.push({
          name: fieldName,
          type: this.inferType(path.parentPath),
          required: true,
        });
      }
    }
  }

  private analyzeHeadersAccess(path: any, endpointData: EndpointData) {
    const parent = path.parent;

    if (t.isMemberExpression(parent) && t.isIdentifier(parent.property)) {
      const headerName = parent.property.name;

      if (!endpointData.headers.includes(headerName)) {
        endpointData.headers.push(headerName);
      }
    } else if (t.isCallExpression(parent) && parent.arguments.length > 0) {
      // Handle req.headers.get('header-name') or req.headers['header-name']
      const arg = parent.arguments[0];
      if (t.isStringLiteral(arg)) {
        const headerName = arg.value;
        if (!endpointData.headers.includes(headerName)) {
          endpointData.headers.push(headerName);
        }
      }
    }
  }

  private analyzeQueryAccess(path: any, endpointData: EndpointData) {
    const parent = path.parent;

    if (t.isMemberExpression(parent) && t.isIdentifier(parent.property)) {
      const fieldName = parent.property.name;

      if (!endpointData.queryParamTypes.some((p) => p.name === fieldName)) {
        endpointData.queryParamTypes.push({
          name: fieldName,
          type: this.inferType(path.parentPath),
          required: false,
        });
      }
    }
  }

  private analyzeParamsAccess(path: any, endpointData: EndpointData) {
    const parent = path.parent;

    if (t.isMemberExpression(parent) && t.isIdentifier(parent.property)) {
      const fieldName = parent.property.name;

      // Update existing param type if found, otherwise add new
      const existingParam = endpointData.paramTypes.find(
        (p) => p.name === fieldName
      );
      if (existingParam) {
        existingParam.type = this.inferType(path.parentPath);
      } else {
        endpointData.paramTypes.push({
          name: fieldName,
          type: this.inferType(path.parentPath),
          required: true,
        });
      }
    }
  }

  private analyzeVariableDeclarator(
    path: any,
    endpointData: EndpointData,
    reqParam: any
  ) {
    const { node } = path;

    if (!node.init || !t.isMemberExpression(node.init)) return;

    // Check if it's destructuring from req.body, req.query, or req.params
    if (this.isRequestAccess(node.init, reqParam)) {
      const property = node.init.property;

      if (t.isIdentifier(property)) {
        const requestType = property.name;

        // Handle destructuring patterns
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
                  if (
                    !endpointData.bodyParamTypes.some(
                      (p) => p.name === fieldName
                    )
                  ) {
                    endpointData.bodyParamTypes.push(paramType);
                  }
                  break;
                case "query":
                  if (
                    !endpointData.queryParamTypes.some(
                      (p) => p.name === fieldName
                    )
                  ) {
                    endpointData.queryParamTypes.push({
                      ...paramType,
                      required: false,
                    });
                  }
                  break;
                case "params":
                  const existingParam = endpointData.paramTypes.find(
                    (p) => p.name === fieldName
                  );
                  if (!existingParam) {
                    endpointData.paramTypes.push(paramType);
                  }
                  break;
              }
            }
          });
        } else if (t.isIdentifier(node.id)) {
          // Handle simple assignment like: const body = req.body
          const varName = node.id.name;

          switch (requestType) {
            case "body":
              if (
                !endpointData.bodyParamTypes.some((p) => p.name === varName)
              ) {
                endpointData.bodyParamTypes.push({
                  name: varName,
                  type: "object",
                  required: true,
                });
              }
              break;
            case "query":
              if (
                !endpointData.queryParamTypes.some((p) => p.name === varName)
              ) {
                endpointData.queryParamTypes.push({
                  name: varName,
                  type: "object",
                  required: false,
                });
              }
              break;
            case "params":
              const existingParam = endpointData.paramTypes.find(
                (p) => p.name === varName
              );
              if (!existingParam) {
                endpointData.paramTypes.push({
                  name: varName,
                  type: "object",
                  required: true,
                });
              }
              break;
          }
        }
      }
    }
  }

  private inferType(path: any): string {
    const parent = path.parent;

    // Check for type annotations
    if (path.node.typeAnnotation) {
      return this.typeAnnotationToString(path.node.typeAnnotation);
    }

    // Infer from usage context
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

    return "string"; // default type
  }

  private analyzeCallExpression(
    path: any,
    endpointData: EndpointData,
    reqParam: any
  ) {
    const { node } = path;

    if (!t.isCallExpression(node)) return;

    // Check for parseInt, parseFloat calls on request parameters
    if (t.isIdentifier(node.callee)) {
      const funcName = node.callee.name;

      if (
        ["parseInt", "parseFloat", "Number"].includes(funcName) &&
        node.arguments.length > 0
      ) {
        const arg = node.arguments[0];

        // Check if it's accessing a request parameter
        if (t.isMemberExpression(arg)) {
          this.updateParameterType(arg, endpointData, reqParam, "number");
        }
      }
    }
  }

  private updateParameterType(
    memberExpr: any,
    endpointData: EndpointData,
    reqParam: any,
    type: string
  ) {
    if (!this.isRequestAccess(memberExpr, reqParam)) return;

    const property = memberExpr.property;
    if (!t.isIdentifier(property)) return;

    const requestType = property.name;

    // Check if it's a nested access like req.params.id
    if (
      t.isMemberExpression(memberExpr.object) &&
      t.isIdentifier(memberExpr.object.property)
    ) {
      const parentProp = memberExpr.object.property.name;
      const fieldName = property.name;

      switch (parentProp) {
        case "params":
          const paramIndex = endpointData.paramTypes.findIndex(
            (p) => p.name === fieldName
          );
          if (paramIndex >= 0) {
            endpointData.paramTypes[paramIndex].type = type;
          }
          break;
        case "query":
          const queryIndex = endpointData.queryParamTypes.findIndex(
            (p) => p.name === fieldName
          );
          if (queryIndex >= 0) {
            endpointData.queryParamTypes[queryIndex].type = type;
          }
          break;
        case "body":
          const bodyIndex = endpointData.bodyParamTypes.findIndex(
            (p) => p.name === fieldName
          );
          if (bodyIndex >= 0) {
            endpointData.bodyParamTypes[bodyIndex].type = type;
          }
          break;
      }
    }
  }
  private typeAnnotationToString(typeAnnotation: any): string {
    if (t.isTSTypeAnnotation(typeAnnotation)) {
      const tsType = typeAnnotation.typeAnnotation;

      if (t.isTSStringKeyword(tsType)) return "string";
      if (t.isTSNumberKeyword(tsType)) return "number";
      if (t.isTSBooleanKeyword(tsType)) return "boolean";
      if (t.isTSArrayType(tsType)) return "array";
      if (t.isTSObjectKeyword(tsType)) return "object";
    }

    return "any";
  }
}

// Usage example
export function parseExpressRoutes(code: string): EndpointData[] {
  const parser = new ExpressRouteParser();
  return parser.parse(code);
}

const backendCode = fs.readFileSync(
  "/home/viscanum853/zerobug-cli/sampleBackend.js",
  "utf-8"
);

const routes = parseExpressRoutes(backendCode);
console.log(JSON.stringify(routes, null, 2));
