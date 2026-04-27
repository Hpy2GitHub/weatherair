// src/context/VisibilityContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { componentRegistry, getDefaultVisibility } from '../config/componentRegistry';

const VisibilityContext = createContext();

export const useVisibility = () => {
  const context = useContext(VisibilityContext);
  if (!context) {
    throw new Error('useVisibility must be used within VisibilityProvider');
  }
  return context;
};

export const VisibilityProvider = ({ children }) => {
  const [visibility, setVisibility] = useState(() => {
    // Load saved preferences or use defaults
    const saved = localStorage.getItem('weatherWidgets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle new components
        return { ...getDefaultVisibility(), ...parsed };
      } catch {
        return getDefaultVisibility();
      }
    }
    return getDefaultVisibility();
  });

  const [isCustomizing, setIsCustomizing] = useState(false);

  // Save to localStorage whenever visibility changes
  useEffect(() => {
    localStorage.setItem('weatherWidgets', JSON.stringify(visibility));
  }, [visibility]);

  const toggleComponent = useCallback((componentId) => {
    const component = componentRegistry.find(c => c.id === componentId);
    if (component?.required) return; // Don't toggle required components
    
    setVisibility(prev => ({
      ...prev,
      [componentId]: !prev[componentId]
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setVisibility(getDefaultVisibility());
  }, []);

  const isVisible = useCallback((componentId) => {
    // If component not in registry, show it by default
    if (visibility[componentId] === undefined) {
      return true;
    }
    return visibility[componentId];
  }, [visibility]);

  // Calculate which components are currently visible
  const visibleComponents = componentRegistry.filter(comp => visibility[comp.id]);
  const hiddenComponents = componentRegistry.filter(comp => !visibility[comp.id]);

  const value = {
    visibility,
    isVisible,
    toggleComponent,
    resetToDefaults,
    isCustomizing,
    setIsCustomizing,
    visibleComponents,
    hiddenComponents,
    componentRegistry,
  };

  return (
    <VisibilityContext.Provider value={value}>
      {children}
    </VisibilityContext.Provider>
  );
};
