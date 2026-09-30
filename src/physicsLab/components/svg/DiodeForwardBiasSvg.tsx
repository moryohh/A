import React from 'react';

interface DiagramSvgProps {
  onPartHover: (id: string | null) => void;
  onPartSelect: (id: string) => void;
  selectedPartId: string | null;
  hoveredPartId: string | null;
  isLiveMotion: boolean;
}

export const DiodeForwardBiasSvg: React.FC<DiagramSvgProps> = ({
  onPartHover,
  onPartSelect,
  selectedPartId,
  hoveredPartId,
  isLiveMotion,
}) => {
  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  return (
    <g id="diode-forward-bias-svg" className="font-['Cairo',sans-serif]">
      <defs>
        {/* Glow filter for highlighted element */}
        <filter id="fwd-glow-10" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0284c7" floodOpacity="0.8" />
        </filter>
        {/* Lamp glow in forward bias */}
        <filter id="lamp-forward-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <style>{`
          @keyframes flowAnimationFwd {
            to { stroke-dashoffset: -30; }
          }
          .animate-current-flow-fwd {
            stroke-dasharray: 15 15;
            animation: flowAnimationFwd 0.8s linear infinite;
          }
        `}</style>
      </defs>

      {/* Grid Background */}
      <pattern id="grid-pn-fwd" width="20" height="20" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="1" fill="#dcdde1" />
      </pattern>
      <rect width="900" height="550" fill="url(#grid-pn-fwd)" opacity="0.6" />

      {/* Base Circuit Wire Path */}
      <path
        d="M 150 180 L 150 400 L 400 400 M 500 400 L 750 400 L 750 180 L 580 180 M 320 180 L 150 180"
        fill="none"
        stroke="#16a085"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Animated Current Flow (Clockwise in Forward Bias) */}
      {isLiveMotion && (
        <g fill="none" stroke="#27ae60" strokeWidth="3.5" strokeLinecap="round" className="animate-current-flow-fwd opacity-90 pointer-events-none">
          <path d="M 150 400 L 150 180 L 320 180" />
          <path d="M 580 180 L 750 180 L 750 400 L 500 400" />
        </g>
      )}

      {/* 1. RESISTOR (750, 280) */}
      <g
        id="limiting-resistor"
        transform="translate(735, 250)"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('limiting-resistor')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('limiting-resistor')}
        filter={isPartActive('limiting-resistor') ? 'url(#fwd-glow-10)' : undefined}
      >
        <rect x="0" y="0" width="30" height="60" rx="3" fill="#fcf3cf" stroke="#d35400" strokeWidth="2" />
        <line x1="0" y1="15" x2="30" y2="15" stroke="#d35400" strokeWidth="2" />
        <line x1="0" y1="30" x2="30" y2="30" stroke="#d35400" strokeWidth="2" />
        <line x1="0" y1="45" x2="30" y2="45" stroke="#d35400" strokeWidth="2" />
      </g>

      {/* 2. LAMP (150, 280) - Glowing with Yellow Halo in Forward Bias */}
      <g
        id="forward-indicator-bulb"
        transform="translate(150, 280)"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('forward-indicator-bulb')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('forward-indicator-bulb')}
        filter={isPartActive('forward-indicator-bulb') ? 'url(#fwd-glow-10)' : undefined}
      >
        <circle cx="0" cy="0" r="32" fill="#f1c40f" opacity="0.3" filter="url(#lamp-forward-glow)" />
        <circle cx="0" cy="0" r="25" fill="#f1c40f" stroke="#7f8c8d" strokeWidth="3" />
        <path d="M -15 -15 L 15 15 M -15 15 L 15 -15" stroke="#7f8c8d" strokeWidth="2.5" />
      </g>

      {/* 3. BATTERY FORWARD (+ Left, - Right) at (450, 400) */}
      <g
        id="battery-forward"
        transform="translate(450, 400)"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('battery-forward')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('battery-forward')}
        filter={isPartActive('battery-forward') ? 'url(#fwd-glow-10)' : undefined}
      >
        {/* First Long Plate: Positive (+) */}
        <line x1="-30" y1="-25" x2="-30" y2="25" stroke="#e74c3c" strokeWidth="3.5" strokeLinecap="round" />
        {/* Short Thick Plate: Negative (-) */}
        <line x1="-15" y1="-12" x2="-15" y2="12" stroke="#2c3e50" strokeWidth="5.5" strokeLinecap="round" />
        {/* Second Cell */}
        <line x1="0" y1="-25" x2="0" y2="25" stroke="#e74c3c" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="15" y1="-12" x2="15" y2="12" stroke="#2c3e50" strokeWidth="5.5" strokeLinecap="round" />

        <text x="-42" y="-30" fill="#e74c3c" fontSize="20" fontWeight="bold">+</text>
        <text x="22" y="-30" fill="#2c3e50" fontSize="20" fontWeight="bold">−</text>
      </g>

      {/* 4. DIODE SYMBOL at (400, 180) */}
      <g
        id="pn-diode-fwd"
        transform="translate(400, 180)"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('pn-diode-fwd')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('pn-diode-fwd')}
        filter={isPartActive('pn-diode-fwd') ? 'url(#fwd-glow-10)' : undefined}
      >
        <polygon points="-30,-20 -30,20 10,0" fill="#2980b9" />
        <line x1="10" y1="-20" x2="10" y2="20" stroke="#2c3e50" strokeWidth="4" strokeLinecap="round" />
        <line x1="-50" y1="0" x2="-30" y2="0" stroke="#16a085" strokeWidth="3" />
        <line x1="10" y1="0" x2="30" y2="0" stroke="#16a085" strokeWidth="3" />
      </g>

      {/* 5. P-N JUNCTION VISUALIZATION at (320, 220) */}
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

        {/* NARROW Depletion Region in Forward Bias (width = 10px, x = 125) */}
        <g
          id="narrow-depletion"
          className="cursor-pointer transition-all duration-200"
          onMouseEnter={() => onPartHover('narrow-depletion')}
          onMouseLeave={() => onPartHover(null)}
          onClick={() => onPartSelect('narrow-depletion')}
          filter={isPartActive('narrow-depletion') ? 'url(#fwd-glow-10)' : undefined}
        >
          <rect x="125" y="16" width="10" height="48" fill="#27ae60" opacity="0.6" stroke="#27ae60" strokeWidth="1" />
        </g>
      </g>

      {/* 6. FORWARD CURRENT ARROW on Upper Wire */}
      <g
        id="forward-current-flow"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('forward-current-flow')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('forward-current-flow')}
      >
        <circle cx="230" cy="180" r="4" fill="#27ae60" />
      </g>
    </g>
  );
};
