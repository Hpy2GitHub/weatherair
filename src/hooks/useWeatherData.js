// hooks/useWeatherData.js
import { useState, useEffect, useCallback } from 'react';
import { useDebug } from '../DebugContext';

export const useWeatherData = () => {
  const [phase, setPhase] = useState('loading');
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState(null);
  const [coords, setCoords] = useState({ lat: 40.3471, lon: -74.0644 });
  const [error, setError] = useState('');
  const { postMessage } = useDebug();

  const fetchWeather = useCallback(async (lat, lon) => {
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

      // --- DEBUGGING BLOCK START ---
      if (weatherData.daily && weatherData.daily.time) {
        postMessage("--- DAILY DATA CHECK ---", "debug");
        weatherData.daily.time.slice(0, 4).forEach((date, index) => {
          const dayName = new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' });
          const maxTemp = weatherData.daily.temperature_2m_max[index];
          postMessage(`Index ${index}: Date=${date} (${dayName}), MaxTemp=${maxTemp}°F`, "debug");
        });
        postMessage("------------------------", "debug");
      }
      // --- DEBUGGING BLOCK END ---

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
    }
  }, [postMessage]);

  // Geolocation
  useEffect(() => {
    if (!navigator.geolocation) {
      fetchWeather(coords.lat, coords.lon);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lon } }) => {
        setCoords({ lat, lon });
        fetchWeather(lat, lon);
      },
      () => {
        fetchWeather(coords.lat, coords.lon);
      },
      { timeout: 10_000 }
    );
  }, []);

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
