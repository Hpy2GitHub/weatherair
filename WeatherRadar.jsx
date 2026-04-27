// WeatherRadar.jsx
import { useEffect, useRef, useState, useCallback } from 'react';
import './WeatherRadar.css';

// ... (keep LAYERS constant as is) ...

let leafletReady = false;
let leafletCallbacks = [];

function loadLeaflet(onReady) {
  if (leafletReady) { onReady(); return; }
  leafletCallbacks.push(onReady);
  if (leafletCallbacks.length > 1) return;

  const link = document.createElement('link');
  link.rel  = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);

  const script = document.createElement('script');
  script.src   = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
  script.onload = () => {
    leafletReady = true;
    leafletCallbacks.forEach((cb) => cb());
    leafletCallbacks = [];
  };
  document.head.appendChild(script);
}

export default function WeatherRadar({ lat, lon }) {
  const containerRef  = useRef(null);
  const mapRef        = useRef(null);
  const radarLayerRef = useRef(null);
  const markerRef     = useRef(null);
  const [activeLayer, setActiveLayer] = useState('reflectivity');
  const [ready, setReady] = useState(false);

  // Guard: Don't initialize if lat/lon are undefined
  const hasValidCoords = lat != null && lon != null;

  const initMap = useCallback(() => {
    // Additional guard
    if (!containerRef.current || mapRef.current || !hasValidCoords) return;
    
    const L = window.L;
    if (!L) return;

    try {
      const map = L.map(containerRef.current, {
        center:      [lat, lon],
        zoom:        7,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        { maxZoom: 19, subdomains: 'abcd' }
      ).addTo(map);

      const layer = LAYERS.find((l) => l.id === 'reflectivity');
      radarLayerRef.current = L.tileLayer(layer.url, {
        opacity: layer.opacity,
        tileSize: 256,
      }).addTo(map);

      markerRef.current = L.circle([lat, lon], {
        radius:      800,
        color:       '#60a5fa',
        weight:      2,
        fillColor:   '#60a5fa',
        fillOpacity: 0.15,
      }).addTo(map);

      mapRef.current = map;
      setReady(true);
    } catch (err) {
      console.error('Failed to initialize map:', err);
    }
  }, [lat, lon, hasValidCoords]);

  useEffect(() => {
    if (!hasValidCoords) return;
    
    loadLeaflet(initMap);
    
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current        = null;
        radarLayerRef.current = null;
        markerRef.current     = null;
        setReady(false);
      }
    };
  }, [initMap, hasValidCoords]);

  // Re-center when location changes
  useEffect(() => {
    if (!mapRef.current || !hasValidCoords) return;
    const L = window.L;
    
    mapRef.current.setView([lat, lon], mapRef.current.getZoom(), { animate: true });

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lon]);
    } else {
      markerRef.current = L.circle([lat, lon], {
        radius:      800,
        color:       '#60a5fa',
        weight:      2,
        fillColor:   '#60a5fa',
        fillOpacity: 0.15,
      }).addTo(mapRef.current);
    }
  }, [lat, lon, hasValidCoords]);

  // Swap radar layer when toggle changes
  useEffect(() => {
    if (!mapRef.current || !ready) return;
    const L = window.L;

    if (radarLayerRef.current) {
      mapRef.current.removeLayer(radarLayerRef.current);
    }

    const layer = LAYERS.find((l) => l.id === activeLayer);
    radarLayerRef.current = L.tileLayer(layer.url, {
      opacity: layer.opacity,
      tileSize: 256,
    }).addTo(mapRef.current);
  }, [activeLayer, ready]);

  const currentLayerMeta = LAYERS.find((l) => l.id === activeLayer);

  // Don't render map container if no valid coordinates
  if (!hasValidCoords) {
    return (
      <section className="card radar-card fade-in-4">
        <div className="radar-header">
          <p className="section-label" style={{ marginBottom: 0 }}>Weather Radar</p>
        </div>
        <div style={{ 
          padding: '40px 20px', 
          textAlign: 'center', 
          color: 'rgba(255,255,255,0.3)',
          fontSize: '12px'
        }}>
          Waiting for location data...
        </div>
      </section>
    );
  }

  return (
    <section className="card radar-card fade-in-4">
      <div className="radar-header">
        <p className="section-label" style={{ marginBottom: 0 }}>Weather Radar</p>
        <div className="radar-layer-toggle">
          {LAYERS.map((layer) => (
            <button
              key={layer.id}
              className={`radar-toggle-btn${activeLayer === layer.id ? ' active' : ''}`}
              onClick={() => setActiveLayer(layer.id)}
            >
              {layer.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={containerRef} className="radar-map" />

      <p className="radar-attribution">
        {currentLayerMeta.attribution}
        <span className="radar-refresh">· ~5 min refresh</span>
      </p>
    </section>
  );
}
