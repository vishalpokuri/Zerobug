import { Handle, Position, type NodeProps, NodeResizer } from "@xyflow/react";

export interface BufferNodeData {
  label: string;
  path: string;
  childCount: number;
  level: number;
}

export function BufferNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as BufferNodeData;

  const getLevelColor = (level: number) => {
    const colors = [
      "border-[#4caf50]", // Level 0 (api) - Green
      "border-[#2196f3]", // Level 1 (auth, user, data) - Blue
      "border-[#ff9800]", // Level 2+ - Orange
    ];
    return colors[Math.min(level, colors.length - 1)] || "border-[#666]";
  };

  return (
    <div
      className={`bg-[#1a1a1a] border-2 ${getLevelColor(
        nodeData.level
      )} rounded-lg shadow-lg relative transition-all duration-300`}
      style={{
        width: "180px",
        height: "120px",
      }}
    >
      {/* Node Resizer - smaller for buffer nodes */}
      <NodeResizer
        isVisible={selected}
        minWidth={150}
        minHeight={100}
        handleStyle={{
          backgroundColor: "#F98866",
          border: "2px solid #fff",
          borderRadius: "3px",
          width: "6px",
          height: "6px",
        }}
        lineStyle={{
          borderColor: "#F98866",
          borderWidth: "1px",
        }}
      />

      {/* Bidirectional Handles */}

      {/* Right Side - Bidirectional */}
      {/* Just need source right, target left, cuz you aint editing them tho */}
      <Handle
        type="source"
        position={Position.Right}
        id="right-source"
        className="group relative"
        style={{
          right: -8,
          top: "50%",
          transform: "translateY(-50%)",
          width: "16px",
          height: "16px",
          backgroundColor: "transparent",
          border: "none",
          borderRadius: "50%",
          cursor: "crosshair",
        }}
      >
        <div className="w-2 h-2 bg-gray-400 border border-white rounded-full group-hover:bg-[#F98866] group-hover:scale-125 transition-all duration-200 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      </Handle>

      <Handle
        type="target"
        position={Position.Left}
        id="left-target"
        className="group relative"
        style={{
          left: -8,
          top: "50%",
          transform: "translateY(-50%)",
          width: "16px",
          height: "16px",
          backgroundColor: "transparent",
          border: "none",
          borderRadius: "50%",
          cursor: "crosshair",
        }}
      >
        <div className="w-2 h-2 bg-gray-400 border border-white rounded-full group-hover:bg-[#F98866] group-hover:scale-125 transition-all duration-200 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      </Handle>

      {/* Buffer Node Content */}
      <div className="h-full p-4 flex flex-col justify-center items-center text-center">
        {/* Path Icon */}
        <div className="mb-2">
          <div className="w-8 h-8 bg-[#333] rounded-full flex items-center justify-center">
            <span className="text-lg">📁</span>
          </div>
        </div>

        {/* Path Name */}
        <div className="mb-1">
          <h3 className="text-sm font-semibold text-white">
            /{nodeData.label}
          </h3>
        </div>

        {/* Child Count */}
        <div className="text-xs text-[#a0a0a0]">
          {nodeData.childCount} endpoint{nodeData.childCount !== 1 ? "s" : ""}
        </div>

        {/* Level indicator */}
        <div className="absolute top-1 right-1">
          <div
            className={`w-2 h-2 rounded-full ${
              nodeData.level === 0
                ? "bg-[#4caf50]"
                : nodeData.level === 1
                ? "bg-[#2196f3]"
                : "bg-[#ff9800]"
            }`}
          ></div>
        </div>
      </div>
    </div>
  );
}
