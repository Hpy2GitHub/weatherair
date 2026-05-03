// WeatherHeader.jsx
export default function WeatherHeader({ location, unit, setUnit }) {
  return (
    <header className="header fade-in">
      <div>
        <h1 className="city">{location?.city || 'Loading...'}</h1>
        <p className="region">
          {[location?.region, location?.country].filter(Boolean).join(' · ')}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <div className="unit-toggle">
          <button className={unit === 'f' ? 'active' : ''} onClick={() => setUnit('f')}>°F</button>
          <button className={unit === 'c' ? 'active' : ''} onClick={() => setUnit('c')}>°C</button>
        </div>
      </div>
    </header>
  );
}
