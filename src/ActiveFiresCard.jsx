/**
 * ActiveFiresCard.jsx
 *
 * Replaces the iframe-based map card with real data from NIFC's public
 * ArcGIS feature service — no API key required.
 *
 * Data source:
 *   ESRI Living Atlas / NIFC USA_Wildfires_v1 (point layer)
 *   https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/USA_Wildfires_v1/FeatureServer/0
 *
 * Props:
 *   lat  {number}  User latitude
 *   lon  {number}  User longitude
 */

import { useState, useEffect } from 'react';

// ── Constants ────────────────────────────────────────────────────────────────

const NIFC_URL =
  'https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/' +
  'USA_Wildfires_v1/FeatureServer/0/query';

const FIELDS =
  'IncidentName,IncidentTypeCategory,UniqueFireIdentifier,' +
  'DailyAcres,PercentContained,FireDiscoveryDateTime,FireDiscoveryAge';

const MAX_SHOWN = 6;
const DISTANCE_OPTIONS = [50, 100, 500];
const DEFAULT_DISTANCE = 500;

// ── Utilities ────────────────────────────────────────────────────────────────

/** Haversine great-circle distance in miles */
function distanceMi(lat1, lon1, lat2, lon2) {
  const R = 3_958.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function fmtAcres(acres) {
  if (acres == null || isNaN(acres)) return '—';
  if (acres >= 1_000_000) return `${(acres / 1_000_000).toFixed(1)}M ac`;
  if (acres >= 1_000) return `${Math.round(acres / 1_000)}k ac`;
  return `${Math.round(acres).toLocaleString()} ac`;
}

function fmtDistance(mi) {
  if (mi == null) return '—';
  return mi < 10 ? `${mi.toFixed(1)} mi` : `${Math.round(mi)} mi`;
}

function fmtAge(discoveryMs) {
  if (!discoveryMs) return null;
  const days = Math.floor((Date.now() - discoveryMs) / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  return `${days}d ago`;
}

function typeLabel(cat) {
  if (cat === 'WF') return 'Wildfire';
  if (cat === 'RX') return 'Prescribed';
  if (cat === 'CX') return 'Complex';
  return cat ?? '—';
}

function containedColor(pct) {
  if (pct == null) return 'var(--muted)';
  if (pct >= 75) return '#4ade80';
  if (pct >= 40) return '#fbbf24';
  return '#f97316';
}

// ── Sub-components ───────────────────────────────────────────────────────────

function FireRow({ fire, userLat, userLon }) {
  const dist = fmtDistance(distanceMi(userLat, userLon, fire.lat, fire.lon));
  const pct = fire.PercentContained;
  const pctStr = pct != null ? `${Math.round(pct)}%` : '—';

  return (
    <div className="afire-row">
      <div className="afire-row__main">
        <span className="afire-name">
          {fire.IncidentName
            ? fire.IncidentName.replace(/\bFIRE\b/gi, 'Fire')
            : 'Unnamed Fire'}
        </span>
        <span className="afire-meta">
          <span className="afire-badge afire-badge--type">
            {typeLabel(fire.IncidentTypeCategory)}
          </span>
          {fire.FireDiscoveryAge === 0 && (
            <span className="afire-badge afire-badge--new">New</span>
          )}
        </span>
      </div>

      <div className="afire-row__stats">
        <span className="afire-stat">
          <span className="afire-stat__label">Distance</span>
          <strong>{dist}</strong>
        </span>
        <span className="afire-stat">
          <span className="afire-stat__label">Size</span>
          <strong>{fmtAcres(fire.DailyAcres)}</strong>
        </span>
        <span className="afire-stat">
          <span className="afire-stat__label">Contained</span>
          <strong style={{ color: containedColor(pct) }}>{pctStr}</strong>
        </span>
        {fmtAge(fire.FireDiscoveryDateTime) && (
          <span className="afire-stat">
            <span className="afire-stat__label">Started</span>
            <strong>{fmtAge(fire.FireDiscoveryDateTime)}</strong>
          </span>
        )}
      </div>
    </div>
  );
}

function DistanceToggle({ selected, onChange }) {
  return (
    <div className="afire-distance-toggle" role="group" aria-label="Filter by distance">
      {DISTANCE_OPTIONS.map((d) => (
        <button
          key={d}
          className={`afire-distance-btn${selected === d ? ' afire-distance-btn--active' : ''}`}
          onClick={() => onChange(d)}
          aria-pressed={selected === d}
        >
          {d} mi
        </button>
      ))}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="afire-skeleton-list">
      {[1, 2, 3].map((n) => (
        <div key={n} className="afire-skeleton-row">
          <div className="afire-skeleton-line afire-skeleton-line--title" />
          <div className="afire-skeleton-line afire-skeleton-line--sub" />
        </div>
      ))}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ActiveFiresCard({ lat, lon }) {
  const [allFires, setAllFires] = useState(null); // null = loading, [] = empty; holds ALL fetched fires
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(null);
  const [nearbyMi, setNearbyMi] = useState(DEFAULT_DISTANCE);

  // Fetch once on mount / when coordinates change — distance filter is client-side
  useEffect(() => {
    if (lat == null || lon == null) return;

    const params = new URLSearchParams({
      where: '1=1',
      outFields: FIELDS,
      returnGeometry: 'true',
      outSR: '4326',
      f: 'json',
      resultRecordCount: '2000',
    });

    let cancelled = false;

    fetch(`${NIFC_URL}?${params}`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (data.error) throw new Error(data.error.message);

        const features = data.features ?? [];
        setTotal(features.length);

        const enriched = features
          .map((f) => ({
            ...f.attributes,
            lat: f.geometry?.y,
            lon: f.geometry?.x,
          }))
          .filter((f) => f.lat != null && f.lon != null)
          .map((f) => ({
            ...f,
            _dist: distanceMi(lat, lon, f.lat, f.lon),
          }))
          .sort((a, b) => a._dist - b._dist);

        setAllFires(enriched);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });

    return () => {
      cancelled = true;
    };
  }, [lat, lon]);

  // Client-side distance filter + cap display count
  const firesInRange = allFires?.filter((f) => f._dist <= nearbyMi) ?? [];
  const displayFires = firesInRange.slice(0, MAX_SHOWN);

  return (
    <section className="fire-card active-fires-card" aria-label="Active wildfires">
      {/* Header */}
      <div className="fire-card__header">
        <div>
          <p className="fire-kicker">NIFC · Live data</p>
          <h2>Active Fires</h2>
        </div>
        {total != null && (
          <div className="afire-totals">
            <span className="afire-total-num">{total}</span>
            <span className="afire-total-label">active nationwide</span>
          </div>
        )}
      </div>

      {/* Distance selector */}
      <DistanceToggle selected={nearbyMi} onChange={setNearbyMi} />

      {/* Content */}
      {error ? (
        <p className="afire-error">Couldn&apos;t load fire data — {error}</p>
      ) : allFires == null ? (
        <Skeleton />
      ) : displayFires.length === 0 ? (
        <p className="afire-empty">No active fire incidents within {nearbyMi} mi.</p>
      ) : (
        <div className="afire-list">
          {displayFires.map((fire, i) => (
            <FireRow
              key={fire.UniqueFireIdentifier ?? i}
              fire={fire}
              userLat={lat}
              userLon={lon}
            />
          ))}
          {firesInRange.length > MAX_SHOWN && (
            <p className="afire-overflow">
              +{firesInRange.length - MAX_SHOWN} more within {nearbyMi} mi — widen your search or zoom in on a map.
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <p className="afire-footer">
        Source: NIFC / WFIGS — updated continuously ·{' '}
        <a
          href="https://data-nifc.opendata.arcgis.com/"
          target="_blank"
          rel="noreferrer noopener"
          className="afire-src-link"
        >
          Open Data ↗
        </a>
      </p>
    </section>
  );
}
