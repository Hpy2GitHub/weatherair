import { useState, useEffect } from 'react'
import './AirQuality.css'

// ─── AQI scale ────────────────────────────────────────────────────────────────

const AQI_LEVELS = [
  { max: 50,       label: 'Good',               color: '#4ade80' },
  { max: 100,      label: 'Moderate',           color: '#facc15' },
  { max: 150,      label: 'Unhealthy for Some', color: '#fb923c' },
  { max: 200,      label: 'Unhealthy',          color: '#f87171' },
  { max: 300,      label: 'Very Unhealthy',     color: '#c084fc' },
  { max: Infinity, label: 'Hazardous',          color: '#fb7185' },
]

const getAqiMeta = (val) => AQI_LEVELS.find((l) => val <= l.max) ?? AQI_LEVELS.at(-1)

// ─── Gauge helpers ────────────────────────────────────────────────────────────

const CX = 100, CY = 96, R = 72

function polar(angleDeg) {
  const rad = (angleDeg * Math.PI) / 180
  return { x: CX + R * Math.cos(rad), y: CY + R * Math.sin(rad) }
}

function arcD(startDeg, endDeg) {
  const s = polar(startDeg)
  const e = polar(endDeg)
  const large = Math.abs(startDeg - endDeg) > 180 ? 1 : 0
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 ${large} 0 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
}

const GAUGE_MAX = 300

// 180° (left) → 0° (right), counterclockwise, mapped to AQI 0–300
const SEGMENTS = [
  { from: 180, to: 150, color: '#4ade80' },  // 0–50   Good
  { from: 150, to: 120, color: '#facc15' },  // 51–100 Moderate
  { from: 120, to:  90, color: '#fb923c' },  // 101–150 USG
  { from:  90, to:  60, color: '#f87171' },  // 151–200 Unhealthy
  { from:  60, to:   0, color: '#c084fc' },  // 201–300 Very Unhealthy
]

function needleAngle(aqi) {
  return 180 - (Math.min(aqi, GAUGE_MAX) / GAUGE_MAX) * 180
}

// ─── Pollutant components ─────────────────────────────────────────────────────

const COMPONENTS = [
  { key: 'us_aqi_pm2_5',            label: 'PM2.5' },
  { key: 'us_aqi_pm10',             label: 'PM10'  },
  { key: 'us_aqi_ozone',            label: 'Ozone' },
  { key: 'us_aqi_nitrogen_dioxide', label: 'NO₂'   },
  { key: 'us_aqi_sulphur_dioxide',  label: 'SO₂'   },
  { key: 'us_aqi_carbon_monoxide',  label: 'CO'    },
]

// ─── Pollen ───────────────────────────────────────────────────────────────────

const POLLEN_TYPES = [
  { key: 'alder_pollen',   label: 'Alder',   thresholds: [15, 75,  300] },
  { key: 'birch_pollen',   label: 'Birch',   thresholds: [15, 75,  300] },
  { key: 'grass_pollen',   label: 'Grass',   thresholds: [10, 50,  200] },
  { key: 'mugwort_pollen', label: 'Mugwort', thresholds: [10, 50,  200] },
  { key: 'olive_pollen',   label: 'Olive',   thresholds: [15, 75,  300] },
  { key: 'ragweed_pollen', label: 'Ragweed', thresholds: [10, 50,  200] },
]

const POLLEN_LABELS = ['None', 'Low', 'Moderate', 'High', 'Very High']
const POLLEN_COLORS = ['#334155', '#4ade80', '#facc15', '#fb923c', '#f87171']

