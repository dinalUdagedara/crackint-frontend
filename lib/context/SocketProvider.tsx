'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import useSocketIO from '@/lib/hooks/useSocketIO';
import { Socket } from 'socket.io-client';

interface SocketContextType {
  isConnected: boolean;
  sendMessage: <T>(event: string, data: T) => void;
  subscribeToEvent: <T>(event: string, callback: (data: T) => void) => void;
  unsubscribeFromEvent: <T>(event: string, callback: (data: T) => void) => void;
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

interface SocketProviderProps {
  children: ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  // Hardcode the default backend URL if env is not provided (standard local is 8000)
  const socketIO = useSocketIO(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');

  return (
    <SocketContext.Provider value={socketIO}>
      {children}
    </SocketContext.Provider>
  );
};