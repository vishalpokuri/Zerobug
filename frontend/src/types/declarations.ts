export const Colors = {
  GET: "#4caf50",
  POST: "#ff6b35",
  PUT: "#2196f3",
  DELETE: "#f44336",
  PATCH: "#9c27b0",
  DEFAULT: "#607d8b",
};

export const requestDataTypes = {
  body: "body",
  query: "query",
  params: "params",
  none: "none",
};

export type activeTabType = "body" | "query" | "params";

export const ConnectionStatus = {
  DISCONNECTED: "disconnected",
  CONNECTING: "connecting",
  CONNECTED: "connected",
  ERROR: "error",
  INSTANCE_ALREADY_RUNNING: "instance_already_running",
  WAITING_FOR_CLI: "waiting_for_cli",
} as const;

export type ConnectionStatus =
  (typeof ConnectionStatus)[keyof typeof ConnectionStatus];
