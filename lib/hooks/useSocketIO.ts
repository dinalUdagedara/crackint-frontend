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

/**
 * Connects only when an access token is available; the backend refuses
 * unauthenticated sockets. Reconnects when the token changes.
 */
const useSocketIO = (url: string, token?: string): SocketHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    socketRef.current = io(url, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      path: "/ws/socket.io"
    });

    const current = socketRef.current;
    current.on("connect", () => {
      setIsConnected(true);
      setSocket(current);
    });

    socketRef.current.on("disconnect", () => {
      console.debug("DEBUG WebSocket disconnected");
      setIsConnected(false);
    });

    socketRef.current.on("error", (error: Error) => {
      console.error("DEBUG WebSocket error:", error);
    });

    socketRef.current.on("connect_error", (error: Error) => {
      console.error("DEBUG WebSocket connect error:", error.message);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      setIsConnected(false);
      setSocket(null);
    };
  }, [url, token]);

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
    socket
  };
};

export default useSocketIO;