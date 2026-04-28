// App.jsx
import { useState, useEffect, useRef } from 'react';
import { VisibilityProvider } from './context/VisibilityContext';
import ConditionalRenderer from './components/ConditionalRenderer';
import CustomizePanel from './components/CustomizePanel';
import CustomizeButton from './components/CustomizeButton';
import DebugComponent from './DebugComponent';
import FluTrend from './FluTrend';

import WeatherHeader from './WeatherHeader';
import CurrentConditions from './CurrentConditions';
import WeatherStats from './WeatherStats';
import Forecast7Day from './Forecast7Day';
import LocationPicker from './LocationPicker';
import AirQuality from './AirQuality';
import HourlyForecast from './HourlyForecast';
import SkyEvents from './SkyEvents';
import AQITable from './AQITable';
import WeatherRadar from './WeatherRadar';
import ForecastHighlights from './ForecastHighlights';
import RefreshButton from './RefreshButton';
import LightningDebugCard from './LightningDebugCard';
import ActiveFiresCard from './ActiveFiresCard';
import FireDriversCard from './FireDriversCard';
import FireRiskCard from './FireRiskCard';
import FireMapsTable from './FireMapsTable';
//import HourlyPrecipitation from './HourlyPrecipitation';

import { useWeatherData } from './hooks/useWeatherData';
import './App.css';

const toC = (f) => Math.round((f - 32) * 5 / 9);
const fmtTemp = (f, unit) => unit === 'f' ? `${Math.round(f)}°` : `${toC(f)}°`;

