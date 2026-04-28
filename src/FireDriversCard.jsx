import React from 'react';
import './fire-components.css';

function DriverBar({ label, value, tone = 'warm', helper }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="driver-bar">
      <div className="driver-bar__topline">
        <span>{label}</span>
        <strong>{pct}</strong>
      </div>
      <div className="driver-bar__track">
        <div className={`driver-bar__fill driver-bar__fill--${tone}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="driver-bar__helper">{helper}</p>
    </div>
  );
}

export default function FireDriversCard({
  headline = 'Why conditions are elevated',
  summary = 'The biggest drivers today are low humidity, gusty wind, and warmer-than-normal afternoon temperatures.',
  drivers = [
    { label: 'Wind influence', value: 81, tone: 'hot', helper: 'Frequent gusts can accelerate spread and spotting.' },
    { label: 'Dry air', value: 74, tone: 'warm', helper: 'Lower humidity dries surface fuels more quickly.' },
    { label: 'Heat', value: 62, tone: 'sun', helper: 'Warmer air can reinforce dry afternoon fire behavior.' },
  ],
}) {
  return (
    <section className="fire-card fire-drivers-card" aria-label="Fire weather drivers">
      <div className="fire-card__header">
        <div>
          <p className="fire-kicker">Conditions</p>
          <h2>Fire Weather Drivers</h2>
        </div>
      </div>

      <p className="fire-copy">{headline}</p>
      <p className="fire-copy fire-copy--muted">{summary}</p>

      <div className="driver-bars">
        {drivers.map((driver) => (
          <DriverBar
            key={driver.label}
            label={driver.label}
            value={driver.value}
            tone={driver.tone}
            helper={driver.helper}
          />
        ))}
      </div>
    </section>
  );
}
