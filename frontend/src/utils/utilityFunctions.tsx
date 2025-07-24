import type { Node } from "@xyflow/react";
import { ConnectionStatus } from "../types/declarations";

interface NodeData {
  endpointData?: {
    method?: string;
  };
}

export const getNodeColor = (node: Node) => {
  switch (node.type) {
    case "customNode": {
      const method = (node.data as NodeData)?.endpointData?.method;
      switch (method) {
        case "POST":
          return "#ff9800"; // Orange for POST
        case "GET":
          return "#4caf50"; // Green for GET
        case "PUT":
          return "#2196f3"; // Blue for PUT
        case "DELETE":
          return "#f44336"; // Red for DELETE
        case "PATCH":
          return "#9c27b0"; // Purple for PATCH
        default:
          return "#666"; // Gray for unknown
      }
    }
    default:
      return "#666"; // Default gray
  }
};

export const getStatusColorText = (status: ConnectionStatus) => {
  switch (status) {
    case ConnectionStatus.CONNECTED || "connected":
      return "text-green-400";
    case ConnectionStatus.CONNECTING || "connecting":
      return "text-yellow-400";
    case ConnectionStatus.WAITING_FOR_CLI || "waiting_for_cli":
      return "text-blue-400";
    case ConnectionStatus.ERROR || "error":
      return "text-red-400";
    case ConnectionStatus.INSTANCE_ALREADY_RUNNING || "instance_already_running":
      return "text-orange-400";
    default:
      return "text-gray-400";
  }
};
export const getStatusColorBG = (status: ConnectionStatus) => {
  switch (status) {
    case ConnectionStatus.CONNECTED || "connected":
      return "bg-green-400";
    case ConnectionStatus.CONNECTING || "connecting":
      return "bg-yellow-400";
    case ConnectionStatus.ERROR || "error":
      return "bg-red-400";
    case ConnectionStatus.INSTANCE_ALREADY_RUNNING || "instance_already_running":
      return "bg-orange-400";
    case ConnectionStatus.WAITING_FOR_CLI || "waiting_for_cli":
      return "bg-blue-400";
    default:
      return "bg-gray-400";
  }
};

export const getStatusIcon = (status: ConnectionStatus) => {
  switch (status) {
    case ConnectionStatus.CONNECTED:
      return (
        <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse" />
      );
    case ConnectionStatus.CONNECTING:
      return (
        <div className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
      );
    case ConnectionStatus.WAITING_FOR_CLI:
      return (
        <div className="w-4 h-4 bg-blue-400 rounded-full animate-pulse" />
      );
    case ConnectionStatus.ERROR:
      return <div className="w-4 h-4 bg-red-400 rounded-full" />;
    case ConnectionStatus.INSTANCE_ALREADY_RUNNING:
      return <div className="w-4 h-4 bg-orange-400 rounded-full animate-pulse" />;
    default:
      return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
  }
};

export const getStatusText = (status: ConnectionStatus) => {
  switch (status) {
    case ConnectionStatus.CONNECTED:
      return "Connected to CLI Application";
    case ConnectionStatus.CONNECTING:
      return "Connecting to CLI Application...";
    case ConnectionStatus.ERROR:
      return "Failed to connect to CLI Application";
    case ConnectionStatus.INSTANCE_ALREADY_RUNNING:
      return "CLI Instance Already Running";
    case ConnectionStatus.WAITING_FOR_CLI:
      return "Waiting for CLI to Connect...";
    default:
      return "Disconnected from CLI Application";
  }
};
