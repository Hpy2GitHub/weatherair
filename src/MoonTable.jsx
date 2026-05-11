// MoonTable.jsx
// moonphases.info — shows current and upcoming moon phases with visuals you can compare against
// timeanddate.com/moon/phases — very reliable moon phase reference with dates
// farmsense.net — free moon phase API that returns phase names and illumination %

import React, { useState, useEffect } from 'react';
import SunCalc from 'suncalc';
import MoonPhaseIcon from './MoonPhaseIcon';
import './design-system.css';

// Renders "11:19" with "PM" on a second line for compact mobile display
const SplitTime = ({ time }) => {
  if (!time || time === '—') return <span>—</span>;
  const match = time.match(/^(.+?)\s*(AM|PM)$/i);
  if (!match) return <span>{time}</span>;
  return (
    <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.15 }}>
      <span>{match[1]}</span>
      <span style={{ fontSize: '0.7em', opacity: 0.8 }}>{match[2]}</span>
    </span>
  );
};

// The four cardinal phases, each defined by the exact SunCalc fraction at which they occur.
// When one of these thresholds is crossed within a calendar day, the entire day takes that label —
// matching the event-based convention used by calendars and reference sites.
const MAJOR_PHASES = [
  { fraction: 0.0,  name: "New Moon",      canonical: 0.0  },
  { fraction: 0.25, name: "First Quarter", canonical: 0.25 },
  { fraction: 0.5,  name: "Full Moon",     canonical: 0.5  },
  { fraction: 0.75, name: "Last Quarter",  canonical: 0.75 },
];

// Maps a raw SunCalc phase (0–1) to the canonical center of its named phase bucket.
// Used only as a fallback for days where no major phase event occurs.
const PHASE_BUCKETS = [
  { max: 0.0625, name: "New Moon",        canonical: 0.0   },
  { max: 0.1875, name: "Waxing Crescent", canonical: 0.125 },
  { max: 0.3125, name: "First Quarter",   canonical: 0.25  },
  { max: 0.4375, name: "Waxing Gibbous",  canonical: 0.375 },
  { max: 0.5625, name: "Full Moon",       canonical: 0.5   },
  { max: 0.6875, name: "Waning Gibbous",  canonical: 0.625 },
  { max: 0.8125, name: "Last Quarter",    canonical: 0.75  },
  { max: 0.9375, name: "Waning Crescent", canonical: 0.875 },
  { max: 1.0,    name: "New Moon",        canonical: 0.0   },
];

const getMoonPhaseInfo = (phase) => {
  const bucket = PHASE_BUCKETS.find(b => phase < b.max) ?? PHASE_BUCKETS[PHASE_BUCKETS.length - 1];
  return { name: bucket.name, canonical: bucket.canonical };
};

// Determines the calendar-convention phase name for a given local date.
//
// Strategy: scan the day in hourly steps, checking whether any major phase threshold
// (New, First Quarter, Full, Last Quarter) is crossed. If one is, that event "owns" the
// whole day — exactly as a printed calendar would show it. If no event crosses today,
// fall back to reading the illumination at local noon, which is a stable, representative
// single sample (vs. "right now" which drifts and causes off-by-one-day errors).
const findDayPhase = (localDate) => {
  // Build a Date anchored to midnight of the requested local calendar day.
  // Using the y/m/d constructor avoids the "add N days to now" drift from
  // running the loop later in the day.
  const dayStart = new Date(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    0, 0, 0, 0
  );

  const MS_PER_HOUR = 3_600_000;

  // Collect hourly phase samples across the full day (25 points → 24 intervals).
  const samples = Array.from({ length: 25 }, (_, h) => ({
    t: new Date(dayStart.getTime() + h * MS_PER_HOUR),
    phase: SunCalc.getMoonIllumination(new Date(dayStart.getTime() + h * MS_PER_HOUR)).phase,
  }));

  // Walk consecutive pairs and check for threshold crossings.
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i].phase;
    const b = samples[i + 1].phase;

    for (const major of MAJOR_PHASES) {
      const target = major.fraction;
      let crossed = false;

      if (target === 0.0) {
        // New Moon: the phase fraction wraps from ~1 back to ~0.
        // Treat a large downward jump across the wrap point as a crossing.
        crossed = a > 0.875 && b < 0.125;
      } else {
        // Standard upward crossing for First Quarter (0.25), Full Moon (0.5),
        // and Last Quarter (0.75).
        crossed = a < target && b >= target;
      }

      if (crossed) {
        return { name: major.name, canonical: major.canonical };
      }
    }
  }

  // No major event today — use the noon sample as a stable fallback.
  const noon = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), 12);
  return getMoonPhaseInfo(SunCalc.getMoonIllumination(noon).phase);
};

