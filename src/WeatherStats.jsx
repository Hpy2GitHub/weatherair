// WeatherStats.jsx
const WIND_DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const windDir = (deg) => WIND_DIRS[Math.round(deg / 45) % 8];

const fmtTime = (d) => {
  if (!d) return '—';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

function Stat({ label, value, last }) {
  return (
    <div className={`stat-row${last ? ' last' : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

export default function WeatherStats({ current, daily }) {
  if (!current || !daily) return null;

  return (
    <section className="card fade-in-3">
      <Stat label="Humidity" value={`${current.relative_humidity_2m}%`} />
      <Stat label="Wind" value={`${Math.round(current.wind_speed_10m)} mph ${windDir(current.wind_direction_10m)}`} />
      <Stat label="Precipitation" value={`${current.precipitation.toFixed(2)}"`} />
      <Stat 
        label="Sunrise / Sunset" 
        value={`${fmtTime(new Date(daily.sunrise[0]))} / ${fmtTime(new Date(daily.sunset[0]))}`} 
        last 
      />
    </section>
  );
}
