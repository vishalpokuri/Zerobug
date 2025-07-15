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

export const getStatusColor = (status: ConnectionStatus) => {
  switch (status) {
    case ConnectionStatus.CONNECTED:
      return "text-green-400";
    case ConnectionStatus.CONNECTING:
      return "text-yellow-400";
    case ConnectionStatus.ERROR:
      return "text-red-400";
    default:
      return "text-gray-400";
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
    case ConnectionStatus.ERROR:
      return <div className="w-4 h-4 bg-red-400 rounded-full" />;
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
    default:
      return "Disconnected from CLI Application";
  }
};
