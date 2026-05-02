// WeatherRadar.jsx
import { useEffect, useRef, useState, useCallback } from 'react';

// Radar layer definitions
const LAYERS = [
  {
    id: 'reflectivity',
    label: 'Reflectivity',
    url: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0q-900913/{z}/{x}/{y}.png',
    attribution: 'NOAA/NWS NEXRAD · Iowa Environmental Mesonet',
    opacity: 0.75,
  },
  {
    id: 'velocity',
    label: 'Velocity',
    url: 'https://mesonet.agron.iastate.edu/cache/tile.py/1.0.0/nexrad-n0v-900913/{z}/{x}/{y}.png',
    attribution: 'NOAA/NWS NEXRAD · Iowa Environmental Mesonet',
    opacity: 0.75,
  },
];

// CDN loader
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
  
  // Store lat/lon in refs so initMap always reads current values
  const latRef = useRef(lat);
  const lonRef = useRef(lon);
  latRef.current = lat;
  lonRef.current = lon;

  const initMap = useCallback(() => {
    if (!containerRef.current || mapRef.current) return;
    
    const L = window.L;
    if (!L) return;
    
    // Read current values from refs
    const currentLat = latRef.current;
    const currentLon = lonRef.current;
    
    if (currentLat == null || currentLon == null) {
      console.warn('WeatherRadar: Coordinates not yet available, skipping map init');
      return;
    }

    try {
      const map = L.map(containerRef.current, {
        center:      [currentLat, currentLon],
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

      markerRef.current = L.circle([currentLat, currentLon], {
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
  }, []); // Empty deps - uses refs for current values

  useEffect(() => {
    // Only load Leaflet once lat/lon are available
    if (lat == null || lon == null) return;
    
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
  }, [initMap, lat, lon]); // Re-run when coordinates first become available

  // Re-center when location changes
  useEffect(() => {
    if (!mapRef.current || lat == null || lon == null) return;
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
  }, [lat, lon]);

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

  if (lat == null || lon == null) {
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
