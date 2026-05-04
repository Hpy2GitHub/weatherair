// PrecipProbabilityTimeline.jsx
import { useMemo } from 'react';
import './design-system.css';

/**
 * PrecipProbabilityTimeline
 * Shows precipitation probability as a curve/timeline
 * Focus: Next 48 hours with hourly detail + 7-day summary
 */
const PrecipProbabilityTimeline = ({ weatherData, compact = false }) => {
  const { hourly, daily } = weatherData;
  
  // Process hourly data for the next 48 hours
  const hourlyProbs = useMemo(() => {
    const now = new Date(weatherData.current.time);
    return hourly.time
      .map((time, i) => ({
        time: new Date(time),
        probability: hourly.precipitation_probability[i],
        precipitation: hourly.precipitation[i],
        weatherCode: hourly.weather_code[i],
      }))
      .filter(h => h.time >= now)
      .slice(0, 48);
  }, [hourly, weatherData.current.time]);

  // Process daily summary
  const dailyProbs = useMemo(() => {
    return daily.time.map((time, i) => ({
      date: new Date(time),
      maxProbability: daily.precipitation_probability_max[i],
      totalPrecip: daily.precipitation_sum[i],
      weatherCode: daily.weather_code[i],
    }));
  }, [daily]);

  // Find the peak precipitation period
  const peakPeriod = useMemo(() => {
    const max = Math.max(...hourlyProbs.map(h => h.probability));
    if (max === 0) return null;
    const peak = hourlyProbs.find(h => h.probability === max);
    return { ...peak, maxProbability: max };
  }, [hourlyProbs]);

  // Weather code to label mapping
  const getWeatherLabel = (code) => {
    if (code === 0) return 'Clear';
    if (code <= 3) return code === 1 ? 'M. Clear' : code === 2 ? 'P. Cloudy' : 'Overcast';
    if (code <= 49) return 'Fog';
    if (code <= 59) return 'Drizzle';
    if (code <= 69) return 'Rain';
    if (code <= 79) return 'Snow';
    if (code <= 99) return 'T-Storm';
    return '';
  };

  // Get probability level styling
  const getProbClass = (prob) => {
    if (prob >= 80) return 'precip-bar--red';
    if (prob >= 60) return 'precip-bar--orange';
    if (prob >= 40) return 'precip-bar--yellow';
    if (prob >= 20) return 'precip-bar--blue';
    if (prob > 0) return 'precip-bar--light';
    return 'precip-bar--none';
  };

  const getProbTextClass = (prob) => {
    if (prob >= 60) return 'precip-text--high';
    if (prob >= 40) return 'precip-text--med';
    if (prob >= 20) return 'precip-text--low';
    return '';
  };

  // Format time for display
  const formatHour = (date) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return `Today ${date.toLocaleTimeString([], { hour: 'numeric', hour12: true })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tmrw ${date.toLocaleTimeString([], { hour: 'numeric', hour12: true })}`;
    } else {
      return date.toLocaleDateString([], { weekday: 'short' }) + ' ' + 
             date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
    }
  };

  return (
    <div className="card precip-card">
      {/* Header */}
      <div className="precip-header">
        <span className="section-label">Precipitation Probability</span>
        {peakPeriod && (
          <span className={`precip-peak ${getProbTextClass(peakPeriod.maxProbability)}`}>
            Peak: {peakPeriod.maxProbability}% at {peakPeriod.time.toLocaleTimeString([], { hour: 'numeric', hour12: true })}
          </span>
        )}
      </div>

      {/* Hourly Timeline Graph */}
      {!compact && (
        <div className="precip-timeline">
          {/* Y-axis */}
          <div className="precip-y-axis">
            <span>100%</span>
            <span>50%</span>
            <span>0%</span>
          </div>
          
          {/* Graph area */}
          <div className="precip-graph">
            {/* Grid lines */}
            <div className="precip-grid-line" style={{ bottom: '50%' }} />
            <div className="precip-grid-line" style={{ bottom: '100%' }} />
            
            {/* Bars */}
            <div className="precip-bars">
              {hourlyProbs.map((hour, i) => (
                <div
                  key={i}
                  className="precip-bar-wrapper"
                  title={`${formatHour(hour.time)}\n${hour.probability}% chance${hour.precipitation > 0 ? `\n${hour.precipitation.toFixed(2)}"` : ''}\n${getWeatherLabel(hour.weatherCode)}`}
                >
                  <div
                    className={`precip-bar ${getProbClass(hour.probability)}`}
                    style={{ height: `${hour.probability}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* X-axis labels */}
      {!compact && (
        <div className="precip-x-axis">
          {hourlyProbs.filter((_, i) => i % 6 === 0).map((hour, i) => (
            <span key={i}>
              {hour.time.toLocaleTimeString([], { hour: 'numeric', hour12: true })}
            </span>
          ))}
        </div>
      )}

      {/* 7-Day Summary */}
      <div className="precip-summary">
        <span className="precip-summary-label">7-Day Summary</span>
        
        {dailyProbs.map((day, i) => {
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          
          // Skip days that have already passed
          if (day.date.toDateString() === yesterday.toDateString()) return null;
          
          let dayLabel;
          if (day.date.toDateString() === today.toDateString()) dayLabel = 'Today';
          else if (day.date.toDateString() === tomorrow.toDateString()) dayLabel = 'Tmrw';
          else dayLabel = day.date.toLocaleDateString([], { weekday: 'short' });

          return (
            <div key={i} className="precip-row">
              {/* Day label */}
              <span className={`precip-day ${day.date.toDateString() === today.toDateString() ? 'precip-day--today' : ''}`}>
                {dayLabel}
              </span>
              
              {/* Probability bar */}
              <div className="precip-prob-track">
                <div
                  className={`precip-prob-fill ${getProbClass(day.maxProbability)}`}
                  style={{ width: `${day.maxProbability}%` }}
                />
              </div>
              
              {/* Probability number */}
              <span className={`precip-prob-num ${getProbTextClass(day.maxProbability)}`}>
                {day.maxProbability}%
              </span>
              
              {/* Total precipitation */}
              <span className="precip-amount">
                {day.totalPrecip > 0 ? `${day.totalPrecip.toFixed(2)}"` : '—'}
              </span>
              
              {/* Weather label */}
              <span className="precip-weather">
                {getWeatherLabel(day.weatherCode)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="precip-legend">
        <div className="precip-legend-item">
          <span className="precip-legend-dot precip-bar--none" />
          <span>0%</span>
        </div>
        <div className="precip-legend-item">
          <span className="precip-legend-dot precip-bar--light" />
          <span>1-20%</span>
        </div>
        <div className="precip-legend-item">
          <span className="precip-legend-dot precip-bar--blue" />
          <span>20-40%</span>
        </div>
        <div className="precip-legend-item">
          <span className="precip-legend-dot precip-bar--yellow" />
          <span>40-60%</span>
        </div>
        <div className="precip-legend-item">
          <span className="precip-legend-dot precip-bar--orange" />
          <span>60-80%</span>
        </div>
        <div className="precip-legend-item">
          <span className="precip-legend-dot precip-bar--red" />
          <span>80-100%</span>
        </div>
      </div>
    </div>
  );
};

export default PrecipProbabilityTimeline;
