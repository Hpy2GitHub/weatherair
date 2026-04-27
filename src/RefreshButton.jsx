import { useState } from 'react';
import { useWeatherData } from './hooks/useWeatherData';
import { useDebug } from './DebugContext';


const RefreshButton = ({ onRefreshComplete = null }) => {
  const { fetchWeather, coords, phase } = useWeatherData();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    postMessage("Refresh: handleRefresh ");
    if (isRefreshing || phase === 'loading') return;
    if (!coords || !coords.lat || !coords.lon) return;

    setIsRefreshing(true);
    
    try {
      await fetchWeather(coords.lat, coords.lon);
      if (onRefreshComplete) onRefreshComplete();
      setTimeout(() => setIsRefreshing(false), 500);
    } catch (error) {
      console.error('Refresh failed:', error);
      setIsRefreshing(false);
    }
  };

  const isBusy = isRefreshing || phase === 'loading';

  return (
    <button
      onClick={handleRefresh}
      disabled={isBusy || !coords}
      style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        color: 'rgba(255, 255, 255, 0.6)',
        cursor: (!coords || isBusy) ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '14px',
        transition: 'all 0.2s ease',
        opacity: (!coords || isBusy) ? 0.5 : 1,
        padding: 0,
      }}
      title="Refresh weather data"
    >
      <span style={{ 
        display: 'inline-block',
        animation: isBusy ? 'spin 1s linear infinite' : 'none'
      }}>
        ↻
      </span>
    </button>
  );
};

// Add spin animation to document if not already present
if (!document.querySelector('#refresh-spin-style')) {
  const style = document.createElement('style');
  style.id = 'refresh-spin-style';
  style.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}

export default RefreshButton;
