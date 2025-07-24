import { Handle, Position, type NodeProps, NodeResizer } from "@xyflow/react";
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
export function CustomNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as CustomNodeData;
  const [currentView, setCurrentView] = useState<"simple" | "detailed">(
    "simple"
  );

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

  const handleViewChange = useCallback((view: "simple" | "detailed") => {
    setCurrentView(view);
  }, []);

  return (
    <div
      className={`bg-gray-900 border-2 rounded-lg shadow-lg relative transition-all duration-300`}
      style={{
        width: currentView === "simple" ? "320px" : "900px",
        height: currentView === "simple" ? "220px" : "650px",
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

      {/* Bidirectional Handles - Top/Bottom for vertical flow */}
      {/* Bottom Handle - Source (outgoing connections) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom-source"
        className="group relative"
        style={{
          bottom: -12,
          left: "50%",
          transform: "translateX(-50%)",
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

      {/* Top Handle - Target (incoming connections) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top-target"
        className="group relative"
        style={{
          top: -12,
          left: "50%",
          transform: "translateX(-50%)",
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
