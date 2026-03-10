"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import io, { Socket } from "socket.io-client";

interface SocketHook {
  isConnected: boolean;
  sendMessage: <T>(event: string, data: T) => void;
  subscribeToEvent: <T>(event: string, callback: (data: T) => void) => void;
  unsubscribeFromEvent: <T>(event: string, callback: (data: T) => void) => void;
  socket: Socket | null;
}

const useSocketIO = (url: string): SocketHook => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    socketRef.current = io(url, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      path: "/ws/socket.io"
    });

    socketRef.current.on("connect", () => {
      setIsConnected(true);
    });

    socketRef.current.on("disconnect", () => {
      console.debug("DEBUG WebSocket disconnected");
      setIsConnected(false);
    });

    socketRef.current.on("error", (error: Error) => {
      console.error("DEBUG WebSocket error:", error);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [url]);

  const sendMessage = useCallback(<T>(event: string, data: T): void => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const subscribeToEvent = useCallback(
    <T>(event: string, callback: (data: T) => void): void => {
      if (socketRef.current) {
        socketRef.current.on(event, callback);
      }
    },
    []
  );

  const unsubscribeFromEvent = useCallback(
    <T>(event: string, callback: (data: T) => void): void => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    },
    []
  );

  return {
    isConnected,
    sendMessage,
    subscribeToEvent,
    unsubscribeFromEvent,
    socket: socketRef.current
  };
};

export default useSocketIO;