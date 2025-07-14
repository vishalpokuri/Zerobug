import { useCallback } from "react";
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

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="h-screen w-screen bg-[#141414] relative">
      {/* Top navigation bar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/50 backdrop-blur-sm border-b border-gray-700">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBackToDashboard}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Dashboard
            </button>
            <div className="h-4 w-px bg-gray-600" />
            <span className="text-white font-medium">
              Project {projectId === 'imported-project' ? '(Imported)' : projectId}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium rounded transition-colors">
              Save
            </button>
            <button className="px-3 py-1.5 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white text-sm font-medium rounded transition-colors">
              Export
            </button>
          </div>
        </div>
      </div>

      {/* ReactFlow Canvas */}
      <div className="pt-16 h-full">
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
            gap={64}
            size={0.7}
            color="#fff"
          />
        </ReactFlow>
      </div>
    </div>
  );
}