function pollenLevel(val, [modT, highT, vhighT]) {
  if (!val || val <= 0) return 0
  if (val < modT)   return 1
  if (val < highT)  return 2
  if (val < vhighT) return 3
  return 4
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AirQuality({ lat, lon }) {
  const [data,  setData]  = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (lat == null || lon == null) return

    const fields = [
      'us_aqi',
      ...COMPONENTS.map((c) => c.key),
      ...POLLEN_TYPES.map((p) => p.key),
    ].join(',')

    fetch(
      'https://air-quality-api.open-meteo.com/v1/air-quality' +
      `?latitude=${lat}&longitude=${lon}` +
      `&current=${fields}` +
      '&domains=cams_global'
    )
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((json) => setData(json.current))
      .catch(() => setError(true))
  }, [lat, lon])

  if (error || !data) return null

  // ── AQI ──
  const aqi     = Math.round(data.us_aqi ?? 0)
  const aqiMeta = getAqiMeta(aqi)

  // ── Components — filter out zeros, sort highest first ──
  const components = COMPONENTS
    .map((c) => ({ ...c, value: Math.round(data[c.key] ?? 0) }))
    .filter((c) => c.value > 0)
    .sort((a, b) => b.value - a.value)

  const primary = components[0] ?? null

  // ── Needle geometry ──
  const angle    = needleAngle(aqi)
  const tip      = polar(angle)
  const pivotR   = 5
  const tipX     = CX + (tip.x - CX) * 0.88
  const tipY     = CY + (tip.y - CY) * 0.88
  // Small base triangle at pivot
  const leftPt   = polar(angle + 90)
  const rightPt  = polar(angle - 90)
  const blx      = CX + (leftPt.x  - CX) * (pivotR / R)
  const bly      = CY + (leftPt.y  - CY) * (pivotR / R)
  const brx      = CX + (rightPt.x - CX) * (pivotR / R)
  const bry      = CY + (rightPt.y - CY) * (pivotR / R)

  // ── Pollen ──
  const pollens = POLLEN_TYPES
    .map((p) => ({ ...p, value: data[p.key] ?? 0, level: pollenLevel(data[p.key], p.thresholds) }))
    .filter((p) => p.value > 0)

  const worstPollen = pollens.length
    ? pollens.reduce((a, b) => (b.level > a.level ? b : a))
    : null

  return (
    <section className="card aq-card fade-in-4">

      {/* ── Gauge ──────────────────────────────────── */}
      <p className="section-label">Air Quality</p>

      <svg viewBox="0 0 200 112" className="aq-gauge"
        aria-label={`US AQI ${aqi} — ${aqiMeta.label}`}>

        {/* Track */}
        <path d={arcD(180, 0)} fill="none"
          stroke="rgba(255,255,255,0.06)" strokeWidth="14" strokeLinecap="butt" />

        {/* Zone segments */}
        {SEGMENTS.map((s) => (
          <path key={s.from} d={arcD(s.from, s.to)} fill="none"
            stroke={s.color} strokeWidth="14" strokeLinecap="butt" opacity="0.4" />
        ))}

        {/* Needle */}
        <polygon
          points={`${tipX.toFixed(1)},${tipY.toFixed(1)} ${blx.toFixed(1)},${bly.toFixed(1)} ${brx.toFixed(1)},${bry.toFixed(1)}`}
          fill="white" opacity="0.9"
        />
        <circle cx={CX} cy={CY} r={pivotR} fill="white" opacity="0.9" />

        {/* Value + label */}
        <text x={CX} y={CY + 24} textAnchor="middle" fontSize="22" fontWeight="400"
          fill={aqiMeta.color} fontFamily="Cormorant Garamond, serif">{aqi}</text>
        <text x={CX} y={CY + 35} textAnchor="middle" fontSize="7.5"
          fill="rgba(255,255,255,0.3)" fontFamily="DM Mono, monospace"
          letterSpacing="1">{aqiMeta.label.toUpperCase()}</text>

        {/* Scale labels */}
        <text x="20"  y="109" fontSize="7.5" fill="rgba(255,255,255,0.22)" fontFamily="DM Mono, monospace">0</text>
        <text x="86"  y="26"  fontSize="7.5" fill="rgba(255,255,255,0.22)" fontFamily="DM Mono, monospace">150</text>
        <text x="166" y="109" fontSize="7.5" fill="rgba(255,255,255,0.22)" fontFamily="DM Mono, monospace">300</text>
      </svg>

      {/* ── Pollutant bars ─────────────────────────── */}
      {components.length > 0 && (
        <div className="aq-components">
          {primary && (
            <p className="aq-driver">
              Primary: <span style={{ color: aqiMeta.color }}>{primary.label}</span>
            </p>
          )}
          <div className="aq-comp-grid">
            {components.map((c) => {
              const meta = getAqiMeta(c.value)
              const pct  = Math.min(c.value / GAUGE_MAX * 100, 100)
              return (
                <div key={c.key} className="aq-comp-row">
                  <span className="aq-comp-label">{c.label}</span>
                  <div className="aq-comp-track">
                    <div className="aq-comp-fill"
                      style={{ width: `${pct}%`, background: meta.color }} />
                  </div>
                  <span className="aq-comp-val" style={{ color: meta.color }}>{c.value}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Pollen ─────────────────────────────────── */}
      {pollens.length > 0 && (
        <div className="aq-pollen">
          <p className="section-label" style={{ marginTop: '16px' }}>Pollen</p>

          {worstPollen && worstPollen.level >= 2 && (
            <p className="aq-alert" style={{ color: POLLEN_COLORS[worstPollen.level] }}>
              {worstPollen.label} pollen is {POLLEN_LABELS[worstPollen.level].toLowerCase()} right now
            </p>
          )}

          <div className="pollen-grid">
            {pollens.map((p) => (
              <div key={p.key} className="pollen-item">
                <div className="pollen-bars">
                  {[1, 2, 3, 4].map((tier) => (
                    <div key={tier} className="pollen-bar-seg"
                      style={{ background: p.level >= tier ? POLLEN_COLORS[tier] : 'rgba(255,255,255,0.07)' }} />
                  ))}
                </div>
                <span className="pollen-name">{p.label}</span>
                <span className="pollen-level" style={{ color: POLLEN_COLORS[p.level] }}>
                  {POLLEN_LABELS[p.level]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pollens.length === 0 && (
        <p className="aq-no-pollen">No active pollen detected</p>
      )}

    </section>
  )
}
