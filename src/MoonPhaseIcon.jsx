// MoonPhaseIcon.jsx
// To Do: Edit the images to make the axis more consistent and the spacing around the image the same?
import React from 'react';
import './design-system.css';

const MoonPhaseIcon = ({ phase, size = 36 }) => {
  // phase is between 0 and 1
  const index = Math.floor(phase * 14) % 14;   // 0 to 13

  const moonImages = [
    "/images/moon/moon01_th.jpg",   // 0: New Moon
    "/images/moon/moon02.jpg",      // 1
    "/images/moon/moon03.jpg",      // 2
    "/images/moon/moon04.jpg",      // 3: Waxing Crescent
    "/images/moon/moon05.jpg",      // 4
    "/images/moon/moon06_th.jpg",   // 5: First Quarter
    "/images/moon/moon07.jpg",      // 6
    "/images/moon/moon09.jpg",      // 7: Full Moon ← shift moon09 here
    "/images/moon/moon08_th.jpg",   // 8: move moon08_th here
    "/images/moon/moon10_th.jpg",   // 9
    "/images/moon/moon11.jpg",      // 10
    "/images/moon/moon12.jpg",      // 11: Last Quarter
    "/images/moon/moon13.jpg",      // 12: Waning Crescent
    "/images/moon/moon14.jpg"       // 13: back to New Moon
  ];

  //console.log(`phase=${phase.toFixed(4)} → index=${index} → ${moonImages[index]}`);

  return (
    <img
      src={moonImages[index]}
      alt="Moon Phase"
      width={size}
      height={size}
      style={{
        borderRadius: '50%',
        objectFit: 'cover',
        filter: 'brightness(1.1) contrast(1.1)'
      }}
    />
  );
};

export default MoonPhaseIcon;
