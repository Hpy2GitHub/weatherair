// src/components/ConditionalRenderer.jsx
import { useVisibility } from '../context/VisibilityContext';

/**
 * Wrapper component that conditionally renders children
 * based on the component's visibility setting.
 * 
 * Usage:
 * <ConditionalRenderer componentId="hero">
 *   <HeroSection data={weatherData} />
 * </ConditionalRenderer>
 */
const ConditionalRenderer = ({ componentId, children, fallback = null }) => {
  const { isVisible } = useVisibility();
  const visible = isVisible(componentId);
  console.log(`Component ${componentId}:`, visible); // Debug line
  
  if (!isVisible(componentId)) {
    return fallback;
  }
  
  return children;
};

export default ConditionalRenderer;
