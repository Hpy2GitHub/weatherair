// DaySnapshot.jsx
// Answers "what's the weather today / tomorrow?" in a graphical,
// dyslexia-friendly format.
//
// Props:
//   label   — "Today" | "Day" (any string)
//   day     — output of getDailyData() in App.jsx:
//               { weather_code, temperature_2m_max, temperature_2m_min,
//                 apparent_temperature_max (optional),
//                 precipitation_probability_max }
//   hourly  — output of getHourlyForDay() in App.jsx:
//               [{ hour: 0–23, precipitation_probability, temperature_2m }]
//   currentTemp — current temperature to display as the large primary value
//   unit    — 'f' | 'c'
//   fmt     — temperature formatter fn, e.g. (v) => `${Math.round(v)}°`
//
// NOTE: apparent_temperature_max/min are not in the default API call.
// Add them to the daily fields in useWeatherData to unlock feels-like display.

import './day-snapshot.css';

const WMO = {
  0:  { label: 'Clear sky',          type: 'sunny'  },
  1:  { label: 'Mainly clear',       type: 'sunny'  },
  2:  { label: 'Partly cloudy',      type: 'cloudy' },
  3:  { label: 'Overcast',           type: 'cloudy' },
  45: { label: 'Foggy',              type: 'cloudy' },
  48: { label: 'Icy fog',            type: 'cloudy' },
  51: { label: 'Light drizzle',      type: 'rainy'  },
  53: { label: 'Drizzle',            type: 'rainy'  },
  55: { label: 'Heavy drizzle',      type: 'rainy'  },
  56: { label: 'Freezing drizzle',   type: 'rainy'  },
  57: { label: 'Heavy fr. drizzle',  type: 'rainy'  },
  61: { label: 'Light rain',         type: 'rainy'  },
  63: { label: 'Rain',               type: 'rainy'  },
  65: { label: 'Heavy rain',         type: 'rainy'  },
  66: { label: 'Freezing rain',      type: 'rainy'  },
  67: { label: 'Heavy fr. rain',     type: 'rainy'  },
  71: { label: 'Light snow',         type: 'snowy'  },
  73: { label: 'Snow',               type: 'snowy'  },
  75: { label: 'Heavy snow',         type: 'snowy'  },
  77: { label: 'Snow grains',        type: 'snowy'  },
  80: { label: 'Light showers',      type: 'rainy'  },
  81: { label: 'Showers',            type: 'rainy'  },
  82: { label: 'Heavy showers',      type: 'rainy'  },
  85: { label: 'Snow showers',       type: 'snowy'  },
  86: { label: 'Heavy snow showers', type: 'snowy'  },
  95: { label: 'Thunderstorm',       type: 'stormy' },
  96: { label: 'Thunderstorm',       type: 'stormy' },
  99: { label: 'Thunderstorm',       type: 'stormy' },
};

// ── SVG weather art ──────────────────────────────────────────────────────────
// Each art component carries its own class for colour — set in CSS per type.
// This keeps currentColor scoped to the right element, not the whole card.

const SunnyArt = () => (
  <svg viewBox="0 0 120 120" className="ds-art ds-art--sunny" aria-hidden="true">
    <circle cx="60" cy="60" r="26" fill="currentColor" opacity="0.9"/>
    {[0,45,90,135,180,225,270,315].map((deg, i) => (
      <line key={i}
        x1={60 + Math.cos(deg * Math.PI/180) * 36}
        y1={60 + Math.sin(deg * Math.PI/180) * 36}
        x2={60 + Math.cos(deg * Math.PI/180) * 50}
        y2={60 + Math.sin(deg * Math.PI/180) * 50}
        stroke="currentColor" strokeWidth="6" strokeLinecap="round"/>
    ))}
  </svg>
);

const CloudyArt = () => (
  <svg viewBox="0 0 120 120" className="ds-art ds-art--cloudy" aria-hidden="true">
    <circle cx="42" cy="54" r="18" fill="currentColor" opacity="0.4"/>
    <circle cx="60" cy="46" r="22" fill="currentColor" opacity="0.55"/>
    <circle cx="78" cy="54" r="16" fill="currentColor" opacity="0.4"/>
    <rect x="26" y="60" width="68" height="22" rx="11" fill="currentColor" opacity="0.65"/>
  </svg>
);

const RainyArt = () => (
  <svg viewBox="0 0 120 120" className="ds-art ds-art--rainy" aria-hidden="true">
    <circle cx="40" cy="44" r="16" fill="currentColor" opacity="0.5"/>
    <circle cx="58" cy="36" r="20" fill="currentColor" opacity="0.65"/>
    <circle cx="76" cy="44" r="14" fill="currentColor" opacity="0.5"/>
    <rect x="24" y="50" width="72" height="18" rx="9" fill="currentColor" opacity="0.75"/>
    {[36,52,68,84].map((x, i) => (
      <line key={i} x1={x} y1={76 + i * 2} x2={x - 8} y2={96 + i * 2}
        stroke="currentColor" strokeWidth="5" strokeLinecap="round" opacity="0.75"/>
    ))}
  </svg>
);

const SnowyArt = () => (
  <svg viewBox="0 0 120 120" className="ds-art ds-art--snowy" aria-hidden="true">
    <circle cx="40" cy="44" r="16" fill="currentColor" opacity="0.5"/>
    <circle cx="58" cy="36" r="20" fill="currentColor" opacity="0.65"/>
    <circle cx="76" cy="44" r="14" fill="currentColor" opacity="0.5"/>
    <rect x="24" y="50" width="72" height="18" rx="9" fill="currentColor" opacity="0.75"/>
    {[36,52,68,84].map((x, i) => (
      <circle key={i} cx={x} cy={80 + i * 5} r="5"
        fill="currentColor" opacity="0.7"/>
    ))}
  </svg>
);

