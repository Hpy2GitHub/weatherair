python -m venv .venv
source .venv/bin/activate
pip install -r blitz_proxy_requirements.txt

export BLITZ_USERNAME="your-blitz-username"
export BLITZ_PASSWORD="your-blitz-password"
export BLITZ_LAST_STRIKES_URL="https://data.blitzortung.org/Data/Protected/last_strikes.php"

python blitz_proxy.py

curl "http://localhost:5000/api/lightning?lat=40.1784&lon=-74.0479&radius=75&limit=25"

Point your react app at 
http://localhost:5000/api/lightning

sample response
{
  "source": "Blitzortung proxy",
  "query": {
    "lat": 40.1784,
    "lon": -74.0479,
    "radius": 75,
    "limit": 25
  },
  "count": 3,
  "strikes": [
    {
      "id": "example",
      "lat": 40.21,
      "lon": -74.1,
      "timestamp": "2026-04-28T22:01:00Z",
      "timestamp_unix": 1777413660,
      "distance_km": 12.4,
      "bearing_deg": 131.0,
      "energy": 18400,
      "region": "Monmouth County"
    }
  ]
}
