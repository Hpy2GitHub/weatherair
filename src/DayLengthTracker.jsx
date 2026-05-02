// DayLengthTracker.jsx
import { useMemo, useState } from 'react';
import SunCalc from 'suncalc';
import './design-system.css';

const fmtDuration = (ms) => {
  if (!ms || isNaN(ms)) return '—'
  const h = Math.floor(ms / 3_600_000)
  const m = Math.floor((ms % 3_600_000) / 60_000)
  return `${h}h ${m}m`
}

const getDayLength = (lat, lon, date) => {
  const times = SunCalc.getTimes(date, lat, lon)
  return times.sunset - times.sunrise
}

const getDayOfYear = (date) => {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date - start
  const oneDay = 86400000
  return Math.floor(diff / oneDay)
}

const formatDate = (date) => {
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export default function DayLengthTracker({ lat, lon }) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Generate day length data for the entire selected year
  const yearData = useMemo(() => {
    if (lat == null || lon == null) return null

    const startDate = new Date(selectedYear, 0, 1)
    const endDate = new Date(selectedYear, 11, 31)
    const days = []
    
    let currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      const dayLength = getDayLength(lat, lon, currentDate)
      const dayOfYear = getDayOfYear(currentDate)
      
      days.push({
        date: new Date(currentDate),
        dayOfYear,
        dayLength,
        sunrise: SunCalc.getTimes(currentDate, lat, lon).sunrise,
        sunset: SunCalc.getTimes(currentDate, lat, lon).sunset
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Find min and max day lengths
    const maxLength = Math.max(...days.map(d => d.dayLength))
    const minLength = Math.min(...days.map(d => d.dayLength))
    const maxDay = days.find(d => d.dayLength === maxLength)
    const minDay = days.find(d => d.dayLength === minLength)
    
    // Today's date (for the current year only)
    const today = new Date()
    const todayDay = today.getFullYear() === selectedYear 
      ? days.find(d => 
          d.date.getMonth() === today.getMonth() && 
          d.date.getDate() === today.getDate()
        )
      : null
    
    return { days, maxLength, minLength, maxDay, minDay, todayDay }
  }, [lat, lon, selectedYear])

  const handlePrevYear = () => setSelectedYear(prev => prev - 1)
  const handleNextYear = () => setSelectedYear(prev => prev + 1)
  const handleCurrentYear = () => setSelectedYear(new Date().getFullYear())

  if (!yearData) return null

  const { days, maxLength, minLength, maxDay, minDay, todayDay } = yearData
  
  // Chart dimensions - wider to accommodate full year
  const chartPadding = { top: 30, right: 25, bottom: 35, left: 48 }
  const chartWidth = 440
  const chartHeight = 280
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom
  
  const getX = (dayOfYear) => chartPadding.left + (dayOfYear / 365) * plotWidth
  const getY = (dayLength) => chartPadding.top + plotHeight - ((dayLength - minLength) / (maxLength - minLength)) * plotHeight

  // Generate path for the day length curve - FULL YEAR
  const pathData = days.map((day, index) => {
    const x = getX(day.dayOfYear)
    const y = getY(day.dayLength)
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
  }).join(' ')

  const formatYLabel = (ms) => {
    const hours = Math.floor(ms / 3600000)
    return `${hours}h`
  }

  // Get today's position
  const todayX = todayDay ? getX(todayDay.dayOfYear) : null

  // Create month boundaries for tick marks
  const monthBoundaries = []
  for (let month = 0; month <= 12; month++) {
    const date = new Date(selectedYear, month, 1)
    const dayOfYear = getDayOfYear(date)
    monthBoundaries.push({ month: month, dayOfYear, label: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month] })
  }

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div className="section-label" style={{ marginBottom: '0.75rem' }}>
        Day Length · {Math.abs(lat).toFixed(1)}°{lat >= 0 ? 'N' : 'S'}
      </div>

      {/* Year selector 
        <div className="row-gap">
          <button onClick={handlePrevYear} className="btn-ghost" style={{ padding: '4px 10px' }}>←</button>
          <button onClick={handleCurrentYear} className="btn-ghost" style={{ padding: '4px 10px', minWidth: '70px' }}>{selectedYear}</button>
          <button onClick={handleNextYear} className="btn-ghost" style={{ padding: '4px 10px' }}>→</button>
        </div>
        <div className="chip">
          {formatDate(minDay.date)} – {formatDate(maxDay.date)}
        </div>
      </div>
      <div className="row" style={{ marginBottom: '1.5rem' }}>
*/}

      {/* SVG Chart - Full Year */}
      <div style={{ overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ display: 'block', width: '100%', height: 'auto' }}>
          
          {/* Horizontal grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(tick => {
            const y = chartPadding.top + tick * plotHeight
            const dayLength = maxLength - (maxLength - minLength) * tick
            if (y >= chartPadding.top && y <= chartPadding.top + plotHeight) {
              return (
                <g key={`grid-${tick}`}>
                  <line x1={chartPadding.left} y1={y} x2={chartWidth - chartPadding.right} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <text x={chartPadding.left - 8} y={y + 3} fontSize="9" fill="rgba(255,255,255,0.35)" textAnchor="end" fontFamily="DM Mono, monospace">
                    {formatYLabel(dayLength)}
                  </text>
                </g>
              )
            }
            return null
          })}
          
          {/* Month tick marks and labels */}
          {monthBoundaries.map((boundary, idx) => {
            const x = getX(boundary.dayOfYear)
            if (x >= chartPadding.left && x <= chartWidth - chartPadding.right) {
              return (
                <g key={boundary.month}>
                  <line x1={x} y1={chartHeight - chartPadding.bottom} x2={x} y2={chartHeight - chartPadding.bottom + 5} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                  <text x={x} y={chartHeight - chartPadding.bottom + 16} fontSize="9" fill="rgba(255,255,255,0.35)" textAnchor="middle" fontFamily="DM Mono, monospace">
                    {boundary.label}
                  </text>
                </g>
              )
            }
            return null
          })}
          
          {/* Equinox/Solstice markers */}
          {[
            { name: 'Spring', date: new Date(selectedYear, 2, 20), color: '#10b981' },
            { name: 'Summer', date: new Date(selectedYear, 5, 20), color: '#f59e0b' },
            { name: 'Fall',   date: new Date(selectedYear, 8, 22), color: '#8b5cf6' },
            { name: 'Winter', date: new Date(selectedYear, 11, 21), color: '#3b82f6' }
          ].map(marker => {
            const markerDay = days.find(d => 
              d.date.getMonth() === marker.date.getMonth() && 
              d.date.getDate() === marker.date.getDate()
            )
            if (!markerDay) return null
            const x = getX(markerDay.dayOfYear)
            return (
              <g key={marker.name}>
                <line x1={x} y1={chartPadding.top} x2={x} y2={chartHeight - chartPadding.bottom} stroke={marker.color} strokeWidth="1" strokeDasharray="3,3" opacity="0.3" />
                <text x={x} y={chartPadding.top - 6} fontSize="8" fill={marker.color} textAnchor="middle" opacity="0.7" fontFamily="DM Mono, monospace">
                  {marker.name}
                </text>
              </g>
            )
          })}
          
          {/* Day length curve - FULL YEAR */}
          <path d={pathData} fill="none" stroke="#60a5fa" strokeWidth="2" opacity="0.7" />
          
          {/* Area under curve */}
          <path d={`${pathData} L ${getX(365)} ${chartPadding.top + plotHeight} L ${getX(0)} ${chartPadding.top + plotHeight} Z`} fill="rgba(96, 165, 250, 0.05)" />
          
          {/* Today's vertical line */}
          {todayX && (
            <>
              <line x1={todayX} y1={chartPadding.top} x2={todayX} y2={chartHeight - chartPadding.bottom} stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.6" />
              <text x={todayX} y={chartHeight - chartPadding.bottom + 24} fontSize="8" fill="#fbbf24" textAnchor="middle" fontFamily="DM Mono, monospace" opacity="0.7">
                today
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Stats panel */}
      <div className="grid-2" style={{ marginTop: '1.25rem', gap: '0.75rem' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.75rem' }}>
          <div className="stat-label" style={{ fontSize: '9px', marginBottom: '4px' }}>Longest Day</div>
          <div className="stat-value" style={{ fontSize: '13px', fontWeight: 500, color: '#f59e0b' }}>{fmtDuration(maxDay.dayLength)}</div>
          <div style={{ fontSize: '9px', opacity: 0.5 }}>{formatDate(maxDay.date)}</div>
        </div>
        
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.75rem' }}>
          <div className="stat-label" style={{ fontSize: '9px', marginBottom: '4px' }}>Shortest Day</div>
          <div className="stat-value" style={{ fontSize: '13px', fontWeight: 500, color: '#3b82f6' }}>{fmtDuration(minDay.dayLength)}</div>
          <div style={{ fontSize: '9px', opacity: 0.5 }}>{formatDate(minDay.date)}</div>
        </div>
        
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '8px', padding: '0.75rem' }}>
          <div className="stat-label" style={{ fontSize: '9px', marginBottom: '4px' }}>Variation</div>
          <div className="stat-value" style={{ fontSize: '13px' }}>{fmtDuration(maxLength - minLength)}</div>
          <div style={{ fontSize: '9px', opacity: 0.5 }}>{((maxLength - minLength) / (16 * 3600000) * 100).toFixed(0)}% range</div>
        </div>

        {todayDay && (
          <div style={{ background: 'rgba(251, 191, 36, 0.08)', borderRadius: '8px', padding: '0.75rem', border: '1px solid rgba(251, 191, 36, 0.15)' }}>
            <div className="stat-label" style={{ fontSize: '9px', marginBottom: '4px', color: '#fbbf24' }}>Today</div>
            <div className="stat-value" style={{ fontSize: '13px', fontWeight: 500, color: '#fbbf24' }}>{fmtDuration(todayDay.dayLength)}</div>
            <div style={{ fontSize: '9px', opacity: 0.6 }}>{formatDate(todayDay.date)}</div>
          </div>
        )}
      </div>
      
      {/* Latitude note */}
      <div style={{ marginTop: '0.75rem', fontSize: '8px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.5px' }}>
        {lat > 66.5 || lat < -66.5 ? '⚠️ Polar region — day length varies dramatically' : 
         Math.abs(lat) > 60 ? 'High latitude — significant seasonal variation' :
         Math.abs(lat) > 30 ? 'Mid latitude — moderate seasonal variation' :
         'Low latitude — day length stays relatively stable'}
      </div>
    </div>
  )
}
