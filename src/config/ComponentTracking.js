// src/config/componentTracking.js
// Holds the set of componentIds actually rendered by ConditionalRenderer.
// Kept in its own module so ComponentRegistry and ConditionalRenderer
// can both import it without creating a circular dependency.
export const usedComponentIds = new Set();
