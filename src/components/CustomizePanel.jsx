// src/components/CustomizePanel.jsx
import React from 'react';
import { useVisibility } from '../context/VisibilityContext';
import { useWeatherData } from '../hooks/useWeatherData';
//import './CustomizePanel.css';
import '../design-system.css';

const CustomizePanel = () => {
  const { 
    isCustomizing, 
    setIsCustomizing,
    componentRegistry,
    visibleComponents,
    toggleComponent,
    resetToDefaults
  } = useVisibility();
  
  const { fetchWeather, coords, phase } = useWeatherData();

  if (!isCustomizing) return null;

  const categorized = componentRegistry.filter(comp => !comp.required).reduce((acc, comp) => {
    const category = comp.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(comp);
    return acc;
  }, {});

  const handleRefresh = () => {
    if (coords && coords.lat && coords.lon) {
      fetchWeather(coords.lat, coords.lon);
      // Optional: close panel or show feedback
      // setIsCustomizing(false);
    }
  };

  return (
    <div className="customize-overlay">
      <div className="customize-panel fade-in">
        <div className="customize-header">
          <h2 className="customize-title">Customize Dashboard</h2>
          <button 
            className="customize-close"
            onClick={() => setIsCustomizing(false)}
          >
            ✕
          </button>
        </div>

        <div className="customize-content">
          {Object.entries(categorized).map(([category, components]) => (
            <div key={category} className="customize-category">
              <h3 className="category-title">{category}</h3>
              <div className="component-list">
                {components.map(comp => (
                  <label key={comp.id} className={`component-item ${comp.required ? 'required' : ''}`}>
                    <div className="component-info">
                      <span className="component-name">{comp.name}</span>
                      <span className="component-desc">{comp.description}</span>
                    </div>
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={visibleComponents.some(v => v.id === comp.id)}
                        onChange={() => toggleComponent(comp.id)}
                        disabled={comp.required}
                      />
                      <span className="toggle-slider"></span>
                    </div>
                    {comp.required && (
                      <span className="required-badge">Required</span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="customize-footer">
          <div className="visibility-stats">
            {visibleComponents.length} of {componentRegistry.filter(comp => !comp.required).length} components visible
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              className="reset-btn" 
              onClick={handleRefresh}
              disabled={phase === 'loading'}
            >
              {phase === 'loading' ? '⟳ Loading...' : '↻ Refresh Data'}
            </button>
            <button className="close" onClick={resetToDefaults}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizePanel;
