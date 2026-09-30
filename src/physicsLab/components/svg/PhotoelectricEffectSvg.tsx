import React from 'react';

interface DiagramSvgProps {
  onPartHover: (id: string | null) => void;
  onPartSelect: (id: string) => void;
  selectedPartId: string | null;
  hoveredPartId: string | null;
  isLiveMotion: boolean;
}

export const PhotoelectricEffectSvg: React.FC<DiagramSvgProps> = ({
  onPartHover,
  onPartSelect,
  selectedPartId,
  hoveredPartId,
  isLiveMotion,
}) => {
  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  return (
    <g id="photoelectric-effect-svg" className="font-['Cairo',sans-serif]">
      <defs>
        <filter id="graph-glow-9" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0284c7" floodOpacity="0.8" />
        </filter>
        <marker id="arrow-head-axis-9" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <polygon points="0 0, 8 4, 0 8" fill="#1e293b" />
        </marker>
      </defs>

      {/* Grid Pattern */}
      <pattern id="graph-grid-9" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
      </pattern>
      <rect x="220" y="50" width="560" height="500" fill="url(#graph-grid-9)" />

      {/* Main Physics Formula Header (Top Center) */}
      <g transform="translate(350, 15)">
        <rect width="220" height="34" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
        <text x="110" y="23" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#0284c7" fontFamily="'JetBrains Mono', monospace">
          KE_max = h(f - f₀)
        </text>
      </g>

      {/* SUB-THRESHOLD NO-EMISSION REGION (f < f0) */}
      <g
        id="no-emission-zone"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('no-emission-zone')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('no-emission-zone')}
        filter={isPartActive('no-emission-zone') ? 'url(#graph-glow-9)' : undefined}
      >
        <rect x="220" y="270" width="220" height="70" fill="#fef2f2" opacity="0.4" />
      </g>

      {/* Y-AXIS (Kinetic Energy KE_max and negative -W) */}
      <g
        id="ke-axis"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('ke-axis')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('ke-axis')}
        filter={isPartActive('ke-axis') ? 'url(#graph-glow-9)' : undefined}
      >
        <line x1="220" y1="560" x2="220" y2="40" stroke="#1e293b" strokeWidth="3" markerEnd="url(#arrow-head-axis-9)" />
        <text x="220" y="32" fontSize="15" fontWeight="bold" fill="#0f172a" textAnchor="middle" fontFamily="'JetBrains Mono', monospace">KE_max</text>
      </g>

      {/* X-AXIS (Frequency f) */}
      <g
        id="freq-axis-light"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('freq-axis-light')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('freq-axis-light')}
        filter={isPartActive('freq-axis-light') ? 'url(#graph-glow-9)' : undefined}
      >
        <line x1="205" y1="340" x2="800" y2="340" stroke="#1e293b" strokeWidth="3" markerEnd="url(#arrow-head-axis-9)" />
        <text x="815" y="345" fontSize="16" fontWeight="bold" fill="#0f172a" fontFamily="'JetBrains Mono', monospace">f</text>
      </g>

      {/* ORIGIN (0, 0) */}
      <circle cx="220" cy="340" r="4" fill="#1e293b" />
      <text x="205" y="358" fontSize="13" fontWeight="bold" fill="#64748b">0</text>

      {/* DOTTED EXTENSION BELOW X-AXIS TO -W */}
      <g
        id="dotted-extension-w"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('dotted-extension-w')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('dotted-extension-w')}
        filter={isPartActive('dotted-extension-w') ? 'url(#graph-glow-9)' : undefined}
      >
        <line
          x1="220"
          y1="520"
          x2="440"
          y2="340"
          stroke={isPartActive('dotted-extension-w') ? '#dc2626' : '#64748b'}
          strokeWidth="2.5"
          strokeDasharray="6 4"
        />
      </g>

      {/* NEGATIVE Y-INTERCEPT: -W */}
      <g
        id="work-function-neg-w"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('work-function-neg-w')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('work-function-neg-w')}
        filter={isPartActive('work-function-neg-w') ? 'url(#graph-glow-9)' : undefined}
      >
        <circle cx="220" cy="520" r="6" fill="#dc2626" stroke="#ffffff" strokeWidth="2" />
        <text x="200" y="525" textAnchor="end" fontSize="15" fontWeight="bold" fill="#dc2626" fontFamily="'JetBrains Mono', monospace">
          -W
        </text>
      </g>

      {/* THRESHOLD FREQUENCY f0 POINT ON POSITIVE X-AXIS */}
      <g
        id="threshold-freq-f0"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('threshold-freq-f0')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('threshold-freq-f0')}
        filter={isPartActive('threshold-freq-f0') ? 'url(#graph-glow-9)' : undefined}
      >
        <circle cx="440" cy="340" r="6" fill="#d97706" stroke="#ffffff" strokeWidth="2" />
        <text x="440" y="365" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#d97706" fontFamily="'JetBrains Mono', monospace">
          f₀
        </text>
      </g>

      {/* SOLID LINEAR RELATION ABOVE X-AXIS */}
      <g
        id="photoelectric-line"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('photoelectric-line')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('photoelectric-line')}
        filter={isPartActive('photoelectric-line') ? 'url(#graph-glow-9)' : undefined}
      >
        <line
          x1="440"
          y1="340"
          x2="740"
          y2="90"
          stroke={isPartActive('photoelectric-line') ? '#0284c7' : '#0369a1'}
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>

      {/* SLOPE ANNOTATION TRIANGLE */}
      <g
        id="planck-slope"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('planck-slope')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('planck-slope')}
        filter={isPartActive('planck-slope') ? 'url(#graph-glow-9)' : undefined}
      >
        <polygon points="560,240 680,240 680,140" fill="#f5f3ff" opacity="0.4" />
        <polyline points="560,240 680,240 680,140" fill="none" stroke="#7c3aed" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="680" cy="140" r="4" fill="#7c3aed" />
      </g>

      {/* Live motion ping on f0 */}
      {isLiveMotion && (
        <circle cx="440" cy="340" r="12" fill="none" stroke="#f59e0b" strokeWidth="2" opacity="0.6" className="animate-ping pointer-events-none" />
      )}
    </g>
  );
};
