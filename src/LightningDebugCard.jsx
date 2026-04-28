import useLightning from './hooks/useLightning';

export default function LightningDebugCard({ lat, lon }) {
  const { strikes, nearestStrike, isDebug, loading, error } = useLightning({
    lat,
    lon,
    radiusMiles: 5,
    debug: true,
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <p>Mode: {isDebug ? 'debug' : 'live'}</p>
      <p>Nearest: {nearestStrike?.distance_miles ?? '—'} miles</p>
      <ul>
        {strikes.map((strike) => (
          <li key={strike.id}>
            {strike.region} - {strike.distance_miles} miles
          </li>
        ))}
      </ul>
    </div>
  );
}
