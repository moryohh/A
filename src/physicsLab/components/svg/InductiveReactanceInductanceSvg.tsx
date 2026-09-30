import React from 'react';

interface DiagramSvgProps {
  onPartHover: (id: string | null) => void;
  onPartSelect: (id: string) => void;
  selectedPartId: string | null;
  hoveredPartId: string | null;
  isLiveMotion: boolean;
}

export const InductiveReactanceInductanceSvg: React.FC<DiagramSvgProps> = ({
  onPartHover,
  onPartSelect,
  selectedPartId,
  hoveredPartId,
  isLiveMotion,
}) => {
  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  return (
    <g id="inductive-reactance-inductance-svg" className="font-['Cairo',sans-serif]">
      <defs>
        <filter id="graph-glow-6" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#dc2626" floodOpacity="0.8" />
        </filter>
        <marker id="arrow-head-axis-6" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <polygon points="0 0, 8 4, 0 8" fill="#1e293b" />
        </marker>
        <style>{`
          @keyframes moveLinearDot6 {
            0% { cx: 220px; cy: 450px; opacity: 0; }
            15% { opacity: 1; }
            85% { opacity: 1; }
            100% { cx: 700px; cy: 135px; opacity: 0; }
          }
          .animate-line-dot-6 {
            animation: moveLinearDot6 2.8s linear infinite;
          }
        `}</style>
      </defs>

      {/* Grid Pattern */}
      <pattern id="graph-grid-6" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
      </pattern>
      <rect x="220" y="70" width="560" height="380" fill="url(#graph-grid-6)" />

      {/* Header Formula Box */}
      <g transform="translate(360, 25)">
        <rect width="200" height="36" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <text x="100" y="24" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#dc2626" fontFamily="'JetBrains Mono', monospace">
          X_L = 2π · f · L
        </text>
      </g>

      {/* Y-AXIS (Inductive Reactance XL) */}
      <g
        id="xl-axis-l"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('xl-axis-l')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('xl-axis-l')}
        filter={isPartActive('xl-axis-l') ? 'url(#graph-glow-6)' : undefined}
      >
        <line x1="220" y1="465" x2="220" y2="70" stroke="#1e293b" strokeWidth="3" markerEnd="url(#arrow-head-axis-6)" />
        <text x="220" y="60" fontSize="16" fontWeight="bold" fill="#0f172a" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">X_L</text>
      </g>

      {/* X-AXIS (Self-Inductance L) */}
      <g
        id="l-axis"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('l-axis')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('l-axis')}
        filter={isPartActive('l-axis') ? 'url(#graph-glow-6)' : undefined}
      >
        <line x1="205" y1="450" x2="800" y2="450" stroke="#1e293b" strokeWidth="3" markerEnd="url(#arrow-head-axis-6)" />
        <text x="815" y="455" fontSize="16" fontWeight="bold" fill="#0f172a" fontFamily="'JetBrains Mono', monospace">L</text>
      </g>

      {/* ORIGIN (0, 0) */}
      <circle cx="220" cy="450" r="5" fill="#dc2626" />
      <text x="205" y="468" fontSize="14" fontWeight="bold" fill="#64748b">0</text>

      {/* STRAIGHT RED DIAGONAL LINE: XL ∝ L */}
      <g
        id="linear-xl-l"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('linear-xl-l')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('linear-xl-l')}
        filter={isPartActive('linear-xl-l') ? 'url(#graph-glow-6)' : undefined}
      >
        <polygon points="220,450 700,135 700,450" fill="#ef4444" opacity="0.06" />

        <line
          x1="220"
          y1="450"
          x2="700"
          y2="135"
          stroke="#dc2626"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>

      {/* Animated Red Dot */}
      {isLiveMotion && (
        <circle cx="220" cy="450" r="6" fill="#dc2626" stroke="#ffffff" strokeWidth="2" className="animate-line-dot-6 pointer-events-none" />
      )}

      {/* SLOPE ANNOTATION TRIANGLE */}
      <g
        id="slope-xl-l"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('slope-xl-l')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('slope-xl-l')}
        filter={isPartActive('slope-xl-l') ? 'url(#graph-glow-6)' : undefined}
      >
        <polygon points="520,253 640,253 640,174" fill="#fee2e2" opacity="0.4" />
        <polyline points="520,253 640,253 640,174" fill="none" stroke="#b91c1c" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="640" cy="174" r="4" fill="#b91c1c" />
      </g>

      {/* IRON CORE INSERTION EFFECT POINT */}
      <g
        id="iron-core-effect"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('iron-core-effect')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('iron-core-effect')}
        filter={isPartActive('iron-core-effect') ? 'url(#graph-glow-6)' : undefined}
      >
        <circle cx="680" cy="148" r="6" fill="#b91c1c" stroke="#ffffff" strokeWidth="2" />
      </g>

      {/* CONDITION f = CONSTANT */}
      <g
        id="condition-f-const"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('condition-f-const')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('condition-f-const')}
        filter={isPartActive('condition-f-const') ? 'url(#graph-glow-6)' : undefined}
      >
        <circle cx="600" cy="450" r="4.5" fill="#4338ca" />
      </g>
    </g>
  );
};
