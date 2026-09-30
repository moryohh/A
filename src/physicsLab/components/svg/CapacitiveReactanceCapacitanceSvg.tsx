import React from 'react';

interface DiagramSvgProps {
  onPartHover: (id: string | null) => void;
  onPartSelect: (id: string) => void;
  selectedPartId: string | null;
  hoveredPartId: string | null;
  isLiveMotion: boolean;
}

export const CapacitiveReactanceCapacitanceSvg: React.FC<DiagramSvgProps> = ({
  onPartHover,
  onPartSelect,
  selectedPartId,
  hoveredPartId,
  isLiveMotion,
}) => {
  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  const hyperbolaPathC = "M 250 140 C 260 250, 320 380, 460 415 C 560 435, 670 440, 780 442";

  return (
    <g id="capacitive-reactance-capacitance-svg" className="font-['Cairo',sans-serif]">
      <defs>
        <filter id="graph-glow-8" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0284c7" floodOpacity="0.8" />
        </filter>
        <marker id="arrow-head-axis-8" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <polygon points="0 0, 8 4, 0 8" fill="#1e293b" />
        </marker>
        <style>{`
          @keyframes hyperbolaTracer8 {
            0% { offset-distance: 0%; opacity: 0.2; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { offset-distance: 100%; opacity: 0.2; }
          }
          .animate-tracer-8 {
            offset-path: path("M 250 140 C 260 250, 320 380, 460 415 C 560 435, 670 440, 780 442");
            animation: hyperbolaTracer8 3.2s ease-in-out infinite;
          }
        `}</style>
      </defs>

      {/* Grid Pattern */}
      <pattern id="graph-grid-8" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
      </pattern>
      <rect x="220" y="70" width="560" height="380" fill="url(#graph-grid-8)" />

      {/* Header Formula Box */}
      <g transform="translate(360, 25)">
        <rect width="210" height="36" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <text x="105" y="24" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#0369a1" fontFamily="'JetBrains Mono', monospace">
          X_C = 1 / (2π · f · C)
        </text>
      </g>

      {/* Y-AXIS (Capacitive Reactance XC) */}
      <g
        id="xc-axis-c"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('xc-axis-c')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('xc-axis-c')}
        filter={isPartActive('xc-axis-c') ? 'url(#graph-glow-8)' : undefined}
      >
        <line x1="220" y1="465" x2="220" y2="70" stroke="#1e293b" strokeWidth="3" markerEnd="url(#arrow-head-axis-8)" />
        <text x="220" y="60" fontSize="16" fontWeight="bold" fill="#0f172a" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">X_C</text>
      </g>

      {/* X-AXIS (Capacitance C) */}
      <g
        id="c-axis"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('c-axis')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('c-axis')}
        filter={isPartActive('c-axis') ? 'url(#graph-glow-8)' : undefined}
      >
        <line x1="205" y1="450" x2="800" y2="450" stroke="#1e293b" strokeWidth="3" markerEnd="url(#arrow-head-axis-8)" />
        <text x="815" y="455" fontSize="16" fontWeight="bold" fill="#0f172a" fontFamily="'JetBrains Mono', monospace">C</text>
      </g>

      {/* ORIGIN */}
      <circle cx="220" cy="450" r="4" fill="#1e293b" />
      <text x="205" y="468" fontSize="14" fontWeight="bold" fill="#64748b">0</text>

      {/* HYPERBOLIC CURVE: XC ∝ 1/C */}
      <g
        id="hyperbolic-curve-c"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('hyperbolic-curve-c')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('hyperbolic-curve-c')}
        filter={isPartActive('hyperbolic-curve-c') ? 'url(#graph-glow-8)' : undefined}
      >
        <path
          d={hyperbolaPathC}
          fill="none"
          stroke={isPartActive('hyperbolic-curve-c') ? '#0284c7' : '#0369a1'}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>

      {/* Live Tracer */}
      {isLiveMotion && (
        <circle r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="2" className="animate-tracer-8 pointer-events-none" />
      )}

      {/* DIELECTRIC SLAB INSERTION EFFECT POINT */}
      <g
        id="dielectric-slab-effect"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('dielectric-slab-effect')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('dielectric-slab-effect')}
        filter={isPartActive('dielectric-slab-effect') ? 'url(#graph-glow-8)' : undefined}
      >
        <circle cx="560" cy="425" r="5.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
      </g>

      {/* SMALL CAPACITANCE POINT */}
      <g
        id="small-capacitance-zone"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('small-capacitance-zone')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('small-capacitance-zone')}
        filter={isPartActive('small-capacitance-zone') ? 'url(#graph-glow-8)' : undefined}
      >
        <circle cx="250" cy="140" r="5.5" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
      </g>

      {/* CONDITION f = CONSTANT */}
      <g
        id="condition-f-const-c"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('condition-f-const-c')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('condition-f-const-c')}
        filter={isPartActive('condition-f-const-c') ? 'url(#graph-glow-8)' : undefined}
      >
        <circle cx="600" cy="450" r="4.5" fill="#047857" />
      </g>
    </g>
  );
};
