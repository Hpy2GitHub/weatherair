import React from 'react';
import './fire-components.css';

const levelMeta = {
  low: {
    label: 'Low',
    color: '#2d6a4f',
    glow: 'rgba(45,106,79,0.18)',
    copy: 'Conditions are not especially favorable for wildfire ignition or rapid spread today.',
  },
  moderate: {
    label: 'Moderate',
    color: '#c17c00',
    glow: 'rgba(193,124,0,0.18)',
    copy: 'Vegetation can burn and fires may spread if wind picks up or humidity drops.',
  },
  high: {
    label: 'High',
    color: '#d9480f',
    glow: 'rgba(217,72,15,0.18)',
    copy: 'Dry fuels and weather conditions can support fast-moving fires. Use extra caution.',
  },
  extreme: {
    label: 'Extreme',
    color: '#9d0208',
    glow: 'rgba(157,2,8,0.22)',
    copy: 'Explosive fire growth is possible. Follow local officials and avoid spark-producing activity.',
  },
};

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${Math.round(value)}%`;
}

function formatWind(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${Math.round(value)} mph`;
}

export default function FireRiskCard({
  level = 'high',
  score = 72,
  location = 'West Belmar, NJ',
  updatedAt = 'Updated 12:05 PM',
  humidity = 24,
  windMph = 19,
  gustMph = 31,
  temperature = 78,
  reason = 'Strong southwest wind and low afternoon humidity are pushing fire danger higher than normal.',
}) {
  const meta = levelMeta[level] || levelMeta.high;
  const ringDegrees = Math.max(0, Math.min(100, score)) * 3.6;

  return (
    <section className="fire-card fire-risk-card" aria-label="Today fire risk">
      <div className="fire-card__header">
        <div>
          <p className="fire-kicker">Wildfire outlook</p>
          <h2>Today&apos;s Fire Risk</h2>
        </div>
        <div className="fire-chip" style={{ '--chip-color': meta.color, '--chip-glow': meta.glow }}>
          {meta.label}
        </div>
      </div>

      <div className="fire-risk-card__hero">
        <div
          className="fire-score-ring"
          style={{
            '--ring-color': meta.color,
            '--ring-glow': meta.glow,
            '--ring-deg': `${ringDegrees}deg`,
          }}
        >
          <div className="fire-score-ring__inner">
            <span className="fire-score-ring__value">{score}</span>
            <span className="fire-score-ring__label">risk score</span>
          </div>
        </div>

        <div className="fire-risk-card__summary">
          <p className="fire-location">{location}</p>
          <p className="fire-copy">{reason}</p>
          <p className="fire-copy fire-copy--muted">{meta.copy}</p>
          <p className="fire-updated">{updatedAt}</p>
        </div>
      </div>

      <div className="fire-metric-grid">
        <article className="fire-metric">
          <span className="fire-metric__label">Humidity</span>
          <strong>{formatPercent(humidity)}</strong>
        </article>
        <article className="fire-metric">
          <span className="fire-metric__label">Sustained wind</span>
          <strong>{formatWind(windMph)}</strong>
        </article>
        <article className="fire-metric">
          <span className="fire-metric__label">Peak gust</span>
          <strong>{formatWind(gustMph)}</strong>
        </article>
        <article className="fire-metric">
          <span className="fire-metric__label">Temperature</span>
          <strong>{temperature ?? '—'}°</strong>
        </article>
      </div>
    </section>
  );
}
