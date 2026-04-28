import { useEffect, useMemo, useState } from 'react';

const DEFAULT_DEBUG = true;

function getDebugFlag(debugOverride) {
  if (typeof debugOverride === 'boolean') return debugOverride;

  const viteFlag = typeof import.meta !== 'undefined' ? import.meta.env?.VITE_LIGHTNING_DEBUG : undefined;
  const craFlag = typeof process !== 'undefined' ? process.env?.REACT_APP_LIGHTNING_DEBUG : undefined;
  const raw = viteFlag ?? craFlag;

  if (raw == null) return DEFAULT_DEBUG;
  return String(raw).toLowerCase() === 'true';
}

function milesToKm(miles) {
  return miles * 1.60934;
}

function offsetLatMiles(lat, miles) {
  return lat + miles / 69;
}

function offsetLonMiles(lat, lon, miles) {
  const cosLat = Math.cos((lat * Math.PI) / 180);
  const safeDivisor = Math.abs(cosLat) < 0.0001 ? 0.0001 : cosLat;
  return lon + miles / (69.172 * safeDivisor);
}

function buildDummyStrikes(lat, lon) {
  const now = Date.now();

  return [
    {
      id: 'debug-strike-1',
      lat: offsetLatMiles(lat, 1.2),
      lon: offsetLonMiles(lat, lon, 0.8),
      timestamp: new Date(now - 2 * 60 * 1000).toISOString(),
      timestamp_unix: Math.floor((now - 2 * 60 * 1000) / 1000),
      distance_miles: 1.5,
      distance_km: Number(milesToKm(1.5).toFixed(2)),
      bearing_deg: 35,
      energy: 18200,
      region: 'Debug Cell North',
    },
    {
      id: 'debug-strike-2',
      lat: offsetLatMiles(lat, -2.3),
      lon: offsetLonMiles(lat, lon, 1.1),
      timestamp: new Date(now - 8 * 60 * 1000).toISOString(),
      timestamp_unix: Math.floor((now - 8 * 60 * 1000) / 1000),
      distance_miles: 2.9,
      distance_km: Number(milesToKm(2.9).toFixed(2)),
      bearing_deg: 160,
      energy: 24100,
      region: 'Debug Cell Southeast',
    },
    {
      id: 'debug-strike-3',
      lat: offsetLatMiles(lat, 3.9),
      lon: offsetLonMiles(lat, lon, -1.7),
      timestamp: new Date(now - 14 * 60 * 1000).toISOString(),
      timestamp_unix: Math.floor((now - 14 * 60 * 1000) / 1000),
      distance_miles: 4.7,
      distance_km: Number(milesToKm(4.7).toFixed(2)),
      bearing_deg: 310,
      energy: 12700,
      region: 'Debug Cell Northwest',
    },
  ];
}

export default function useLightning({
  lat,
  lon,
  radiusMiles = 5,
  enabled = true,
  debug,
  proxyUrl = '/api/lightning',
}) {
  const [strikes, setStrikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDebug, setIsDebug] = useState(false);

  useEffect(() => {
    if (!enabled || typeof lat !== 'number' || typeof lon !== 'number') {
      setStrikes([]);
      setLoading(false);
      setError('');
      setIsDebug(false);
      return;
    }

    const useDebug = getDebugFlag(debug);
    setIsDebug(useDebug);

    if (useDebug) {
      setLoading(false);
      setError('');
      setStrikes(buildDummyStrikes(lat, lon));
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        setLoading(true);
        setError('');

        const params = new URLSearchParams({
          lat: String(lat),
          lon: String(lon),
          radius: String(milesToKm(radiusMiles).toFixed(2)),
          limit: '10',
        });

        const res = await fetch(`${proxyUrl}?${params.toString()}`);
        if (!res.ok) throw new Error(`Request failed: ${res.status}`);

        const json = await res.json();
        const next = Array.isArray(json) ? json : json?.strikes || [];

        if (!cancelled) {
          setStrikes(next);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load lightning data');
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [lat, lon, radiusMiles, enabled, debug, proxyUrl]);

  const nearestStrike = useMemo(() => {
    if (!strikes.length) return null;
    return [...strikes].sort((a, b) => {
      const aMiles = a.distance_miles ?? (a.distance_km != null ? a.distance_km / 1.60934 : Infinity);
      const bMiles = b.distance_miles ?? (b.distance_km != null ? b.distance_km / 1.60934 : Infinity);
      return aMiles - bMiles;
    })[0];
  }, [strikes]);

  return {
    strikes,
    nearestStrike,
    loading,
    error,
    isDebug,
  };
}
