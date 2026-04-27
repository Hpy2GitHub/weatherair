// DebugComponet.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const DebugContext = createContext();

export const DebugProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  const postMessage = useCallback((message, type = 'info') => {
    const newMessage = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      message,
      type, // 'info', 'warn', 'error', 'debug'
    };
    setMessages(prev => [newMessage, ...prev].slice(0, 100)); // Keep last 100
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <DebugContext.Provider value={{ messages, postMessage, clearMessages }}>
      {children}
    </DebugContext.Provider>
  );
};

export const useDebug = () => {
  const context = useContext(DebugContext);
  if (!context) {
    throw new Error('useDebug must be used within DebugProvider');
  }
  return context;
};
