// WindCard.jsx
// Props:
//   current  — weather.current from useWeatherData  (wind_speed_10m, wind_gusts_10m, wind_direction_10m)
//   hourly   — weather.hourly  (wind_speed_10m array) — used to derive a recent average
//   unit     — 'f' | 'c'  (controls mph vs km/h display)

const COMPASS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];

function degToCompass(deg) {
  if (deg == null) return '—';
  return COMPASS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}

// Open-Meteo returns wind in km/h by default — check your useWeatherData hook.
// This component assumes the values arrive in mph. Adjust KMH_MODE if needed.
const KMH_MODE = false; // flip to true if your hook returns km/h

function toDisplaySpeed(raw, unit) {
  if (raw == null) return null;
  // raw → mph (if km/h source, divide by 1.60934)
  const mph = KMH_MODE ? raw / 1.60934 : raw;
  if (unit === 'c') return { val: Math.round(mph * 1.60934), label: 'km/h', mph };
  return { val: Math.round(mph), label: 'mph', mph };
}

// Beaufort: 0 = Calm, Beaufort 8 (~39 mph) = Gale → maps to 100%
function beaufortPct(mph) {
  if (mph == null) return 0;
  return Math.min(Math.max(mph / 39, 0), 1) * 100;
}

// Recent average from hourly array (last 6 readings before current hour)
function recentAvgMph(hourly) {
  if (!hourly?.wind_speed_10m?.length) return null;
  const slice = hourly.wind_speed_10m.slice(-6);
  const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
  return KMH_MODE ? avg / 1.60934 : avg;
}

// ─── Windmill SVG ─────────────────────────────────────────────────────────────
// Animated 3-blade turbine. animDuration controls rotation speed.

function Windmill({ speedMph = 0, height = 72, delay = '0s', opacity = 1 }) {
  // 10 mph → 2.5s/rev  |  30 mph → 0.9s  |  60 mph → 0.45s
  const dur = speedMph > 0
    ? `${Math.max(0.45, 2.5 - (speedMph - 10) * 0.07).toFixed(2)}s`
    : '2.5s';

  const w = height * 0.62;

  return (
    <svg
      width={w}
      height={height}
      viewBox="0 0 40 70"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Tower (tapered trapezoid) */}
      <polygon points="17.5,33 22.5,33 21,68 19,68" fill="rgba(255,255,255,0.22)" />
      {/* Base pad */}
      <ellipse cx="20" cy="68" rx="5" ry="1.8" fill="rgba(255,255,255,0.12)" />
      {/* Nacelle (housing) */}
      <rect x="16.5" y="27" width="7" height="5" rx="1.5" fill="rgba(255,255,255,0.35)" />
      {/* Hub */}
      <circle cx="20" cy="28" r="3" fill="rgba(255,255,255,0.55)" />

      {/* Rotating blades group — pivots around hub */}
      <g
        style={{
          transformOrigin: '20px 28px',
          animation: `wmill-spin ${dur} linear infinite`,
          animationDelay: delay,
        }}
      >
        {/* Each blade: thin aerofoil shape */}
        <path d="M20 28 L16.5 7 Q19.5 4 23 6 Z"  fill="rgba(255,255,255,0.72)" />
        <path d="M20 28 L35 38 Q37 42 34 44 Z"    fill="rgba(255,255,255,0.72)" />
        <path d="M20 28 L5  38 Q2  34 4  30 Z"    fill="rgba(255,255,255,0.72)" />
      </g>
    </svg>
  );
}

// ─── Compass Rose ──────────────────────────────────────────────────────────────

