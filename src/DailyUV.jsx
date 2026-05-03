// DailyUV.jsx
import './design-system.css';

const UV_LEVELS = [
  { max: 2, label: 'Low', color: '#4ade80' },
  { max: 5, label: 'Moderate', color: '#facc15' },
  { max: 7, label: 'High', color: '#fb923c' },
  { max: 10, label: 'Very high', color: '#f97316' },
  { max: Infinity, label: 'Extreme', color: '#ef4444' },
]

function fmtDay(d) {
  return new Date(d).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function uvMeta(val) {
  return UV_LEVELS.find((x) => val <= x.max) || UV_LEVELS[UV_LEVELS.length - 1]
}

function uvSummaryLabel(maxUv) {
  if (maxUv == null) return 'UV data unavailable'
  const meta = uvMeta(maxUv)
  return `${meta.label} UV`
}

const BAR_MAX_H = 84
const COL_W = 56

export default function DailyUV({ daily }) {
  if (!daily?.time?.length) return null

  const days = Array.from({ length: Math.min(7, daily.time.length) }, (_, i) => {
    const uv = daily.uv_index_max?.[i] ?? null
    return {
      time: new Date(daily.time[i]),
      uv,
      sunrise: daily.sunrise?.[i] ?? null,
      sunset: daily.sunset?.[i] ?? null,
      isToday: i === 0,
    }
  })

  const validUvs = days.map((d) => d.uv).filter((v) => v != null)
  const peakDay = days.reduce((best, d) => {
    if (d.uv == null) return best
    if (!best || d.uv > best.uv) return d
    return best
  }, null)

  const peakUv = peakDay?.uv ?? null
  const peakMeta = peakUv != null ? uvMeta(peakUv) : null

  let summaryText = 'UV data unavailable for the next 7 days'
  if (peakDay) {
    summaryText = `${uvSummaryLabel(peakUv)} expected on ${fmtDay(peakDay.time)} · peak ${peakUv.toFixed(1)}`
  }

  return (
    <section className="hf-section fade-in">
      <p className="section-label">Daily UV · Next 7 Days</p>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          marginBottom: 14,
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 8,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            flexShrink: 0,
            background: peakMeta?.color || 'rgba(255,255,255,0.2)',
          }}
        />
        <span
          style={{
            fontSize: 12,
            color: peakMeta?.color || 'rgba(255,255,255,0.35)',
          }}
        >
          {summaryText}
        </span>
      </div>

      <div className="hf-scroll">
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          {days.map((d, i) => {
            const meta = d.uv != null ? uvMeta(d.uv) : null
            const barH = d.uv != null ? Math.round((d.uv / 11) * BAR_MAX_H) : 0
            const showLabel = i % 2 === 0 || i === days.length - 1
            const showAmount = d.uv != null && d.uv >= 2

            return (
              <div
                key={d.time.toISOString()}
                style={{
                  width: COL_W,
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  paddingTop: 4,
                  background: d.isToday ? 'rgba(255,255,255,0.04)' : 'transparent',
                  borderRadius: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 9.5,
                    fontFamily: 'DM Mono, monospace',
                    color: d.isToday ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.22)',
                  }}
                >
                  {d.uv != null ? `${d.uv.toFixed(1)}` : '—'}
                </span>

                <div
                  style={{
                    width: 22,
                    height: BAR_MAX_H,
                    display: 'flex',
                    alignItems: 'flex-end',
                    background: 'rgba(255,255,255,0.06)',
                    borderRadius: 4,
                    overflow: 'hidden',
                  }}
                >
                  {barH > 0 && (
                    <div
                      style={{
                        width: '100%',
                        height: barH,
                        background: meta?.color || '#888780',
                        opacity: d.isToday ? 1 : 0.75,
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {showAmount && (
                        <span
                          style={{
                            fontSize: 7.5,
                            color: 'rgba(255,255,255,0.9)',
                            fontFamily: 'DM Mono, monospace',
                            writingMode: 'vertical-rl',
                            transform: 'rotate(180deg)',
                            lineHeight: 1,
                          }}
                        >
                          {d.uv.toFixed(1)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <span
                  style={{
                    fontSize: 10,
                    fontFamily: 'DM Mono, monospace',
                    minHeight: 14,
                    color: !showLabel
                      ? 'transparent'
                      : d.isToday
                        ? 'rgba(255,255,255,0.75)'
                        : d.uv != null && d.uv >= 6
                          ? 'rgba(255,255,255,0.55)'
                          : 'rgba(255,255,255,0.18)',
                  }}
                >
                  {showLabel ? (d.uv != null ? `${Math.round(d.uv)}` : '') : ''}
                </span>

                <div
                  style={{
                    width: Math.max(Math.round((d.uv ?? 0) * 6), 2),
                    height: 3,
                    borderRadius: 2,
                    background: meta?.color || '#888780',
                    opacity: 0.35,
                  }}
                />

                <span
                  style={{
                    fontSize: 9.5,
                    fontFamily: 'DM Mono, monospace',
                    paddingBottom: 4,
                    color: d.isToday ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.22)',
                  }}
                >
                  {d.isToday ? 'Today' : fmtDay(d.time)}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '6px 14px',
          marginTop: 12,
          paddingTop: 10,
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {UV_LEVELS.map((lvl) => (
          <span
            key={lvl.label}
            style={{ display: 'flex', alignItems: 'center', gap: 5 }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 2,
                background: lvl.color,
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>
              {lvl.label}
            </span>
          </span>
        ))}

        <span
          style={{
            marginLeft: 'auto',
            fontSize: 10,
            color: 'rgba(255,255,255,0.18)',
            fontFamily: 'DM Mono, monospace',
          }}
        >
          UV index 0–2 low · 3–5 moderate · 6–7 high · 8–10 very high · 11+ extreme
        </span>
      </div>
    </section>
  )
}
