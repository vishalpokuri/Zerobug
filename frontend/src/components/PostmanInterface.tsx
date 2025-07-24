import { useState, useEffect, useRef } from "react";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import { Colors } from "../types/declarations";
import ReqHeader from "./ReqInterface/ReqContainer/ReqHeader";
import ReqDataTypeHeader from "./ReqInterface/ReqContainer/ReqDataTypeHeader";
import ReqPanel from "./ReqInterface/ReqContainer/ReqPanel";
import { useRequestData, type ParsedEndpoint } from "../hooks/useRequestData";
import {
  sendRequestViaProxy,
  type RequestResponse,
} from "../services/requestService";
import { useWebSocketContext } from "../contexts/WebSocketContext";
import { ResponseDisplay } from "./ResponseDisplay";

interface PostmanInterfaceProps {
  endpointData: ParsedEndpoint;
}

export function PostmanInterface({ endpointData }: PostmanInterfaceProps) {
  const { backendPort, sendMessage, lastMessage } = useWebSocketContext();
  const requestData = useRequestData(endpointData);
  const [response, setResponse] = useState<RequestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const pendingRequestRef = useRef<string | null>(null);

  useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage);
        if (message.type === "response_result" && pendingRequestRef.current) {
          // Only process the response if this interface has a pending request
          let resBody = null;
          try {
            resBody = JSON.parse(message.body);
          } catch {
            resBody = message.body;
          }
          setResponse({
            status: message.status,
            statusText: "OK",
            headers: message.headers,
            data: resBody,
            error: message.error,
          });
          setLoading(false);
          pendingRequestRef.current = null; // Clear the pending request
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    }
  }, [lastMessage]);

  const handleSendRequest = () => {
    setLoading(true);
    // Generate a unique request ID for this interface
    const requestId = `${endpointData.method}-${endpointData.url}-${Date.now()}`;
    pendingRequestRef.current = requestId;
    
    // Clear previous response
    setResponse(null);
    
    sendRequestViaProxy(endpointData, requestData, backendPort, sendMessage);
  };

  return (
    <div className="h-full bg-[#1e1e1e] text-white flex flex-col">
      {/* Header */}
      <ReqHeader
        endpointMethod={endpointData.method as keyof typeof Colors}
        endpointUrl={endpointData.url}
        handleSendRequestClick={handleSendRequest}
        disabledState={loading}
      />

      {/* Request Configuration */}
      <PanelGroup direction="vertical">
        <Panel defaultSize={50} minSize={20}>
          <div className="h-full border-b border-[#404040] flex flex-col">
            {/* Request Data Type Header */}
            <ReqDataTypeHeader requestDataType={endpointData.requestDataType} />

            {/* Tabs */}
            <ReqPanel endpointData={endpointData} requestData={requestData} />
          </div>
        </Panel>
        <PanelResizeHandle className="h-2 bg-transparent hover:bg-[#404040] transition-colors" />
        <Panel defaultSize={50} minSize={20}>
          <ResponseDisplay response={response} loading={loading} />
        </Panel>
      </PanelGroup>
    </div>
  );
}
