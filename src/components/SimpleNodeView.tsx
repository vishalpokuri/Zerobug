import { type ParsedEndpoint } from "../hooks/useRequestData";

interface SimpleNodeViewProps {
  endpointData: ParsedEndpoint;
}

export function SimpleNodeView({ endpointData }: SimpleNodeViewProps) {
  const getMethodColor = (method: string) => {
    const colors = {
      GET: "bg-[#4caf50]",
      POST: "bg-[#ff9800]", 
      PUT: "bg-[#2196f3]",
      DELETE: "bg-[#f44336]",
      PATCH: "bg-[#9c27b0]"
    };
    return colors[method as keyof typeof colors] || "bg-[#666]";
  };

  const getParamCount = () => {
    const total = 
      (endpointData.paramTypes?.length || 0) + 
      (endpointData.queryParamTypes?.length || 0) + 
      (endpointData.bodyParamTypes?.length || 0);
    return total;
  };

  return (
    <div className="h-full bg-[#1e1e1e] text-white p-4 flex flex-col justify-center">
      {/* Method Badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className={`px-2 py-1 text-xs font-semibold rounded text-white ${getMethodColor(endpointData.method)}`}>
          {endpointData.method}
        </span>
        <span className="text-[#a0a0a0] text-xs">API Endpoint</span>
      </div>

      {/* URL */}
      <div className="mb-3">
        <h3 className="text-sm font-medium text-white mb-1">Route</h3>
        <code className="text-xs text-[#e8e8e8] bg-[#2a2a2a] px-2 py-1 rounded font-mono break-all">
          {endpointData.url}
        </code>
      </div>

      {/* Minimal Details */}
      <div className="space-y-2">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-[#4caf50] rounded-full"></div>
            <span className="text-[#a0a0a0]">Parameters: {getParamCount()}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-[#2196f3] rounded-full"></div>
            <span className="text-[#a0a0a0]">Headers: {endpointData.headers?.length || 0}</span>
          </div>
        </div>
        
        <div className="text-xs text-[#777]">
          Data Type: <span className="text-[#e8e8e8] capitalize">{endpointData.requestDataType}</span>
        </div>
      </div>
    </div>
  );
}