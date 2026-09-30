import React from 'react';

interface DiagramSvgProps {
  onPartHover: (id: string | null) => void;
  onPartSelect: (id: string) => void;
  selectedPartId: string | null;
  hoveredPartId: string | null;
  isLiveMotion: boolean;
}

export const DiodeReverseBiasSvg: React.FC<DiagramSvgProps> = ({
  onPartHover,
  onPartSelect,
  selectedPartId,
  hoveredPartId,
}) => {
  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  return (
    <g id="diode-reverse-bias-svg" className="font-['Cairo',sans-serif]">
      <defs>
        <filter id="rev-glow-11" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#e74c3c" floodOpacity="0.8" />
        </filter>
        <style>{`
          @keyframes reversePulsingBarrier2 {
            0%, 100% { opacity: 0.85; }
            50% { opacity: 0.55; }
          }
          .animate-barrier-pn {
            animation: reversePulsingBarrier2 2s ease-in-out infinite;
          }
        `}</style>
      </defs>

      {/* Grid Background */}
      <pattern id="grid-pn-rev" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="1" fill="#dcdde1" />
      </pattern>
      <rect width="900" height="550" fill="url(#grid-pn-rev)" opacity="0.6" />

      {/* Base Circuit Wire Path */}
      <path
        d="M 150 180 L 150 400 L 400 400 M 500 400 L 750 400 L 750 180 L 580 180 M 320 180 L 150 180"
        fill="none"
        stroke="#16a085"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 1. RESISTOR (750, 280) */}
      <g
        id="limiting-resistor-rev"
        transform="translate(735, 250)"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('limiting-resistor-rev')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('limiting-resistor-rev')}
        filter={isPartActive('limiting-resistor-rev') ? 'url(#rev-glow-11)' : undefined}
      >
        <rect x="0" y="0" width="30" height="60" rx="3" fill="#fcf3cf" stroke="#d35400" strokeWidth="2" />
        <line x1="0" y1="15" x2="30" y2="15" stroke="#d35400" strokeWidth="2" />
        <line x1="0" y1="30" x2="30" y2="30" stroke="#d35400" strokeWidth="2" />
        <line x1="0" y1="45" x2="30" y2="45" stroke="#d35400" strokeWidth="2" />
      </g>

      {/* 2. LAMP (150, 280) - UNLIT GRAY in Reverse Bias */}
      <g
        id="dark-indicator-rev"
        transform="translate(150, 280)"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('dark-indicator-rev')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('dark-indicator-rev')}
        filter={isPartActive('dark-indicator-rev') ? 'url(#rev-glow-11)' : undefined}
      >
        <circle cx="0" cy="0" r="25" fill="#bdc3c7" stroke="#7f8c8d" strokeWidth="3" />
        <path d="M -15 -15 L 15 15 M -15 15 L 15 -15" stroke="#7f8c8d" strokeWidth="2.5" />
      </g>

      {/* 3. BATTERY REVERSE (- Left, + Right) at (450, 400) */}
      <g
        id="rev-battery"
        transform="translate(450, 400)"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('rev-battery')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('rev-battery')}
        filter={isPartActive('rev-battery') ? 'url(#rev-glow-11)' : undefined}
      >
        {/* Short Thick Plate: Negative (-) on Left */}
        <line x1="-30" y1="-12" x2="-30" y2="12" stroke="#2c3e50" strokeWidth="5.5" strokeLinecap="round" />
        {/* Long Plate: Positive (+) */}
        <line x1="-15" y1="-25" x2="-15" y2="25" stroke="#e74c3c" strokeWidth="3.5" strokeLinecap="round" />
        {/* Second Cell */}
        <line x1="0" y1="-12" x2="0" y2="12" stroke="#2c3e50" strokeWidth="5.5" strokeLinecap="round" />
        <line x1="15" y1="-25" x2="15" y2="25" stroke="#e74c3c" strokeWidth="3.5" strokeLinecap="round" />

        <text x="-42" y="-30" fill="#2c3e50" fontSize="20" fontWeight="bold">−</text>
        <text x="22" y="-30" fill="#e74c3c" fontSize="20" fontWeight="bold">+</text>
      </g>

      {/* 4. DIODE SYMBOL at (400, 180) */}
      <g
        id="pn-diode-rev"
        transform="translate(400, 180)"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('pn-diode-rev')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('pn-diode-rev')}
        filter={isPartActive('pn-diode-rev') ? 'url(#rev-glow-11)' : undefined}
      >
        <polygon points="-30,-20 -30,20 10,0" fill="#7f8c8d" />
        <line x1="10" y1="-20" x2="10" y2="20" stroke="#2c3e50" strokeWidth="4" strokeLinecap="round" />
        <line x1="-50" y1="0" x2="-30" y2="0" stroke="#16a085" strokeWidth="3" />
        <line x1="10" y1="0" x2="30" y2="0" stroke="#16a085" strokeWidth="3" />
      </g>

      {/* 5. P-N JUNCTION VISUALIZATION with WIDE DEPLETION REGION at (320, 220) */}
      <g transform="translate(320, 220)">
        {/* Connection Wires from Diode */}
        <line x1="130" y1="-40" x2="130" y2="15" stroke="#7f8c8d" strokeWidth="1.5" strokeDasharray="4 4" />
        <line x1="210" y1="-40" x2="210" y2="15" stroke="#7f8c8d" strokeWidth="1.5" strokeDasharray="4 4" />

        {/* Outer Container */}
        <rect x="50" y="15" width="160" height="50" fill="none" stroke="#7f8c8d" strokeWidth="2" rx="4" />
        
        {/* P Region */}
        <rect x="51" y="16" width="79" height="48" fill="#d4e6f1" rx="3" />
        <text x="60" y="35" fontSize="14" fontWeight="bold" fill="#2980b9">P</text>
        <circle cx="90" cy="40" r="6" fill="#ffffff" stroke="#2980b9" strokeWidth="1.5" />
        <text x="86" y="44" fontSize="10" fontWeight="bold" fill="#2980b9">+</text>
        <circle cx="110" cy="40" r="6" fill="#ffffff" stroke="#2980b9" strokeWidth="1.5" />
        <text x="106" y="44" fontSize="10" fontWeight="bold" fill="#2980b9">+</text>

        {/* N Region */}
        <rect x="130" y="16" width="79" height="48" fill="#fadbd8" rx="3" />
        <text x="195" y="35" fontSize="14" fontWeight="bold" fill="#c0392b">N</text>
        <circle cx="150" cy="40" r="6" fill="#ffffff" stroke="#c0392b" strokeWidth="1.5" />
        <text x="147" y="43" fontSize="10" fontWeight="bold" fill="#c0392b">−</text>
        <circle cx="170" cy="40" r="6" fill="#ffffff" stroke="#c0392b" strokeWidth="1.5" />
        <text x="167" y="43" fontSize="10" fontWeight="bold" fill="#c0392b">−</text>

        {/* WIDE Depletion Region in Reverse Bias (width = 80px, x = 90) */}
        <g
          id="wide-depletion"
          className="cursor-pointer transition-all duration-200"
          onMouseEnter={() => onPartHover('wide-depletion')}
          onMouseLeave={() => onPartHover(null)}
          onClick={() => onPartSelect('wide-depletion')}
          filter={isPartActive('wide-depletion') ? 'url(#rev-glow-11)' : undefined}
        >
          <rect
            x="90"
            y="16"
            width="80"
            height="48"
            fill="#e74c3c"
            opacity="0.35"
            stroke="#e74c3c"
            strokeWidth="1.5"
            className="animate-barrier-pn"
          />
        </g>
      </g>

      {/* 6. ZERO CURRENT CONDITION on Upper Wire */}
      <g
        id="zero-current-tag"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('zero-current-tag')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('zero-current-tag')}
      >
        <circle cx="230" cy="180" r="4" fill="#e74c3c" />
      </g>
    </g>
  );
};
