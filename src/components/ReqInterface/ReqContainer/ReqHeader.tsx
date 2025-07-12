import { Colors } from "../../../types/declarations";
import { ClipLoader } from "react-spinners";
interface ReqHeaderProps {
  endpointMethod: keyof typeof Colors;
  endpointUrl: string;
  handleSendRequestClick: () => void;
  disabledState: boolean;
}

function ReqHeader({
  endpointMethod,
  endpointUrl,
  handleSendRequestClick,
  disabledState,
}: ReqHeaderProps) {
  return (
    <div className="bg-[#252525] border-b border-[#404040] px-4 py-3">
      {/* Request Line */}
      <div className="flex gap-1 items-center">
        <div
          className="px-3 py-1.5 text-xs font-semibold rounded text-white"
          style={{
            backgroundColor: Colors[endpointMethod] || Colors.DEFAULT
          }}
        >
          {endpointMethod}
        </div>
        <input
          type="text"
          value={endpointUrl}
          readOnly
          className="flex-1 px-3 py-1.5 bg-[#2b2b2b] border border-[#404040] text-[#a0a0a0] text-sm cursor-not-allowed pointer-events-none"
        />
        <button
          onClick={handleSendRequestClick}
          disabled={disabledState}
          className="px-4 py-1.5 bg-[#F98866] hover:bg-[#ff8c5a] disabled:bg-[#555] disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {disabledState ? <ClipLoader size={8} /> : "Send"}
        </button>
      </div>
    </div>
  );
}

export default ReqHeader;
