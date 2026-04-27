// hooks/useWeatherData.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useDebug } from '../DebugContext';

export const useWeatherData = () => {
  const [phase, setPhase] = useState('loading');
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState(null);
  const [coords, setCoords] = useState({ lat: 40.3471, lon: -74.0644 });
  const [error, setError] = useState('');
  const { postMessage } = useDebug();
  const isFetching = useRef(false); // Prevent multiple simultaneous fetches

  const fetchWeather = useCallback(async (lat, lon) => {
    // Prevent multiple simultaneous fetches
    if (isFetching.current) {
      postMessage(`Weather: Fetch already in progress, skipping`, 'debug');
      return;
    }
    
    isFetching.current = true;
    postMessage(`Weather: Starting fetch for lat=${lat}, lon=${lon}`, 'info');
    setPhase('loading');
    
    try {
      postMessage(`Weather: Fetching forecast data...`, 'debug');
      const [weatherRes, geoRes] = await Promise.all([
        fetch(
          'https://api.open-meteo.com/v1/forecast' +
          `?latitude=${lat}&longitude=${lon}` +
          '&current=temperature_2m,relative_humidity_2m,apparent_temperature,' +
          'precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day' +
          '&hourly=temperature_2m,weather_code,precipitation_probability' +
          '&daily=weather_code,temperature_2m_max,temperature_2m_min,' +
          'precipitation_probability_max,sunrise,sunset' +
          '&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch' +
          '&timezone=auto&forecast_days=7'
        ),
        fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`),
      ]);

      if (!weatherRes.ok) {
        throw new Error(`Weather API error: ${weatherRes.status}`);
      }

      const [weatherData, geoData] = await Promise.all([
        weatherRes.json(),
        geoRes.json(),
      ]);

      postMessage(`Weather: Data received - Temp=${weatherData.current?.temperature_2m}°F`, 'info');
      postMessage(`Weather: Location found - ${geoData.address?.city || geoData.address?.town}`, 'info');

      setWeather(weatherData);
      setLocation({
        city: geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || 'Your Location',
        region: geoData.address?.state_code || geoData.address?.state || '',
        country: geoData.address?.country_code?.toUpperCase() || '',
      });
      setPhase('ready');
      postMessage(`Weather: Ready!`, 'info');
    } catch (err) {
      postMessage(`Weather Error: ${err.message}`, 'error');
      setError('Could not load weather data. Please try again.');
      setPhase('error');
    } finally {
      isFetching.current = false;
    }
  }, [postMessage]);

  // Geolocation - only run once on mount
  useEffect(() => {
    let isMounted = true;
    
    if (!navigator.geolocation) {
      if (isMounted) fetchWeather(coords.lat, coords.lon);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lon } }) => {
        if (isMounted) {
          setCoords({ lat, lon });
          fetchWeather(lat, lon);
        }
      },
      () => {
        if (isMounted) fetchWeather(coords.lat, coords.lon);
      },
      { timeout: 10_000 }
    );
    
    return () => { isMounted = false; };
  }, []); // Empty deps - only run once

  return {
    phase,
    weather,
    location,
    coords,
    setCoords,
    error,
    fetchWeather,
  };
};
