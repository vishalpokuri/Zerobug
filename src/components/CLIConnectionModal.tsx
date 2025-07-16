import { useWebSocketContext } from "../contexts/WebSocketContext";
import { ChevronLeft, CloseIcon, RetryIcon, TerminalIcon } from "../Svg/Icons";

import { getStatusIcon } from "../utils/utilityFunctions";

import { ConnectionStatus } from "../types/declarations";
import CodeBlock from "./ui/CodeBlock";
import type React from "react";

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
  subtitle: string;
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
  const { status, connect, disconnect, setStatus, retryCount } =
    useWebSocketContext();

  const backendPort = "3000"; // Default backend port, can be made configurable
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
                    title="CLI Connected"
                    subtitle="Successfully connected to your CLI application"
                  ></StatusCard>
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
    <div className="text-left bg-gray-800/50 rounded-lg p-4 mb-6">
      <h4 className="text-sm font-medium text-white mb-2">Steps:</h4>
      <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
        <li>Copy the command above</li>
        <li>Paste and run it in your terminal</li>
        <li>Click "Connect" below once the CLI is running</li>
      </ol>
    </div>
  );
}
