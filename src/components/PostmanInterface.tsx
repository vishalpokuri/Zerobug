import { useState } from "react";
import { Colors } from "../types/declarations";
import ReqHeader from "./ReqInterface/ReqContainer/ReqHeader";
import ReqDataTypeHeader from "./ReqInterface/ReqContainer/ReqDataTypeHeader";
import ReqPanel from "./ReqInterface/ReqContainer/ReqPanel";
import { useRequestData, type ParsedEndpoint } from "../hooks/useRequestData";
import {
  sendRequest as sendRequestService,
  type RequestResponse,
} from "../services/requestService";

interface PostmanInterfaceProps {
  endpointData: ParsedEndpoint;
}

export function PostmanInterface({ endpointData }: PostmanInterfaceProps) {
  const requestData = useRequestData(endpointData);
  const [response, setResponse] = useState<RequestResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendRequest = async () => {
    setLoading(true);
    try {
      const result = await sendRequestService(endpointData, requestData);
      setResponse(result);
    } catch (error) {
      setResponse({
        status: 0,
        statusText: "Error",
        headers: {},
        data: null,
        error: error instanceof Error ? error.message : "Request failed",
      });
    } finally {
      setLoading(false);
    }
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
      <div className="flex-1 flex">
        {/* Left Panel - Request */}
        <div className="w-3/4 border-r border-[#404040] flex flex-col">
          {/* Request Data Type Header */}
          <ReqDataTypeHeader requestDataType={endpointData.requestDataType} />

          {/* Tabs */}
          <ReqPanel endpointData={endpointData} requestData={requestData} />
        </div>

        {/* Right Panel - Response (Minimized) */}
        <div className="w-1/4 flex flex-col">
          <div className="bg-[#252525] border-b border-[#404040] px-3 py-1">
            <h3 className="text-xs font-medium uppercase tracking-wide text-[#a0a0a0]">
              Response
            </h3>
          </div>
          <div className="flex-1 overflow-auto bg-[#1e1e1e]">
            {response ? (
              <div className="p-2">
                {response.error ? (
                  <div className="text-[#f44336] text-xs">
                    <span className="font-medium">Error:</span> {response.error}
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
                    <pre className="text-[#e8e8e8] text-xs font-mono overflow-auto whitespace-pre-wrap max-h-32">
                      {typeof response.data === "string"
                        ? response.data.slice(0, 200) +
                          (response.data.length > 200 ? "..." : "")
                        : JSON.stringify(response.data, null, 1).slice(0, 200) +
                          "..."}
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
      </div>
    </div>
  );
}
