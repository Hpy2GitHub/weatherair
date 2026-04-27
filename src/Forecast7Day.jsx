// Forecast7Day.jsx
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getCondition = (code) => {
  const WMO = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌦️', 55: '🌧️', 56: '🌧️', 57: '🌧️',
    61: '🌧️', 63: '🌧️', 65: '🌧️', 66: '🌨️', 67: '🌨️',
    71: '🌨️', 73: '❄️', 75: '❄️', 77: '🌨️',
    80: '🌦️', 81: '🌧️', 82: '⛈️', 85: '🌨️', 86: '❄️',
    95: '⛈️', 96: '⛈️', 99: '⛈️',
  };
  return WMO[code] ?? '🌡️';
};

export default function Forecast7Day({ daily, fmt }) {
  if (!daily) return null;

  return (
    <section className="card fade-in-4">
      <p className="section-label">7-Day Forecast</p>
      {daily.time.map((dateStr, i) => {
        const d = new Date(dateStr);
        
        /**
         * FIX: We use getUTCDay() because Open-Meteo dates are YYYY-MM-DD.
         * "new Date('2026-04-29')" defaults to UTC midnight, which in EDT 
         * is actually 8:00 PM the night before. getUTCDay() ignores your 
         * local computer's clock and looks at the date string directly.
         */
        const dayName = DAYS[d.getUTCDay()];
        
        const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAYS[d.getUTCDay()]
        const icon = getCondition(daily.weather_code[i]);
        const pct = daily.precipitation_probability_max[i];
        const last = i === daily.time.length - 1;
        
        return (
          <div key={dateStr} className={`day-row${last ? ' last' : ''}`}>
            <span className={`day-name${i === 0 ? ' today' : ''}`}>{label}</span>
            <span className="day-icon">{icon}</span>
            <div className="precip-bar" title={`${pct}% chance of rain`}>
              <div className="precip-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="day-range">
              <span className="day-low">{fmt(daily.temperature_2m_min[i])}</span>
              <span className="day-high">{fmt(daily.temperature_2m_max[i])}</span>
            </div>
          </div>
        );
      })}
    </section>
  );
}
