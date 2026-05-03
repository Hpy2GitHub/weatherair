
const WMO_ICON = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️', 56: '🌧️', 57: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️', 66: '🌨️', 67: '🌨️',
  71: '🌨️', 73: '❄️', 75: '❄️', 77: '🌨️',
  80: '🌦️', 81: '🌧️', 82: '⛈️', 85: '🌨️', 86: '❄️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
}

const icon = (code) => WMO_ICON[code] ?? '🌡️'

function fmtHour(d) {
  const h = d.getHours()
  if (h === 0)  return '12am'
  if (h === 12) return '12pm'
  return h < 12 ? `${h}am` : `${h - 12}pm`
}

const toC   = (f) => Math.round((f - 32) * 5 / 9)
const cvt   = (f, unit) => unit === 'f' ? Math.round(f) : toC(f)

// Smooth bezier path through points
function smoothPath(pts) {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]
    const curr = pts[i]
    const cpx  = (prev.x + curr.x) / 2
    d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`
  }
  return d
}

// ─── Layout constants ─────────────────────────────────────────────────────────

const COL_W    = 52    // px per hour column
const SVG_H    = 168   // total SVG height
const ICON_Y   = 18    // weather icon center y
const CURVE_T  = 44    // top of curve area
const CURVE_B  = 108   // bottom of curve area
const LABEL_Y  = 124   // temp label y
const BAR_T    = 134   // precip bar top
const BAR_B    = 152   // precip bar bottom
const HOUR_Y   = 164   // hour label y

export default function HourlyForecast({ hourly, unit }) {
  if (!hourly) return null

  // Slice from now for 24 hours
  const nowMs = Date.now()
  const startIdx = hourly.time.findIndex((t) => new Date(t).getTime() >= nowMs)
  if (startIdx === -1) return null

  const hours = Array.from({ length: 24 }, (_, i) => {
    const idx = startIdx + i
    return {
      time:   new Date(hourly.time[idx]),
      temp:   hourly.temperature_2m[idx],
      code:   hourly.weather_code[idx],
      precip: hourly.precipitation_probability[idx] ?? 0,
      isNow:  i === 0,
    }
  })

  const temps  = hours.map((h) => cvt(h.temp, unit))
  const minT   = Math.min(...temps)
  const maxT   = Math.max(...temps)
  const range  = maxT - minT || 1

  const svgW   = COL_W * hours.length

  // Map temp → y (higher temp = lower y value = higher on screen)
  const tempY  = (t) => CURVE_B - ((t - minT) / range) * (CURVE_B - CURVE_T)

  const curvePts = hours.map((h, i) => ({
    x: i * COL_W + COL_W / 2,
    y: tempY(cvt(h.temp, unit)),
  }))

  const pathD = smoothPath(curvePts)

  // Gradient area fill under curve
  const areaD = pathD +
    ` L ${curvePts.at(-1).x} ${CURVE_B}` +
    ` L ${curvePts[0].x} ${CURVE_B} Z`

  return (
    <section className="hf-section fade-in-4">
      <p className="section-label">Hourly Today</p>

      <div className="hf-scroll">
        <svg
          viewBox={`0 0 ${svgW} ${SVG_H}`}
          width={svgW}
          height={SVG_H}
          style={{ display: 'block', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#60a5fa" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* "Now" column highlight */}
          <rect
            x={0} y={0} width={COL_W} height={SVG_H}
            fill="rgba(255,255,255,0.03)" rx="6"
          />

          {/* Area fill under curve */}
          <path d={areaD} fill="url(#curveGrad)" />

          {/* Temperature curve */}
          <path d={pathD} fill="none" stroke="#60a5fa" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" />

          {/* Per-hour elements */}
          {hours.map((h, i) => {
            const cx      = i * COL_W + COL_W / 2
            const ty      = tempY(cvt(h.temp, unit))
            const barH    = (h.precip / 100) * (BAR_B - BAR_T)
            const barY    = BAR_B - barH
            const showLabel = i % 2 === 0 || i === hours.length - 1

            return (
              <g key={h.time.toISOString()}>
                {/* Weather icon */}
                <text x={cx} y={ICON_Y} textAnchor="middle" fontSize="14">{icon(h.code)}</text>

                {/* Dot on curve */}
                <circle cx={cx} cy={ty} r={h.isNow ? 3.5 : 2}
                  fill={h.isNow ? '#fff' : '#60a5fa'}
                  stroke={h.isNow ? '#60a5fa' : 'none'} strokeWidth="1.5" />

                {/* Temp label — alternate to avoid crowding */}
                {showLabel && (
                  <text x={cx} y={LABEL_Y} textAnchor="middle" fontSize="10.5"
                    fill={h.isNow ? '#f4f7ff' : 'rgba(255,255,255,0.55)'}
                    fontFamily="Cormorant Garamond, serif" fontWeight="400">
                    {cvt(h.temp, unit)}°
                  </text>
                )}

                {/* Precipitation bar */}
                {barH > 1 && (
                  <rect x={cx - 6} y={barY} width={12} height={barH}
                    fill="#60a5fa" opacity="0.35" rx="2" />
                )}

                {/* Hour label */}
                <text x={cx} y={HOUR_Y} textAnchor="middle" fontSize="9.5"
                  fill={h.isNow ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.28)'}
                  fontFamily="DM Mono, monospace">
                  {h.isNow ? 'Now' : fmtHour(h.time)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </section>
  )
}
