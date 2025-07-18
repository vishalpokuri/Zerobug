import { requestDataTypes } from "../../../types/declarations";

interface ReqDataTypeHeaderProps {
  requestDataType: keyof typeof requestDataTypes;
  activeTab: activeTabType;
  setActiveTab: (value: activeTabType) => void;
}

import type { activeTabType } from "../../../types/declarations";

function ReqTabs({
  requestDataType,
  activeTab,
  setActiveTab,
}: ReqDataTypeHeaderProps) {
  const allTabs = (
    requestDataType !== "none" ? [requestDataType] : ["params"]
  ).concat(["headers"]);

  return (
    <div className="bg-[#252525] border-b border-[#404040] flex">
      {allTabs.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab as activeTabType)}
          className={`px-4 py-2 text-xs font-medium uppercase tracking-wide border-r border-[#404040] last:border-r-0 transition-colors ${
            activeTab === tab
              ? "text-[#F98866] bg-[#1e1e1e] border-b-2 border-[#F98866]"
              : "text-[#a0a0a0] hover:text-[#e8e8e8] hover:bg-[#2b2b2b]"
          }`}
        >
          {tab === "params"
            ? "Parameters"
            : tab === "query"
            ? "Query"
            : tab === "body"
            ? "Body"
            : tab}
        </button>
      ))}
    </div>
  );
}

export default ReqTabs;
