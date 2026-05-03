import { useState, useRef, useEffect } from 'react'
import './RefreshButton'

const PRESETS = [
  { city: 'Boston',          region: 'MA', lat: 42.3601,  lon: -71.0589  },
  { city: 'Chicago',         region: 'IL', lat: 41.8781,  lon: -87.6298  },
  { city: "Coeur d'Alene",   region: 'ID', lat: 47.6777,  lon: -116.7805 },
  { city: 'Evansville',      region: 'IN', lat: 37.9716,  lon: -87.5711  },
  { city: 'Lecanto',         region: 'FL', lat: 28.8516,  lon: -82.4876  },
  { city: 'New York',        region: 'NY', lat: 40.7128,  lon: -74.0060  },
  { city: 'Red Bank',        region: 'NJ', lat: 40.3471,  lon: -74.0644  },
  { city: 'Redwood City',    region: 'CA', lat: 37.4848,  lon: -122.2281 },
  { city: 'Warren',          region: 'MI', lat: 42.5145,  lon: -83.0147  },
]

export default function LocationPicker({ currentCoords, currentName, onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [dropdown, setDropdown] = useState(null) // 'presets' | 'search' | null
  const [selectedPreset, setSelectedPreset] = useState(null)
  const containerRef = useRef(null)
  const debounceRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setDropdown(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced search
  const handleSearch = (value) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (value.trim().length < 2) {
      setResults([])
      setSearching(false)
      return
    }

    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5&addressdetails=1`
        )
        const data = await res.json()
        setResults(
          data.map((item) => ({
            city:
              item.address?.city ||
              item.address?.town ||
              item.address?.village ||
              item.address?.county ||
              item.display_name.split(',')[0],
            region: item.address?.state_code || item.address?.state || '',
            country: item.address?.country_code?.toUpperCase() || '',
            lat: parseFloat(item.lat),
            lon: parseFloat(item.lon),
          }))
        )
        if (data.length > 0) setDropdown('search')
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }

  const selectLocation = (loc) => {
    setSelectedPreset(loc.city)
    setDropdown(null)
    setQuery('')
    onSelect(loc)
  }

  const selectCurrent = () => {
    if (!currentCoords) return
    setSelectedPreset(null)
    setDropdown(null)
    onSelect({
      city: currentName || 'Current Location',
      region: '',
      lat: currentCoords.lat,
      lon: currentCoords.lon,
    })
  }

  const toggleDropdown = (type) => {
    setDropdown((prev) => (prev === type ? null : type))
  }

  return (
    <div className="location-picker" ref={containerRef}>
      <div className="lp-row">
        {/* Current Location button */}
        <button
          className={`lp-btn lp-current${!selectedPreset && !query ? ' active' : ''}`}
          onClick={selectCurrent}
          disabled={!currentCoords}
          title={currentCoords ? 'Use current location' : 'Location unavailable'}
        >
          📍
        </button>

        {/* Presets dropdown */}
        <div className="lp-dropdown-wrapper">
          <button
            className={`lp-btn lp-presets${dropdown === 'presets' ? ' open' : ''}`}
            onClick={() => toggleDropdown('presets')}
          >
            {selectedPreset || 'Saved'}
          </button>
          {dropdown === 'presets' && (
            <div className="lp-dropdown">
              {PRESETS.map((loc) => (
                <button
                  key={`${loc.city}-${loc.region}`}
                  className={`lp-dropdown-item${selectedPreset === loc.city ? ' selected' : ''}`}
                  onClick={() => selectLocation(loc)}
                >
                  <span className="lp-city">{loc.city}</span>
                  <span className="lp-region">{loc.region}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Search */}
        <div className="lp-search-wrapper">
          <input
            type="text"
            className="lp-search-input"
            placeholder="Search city..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => { if (results.length > 0) setDropdown('search') }}
          />
          {dropdown === 'search' && results.length > 0 && (
            <div className="lp-dropdown lp-search-dropdown">
              {results.map((loc, i) => (
                <button
                  key={i}
                  className="lp-dropdown-item"
                  onClick={() => selectLocation(loc)}
                >
                  <span className="lp-city">{loc.city}</span>
                  <span className="lp-region">{loc.region}{loc.country ? `, ${loc.country}` : ''}</span>
                </button>
              ))}
            </div>
          )}
          {searching && <span className="lp-searching">Searching…</span>}
        </div>
      </div>
    </div>
  )
}
