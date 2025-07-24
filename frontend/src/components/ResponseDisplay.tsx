import { useState } from "react";
import type { RequestResponse } from "../services/requestService";

interface ResponseDisplayProps {
  response: RequestResponse | null;
  loading: boolean;
}

type ResponseTab = "body" | "headers" | "cookies";

export function ResponseDisplay({ response, loading }: ResponseDisplayProps) {
  const [activeTab, setActiveTab] = useState<ResponseTab>("body");

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-[#252525] border-b border-[#404040] px-3 py-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-[#a0a0a0]">
            Response
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full"></div>
            <div className="text-sm text-gray-400">Sending request...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-[#252525] border-b border-[#404040] px-3 py-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-[#a0a0a0]">
            Response
          </h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="text-2xl mb-2">📡</div>
            <div className="text-sm">Send a request to see response</div>
          </div>
        </div>
      </div>
    );
  }

  if (response.error) {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-[#252525] border-b border-[#404040] px-3 py-2">
          <h3 className="text-xs font-medium uppercase tracking-wide text-[#a0a0a0]">
            Response
          </h3>
        </div>
        <div className="flex-1 p-4">
          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-red-400 font-medium text-sm">
                Request Failed
              </span>
            </div>
            <div className="text-red-300 text-sm font-mono">
              {response.error}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300)
      return "text-green-400 bg-green-400/10 border-green-400/20";
    if (status >= 400) return "text-red-400 bg-red-400/10 border-red-400/20";
    return "text-orange-400 bg-orange-400/10 border-orange-400/20";
  };

  const getStatusText = (status: number) => {
    const statusTexts: { [key: number]: string } = {
      200: "OK",
      201: "Created",
      202: "Accepted",
      204: "No Content",
      400: "Bad Request",
      401: "Unauthorized",
      403: "Forbidden",
      404: "Not Found",
      500: "Internal Server Error",
      502: "Bad Gateway",
      503: "Service Unavailable",
    };
    return statusTexts[status] || "Unknown";
  };

  const formatResponseTime = () => {
    // Placeholder - you can add actual response time tracking
    return "142ms";
  };

  const formatResponseSize = () => {
    const size = JSON.stringify(response.data).length;
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "body":
        return (
          <div className="p-4">
            <pre className="text-sm font-mono text-gray-200 whitespace-pre-wrap overflow-auto">
              {typeof response.data === "string"
                ? response.data
                : JSON.stringify(response.data, null, 2)}
            </pre>
          </div>
        );

      case "headers":
        return (
          <div className="p-4">
            <div className="space-y-2">
              {response.headers &&
                Object.entries(response.headers).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex border-b border-gray-700/30 pb-2"
                  >
                    <div className="text-sm font-medium text-orange-400 w-48 flex-shrink-0">
                      {key}:
                    </div>
                    <div className="text-sm text-gray-200 flex-1 font-mono">
                      {value as string}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        );

      case "cookies":
        return (
          <div className="p-4">
            <div className="text-center text-gray-500 text-sm">
              <div className="mb-2">🍪</div>
              <div>No cookies found</div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {/* Response Header */}
      <div className="bg-[#252525] border-b border-[#404040] px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium uppercase tracking-wide text-[#a0a0a0]">
            Response
          </h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="text-gray-400">
              Status:{" "}
              <span
                className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                  response.status
                )}`}
              >
                {response.status} {getStatusText(response.status)}
              </span>
            </div>
            <div className="text-gray-400">
              Time: <span className="text-white">{formatResponseTime()}</span>
            </div>
            <div className="text-gray-400">
              Size: <span className="text-white">{formatResponseSize()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-[#2a2a2a] border-b border-[#404040]">
        <div className="flex">
          {[
            { id: "body", label: "Body", count: null },
            {
              id: "headers",
              label: "Headers",
              count: response.headers
                ? Object.keys(response.headers).length
                : 0,
            },
            { id: "cookies", label: "Cookies", count: 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ResponseTab)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "text-orange-400 border-orange-400 bg-[#1e1e1e]"
                  : "text-gray-400 border-transparent hover:text-gray-200 hover:bg-[#333]"
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className="ml-1 text-xs bg-gray-600 px-1.5 py-0.5 rounded">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">{renderTabContent()}</div>
    </div>
  );
}
