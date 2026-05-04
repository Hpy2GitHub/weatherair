// DewPointComfort.jsx
import { useMemo } from 'react';

/**
 * DewPointComfort
 * Shows dew point & humidity comfort relationship
 * Includes: comfort zone scatter plot + current "muggy meter" gauge
 */
const DewPointComfort = ({ current, hourly }) => {
  // ── Constants ────────────────────────────────────────────────────────
  const COMFORT_ZONES = [
    { max: 50,  label: 'Dry',          color: '#60a5fa', zoneClass: 'dp-zone--dry' },
    { max: 60,  label: 'Comfortable',  color: '#2ecc71', zoneClass: 'dp-zone--comfy' },
    { max: 65,  label: 'Sticky',       color: '#f1c40f', zoneClass: 'dp-zone--sticky' },
    { max: 70,  label: 'Muggy',        color: '#e67e22', zoneClass: 'dp-zone--muggy' },
    { max: 75,  label: 'Oppressive',   color: '#e74c3c', zoneClass: 'dp-zone--oppressive' },
    { max: Infinity, label: 'Dangerous', color: '#9b59b6', zoneClass: 'dp-zone--dangerous' },
  ];

  // ── Process hourly data for scatter plot (last 48 hours) ──────────────
  const scatterData = useMemo(() => {
    if (!hourly?.time) return [];
    const now = new Date(current?.time || Date.now());
    const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    return hourly.time
      .map((time, i) => ({
        time: new Date(time),
        temp: hourly.temperature_2m[i],
        dewPoint: hourly.dew_point_2m[i],
        humidity: hourly.relative_humidity_2m[i],
      }))
      .filter(d => d.time >= cutoff && d.temp != null && d.dewPoint != null)
      .slice(-48);
  }, [hourly, current]);

  // ── Current values ────────────────────────────────────────────────────
  const currentDewPoint = current?.dew_point_2m ?? null;
  const currentTemp = current?.temperature_2m ?? null;
  const currentHumidity = current?.relative_humidity_2m ?? null;

  // ── Determine current comfort zone ────────────────────────────────────
  const currentZone = useMemo(() => {
    if (currentDewPoint == null) return null;
    return COMFORT_ZONES.find(z => currentDewPoint < z.max);
  }, [currentDewPoint]);

  // ── Group scatter data by day for the timeline key ─────────────────────
  const dayGroups = useMemo(() => {
    const today = new Date();
    const todayStr = today.toDateString();
    
    const groups = {};
    scatterData.forEach(d => {
      const dayKey = d.time.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      if (!groups[dayKey]) {
        groups[dayKey] = { 
          points: [], 
          zones: new Set(),
          isToday: d.time.toDateString() === todayStr,
        };
      }
      groups[dayKey].points.push(d);
      const zone = COMFORT_ZONES.find(z => d.dewPoint < z.max);
      if (zone) groups[dayKey].zones.add(zone.label);
    });
    // Convert to array, keep chronological order
    return Object.entries(groups).map(([label, data]) => ({
      label,
      isToday: data.isToday,
      dominantZone: Array.from(data.zones).join(' / '),
      zoneColors: Array.from(data.zones).map(name => 
        COMFORT_ZONES.find(z => z.label === name)?.color || '#888'
      ),
    }));
  }, [scatterData]);

  // ── Compute scatter plot dimensions ───────────────────────────────────
  const plotWidth = 280;
  const plotHeight = 180;
  const padding = { top: 16, right: 12, bottom: 28, left: 36 };
  const graphWidth = plotWidth - padding.left - padding.right;
  const graphHeight = plotHeight - padding.top - padding.bottom;

  // Scale functions
  const xScale = (temp) => {
    const minTemp = 30;
    const maxTemp = 100;
    return ((temp - minTemp) / (maxTemp - minTemp)) * graphWidth + padding.left;
  };

  const yScale = (dp) => {
    const minDP = 20;
    const maxDP = 80;
    return plotHeight - padding.bottom - ((dp - minDP) / (maxDP - minDP)) * graphHeight;
  };

  // ── Comfort zone rectangles (background) ──────────────────────────────
  const zoneRects = useMemo(() => {
    const zones = [];
    const yThresholds = [20, 50, 60, 65, 70, 75, 80];
    const colors = ['rgba(96,165,250,0.08)', 'rgba(46,204,113,0.08)', 'rgba(241,196,15,0.08)', 
                    'rgba(230,126,34,0.08)', 'rgba(231,76,60,0.08)', 'rgba(155,89,182,0.08)'];
    
    for (let i = 0; i < yThresholds.length - 1; i++) {
      const y1 = yScale(yThresholds[i + 1]);
      const y2 = yScale(yThresholds[i]);
      zones.push({
        y: Math.min(y1, y2),
        height: Math.abs(y2 - y1),
        fill: colors[i],
      });
    }
    return zones;
  }, []);

  // ── Plot data points ──────────────────────────────────────────────────
  const plotPoints = useMemo(() => {
    return scatterData
      .map(d => ({
        x: xScale(d.temp),
        y: yScale(d.dewPoint),
        temp: d.temp,
        dewPoint: d.dewPoint,
        time: d.time,
      }))
      .filter(p => p.x >= padding.left && p.x <= plotWidth - padding.right);
  }, [scatterData]);

  // ── Trend line (simple linear regression) ─────────────────────────────
  const trendLine = useMemo(() => {
    if (scatterData.length < 2) return null;
    const n = scatterData.length;
    const sumX = scatterData.reduce((s, d) => s + d.temp, 0);
    const sumY = scatterData.reduce((s, d) => s + d.dewPoint, 0);
    const sumXY = scatterData.reduce((s, d) => s + d.temp * d.dewPoint, 0);
    const sumX2 = scatterData.reduce((s, d) => s + d.temp * d.temp, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const x1 = 30, x2 = 100;
    return {
      x1: xScale(x1),
      y1: yScale(slope * x1 + intercept),
      x2: xScale(x2),
      y2: yScale(slope * x2 + intercept),
      slope,
      intercept,
    };
  }, [scatterData]);

  // ── Gauge calculation ─────────────────────────────────────────────────
  const gaugeAngle = useMemo(() => {
    if (currentDewPoint == null) return 0;
    const min = 20, max = 80;
    const clamped = Math.max(min, Math.min(max, currentDewPoint));
    return ((clamped - min) / (max - min)) * 180; // 0-180 degrees
  }, [currentDewPoint]);

  // ── Feels-like description ────────────────────────────────────────────
  const feelsDescription = useMemo(() => {
    if (currentDewPoint == null) return 'No data';
    if (currentDewPoint < 50) return 'Crisp & dry — very comfortable';
    if (currentDewPoint < 60) return 'Pleasantly comfortable';
    if (currentDewPoint < 65) return 'Slightly sticky — still okay';
    if (currentDewPoint < 70) return 'Muggy — getting uncomfortable';
    if (currentDewPoint < 75) return 'Oppressive — seek A/C';
    return 'Dangerously humid';
  }, [currentDewPoint]);

  // ── Format time ───────────────────────────────────────────────────────
  const formatHour = (date) => {
    return date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
  };

  const formatDay = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { weekday: 'short' });
  };

  return (
    <div className="card dp-card">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <span className="section-label">Dew Point & Comfort</span>

      {/* ── Current Muggy Meter ──────────────────────────────────────── */}
      {currentDewPoint != null && (
        <div className="dp-current">
          <div className="dp-gauge-container">
            <svg
              viewBox="0 0 200 120"
              className="dp-gauge"
              aria-label={`Dew point ${currentDewPoint}°F — ${currentZone?.label || 'Unknown'}`}
            >
              {/* Colored comfort zones on the arc — no background track */}
              {[
                { start: 0, end: 37.5, color: '#60a5fa' },   // Dry: 20-50°F
                { start: 37.5, end: 75, color: '#2ecc71' },   // Comfortable: 50-60°F
                { start: 75, end: 93.75, color: '#f1c40f' },  // Sticky: 60-65°F
                { start: 93.75, end: 112.5, color: '#e67e22' }, // Muggy: 65-70°F
                { start: 112.5, end: 131.25, color: '#e74c3c' }, // Oppressive: 70-75°F
                { start: 131.25, end: 180, color: '#9b59b6' },  // Dangerous: 75-80°F
              ].map((zone, i) => {
                const startAngle = (zone.start - 180) * Math.PI / 180;
                const endAngle = (zone.end - 180) * Math.PI / 180;
                const r = 90;
                const cx = 100, cy = 110;
                
                const x1 = cx + r * Math.cos(startAngle);
                const y1 = cy + r * Math.sin(startAngle);
                const x2 = cx + r * Math.cos(endAngle);
                const y2 = cy + r * Math.sin(endAngle);
                
                return (
                  <path
                    key={i}
                    d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                    fill="none"
                    stroke={zone.color}
                    strokeWidth="8"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                );
              })}
              
              {/* Needle */}
              <line
                x1="100"
                y1="110"
                x2={100 + 80 * Math.cos((gaugeAngle - 180) * Math.PI / 180)}
                y2={110 + 80 * Math.sin((gaugeAngle - 180) * Math.PI / 180)}
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
              
              {/* Center dot */}
              <circle cx="100" cy="110" r="4" fill="white" />
            </svg>
            
            {/* Gauge value overlay */}
            <div className={`dp-gauge-value ${currentZone?.zoneClass || ''}`}>
              <span className="dp-gauge-num">{Math.round(currentDewPoint)}°</span>
              <span className="dp-gauge-label">dew point</span>
            </div>
          </div>

          {/* Current stats */}
          <div className="dp-current-stats">
            <div className="dp-stat">
              <span className="dp-stat-label">Feels</span>
              <span className={`dp-stat-value ${currentZone?.zoneClass || ''}`}>
                {currentZone?.label || '—'}
              </span>
            </div>
            <div className="dp-stat">
              <span className="dp-stat-label">Humidity</span>
              <span className="dp-stat-value">
                {currentHumidity != null ? `${currentHumidity}%` : '—'}
              </span>
            </div>
            <div className="dp-stat">
              <span className="dp-stat-label">Temperature</span>
              <span className="dp-stat-value">
                {currentTemp != null ? `${Math.round(currentTemp)}°F` : '—'}
              </span>
            </div>
          </div>
          
          <p className={`dp-description ${currentZone?.zoneClass || ''}`}>
            {feelsDescription}
          </p>
        </div>
      )}

      {/* ── 48-Hour Scatter Plot ──────────────────────────────────────── */}
      {scatterData.length > 0 && (
        <div className="dp-plot-section">
          <span className="dp-plot-label">48-Hour Trend</span>
          
          <svg
            viewBox={`0 0 ${plotWidth} ${plotHeight}`}
            className="dp-scatter"
            aria-label="Dew point vs temperature over last 48 hours"
          >
            {/* Comfort zone backgrounds */}
            {zoneRects.map((zone, i) => (
              <rect
                key={i}
                x={padding.left}
                y={zone.y}
                width={graphWidth}
                height={zone.height}
                fill={zone.fill}
              />
            ))}

            {/* Grid lines */}
            {[30, 40, 50, 60, 70, 80, 90, 100].map(temp => (
              <line
                key={`gx-${temp}`}
                x1={xScale(temp)}
                y1={padding.top}
                x2={xScale(temp)}
                y2={plotHeight - padding.bottom}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="0.5"
              />
            ))}
            {[30, 40, 50, 60, 70].map(dp => (
              <line
                key={`gy-${dp}`}
                x1={padding.left}
                y1={yScale(dp)}
                x2={plotWidth - padding.right}
                y2={yScale(dp)}
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="0.5"
              />
            ))}

            {/* Zone threshold lines */}
            {[50, 60, 65, 70, 75].map((dp, i) => {
              const colors = ['#60a5fa', '#2ecc71', '#f1c40f', '#e67e22', '#e74c3c'];
              return (
                <line
                  key={`thresh-${dp}`}
                  x1={padding.left}
                  y1={yScale(dp)}
                  x2={plotWidth - padding.right}
                  y2={yScale(dp)}
                  stroke={colors[i]}
                  strokeWidth="0.5"
                  strokeDasharray="3,3"
                  opacity="0.4"
                />
              );
            })}

            {/* Trend line */}
            {trendLine && (
              <line
                x1={trendLine.x1}
                y1={trendLine.y1}
                x2={trendLine.x2}
                y2={trendLine.y2}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth="1"
                strokeDasharray="5,3"
              />
            )}

            {/* Data points — colored by comfort zone */}
            {plotPoints.map((point, i) => {
              const zone = COMFORT_ZONES.find(z => point.dewPoint < z.max);
              
              return (
                <circle
                  key={i}
                  cx={point.x}
                  cy={point.y}
                  r="2.5"
                  fill={zone?.color || '#60a5fa'}
                  opacity="0.7"
                >
                  <title>
                    {`${formatDay(point.time)} ${formatHour(point.time)}\nTemp: ${Math.round(point.temp)}°F\nDew Point: ${Math.round(point.dewPoint)}°F`}
                  </title>
                </circle>
              );
            })}

            {/* Current point highlight */}
            {currentTemp != null && currentDewPoint != null && (() => {
              const cx = xScale(currentTemp);
              const cy = yScale(currentDewPoint);
              if (cx < padding.left || cx > plotWidth - padding.right) return null;
              return (
                <>
                  <circle
                    cx={cx}
                    cy={cy}
                    r="4"
                    fill="white"
                    stroke="rgba(255,255,255,0.5)"
                    strokeWidth="1"
                  />
                  <circle
                    cx={cx}
                    cy={cy}
                    r="8"
                    fill="none"
                    stroke="white"
                    strokeWidth="0.5"
                    opacity="0.3"
                  />
                </>
              );
            })()}

            {/* X-axis labels */}
            <text x={padding.left} y={plotHeight - 6} className="dp-axis-label" fill="currentColor">
              30°
            </text>
            <text x={padding.left + graphWidth / 2} y={plotHeight - 6} className="dp-axis-label" fill="currentColor" textAnchor="middle">
              Temperature °F
            </text>
            <text x={plotWidth - padding.right} y={plotHeight - 6} className="dp-axis-label" fill="currentColor" textAnchor="end">
              100°
            </text>

            {/* Y-axis labels */}
            <text x={padding.left - 6} y={yScale(30) + 4} className="dp-axis-label" fill="currentColor" textAnchor="end">
              30°
            </text>
            <text x={padding.left - 6} y={yScale(50) + 4} className="dp-axis-label" fill="currentColor" textAnchor="end">
              50°
            </text>
            <text x={padding.left - 6} y={yScale(70) + 4} className="dp-axis-label" fill="currentColor" textAnchor="end">
              70°
            </text>
          </svg>
        </div>
      )}

      {/* ── Day Timeline Key ──────────────────────────────────────────── */}
      {dayGroups.length > 0 && (
        <div className="dp-day-key">
          <span className="dp-day-key-label">Timeline</span>
          <div className="dp-day-key-items">
            {dayGroups.map((group, i) => (
              <div key={i} className={`dp-day-key-item ${group.isToday ? 'dp-day-key-item--today' : ''}`}>
                <span className="dp-day-key-date">
                  {group.isToday ? 'Today' : group.label}
                </span>
                <div className="dp-day-key-dots">
                  {group.zoneColors.map((color, j) => (
                    <span
                      key={j}
                      className={`dp-day-key-dot ${group.isToday ? 'dp-day-key-dot--today' : ''}`}
                      style={{ background: color }}
                      title={group.dominantZone}
                    />
                  ))}
                </div>
                <span className="dp-day-key-zone">{group.dominantZone}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Comfort Zone Legend ───────────────────────────────────────── */}
      <div className="dp-legend">
        {COMFORT_ZONES.map((zone, i) => (
          <div key={i} className="dp-legend-item">
            <span
              className="dp-legend-dot"
              style={{ background: zone.color }}
            />
            <span>{zone.label}</span>
            <span className="dp-legend-range">
              {(i === 0 ? '<' : '')}{zone.max === Infinity ? '75+' : zone.max}°
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DewPointComfort;
