import { useEffect, useMemo, useState } from 'react';

const getRecentEpiweeks = (count = 8) => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const startOfYear = new Date(Date.UTC(year, 0, 1));
  const diffDays = Math.floor((now - startOfYear) / 86400000);
  const currentWeek = Math.max(1, Math.min(53, Math.floor(diffDays / 7) + 1));

  const weeks = [];

  for (let i = count - 1; i >= 0; i--) {
    const week = currentWeek - i;
    weeks.push(Number(`${year}${String(week).padStart(2, '0')}`));
  }

  return weeks.join(',');
};

const formatWeekOf = (epiweek) => {
  const value = String(epiweek);
  const year = Number(value.slice(0, 4));
  const week = Number(value.slice(4));

  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - jan4Day + 1 + (week - 1) * 7);

  return `Week of ${monday.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })}`;
};

const formatDelta = (current, previous) => {
  if (previous == null) return 'No prior comparison';

  const diff = current - previous;
  if (Math.abs(diff) < 0.05) return 'About the same as last week';

  return `${diff > 0 ? 'Up' : 'Down'} ${Math.abs(diff).toFixed(1)} pts from last week`;
};

const buildLinePath = (values, width = 320, height = 88, pad = 8) => {
  if (!values.length) {
    return { path: '', lastX: 0, lastY: 0 };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, 1);

  const points = values.map((value, index) => {
    const x = pad + (index * (width - pad * 2)) / Math.max(values.length - 1, 1);
    const y = height - pad - ((value - min) / span) * (height - pad * 2);
    return { x, y };
  });

  const path = points
    .map((point, index) =>
      `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`
    )
    .join(' ');

  const lastPoint = points[points.length - 1];

  return {
    path,
    lastX: lastPoint.x,
    lastY: lastPoint.y,
  };
};

export default function FluTrend({ region = 'nj', weeks = 8 }) {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        setStatus('loading');

        const url = `https://api.delphi.cmu.edu/epidata/fluview/?regions=${region}&epiweeks=${getRecentEpiweeks(weeks)}`;
        const response = await fetch(url);
        const json = await response.json();

        if (!json?.epidata?.length) {
          throw new Error('No flu data returned');
        }

        const cleaned = [...json.epidata]
          .filter((row) => typeof row.ili === 'number')
          .sort((a, b) => a.epiweek - b.epiweek)
          .slice(-weeks);

        if (!cleaned.length) {
          throw new Error('No usable data');
        }

        if (!cancelled) {
          setRows(cleaned);
          setStatus('ready');
        }
      } catch (error) {
        if (!cancelled) {
          setStatus('error');
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [region, weeks]);

  const latest = rows[rows.length - 1];
  const previous = rows[rows.length - 2];

  const chart = useMemo(() => {
    return buildLinePath(rows.map((row) => row.ili));
  }, [rows]);

  if (status === 'loading') {
    return (
      <section className="card fade-in-4 flu-card">
        <p className="section-label">Flu Activity</p>
        <div className="loader-text">Loading surveillance</div>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className="card fade-in-4 flu-card">
        <p className="section-label">Flu Activity</p>
        <p className="error-text">Unable to load flu surveillance right now.</p>
      </section>
    );
  }

  return (
    <section className="card fade-in-4 flu-card">
      <p className="section-label">Flu Activity</p>

      <div className="stat-row">
        <span className="stat-label">Possible Flu-Related Visits</span>
        <span className="stat-value flu-big-number">
          {latest.ili.toFixed(1)}%
        </span>
      </div>

      <div className="stat-row">
        <span className="stat-label">Trend</span>
        <span className="stat-value">{formatDelta(latest.ili, previous?.ili)}</span>
      </div>

      <div className="stat-row last">
        <span className="stat-label">Latest week</span>
        <span className="stat-value">{formatWeekOf(latest.epiweek)}</span>
      </div>

      <div className="flu-trend-wrap">
        <svg
          className="flu-trend-chart"
          viewBox="0 0 320 88"
          preserveAspectRatio="none"
          role="img"
          aria-label="Trend line for possible flu-related visits over recent weeks"
        >
          <path className="flu-trend-grid" d="M 8 44 L 312 44" />
          <path className="flu-trend-line" d={chart.path} />
          <circle className="flu-trend-dot" cx={chart.lastX} cy={chart.lastY} r="3.5" />
        </svg>

        <div className="flu-trend-labels">
          <span>{formatWeekOf(rows[0].epiweek)}</span>
          <span>{formatWeekOf(latest.epiweek)}</span>
        </div>
      </div>

      <div className="footer">
        Weekly outpatient visits for flu-like symptoms
      </div>
    </section>
  );
}
