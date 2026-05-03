// src/context/VisibilityContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { componentRegistry, getDefaultVisibility } from '../config/ComponentRegistry';

const VisibilityContext = createContext();

export const useVisibility = () => {
  const context = useContext(VisibilityContext);
  if (!context) {
    throw new Error('useVisibility must be used within VisibilityProvider');
  }
  return context;
};


// To Do: and expose them in the context value object

export const VisibilityProvider = ({ children }) => {
  const [visibility, setVisibility] = useState(() => {
    const saved = localStorage.getItem('weatherWidgets');
    
    //console.log('=== VISIBILITY STATE INITIALIZATION ===');
    //console.log('Saved state from localStorage:', saved);
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        //console.log('Parsed saved state:', parsed);
        //console.log('Saved state keys:', Object.keys(parsed));
        //console.log('daylength in saved state:', parsed.daylength);
        
        const defaults = getDefaultVisibility();
        //console.log('Default visibility:', defaults);
        //console.log('Default state keys:', Object.keys(defaults));
        //console.log('daylength in defaults:', defaults.daylength);
        
        // Merge with defaults to handle new components
        const merged = { ...defaults, ...parsed };
        //console.log('Merged state:', merged);
        //console.log('Merged state keys:', Object.keys(merged));
        //console.log('daylength in merged state:', merged.daylength);
        
        return merged;
      } catch (error) {
        //console.error('Error parsing saved state:', error);
        const defaults = getDefaultVisibility();
        //console.log('Falling back to defaults after error:', defaults);
        return defaults;
      }
    }
    
    const defaults = getDefaultVisibility();
    //console.log('No saved state, using defaults:', defaults);
    //console.log('Default state keys:', Object.keys(defaults));
    //console.log('daylength in defaults:', defaults.daylength);
    return defaults;
  });

  const [isCustomizing, setIsCustomizing] = useState(false);

  // Debug: Log state after initialization
  useEffect(() => {
    //console.log('=== VISIBILITY STATE AFTER INIT ===');
    //console.log('Current visibility state:', visibility);
    //console.log('Current visibility keys:', Object.keys(visibility));
    //console.log('daylength in current state:', visibility.daylength);
  }, [visibility]);

  // Save to localStorage whenever visibility changes
  useEffect(() => {
    //console.log('=== SAVING TO LOCALSTORAGE ===');
    //console.log('Saving visibility state:', visibility);
    //console.log('daylength being saved:', visibility.daylength);
    localStorage.setItem('weatherWidgets', JSON.stringify(visibility));
  }, [visibility]);

  const toggleComponent = useCallback((componentId) => {
    //console.log('=== TOGGLE COMPONENT ===');
    //console.log('Toggling:', componentId);
    const component = componentRegistry.find(c => c.id === componentId);
    if (component?.required) {
      //console.log('Component is required, not toggling');
      return; // Don't toggle required components
    }
    
    setVisibility(prev => {
      const newState = {
        ...prev,
        [componentId]: !prev[componentId]
      };
      //console.log('New visibility state after toggle:', newState);
      return newState;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    //console.log('=== RESETTING TO DEFAULTS ===');
    const defaults = getDefaultVisibility();
    //console.log('Defaults:', defaults);
    setVisibility(defaults);
  }, []);

//  const oldsetAllOn = () => {
//    const toggleable = componentRegistry.filter(c => !c.required);
//    setVisibleComponents(prev => {
//      const currentIds = new Set(prev.map(v => v.id));
//      const toAdd = toggleable.filter(c => !currentIds.has(c.id));
//      return [...prev, ...toAdd];
//    });
//  };
//  
//  const oldsetAllOff = () => {
//    setVisibleComponents(prev => prev.filter(c => c.required));
//  };

  // Replace the existing setAllOn and setAllOff
  const setAllOn = useCallback(() => {
    setVisibility(prev => {
      const newState = { ...prev };
      componentRegistry.forEach(comp => {
        if (!comp.required) {
          newState[comp.id] = true;
        }
      });
      return newState;
    });
  }, [componentRegistry]);
  
  const setAllOff = useCallback(() => {
    setVisibility(prev => {
      const newState = { ...prev };
      componentRegistry.forEach(comp => {
        if (!comp.required) {
          newState[comp.id] = false;
        }
      });
      return newState;
    });
  }, [componentRegistry]);


  const isVisible = useCallback((componentId) => {
    //console.log(`=== IS VISIBLE CHECK: ${componentId} ===`);
    //console.log('Current visibility state:', visibility);
    //console.log('Value for this component:', visibility[componentId]);
    
    // If component not in registry, show it by default
    if (visibility[componentId] === undefined) {
      //console.log(`${componentId} is undefined in visibility state - returning true (shown by default)`);
      return true;
    }
    
    //console.log(`${componentId} is ${visibility[componentId]} - returning ${visibility[componentId]}`);
    return visibility[componentId];
  }, [visibility]);

  // Calculate which components are currently visible
  const visibleComponents = componentRegistry.filter(comp => {
    const isVis = visibility[comp.id];
    //console.log(`Component ${comp.id}: visible=${isVis}`);
    return isVis;
  });
  
  const hiddenComponents = componentRegistry.filter(comp => !visibility[comp.id]);

  //console.log('=== VISIBILITY SUMMARY ===');
  //console.log('Visible components:', visibleComponents.map(c => c.id));
  //console.log('Hidden components:', hiddenComponents.map(c => c.id));
  //console.log('Full visibility state:', visibility);

  const value = {
    visibility,
    isVisible,
    toggleComponent,
    resetToDefaults,
    setAllOn,
    setAllOff,
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
