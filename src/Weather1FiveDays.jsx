// DailyForecast.jsx

const WMO_ICON = {
  0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
  45: '🌫️', 48: '🌫️',
  51: '🌦️', 53: '🌦️', 55: '🌧️', 56: '🌧️', 57: '🌧️',
  61: '🌧️', 63: '🌧️', 65: '🌧️', 66: '🌨️', 67: '🌨️',
  71: '🌨️', 73: '❄️', 75: '❄️', 77: '🌨️',
  80: '🌦️', 81: '🌧️', 82: '⛈️', 85: '🌨️', 86: '❄️',
  95: '⛈️', 96: '⛈️', 99: '⛈️',
}

function formatDay(dateStr, index) {
  const d = new Date(dateStr)
  if (index === 0) return 'Today'
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[d.getDay()]
}

function formatDate(dateStr) {
  return new Date(dateStr).getDate()
}

function getPrecipClass(prob) {
  if (prob >= 30) return 'df-precip-prob--likely'
  if (prob >= 10) return 'df-precip-prob--notable'
  return ''
}

export default function Weather1FiveDays({ daily, unit }) {
  if (!daily || !daily.time) return null

  return (
    <div className="card fade-in-3">
      <p className="section-label">Daily Forecast</p>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {daily.time.map((dateStr, i) => {
          const dayLabel = formatDay(dateStr, i)
          const dateNum  = formatDate(dateStr)
          const hi       = Math.round(daily.temperature_2m_max?.[i] ?? 0)
          const lo       = Math.round(daily.temperature_2m_min?.[i] ?? 0)
          const code     = daily.weather_code?.[i] ?? 0
          const precip   = daily.precipitation_sum?.[i] ?? 0
          const prob     = daily.precipitation_probability_max?.[i] ?? 0

          return (
            <div key={dateStr} className="df-row">

              {/* ── Column 1: Day + Date ──────────────────────────── */}
              <div className="df-day-col">
                <span className="df-day-name">{dayLabel}</span>
                <span className="df-day-date">{dateNum}</span>
              </div>

              {/* ── Column 2: Icon + Temps ────────────────────────── */}
              <div className="df-weather-col">
                <span className="df-icon">
                  {WMO_ICON[code] ?? '🌡️'}
                </span>
                <div className="df-temps">
                  <span className="df-high">{hi}°</span>
                  <span className="df-low">{lo}°</span>
                </div>
              </div>

              {/* ── Column 3: Precip ─────────────────────────────── */}
              <div className="df-precip-col">
                <span className="df-droplet">
                  {prob > 0 ? '💧' : ''}
                </span>
                <span className="df-precip-amount">
                  {precip > 0 ? `${precip.toFixed(2)}"` : '—'}
                </span>
                <span className={`df-precip-prob ${getPrecipClass(prob)}`}>
                  {prob}%
                </span>
              </div>

            </div>
          )
        })}
      </div>
    </div>
  )
}
