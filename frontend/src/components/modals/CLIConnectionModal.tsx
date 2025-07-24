import { useWebSocketContext } from "../../contexts/WebSocketContext";
import {
  ChevronLeft,
  CloseIcon,
  RetryIcon,
  TerminalIcon,
} from "../../Svg/Icons";

import { getStatusIcon } from "../../utils/utilityFunctions";

import { ConnectionStatus } from "../../types/declarations";
import CodeBlock from "../ui/CodeBlock";
import React from "react";

interface CLIConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

// Reusable Status Card Components
const StatusCard = ({
  icon,
  title,
  subtitle,
  children,
  variant = "default",
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  variant?: "default" | "error" | "connecting" | "success" | "warning";
}) => {
  const variantStyles = {
    default: "bg-gray-800/10 border-gray-700/20",
    error: "bg-red-500/10 border-red-500/20",
    connecting: "bg-yellow-400/10 border-yellow-400/20",
    success: "bg-green-500/10 border-green-500/20",
    warning: "bg-orange-500/10 border-orange-500/20",
  };

  const iconBgStyles = {
    default: "bg-gray-800/20",
    error: "bg-red-500/20",
    connecting: "bg-yellow-400/20 animate-pulse",
    success: "bg-green-500/20",
    warning: "bg-orange-500/20 animate-pulse",
  };

  return (
    <div className="text-center">
      <div className="mb-6">
        <div
          className={`w-20 h-20 mx-auto mb-4 ${variantStyles[variant]} border-2 rounded-full flex items-center justify-center relative`}
        >
          <div
            className={`w-12 h-12 ${iconBgStyles[variant]} rounded-full flex items-center justify-center`}
          >
            {icon}
          </div>
          {variant === "error" && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          )}
          {variant === "warning" && (
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">⚠</span>
            </div>
          )}
          {variant === "connecting" && (
            <div className="absolute inset-0 border-2 border-yellow-400/30 rounded-full animate-ping"></div>
          )}
        </div>
        <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
        <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
          {subtitle}
        </p>
      </div>
      {children}
    </div>
  );
};

