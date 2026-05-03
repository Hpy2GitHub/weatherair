// DebugContext.jsx
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

const DebugContext = createContext();

export const DebugProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const counterRef = useRef(0); // Add a counter for unique IDs

  const postMessage = useCallback((message, type = 'info') => {
    counterRef.current += 1; // Increment counter
    const newMessage = {
      id: `${Date.now()}-${counterRef.current}`, // Combine timestamp + counter
      timestamp: new Date().toISOString(),
      message,
      type,
    };
    setMessages(prev => [newMessage, ...prev].slice(0, 100));
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
