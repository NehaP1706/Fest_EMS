import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) {
      if (socket) {
        console.log('Disconnecting socket (no token)');
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
      return;
    }


    const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
    
    console.log('Connecting to Socket.IO server:', API_URL);
    
    const newSocket = io(API_URL, {
      auth: { token },
      transports: ['websocket', 'polling'], 
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    newSocket.on('connect', () => {
      console.log('Socket.IO connected:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      setConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket.IO reconnected after', attemptNumber, 'attempts');
      setConnected(true);
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Socket.IO reconnection attempt', attemptNumber);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error.message);
    });

    newSocket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after maximum attempts');
      setConnected(false);
    });

    setSocket(newSocket);

    return () => {
      console.log('Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, [token]);

  const value = {
    socket,
    connected,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};