const StormyArt = () => (
  <svg viewBox="0 0 120 120" className="ds-art ds-art--stormy" aria-hidden="true">
    <circle cx="38" cy="42" r="18" fill="currentColor" opacity="0.5"/>
    <circle cx="60" cy="32" r="24" fill="currentColor" opacity="0.65"/>
    <circle cx="82" cy="42" r="16" fill="currentColor" opacity="0.5"/>
    <rect x="22" y="50" width="76" height="20" rx="10" fill="currentColor" opacity="0.75"/>
    <polygon points="66,72 56,90 63,90 54,108 72,84 65,84"
      fill="currentColor" opacity="0.9"/>
  </svg>
);

const ART = {
  sunny:  <SunnyArt />,
  cloudy: <CloudyArt />,
  rainy:  <RainyArt />,
  snowy:  <SnowyArt />,
  stormy: <StormyArt />,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const formatHour = (h) => {
  if (h === 0)  return '12am';
  if (h === 12) return '12pm';
  return h < 12 ? `${h}am` : `${h - 12}pm`;
};

// Blue scale legible on dark backgrounds — maps probability to opacity/shade.
const rainBarColor = (pct) => {
  if (pct < 10)  return 'rgba(96,165,250,0.18)';
  if (pct < 30)  return 'rgba(96,165,250,0.42)';
  if (pct < 55)  return 'rgba(96,165,250,0.68)';
  if (pct < 75)  return '#60a5fa';
  return '#93c5fd';
};

// ── Component ────────────────────────────────────────────────────────────────

export default function DaySnapshot({ 
    label = 'Today', 
    day, 
    hourly = [], 
    currentTemp,     
    unit = 'f', 
    fmt 
  }) {

  console.log(`DaySnapshot ${label} ${day} ${hourly} ${currentTemp} ${unit} ${fmt}`);
  if (!day) return null;

  const cond         = WMO[day.weather_code] ?? { label: 'Unknown', type: 'cloudy' };
  const maxRain      = day.precipitation_probability_max ?? 0;
  const hasFeelsLike = day.apparent_temperature_max != null;

  // Hourly entry with the highest rain probability — used for peak time label.
  const peakHour = hourly.reduce(
    (best, h) => (h.precipitation_probability ?? 0) > (best.precipitation_probability ?? 0) ? h : best,
    hourly[0] ?? {}
  );

  // 8 ticks across the day, one every 3 hours.
  const timeline = hourly.filter(h => h.hour % 3 === 0).slice(0, 8);

  return (
    <article
      className={`ds-card ds-card--${cond.type} fade-in-2`}
      aria-label={`${label} weather: ${cond.label}`}
    >

      {/* ── Day label (bigger for Tomorrow) ── */}
      <p className={`ds-label ${label === 'Tomorrow' ? 'ds-label--large' : ''}`}>
        {label}
      </p>

      {/* ── Art + condition ── */}
      <div className="ds-hero">
        {ART[cond.type] ?? ART.cloudy}
        Today
        <p className="ds-condition">{cond.label}</p>
      </div>

      {/* ── Temperature block ── */}
      <div className="ds-temps">
        <div className="ds-temp-current">
          {currentTemp != null ? (
            <span className="ds-temp-main">{fmt(currentTemp)}</span>
          ) : (
            <span className="ds-temp-main">{fmt(day.temperature_2m_max)}</span>
          )}
        </div>
        
        <div className="ds-temp-range">
          <span className="ds-temp-low">{fmt(day.temperature_2m_max)}</span>
          |
          <span className="ds-temp-low">{fmt(day.temperature_2m_min)}</span>
        </div>

        {hasFeelsLike && (
          <div className="ds-feels">
            <span className="ds-feels-label">Feels like</span>
            <span className="ds-feels-val">{fmt(day.apparent_temperature_max)}</span>
          </div>
        )}
      </div>

      {/* ── Rain block ── */}
      <div className="ds-rain">
        <div className="ds-rain-header">
          <svg className="ds-rain-drop" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M10 2 C10 2 3 10 3 14 a7 7 0 0 0 14 0 C17 10 10 2 10 2Z"
              fill="currentColor"/>
          </svg>
          <span className="ds-rain-label">Rain</span>
          <span className="ds-rain-pct">{Math.round(maxRain)}%</span>
          {maxRain >= 30 && peakHour?.hour != null && (
            <span className="ds-rain-peak">
              Most likely {formatHour(peakHour.hour)}
            </span>
          )}
        </div>

        {timeline.length > 0 && (
          <div
            className="ds-bars"
            role="img"
            aria-label={`Hourly rain chance. Peak ${Math.round(maxRain)}% around ${peakHour?.hour != null ? formatHour(peakHour.hour) : 'midday'}`}
          >
            {timeline.map((h) => (
              <div key={h.hour} className="ds-bar-col">
                <div
                  className="ds-bar"
                  style={{
                    height: `${Math.max(4, h.precipitation_probability ?? 0)}%`,
                    background: rainBarColor(h.precipitation_probability ?? 0),
                  }}
                />
                <span className="ds-bar-time">{formatHour(h.hour)}</span>
              </div>
            ))}
          </div>
        )}

        {maxRain < 10 && (
          <p className="ds-no-rain">No rain expected</p>
        )}
      </div>

    </article>
  );
}
