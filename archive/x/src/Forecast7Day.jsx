// Forecast7Day.jsx
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const WMO = {
  0:  { label: 'Clear',           icon: '☀️' },
  1:  { label: 'Mostly Clear',    icon: '🌤️' },
  2:  { label: 'Partly Cloudy',   icon: '⛅' },
  3:  { label: 'Overcast',        icon: '☁️' },
  45: { label: 'Foggy',           icon: '🌫️' },
  48: { label: 'Icy Fog',         icon: '🌫️' },
  51: { label: 'Light Drizzle',   icon: '🌦️' },
  53: { label: 'Drizzle',         icon: '🌦️' },
  55: { label: 'Heavy Drizzle',   icon: '🌧️' },
  56: { label: 'Frz Drizzle',     icon: '🌧️' },
  57: { label: 'Hvy Frz Drizzle', icon: '🌧️' },
  61: { label: 'Light Rain',      icon: '🌧️' },
  63: { label: 'Rain',            icon: '🌧️' },
  65: { label: 'Heavy Rain',      icon: '🌧️' },
  66: { label: 'Frz Rain',        icon: '🌨️' },
  67: { label: 'Hvy Frz Rain',    icon: '🌨️' },
  71: { label: 'Light Snow',      icon: '🌨️' },
  73: { label: 'Snow',            icon: '❄️' },
  75: { label: 'Heavy Snow',      icon: '❄️' },
  77: { label: 'Snow Grains',     icon: '🌨️' },
  80: { label: 'Light Showers',   icon: '🌦️' },
  81: { label: 'Showers',         icon: '🌧️' },
  82: { label: 'Hvy Showers',     icon: '⛈️' },
  85: { label: 'Snow Showers',    icon: '🌨️' },
  86: { label: 'Hvy Snow Showers',icon: '❄️' },
  95: { label: 'Thunderstorm',    icon: '⛈️' },
  96: { label: 'Thunderstorm',    icon: '⛈️' },
  99: { label: 'Thunderstorm',    icon: '⛈️' },
};

const getCondition = (code) => WMO[code] ?? { label: 'Unknown', icon: '🌡️' };

// Precip color based on probability
const precipColor = (pct) => {
  if (pct >= 70) return '#93c5fd';
  if (pct >= 40) return '#60a5fa';
  return 'rgba(96,165,250,0.5)';
};

export default function Forecast7Day({ daily, fmt }) {
  if (!daily) return null;

  const allHighs = daily.temperature_2m_max;
  const allLows  = daily.temperature_2m_min;
  const weekMin  = Math.min(...allLows);
  const weekMax  = Math.max(...allHighs);
  const weekSpan = weekMax - weekMin || 1;

  return (
    <section className="card fade-in-4">
      <p className="section-label">7-Day Forecast</p>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {daily.time.map((dateStr, i) => {
          const d      = new Date(dateStr);
          const label  = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAYS[d.getUTCDay()];
          const cond   = getCondition(daily.weather_code[i]);
          const pct    = daily.precipitation_probability_max[i] ?? 0;
          const hi     = daily.temperature_2m_max[i];
          const lo     = daily.temperature_2m_min[i];
          const isLast = i === daily.time.length - 1;
          const isToday = i === 0;

          // Bar position within week range
          const barLeft  = ((lo - weekMin) / weekSpan) * 100;
          const barWidth = ((hi - lo) / weekSpan) * 100;

          return (
            <div
              key={dateStr}
              style={{
                display: 'grid',
                gridTemplateColumns: '72px 26px 1fr auto',
                alignItems: 'center',
                gap: '10px',
                padding: '11px 0',
                borderBottom: isLast ? 'none' : '1px solid var(--border)',
                borderLeft: isToday ? '2px solid rgba(96,165,250,0.4)' : '2px solid transparent',
                paddingLeft: isToday ? '8px' : '0',
              }}
            >
              {/* Day name + condition label */}
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: '12px',
                  color: isToday ? 'var(--text)' : 'var(--muted)',
                  fontWeight: isToday ? '500' : '400',
                  whiteSpace: 'nowrap',
                }}>
                  {label}
                </div>
                <div style={{
                  fontSize: '9px',
                  letterSpacing: '0.3px',
                  color: 'var(--dim)',
                  marginTop: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {cond.label}
                </div>
              </div>

              {/* Weather icon */}
              <div style={{ fontSize: '18px', textAlign: 'center', lineHeight: 1 }}>
                {cond.icon}
              </div>

              {/* Temp range bar + precip */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {/* Range bar */}
                <div style={{
                  position: 'relative',
                  height: '4px',
                  borderRadius: '2px',
                  background: 'rgba(255,255,255,0.07)',
                }}>
                  <div style={{
                    position: 'absolute',
                    left: `${barLeft}%`,
                    width: `${barWidth}%`,
                    height: '100%',
                    borderRadius: '2px',
                    background: isToday
                      ? 'linear-gradient(90deg, #60a5fa, #93c5fd)'
                      : 'rgba(255,255,255,0.3)',
                  }} />
                </div>

                {/* Precip row */}
                {pct > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '10px', opacity: 0.5 }}>💧</span>
                    <span style={{
                      fontSize: '10px',
                      color: precipColor(pct),
                      fontFamily: 'var(--mono)',
                    }}>
                      {pct}%
                    </span>
                  </div>
                ) : (
                  <div style={{ height: '14px' }} />
                )}
              </div>

              {/* Hi / Lo temps */}
              <div style={{
                display: 'flex',
                gap: '6px',
                alignItems: 'baseline',
                fontFamily: 'var(--serif)',
                flexShrink: 0,
              }}>
                <span style={{
                  fontSize: '17px',
                  color: 'var(--text)',
                  fontWeight: '300',
                }}>
                  {fmt(hi)}
                </span>
                <span style={{
                  fontSize: '13px',
                  color: 'var(--muted)',
                  fontWeight: '300',
                }}>
                  {fmt(lo)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
} 
