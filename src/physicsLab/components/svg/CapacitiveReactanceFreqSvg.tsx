import React from 'react';

interface DiagramSvgProps {
  onPartHover: (id: string | null) => void;
  onPartSelect: (id: string) => void;
  selectedPartId: string | null;
  hoveredPartId: string | null;
  isLiveMotion: boolean;
}

export const CapacitiveReactanceFreqSvg: React.FC<DiagramSvgProps> = ({
  onPartHover,
  onPartSelect,
  selectedPartId,
  hoveredPartId,
  isLiveMotion,
}) => {
  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  const hyperbolaPath = "M 250 140 C 260 250, 320 380, 460 415 C 560 435, 670 440, 780 442";

  return (
    <g id="capacitive-reactance-freq-svg" className="font-['Cairo',sans-serif]">
      <defs>
        <filter id="graph-glow-7" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0284c7" floodOpacity="0.8" />
        </filter>
        <marker id="arrow-head-axis-7" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <polygon points="0 0, 8 4, 0 8" fill="#1e293b" />
        </marker>
        <style>{`
          @keyframes hyperbolaTracer7 {
            0% { offset-distance: 0%; opacity: 0.2; }
            20% { opacity: 1; }
            80% { opacity: 1; }
            100% { offset-distance: 100%; opacity: 0.2; }
          }
          .animate-tracer-7 {
            offset-path: path("M 250 140 C 260 250, 320 380, 460 415 C 560 435, 670 440, 780 442");
            animation: hyperbolaTracer7 3.2s ease-in-out infinite;
          }
        `}</style>
      </defs>

      {/* Grid */}
      <pattern id="graph-grid-7" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
      </pattern>
      <rect x="220" y="70" width="560" height="380" fill="url(#graph-grid-7)" />

      {/* Formula Header (Safe at top center) */}
      <g transform="translate(360, 25)">
        <rect width="210" height="36" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <text x="105" y="24" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#0369a1" fontFamily="'JetBrains Mono', monospace">
          X_C = 1 / (2π · f · C)
        </text>
      </g>

      {/* Y-AXIS (Capacitive Reactance XC) */}
      <g
        id="xc-axis"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('xc-axis')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('xc-axis')}
        filter={isPartActive('xc-axis') ? 'url(#graph-glow-7)' : undefined}
      >
        <line x1="220" y1="465" x2="220" y2="70" stroke="#1e293b" strokeWidth="3" markerEnd="url(#arrow-head-axis-7)" />
        <text x="220" y="60" fontSize="16" fontWeight="bold" fill="#0f172a" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">X_C</text>
      </g>

      {/* X-AXIS (Frequency f) */}
      <g
        id="f-axis-xc"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('f-axis-xc')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('f-axis-xc')}
        filter={isPartActive('f-axis-xc') ? 'url(#graph-glow-7)' : undefined}
      >
        <line x1="205" y1="450" x2="800" y2="450" stroke="#1e293b" strokeWidth="3" markerEnd="url(#arrow-head-axis-7)" />
        <text x="815" y="455" fontSize="16" fontWeight="bold" fill="#0f172a" fontFamily="'JetBrains Mono', monospace">f</text>
      </g>

      {/* ORIGIN */}
      <circle cx="220" cy="450" r="4" fill="#1e293b" />
      <text x="205" y="468" fontSize="14" fontWeight="bold" fill="#64748b">0</text>

      {/* HYPERBOLIC INVERSE PROPORTIONALITY CURVE */}
      <g
        id="hyperbolic-curve-f"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('hyperbolic-curve-f')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('hyperbolic-curve-f')}
        filter={isPartActive('hyperbolic-curve-f') ? 'url(#graph-glow-7)' : undefined}
      >
        <path
          d={hyperbolaPath}
          fill="none"
          stroke={isPartActive('hyperbolic-curve-f') ? '#0284c7' : '#0369a1'}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>

      {/* Live Animated Tracer */}
      {isLiveMotion && (
        <circle r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="2" className="animate-tracer-7 pointer-events-none" />
      )}

      {/* LOW FREQUENCY REGION POINT */}
      <g
        id="low-freq-zone"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('low-freq-zone')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('low-freq-zone')}
        filter={isPartActive('low-freq-zone') ? 'url(#graph-glow-7)' : undefined}
      >
        <circle cx="250" cy="140" r="5.5" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
      </g>

      {/* HIGH FREQUENCY REGION POINT */}
      <g
        id="high-freq-zone"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('high-freq-zone')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('high-freq-zone')}
        filter={isPartActive('high-freq-zone') ? 'url(#graph-glow-7)' : undefined}
      >
        <circle cx="750" cy="441" r="5.5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
      </g>

      {/* CONDITION C = CONSTANT */}
      <g
        id="condition-c-const"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('condition-c-const')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('condition-c-const')}
        filter={isPartActive('condition-c-const') ? 'url(#graph-glow-7)' : undefined}
      >
        <circle cx="600" cy="450" r="4.5" fill="#6d28d9" />
      </g>
    </g>
  );
};
