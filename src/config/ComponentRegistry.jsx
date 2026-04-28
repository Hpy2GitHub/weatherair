// src/config/componentRegistry.js
export const componentRegistry = [
  {
    id: 'header',
    name: 'Location Header',
    description: 'City name and region display',
    defaultVisible: false,
    category: 'info',
    required: true,
  },
  {
    id: 'hero',
    name: 'Current Weather',
    description: 'Main temperature and conditions display',
    defaultVisible: true,
    category: 'weather',
    required: false,
  },
  {
    id: 'stats',
    name: 'Weather Statistics',
    description: 'Wind, humidity, pressure, and other stats',
    defaultVisible: true,
    category: 'weather',
    required: false,
  },
  {
    id: 'hourly',
    name: 'Hourly Forecast',
    description: '24-hour temperature and precipitation chart',
    defaultVisible: true,
    category: 'forecast',
    required: false,
  },
  {
    id: 'forecast',
    name: '7-Day Forecast',
    description: 'Weekly weather outlook',
    defaultVisible: true,
    category: 'forecast',
    required: false,
  },
  {
    id: 'airquality',
    name: 'Air Quality Index',
    description: 'Current AQI gauge and pollutant details',
    defaultVisible: true,
    category: 'environment',
    required: false,
  },
  {
    id: 'skyevents',
    name: 'Sun & Moon Events',
    description: 'Sun arc, golden hour, and moon phase tracker',
    defaultVisible: true,
    category: 'astronomy',
    required: false,
  },
  {
    id: 'aqitable',
    name: 'AQI Reference Table',
    description: 'Air Quality Index color codes and descriptions',
    defaultVisible: true,
    category: 'environment',
    required: false,
  },
  {
    id: 'debugconsole',  // ADD THIS
    name: 'Debug Console',
    description: 'Developer console for logging API data',
    defaultVisible: false,  // Off by default, users can enable
    category: 'info',
    required: false,
  },
  {
    id: 'footer',
    name: 'Footer',
    description: 'App footer with credits',
    defaultVisible: true,
    category: 'info',
    required: false,
  },
  {
    id: 'precipitation',
    name: 'Precipitation Forecast',
    description: '24-hour precipitation probability and type chart',
    defaultVisible: true,
    category: 'forecast',
    required: false,
  },
  {
    id: 'radar',
    name: 'Weather Radar',
    description: 'Government Weather Map',
    defaultVisible: true,
    category: 'forecast',
    required: false,
  },
  {
    id: 'nwsforecast',
    name: 'Forecast Highlights',
    description: 'National Weather Service Summary',
    defaultVisible: true,
    category: 'forecast',
    required: false,
  },
  {
    id: 'lightning',
    name: 'Lightning Debug Card',
    description: 'Fake Lightning Reports',
    defaultVisible: true,
    category: 'weather',
    required: false,
  },
  {
    id: 'flu',
    name: 'Flu Trends',
    description: 'Recent Outpatient Reports',
    defaultVisible: true,
    category: 'health',
    required: false,
  },
  {
    id: 'activefires',
    name: 'Active Fires',
    description: 'Active Fires',
    defaultVisible: true,
    category: 'fire',
    required: false,
  },
  {
    id: 'firedrivers',
    name: 'Fire Drivers',
    description: 'Drivers',
    defaultVisible: true,
    category: 'fire',
    required: false,
  },
  {
    id: 'firerisk',
    name: 'Fire Risk',
    description: 'Fire Risk',
    defaultVisible: true,
    category: 'fire',
    required: false,
  },
  {
    id: 'firelinks',
    name: 'Fire Map Links',
    description: 'Fire Map Links',
    defaultVisible: true,
    category: 'fire',
    required: false,
  },
];

export const getDefaultVisibility = () => {
  const visibility = {};
  componentRegistry.forEach(comp => {
    visibility[comp.id] = comp.defaultVisible;
  });
  return visibility;
};
