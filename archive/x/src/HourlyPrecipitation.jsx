//HourlyPreciptation.jsx
// Smart summary pill at the top generates a natural language sentence: "Rain likely starting 3pm · up to 0.18"" — or "No precipitation expected" when clear. Also shows average humidity.
// Color-coded by precip type — rain (blue), showers (light blue), snow (pale blue), sleet (lavender), storm (purple) — with a legend at the bottom.
// The dew_point_2m field is fetched but not yet displayed — could be useful as a tooltip or in a secondary panel if you want to add it later.

const WMO_ICON = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️', 56: '🌧️', 57: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️', 66: '🌨️', 67: '🌨️',
  71: '🌨️', 73: '❄️', 75: '❄️', 77: '🌨️',
  80: '🌦️', 81: '🌧️', 82: '⛈️', 85: '🌨️', 86: '❄️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
}

function fmtHour(d) {
  const h = d.getHours()
  if (h === 0)  return '12am'
  if (h === 12) return '12pm'
  return h < 12 ? `${h}am` : `${h - 12}pm`
}

function getPrecipType(code) {
  if (code >= 95) return 'storm'
  if (code >= 71 && code <= 77) return 'snow'
  if (code >= 66 && code <= 67) return 'sleet'
  if (code >= 80 && code <= 86) return 'showers'
  if (code >= 51) return 'rain'
  return null
}

const PRECIP_COLORS = {
  storm:   '#a78bfa',
  snow:    '#b5d4f4',
  sleet:   '#c4b5fd',
  showers: '#85b7eb',
  rain:    '#378add',
}

function precipColor(type) {
  return PRECIP_COLORS[type] || '#888780'
}

const BAR_MAX_H = 80  // px
const COL_W     = 52  // px

