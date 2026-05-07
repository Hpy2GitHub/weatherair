Build a React/TypeScript component called <ComponentName> for my weather app.

## Design
[Attach screenshot/mockup here]

## Props (match the App.tsx usage pattern)
<ComponentName current={weather?.current} hourly={weather?.hourly} unit={unit} />

## Data shape (Open Meteo API)
The relevant fields I need from the API response are:
- current.<field_name>          // e.g. current.wind_speed_10m
- hourly.<field_name>[index]    // e.g. hourly.wind_direction_80m[i]
- unit: "metric" | "imperial"

## Existing conventions to match
- Styling: [Tailwind / CSS modules / styled-components / etc.]
- Color theme: [dark / light / tokens like --color-primary]
- Existing component to reference for style: [e.g. WindCard, TempCard]
- Breakpoints: [mobile-first? specific widths?]

## Behavior notes
- Hourly data: show next [N] hours / 24h chart / etc.
- Unit switching: metric shows [X unit], imperial shows [Y unit]
- Any loading/null states to handle?

## What NOT to change
- Keep prop interface consistent with other cards
- Don't introduce new dependencies
