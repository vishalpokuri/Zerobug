import {
  useWebSocketConnection,
  ConnectionStatus,
} from "../hooks/useWebSocketConnection";

import { getStatusColor, getStatusText } from "../utils/utilityFunctions";

interface ConnectionStatusIndicatorProps {
  onClick: () => void;
  projectId?: string;
}

export function ConnectionStatusIndicator({
  onClick,
  projectId = "your-project",
}: ConnectionStatusIndicatorProps) {
  const { status } = useWebSocketConnection({ id: projectId });

  const shouldAnimate =
    status === ConnectionStatus.CONNECTING ||
    status === ConnectionStatus.CONNECTED;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1.5 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white text-sm font-medium rounded transition-colors"
    >
      <div
        className={`w-2 h-2 rounded-full ${getStatusColor(status)} ${
          shouldAnimate ? "animate-pulse" : ""
        }`}
      />
      <span className="text-xs">{getStatusText(status)}</span>
    </button>
  );
}