export default function HourlyPrecipitation({ hourly }) {
  if (!hourly) return null

  const nowMs    = Date.now()
  const startIdx = hourly.time.findIndex((t) => new Date(t).getTime() >= nowMs)
  if (startIdx === -1) return null

  const hours = Array.from({ length: 24 }, (_, i) => {
    const idx = startIdx + i
    return {
      time:   new Date(hourly.time[idx]),
      code:   hourly.weather_code?.[idx] ?? 0,
      prob:   hourly.precipitation_probability?.[idx] ?? 0,
      precip: hourly.precipitation?.[idx] ?? 0,
      temp:   hourly.temperature_2m?.[idx] ?? null,
      hum:    hourly.relative_humidity_2m?.[idx] ?? null,
      isNow:  i === 0,
    }
  })

  // ── Summary ───────────────────────────────────────────────────────────────
  const precipHours = hours.filter((h) => h.prob >= 30)
  const firstPrecip = precipHours[0]
  const totalPrecip = hours.reduce((s, h) => s + h.precip, 0)
  const humidities  = hours.map((h) => h.hum).filter((v) => v != null)
  const avgHum      = humidities.length
    ? Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length)
    : null

  // Dominant precip type (by hours with ≥30% prob)
  const typeCounts = {}
  hours.forEach((h) => {
    const t = getPrecipType(h.code)
    if (t && h.prob >= 30) typeCounts[t] = (typeCounts[t] || 0) + 1
  })
  const dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null
  const accentColor  = precipColor(dominantType)

  let summaryText = 'No precipitation expected in the next 24 hours'
  if (firstPrecip) {
    const typeLabel  = dominantType ?? 'precipitation'
    const startLabel = firstPrecip.isNow ? 'now' : fmtHour(firstPrecip.time)
    const amtStr     = totalPrecip >= 0.01 ? ` · up to ${totalPrecip.toFixed(2)}"` : ''
    summaryText = `${typeLabel.charAt(0).toUpperCase()}${typeLabel.slice(1)} likely starting ${startLabel}${amtStr}`
  }

  return (
    <section className="hf-section fade-in-4">
      <p className="section-label">Precipitation · Next 24h</p>

      {/* ── Summary pill ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', marginBottom: 14,
        background: 'rgba(255,255,255,0.04)', borderRadius: 8,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
          background: firstPrecip ? accentColor : 'rgba(255,255,255,0.2)',
        }} />
        <span style={{ fontSize: 12, color: firstPrecip ? accentColor : 'rgba(255,255,255,0.35)' }}>
          {summaryText}
        </span>
        {avgHum != null && (
          <span style={{
            marginLeft: 'auto', fontSize: 11, whiteSpace: 'nowrap',
            color: 'rgba(255,255,255,0.28)',
            fontFamily: "'DM Mono', monospace",
          }}>
            avg {avgHum}% humidity
          </span>
        )}
      </div>

      {/* ── Scrollable bar chart ──────────────────────────────────────────── */}
      <div className="hf-scroll">
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          {hours.map((h, i) => {
            const type       = getPrecipType(h.code)
            const color      = precipColor(type)
            const barH       = Math.round((h.prob / 100) * BAR_MAX_H)
            const showLabel  = i % 2 === 0 || i === hours.length - 1
            const showAmount = h.precip >= 0.01 && barH >= 22

            return (
              <div
                key={h.time.toISOString()}
                style={{
                  width: COL_W, flexShrink: 0,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 3, paddingTop: 4,
                  background: h.isNow ? 'rgba(255,255,255,0.04)' : 'transparent',
                  borderRadius: 6,
                }}
              >
                {/* Temperature */}
                <span style={{
                  fontSize: 9.5, fontFamily: "'DM Mono', monospace",
                  color: h.isNow ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.22)',
                }}>
                  {h.temp != null ? `${Math.round(h.temp)}°` : '\u00A0'}
                </span>

                {/* Weather icon */}
                <span style={{ fontSize: 14, lineHeight: 1 }}>
                  {WMO_ICON[h.code] ?? '🌡️'}
                </span>

                {/* Probability bar */}
                <div style={{
                  width: 22, height: BAR_MAX_H,
                  display: 'flex', alignItems: 'flex-end',
                  background: 'rgba(255,255,255,0.06)',
                  borderRadius: 4, overflow: 'hidden',
                }}>
                  {barH > 0 && (
                    <div style={{
                      width: '100%', height: barH,
                      background: color,
                      opacity: h.isNow ? 1 : 0.68,
                      borderRadius: 4,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {showAmount && (
                        <span style={{
                          fontSize: 7.5, color: 'rgba(255,255,255,0.9)',
                          fontFamily: "'DM Mono', monospace",
                          writingMode: 'vertical-rl', transform: 'rotate(180deg)', lineHeight: 1,
                        }}>
                          {h.precip.toFixed(2)}"
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Probability label */}
                <span style={{
                  fontSize: 10, fontFamily: "'DM Mono', monospace", minHeight: 14,
                  color: !showLabel
                    ? 'transparent'
                    : h.isNow
                    ? 'rgba(255,255,255,0.75)'
                    : h.prob >= 30
                    ? 'rgba(255,255,255,0.5)'
                    : 'rgba(255,255,255,0.18)',
                }}>
                  {showLabel ? `${h.prob}%` : ''}
                </span>

                {/* Humidity spark bar */}
                <div style={{
                  width: Math.max(Math.round((h.hum ?? 0) / 100 * 36), 2),
                  height: 3, borderRadius: 2,
                  background: '#378add', opacity: 0.3,
                }} />

                {/* Hour label */}
                <span style={{
                  fontSize: 9.5, fontFamily: "'DM Mono', monospace", paddingBottom: 4,
                  color: h.isNow ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.22)',
                }}>
                  {h.isNow ? 'Now' : fmtHour(h.time)}
                </span>
              </div>
            )
          })}
        </div>

        {/* ── Humidity label row ─────────────────────────────────────────── */}
        {humidities.length > 0 && (
          <div style={{
            display: 'flex', marginTop: 4,
            paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            {hours.map((h, i) => (
              <div
                key={`hum-${i}`}
                style={{ width: COL_W, flexShrink: 0, textAlign: 'center' }}
              >
                {(i % 4 === 0 || i === hours.length - 1) && h.hum != null && (
                  <span style={{
                    fontSize: 8.5, fontFamily: "'DM Mono', monospace",
                    color: 'rgba(255,255,255,0.2)',
                  }}>
                    {h.hum}%
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Footer legend ─────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', flexWrap: 'wrap',
        gap: '6px 14px', marginTop: 12, paddingTop: 10,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        {Object.entries(PRECIP_COLORS).map(([type, color]) => (
          <span key={type} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>{type}</span>
          </span>
        ))}
        <span style={{
          marginLeft: 'auto', fontSize: 10,
          color: 'rgba(255,255,255,0.18)', fontFamily: "'DM Mono', monospace",
        }}>
          bar = probability · number = inches · line = humidity
        </span>
      </div>
    </section>
  )
}
