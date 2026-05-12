// WeatherWatch.jsx
import React from 'react';

const base = import.meta.env.BASE_URL;

const WMO = {
  0:  { label: 'Clear Sky',          icon: '☀️', image: `${base}images/sky/clear-sky.jpg` },
  1:  { label: 'Mainly Clear',       icon: '🌤️', image: `${base}images/sky/mainly-clear.png` },
  2:  { label: 'Partly Cloudy',      icon: '⛅', image: `${base}images/sky/partly-cloudy.jpg` },
  3:  { label: 'Overcast',           icon: '☁️', image: `${base}images/sky/overcast.png` },
  45: { label: 'Foggy',              icon: '🌫️', image: `${base}images/sky/freezing-fog.png` },
  48: { label: 'Icy Fog',            icon: '🌫️', image: `${base}images/sky/freezing-fog.png` },
  51: { label: 'Light Drizzle',      icon: '🌦️', image: `${base}images/sky/drizzle.png` },
  53: { label: 'Drizzle',            icon: '🌦️', image: `${base}images/sky/drizzle.png` },
  55: { label: 'Heavy Drizzle',      icon: '🌧️', image: `${base}images/sky/drizzle.png` },
  56: { label: 'Freezing Drizzle',   icon: '🌧️', image: `${base}images/sky/freezing-drizzle.png` },
  57: { label: 'Heavy Fr. Drizzle',  icon: '🌧️', image: `${base}images/sky/heavy-freezing-drizzle.jpg` },
  61: { label: 'Light Rain',         icon: '🌧️', image: `${base}images/sky/light-rain.jpg` },
  63: { label: 'Rain',               icon: '🌧️', image: `${base}images/sky/rain.png` },
  65: { label: 'Heavy Rain',         icon: '🌧️', image: `${base}images/sky/heavy-rain.png` },
  66: { label: 'Freezing Rain',      icon: '🌨️', image: `${base}images/sky/freezing-rain.png` },
  67: { label: 'Heavy Fr. Rain',     icon: '🌨️', image: `${base}images/sky/freezing-rain.png` },
  71: { label: 'Light Snow',         icon: '🌨️', image: `${base}images/sky/light-snow.jpg` },
  73: { label: 'Snow',               icon: '❄️', image: `${base}images/sky/snow.jpg` },
  75: { label: 'Heavy Snow',         icon: '❄️', image: `${base}images/sky/heavy-snow.png` },
  77: { label: 'Snow Grains',        icon: '🌨️' , image: `${base}images/sky/snow-grains.jpg` },
  80: { label: 'Light Showers',      icon: '🌦️', image: `${base}images/sky/light-showers.jpg` },
  81: { label: 'Showers',            icon: '🌧️', image: `${base}images/sky/rain-showers.jpg` },
  82: { label: 'Heavy Showers',      icon: '⛈️', image: `${base}images/sky/heavy-showers.jpg` },
  85: { label: 'Snow Showers',       icon: '🌨️', image: `${base}images/sky/snow.jpg` },
  86: { label: 'Heavy Snow Showers', icon: '❄️', image: `${base}images/sky/heavy-snow.png` },
  95: { label: 'Thunderstorm',       icon: '⛈️', image: `${base}images/sky/storm-cloud.png` },
  96: { label: 'Thunderstorm',       icon: '⛈️', image: `${base}images/sky/thunderstorm2.jpg` },
  99: { label: 'Thunderstorm',       icon: '⛈️' , image: `${base}images/sky/thunderstorm3d.jpg` },
};

// Helper: determine if it's currently nighttime based on daily sunrise/sunset
function isNightTime(sunrise, sunset) {
  if (!sunrise || !sunset) return false;
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  
  // Parse sunrise/sunset (expected as ISO date strings or Date objects)
  const sr = new Date(sunrise);
  const ss = new Date(sunset);
  const srMinutes = sr.getHours() * 60 + sr.getMinutes();
  const ssMinutes = ss.getHours() * 60 + ss.getMinutes();
  
  return nowMinutes < srMinutes || nowMinutes > ssMinutes;
}

export default function WeatherWatch({ current, daily, unit }) {
  console.log('WeatherWatch: current=', current);
  if (!current) return null;

  const cond = WMO[current.weather_code] || { label: 'Unknown', image: `${base}images/sky/clear-sky.jpg` };
  console.log(`WeatherWatch: weather_code=${current.weather_code} cond=${cond.image}`);
  
  // --- TEMPORARY HACK: Force thunderstorm code for testing (DELETE THIS LINE) ---
 current.weather_code = 95;
 // remove after testing 
 console.log('THUNDERSTORM HACK ACTIVE. isThunderstorm will be:', [95, 96, 99].includes(current.weather_code));
  
  const precip = daily?.precipitation_probability_max?.[0];
  const windUnit = unit === 'ms' ? 'm/s' : 'km/h';
  
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  // --- NEW: Determine nighttime and thunderstorm conditions ---
  const nighttime = isNightTime(daily?.sunrise?.[0], daily?.sunset?.[0]);
  const isThunderstorm = [95, 96, 99].includes(current.weather_code);
  
  return (
    <section className="ww-watch-case">
      <div className="ww-face">
        
        {/* Background Layer */}
        {cond.image && (
          <div className="ww-bg-image" style={{ backgroundImage: `url(${cond.image})` }} />
        )}

{/* remove after testing 
{cond.image && (
  <div className="ww-bg-image" style={{ backgroundImage: `none` }} />
)}
*/}
        <div className="ww-glass-overlay" />

        {/* 
          NEW: Nighttime darkening overlay.
          To adjust the darkness level, edit the CSS for .ww-night-overlay 
          and change the background-color alpha value (e.g., rgba(0,0,0,0.6) for stronger darkening).
        */}
        {nighttime && <div className="ww-night-overlay" />}

        {/* 
          NEW: Thunderstorm cloud image inside the center ring.
          To resize the thundercloud image, edit the CSS for .ww-thundercloud-img
          and change the width/height properties (currently suggested: width: 60%; max-width: 200px;).
          For a larger image, increase the percentage or max-width.
        */}
        {isThunderstorm && (
          <div className={`ww-thundercloud-container ${nighttime ? '' : 'ww-thundercloud-day'}`}>
            <img 
              src={`${base}images/sky/thundercloud.png`} 
              alt="Thunderstorm" 
              className="ww-thundercloud-img"
            />
          </div>
        )}

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
