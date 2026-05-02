import React from 'react';

function DriverBar({ label, value, tone = 'warm', helper }) {
  const pct = Math.max(10, Math.min(95, Math.round(value)));
  return (
    <div className="driver-bar">
      <div className="driver-bar__topline">
        <span>{label}</span>
        <strong>{pct}%</strong>
      </div>
      <div className="driver-bar__track">
        <div className={`driver-bar__fill driver-bar__fill--${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="driver-bar__helper">{helper}</p>
    </div>
  );
}

export default function FireDriversCard({ current, daily }) {
  if (!current) return <section className="fire-card fire-drivers-card"><p className="section-label">Conditions</p><p>Loading...</p></section>;

  const humidity = current.relative_humidity_2m ?? 50;
  const windMph  = current.wind_speed_10m ?? 10;
  const temp     = current.temperature_2m ?? 65;
  const precipProb = daily?.precipitation_probability_max?.[0] ?? 0;

  const dryAir        = Math.max(15, Math.min(95, (100 - humidity) * 1.1 - precipProb * 0.3));
  const windInfluence = Math.max(15, Math.min(95, windMph * 4.8));           // much stronger wind weighting
  const heat          = Math.max(15, Math.min(90, (temp - 55) * 1.8));

  const drivers = [
    { label: 'Dry air',        value: dryAir,        tone: dryAir > 75 ? 'hot' : 'warm', helper: `Humidity ${humidity}% — fuels drying quickly.` },
    { label: 'Wind influence', value: windInfluence, tone: windMph > 15 ? 'hot' : 'warm', helper: `${Math.round(windMph)} mph winds can accelerate spread.` },
    { label: 'Heat / Drying',  value: heat,          tone: 'sun', helper: `Temperature near ${Math.round(temp)}°F increases evaporation.` },
  ];

  return (
    <section className="fire-card fire-drivers-card">
      <div className="fire-card__header">
        <div>
          <p className="fire-kicker">Conditions • Live</p>
          <h2>Fire Weather Drivers</h2>
        </div>
      </div>

      <p className="fire-copy">What is pushing fire danger today</p>

      <div className="driver-bars">
        {drivers.map((d, i) => (
          <DriverBar key={i} label={d.label} value={d.value} tone={d.tone} helper={d.helper} />
        ))}
      </div>
    </section>
  );
}
