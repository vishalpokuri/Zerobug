import { useState, useEffect, useRef, useCallback } from "react";
import { ConnectionStatus } from "../types/declarations";

interface UseWebSocketConnectionReturn {
  status: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: string) => void;
  lastMessage: string | null;
  setStatus: (status: ConnectionStatus) => void;
}

interface useWSProps {
  id: string;
  frontend?: string;
  backend?: string;
}

export function useWebSocketConnection({
  id,
  frontend,
  backend,
}: useWSProps): UseWebSocketConnectionReturn {
  let baseUrl = "ws://localhost:9229";
  let idString = id ? `id=${id}` : "";
  let frontendString = frontend ? `&frontend=${frontend}` : "";
  let backendString = backend ? `&backend=${backend}` : "";
  let url = `${baseUrl}?${idString}${frontendString}${backendString}`;

  const [status, setStatus] = useState<ConnectionStatus>(
    ConnectionStatus.DISCONNECTED
  );
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
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
            setStatus(ConnectionStatus.CONNECTED);
            console.log("WebSocket connected to CLI application");
            return;
          };

          retryWs.onmessage = (event) => {
            setLastMessage(event.data);
          };

          retryWs.onclose = (retryEvent) => {
            wsRef.current = null;

            // Only retry on network failures, not server rejections
            if (retryEvent.code !== 1000 && retryEvent.code !== 1008) {
              // Network failure - retry
              attemptRetry(attempt + 1);
            } else if (retryEvent.code === 1008) {
              // Server rejected connection (invalid project ID, etc.)
              console.log("Server rejected connection:", retryEvent.reason);
              setStatus(ConnectionStatus.ERROR);
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
    setStatus(ConnectionStatus.CONNECTING);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus(ConnectionStatus.CONNECTED);
        console.log("WebSocket connected to CLI application");
        return;
      };

      ws.onmessage = (event) => {
        setLastMessage(event.data);
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
        });
        wsRef.current = null;

        // Only retry on network failures, not server rejections
        if (event.code !== 1000 && event.code !== 1008) {
          // Network failure - start retry sequence
          attemptRetry(1);
        } else if (event.code === 1008) {
          // Server rejected connection (invalid project ID, etc.)
          console.log("Server rejected connection:", event.reason);
          setStatus(ConnectionStatus.ERROR);
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
    cleanup();
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
  }, []);

  return {
    status,
    connect,
    disconnect,
    sendMessage,
    lastMessage,
    setStatus,
  };
}
export { ConnectionStatus };
