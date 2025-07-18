import { useWebSocketContext } from "../contexts/WebSocketContext";
import { ConnectionStatus } from "../types/declarations";

import { getStatusColorBG } from "../utils/utilityFunctions";

interface ConnectionStatusIndicatorProps {
  onClick: () => void;
}

export function ConnectionStatusIndicator({
  onClick,
}: ConnectionStatusIndicatorProps) {
  const { status } = useWebSocketContext();

  console.log("Indicator status: ", status);

  const shouldAnimate =
    status === ConnectionStatus.CONNECTING ||
    status === ConnectionStatus.CONNECTED;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 border border-gray-600/50 hover:border-gray-500 text-gray-300 hover:text-white text-sm font-medium rounded-full transition-colors"
    >
      <div
        className={`w-2 h-2 rounded-full ${getStatusColorBG(status)} ${
          shouldAnimate ? "animate-pulse" : ""
        }`}
      />
      <span className="text-xs font-rr leading-none">
        {status.toLocaleUpperCase()}
      </span>
    </button>
  );
}
