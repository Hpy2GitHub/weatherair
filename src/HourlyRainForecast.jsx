
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

function getPrecipType(code) {
  if (code >= 51 && code <= 67) return 'rain'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 80 && code <= 86) return 'showers'
  if (code >= 95 && code <= 99) return 'storm'
  return null
}

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

const COL_W    = 52
const SVG_H    = 168
const ICON_Y   = 18
const CURVE_T  = 44
const CURVE_B  = 108
const LABEL_Y  = 128
const HOUR_Y   = 164

export default function HourlyRainForecast({ hourly }) {
  if (!hourly) return null
  if (!hourly.time || !hourly.precipitation_probability) return null

  const nowMs = Date.now()
  const startIdx = hourly.time.findIndex((t) => new Date(t).getTime() >= nowMs)
  if (startIdx === -1) return null

  const hours = Array.from({ length: 24 }, (_, i) => {
    const idx = startIdx + i
    if (idx >= hourly.time.length) {
      return {
        time: new Date(hourly.time[hourly.time.length - 1]),
        code: 0,
        prob: 0,
        precipType: null,
        hasPrecip: false,
        isNow: false,
      }
    }

    const code = hourly.weather_code?.[idx] ?? 0
    const prob = hourly.precipitation_probability?.[idx] ?? 0
    
    return {
      time: new Date(hourly.time[idx]),
      code,
      prob,
      precipType: getPrecipType(code),
      hasPrecip: prob > 0,
      isNow: i === 0,
    }
  })

  const maxProb = Math.max(...hours.map(h => h.prob), 1)
  const precipHours = hours.filter(h => h.hasPrecip)

  const svgW = COL_W * hours.length

  const probY = (prob) => CURVE_B - (prob / 100) * (CURVE_B - CURVE_T)

  const curvePts = hours.map((h, i) => ({
    x: i * COL_W + COL_W / 2,
    y: probY(h.prob),
  }))

  const pathD = smoothPath(curvePts)
  const areaD = pathD +
    ` L ${curvePts.at(-1).x} ${CURVE_B}` +
    ` L ${curvePts[0].x} ${CURVE_B} Z`

  const getColor = (type) => {
    switch(type) {
      case 'rain': return '#60a5fa'
      case 'snow': return '#e2e8f0'
      case 'showers': return '#818cf8'
      case 'storm': return '#fbbf24'
      default: return '#60a5fa'
    }
  }

  const primaryType = [...new Set(hours.map(h => h.precipType).filter(Boolean))][0]
  const curveColor = getColor(primaryType)

  return (
    <section className="hf-section fade-in-4">
      <p className="section-label">Rain Chance Next 24h</p>

      <div className="hf-scroll">
        <svg
          viewBox={`0 0 ${svgW} ${SVG_H}`}
          width={svgW}
          height={SVG_H}
          style={{ display: 'block', overflow: 'visible' }}
        >
          <defs>
            <linearGradient id="precipGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={curveColor} stopOpacity="0.22" />
              <stop offset="100%" stopColor={curveColor} stopOpacity="0" />
            </linearGradient>
          </defs>

          <rect x={0} y={0} width={COL_W} height={SVG_H}
            fill="rgba(255,255,255,0.03)" rx="6" />

          <path d={areaD} fill="url(#precipGrad)" />
          <path d={pathD} fill="none" stroke={curveColor} strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" />

          {hours.map((h, i) => {
            const cx = i * COL_W + COL_W / 2
            const py = probY(h.prob)
            const showLabel = i % 2 === 0 || i === hours.length - 1

            return (
              <g key={`precip-${i}`}>
                <text x={cx} y={ICON_Y} textAnchor="middle" fontSize="14">{icon(h.code)}</text>

                {h.hasPrecip && (
                  <circle cx={cx} cy={py} r={h.isNow ? 3.5 : 2}
                    fill={h.isNow ? '#fff' : curveColor}
                    stroke={h.isNow ? curveColor : 'none'} strokeWidth="1.5" />
                )}

                {showLabel && (
                  <text x={cx} y={LABEL_Y} textAnchor="middle" fontSize="10.5"
                    fill={h.isNow ? '#f4f7ff' : 'rgba(255,255,255,0.55)'}
                    fontFamily="Cormorant Garamond, serif" fontWeight="400">
                    {h.prob}%
                  </text>
                )}

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

      {precipHours.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 0',
          marginTop: '8px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: '11px',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.38)' }}>
            {precipHours.length}h with chance of rain
          </span>
          <span style={{ color: curveColor, fontFamily: "'DM Mono', monospace" }}>
            Up to {Math.round(maxProb)}%
          </span>
        </div>
      )}

      {precipHours.length === 0 && (
        <div style={{
          padding: '12px 0',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '11px',
          textAlign: 'center',
        }}>
          No precipitation expected in the next 24 hours
        </div>
      )}
    </section>
  )
}