const ConnectingProgress = ({ retryCount }: { retryCount: number }) => {
  const maxRetries = 3;
  const progressPercentage = Math.min((retryCount / maxRetries) * 100, 100);

  return (
    <div className="bg-gray-800/50 rounded-lg p-6 mb-6">
      <div className="flex items-center justify-center gap-3 mb-4">
        <div className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"></div>
        <div
          className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.1s" }}
        ></div>
        <div
          className="w-2 h-2 bg-yellow-400 rounded-full animate-bounce"
          style={{ animationDelay: "0.2s" }}
        ></div>
      </div>
      <div className="text-sm text-yellow-400 font-medium mb-3">
        {retryCount == 0
          ? "Attempting Connection..."
          : `Retrying Connection... (${retryCount}/${maxRetries})`}
      </div>
      <div className="text-xs text-gray-500 mb-3">Retrying every 3 seconds</div>
      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
};

// Custom SVG Icons
const CliIcon = ({ connected }: { connected: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    className="transition-colors"
  >
    <rect
      x="2"
      y="4"
      width="20"
      height="16"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
      fill={connected ? "currentColor" : "none"}
      fillOpacity={connected ? "0.2" : "0"}
    />
    <path
      d="M6 10l2 2-2 2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="12"
      y1="14"
      x2="18"
      y2="14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const RelayIcon = ({ connected }: { connected: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-colors ${
      connected ? "text-green-500" : "text-gray-500"
    }`}
  >
    <path
      d="M11.86,2L11.34,3.93C15.75,4.78 19.2,8.23 20.05,12.65L22,12.13C20.95,7.03 16.96,3.04 11.86,2M10.82,5.86L10.3,7.81C13.34,8.27 15.72,10.65 16.18,13.68L18.12,13.16C17.46,9.44 14.55,6.5 10.82,5.86M3.72,9.69C3.25,10.73 3,11.86 3,13C3,14.95 3.71,16.82 5,18.28V22H8V20.41C8.95,20.8 9.97,21 11,21C12.14,21 13.27,20.75 14.3,20.28L3.72,9.69M9.79,9.76L9.26,11.72A3,3 0 0,1 12.26,14.72L14.23,14.2C14,11.86 12.13,10 9.79,9.76Z"
      fill={connected ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={connected ? "0" : "1.5"}
      fillOpacity={connected ? "1" : "0"}
    />
  </svg>
);

const WebIcon = ({ connected }: { connected: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    className={`transition-colors ${
      connected ? "text-green-500" : "text-gray-500"
    }`}
  >
    <circle
      cx="12"
      cy="12"
      r="9"
      stroke="currentColor"
      strokeWidth="2"
      fill={connected ? "currentColor" : "none"}
      fillOpacity={connected ? "0.1" : "0"}
    />
    <path d="M3 12h18" stroke="currentColor" strokeWidth="2" />
    <path d="M12 3s-3 4.5-3 9 3 9 3 9" stroke="currentColor" strokeWidth="2" />
    <path d="M12 3s3 4.5 3 9-3 9-3 9" stroke="currentColor" strokeWidth="2" />
  </svg>
);

// Dotted line component
const DottedLine = ({ connected }: { connected: boolean }) => (
  <svg width="40" height="2" viewBox="0 0 40 2" className="mx-4">
    <line
      x1="0"
      y1="1"
      x2="40"
      y2="1"
      stroke={connected ? "#10b981" : "#6b7280"}
      strokeWidth="2"
      strokeDasharray="3,3"
      className="transition-colors"
    />
  </svg>
);

// Spinner component for loading state
const Spinner = () => (
  <svg
    className="animate-spin w-4 h-4 text-yellow-400"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const ConnectionVisual = ({
  isCliConnected,
  isFrontendConnected,
}: {
  isCliConnected: boolean;
  isFrontendConnected: boolean;
}) => {
  const isWaitingForCli = isFrontendConnected && !isCliConnected;

  return (
    <div className="bg-gray-800/30 rounded-lg p-8 mb-6">
      <div className="flex items-center justify-center">
        {/* CLI */}
        <div className="flex flex-col items-center gap-3">
          <div className="p-2 bg-gray-800/50 rounded-lg">
            <div
              className={`${
                isWaitingForCli
                  ? "text-yellow-400 animate-pulse"
                  : isCliConnected
                  ? "text-green-500"
                  : "text-gray-500"
              }`}
            >
              <CliIcon connected={isCliConnected || isWaitingForCli} />
            </div>
          </div>
          <span className="text-xs font-mono text-gray-400 font-semibold">
            CLI
          </span>
        </div>

        {/* CLI to Relay connection line */}
        <DottedLine connected={isCliConnected} />

        {/* Relay */}
        <div className="flex flex-col items-center gap-3">
          <div className="p-2 bg-gray-800/50 rounded-lg">
            <RelayIcon connected={isFrontendConnected} />
          </div>
          <span className="text-xs font-mono text-gray-400 font-semibold">
            RELAY
          </span>
        </div>

        {/* Relay to Frontend connection line */}
        <DottedLine connected={isFrontendConnected} />

        {/* Frontend */}
        <div className="flex flex-col items-center gap-3">
          <div className="p-2 bg-gray-800/50 rounded-lg">
            <WebIcon connected={isFrontendConnected} />
          </div>
          <span className="text-xs font-mono text-gray-400 font-semibold">
            CLIENT
          </span>
        </div>
      </div>

      {/* Enhanced Status text with spinner */}
      <div className="text-center mt-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          {isWaitingForCli && <Spinner />}
          <span className="text-sm text-gray-300 font-medium">
            {isFrontendConnected && isCliConnected
              ? "🟢 Full Connection Established"
              : isWaitingForCli
              ? "⏳ Waiting for CLI to Connect"
              : !isFrontendConnected
              ? "🔴 Frontend Connection Failed"
              : "🔴 Connection Failed"}
          </span>
        </div>

        {/* Additional context */}
        {isWaitingForCli && (
          <p className="text-xs text-gray-500 mt-1">
            Run the CLI command in your terminal to establish connection
          </p>
        )}

        {isFrontendConnected && isCliConnected && (
          <p className="text-xs text-green-400 mt-1">
            ✓ Ready to debug your application
          </p>
        )}
      </div>
    </div>
  );
};

const ActionButtons = ({
  primaryAction,
  secondaryAction,
}: {
  primaryAction: {
    label: string;
    onClick: () => void;
    icon?: string | React.ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: string | React.ReactNode;
  };
}) => (
  <div className="flex gap-3 justify-center">
    {secondaryAction && (
      <button
        onClick={secondaryAction.onClick}
        className="px-4 py-2 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-all duration-200 hover:bg-gray-800/50 flex justify-center items-center gap-2"
      >
        {secondaryAction.icon} {secondaryAction.label}
      </button>
    )}
    <button
      onClick={primaryAction.onClick}
      className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-lg  flex justify-center items-center gap-2"
    >
      {primaryAction.icon} {primaryAction.label}
    </button>
  </div>
);

export function CLIConnectionModal({
  isOpen,
  onClose,
  projectId = "your-project",
}: CLIConnectionModalProps) {
  const {
    status,
    connect,
    disconnect,
    setStatus,
    retryCount,
    backendPort,
    setBackendPort,
    isCliConnected,
  } = useWebSocketContext();

  const command = `zerobug sniff --id=${projectId} --backend=${backendPort}`;

  const handleConnect = () => {
    connect();
  };

  const handleClose = () => {
    onClose();
  };

  const handleDisconnect = () => {
    disconnect();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">CLI Connection</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {(() => {
            switch (status) {
              case ConnectionStatus.DISCONNECTED:
                return (
                  <div className="text-center">
                    {/* Main content */}
                    <div className="mb-6">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                        <TerminalIcon className="w-8 h-8 text-yellow-400" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">
                        Connect to CLI Application
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Run this command in your terminal to start the CLI
                        application
                      </p>
                    </div>
                    {/* Port Input */}
                    <div className="my-4 flex gap-5 items-center">
                      <label
                        htmlFor="backend-port"
                        className="block text-sm font-medium text-gray-300 mb-2 w-2/5"
                      >
                        Backend Port
                      </label>
                      <input
                        type="text"
                        id="backend-port"
                        value={backendPort}
                        onChange={(e) => setBackendPort(e.target.value)}
                        className="w-full px-3 py-2 bg-[#141414] border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        placeholder="e.g., 3000"
                      />
                    </div>

                    {/* CLI Command to copy*/}
                    <CodeBlock command={command} />

                    {/* Instructions */}
                    <InstructionsSection />

                    <button
                      onClick={handleConnect}
                      className="w-full px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded transition-colors"
                    >
                      Connect to CLI
                    </button>
                  </div>
                );

              case ConnectionStatus.ERROR:
                return (
                  <StatusCard
                    variant="error"
                    icon={getStatusIcon(status)}
                    title="Connection Failed"
                    subtitle="Unable to establish connection. Please ensure your CLI application is running and try again."
                  >
                    <ActionButtons
                      primaryAction={{
                        label: "Retry Connection",
                        onClick: handleConnect,
                        icon: <RetryIcon />,
                      }}
                      secondaryAction={{
                        label: "Back to Setup",
                        onClick: () => setStatus(ConnectionStatus.DISCONNECTED),
                        icon: <ChevronLeft />,
                      }}
                    />
                  </StatusCard>
                );

              case ConnectionStatus.INSTANCE_ALREADY_RUNNING:
                return (
                  <StatusCard
                    variant="warning"
                    icon={getStatusIcon(status)}
                    title="Already running another project"
                    subtitle="It looks like you are already running a Zerobug instance. Quit the current running CLI command and retry with the new one."
                  >
                    <ActionButtons
                      primaryAction={{
                        label: "Retry Connection",
                        onClick: handleConnect,
                        icon: <RetryIcon />,
                      }}
                      secondaryAction={{
                        label: "Back to Setup",
                        onClick: () => setStatus(ConnectionStatus.DISCONNECTED),
                        icon: <ChevronLeft />,
                      }}
                    />
                  </StatusCard>
                );

              case ConnectionStatus.CONNECTING:
                return (
                  <StatusCard
                    variant="connecting"
                    icon={getStatusIcon(status)}
                    title="Connecting to CLI"
                    subtitle="Establishing WebSocket connection on port 9229"
                  >
                    <ConnectingProgress retryCount={retryCount} />
                  </StatusCard>
                );

              case ConnectionStatus.CONNECTED:
                return (
                  <StatusCard
                    variant="success"
                    icon={getStatusIcon(status)}
                    title="Connection Status"
                  >
                    <ConnectionVisual
                      isCliConnected={isCliConnected}
                      isFrontendConnected={
                        status === ConnectionStatus.CONNECTED
                      }
                    />
                  </StatusCard>
                );

              default:
                return null;
            }
          })()}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
          {(() => {
            switch (status) {
              case ConnectionStatus.CONNECTED:
                return (
                  <>
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white text-sm font-medium rounded transition-colors"
                    >
                      Continue
                    </button>
                    <button
                      onClick={handleDisconnect}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded transition-colors"
                    >
                      Disconnect
                    </button>
                  </>
                );
              case ConnectionStatus.DISCONNECTED:
                return;
              default:
                return (
                  <button
                    onClick={handleDisconnect}
                    className="px-4 py-2 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white text-sm font-medium rounded transition-colors"
                  >
                    Cancel
                  </button>
                );
            }
          })()}
        </div>
      </div>
    </div>
  );
}

function InstructionsSection() {
  return (
    // <div className="text-left bg-gray-800/50 rounded-lg p-4 mb-6">
    //   <h4 className="text-sm font-medium text-white mb-2">Steps:</h4>
    //   <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
    //     <li>Copy the command above</li>
    //     <li>Paste and run it in your terminal</li>
    //     <li>Click "Connect" below once the CLI is running</li>
    //   </ol>
    // </div>
    <></>
  );
}
