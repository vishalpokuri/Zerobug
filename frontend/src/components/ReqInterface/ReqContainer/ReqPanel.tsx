import { useState } from "react";
import ReqTabs from "./ReqTabs";
import ReqTabContent from "./ReqTabContent";
import type { ParsedEndpoint } from "../../../hooks/useRequestData";
import type { RequestDataActions } from "../../../types/requestTypes";

interface ReqPanelProps {
  endpointData: ParsedEndpoint;
  requestData: RequestDataActions;
}

function ReqPanel({ endpointData, requestData }: ReqPanelProps) {
  const [activeTab, setActiveTab] = useState(
    endpointData.requestDataType === "none"
      ? "params"
      : endpointData.requestDataType
  );
  return (
    <>
      <ReqTabs
        requestDataType={endpointData.requestDataType}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
      <ReqTabContent
        activeTab={activeTab}
        endpointData={endpointData}
        requestData={requestData}
      />
    </>
  );
}

export default ReqPanel;
