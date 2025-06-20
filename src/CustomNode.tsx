import { Handle, Position, type NodeProps } from "@xyflow/react";
import { PostmanInterface } from "./PostmanInterface";

// Define custom node data interface
export interface CustomNodeData {
  label: string;
  description?: string;
  status?: "active" | "inactive" | "pending";
  count?: number;
  onClick?: () => void;
}

// Custom Node Component
export function CustomNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as CustomNodeData;
  return (
    <div
      className={`bg-gray-900 border-2 rounded-lg shadow-lg ${
        selected ? "border-blue-500" : "border-gray-700"
      }`}
      style={{ width: '800px', height: '600px' }}
    >
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
        <PostmanInterface />
      </div>
    </div>
  );
}
