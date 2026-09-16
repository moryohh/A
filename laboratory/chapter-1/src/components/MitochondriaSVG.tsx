import React from 'react';
import { DiagramPart } from '../types';

interface MitochondriaSVGProps {
  parts: DiagramPart[];
  selectedPartId: string | null;
  hoveredPartId: string | null;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string | null) => void;
  animationSpeed: number;
  showLabels: boolean;
}

export const MitochondriaSVG: React.FC<MitochondriaSVGProps> = ({
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
          <filter id="mito-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="mito-bg-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#064e3b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#022c22" stopOpacity="0.8" />
          </linearGradient>

          <pattern id="mito-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#334155" strokeWidth="0.5" strokeOpacity="0.25" />
          </pattern>

          {/* Marker arrow for pointer lines */}
          <marker id="mito-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1 L 8 5 L 0 9 z" fill="#38bdf8" />
          </marker>
        </defs>

        {/* Subtle grid background */}
        <rect width="1000" height="620" fill="url(#mito-grid)" />

        {/* Main Rotated Mitochondrion Group matching Textbook Screenshot 3 */}
        {/* Slanted at -38 degrees like in the textbook */}
        <g transform="translate(500, 310) rotate(-38)">
          {/* Outer Layer / Outer Membrane (الطبقة الخارجية) */}
          <g
            className="cursor-pointer transition-all duration-300"
            onClick={() => onSelectPart('outer-membrane')}
            onMouseEnter={() => onHoverPart('outer-membrane')}
            onMouseLeave={() => onHoverPart(null)}
            filter={isPartActive('outer-membrane') ? 'url(#mito-glow)' : undefined}
          >
            <rect
              x="-330"
              y="-145"
              width="660"
              height="290"
              rx="145"
              ry="145"
              fill="#09131d"
              stroke={isPartActive('outer-membrane') ? '#38bdf8' : '#0284c7'}
              strokeWidth={isPartActive('outer-membrane') ? 7 : 5}
              className="transition-all duration-200"
            />
          </g>

          {/* Intermembrane space (الحيز بين الغشائين) with flowing H+ protons */}
          <g>
            <rect
              x="-318"
              y="-133"
              width="636"
              height="266"
              rx="133"
              ry="133"
              fill="#06222e"
              opacity="0.8"
            />
            {/* Animated Proton H+ dots flowing in intermembrane space */}
            <g className="animate-pulse-glow text-sky-400">
              {[-260, -180, -100, -20, 60, 140, 220].map((xPos, i) => (
                <circle
                  key={`proton-top-${i}`}
                  cx={xPos}
                  cy="-138"
                  r="3.5"
                  fill="#38bdf8"
                  opacity="0.85"
                />
              ))}
              {[-240, -160, -80, 0, 80, 160, 240].map((xPos, i) => (
                <circle
                  key={`proton-bottom-${i}`}
                  cx={xPos}
                  cy="138"
                  r="3.5"
                  fill="#38bdf8"
                  opacity="0.85"
                />
              ))}
            </g>
          </g>

          {/* Inner Layer / Inner Membrane & Matrix (الطبقة الداخلية والقالب) */}
          <g
            className="cursor-pointer transition-all duration-300"
            onClick={() => onSelectPart('inner-membrane')}
            onMouseEnter={() => onHoverPart('inner-membrane')}
            onMouseLeave={() => onHoverPart(null)}
            filter={isPartActive('inner-membrane') ? 'url(#mito-glow)' : undefined}
          >
            {/* Inner Membrane Envelope Outline */}
            <rect
              x="-308"
              y="-123"
              width="616"
              height="246"
              rx="123"
              ry="123"
              fill="url(#mito-bg-grad)"
              stroke={isPartActive('inner-membrane') ? '#fb923c' : '#ea580c'}
              strokeWidth={isPartActive('inner-membrane') ? 6 : 4}
            />
          </g>

          {/* Cristae Folds (الأعراف) extending inward from opposite sides */}
          <g
            className="cursor-pointer"
            onClick={() => onSelectPart('cristae')}
            onMouseEnter={() => onHoverPart('cristae')}
            onMouseLeave={() => onHoverPart(null)}
            filter={isPartActive('cristae') ? 'url(#mito-glow)' : undefined}
          >
            {/* Upper Cristae projecting downward */}
            {/* Crista 1 (Far Left) */}
            <path
              d="M -220 -123 L -220 -30 Q -205 0 -190 -30 L -190 -123"
              fill="#09131d"
              stroke={isPartActive('cristae') ? '#ec4899' : '#f97316'}
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Crista 2 (Upper Middle Left) */}
            <path
              d="M -130 -123 L -130 15 Q -115 45 -100 15 L -100 -123"
              fill="#09131d"
              stroke={isPartActive('cristae') ? '#ec4899' : '#f97316'}
              strokeWidth="4"
              strokeLinejoin="round"
            />

            {/* Crista 3 (The Textbook Highlighted Dotted Crista with ATP Synthase!) */}
            <g
              className="cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                onSelectPart('atp-synthase');
              }}
              onMouseEnter={() => onHoverPart('atp-synthase')}
              onMouseLeave={() => onHoverPart(null)}
            >
              <path
                d="M -20 -123 L -20 45 Q -5 75 10 45 L 10 -123"
                fill="#0c1d1a"
                stroke={isPartActive('atp-synthase') || isPartActive('cristae') ? '#c084fc' : '#f97316'}
                strokeWidth="4.5"
                strokeLinejoin="round"
              />
              {/* Dense dots/spheres on both sides of this crista - exactly like Screenshot 3! */}
              {[-100, -80, -60, -40, -20, 0, 20, 35].map((yVal, idx) => (
                <g key={`atp-dot-left-${idx}`} className="animate-pulse">
                  <circle
                    cx="-28"
                    cy={yVal}
                    r="3.5"
                    fill={isPartActive('atp-synthase') ? '#f43f5e' : '#c084fc'}
                    stroke="#581c87"
                    strokeWidth="1"
                  />
                  <line x1="-20" y1={yVal} x2="-25" y2={yVal} stroke="#c084fc" strokeWidth="1.5" />
                </g>
              ))}
              {[-100, -80, -60, -40, -20, 0, 20, 35].map((yVal, idx) => (
                <g key={`atp-dot-right-${idx}`} className="animate-pulse">
                  <circle
                    cx="18"
                    cy={yVal}
                    r="3.5"
                    fill={isPartActive('atp-synthase') ? '#f43f5e' : '#c084fc'}
                    stroke="#581c87"
                    strokeWidth="1"
                  />
                  <line x1="10" y1={yVal} x2="15" y2={yVal} stroke="#c084fc" strokeWidth="1.5" />
                </g>
              ))}
            </g>

            {/* Crista 4 (Upper Right) */}
            <path
              d="M 90 -123 L 90 -10 Q 105 20 120 -10 L 120 -123"
              fill="#09131d"
              stroke={isPartActive('cristae') ? '#ec4899' : '#f97316'}
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Crista 5 (Far Right) */}
            <path
              d="M 190 -123 L 190 -45 Q 205 -15 220 -45 L 220 -123"
              fill="#09131d"
              stroke={isPartActive('cristae') ? '#ec4899' : '#f97316'}
              strokeWidth="4"
              strokeLinejoin="round"
            />

            {/* Lower Cristae projecting upward */}
            {/* Lower Crista 1 (Left) */}
            <path
              d="M -160 123 L -160 30 Q -145 0 -130 30 L -130 123"
              fill="#09131d"
              stroke={isPartActive('cristae') ? '#ec4899' : '#f97316'}
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Lower Crista 2 (Center) */}
            <path
              d="M -70 123 L -70 -20 Q -55 -50 -40 -20 L -40 123"
              fill="#09131d"
              stroke={isPartActive('cristae') ? '#ec4899' : '#f97316'}
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Lower Crista 3 (Right) */}
            <path
              d="M 40 123 L 40 -10 Q 55 -40 70 -10 L 70 123"
              fill="#09131d"
              stroke={isPartActive('cristae') ? '#ec4899' : '#f97316'}
              strokeWidth="4"
              strokeLinejoin="round"
            />
            {/* Lower Crista 4 (Far Right) */}
            <path
              d="M 140 123 L 140 25 Q 155 -5 170 25 L 170 123"
              fill="#09131d"
              stroke={isPartActive('cristae') ? '#ec4899' : '#f97316'}
              strokeWidth="4"
              strokeLinejoin="round"
            />
          </g>

          {/* Matrix & Granules (القالب / الحشوة وحبيبات القالب) */}
          <g
            className="cursor-pointer"
            onClick={() => onSelectPart('matrix')}
            onMouseEnter={() => onHoverPart('matrix')}
            onMouseLeave={() => onHoverPart(null)}
          >
            {/* Circular rings and dots in Matrix (حبيبات القالب) as shown in textbook */}
            <g
              onClick={(e) => {
                e.stopPropagation();
                onSelectPart('mtdna-ribosomes');
              }}
              onMouseEnter={() => onHoverPart('mtdna-ribosomes')}
              onMouseLeave={() => onHoverPart(null)}
              className="cursor-pointer"
            >
              {[
                { x: -240, y: 30, r: 8 },
                { x: -160, y: -45, r: 7 },
                { x: -60, y: 70, r: 9 },
                { x: 50, y: -70, r: 8 },
                { x: 150, y: 65, r: 7 },
                { x: 230, y: -30, r: 9 }
              ].map((ring, idx) => (
                <g key={`matrix-ring-${idx}`} className="animate-gentle-float">
                  <circle
                    cx={ring.x}
                    cy={ring.y}
                    r={ring.r}
                    fill="none"
                    stroke={isPartActive('mtdna-ribosomes') ? '#fde047' : '#10b981'}
                    strokeWidth="2.5"
                    strokeDasharray={idx % 2 === 0 ? '4 2' : 'none'}
                  />
                  <circle
                    cx={ring.x}
                    cy={ring.y}
                    r="2.5"
                    fill={isPartActive('mtdna-ribosomes') ? '#f59e0b' : '#34d399'}
                  />
                </g>
              ))}

              {/* Small Ribosome dots */}
              {[
                { x: -200, y: 70 },
                { x: -90, y: -60 },
                { x: 80, y: 60 },
                { x: 120, y: -50 },
                { x: 200, y: 40 }
              ].map((dot, idx) => (
                <circle
                  key={`m-dot-${idx}`}
                  cx={dot.x}
                  cy={dot.y}
                  r="3.5"
                  fill="#facc15"
                  className="animate-pulse"
                />
              ))}
            </g>
          </g>
        </g>

        {/* ULTRA-CLEAR, HIGH-CONTRAST LABELS & POINTERS */}
        {showLabels && (
          <g id="mitochondria-textbook-labels">
            {parts.map((part) => {
              const active = isPartActive(part.id);
              const { targetX, targetY, labelX, labelY, anchor = 'start' } = part.pointer;
              const isLeftColumn = anchor === 'end';

              // Clean leader line: label -> target with smooth direct connection
              const leaderPath = `M ${labelX} ${labelY} L ${targetX} ${targetY}`;

              return (
                <g
                  key={`mito-callout-${part.id}`}
                  className="cursor-pointer transition-all duration-200"
                  onClick={() => onSelectPart(part.id)}
                  onMouseEnter={() => onHoverPart(part.id)}
                  onMouseLeave={() => onHoverPart(null)}
                >
                  {/* Glowing line when active, crisp solid line when idle */}
                  <path
                    d={leaderPath}
                    fill="none"
                    stroke={active ? part.color : 'rgba(100, 116, 139, 0.7)'}
                    strokeWidth={active ? 3 : 1.8}
                  />

                  {/* Pinpoint Target Ring with ping animation when active */}
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

                  {/* High-Contrast Crisp Label Card */}
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
                    {/* Glowing color dot indicator */}
                    <circle
                      cx={isLeftColumn ? -15 : 185}
                      cy="0"
                      r="5"
                      fill={part.color}
                    />
                    {/* Arabic Primary Label (Big, Bold, Crisp) */}
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
