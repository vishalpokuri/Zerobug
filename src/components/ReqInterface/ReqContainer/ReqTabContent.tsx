import type { activeTabType } from "../../../types/declarations";
import type {
  ParsedEndpoint,
  KeyValuePair,
} from "../../../hooks/useRequestData";
import type { ParameterWithType } from "../../../utils/endpointParser";

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
    let typeData: ParameterWithType[] | undefined;

    switch (type) {
      case "params":
        data = requestData.params;
        typeData = endpointData.paramTypes;
        break;
      case "query":
        data = requestData.queryParams;
        typeData = endpointData.queryParamTypes;
        break;
      case "body":
        data = requestData.bodyParams;
        typeData = endpointData.bodyParamTypes;
        break;
      case "headers":
        data = requestData.headers;
        typeData = undefined; // Headers don't need types
        break;
    }

    const getParameterType = (key: string): ParameterWithType | undefined => {
      return typeData?.find((param) => param.name === key);
    };

    const updateFn = requestData.updateKeyValuePair;
    const addFn = () => requestData.addKeyValuePair(type);
    const removeFn = (index: number) =>
      requestData.removeKeyValuePair(type, index);

    return (
      <div className="h-full">
        <div className="grid grid-cols-12 gap-0 text-xs font-medium text-[#a0a0a0] bg-[#2b2b2b] px-3 py-2 border-b border-[#404040]">
          <div className="col-span-1"></div>
          <div className="col-span-3 uppercase tracking-wide">Key</div>
          <div className="col-span-2 uppercase tracking-wide">Type</div>
          <div className="col-span-5 uppercase tracking-wide">Value</div>
          <div className="col-span-1"></div>
        </div>
        <div className="overflow-auto">
          {data.map((item, index) => {
            const paramType = getParameterType(item.key);
            const isRequired = paramType?.required;
            const isEndpointParam =
              endpointData.paramTypes.some(p => p.name === item.key) ||
              endpointData.queryParamTypes.some(p => p.name === item.key) ||
              endpointData.bodyParamTypes.some(p => p.name === item.key) ||
              endpointData.headers.includes(item.key);

            return (
              <div
                key={index}
                className="grid grid-cols-12 gap-0 items-center border-b border-[#2b2b2b] transition-colors"
              >
                <div className="col-span-1 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={item.enabled}
                    onChange={(e) =>
                      updateFn(type, index, "enabled", e.target.checked)
                    }
                    className="w-3 h-3 accent-[#F98866] bg-transparent border border-[#555] rounded-sm"
                  />
                </div>
                <div className="col-span-3 px-2 py-1">
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      value={item.key}
                      onChange={(e) =>
                        updateFn(type, index, "key", e.target.value)
                      }
                      placeholder="Key"
                      readOnly={isEndpointParam}
                      className={`w-full px-2 py-1.5 bg-transparent border-0 text-sm placeholder-[#777] focus:outline-none focus:bg-[#2b2b2b] rounded ${
                        isEndpointParam
                          ? "text-[#F98866] cursor-not-allowed"
                          : "text-[#e8e8e8]"
                      }`}
                    />
                    {isRequired && (
                      <span className="text-[#f44336] text-xs font-bold">
                        *
                      </span>
                    )}
                  </div>
                </div>
                <div className="col-span-2 px-2 py-1">
                  <div className="flex items-center">
                    <span
                      className={`px-1.5 py-0.5 text-xs rounded ${
                        paramType?.type === "string"
                          ? "bg-[#4caf50] text-white"
                          : paramType?.type === "number"
                          ? "bg-[#2196f3] text-white"
                          : paramType?.type === "boolean"
                          ? "bg-[#ff9800] text-white"
                          : "bg-[#666] text-[#ccc]"
                      }`}
                    >
                      {paramType?.type || "any"}
                    </span>
                  </div>
                </div>
                <div className="col-span-5 px-2 py-1  ">
                  <input
                    type="text"
                    value={item.value}
                    onChange={(e) =>
                      updateFn(type, index, "value", e.target.value)
                    }
                    placeholder="Value"
                    className="w-full px-2 py-1.5 bg-transparent border-0 text-[#e8e8e8] hover:bg-[#2b2b2b] text-sm placeholder-[#777] focus:outline-none focus:bg-[#2b2b2b] rounded"
                  />
                </div>
                <div className="col-span-1 px-3 py-2">
                  <button
                    onClick={() => removeFn(index)}
                    className="text-[#999] hover:text-[#F98866] w-4 h-4 flex items-center justify-center text-lg transition-colors"
                    disabled={data.length === 1}
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className="px-3 py-2 border-t border-[#2b2b2b]">
          <button
            onClick={addFn}
            className="text-[#F98866] hover:text-[#ff8c5a] text-xs font-medium transition-colors"
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