const MoonTable = ({ lat, lon }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      setError("Invalid location coordinates.");
      setLoading(false);
      return;
    }

    try {
      const daily = [];
      const now = new Date();

      for (let i = 0; i < 7; i++) {
        // Anchor each iteration to midnight of the target calendar day so that
        // getMoonTimes and findDayPhase both operate on the same local date,
        // regardless of what time of day the component mounts.
        const date = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() + i,
          0, 0, 0, 0
        );

        const moonTimes = SunCalc.getMoonTimes(date, latitude, longitude);

        // Event-based phase: honours the calendar convention that a phase event
        // (e.g. Full Moon at 11 AM) labels the entire calendar day, not just the
        // hours after it occurs.
        const { name, canonical } = findDayPhase(date);

        daily.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dayName: i === 0 ? "Today" : date.toLocaleDateString('en-US', { weekday: 'short' }),
          moonrise: moonTimes.rise
            ? moonTimes.rise.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            : "—",
          moonset: moonTimes.set
            ? moonTimes.set.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            : "—",
          moonPhase: name,
          // Canonical value keeps MoonPhaseIcon in sync with the text label.
          moonPhaseValue: canonical,
        });
      }

      setData({
        moonrise: daily[0].moonrise,
        moonset: daily[0].moonset,
        daily
      });
    } catch (err) {
      console.error(err);
      setError("Could not calculate moon data.");
    } finally {
      setLoading(false);
    }
  }, [lat, lon]);

  if (loading) return <div className="screen-center"><div className="spinner" style={{fontSize:'48px'}}>🌙</div><div className="loader-text">Calculating...</div></div>;
  if (error) return <div className="card" style={{textAlign:'center', padding:'var(--sp-6)'}}><div style={{fontSize:'42px'}}>🌑</div><div className="error-text">{error}</div></div>;

  return (
    <div className="moon-screen">
      <div className="header-wrapper" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => window.history.back()} style={{background:'none', border:'none', color:'var(--text)', fontSize:'28px', padding:0, cursor:'pointer'}}>←</button>
            <h1 style={{ fontFamily: 'var(--serif)', fontSize: '22px', fontWeight: 400, margin: 0 }}>Sun &amp; moon</h1>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="section-label">MOON</div>

        <div className="moon-hero-times">
          <div>
            <div className="moon-hero-label">Moonrise</div>
            <div className="moon-hero-value"><SplitTime time={data.moonrise} /></div>
          </div>
          <div>
            <div className="moon-hero-label">Moonset</div>
            <div className="moon-hero-value"><SplitTime time={data.moonset} /></div>
          </div>
        </div>

        <div className="moon-preview">
          {data.daily.slice(0, 3).map((day, i) => (
            <div key={i} className="moon-preview-day">
              <div className={i === 0 ? 'moon-preview-label moon-preview-label--today' : 'moon-preview-label'}>
                {day.dayName}
              </div>
              <MoonPhaseIcon phase={day.moonPhaseValue} size={46} />
              <div className="moon-preview-phase">{day.moonPhase}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="stack" style={{ marginTop: 'var(--sp-5)' }}>
        {data.daily.map((day, index) => (
          <div key={index} className="card">
            <div className="moon-row">
              <div className="moon-row-name">
                <div className="moon-row-day">{day.dayName}</div>
                <div className="moon-row-date">{day.date}</div>
              </div>

              <div className="moon-row-times">
                <div>
                  <div className="moon-row-label">RISE</div>
                  <div className="moon-row-value"><SplitTime time={day.moonrise} /></div>
                </div>
                <div>
                  <div className="moon-row-label">SET</div>
                  <div className="moon-row-value"><SplitTime time={day.moonset} /></div>
                </div>
              </div>

              <div className="moon-plus-label">
                <MoonPhaseIcon phase={day.moonPhaseValue} size={36} />
                <div className="moon-row-phase">{day.moonPhase}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoonTable;
