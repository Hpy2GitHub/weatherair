// MoonTable.jsx
import React, { useState, useEffect } from 'react';
import SunCalc from 'suncalc';
import MoonPhaseIcon from './MoonPhaseIcon';
import './design-system.css';

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
          dayName: i === 0 ? "Today" : date.toLocaleDateString('en-US', { weekday: 'long' }),
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
        
        <div className="row" style={{ gap: 'var(--sp-6)', marginBottom: 'var(--sp-5)' }}>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Moonrise</div>
            <div className="stat-value" style={{ fontSize: '24px', color: '#facc15' }}>{data.moonrise}</div>
          </div>
          <div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>Moonset</div>
            <div className="stat-value" style={{ fontSize: '24px', color: '#facc15' }}>{data.moonset}</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          {data.daily.slice(0, 3).map((day, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--text-2xs)', color: i === 0 ? 'var(--text)' : 'var(--muted)', marginBottom: '8px' }}>
                {day.dayName}
              </div>
              <MoonPhaseIcon phase={day.moonPhaseValue} size={46} />
              <div style={{ marginTop: '6px', fontSize: 'var(--text-sm)' }}>{day.moonPhase}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="stack" style={{ marginTop: 'var(--sp-5)' }}>
        {data.daily.map((day, index) => (
          <div key={index} className="card">
            <div className="row" style={{ alignItems: 'center' }}>
              <div style={{ minWidth: '100px' }}>
                <div style={{ fontWeight: 500 }}>{day.dayName}</div>
                <div style={{ fontSize: 'var(--text-2xs)', color: 'var(--dim)' }}>{day.date}</div>
              </div>

              <div style={{ display: 'flex', gap: '32px', flex: 1, justifyContent: 'center' }}>
                <div>
                  <div className="stat-label">RISE</div>
                  <div className="stat-value" style={{ color: '#facc15' }}>{day.moonrise}</div>
                </div>
                <div>
                  <div className="stat-label">SET</div>
                  <div className="stat-value" style={{ color: '#facc15' }}>{day.moonset}</div>
                </div>
              </div>

              <div className="moon-plus-label">
                <MoonPhaseIcon phase={day.moonPhaseValue} size={36} />
                <div style={{ fontSize: 'var(--text-sm)' }}>{day.moonPhase}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MoonTable;
