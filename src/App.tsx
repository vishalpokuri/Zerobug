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
  SelectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./App.css";
import { CustomNode } from "./components/CustomNode";
import { BufferNode } from "./components/BufferNode";
import {
  mockEndpoints,
  parseEndpointsToTree,
  treeToFlowNodes,
} from "./utils/endpointParser";

import { getNodeColor } from "./utils/utilityFunctions";

// Node types configuration
const nodeTypes = {
  customNode: CustomNode,
  bufferNode: BufferNode,
};

// Generate nodes and edges from parsed endpoints (TODO: learn how these work)
const endpointTree = parseEndpointsToTree(mockEndpoints);
const { nodes: generatedNodes, edges: generatedEdges } =
  treeToFlowNodes(endpointTree);

const initialNodes: Node[] = generatedNodes;
const initialEdges: Edge[] = generatedEdges;

function App() {
  const [nodes, _, onNodesChange] = useNodesState(initialNodes);
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
  );
}

export default App;
