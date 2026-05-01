// WeatherStats.jsx
const WIND_DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
const windDir = (deg) => WIND_DIRS[Math.round(deg / 45) % 8];

const fmtTime = (d) => {
  if (!d) return '—';
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

// Pressure trend arrow
function pressureArrow(trend) {
  if (trend == null) return '';
  if (trend > 1)  return ' ↑';
  if (trend < -1) return ' ↓';
  return ' →';
}

// UV index label
function uvLabel(uv) {
  if (uv == null) return '—';
  if (uv <= 2)  return 'Low';
  if (uv <= 5)  return 'Moderate';
  if (uv <= 7)  return 'High';
  if (uv <= 10) return 'Very High';
  return 'Extreme';
}

// AQI meta (mirrors AirQuality.jsx)
const AQI_LEVELS = [
  { max: 50,       label: 'Good',                    color: '#4ade80' },
  { max: 100,      label: 'Moderate',                color: '#facc15' },
  { max: 150,      label: 'Unhealthy for Sensitive', color: '#fb923c' },
  { max: 200,      label: 'Unhealthy',               color: '#f87171' },
  { max: 300,      label: 'Very Unhealthy',          color: '#c084fc' },
  { max: Infinity, label: 'Hazardous',               color: '#9f1239' },
];
const getAqiMeta = (val) => AQI_LEVELS.find((l) => val <= l.max) ?? AQI_LEVELS.at(-1);

// Visibility: meters → miles
const visMiles = (m) => {
  if (m == null) return null;
  return (m / 1609.34).toFixed(1);
};

function Stat({ label, value, color, last }) {
  return (
    <div className={`stat-row${last ? ' last' : ''}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value" style={color ? { color } : undefined}>{value}</span>
    </div>
  );
}

export default function WeatherStats({ current, daily, aqiData }) {
  if (!current || !daily) return null;

  const trend      = current._pressureTrend;
  const pressureHpa = current.surface_pressure ?? current.pressure_msl;
  const pressureInHg = pressureHpa != null ? (pressureHpa * 0.02953).toFixed(2) : '—';

  const uv      = current.uv_index ?? daily.uv_index_max?.[0];
  const uvMeta  = uv != null ? uvLabel(uv) : '—';

  const humidHi  = daily.relative_humidity_2m_max?.[0];
  const humidLo  = daily.relative_humidity_2m_min?.[0];
  const humidRange = (humidHi != null && humidLo != null)
    ? `${humidLo}% – ${humidHi}%`
    : '—';

  const vis = visMiles(current.visibility);

  const dewPoint = current.dew_point_2m != null
    ? `${Math.round(current.dew_point_2m)}°`
    : '—';

  const precipRate = current.precipitation_rate != null
    ? `${current.precipitation_rate.toFixed(2)}" /hr`
    : '—';

  const precipAmt = current.precipitation != null
    ? `${current.precipitation.toFixed(2)}"`
    : '—';

  // AQI summary from passed-in aqiData (optional)
  const aqiVal  = aqiData?.us_aqi != null ? Math.round(aqiData.us_aqi) : null;
  const aqiMeta = aqiVal != null ? getAqiMeta(aqiVal) : null;

  return (
    <section className="card fade-in-3">
      <Stat
        label="Humidity"
        value={`${current.relative_humidity_2m}%`}
      />
      <Stat
        label="Humidity Hi / Lo"
        value={humidRange}
      />
      <Stat
        label="Dew Point"
        value={dewPoint}
      />
      <Stat
        label="Wind"
        value={`${Math.round(current.wind_speed_10m)} mph ${windDir(current.wind_direction_10m)}`}
      />
      <Stat
        label="Pressure"
        value={`${pressureInHg}" ${pressureArrow(trend)}`}
      />
      <Stat
        label="UV Index"
        value={uv != null ? `${Math.round(uv)} · ${uvMeta}` : '—'}
      />
      <Stat
        label="Visibility"
        value={vis != null ? `${vis} mi` : '—'}
      />
      <Stat
        label="Precip Rate"
        value={precipRate}
      />
      <Stat
        label="Precip Amount"
        value={precipAmt}
      />
      {aqiVal != null && (
        <Stat
          label="Air Quality"
          value={`${aqiVal} · ${aqiMeta.label}`}
          color={aqiMeta.color}
        />
      )}
      <Stat
        label="Sunrise / Sunset"
        value={`${fmtTime(new Date(daily.sunrise[0]))} / ${fmtTime(new Date(daily.sunset[0]))}`}
        last
      />
    </section>
  );
} 
