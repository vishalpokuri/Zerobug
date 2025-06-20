import { Handle, Position, type NodeProps, NodeResizer } from "@xyflow/react";
import { PostmanInterface } from "./PostmanInterface";

// Define custom node data interface
export interface CustomNodeData {
  label: string;
  description?: string;
  status?: "active" | "inactive" | "pending";
  count?: number;
  onClick?: () => void;
  endpointData?: {
    method: string;
    url: string;
    params: string[];
    queryParams: string[];
    bodyParams: string[];
    headers: string[];
    requestDataType: "params" | "query" | "body" | "none";
  };
}

// Custom Node Component
export function CustomNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as CustomNodeData;

  // Default endpoint data for demonstration
  const defaultEndpointData = {
    method: "GET",
    url: "/user/existOrCreate/:publicKey",
    params: ["publicKey"],
    queryParams: [],
    bodyParams: [],
    headers: ["Authorization"],
    requestDataType: "params" as const,
  };

  return (
    <div
      className={`bg-gray-900 border-2 rounded-lg shadow-lg relative ${
        selected ? "border-blue-500" : "border-gray-700"
      }`}
      style={{ width: "100%", height: "100%" }}
    >
      {/* Node Resizer */}
      <NodeResizer
        isVisible={selected}
        minWidth={600}
        minHeight={400}
        handleStyle={{
          backgroundColor: '#ff6b35',
          border: '2px solid #fff',
          borderRadius: '3px',
          width: '8px',
          height: '8px',
        }}
        lineStyle={{
          borderColor: '#ff6b35',
          borderWidth: '2px',
        }}
      />

      {/* Handles */}
      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-gray-400"
      />
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-gray-400"
      />
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-gray-400"
      />
      <Handle
        type="target"
        position={Position.Bottom}
        className="w-3 h-3 bg-gray-400"
      />

      {/* Postman Interface */}
      <div className="w-full h-full rounded-lg overflow-hidden">
        <PostmanInterface
          endpointData={nodeData.endpointData || defaultEndpointData}
        />
      </div>
    </div>
  );
}
