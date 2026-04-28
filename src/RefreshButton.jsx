import { useState } from 'react';
import { useDebug } from './DebugContext';

function RefreshButton({
  fetchWeather,
  coords,
  phase,
  onRefreshComplete = null,
}) {
  const { postMessage } = useDebug();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const hasCoords = coords?.lat != null && coords?.lon != null;
  const isBusy = isRefreshing || phase === 'loading';

  const handleRefresh = async () => {
    postMessage('Refresh: handleRefresh', 'debug');

    if (isBusy) {
      postMessage('Refresh skipped: already busy', 'debug');
      return;
    }

    if (!hasCoords) {
      postMessage('Refresh skipped: missing coordinates', 'warn');
      return;
    }

    setIsRefreshing(true);
    postMessage(
      `Refresh started for ${coords.lat}, ${coords.lon}`,
      'debug'
    );

    try {
      await fetchWeather(coords.lat, coords.lon);
      postMessage('Refresh succeeded', 'info');
      onRefreshComplete?.();
    } catch (error) {
      console.error('Refresh failed:', error);
      postMessage(
        `Refresh failed: ${error?.message ?? 'Unknown error'}`,
        'error'
      );
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

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

  return (
    <button
      onClick={handleRefresh}
      disabled={isBusy || !hasCoords}
      title="Refresh weather data"
      aria-label="Refresh weather data"
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        color: 'rgba(255, 255, 255, 0.6)',
        cursor: !hasCoords || isBusy ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 14,
        transition: 'all 0.2s ease',
        opacity: !hasCoords || isBusy ? 0.5 : 1,
        padding: 0,
      }}
    >
      <span
        style={{
          display: 'inline-block',
          animation: isBusy ? 'spin 1s linear infinite' : 'none',
        }}
      >
        ↻
      </span>
    </button>
  );
}

export default RefreshButton;
