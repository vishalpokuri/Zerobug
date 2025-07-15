import { useState, useEffect } from "react";
import { useWebSocketConnection } from "../hooks/useWebSocketConnection";
import { CloseIcon, TerminalIcon, CheckIcon, CopyIcon } from "../Svg/Icons";

import {
  getStatusColor,
  getStatusIcon,
  getStatusText,
} from "../utils/utilityFunctions";

import { ConnectionStatus } from "../types/declarations";

interface CLIConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: string;
}

export function CLIConnectionModal({
  isOpen,
  onClose,
  projectId = "your-project",
}: CLIConnectionModalProps) {
  const { status, connect, disconnect, setStatus } = useWebSocketConnection({
    id: projectId,
  });
  const [showModal, setShowModal] = useState(isOpen);
  const [copied, setCopied] = useState(false);

  const backendPort = "3000"; // Default backend port, can be made configurable
  const command = `zerobug sniff --id=${projectId} --backend=${backendPort}`;

  useEffect(() => {
    console.log("status: ", status);
  }, [status]);

  useEffect(() => {
    setShowModal(isOpen);
  }, [isOpen]);

  const handleConnect = () => {
    connect();
  };

  const handleCopyCommand = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy command:", err);
    }
  };

  const handleClose = () => {
    disconnect();
    setShowModal(false);
    onClose();
  };

  if (!showModal) return null;

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
          {status === ConnectionStatus.DISCONNECTED ||
          status === ConnectionStatus.ERROR ? (
            // Step 1: Show CLI Command
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
                  Run this command in your terminal to start the CLI application
                </p>
              </div>

              {/* CLI Command to copy*/}
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 font-mono">
                    Terminal Command
                  </span>
                  <button
                    onClick={handleCopyCommand}
                    className="text-xs text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                  >
                    {copied ? (
                      <>
                        <CheckIcon />
                        Copied!
                      </>
                    ) : (
                      <>
                        <CopyIcon />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <code className="text-white font-mono text-sm break-all select-all">
                  {command}
                </code>
              </div>

              {/* Instructions */}
              <div className="text-left bg-gray-800/50 rounded-lg p-4 mb-6">
                <h4 className="text-sm font-medium text-white mb-2">Steps:</h4>
                <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
                  <li>Copy the command above</li>
                  <li>Paste and run it in your terminal</li>
                  <li>Click "Connect" below once the CLI is running</li>
                </ol>
              </div>

              <button
                onClick={handleConnect}
                className="w-full px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded transition-colors"
              >
                Connect to CLI
              </button>
            </div>
          ) : (
            // Step 2: Show Connection Status
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center">
                  {getStatusIcon(status)}
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Connecting to CLI
                </h3>
                <p className="text-gray-400 text-sm">
                  Attempting to establish WebSocket connection on port 9229
                </p>
              </div>

              {/* Connection Status */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  {getStatusIcon(status)}
                  <span className={`font-medium ${getStatusColor(status)}`}>
                    {getStatusText(status)}
                  </span>
                </div>

                {status === ConnectionStatus.CONNECTING && (
                  <div className="mt-3">
                    <div className="text-xs text-gray-500 mb-2">
                      Retrying every 3 seconds...
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1">
                      <div className="bg-yellow-400 h-1 rounded-full animate-pulse w-1/2"></div>
                    </div>
                  </div>
                )}

                {status === ConnectionStatus.CONNECTED && (
                  <div className="mt-3">
                    <div className="text-xs text-green-400">
                      ✓ Connection established successfully
                    </div>
                  </div>
                )}

                {/* {status === ConnectionStatus.ERROR && ( */}
                {false && (
                  <div className="mt-3">
                    <div className="text-xs text-red-400 mb-3">
                      Unable to connect. Make sure your CLI application is
                      running.
                    </div>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => setStatus(ConnectionStatus.DISCONNECTED)}
                        className="px-3 py-1 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white text-xs font-medium rounded transition-colors"
                      >
                        Back to Command
                      </button>
                      <button
                        onClick={handleConnect}
                        className="px-3 py-1 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-xs font-medium rounded transition-colors"
                      >
                        Retry Connection
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-700">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white text-sm font-medium rounded transition-colors"
          >
            Close
          </button>
          {status === ConnectionStatus.CONNECTED && (
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 text-sm font-medium rounded transition-colors"
            >
              Continue
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
