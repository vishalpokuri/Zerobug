import type { Node } from "@xyflow/react";

export const getNodeColor = (node: Node) => {
  switch (node.type) {
    case "customNode":
      const method = (node.data as any)?.endpointData?.method;
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
    default:
      return "#666"; // Default gray
  }
};
