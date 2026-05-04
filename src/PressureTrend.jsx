// PressureTrend.jsx
import { useMemo } from 'react';

/**
 * PressureTrend
 * Barometer-style display showing surface pressure trend
 * Includes: sparkline chart + rising/falling/steady indicator + interpretation
 */
const PressureTrend = ({ current, hourly }) => {
  // ── Constants ────────────────────────────────────────────────────────
  const PRESSURE_THRESHOLDS = {
    high: 1022,   // above this = high pressure system
    low: 1008,    // below this = low pressure system
  };

  // ── Process hourly data ───────────────────────────────────────────────
  const pressureData = useMemo(() => {
    if (!hourly?.time) return [];
    const now = new Date(current?.time || Date.now());
    const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);
    
    return hourly.time
      .map((time, i) => ({
        time: new Date(time),
        pressure: hourly.surface_pressure[i],
      }))
      .filter(d => d.time >= cutoff && d.pressure != null)
      .slice(-48);
  }, [hourly, current]);

  // ── Current pressure ──────────────────────────────────────────────────
  const currentPressure = current?.surface_pressure ?? null;

  // ── Calculate trend ───────────────────────────────────────────────────
  const trend = useMemo(() => {
    if (pressureData.length < 4) return { direction: 'steady', change: 0, label: 'Steady', icon: '→' };
    
    // Use last 3 hours for short-term trend
    const recent = pressureData.slice(-4);
    const first = recent[0].pressure;
    const last = recent[recent.length - 1].pressure;
    const change = last - first;
    
    if (change > 0.5) return { direction: 'rising', change, label: 'Rising', icon: '↗' };
    if (change < -0.5) return { direction: 'falling', change, label: 'Falling', icon: '↘' };
    return { direction: 'steady', change, label: 'Steady', icon: '→' };
  }, [pressureData]);

  // ── Calculate 24-hour range ───────────────────────────────────────────
  const range24h = useMemo(() => {
    if (pressureData.length < 2) return { min: currentPressure, max: currentPressure };
    const last24h = pressureData.slice(-24);
    const pressures = last24h.map(d => d.pressure).filter(p => p != null);
    return {
      min: Math.min(...pressures),
      max: Math.max(...pressures),
      range: Math.max(...pressures) - Math.min(...pressures),
    };
  }, [pressureData, currentPressure]);

  // ── Interpretation ────────────────────────────────────────────────────
  const interpretation = useMemo(() => {
    if (currentPressure == null) return 'No data';
    
    const { direction } = trend;
    const isHigh = currentPressure >= PRESSURE_THRESHOLDS.high;
    const isLow = currentPressure <= PRESSURE_THRESHOLDS.low;
    
    if (isHigh && direction === 'rising') return 'High pressure building — fair weather likely to continue';
    if (isHigh && direction === 'falling') return 'High pressure weakening — clouds may increase';
    if (isHigh && direction === 'steady') return 'High pressure holding — continued fair weather';
    if (isLow && direction === 'falling') return 'Low pressure deepening — stormy weather likely';
    if (isLow && direction === 'rising') return 'Low pressure filling — conditions improving';
    if (isLow && direction === 'steady') return 'Low pressure lingering — unsettled weather persists';
    if (direction === 'falling') return 'Pressure falling — deteriorating conditions possible';
    if (direction === 'rising') return 'Pressure rising — improving conditions ahead';
    return 'Pressure steady — little change expected';
  }, [currentPressure, trend]);

  // ── Sparkline dimensions ──────────────────────────────────────────────
  const sparkWidth = 340;
  const sparkHeight = 80;
  const sparkPadding = { top: 8, right: 4, bottom: 16, left: 4 };
  const sparkGraphWidth = sparkWidth - sparkPadding.left - sparkPadding.right;
  const sparkGraphHeight = sparkHeight - sparkPadding.top - sparkPadding.bottom;

  // ── Sparkline points ──────────────────────────────────────────────────
  const sparkPoints = useMemo(() => {
    if (pressureData.length < 2) return [];
    
    const pressures = pressureData.map(d => d.pressure).filter(p => p != null);
    const pMin = Math.min(...pressures);
    const pMax = Math.max(...pressures);
    const pRange = pMax - pMin || 1; // avoid division by zero
    
    return pressureData.map((d, i) => ({
      x: sparkPadding.left + (i / Math.max(pressureData.length - 1, 1)) * sparkGraphWidth,
      y: sparkPadding.top + sparkGraphHeight - ((d.pressure - pMin) / pRange) * sparkGraphHeight,
      pressure: d.pressure,
      time: d.time,
    }));
  }, [pressureData]);

  // ── Sparkline area fill ────────────────────────────────────────────────
  const areaPath = useMemo(() => {
    if (sparkPoints.length < 2) return '';
    
    const baseline = sparkPadding.top + sparkGraphHeight;
    let path = `M ${sparkPoints[0].x} ${baseline}`;
    
    sparkPoints.forEach(p => {
      path += ` L ${p.x} ${p.y}`;
    });
    
    path += ` L ${sparkPoints[sparkPoints.length - 1].x} ${baseline} Z`;
    return path;
  }, [sparkPoints]);

  // ── Line path ──────────────────────────────────────────────────────────
  const linePath = useMemo(() => {
    if (sparkPoints.length < 2) return '';
    
    return sparkPoints.reduce((path, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      return path + ` L ${p.x} ${p.y}`;
    }, '');
  }, [sparkPoints]);

  // ── Pressure category ─────────────────────────────────────────────────
  const pressureCategory = useMemo(() => {
    if (currentPressure == null) return null;
    if (currentPressure >= PRESSURE_THRESHOLDS.high) return { label: 'High', class: 'pres-cat--high' };
    if (currentPressure <= PRESSURE_THRESHOLDS.low) return { label: 'Low', class: 'pres-cat--low' };
    return { label: 'Normal', class: 'pres-cat--normal' };
  }, [currentPressure]);

  // ── Format time ───────────────────────────────────────────────────────
  const formatHour = (date) => {
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return `Today ${date.toLocaleTimeString([], { hour: 'numeric', hour12: true })}`;
    }
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${date.toLocaleTimeString([], { hour: 'numeric', hour12: true })}`;
    }
    return date.toLocaleDateString([], { weekday: 'short' }) + ' ' + 
           date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
  };

  return (
    <div className="card pres-card">
      {/* ── Header ──────────────────────────────────────────────────── */}
      <span className="section-label">Barometer</span>

      {/* ── Current Reading Row ─────────────────────────────────────── */}
      {currentPressure != null && (
        <div className="pres-current">
          <div className="pres-reading">
            <span className="pres-value">{Math.round(currentPressure)}</span>
            <span className="pres-unit">hPa</span>
          </div>
          
          <div className="pres-indicators">
            {/* Pressure category chip */}
            {pressureCategory && (
              <span className={`pres-chip ${pressureCategory.class}`}>
                {pressureCategory.label}
              </span>
            )}
            
            {/* Trend chip */}
            <span className={`pres-chip pres-chip--${trend.direction}`}>
              <span className="pres-trend-icon">{trend.icon}</span>
              {trend.label}
              <span className="pres-trend-change">
                {trend.change !== 0 ? `${Math.abs(trend.change).toFixed(1)}` : ''}
              </span>
            </span>
          </div>
        </div>
      )}

      {/* ── Sparkline Chart ─────────────────────────────────────────── */}
      {sparkPoints.length > 1 && (
        <div className="pres-spark-container">
          {/* Current value indicator */}
          <span className="pres-spark-current" style={{ 
            left: sparkPoints[sparkPoints.length - 1].x,
            top: sparkPoints[sparkPoints.length - 1].y 
          }}>
            {Math.round(currentPressure)}
          </span>
          
          <svg
            viewBox={`0 0 ${sparkWidth} ${sparkHeight}`}
            className="pres-spark"
            aria-label={`Pressure trend: ${trend.label} at ${currentPressure} hPa`}
            preserveAspectRatio="none"
          >
            {/* Reference lines */}
            <line
              x1={sparkPadding.left}
              y1={sparkPadding.top + sparkGraphHeight * 0.5}
              x2={sparkWidth - sparkPadding.right}
              y2={sparkPadding.top + sparkGraphHeight * 0.5}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
              strokeDasharray="4,4"
            />

            {/* High pressure reference */}
            {(() => {
              const pressures = sparkPoints.map(p => p.pressure);
              const pMin = Math.min(...pressures);
              const pMax = Math.max(...pressures);
              const pRange = pMax - pMin || 1;
              const highY = sparkPadding.top + sparkGraphHeight - ((PRESSURE_THRESHOLDS.high - pMin) / pRange) * sparkGraphHeight;
              const lowY = sparkPadding.top + sparkGraphHeight - ((PRESSURE_THRESHOLDS.low - pMin) / pRange) * sparkGraphHeight;
              
              return (
                <>
                  {highY > sparkPadding.top && highY < sparkPadding.top + sparkGraphHeight && (
                    <line
                      x1={sparkPadding.left}
                      y1={highY}
                      x2={sparkWidth - sparkPadding.right}
                      y2={highY}
                      stroke="rgba(96,165,250,0.15)"
                      strokeWidth="0.5"
                      strokeDasharray="3,3"
                    />
                  )}
                  {lowY > sparkPadding.top && lowY < sparkPadding.top + sparkGraphHeight && (
                    <line
                      x1={sparkPadding.left}
                      y1={lowY}
                      x2={sparkWidth - sparkPadding.right}
                      y2={lowY}
                      stroke="rgba(231,76,60,0.15)"
                      strokeWidth="0.5"
                      strokeDasharray="3,3"
                    />
                  )}
                </>
              );
            })()}

            {/* Area fill */}
            <path
              d={areaPath}
              fill="rgba(96,165,250,0.06)"
            />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* End dot */}
            {sparkPoints.length > 0 && (
              <circle
                cx={sparkPoints[sparkPoints.length - 1].x}
                cy={sparkPoints[sparkPoints.length - 1].y}
                r="3"
                fill="var(--accent)"
              />
            )}
          </svg>

          {/* Time labels */}
          <div className="pres-time-labels">
            {pressureData.length > 0 && (() => {
              const first = pressureData[0].time;
              const mid = pressureData[Math.floor(pressureData.length / 2)].time;
              const last = pressureData[pressureData.length - 1].time;
              
              const fmtShort = (date) => {
                const today = new Date();
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                
                let prefix = '';
                if (date.toDateString() === today.toDateString()) prefix = 'Today ';
                else if (date.toDateString() === yesterday.toDateString()) prefix = 'Yest ';
                else prefix = date.toLocaleDateString([], { weekday: 'short' }) + ' ';
                
                return prefix + date.toLocaleTimeString([], { hour: 'numeric', hour12: true });
              };
              
              return (
                <>
                  <span>{fmtShort(first)}</span>
                  <span>{fmtShort(mid)}</span>
                  <span>{fmtShort(last)}</span>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ── Stats Row ────────────────────────────────────────────────── */}
      {range24h.min != null && (
        <div className="pres-stats">
          <div className="pres-stat">
            <span className="pres-stat-label">24h High</span>
            <span className="pres-stat-value">{Math.round(range24h.max)} hPa</span>
          </div>
          <div className="pres-stat">
            <span className="pres-stat-label">24h Low</span>
            <span className="pres-stat-value">{Math.round(range24h.min)} hPa</span>
          </div>
          <div className="pres-stat">
            <span className="pres-stat-label">Range</span>
            <span className="pres-stat-value">{range24h.range.toFixed(1)} hPa</span>
          </div>
        </div>
      )}

      {/* ── Interpretation ───────────────────────────────────────────── */}
      <p className="pres-interpretation">
        {interpretation}
      </p>

      {/* ── Quick Reference ──────────────────────────────────────────── */}
      <div className="pres-reference">
        <div className="pres-ref-item pres-ref-item--high">
          <span className="pres-ref-dot" />
          <span>High: &gt;{PRESSURE_THRESHOLDS.high} hPa</span>
        </div>
        <div className="pres-ref-item pres-ref-item--low">
          <span className="pres-ref-dot" />
          <span>Low: &lt;{PRESSURE_THRESHOLDS.low} hPa</span>
        </div>
      </div>
    </div>
  );
};

export default PressureTrend;