export default function App() {
  const { phase, weather, location, coords, setCoords, error, fetchWeather } = useWeatherData();

  const [unit, setUnit] = useState(() => localStorage.getItem('weatherUnit') ?? 'f');

  const [selectedLocation, setSelectedLocation] = useState(() => {
    try {
      const saved = localStorage.getItem('weatherLocation');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Refs for scroll to top functionality
  const appTopRef = useRef(null);
  const previousPhase = useRef(phase);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem('weatherUnit', unit);
  }, [unit]);

  useEffect(() => {
    if (selectedLocation) {
      localStorage.setItem('weatherLocation', JSON.stringify(selectedLocation));
    } else {
      localStorage.removeItem('weatherLocation');
    }
  }, [selectedLocation]);

  // ---- scroll to top ---
  // Scroll to top when:
  // 1. Initial load completes (phase changes from 'loading' to 'ready')
  // 2. After manual refresh (data updates triggered by RefreshButton)
  useEffect(() => {
    if (phase === 'ready' && previousPhase.current === 'loading') {
      // Use requestAnimationFrame for more reliable DOM readiness
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (appTopRef.current) {
            appTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 150);
      });
    }
    previousPhase.current = phase;
  }, [phase]);

  // Initial scroll to top on page load (just in case)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  // ---- scroll to top ---

  // FIX: activeCoords must be declared BEFORE the effect that uses it
  //
  // The previous code declared activeCoords after the useEffect, which caused
  // the effect to silently fall back to undefined/stale coords on some renders.
  // Additionally, fetchWeather was in the dependency array, but fetchWeather
  // gets a new identity whenever postMessage (from useDebug) changes, causing
  // the effect to fire on every render and overwrite any user-selected location.
  //
  // Fix: declare activeCoords first, use selectedLocation directly in the effect,
  // and skip firing when selectedLocation is null (the hook's own geolocation
  // effect handles the initial fetch — we don't need to duplicate it here).

  const activeCoords = selectedLocation ?? coords;

  useEffect(() => {
    // Only fire when the user has explicitly chosen a location.
    // The hook's own geolocation useEffect handles the initial GPS fetch.
    if (!selectedLocation) return;
    fetchWeather(selectedLocation.lat, selectedLocation.lon);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation?.lat, selectedLocation?.lon]);
  // Note: fetchWeather is intentionally excluded from deps. Including it caused
  // the effect to re-run every render because postMessage (its dep) is not
  // memoised in DebugContext. The lat/lon pair is the true trigger here.

  const fmt = (f) => fmtTemp(f, unit);

  if (phase === 'loading') return <Loader />;
  if (phase === 'error') return <ErrorView message={error} />;

  return (
    <VisibilityProvider>
      <div className="app" ref={appTopRef}>
        {/* Header with customize button and refresh button */}
        <div className="header-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <WeatherHeader location={location} unit={unit} setUnit={setUnit} />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <RefreshButton fetchWeather={fetchWeather} coords={activeCoords} phase={phase} />
            <CustomizeButton />
          </div>
        </div>

        {/* Location Picker */}
        <LocationPicker
          currentCoords={coords}
          currentName={location?.city}
          onSelect={(loc) => setSelectedLocation(loc)}
        />


        {/* Current Weather */}
        <ConditionalRenderer componentId="hero">
          <CurrentConditions current={weather?.current} unit={unit} fmt={fmt} />
        </ConditionalRenderer>

        {/* Weather Stats */}
        <ConditionalRenderer componentId="stats">
          <WeatherStats current={weather?.current} daily={weather?.daily} />
        </ConditionalRenderer>

        {/* National Weather Service Text - Use its OWN componentId */}
        <ConditionalRenderer componentId="nwsforecast">
          <ForecastHighlights lat={activeCoords.lat} lon={activeCoords.lon} />
        </ConditionalRenderer>

        {/* Hourly Forecast */}
        <ConditionalRenderer componentId="hourly">
          <HourlyForecast hourly={weather?.hourly} unit={unit} />
        </ConditionalRenderer>

        {/* 7-Day Forecast */}
        <ConditionalRenderer componentId="forecast">
          <Forecast7Day daily={weather?.daily} fmt={fmt} />
        </ConditionalRenderer>

        {/* Air Quality + Pollen */}
        <ConditionalRenderer componentId="airquality">
          <AirQuality lat={activeCoords.lat} lon={activeCoords.lon} />
        </ConditionalRenderer>

        {/* AQI Table */}
        <ConditionalRenderer componentId="aqitable">
          <AQITable />
        </ConditionalRenderer>

        {/* Sky Events */}
        <ConditionalRenderer componentId="skyevents">
          <SkyEvents lat={activeCoords.lat} lon={activeCoords.lon} />
        </ConditionalRenderer>

        {/* Weather Radar - Keep this separate */}
        <ConditionalRenderer componentId="radar">
          <WeatherRadar lat={activeCoords.lat} lon={activeCoords.lon} />
        </ConditionalRenderer>

        {/* Lightning */}
        <ConditionalRenderer componentId="lightning">
          <LightningDebugCard lat={activeCoords.lat} lon={activeCoords.lon} />
        </ConditionalRenderer>
   
        {/* Flu Trends */}
        <ConditionalRenderer componentId="flu">
          <FluTrend region="nj" weeks={10} />
        </ConditionalRenderer>

        {/* Fire sections */}
        <ConditionalRenderer componentId="activefires">
          <ActiveFiresCard lat={activeCoords.lat} lon={activeCoords.lon} />
        </ConditionalRenderer>

        <ConditionalRenderer componentId="firelinks">
          <FireMapsTable />
        </ConditionalRenderer>

        <ConditionalRenderer componentId="firedrivers">
          <FireDriversCard lat={activeCoords.lat} lon={activeCoords.lon} />
        </ConditionalRenderer>

        <ConditionalRenderer componentId="firerisk">
          <FireRiskCard lat={activeCoords.lat} lon={activeCoords.lon} />
        </ConditionalRenderer>

        {/* Debug Console */}
        <ConditionalRenderer componentId="debugconsole">
          <DebugComponent />
        </ConditionalRenderer>

        {/* Footer */}
        <ConditionalRenderer componentId="footer">
          <footer className="app-footer">Open-Meteo · No ads · No tracking</footer>
        </ConditionalRenderer>

        <CustomizePanel />
      </div>
    </VisibilityProvider>
  );
}

function Loader() {
  return (
    <div className="screen-center">
      <div className="spinner">🌍</div>
      <p className="loader-text">Locating…</p>
    </div>
  );
}

function ErrorView({ message }) {
  return (
    <div className="screen-center">
      <p className="error-text">{message}</p>
    </div>
  );
}
