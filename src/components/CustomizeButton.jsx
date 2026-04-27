// src/components/CustomizeButton.jsx
import React from 'react';
import { useVisibility } from '../context/VisibilityContext';

const CustomizeButton = () => {
  const { setIsCustomizing } = useVisibility();

  return (
    <button 
      className="customize-trigger"
      onClick={() => setIsCustomizing(true)}
      title="Customize dashboard"
    >
      ⚙
    </button>
  );
};

export default CustomizeButton;
