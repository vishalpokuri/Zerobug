import {
  Handle,
  Position,
  type NodeProps,
  NodeResizer,
  useReactFlow,
} from "@xyflow/react";
import { useState, useCallback } from "react";
import { PostmanInterface } from "./PostmanInterface";
import { SimpleNodeView } from "./SimpleNodeView";
import { UISwitcher } from "./UISwitcher";

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
    headers: string[];
    requestDataType: "params" | "query" | "body" | "none";
    paramTypes: { name: string; type: string; required?: boolean }[];
    queryParamTypes: { name: string; type: string; required?: boolean }[];
    bodyParamTypes: { name: string; type: string; required?: boolean }[];
  };
}

// Custom Node Component
export function CustomNode({ data, selected, id }: NodeProps) {
  const nodeData = data as unknown as CustomNodeData;
  const [currentView, setCurrentView] = useState<"simple" | "detailed">(
    "simple"
  );
  const { setNodes } = useReactFlow();

  // Default endpoint data for demonstration
  const defaultEndpointData = {
    method: "GET",
    url: "/user/existOrCreate/:publicKey",
    headers: ["Authorization"],
    requestDataType: "params" as const,
    paramTypes: [{ name: "publicKey", type: "string", required: true }],
    queryParamTypes: [],
    bodyParamTypes: [],
  };

  const handleViewChange = useCallback(
    (view: "simple" | "detailed") => {
      setCurrentView(view);
      // Update node dimensions when switching views
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id === id) {
            const newDimensions =
              view === "simple"
                ? { width: 320, height: 220 }
                : { width: 650, height: 450 };
            return {
              ...node,
              style: {
                ...node.style,
                width: newDimensions.width,
                height: newDimensions.height,
              },
            };
          }
          return node;
        })
      );
    },
    [id, setNodes]
  );

  return (
    <div
      className={`bg-gray-900 border-2 rounded-lg shadow-lg relative transition-all duration-300`}
      style={{
        minWidth: currentView === "simple" ? "320px" : "650px",
        minHeight: currentView === "simple" ? "220px" : "450px",
        width: currentView === "simple" ? "320px" : "100%",
        height: currentView === "simple" ? "220px" : "100%",
      }}
    >
      {/* UI Switcher */}
      <UISwitcher currentView={currentView} onViewChange={handleViewChange} />

      {/* Node Resizer - Only show in detailed view */}
      {currentView === "detailed" && (
        <NodeResizer
          isVisible={selected}
          minWidth={650}
          minHeight={450}
          handleStyle={{
            backgroundColor: "#F98866",
            border: "2px solid #fff",
            borderRadius: "3px",
            width: "8px",
            height: "8px",
          }}
          lineStyle={{
            borderColor: "#F98866",
            borderWidth: "2px",
          }}
        />
      )}

      {/* Bidirectional Handles - Each position has both source and target overlapped */}
      {/* Just need source right, target left, cuz you aint editing them tho */}
      {/* Right Side - Bidirectional */}
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="group relative"
        style={{
          right: -12,
          top: "50%",
          transform: "translateY(-50%)",
          width: "24px",
          height: "24px",
          backgroundColor: "transparent",
          border: "none",
          borderRadius: "50%",
          cursor: "crosshair",
        }}
      >
        <div className="w-3 h-3 bg-gray-400 border-2 border-white rounded-full group-hover:bg-[#F98866] group-hover:border-[#F98866] group-hover:scale-125 transition-all duration-200 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      </Handle>

      {/* Left Side - Bidirectional */}

      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="group relative"
        style={{
          left: -12,
          top: "50%",
          transform: "translateY(-50%)",
          width: "24px",
          height: "24px",
          backgroundColor: "transparent",
          border: "none",
          borderRadius: "50%",
          cursor: "crosshair",
        }}
      >
        <div className="w-3 h-3 bg-gray-400 border-2 border-white rounded-full group-hover:bg-[#F98866] group-hover:border-[#F98866] group-hover:scale-125 transition-all duration-200 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      </Handle>

      {/* Dynamic Content */}
      <div className="w-full h-full rounded-lg overflow-hidden">
        {currentView === "simple" ? (
          <SimpleNodeView
            endpointData={nodeData.endpointData || defaultEndpointData}
          />
        ) : (
          <PostmanInterface
            endpointData={nodeData.endpointData || defaultEndpointData}
          />
        )}
      </div>
    </div>
  );
}
