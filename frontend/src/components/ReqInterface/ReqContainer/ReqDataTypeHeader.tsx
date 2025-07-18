import { requestDataTypes } from "../../../types/declarations";

interface ReqDataTypeHeaderProps {
  requestDataType: keyof typeof requestDataTypes;
}

function ReqDataTypeHeader({ requestDataType }: ReqDataTypeHeaderProps) {
  return (
    <>
      {" "}
      {requestDataType !== "none" && (
        <div className="flex bg-[#2b2b2b] text-xs gap-2 font-medium px-4 py-2 border-b border-[#404040]">
          <span className="text-[#bbbbbb]">REQUEST DATA TYPE:</span>
          <span className="  text-[#F98866]  tracking-wide">
            {requestDataType === "params"
              ? "URL Parameters"
              : requestDataType === "query"
              ? "Query Parameters"
              : requestDataType === "body"
              ? "Body Parameters"
              : ""}
          </span>
        </div>
      )}
    </>
  );
}

export default ReqDataTypeHeader;
