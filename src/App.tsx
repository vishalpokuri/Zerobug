import { useCallback } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./App.css";
import { CustomNode, type CustomNodeData } from "./CustomNode";
import { PostmanInterface } from "./PostmanInterface";

// Node types configuration
const nodeTypes = {
  customNode: CustomNode,
};

const initialNodes: Node[] = [
  {
    id: "1",
    position: { x: 0, y: 0 },
    data: {
      label: "Start Node",
      description: "Starting point of the flow",
      status: "active",
    } as CustomNodeData,
    type: "customNode",
  },
  {
    id: "2",
    position: { x: 0, y: 150 },
    data: {
      label: "Process Node",
      description: "Processing data",
      status: "pending",
      count: 42,
    } as CustomNodeData,
    type: "customNode",
  },
  // {
  //   id: "3",
  //   position: { x: 250, y: 150 },
  //   data: {
  //     label: "Decision Node",
  //     description: "Making decisions",
  //     status: "inactive",
  //     onClick: () => alert("Decision clicked!"),
  //   } as CustomNodeData,
  //   type: "customNode",
  // },
  // {
  //   id: "4",
  //   position: { x: 250, y: 300 },
  //   data: {
  //     label: "End Node",
  //     description: "Final destination",
  //     status: "active",
  //     count: 100,
  //   } as CustomNodeData,
  //   type: "customNode",
  // },
];

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2" },
  { id: "e2-3", source: "2", target: "3" },
  { id: "e3-4", source: "3", target: "4" },
];

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div className="h-screen w-screen bg-[#141414]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
      >
        <Controls />
        <MiniMap />
        <Background
          variant={BackgroundVariant.Cross}
          gap={64}
          size={0.7}
          color="#fff"
        />
      </ReactFlow>
    </div>
  );
}

export default App;
