import { useState, useEffect, useRef, useCallback } from "react";
import { ConnectionStatus } from "../types/declarations";

interface UseWebSocketConnectionReturn {
  status: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: string) => void;
  lastMessage: string | null;
  setStatus: (status: ConnectionStatus) => void;
  retryCount: number;
  isConnected: boolean;
  backendPort: string;
  setBackendPort: (port: string) => void;
  isCliConnected: boolean;
}

interface useWSProps {
  id: string;
  frontend?: string;
  backend?: string;
}

export function useWebSocketConnection({
  id,
}: useWSProps): UseWebSocketConnectionReturn {
  // Use backend relay instead of localhost
  const baseUrl = import.meta.env.PROD
    ? "wss://backend.canum.xyz/api3/ws"
    : "ws://localhost:3401/ws";
  const projectIdParam = id ? `projectId=${id}` : "";
  const typeParam = "type=frontend";
  const url = `${baseUrl}?${projectIdParam}&${typeParam}`;

  const [status, setStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  );
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [backendPort, setBackendPort] = useState<string>("3000");
  const [isCliConnected, setIsCliConnected] = useState<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);
  const isManualDisconnect = useRef<boolean>(false);
  const maxRetries = 3;
  const retryInterval = 3000;

  //removes existing Timer and ws stored in refs.
  const cleanup = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const attemptRetry = useCallback(
    (attempt: number) => {
      setRetryCount((prev) => prev + 1);
      if (attempt > maxRetries) {
        console.log("Max retries reached. Connection failed.");
        setStatus(ConnectionStatus.ERROR);
        return;
      }

      setStatus(ConnectionStatus.CONNECTING);
      console.log(`Retry attempt ${attempt}/${maxRetries}...`);
      setTimeout(() => {
        try {
          const retryWs = new WebSocket(url);
          wsRef.current = retryWs;

          retryWs.onopen = () => {
            // When WebSocket connects, we're waiting for CLI to connect
            setStatus(ConnectionStatus.WAITING_FOR_CLI);
            console.log("WebSocket connected to relay server, waiting for CLI");
            return;
          };

          retryWs.onmessage = (event) => {
            setLastMessage(event.data);
            // Handle CLI status messages
            try {
              const message = JSON.parse(event.data);
              if (message.type === 'cli_connected') {
                setIsCliConnected(true);
                setStatus(ConnectionStatus.CONNECTED);
              } else if (message.type === 'cli_disconnected') {
                setIsCliConnected(false);
                setStatus(ConnectionStatus.WAITING_FOR_CLI);
              }
            } catch (e) {
              // Ignore invalid JSON
            }
          };

          retryWs.onclose = (retryEvent) => {
            wsRef.current = null;

            // If it's a manual disconnect, don't retry
            if (isManualDisconnect.current) {
              isManualDisconnect.current = false;
              setStatus(ConnectionStatus.DISCONNECTED);
              return;
            }

            // Only retry on network failures, not server rejections
            if (retryEvent.code !== 1000 && retryEvent.code !== 1008) {
              // Network failure - retry
              attemptRetry(attempt + 1);
            } else if (retryEvent.code === 1008) {
              // Server rejected connection (instance already running, etc.)
              console.log("Server rejected connection:", retryEvent.reason);
              setStatus(ConnectionStatus.INSTANCE_ALREADY_RUNNING);
            } else {
              // Clean disconnect (code: 1000)
              setStatus(ConnectionStatus.DISCONNECTED);
            }
          };

          retryWs.onerror = () => {
            // Error will trigger onclose, let that handle the retry
          };
        } catch (error) {
          console.error("Failed to create WebSocket connection:", error);
          attemptRetry(attempt + 1);
        }
      }, retryInterval);
    },
    [url]
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    cleanup();
    isManualDisconnect.current = false; // Reset manual disconnect flag
    setStatus(ConnectionStatus.CONNECTING);

    try {
      setRetryCount(0);
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        // When WebSocket connects, we're waiting for CLI to connect
        setStatus(ConnectionStatus.WAITING_FOR_CLI);
        console.log("WebSocket connected to relay server, waiting for CLI");
        return;
      };

      ws.onmessage = (event) => {
        setLastMessage(event.data);
        // Handle CLI status messages
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'cli_connected') {
            setIsCliConnected(true);
            setStatus(ConnectionStatus.CONNECTED);
          } else if (message.type === 'cli_disconnected') {
            setIsCliConnected(false);
            setStatus(ConnectionStatus.WAITING_FOR_CLI);
          }
        } catch (e) {
          // Ignore invalid JSON
        }
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        wsRef.current = null;

        // If it's a manual disconnect, don't retry
        if (isManualDisconnect.current) {
          isManualDisconnect.current = false;
          setStatus(ConnectionStatus.DISCONNECTED);
          return;
        }

        // Only retry on network failures, not server rejections
        if (event.code !== 1000 && event.code !== 1008) {
          // Network failure - start retry sequence
          attemptRetry(1);
        } else if (event.code === 1008) {
          // Server rejected connection (instance already running, etc.)
          console.log("Server rejected connection:", event.reason);
          setStatus(ConnectionStatus.INSTANCE_ALREADY_RUNNING);
        } else {
          // Clean disconnect (code 1000)
          setStatus(ConnectionStatus.DISCONNECTED);
        }
      };

      // ws.onerror = (error) => {
      //   console.error("WebSocket error occurred:", error);
      //   // Don't immediately set to ERROR, let onclose handle it
      // };
    } catch (error) {
      setStatus(ConnectionStatus.ERROR);
      console.error("Failed to create WebSocket connection:", error);
    }
  }, [url, cleanup]);

  const disconnect = useCallback(() => {
    isManualDisconnect.current = true;
    setRetryCount(0); // Reset retry count on manual disconnect
    cleanup();
    console.log("cleanup called from disconnect fn");
    setStatus(ConnectionStatus.DISCONNECTED);
  }, [cleanup]);

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    } else {
      console.warn("WebSocket is not connected. Cannot send message.");
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    status,
    connect,
    disconnect,
    sendMessage,
    lastMessage,
    setStatus,
    retryCount,
    isConnected: status === ConnectionStatus.CONNECTED,
    backendPort,
    setBackendPort,
    isCliConnected,
  };
}
export { ConnectionStatus };
