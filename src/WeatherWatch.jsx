// WeatherWatch.jsx
import React from 'react';

const WMO = {
  0:  { label: 'Clear Sky',          image: '/images/sky/clear-sky.jpg' },
  1:  { label: 'Mainly Clear',       image: '/images/sky/clear-sky.jpg' },
  2:  { label: 'Partly Cloudy',      image: '/images/sky/clear-sky.jpg' },
  3:  { label: 'Overcast',           image: '/images/sky/clear-sky.jpg' },
  95: { label: 'Thunderstorm',      image: '/images/sky/clear-sky.jpg' },
};

export default function WeatherWatch({ current, daily, unit }) {
  if (!current) return null;

  const cond = WMO[current.weather_code] || { label: 'Unknown', image: '/images/sky/clear-sky.jpg' };
  const precip = daily?.precipitation_probability_max?.[0];
  const windUnit = unit === 'ms' ? 'm/s' : 'km/h';
  
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  return (
    <section className="ww-watch-case">
      <div className="ww-face">
        
        {/* Background Layer */}
        {cond.image && (
          <div className="ww-bg-image" style={{ backgroundImage: `url(${cond.image})` }} />
        )}
        <div className="ww-glass-overlay" />

        {/* This container MUST have height: 100% in CSS */}
        <div className="ww-content-layer">
          
          <div className="ww-top-stack">
            <div className="ww-main-temp">{Math.round(current.temperature_2m)}°</div>
            <div className="ww-sub-label">FEELS LIKE {Math.round(current.apparent_temperature)}°</div>
          </div>

          <div className="ww-middle-stack">
            <div className="ww-highlow-row">
              <div className="ww-mini-stat">
                <span className="ww-tiny-label">MAX</span>
                <span className="ww-stat-val">{Math.round(daily?.temperature_2m_max?.[0] || 0)}°</span>
              </div>
              <div className="ww-mini-stat">
                <span className="ww-tiny-label">MIN</span>
                <span className="ww-stat-val">{Math.round(daily?.temperature_2m_min?.[0] || 0)}°</span>
              </div>
            </div>

            <hr className="ww-watch-divider" />

            <div className="ww-trio-row">
              <div className="ww-mini-stat">
                <span className="ww-tiny-label">CHANCE</span>
                <span className="ww-stat-val">{precip}%</span>
              </div>
              <div className="ww-mini-stat">
                <span className="ww-tiny-label">WIND</span>
                <div className="ww-wind-box">
                  <span className="ww-arrow" style={{ transform: `rotate(${current.wind_direction_10m}deg)` }}>↑</span>
                  <span className="ww-stat-val">{Math.round(current.wind_speed_10m)}</span>
                </div>
              </div>
              <div className="ww-mini-stat">
                <span className="ww-tiny-label">BARO</span>
                <span className="ww-stat-val">{Math.round(current.surface_pressure)}</span>
              </div>
            </div>
          </div>

          <div className="ww-bottom-stack">
            <div className="ww-condition-name">{cond.label.toUpperCase()}</div>
            <div className="ww-date-row">
              <span className="ww-day-accent">{dayName}</span>
              <span className="ww-time-val">{timeStr}</span>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
