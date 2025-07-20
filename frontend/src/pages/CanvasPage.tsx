import { useCallback, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type OnConnect,
  type Node,
  type Edge,
  BackgroundVariant,
  SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CustomNode } from "../components/CustomNode";
import { BufferNode } from "../components/BufferNode";

import { CLIConnectionModal } from "../components/modals/CLIConnectionModal";
import { ConnectionStatusIndicator } from "../components/ConnectionStatusIndicator";
import { WebSocketProvider } from "../contexts/WebSocketContext";
import { ArrowLeftIcon } from "../Svg/Icons";
import {
  mockEndpoints,
  parseEndpointsToTree,
  treeToFlowNodes,
} from "../utils/endpointParser";
import { getNodeColor } from "../utils/utilityFunctions";

// Node types configuration
const nodeTypes = {
  customNode: CustomNode,
  bufferNode: BufferNode,
};

// Generate nodes and edges from parsed endpoints
const endpointTree = parseEndpointsToTree(mockEndpoints);
const { nodes: generatedNodes, edges: generatedEdges } =
  treeToFlowNodes(endpointTree);

const initialNodes: Node[] = generatedNodes;
const initialEdges: Edge[] = generatedEdges;

export function CanvasPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [showCLIModal, setShowCLIModal] = useState(false);

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <WebSocketProvider projectId={projectId || "your-project"}>
      <div className="h-screen w-screen bg-[#141414] relative">
        {/* Top navigation bar */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black h-[40px] border-b border-gray-700">
          <div className="flex h-full items-center justify-between px-4 text-xs">
            <div className="flex items-center gap-4 font-rr">
              <button
                onClick={handleBackToDashboard}
                className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeftIcon className="w-3 h-3" />
                Dashboard
              </button>
              <div className="h-4 w-px bg-gray-600" />
              <span className="text-white font-medium">
                Project{" "}
                {projectId === "imported-project" ? "(Imported)" : projectId}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <ConnectionStatusIndicator
                onClick={() => setShowCLIModal(true)}
              />
              <button className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs font-medium rounded transition-colors ">
                Save
              </button>
            </div>
          </div>
        </div>

        {/* ReactFlow Canvas */}
        <div className=" h-full">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            panOnScroll
            selectionMode={SelectionMode.Partial}
            connectionRadius={25}
            connectionLineStyle={{
              stroke: "#F98866",
              strokeWidth: 2,
              strokeDasharray: "5,5",
            }}
          >
            <Controls />
            <MiniMap
              bgColor="#333"
              pannable
              draggable
              maskColor="#14141499"
              nodeColor={getNodeColor}
            />
            <Background
              variant={BackgroundVariant.Cross}
              bgColor="#080808"
              gap={64}
              size={0.7}
              color="#fff"
            />
          </ReactFlow>
        </div>

        {/* CLI Connection Modal */}
        <CLIConnectionModal
          isOpen={showCLIModal}
          onClose={() => setShowCLIModal(false)}
          projectId={projectId}
        />
      </div>
    </WebSocketProvider>
  );
}
