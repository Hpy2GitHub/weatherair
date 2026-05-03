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

    const maxLength = Math.max(...days.map(d => d.dayLength))
    const minLength = Math.min(...days.map(d => d.dayLength))
    const maxDay = days.find(d => d.dayLength === maxLength)
    const minDay = days.find(d => d.dayLength === minLength)

    const today = new Date()
    const todayDay = today.getFullYear() === selectedYear
      ? days.find(d =>
          d.date.getMonth() === today.getMonth() &&
          d.date.getDate() === today.getDate()
        )
      : null

    return { days, maxLength, minLength, maxDay, minDay, todayDay }
  }, [lat, lon, selectedYear])

  const handlePrevYear    = () => setSelectedYear(prev => prev - 1)
  const handleNextYear    = () => setSelectedYear(prev => prev + 1)
  const handleCurrentYear = () => setSelectedYear(new Date().getFullYear())

  if (!yearData) return null

  const { days, maxLength, minLength, maxDay, minDay, todayDay } = yearData

  // Chart dimensions
  const chartPadding = { top: 30, right: 25, bottom: 35, left: 48 }
  const chartWidth   = 440
  const chartHeight  = 280
  const plotWidth    = chartWidth - chartPadding.left - chartPadding.right
  const plotHeight   = chartHeight - chartPadding.top - chartPadding.bottom

  const getX = (dayOfYear) => chartPadding.left + (dayOfYear / 365) * plotWidth
  const getY = (dayLength) => chartPadding.top + plotHeight - ((dayLength - minLength) / (maxLength - minLength)) * plotHeight

  const pathData = days.map((day, index) => {
    const x = getX(day.dayOfYear)
    const y = getY(day.dayLength)
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
  }).join(' ')

  const formatYLabel = (ms) => {
    const hours = Math.floor(ms / 3600000)
    return `${hours}h`
  }

  const todayX = todayDay ? getX(todayDay.dayOfYear) : null

  const monthBoundaries = []
  for (let month = 0; month <= 12; month++) {
    const date = new Date(selectedYear, month, 1)
    const dayOfYear = getDayOfYear(date)
    monthBoundaries.push({
      month,
      dayOfYear,
      label: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][month]
    })
  }

  const solsticeMarkers = [
    { name: 'Spring', date: new Date(selectedYear,  2, 20), color: '#10b981' },
    { name: 'Summer', date: new Date(selectedYear,  5, 20), color: '#f59e0b' },
    { name: 'Fall',   date: new Date(selectedYear,  8, 22), color: '#8b5cf6' },
    { name: 'Winter', date: new Date(selectedYear, 11, 21), color: '#3b82f6' },
  ]

  const latNote =
    lat > 66.5 || lat < -66.5 ? '⚠️ Polar region — day length varies dramatically'
    : Math.abs(lat) > 60      ? 'High latitude — significant seasonal variation'
    : Math.abs(lat) > 30      ? 'Mid latitude — moderate seasonal variation'
    :                           'Low latitude — day length stays relatively stable'

  return (
    <div className="card daylength-card">

      <div className="section-label">
        Day Length · {Math.abs(lat).toFixed(1)}°{lat >= 0 ? 'N' : 'S'}
      </div>

      {/* Year selector */}
      <div className="year-selector">
        <div className="year-nav">
          <button onClick={handlePrevYear}    className="btn-ghost year-nav__btn">←</button>
          <button onClick={handleCurrentYear} className="year-nav__current">{selectedYear}</button>
          <button onClick={handleNextYear}    className="btn-ghost year-nav__btn">→</button>
        </div>
        <div className="daylength-range-badge">
          {formatDate(minDay.date)} – {formatDate(maxDay.date)}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="daylength-chart-container">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="daylength-chart"
          style={{ width: '100%', height: 'auto' }}
        >
          {/* Horizontal grid lines + Y labels */}
          {[0, 0.25, 0.5, 0.75, 1].map(tick => {
            const y         = chartPadding.top + tick * plotHeight
            const dayLength = maxLength - (maxLength - minLength) * tick
            if (y < chartPadding.top || y > chartPadding.top + plotHeight) return null
            return (
              <g key={`grid-${tick}`}>
                <line
                  x1={chartPadding.left} y1={y}
                  x2={chartWidth - chartPadding.right} y2={y}
                  className="daylength-grid-line"
                />
                <text x={chartPadding.left - 8} y={y + 3} className="daylength-grid-label">
                  {formatYLabel(dayLength)}
                </text>
              </g>
            )
          })}

          {/* Month tick marks + labels */}
          {monthBoundaries.map(boundary => {
            const x = getX(boundary.dayOfYear)
            if (x < chartPadding.left || x > chartWidth - chartPadding.right) return null
            return (
              <g key={boundary.month}>
                <line
                  x1={x} y1={chartHeight - chartPadding.bottom}
                  x2={x} y2={chartHeight - chartPadding.bottom + 5}
                  stroke="rgba(255,255,255,0.2)" strokeWidth="1"
                />
                <text x={x} y={chartHeight - chartPadding.bottom + 16} className="daylength-month-label">
                  {boundary.label}
                </text>
              </g>
            )
          })}

          {/* Equinox / Solstice markers — color is dynamic so stroke/fill stay inline */}
          {solsticeMarkers.map(marker => {
            const markerDay = days.find(d =>
              d.date.getMonth() === marker.date.getMonth() &&
              d.date.getDate()  === marker.date.getDate()
            )
            if (!markerDay) return null
            const x = getX(markerDay.dayOfYear)
            return (
              <g key={marker.name}>
                <line
                  x1={x} y1={chartPadding.top}
                  x2={x} y2={chartHeight - chartPadding.bottom}
                  stroke={marker.color}
                  className="daylength-marker-line"
                />
                <text x={x} y={chartPadding.top - 6} fill={marker.color} className="daylength-marker-label">
                  {marker.name}
                </text>
              </g>
            )
          })}

          {/* Day length curve */}
          <path d={pathData} className="daylength-curve" />

          {/* Area under curve */}
          <path
            d={`${pathData} L ${getX(365)} ${chartPadding.top + plotHeight} L ${getX(0)} ${chartPadding.top + plotHeight} Z`}
            className="daylength-area"
          />

          {/* Today marker */}
          {todayX && (
            <>
              <line
                x1={todayX} y1={chartPadding.top}
                x2={todayX} y2={chartHeight - chartPadding.bottom}
                className="daylength-today-line"
              />
              <text x={todayX} y={chartHeight - chartPadding.bottom + 24} className="daylength-today-label">
                today
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Stats panel */}
      <div className="daylength-stats-grid">
        <div className="daylength-stat-card">
          <div className="daylength-stat-label">Longest Day</div>
          <div className="daylength-stat-value daylength-stat-value--longest">{fmtDuration(maxDay.dayLength)}</div>
          <div className="daylength-stat-date">{formatDate(maxDay.date)}</div>
        </div>

        <div className="daylength-stat-card">
          <div className="daylength-stat-label">Shortest Day</div>
          <div className="daylength-stat-value daylength-stat-value--shortest">{fmtDuration(minDay.dayLength)}</div>
          <div className="daylength-stat-date">{formatDate(minDay.date)}</div>
        </div>

        <div className="daylength-stat-card">
          <div className="daylength-stat-label">Variation</div>
          <div className="daylength-stat-value">{fmtDuration(maxLength - minLength)}</div>
          <div className="daylength-stat-date">
            {((maxLength - minLength) / (16 * 3600000) * 100).toFixed(0)}% range
          </div>
        </div>

        {todayDay && (
          <div className="daylength-stat-card daylength-stat-card--today">
            <div className="daylength-stat-label daylength-stat-label--today">Today</div>
            <div className="daylength-stat-value daylength-stat-value--today">{fmtDuration(todayDay.dayLength)}</div>
            <div className="daylength-stat-date">{formatDate(todayDay.date)}</div>
          </div>
        )}
      </div>

      {/* Latitude note */}
      <div className="daylength-lat-note">{latNote}</div>

    </div>
  )
}
