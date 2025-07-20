import { createContext, useContext, type ReactNode } from "react";
import { useWebSocketConnection } from "../hooks/useWebSocketConnection";
import { ConnectionStatus } from "../types/declarations";

interface WebSocketContextType {
  status: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;
  sendMessage: (message: string) => void;
  lastMessage: string | null;
  setStatus: (status: ConnectionStatus) => void;
  retryCount: number;
  isConnected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(
  undefined
);

interface WebSocketProviderProps {
  children: ReactNode;
  projectId: string;
  frontend?: string;
  backend?: string;
}

export function WebSocketProvider({
  children,
  projectId,
  frontend,
  backend,
}: WebSocketProviderProps) {
  const websocketConnection = useWebSocketConnection({
    id: projectId,
    frontend,
    backend,
  });

  return (
    <WebSocketContext.Provider value={websocketConnection}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext(): WebSocketContextType {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error(
      "useWebSocketContext must be used within a WebSocketProvider"
    );
  }
  return context;
}
