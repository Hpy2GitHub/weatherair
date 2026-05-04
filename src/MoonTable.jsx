// MoonTable.jsx
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
        const date = new Date(now);
        date.setDate(date.getDate() + i);

        const moonTimes = SunCalc.getMoonTimes(date, latitude, longitude);
        const moonIllumination = SunCalc.getMoonIllumination(date);

        daily.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          dayName: i === 0 ? "Today" : date.toLocaleDateString('en-US', { weekday: 'short' }),
          moonrise: moonTimes.rise 
            ? moonTimes.rise.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            : "—",
          moonset: moonTimes.set 
            ? moonTimes.set.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
            : "—",
          moonPhase: getMoonPhaseName(moonIllumination.phase),
          moonPhaseValue: moonIllumination.phase
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


  const getMoonPhaseName = (phase) => {
    if (phase < 0.0625) return "New Moon";
    if (phase < 0.1875) return "Waxing Crescent";
    if (phase < 0.3125) return "First Quarter";
    if (phase < 0.4375) return "Waxing Gibbous";
    if (phase < 0.5625) return "Full Moon";
    if (phase < 0.6875) return "Waning Gibbous";
    if (phase < 0.8125) return "Last Quarter";
    if (phase < 0.9375) return "Waning Crescent";
    return "New Moon";
  };

  // Now it’s safe to use getMoonPhaseName
  const todays_date = new Date();
  const d = todays_date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const my_moonIllumination = SunCalc.getMoonIllumination(todays_date);
  const myphase = getMoonPhaseName(my_moonIllumination.phase);
  //console.log(`MoonTable ${d} phase=${myphase}`);


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
