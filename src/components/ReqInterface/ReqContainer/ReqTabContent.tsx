import type { activeTabType } from "../../../types/declarations";
import type {
  ParsedEndpoint,
  KeyValuePair,
} from "../../../hooks/useRequestData";

type tabContentTypes = activeTabType | "headers";

import type { RequestDataActions } from "../../../types/requestTypes";

interface ReqTabContentProps {
  activeTab: tabContentTypes;
  endpointData: ParsedEndpoint;
  requestData: RequestDataActions;
}

function ReqTabContent({
  activeTab,
  endpointData,
  requestData,
}: ReqTabContentProps) {
  const renderKeyValueTable = (
    type: "params" | "query" | "body" | "headers"
  ) => {
    let data: KeyValuePair[];
    switch (type) {
      case "params":
        data = requestData.params;
        break;
      case "query":
        data = requestData.queryParams;
        break;
      case "body":
        data = requestData.bodyParams;
        break;
      case "headers":
        data = requestData.headers;
        break;
    }

    const updateFn = requestData.updateKeyValuePair;
    const addFn = () => requestData.addKeyValuePair(type);
    const removeFn = (index: number) =>
      requestData.removeKeyValuePair(type, index);

    return (
      <div className="h-full">
        <div className="grid grid-cols-12 gap-0 text-xs font-medium text-[#a0a0a0] bg-[#2b2b2b] px-3 py-2 border-b border-[#404040]">
          <div className="col-span-1"></div>
          <div className="col-span-5 uppercase tracking-wide">Key</div>
          <div className="col-span-5 uppercase tracking-wide">Value</div>
          <div className="col-span-1"></div>
        </div>
        <div className="overflow-auto">
          {data.map((item, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-0 items-center border-b border-[#2b2b2b] hover:bg-[#2b2b2b] transition-colors"
            >
              <div className="col-span-1 px-3 py-2">
                <input
                  type="checkbox"
                  checked={item.enabled}
                  onChange={(e) =>
                    updateFn(type, index, "enabled", e.target.checked)
                  }
                  className="w-3 h-3 accent-[#ff6b35] bg-transparent border border-[#555] rounded-sm"
                />
              </div>
              <div className="col-span-5 px-2 py-1">
                <input
                  type="text"
                  value={item.key}
                  onChange={(e) => updateFn(type, index, "key", e.target.value)}
                  placeholder="Key"
                  readOnly={
                    endpointData.params.includes(item.key) ||
                    endpointData.queryParams.includes(item.key) ||
                    endpointData.bodyParams.includes(item.key) ||
                    endpointData.headers.includes(item.key)
                  }
                  className={`w-full px-2 py-1.5 bg-transparent border-0 text-sm placeholder-[#777] focus:outline-none focus:bg-[#2b2b2b] rounded ${
                    endpointData.params.includes(item.key) ||
                    endpointData.queryParams.includes(item.key) ||
                    endpointData.bodyParams.includes(item.key) ||
                    endpointData.headers.includes(item.key)
                      ? "text-[#ff6b35] cursor-not-allowed"
                      : "text-[#e8e8e8]"
                  }`}
                />
              </div>
              <div className="col-span-5 px-2 py-1">
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) =>
                    updateFn(type, index, "value", e.target.value)
                  }
                  placeholder="Value"
                  className="w-full px-2 py-1.5 bg-transparent border-0 text-[#e8e8e8] text-sm placeholder-[#777] focus:outline-none focus:bg-[#2b2b2b] rounded"
                />
              </div>
              <div className="col-span-1 px-3 py-2">
                <button
                  onClick={() => removeFn(index)}
                  className="text-[#999] hover:text-[#ff6b35] w-4 h-4 flex items-center justify-center text-lg transition-colors"
                  disabled={data.length === 1}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="px-3 py-2 border-t border-[#2b2b2b]">
          <button
            onClick={addFn}
            className="text-[#ff6b35] hover:text-[#ff8c5a] text-xs font-medium transition-colors"
          >
            + Add {type === "params" ? "Parameter" : "Header"}
          </button>
        </div>
      </div>
    );
  };
  return (
    <div className="flex-1 overflow-hidden">
      {activeTab === "params" && renderKeyValueTable("params")}
      {activeTab === "query" && renderKeyValueTable("query")}
      {activeTab === "body" && renderKeyValueTable("body")}
      {activeTab === "headers" && renderKeyValueTable("headers")}
    </div>
  );
}

export default ReqTabContent;
