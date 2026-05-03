// MoonPhaseIcon.jsx
import React from 'react';
import './design-system.css';

const MoonPhaseIcon = ({ phase, size = 36 }) => {
  // phase is between 0 and 1
  const index = Math.floor(phase * 14) % 14;   // 0 to 13

  const base = import.meta.env.BASE_URL;

  const moonImages = [
    `${base}images/moon/moon01_th.jpg`,   // 0: New Moon
    `${base}images/moon/moon02.jpg`,      // 1
    `${base}images/moon/moon03.jpg`,      // 2
    `${base}images/moon/moon04.jpg`,      // 3: Waxing Crescent
    `${base}images/moon/moon05.jpg`,      // 4
    `${base}images/moon/moon06_th.jpg`,   // 5: First Quarter
    `${base}images/moon/moon07.jpg`,      // 6
    `${base}images/moon/moon09.jpg`,      // 7: Full Moon
    `${base}images/moon/moon08_th.jpg`,   // 8
    `${base}images/moon/moon10_th.jpg`,   // 9
    `${base}images/moon/moon11.jpg`,      // 10
    `${base}images/moon/moon12.jpg`,      // 11: Last Quarter
    `${base}images/moon/moon13.jpg`,      // 12: Waning Crescent
    `${base}images/moon/moon14.jpg`,      // 13: back to New Moon
  ];

  return (
    <img
      src={moonImages[index]}
      alt="Moon Phase"
      width={size}
      height={size}
      className="moon-phase-icon"
    />
  );
};

export default MoonPhaseIcon;
