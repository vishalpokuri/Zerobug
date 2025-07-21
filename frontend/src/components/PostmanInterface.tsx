import { useState, useEffect } from "react";
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

interface PostmanInterfaceProps {
  endpointData: ParsedEndpoint;
}

export function PostmanInterface({ endpointData }: PostmanInterfaceProps) {
  const { backendPort, sendMessage, lastMessage } = useWebSocketContext();
  const requestData = useRequestData(endpointData);
  const [response, setResponse] = useState<RequestResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (lastMessage) {
      try {
        const message = JSON.parse(lastMessage);
        if (message.type === "response_result") {
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
        }
      } catch (error) {
        console.error("Failed to parse WebSocket message:", error);
      }
    }
  }, [lastMessage]);

  const handleSendRequest = () => {
    setLoading(true);
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
          <div className="h-full flex flex-col">
            <div className="bg-[#252525] border-b border-[#404040] px-3 py-1">
              <h3 className="text-xs font-medium uppercase tracking-wide text-[#a0a0a0]">
                Response
              </h3>
            </div>
            <div className="flex-1 overflow-auto bg-[#1e1e1e]">
              {response ? (
                <div className="p-2">
                  {response.error ? (
                    <div className="text-[#f44336] text-s">
                      <span className="font-medium">Error:</span>{" "}
                      {response.error}
                    </div>
                  ) : (
                    <div>
                      <div className="mb-2">
                        <span
                          className={`px-1 py-0.5 text-xs font-semibold rounded ${
                            response.status >= 200 && response.status < 300
                              ? "bg-[#4caf50] text-white"
                              : response.status >= 400
                              ? "bg-[#f44336] text-white"
                              : "bg-[#ff9800] text-white"
                          }`}
                        >
                          {response.status}
                        </span>
                      </div>
                      <pre className="text-[#e8e8e8] text-xs font-mono overflow-auto whitespace-pre-wrap">
                        {typeof response.data === "string"
                          ? response.data
                          : JSON.stringify(response.data, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2 text-center">
                  <div className="text-[#777] text-xs">
                    <div className="mb-1">📡</div>
                    <div>Send request</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
}
