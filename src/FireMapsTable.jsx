import React, { useState } from 'react';

const fireMaps = [
  {
    scope: 'Nationwide',
    icon: '🇺🇸',
    name: 'NASA FIRMS US/Canada',
    description: 'Near-real-time satellite fire hotspots across the U.S. and Canada from MODIS and VIIRS sensors.',
    href: 'https://firms.modaps.eosdis.nasa.gov/usfs/map/',
    rowClass: 'firemap-row-national',
    descClass: 'firemap-desc-national',
  },
  {
    scope: 'Nationwide',
    icon: '🇺🇸',
    name: 'NIFC Fire Maps',
    description: 'National Interagency Fire Center gateway to current wildland fire perimeters, weather overlays, and satellite-detected fire starts.',
    href: 'https://www.nifc.gov/fire-information/maps',
    rowClass: 'firemap-row-national',
    descClass: 'firemap-desc-national',
  },
  {
    scope: 'Nationwide',
    icon: '🇺🇸',
    name: 'AirNow Fire & Smoke Map',
    description: 'Fire activity alongside current smoke conditions and air quality across the entire U.S.',
    href: 'https://fire.airnow.gov',
    rowClass: 'firemap-row-national',
    descClass: 'firemap-desc-national',
  },
  {
    scope: 'Nationwide',
    icon: '🇺🇸',
    name: 'USDA Forest Service Active Fire',
    description: 'Active fire mapping program with perimeter data, InciWeb links, and satellite hotspots maintained by the USDA Forest Service.',
    href: 'https://data.fs.usda.gov/geodata/maps/active-fire.php',
    rowClass: 'firemap-row-national',
    descClass: 'firemap-desc-national',
  },
  {
    scope: 'New Jersey',
    icon: '📍',
    name: 'NJOEM Wildfire Monitoring Dashboard',
    description: 'New Jersey Office of Emergency Management GIS dashboard showing active wildfire incidents within the state.',
    href: 'https://www.arcgis.com/apps/dashboards/ae7a0f441b0e484b95c5d3470d1b2550',
    rowClass: 'firemap-row-nj',
    descClass: 'firemap-desc-nj',
  },
  {
    scope: 'New Jersey',
    icon: '📍',
    name: 'NJDEP Wildfire Info',
    description: 'New Jersey DEP wildfire page with risk tools, prescribed fire notifications, and links to state fire dashboards.',
    href: 'https://dep.nj.gov/parksandforests/wildfire/',
    rowClass: 'firemap-row-nj',
    descClass: 'firemap-desc-nj',
  },
];

const FireMapsTable = () => {
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  return (
    <div className="firemap-table">
      <div className="firemap-header">FIRE MAPS · NATIONAL &amp; NEW JERSEY</div>

      {fireMaps.map((map, idx) => {
        const isExpanded = expandedRow === idx;

        return (
          <div key={idx}>
            <div
              className={`firemap-row ${map.rowClass}`}
              onClick={() => toggleRow(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && toggleRow(idx)}
              aria-expanded={isExpanded}
            >
              <span className="firemap-icon">{map.icon}</span>
              <span className="firemap-scope">{map.scope}</span>
              <span className="firemap-name">{map.name}</span>
              <span className="firemap-chevron">{isExpanded ? '▲' : '▼'}</span>
            </div>

            {isExpanded && (
              <div className={`firemap-description ${map.descClass}`}>
                <p>{map.description}</p>
                <a
                  href={map.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="firemap-link"
                >
                  Open map ↗
                </a>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default FireMapsTable;
