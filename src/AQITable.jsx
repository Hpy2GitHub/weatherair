import React, { useState } from 'react';

// AQI data based on the provided image
const aqiLevels = [
  {
    color: 'green',
    displayColor: 'Green',
    level: 'Good',
    range: '0 to 50',
    description: 'Air quality is satisfactory, and air pollution poses little or no risk.',
    bgClass: 'aqi-green'
  },
  {
    color: 'yellow',
    displayColor: 'Yellow',
    level: 'Moderate',
    range: '51 to 100',
    description: 'Air quality is acceptable. However, there may be a risk for some people, particularly those who are unusually sensitive to air pollution.',
    bgClass: 'aqi-yellow'
  },
  {
    color: 'orange',
    displayColor: 'Orange',
    level: 'Unhealthy for\nSensitive Groups',
    range: '101 to 150',
    description: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.',
    bgClass: 'aqi-orange'
  },
  {
    color: 'red',
    displayColor: 'Red',
    level: 'Unhealthy',
    range: '151 to 200',
    description: 'Some members of the general public may experience health effects; members of sensitive groups may experience more serious health effects.',
    bgClass: 'aqi-red'
  },
  {
    color: 'purple',
    displayColor: 'Purple',
    level: 'Very Unhealthy',
    range: '201 to 300',
    description: 'Health alert: The risk of health effects is increased for everyone.',
    bgClass: 'aqi-purple'
  },
  {
    color: 'maroon',
    displayColor: 'Maroon',
    level: 'Hazardous',
    range: '301 and higher',
    description: 'Health warning of emergency conditions: everyone is more likely to be affected.',
    bgClass: 'aqi-maroon'
  }
];

// Helper to get the CSS class name for each AQI level
const getAqiClass = (colorName, isExpanded = false) => {
  if (isExpanded) return `aqi-description aqi-description-${colorName}`;
  return `aqi-row aqi-row-${colorName}`;
};

const AQITable = () => {
  const [expandedRow, setExpandedRow] = useState(null);

  const toggleRow = (index) => {
    setExpandedRow(expandedRow === index ? null : index);
  };

  return (
    <section className="card fade-in-4">
      <p className="section-label">DAILY AQI COLOR · VALUES OF INDEX</p>
      
      {aqiLevels.map((level, idx) => {
        const isExpanded = expandedRow === idx;
        
        return (
          <div key={idx} className="aqi-item">
            <div 
              className={`${getAqiClass(level.color)} ${isExpanded ? 'expanded' : ''}`}
              onClick={() => toggleRow(idx)}
            >
              <div className="aqi-color-indicator">
                <div className={`color-dot color-dot-${level.color}`} />
              </div>
              <span className="aqi-color-name">{level.displayColor}</span>
              <span className="aqi-level">{level.level}</span>
              <span className="aqi-range">{level.range}</span>
              <span className="aqi-expand-icon">{isExpanded ? '▲' : '▼'}</span>
            </div>
            
            {isExpanded && (
              <div className={getAqiClass(level.color, true)}>
                {level.description}
              </div>
            )}
          </div>
        );
      })}
    </section>
  );
};

export default AQITable;
