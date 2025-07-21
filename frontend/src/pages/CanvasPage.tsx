import { useCallback, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type OnConnect,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  BackgroundVariant,
  SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { CustomNode } from "../components/CustomNode";
import { BufferNode } from "../components/BufferNode";

import { CLIConnectionModal } from "../components/modals/CLIConnectionModal";
import { ConnectionStatusIndicator } from "../components/ConnectionStatusIndicator";
import {
  WebSocketProvider,
  useWebSocketContext,
} from "../contexts/WebSocketContext";
import { ArrowLeftIcon } from "../Svg/Icons";
import {
  parseEndpointsToTree,
  treeToFlowNodes,
  type ParsedEndpoint,
} from "../utils/endpointParser";
import { getNodeColor } from "../utils/utilityFunctions";

// Node types configuration
const nodeTypes = {
  customNode: CustomNode,
  bufferNode: BufferNode,
};

function Canvas() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) =>
      setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) =>
      setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );
  const [showCLIModal, setShowCLIModal] = useState(true);
  const { lastMessage, isConnected } = useWebSocketContext();
  const [endpoints, setEndpoints] = useState<ParsedEndpoint[]>([]);

  useEffect(() => {
    const fetchProject = async () => {
      if (projectId && !isConnected) {
        try {
          const response = await fetch(
            `http://localhost:3001/api/project/${projectId}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.project && data.project.endpoints) {
              setEndpoints(data.project.endpoints);
            }
          }
        } catch (error) {
          console.error("Failed to fetch project", error);
        }
      }
    };

    fetchProject();
  }, [projectId, isConnected]);

  useEffect(() => {
    if (lastMessage) {
      const newEndpoints = JSON.parse(lastMessage);
      setEndpoints(newEndpoints);
    }
  }, [lastMessage]);

  useEffect(() => {
    if (endpoints.length > 0) {
      const endpointTree = parseEndpointsToTree(endpoints);
      const { nodes: generatedNodes, edges: generatedEdges } =
        treeToFlowNodes(endpointTree);
      setNodes(generatedNodes);
      setEdges(generatedEdges);
    }
  }, [endpoints, setNodes, setEdges]);

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleSave = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/project/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId, endpoints }),
      });

      if (response.ok) {
        toast.success("Project saved successfully!");
      } else {
        toast.error("Failed to save project.");
      }
    } catch (error) {
      toast.error("An error occurred while saving the project.");
    }
  };

  const handleBackToDashboard = async () => {
    await handleSave();
    navigate("/dashboard");
  };

  return (
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
            <ConnectionStatusIndicator onClick={() => setShowCLIModal(true)} />
            <button
              onClick={handleSave}
              className="px-3 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs font-medium rounded transition-colors "
            >
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
            bgColor="#040404"
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
  );
}

export function CanvasPage() {
  const { projectId } = useParams();
  return (
    <WebSocketProvider projectId={projectId || "your-project"}>
      <Canvas />
    </WebSocketProvider>
  );
}
