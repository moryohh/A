import React from 'react';

interface DiagramSvgProps {
  onPartHover: (id: string | null) => void;
  onPartSelect: (id: string) => void;
  selectedPartId: string | null;
  hoveredPartId: string | null;
  isLiveMotion: boolean;
}

export const InductiveReactanceFreqSvg: React.FC<DiagramSvgProps> = ({
  onPartHover,
  onPartSelect,
  selectedPartId,
  hoveredPartId,
  isLiveMotion,
}) => {
  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  return (
    <g id="inductive-reactance-freq-svg" className="font-['Cairo',sans-serif]">
      <defs>
        <filter id="graph-glow-5" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0284c7" floodOpacity="0.8" />
        </filter>
        <marker id="arrow-head-axis-5" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <polygon points="0 0, 8 4, 0 8" fill="#1e293b" />
        </marker>
        <style>{`
          @keyframes moveLinearDot {
            0% { cx: 220px; cy: 450px; opacity: 0; }
            15% { opacity: 1; }
            85% { opacity: 1; }
            100% { cx: 700px; cy: 135px; opacity: 0; }
          }
          .animate-line-dot-5 {
            animation: moveLinearDot 2.8s linear infinite;
          }
        `}</style>
      </defs>

      {/* Grid Pattern */}
      <pattern id="graph-grid-5" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
      </pattern>
      <rect x="220" y="70" width="560" height="380" fill="url(#graph-grid-5)" />

      {/* Title Formula Header (Safe at top center) */}
      <g transform="translate(360, 25)">
        <rect width="200" height="36" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <text x="100" y="24" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#0f172a" fontFamily="'JetBrains Mono', monospace">
          X_L = 2π · f · L
        </text>
      </g>

      {/* Y-AXIS (Inductive Reactance XL) */}
      <g
        id="xl-axis"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('xl-axis')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('xl-axis')}
        filter={isPartActive('xl-axis') ? 'url(#graph-glow-5)' : undefined}
      >
        <line x1="220" y1="465" x2="220" y2="70" stroke="#1e293b" strokeWidth="3" markerEnd="url(#arrow-head-axis-5)" />
        <text x="220" y="60" fontSize="16" fontWeight="bold" fill="#0f172a" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">X_L</text>
      </g>

      {/* X-AXIS (Frequency f) */}
      <g
        id="f-axis"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('f-axis')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('f-axis')}
        filter={isPartActive('f-axis') ? 'url(#graph-glow-5)' : undefined}
      >
        <line x1="205" y1="450" x2="800" y2="450" stroke="#1e293b" strokeWidth="3" markerEnd="url(#arrow-head-axis-5)" />
        <text x="815" y="455" fontSize="16" fontWeight="bold" fill="#0f172a" fontFamily="'JetBrains Mono', monospace">f</text>
      </g>

      {/* ORIGIN (0, 0) */}
      <g
        id="origin-xl-f"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('origin-xl-f')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('origin-xl-f')}
        filter={isPartActive('origin-xl-f') ? 'url(#graph-glow-5)' : undefined}
      >
        <circle cx="220" cy="450" r="5" fill="#16a34a" />
        <text x="205" y="468" fontSize="14" fontWeight="bold" fill="#64748b">0</text>
      </g>

      {/* LINEAR DIRECT PROPORTIONALITY LINE: XL ∝ f */}
      <g
        id="linear-xl-f"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('linear-xl-f')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('linear-xl-f')}
        filter={isPartActive('linear-xl-f') ? 'url(#graph-glow-5)' : undefined}
      >
        {/* Soft shaded area */}
        <polygon points="220,450 700,135 700,450" fill="#0284c7" opacity="0.06" />

        {/* Straight Diagonal Line */}
        <line
          x1="220"
          y1="450"
          x2="700"
          y2="135"
          stroke={isPartActive('linear-xl-f') ? '#0284c7' : '#0369a1'}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>

      {/* Live motion dot running along line */}
      {isLiveMotion && (
        <circle cx="220" cy="450" r="6" fill="#0284c7" stroke="#ffffff" strokeWidth="2" className="animate-line-dot-5 pointer-events-none" />
      )}

      {/* SLOPE TRIANGLE (Clean, without overlapping text box) */}
      <g
        id="slope-xl-f"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('slope-xl-f')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('slope-xl-f')}
        filter={isPartActive('slope-xl-f') ? 'url(#graph-glow-5)' : undefined}
      >
        <polygon points="520,253 640,253 640,174" fill="#fef3c7" opacity="0.3" />
        <polyline points="520,253 640,253 640,174" fill="none" stroke="#d97706" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="640" cy="174" r="4" fill="#d97706" />
      </g>

      {/* CONDITION L = CONSTANT TARGET */}
      <g
        id="condition-l-const"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('condition-l-const')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('condition-l-const')}
        filter={isPartActive('condition-l-const') ? 'url(#graph-glow-5)' : undefined}
      >
        <circle cx="600" cy="450" r="4.5" fill="#4338ca" />
      </g>
    </g>
  );
};
