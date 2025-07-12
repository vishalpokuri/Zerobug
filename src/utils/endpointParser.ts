export interface ParameterWithType {
  name: string;
  type: string;
  required?: boolean;
}

export interface ParsedEndpoint {
  method: string;
  url: string;
  headers: string[];
  requestDataType: "params" | "query" | "body" | "none";
  paramTypes: ParameterWithType[];
  queryParamTypes: ParameterWithType[];
  bodyParamTypes: ParameterWithType[];
}

export interface EndpointNode {
  id: string;
  type: "buffer" | "endpoint";
  label: string;
  path: string;
  fullPath: string;
  level: number;
  childCount?: number;
  endpointData?: ParsedEndpoint;
  children: EndpointNode[];
}

export interface FlowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, unknown>;
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

// Mock endpoints data based on the backend file
export const mockEndpoints: ParsedEndpoint[] = [
  {
    method: "POST",
    url: "/api/auth/login",
    headers: ["Content-Type"],
    requestDataType: "body",
    paramTypes: [],
    queryParamTypes: [],
    bodyParamTypes: [
      { name: "email", type: "string", required: true },
      { name: "password", type: "string", required: true }
    ]
  },
  {
    method: "POST",
    url: "/api/auth/register",
    headers: ["Content-Type"],
    requestDataType: "body",
    paramTypes: [],
    queryParamTypes: [],
    bodyParamTypes: [
      { name: "email", type: "string", required: true },
      { name: "password", type: "string", required: true },
      { name: "name", type: "string", required: true }
    ]
  },
  {
    method: "GET",
    url: "/api/user/profile/:id",
    headers: ["Authorization"],
    requestDataType: "params",
    paramTypes: [
      { name: "id", type: "number", required: true }
    ],
    queryParamTypes: [],
    bodyParamTypes: []
  },
  {
    method: "PUT",
    url: "/api/user/profile/:id",
    headers: ["Authorization", "Content-Type"],
    requestDataType: "body",
    paramTypes: [
      { name: "id", type: "number", required: true }
    ],
    queryParamTypes: [],
    bodyParamTypes: [
      { name: "name", type: "string", required: false },
      { name: "email", type: "string", required: false }
    ]
  },
  {
    method: "GET",
    url: "/api/data/fetch",
    headers: [],
    requestDataType: "query",
    paramTypes: [],
    queryParamTypes: [
      { name: "limit", type: "number", required: false },
      { name: "offset", type: "number", required: false }
    ],
    bodyParamTypes: []
  },
  {
    method: "POST",
    url: "/api/data/create",
    headers: ["Content-Type"],
    requestDataType: "body",
    paramTypes: [],
    queryParamTypes: [],
    bodyParamTypes: [
      { name: "title", type: "string", required: true },
      { name: "description", type: "string", required: false }
    ]
  },
];

export function parseEndpointsToTree(
  endpoints: ParsedEndpoint[]
): EndpointNode {
  const root: EndpointNode = {
    id: "root",
    type: "buffer",
    label: "api",
    path: "api",
    fullPath: "/api",
    level: 0,
    children: [],
    childCount: 0,
  };

  endpoints.forEach((endpoint) => {
    const pathParts = endpoint.url.split("/").filter((part) => part !== "");
    let currentNode = root;
    let fullPath = "";

    pathParts.forEach((part, index) => {
      fullPath += `/${part}`;

      // Skip the 'api' part since it's our root
      if (part === "api") return;

      let childNode = currentNode.children.find(
        (child) => child.label === part
      );

      if (!childNode) {
        const isEndpoint = index === pathParts.length - 1;

        childNode = {
          id: `${currentNode.id}-${part}`,
          type: isEndpoint ? "endpoint" : "buffer",
          label: part,
          path: part,
          fullPath: fullPath,
          level: currentNode.level + 1,
          children: [],
          childCount: 0,
        };

        if (isEndpoint) {
          childNode.endpointData = endpoint;
        }

        currentNode.children.push(childNode);
      }

      // If this is an endpoint and we have the same path with different methods
      if (index === pathParts.length - 1 && childNode.type === "endpoint") {
        // Create a method-specific node
        const methodNode: EndpointNode = {
          id: `${childNode.id}-${endpoint.method}`,
          type: "endpoint",
          label: `${part} (${endpoint.method})`,
          path: part,
          fullPath: fullPath,
          level: childNode.level,
          children: [],
          endpointData: endpoint,
          childCount: 0,
        };

        // If this is the first time we see this path, replace the node
        if (
          !childNode.endpointData ||
          childNode.endpointData.method !== endpoint.method
        ) {
          if (childNode.endpointData) {
            // Convert existing node to method-specific
            childNode.label = `${part} (${childNode.endpointData.method})`;
            childNode.id = `${childNode.id}-${childNode.endpointData.method}`;
          }
          currentNode.children.push(methodNode);
        }
      }

      currentNode = childNode;
    });
  });

  // Calculate child counts
  function calculateChildCounts(node: EndpointNode): number {
    if (node.type === "endpoint") {
      node.childCount = 0;
      return 1;
    }

    let totalEndpoints = 0;
    node.children.forEach((child) => {
      totalEndpoints += calculateChildCounts(child);
    });

    node.childCount = totalEndpoints;
    return totalEndpoints;
  }

  calculateChildCounts(root);
  return root;
}

export function treeToFlowNodes(tree: EndpointNode): {
  nodes: FlowNode[];
  edges: FlowEdge[];
} {
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  const levelSpacing = 500; // Horizontal spacing between levels
  const nodeSpacing = 500; // Vertical spacing between nodes

  function processNode(
    node: EndpointNode,
    x: number,
    y: number,
    parentId?: string
  ): number {
    // Add the current node
    nodes.push({
      id: node.id,
      type: node.type === "buffer" ? "bufferNode" : "customNode",
      position: { x, y },
      data:
        node.type === "buffer"
          ? {
              label: node.label,
              path: node.path,
              childCount: node.childCount,
              level: node.level,
            }
          : {
              label: node.label,
              endpointData: node.endpointData,
            },
    });

    // Add edge from parent if exists
    if (parentId) {
      edges.push({
        id: `${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
      });
    }

    let currentY = y;
    const childrenStartY = y - ((node.children.length - 1) * nodeSpacing) / 2;

    // Process children
    node.children.forEach((child, index) => {
      const childY = childrenStartY + index * nodeSpacing;
      const childX = x + levelSpacing;
      currentY = Math.max(
        currentY,
        processNode(child, childX, childY, node.id)
      );
    });

    return currentY;
  }

  processNode(tree, 0, 0);

  return { nodes, edges };
}
