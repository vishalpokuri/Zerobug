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
import { CustomNode } from "./components/CustomNode";

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
      // THIS IS WHERE YOU PASS THE ENDPOINT DATA:
      endpointData: {
        method: "GET",
        url: "/user/existOrCreate/:publicKey",
        params: ["publicKey"],
        queryParams: [],
        bodyParams: [],
        headers: ["Authorization"],
        requestDataType: "params",
      },
    },
    type: "customNode",
    style: { width: 900, height: 500 },
  },
  {
    id: "2",
    position: { x: 250, y: 300 },
    data: {
      label: "Process Node",
      // DIFFERENT ENDPOINT DATA FOR DIFFERENT NODES:
      endpointData: {
        method: "POST",
        url: "/api/users",
        params: [],
        queryParams: [],
        bodyParams: ["name", "email", "password"],
        headers: ["Content-Type", "Authorization"],
        requestDataType: "body",
      },
    },
    type: "customNode",
    style: { width: 900, height: 500 },
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
