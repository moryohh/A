import React from 'react';

interface DiagramSvgProps {
  onPartHover: (id: string | null) => void;
  onPartSelect: (id: string) => void;
  selectedPartId: string | null;
  hoveredPartId: string | null;
  isLiveMotion: boolean;
}

export const ChargingCurrentGraphSvg: React.FC<DiagramSvgProps> = ({
  onPartHover,
  onPartSelect,
  selectedPartId,
  hoveredPartId,
  isLiveMotion,
}) => {
  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  const curvePath = "M 220 140 C 250 250, 320 390, 480 435 C 580 448, 680 450, 780 450";

  return (
    <g id="charging-current-graph-svg" className="font-['Cairo',sans-serif]">
      <defs>
        <filter id="graph-glow-3" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0284c7" floodOpacity="0.8" />
        </filter>
        <marker id="arrow-head-axis-3" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <polygon points="0 0, 8 4, 0 8" fill="#1e293b" />
        </marker>
        <style>{`
          @keyframes tracerMotion {
            0% { offset-distance: 0%; opacity: 1; }
            80% { opacity: 1; }
            100% { offset-distance: 100%; opacity: 0; }
          }
          .animate-tracer-3 {
            offset-path: path("M 220 140 C 250 250, 320 390, 480 435 C 580 448, 680 450, 780 450");
            animation: tracerMotion 3s cubic-bezier(0.2, 0.8, 0.4, 1) infinite;
          }
        `}</style>
      </defs>

      {/* Grid Pattern */}
      <pattern id="graph-grid-3" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
      </pattern>
      <rect x="220" y="70" width="560" height="380" fill="url(#graph-grid-3)" />

      {/* Formula Header (Top Center) */}
      <g transform="translate(360, 25)">
        <rect width="210" height="36" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <text x="105" y="24" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#0284c7" fontFamily="'JetBrains Mono', monospace">
          I(t) = I_max · e^(-t/RC)
        </text>
      </g>

      {/* Y-AXIS (Charging Current I) */}
      <g
        id="current-axis"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('current-axis')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('current-axis')}
        filter={isPartActive('current-axis') ? 'url(#graph-glow-3)' : undefined}
      >
        <line x1="220" y1="465" x2="220" y2="70" stroke="#1e293b" strokeWidth="3" markerEnd="url(#arrow-head-axis-3)" />
        <text x="220" y="60" fontSize="16" fontWeight="bold" fill="#0f172a" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">I</text>
      </g>

      {/* X-AXIS (Time t) */}
      <g
        id="time-axis"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('time-axis')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('time-axis')}
        filter={isPartActive('time-axis') ? 'url(#graph-glow-3)' : undefined}
      >
        <line x1="205" y1="450" x2="800" y2="450" stroke="#1e293b" strokeWidth="3" markerEnd="url(#arrow-head-axis-3)" />
        <text x="815" y="455" fontSize="16" fontWeight="bold" fill="#0f172a" fontFamily="'JetBrains Mono', monospace">t</text>
      </g>

      {/* ORIGIN (0, 0) */}
      <g
        id="origin-o"
        className="cursor-pointer"
        onMouseEnter={() => onPartHover('origin-o')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('origin-o')}
      >
        <circle cx="220" cy="450" r="4" fill="#1e293b" />
        <text x="205" y="468" fontSize="14" fontWeight="bold" fill="#64748b">0</text>
      </g>

      {/* EXPONENTIAL DECAY CURVE */}
      <g
        id="decay-curve"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('decay-curve')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('decay-curve')}
        filter={isPartActive('decay-curve') ? 'url(#graph-glow-3)' : undefined}
      >
        {/* Soft shaded area under curve */}
        <path
          d="M 220 140 C 250 250, 320 390, 480 435 C 580 448, 680 450, 780 450 L 220 450 Z"
          fill="#38bdf8"
          opacity="0.08"
        />

        {/* Thick Curve Line */}
        <path
          d={curvePath}
          fill="none"
          stroke={isPartActive('decay-curve') ? '#0369a1' : '#0284c7'}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>

      {/* Live Animated Tracer Dot on the curve */}
      {isLiveMotion && (
        <circle r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="2" className="animate-tracer-3 pointer-events-none" />
      )}

      {/* PEAK POINT AT t = 0: I = E / R */}
      <g
        id="peak-current"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('peak-current')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('peak-current')}
        filter={isPartActive('peak-current') ? 'url(#graph-glow-3)' : undefined}
      >
        <circle cx="220" cy="140" r="6" fill="#dc2626" stroke="#ffffff" strokeWidth="2" />
        <line x1="210" y1="140" x2="230" y2="140" stroke="#dc2626" strokeWidth="2" />
      </g>

      {/* COMPLETE CHARGING EQUILIBRIUM: I = 0 */}
      <g
        id="zero-current-equilibrium"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('zero-current-equilibrium')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('zero-current-equilibrium')}
        filter={isPartActive('zero-current-equilibrium') ? 'url(#graph-glow-3)' : undefined}
      >
        <circle cx="720" cy="450" r="6" fill="#16a34a" stroke="#ffffff" strokeWidth="2" />
      </g>
    </g>
  );
};
