import { useState, useEffect } from 'react';

const ForecastHighlights = ({ lat, lon }) => {
  const [highlights, setHighlights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (lat == null || lon == null) return;
    fetchNWSForecast();
  }, [lat, lon]);

  const fetchNWSForecast = async () => {
    setLoading(true);
    try {
      // Step 1: Get the grid endpoint for the coordinates
      const pointsRes = await fetch(
        `https://api.weather.gov/points/${lat},${lon}`,
        {
          headers: {
            'User-Agent': '(weather-app.com, contact@yourapp.com)',
            'Accept': 'application/json'
          }
        }
      );
      
      if (!pointsRes.ok) throw new Error('Failed to get forecast grid');
      const pointsData = await pointsRes.json();
      
      // Step 2: Get the actual forecast
      const forecastUrl = pointsData.properties.forecast;
      const forecastRes = await fetch(forecastUrl, {
        headers: {
          'User-Agent': '(weather-app.com, contact@yourapp.com)',
          'Accept': 'application/json'
        }
      });
      
      if (!forecastRes.ok) throw new Error('Failed to fetch forecast');
      const forecastData = await forecastRes.json();
      
      // Extract the detailed forecast text from the first few periods
      const periods = forecastData.properties.periods;
      
      // Build a summary from the official NWS text
      const todayPeriod = periods[0];
      const tonightPeriod = periods[1];
      const tomorrowPeriod = periods[2];
 
      console.log(`todayPeriod = ${todayPeriod}`);
      console.log(`tonightPeriod = ${tonightPeriod}`);
      console.log(`tomorrowPeriod = ${tomorrowPeriod}`);
      
      let summaryText = '';
      
      // Use the actual NWS detailed forecast text
      if (todayPeriod && todayPeriod.detailedForecast) {
        summaryText = todayPeriod.detailedForecast;
      } else if (tomorrowPeriod && tomorrowPeriod.detailedForecast) {
        summaryText = tomorrowPeriod.detailedForecast;
      }
      console.log(`todayPeriod.detailedForecast = ${todayPeriod.detailedForecast}`);
      console.log(`tomorrowPeriod.detailedForecast = ${tomorrowPeriod.detailedForecast}`);
      
      // Shorten if needed (first 250 chars)
      if (summaryText.length > 280) {
        summaryText = summaryText.substring(0, 277) + '...';
      }
      
      setHighlights({
        summary: summaryText,
        today: todayPeriod?.detailedForecast || '',
        tonight: tonightPeriod?.detailedForecast || '',
        tomorrow: tomorrowPeriod?.detailedForecast || '',
        fullPeriods: periods.slice(0, 5)
      });
      
    } catch (err) {
      console.error('NWS fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card fade-in-3">
        <p className="section-label">FORECAST HIGHLIGHTS</p>
        <div style={{ 
          padding: '16px 0', 
          color: 'rgba(255,255,255,0.4)', 
          fontSize: '13px',
          textAlign: 'center'
        }}>
          Loading forecast text...
        </div>
      </div>
    );
  }

  if (error || !highlights) {
    return null;
  }

  return (
    <div className="card fade-in-3">
      <p className="section-label">FORECAST HIGHLIGHTS</p>
      <div style={{ 
        padding: '8px 0 16px 0',
        fontSize: '14px',
        lineHeight: '1.6',
        color: 'rgba(255,255,255,0.85)'
      }}>
        <p style={{ margin: 0 }}>
          {highlights.summary}
        </p>
      </div>
      
      {/* Optional: Show tonight's forecast as a second line */}
      {highlights.tonight && highlights.tonight !== highlights.summary && (
        <div style={{
          marginTop: '12px',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255,255,255,0.08)'
        }}>
          <p style={{ 
            margin: 0, 
            fontSize: '12px', 
            color: 'rgba(255,255,255,0.6)',
            fontStyle: 'italic'
          }}>
            <span style={{ textTransform: 'uppercase', fontSize: '9px', letterSpacing: '1px' }}>
              Tonight:
            </span><br />
            {highlights.tonight}
          </p>
        </div>
      )}
      
      {/* Source attribution */}
      <div style={{
        marginTop: '12px',
        fontSize: '9px',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.25)',
        textAlign: 'right'
      }}>
        National Weather Service
      </div>
    </div>
  );
};

export default ForecastHighlights;
