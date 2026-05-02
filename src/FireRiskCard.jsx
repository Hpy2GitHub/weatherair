import React from 'react';

const levelMeta = {
  low:      { label: 'Low',      color: '#2d6a4f', glow: 'rgba(45,106,79,0.18)',  copy: 'Conditions are not favorable for wildfire ignition or rapid spread today.' },
  moderate: { label: 'Moderate', color: '#c17c00', glow: 'rgba(193,124,0,0.18)', copy: 'Vegetation can burn if wind increases or humidity drops further.' },
  high:     { label: 'High',     color: '#d9480f', glow: 'rgba(217,72,15,0.18)', copy: 'Dry fuels and weather conditions can support fast-moving fires.' },
  extreme:  { label: 'Extreme',  color: '#9d0208', glow: 'rgba(157,2,8,0.22)',  copy: 'Explosive fire growth is possible. Follow local fire restrictions.' },
};

function formatPercent(value) { return value != null ? `${Math.round(value)}%` : '—'; }
function formatWind(value) { return value != null ? `${Math.round(value)} mph` : '—'; }

export default function FireRiskCard({ current, daily }) {
  if (!current) return <section className="fire-card fire-risk-card"><p className="section-label">Today&apos;s Fire Risk</p><p>Loading...</p></section>;

  const humidity = current.relative_humidity_2m ?? 50;
  const windMph  = current.wind_speed_10m ?? 8;
  const gustMph  = Math.round(windMph * 1.35);
  const temp     = Math.round(current.temperature_2m ?? 65);
  const precipProb = daily?.precipitation_probability_max?.[0] ?? 0;

  // Improved balanced scoring (0-100)
  let score = 25;

  score += (100 - humidity) * 0.45;     // Dry air - strong but not overwhelming
  score += windMph * 2.1;               // Wind has major impact on spread
  score += (temp - 60) * 0.75;          // Heat / drying effect
  score -= precipProb * 0.55;           // Recent rain chance lowers risk

  score = Math.max(15, Math.min(94, Math.round(score)));

  let riskLevel = 'low';
  if (score >= 78) riskLevel = 'extreme';
  else if (score >= 62) riskLevel = 'high';
  else if (score >= 45) riskLevel = 'moderate';

  const meta = levelMeta[riskLevel] || levelMeta.low;
  const ringDegrees = score * 3.6;

  const reason = humidity < 35 && windMph > 12 
    ? `Low humidity (${humidity}%) combined with wind is driving elevated fire risk.`
    : windMph > 18 
      ? `Strong sustained winds (${windMph} mph) are the dominant fire weather factor.`
      : humidity < 40 
        ? `Low humidity (${humidity}%) is the main concern for drying fuels.`
        : `Current weather produces ${riskLevel} fire danger.`;

  return (
    <section className="fire-card fire-risk-card">
      <div className="fire-card__header">
        <div>
          <p className="fire-kicker">Wildfire outlook • NJ</p>
          <h2>Today&apos;s Fire Risk</h2>
        </div>
        <div className="fire-chip" style={{ '--chip-color': meta.color, '--chip-glow': meta.glow }}>
          {meta.label}
        </div>
      </div>

      <div className="fire-risk-card__hero">
        <div className="fire-score-ring" style={{ '--ring-color': meta.color, '--ring-glow': meta.glow, '--ring-deg': `${ringDegrees}deg` }}>
          <div className="fire-score-ring__inner">
            <span className="fire-score-ring__value">{score}</span>
            <span className="fire-score-ring__label">risk score</span>
          </div>
        </div>

        <div className="fire-risk-card__summary">
          <p className="fire-location">West Belmar, NJ</p>
          <p className="fire-copy">{reason}</p>
          <p className="fire-copy fire-copy--muted">{meta.copy}</p>
          <p className="last-updated">Updated just now • Live weather data</p>
        </div>
      </div>

      <div className="fire-metric-grid">
        <article className="fire-metric"><span className="fire-metric__label">Humidity</span><strong>{formatPercent(humidity)}</strong></article>
        <article className="fire-metric"><span className="fire-metric__label">Sustained wind</span><strong>{formatWind(windMph)}</strong></article>
        <article className="fire-metric"><span className="fire-metric__label">Peak gust</span><strong>{formatWind(gustMph)}</strong></article>
        <article className="fire-metric"><span className="fire-metric__label">Temperature</span><strong>{temp}°</strong></article>
      </div>
    </section>
  );
}
