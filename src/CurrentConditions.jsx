// CurrentConditions.jsx
import { useDebug } from './DebugContext';

const getCondition = (code) => {
  const WMO = {
    0:  { label: 'Clear Sky',          icon: '☀️' },
    1:  { label: 'Mainly Clear',       icon: '🌤️' },
    2:  { label: 'Partly Cloudy',      icon: '⛅' },
    3:  { label: 'Overcast',           icon: '☁️' },
    45: { label: 'Foggy',              icon: '🌫️' },
    48: { label: 'Icy Fog',            icon: '🌫️' },
    51: { label: 'Light Drizzle',      icon: '🌦️' },
    53: { label: 'Drizzle',            icon: '🌦️' },
    55: { label: 'Heavy Drizzle',      icon: '🌧️' },
    56: { label: 'Freezing Drizzle',   icon: '🌧️' },
    57: { label: 'Heavy Fr. Drizzle',  icon: '🌧️' },
    61: { label: 'Light Rain',         icon: '🌧️' },
    63: { label: 'Rain',               icon: '🌧️' },
    65: { label: 'Heavy Rain',         icon: '🌧️' },
    66: { label: 'Freezing Rain',      icon: '🌨️' },
    67: { label: 'Heavy Fr. Rain',     icon: '🌨️' },
    71: { label: 'Light Snow',         icon: '🌨️' },
    73: { label: 'Snow',               icon: '❄️' },
    75: { label: 'Heavy Snow',         icon: '❄️' },
    77: { label: 'Snow Grains',        icon: '🌨️' },
    80: { label: 'Light Showers',      icon: '🌦️' },
    81: { label: 'Showers',            icon: '🌧️' },
    82: { label: 'Heavy Showers',      icon: '⛈️' },
    85: { label: 'Snow Showers',       icon: '🌨️' },
    86: { label: 'Heavy Snow Showers', icon: '❄️' },
    95: { label: 'Thunderstorm',       icon: '⛈️' },
    96: { label: 'Thunderstorm',       icon: '⛈️' },
    99: { label: 'Thunderstorm',       icon: '⛈️' },
  };
  return WMO[code] ?? { label: 'Unknown', icon: '🌡️' };
};

const toC = (f) => Math.round((f - 32) * 5 / 9);

export default function CurrentConditions({ current, unit, fmt }) {
  const cond = getCondition(current?.weather_code);
  
  if (!current) return null;

  return (
    <section className="hero fade-in-2">
      <div className="hero-icon">{cond.icon}</div>
      <div className="hero-temp">{fmt(current.temperature_2m)}</div>
      <div className="hero-cond">{cond.label}</div>
      <div className="hero-feels">Feels like {fmt(current.apparent_temperature)}</div>
    </section>
  );
}
