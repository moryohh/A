import React from 'react';
import { DiagramPart } from '../types';

interface ChloroplastSVGProps {
  parts: DiagramPart[];
  selectedPartId: string | null;
  hoveredPartId: string | null;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string | null) => void;
  animationSpeed: number;
  showLabels: boolean;
}

export const ChloroplastSVG: React.FC<ChloroplastSVGProps> = ({
  parts,
  selectedPartId,
  hoveredPartId,
  onSelectPart,
  onHoverPart,
  showLabels,
}) => {
  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  return (
    <div className="relative w-full overflow-hidden select-none bg-slate-950/40 rounded-2xl border border-slate-800/80 p-2">
      <svg
        viewBox="0 0 1000 620"
        className="w-full h-auto max-h-[620px] drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="chloro-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="chloro-bg-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#064e3b" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#022c22" stopOpacity="0.85" />
          </linearGradient>

          <pattern id="chloro-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#334155" strokeWidth="0.5" strokeOpacity="0.25" />
          </pattern>
        </defs>

        <rect width="1000" height="620" fill="url(#chloro-grid)" />

        {/* Main Inclined Chloroplast Body matching Screenshot 2 */}
        {/* Slanted oval at -32 degrees */}
        <g transform="translate(540, 310) rotate(-32)">
          {/* Outer Membrane (غشاء خارجي) */}
          <g
            className="cursor-pointer transition-all duration-200"
            onClick={() => onSelectPart('outer-chloroplast-membrane')}
            onMouseEnter={() => onHoverPart('outer-chloroplast-membrane')}
            onMouseLeave={() => onHoverPart(null)}
            filter={isPartActive('outer-chloroplast-membrane') ? 'url(#chloro-glow)' : undefined}
          >
            <ellipse
              cx="0"
              cy="0"
              rx="290"
              ry="180"
              fill="#061a14"
              stroke={isPartActive('outer-chloroplast-membrane') ? '#38bdf8' : '#0ea5e9'}
              strokeWidth={isPartActive('outer-chloroplast-membrane') ? 7 : 5}
            />
          </g>

          {/* Intermembrane envelope buffer */}
          <ellipse
            cx="0"
            cy="0"
            rx="278"
            ry="168"
            fill="#032119"
            opacity="0.8"
          />

          {/* Inner Membrane & Stroma (غشاء داخلي والسدى) */}
          <g
            className="cursor-pointer transition-all duration-200"
            onClick={() => onSelectPart('inner-chloroplast-membrane')}
            onMouseEnter={() => onHoverPart('inner-chloroplast-membrane')}
            onMouseLeave={() => onHoverPart(null)}
            filter={isPartActive('inner-chloroplast-membrane') ? 'url(#chloro-glow)' : undefined}
          >
            <ellipse
              cx="0"
              cy="0"
              rx="268"
              ry="158"
              fill="url(#chloro-bg-grad)"
              stroke={isPartActive('inner-chloroplast-membrane') ? '#4ade80' : '#16a34a'}
              strokeWidth={isPartActive('inner-chloroplast-membrane') ? 6 : 4}
            />
          </g>

          {/* Stroma (السدى) click area */}
          <g
            className="cursor-pointer"
            onClick={() => onSelectPart('stroma')}
            onMouseEnter={() => onHoverPart('stroma')}
            onMouseLeave={() => onHoverPart(null)}
            filter={isPartActive('stroma') ? 'url(#chloro-glow)' : undefined}
          >
            {/* Stroma fluid shimmer particles */}
            <g className="animate-pulse opacity-60">
              {[-120, -40, 60, 140, -180, 190].map((px, i) => (
                <circle
                  key={`stroma-shimmer-${i}`}
                  cx={px}
                  cy={(i % 2 === 0 ? -1 : 1) * (40 + (i * 15) % 60)}
                  r="2.5"
                  fill="#5eead4"
                />
              ))}
            </g>
          </g>

          {/* Grana (الكرانا) - 3 Broad Parallel Multi-disc Ribbon Arrays stretching lengthwise across the chloroplast */}
          {/* Exactly matching Screenshot 2: Three parallel segmented tracks spanning from top to bottom */}
          <g
            className="cursor-pointer"
            onClick={() => onSelectPart('grana')}
            onMouseEnter={() => onHoverPart('grana')}
            onMouseLeave={() => onHoverPart(null)}
            filter={isPartActive('grana') ? 'url(#chloro-glow)' : undefined}
          >
            {/* Array 1 (Left Track) */}
            <g transform="translate(-110, 0)">
              {/* Continuous stroma thylakoid connecting lines */}
              <line x1="-12" y1="-120" x2="-12" y2="120" stroke="#15803d" strokeWidth="2.5" opacity="0.7" />
              <line x1="12" y1="-120" x2="12" y2="120" stroke="#15803d" strokeWidth="2.5" opacity="0.7" />

              {/* Stacked Thylakoid Grana units (أقراص متراصة) */}
              {[-100, -60, -20, 20, 60, 100].map((yStack, idx) => (
                <g key={`track1-stack-${idx}`} className="animate-gentle-pulse">
                  {/* Outer disc outline */}
                  <rect
                    x="-18"
                    y={yStack - 10}
                    width="36"
                    height="20"
                    rx="4"
                    fill="#14532d"
                    stroke={isPartActive('grana') ? '#86efac' : '#22c55e'}
                    strokeWidth={isPartActive('grana') ? 3 : 2}
                  />
                  {/* Disc internal striations (أقراص الثايلاكويد) */}
                  <line x1="-14" y1={yStack - 4} x2="14" y2={yStack - 4} stroke="#4ade80" strokeWidth="1.5" />
                  <line x1="-14" y1={yStack + 4} x2="14" y2={yStack + 4} stroke="#4ade80" strokeWidth="1.5" />
                </g>
              ))}
            </g>

            {/* Array 2 (Center Track) */}
            <g transform="translate(10, 0)">
              <line x1="-12" y1="-135" x2="-12" y2="135" stroke="#15803d" strokeWidth="2.5" opacity="0.7" />
              <line x1="12" y1="-135" x2="12" y2="135" stroke="#15803d" strokeWidth="2.5" opacity="0.7" />

              {[-115, -75, -35, 5, 45, 85, 120].map((yStack, idx) => (
                <g key={`track2-stack-${idx}`} className="animate-gentle-pulse">
                  <rect
                    x="-18"
                    y={yStack - 10}
                    width="36"
                    height="20"
                    rx="4"
                    fill="#14532d"
                    stroke={isPartActive('grana') ? '#86efac' : '#22c55e'}
                    strokeWidth={isPartActive('grana') ? 3 : 2}
                  />
                  <line x1="-14" y1={yStack - 4} x2="14" y2={yStack - 4} stroke="#4ade80" strokeWidth="1.5" />
                  <line x1="-14" y1={yStack + 4} x2="14" y2={yStack + 4} stroke="#4ade80" strokeWidth="1.5" />
                </g>
              ))}
            </g>

            {/* Array 3 (Right Track) */}
            <g transform="translate(130, 0)">
              <line x1="-12" y1="-120" x2="-12" y2="120" stroke="#15803d" strokeWidth="2.5" opacity="0.7" />
              <line x1="12" y1="-120" x2="12" y2="120" stroke="#15803d" strokeWidth="2.5" opacity="0.7" />

              {[-100, -60, -20, 20, 60, 100].map((yStack, idx) => (
                <g key={`track3-stack-${idx}`} className="animate-gentle-pulse">
                  <rect
                    x="-18"
                    y={yStack - 10}
                    width="36"
                    height="20"
                    rx="4"
                    fill="#14532d"
                    stroke={isPartActive('grana') ? '#86efac' : '#22c55e'}
                    strokeWidth={isPartActive('grana') ? 3 : 2}
                  />
                  <line x1="-14" y1={yStack - 4} x2="14" y2={yStack - 4} stroke="#4ade80" strokeWidth="1.5" />
                  <line x1="-14" y1={yStack + 4} x2="14" y2={yStack + 4} stroke="#4ade80" strokeWidth="1.5" />
                </g>
              ))}
            </g>

            {/* Connecting stroma lamellae between the 3 main tracks */}
            {[-40, 10, 50].map((yConn, i) => (
              <g key={`lamellae-${i}`} opacity="0.8">
                <line x1="-92" y1={yConn} x2="-8" y2={yConn} stroke="#22c55e" strokeWidth="2" strokeDasharray="3 2" />
                <line x1="28" y1={yConn} x2="112" y2={yConn} stroke="#22c55e" strokeWidth="2" strokeDasharray="3 2" />
              </g>
            ))}
          </g>

          {/* Starch Granules (حبيبة نشأ) - Two distinct large circular granulated bodies in pink/coral as in Screenshot 2 */}
          <g
            className="cursor-pointer"
            onClick={() => onSelectPart('starch-granule')}
            onMouseEnter={() => onHoverPart('starch-granule')}
            onMouseLeave={() => onHoverPart(null)}
            filter={isPartActive('starch-granule') ? 'url(#chloro-glow)' : undefined}
          >
            {/* Starch Granule 1 (Upper-Left between tracks) */}
            <g transform="translate(-50, -45)" className="animate-gentle-float">
              <circle
                cx="0"
                cy="0"
                r="34"
                fill="#831843"
                fillOpacity="0.45"
                stroke={isPartActive('starch-granule') ? '#f43f5e' : '#fb7185'}
                strokeWidth={isPartActive('starch-granule') ? 4 : 2.5}
              />
              {/* Internal granulated dots as in Screenshot 2 */}
              {[-16, -8, 0, 8, 16].map((xOffset) =>
                [-14, 0, 14].map((yOffset) => (
                  <circle
                    key={`dot1-${xOffset}-${yOffset}`}
                    cx={xOffset + (yOffset % 4)}
                    cy={yOffset}
                    r="1.8"
                    fill="#fecdd3"
                    className="animate-pulse"
                  />
                ))
              )}
            </g>

            {/* Starch Granule 2 (Lower-Right between tracks) */}
            <g transform="translate(70, 45)" className="animate-gentle-float">
              <circle
                cx="0"
                cy="0"
                r="30"
                fill="#831843"
                fillOpacity="0.45"
                stroke={isPartActive('starch-granule') ? '#f43f5e' : '#fb7185'}
                strokeWidth={isPartActive('starch-granule') ? 4 : 2.5}
              />
              {[-12, -4, 4, 12].map((xOffset) =>
                [-10, 0, 10].map((yOffset) => (
                  <circle
                    key={`dot2-${xOffset}-${yOffset}`}
                    cx={xOffset + (yOffset % 3)}
                    cy={yOffset}
                    r="1.8"
                    fill="#fecdd3"
                    className="animate-pulse"
                  />
                ))
              )}
            </g>
          </g>
        </g>

        {/* ULTRA-CLEAR, HIGH-CONTRAST LABELS & POINTERS */}
        {showLabels && (
          <g id="chloroplast-textbook-labels">
            {parts.map((part) => {
              const active = isPartActive(part.id);
              const { targetX, targetY, labelX, labelY, anchor = 'start' } = part.pointer;
              const isLeftColumn = anchor === 'end';
              const leaderPath = `M ${labelX} ${labelY} L ${targetX} ${targetY}`;

              return (
                <g
                  key={`chloro-callout-${part.id}`}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => onSelectPart(part.id)}
                  onMouseEnter={() => onHoverPart(part.id)}
                  onMouseLeave={() => onHoverPart(null)}
                >
                  <path
                    d={leaderPath}
                    fill="none"
                    stroke={active ? part.color : 'rgba(100, 116, 139, 0.7)'}
                    strokeWidth={active ? 3 : 1.8}
                  />

                  {/* Pinpoint Target Ring with ping effect */}
                  <circle
                    cx={targetX}
                    cy={targetY}
                    r={active ? 6 : 4}
                    fill={part.color}
                    stroke="#020617"
                    strokeWidth="2"
                  />
                  {active && (
                    <circle
                      cx={targetX}
                      cy={targetY}
                      r="12"
                      fill="none"
                      stroke={part.color}
                      strokeWidth="2"
                      opacity="0.8"
                      className="animate-ping"
                    />
                  )}

                  {/* Crisp Solid Badge */}
                  <g transform={`translate(${labelX}, ${labelY})`}>
                    <rect
                      x={isLeftColumn ? -200 : 0}
                      y="-18"
                      width="200"
                      height="36"
                      rx="10"
                      fill={active ? '#0f172a' : '#090d16'}
                      stroke={active ? part.color : 'rgba(51, 65, 85, 0.9)'}
                      strokeWidth={active ? 2.5 : 1.5}
                      className="transition-all duration-200 drop-shadow-lg"
                    />
                    <circle
                      cx={isLeftColumn ? -15 : 185}
                      cy="0"
                      r="5"
                      fill={part.color}
                    />
                    <text
                      x={isLeftColumn ? -105 : 95}
                      y="4"
                      textAnchor="middle"
                      fill={active ? '#ffffff' : '#f1f5f9'}
                      fontSize="13"
                      fontWeight="800"
                      className="select-none tracking-wide"
                    >
                      {part.nameAr}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
};