function Compass({ degrees, size = 84 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r  = size / 2 - 5;

  // Needle points FROM the wind source (where wind comes from)
  const rad      = (d) => ((d - 90) * Math.PI) / 180;
  const needleR  = r * 0.6;
  const tailR    = r * 0.28;
  const deg      = degrees ?? 0;

  const tipX  = cx + Math.cos(rad(deg)) * needleR;
  const tipY  = cy + Math.sin(rad(deg)) * needleR;
  const tailX = cx - Math.cos(rad(deg)) * tailR;
  const tailY = cy - Math.sin(rad(deg)) * tailR;

  // Arrowhead perpendicular offset
  const perpAngle = rad(deg + 90);
  const hw = 4; // half-width of arrowhead base
  const arrowBase = r * 0.18;
  const arrowBaseX = cx + Math.cos(rad(deg)) * (needleR - arrowBase);
  const arrowBaseY = cy + Math.sin(rad(deg)) * (needleR - arrowBase);
  const lx = arrowBaseX + Math.cos(perpAngle) * hw;
  const ly = arrowBaseY + Math.sin(perpAngle) * hw;
  const rx2 = arrowBaseX - Math.cos(perpAngle) * hw;
  const ry2 = arrowBaseY - Math.sin(perpAngle) * hw;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`Wind from ${degToCompass(degrees)}`}
    >
      {/* Background disk */}
      <circle cx={cx} cy={cy} r={r} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

      {/* Subtle inner ring */}
      <circle cx={cx} cy={cy} r={r * 0.72} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

      {/* Cardinal tick marks */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => {
        const isCardinal = d % 90 === 0;
        const inner = isCardinal ? r - 7 : r - 4;
        const rr = rad(d);
        return (
          <line
            key={d}
            x1={cx + Math.cos(rr) * inner}
            y1={cy + Math.sin(rr) * inner}
            x2={cx + Math.cos(rr) * r}
            y2={cy + Math.sin(rr) * r}
            stroke={isCardinal ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)'}
            strokeWidth={isCardinal ? 1.5 : 0.8}
          />
        );
      })}

      {/* N label */}
      <text
        x={cx}
        y={cy - r + 14}
        textAnchor="middle"
        fill="rgba(255,255,255,0.75)"
        fontSize="9"
        fontFamily="DM Mono, monospace"
        letterSpacing="0.5"
      >
        N
      </text>

      {/* Tail line (opposite of needle) */}
      <line
        x1={cx} y1={cy}
        x2={tailX} y2={tailY}
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="3 3"
      />

      {/* Needle shaft */}
      <line
        x1={cx} y1={cy}
        x2={arrowBaseX} y2={arrowBaseY}
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Red arrowhead */}
      <polygon
        points={`${tipX},${tipY} ${lx},${ly} ${rx2},${ry2}`}
        fill="#ef4444"
        opacity="0.9"
      />

      {/* Center hub */}
      <circle cx={cx} cy={cy} r="3.5" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />
    </svg>
  );
}

// ─── Scale Bar ────────────────────────────────────────────────────────────────

function WindScale({ speedMph }) {
  const pct = beaufortPct(speedMph);
  return (
    <div className="wind-scale">
      <div className="wind-scale__bar">
        <div className="wind-scale__marker" style={{ left: `calc(${pct}% - 5px)` }} />
      </div>
      <div className="wind-scale__labels">
        <span>Calm</span>
        <span>Gale</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function WindCard({ current, hourly, unit = 'f' }) {
  const speed = toDisplaySpeed(current?.wind_speed_10m, unit);
  const gust  = toDisplaySpeed(current?.wind_gusts_10m, unit);
  const avgMph = recentAvgMph(hourly);
  const avg   = avgMph != null ? toDisplaySpeed(avgMph, unit) : null;

  const dirDeg   = current?.wind_direction_10m;
  const dirLabel = degToCompass(dirDeg);

  // Only show windmills when wind is meaningful (≥ 10 mph)
  const windy = speed?.mph != null && speed.mph >= 10;

  return (
    <div className="card wind-card">
      {/* Header */}
      <div className="wind-card__header">
        <span className="card-label">Wind</span>

        {/* Windmills — conditionally rendered */}
        {windy && (
          <div className="wind-mills" aria-hidden="true">
            <Windmill speedMph={speed.mph} height={52} delay="0s" opacity={0.85} />
            <Windmill speedMph={speed.mph} height={38} delay="-0.9s" opacity={0.55} />
          </div>
        )}
      </div>

      {/* Body: compass + data */}
      <div className="wind-body">
        <Compass degrees={dirDeg} size={84} />

        <div className="wind-data">
          {/* Primary reading */}
          <div className="wind-primary">
            <span className="wind-primary__dir">{dirLabel}</span>
            <span className="wind-primary__speed">
              {speed != null ? `${speed.val} ${speed.label}` : '—'}
            </span>
          </div>

          {/* Secondary stats */}
          <div className="wind-stats">
            <div className="wind-stat-row">
              <span className="wind-stat__key">Gust</span>
              <span className="wind-stat__val">
                {gust != null
                  ? `${dirLabel} ${gust.val} ${gust.label}`
                  : '—'}
              </span>
            </div>
            <div className="wind-stat-row">
              <span className="wind-stat__key">6h avg</span>
              <span className="wind-stat__val">
                {avg != null
                  ? `${dirLabel} ${avg.val} ${avg.label}`
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Calm → Gale scale */}
      {speed != null && <WindScale speedMph={speed.mph} />}
    </div>
  );
}
