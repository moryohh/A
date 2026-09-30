import React from 'react';

interface DiagramSvgProps {
  onPartHover: (id: string | null) => void;
  onPartSelect: (id: string) => void;
  selectedPartId: string | null;
  hoveredPartId: string | null;
  isLiveMotion: boolean;
}

export const DischargingCurrentGraphSvg: React.FC<DiagramSvgProps> = ({
  onPartHover,
  onPartSelect,
  selectedPartId,
  hoveredPartId,
  isLiveMotion,
}) => {
  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  const dischCurvePath = "M 220 140 C 240 280, 290 420, 420 445 C 500 450, 620 450, 780 450";

  return (
    <g id="discharging-current-graph-svg" className="font-['Cairo',sans-serif]">
      <defs>
        <filter id="graph-glow-4" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ef4444" floodOpacity="0.8" />
        </filter>
        <marker id="arrow-head-axis-4" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <polygon points="0 0, 8 4, 0 8" fill="#1e293b" />
        </marker>
        <style>{`
          @keyframes dischTracerMotion {
            0% { offset-distance: 0%; opacity: 1; }
            70% { opacity: 1; }
            100% { offset-distance: 100%; opacity: 0; }
          }
          .animate-tracer-4 {
            offset-path: path("M 220 140 C 240 280, 290 420, 420 445 C 500 450, 620 450, 780 450");
            animation: dischTracerMotion 2.2s cubic-bezier(0.1, 0.9, 0.2, 1) infinite;
          }
        `}</style>
      </defs>

      {/* Grid Pattern */}
      <pattern id="graph-grid-4" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
      </pattern>
      <rect x="220" y="70" width="560" height="380" fill="url(#graph-grid-4)" />

      {/* Formula Header (Safe at top center) */}
      <g transform="translate(350, 25)">
        <rect width="230" height="36" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <text x="115" y="24" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#dc2626" fontFamily="'JetBrains Mono', monospace">
          I(t) = (ΔV_AB / R) · e^(-t/RC)
        </text>
      </g>

      {/* Y-AXIS (Discharging Current I) */}
      <g
        id="disch-y-axis"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('disch-y-axis')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('disch-y-axis')}
        filter={isPartActive('disch-y-axis') ? 'url(#graph-glow-4)' : undefined}
      >
        <line x1="220" y1="465" x2="220" y2="70" stroke="#1e293b" strokeWidth="3" markerEnd="url(#arrow-head-axis-4)" />
        <text x="220" y="60" fontSize="16" fontWeight="bold" fill="#0f172a" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">I</text>
      </g>

      {/* X-AXIS (Time t) */}
      <g
        id="disch-x-axis"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('disch-x-axis')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('disch-x-axis')}
        filter={isPartActive('disch-x-axis') ? 'url(#graph-glow-4)' : undefined}
      >
        <line x1="205" y1="450" x2="800" y2="450" stroke="#1e293b" strokeWidth="3" markerEnd="url(#arrow-head-axis-4)" />
        <text x="815" y="455" fontSize="16" fontWeight="bold" fill="#0f172a" fontFamily="'JetBrains Mono', monospace">t</text>
      </g>

      {/* ORIGIN */}
      <circle cx="220" cy="450" r="4" fill="#1e293b" />
      <text x="205" y="468" fontSize="14" fontWeight="bold" fill="#64748b">0</text>

      {/* RAPID DECAY CURVE */}
      <g
        id="steep-decay"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('steep-decay')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('steep-decay')}
        filter={isPartActive('steep-decay') ? 'url(#graph-glow-4)' : undefined}
      >
        {/* Shaded Area under discharge curve */}
        <path
          d="M 220 140 C 240 280, 290 420, 420 445 C 500 450, 620 450, 780 450 L 220 450 Z"
          fill="#ef4444"
          opacity="0.08"
        />

        {/* Discharge curve line */}
        <path
          d={dischCurvePath}
          fill="none"
          stroke={isPartActive('steep-decay') ? '#b91c1c' : '#ef4444'}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>

      {/* Live Tracer on curve */}
      {isLiveMotion && (
        <circle r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="2" className="animate-tracer-4 pointer-events-none" />
      )}

      {/* INITIAL MAX DISCHARGE CURRENT POINT */}
      <g
        id="max-disch-i"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('max-disch-i')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('max-disch-i')}
        filter={isPartActive('max-disch-i') ? 'url(#graph-glow-4)' : undefined}
      >
        <circle cx="220" cy="140" r="6" fill="#dc2626" stroke="#ffffff" strokeWidth="2" />
        <line x1="210" y1="140" x2="230" y2="140" stroke="#dc2626" strokeWidth="2" />
      </g>

      {/* COMPLETE NEUTRALIZATION POINT: Q = 0, ΔV = 0, I = 0 */}
      <g
        id="complete-discharge-pt"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('complete-discharge-pt')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('complete-discharge-pt')}
        filter={isPartActive('complete-discharge-pt') ? 'url(#graph-glow-4)' : undefined}
      >
        <circle cx="700" cy="450" r="6" fill="#059669" stroke="#ffffff" strokeWidth="2" />
      </g>
    </g>
  );
};
