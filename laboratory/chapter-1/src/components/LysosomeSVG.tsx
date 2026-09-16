import React from 'react';
import { DiagramPart } from '../types';

interface LysosomeSVGProps {
  parts: DiagramPart[];
  selectedPartId: string | null;
  hoveredPartId: string | null;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string | null) => void;
  animationSpeed: number;
  showLabels: boolean;
}

export const LysosomeSVG: React.FC<LysosomeSVGProps> = ({
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
          <filter id="lyso-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <pattern id="lyso-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#334155" strokeWidth="0.5" strokeOpacity="0.25" />
          </pattern>

          <linearGradient id="cyto-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#081e2b" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#05101a" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="nucleus-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>

        <rect width="1000" height="620" fill="url(#lyso-grid)" />

        {/* Cytoplasmic boundary interior */}
        <path
          d="M 200 130 C 350 110, 650 110, 800 130 L 820 600 L 180 600 Z"
          fill="url(#cyto-bg)"
        />

        {/* 1. CYTOSKELETON FILAMENTS (خيوط دقيقة وأنيبيبات) - diagonal blue fibers across cytoplasm */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectPart('cytoskeleton')}
          onMouseEnter={() => onHoverPart('cytoskeleton')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('cytoskeleton') ? 'url(#lyso-glow)' : undefined}
        >
          {[
            'M 240 180 Q 280 270 330 380',
            'M 290 160 Q 320 280 400 420',
            'M 370 170 Q 430 300 480 450',
            'M 470 160 Q 510 260 550 430',
            'M 580 150 Q 640 280 670 430',
            'M 680 160 Q 730 260 760 380'
          ].map((dStr, idx) => (
            <path
              key={`cyto-fiber-${idx}`}
              d={dStr}
              fill="none"
              stroke={isPartActive('cytoskeleton') ? '#60a5fa' : '#1e3a8a'}
              strokeWidth={isPartActive('cytoskeleton') ? 3 : 1.8}
              strokeDasharray="6 4"
              opacity="0.65"
            />
          ))}
        </g>

        {/* 2. PLASMA MEMBRANE (غشاء بلازمي) across the upper contour */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectPart('plasma-membrane')}
          onMouseEnter={() => onHoverPart('plasma-membrane')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('plasma-membrane') ? 'url(#lyso-glow)' : undefined}
        >
          {/* Main Top Cell Membrane Arch */}
          <path
            d="M 180 145 C 320 120, 680 120, 820 145"
            fill="none"
            stroke={isPartActive('plasma-membrane') ? '#38bdf8' : '#0284c7'}
            strokeWidth={isPartActive('plasma-membrane') ? 8 : 6}
            strokeLinecap="round"
          />
          <path
            d="M 180 152 C 320 127, 680 127, 820 152"
            fill="none"
            stroke={isPartActive('plasma-membrane') ? '#0284c7' : '#0369a1'}
            strokeWidth="3"
            opacity="0.7"
          />
        </g>

        {/* 3. PROTEIN SECRETION (إفراز البروتين) - Top Right */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectPart('protein-secretion')}
          onMouseEnter={() => onHoverPart('protein-secretion')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('protein-secretion') ? 'url(#lyso-glow)' : undefined}
        >
          {/* Secretory Vesicle fusing with plasma membrane */}
          <path
            d="M 625 130 C 625 155, 655 155, 655 130"
            fill="#0369a1"
            stroke={isPartActive('protein-secretion') ? '#38bdf8' : '#0284c7'}
            strokeWidth="3.5"
          />
          {/* Secretory Vesicle below just about to fuse */}
          <circle
            cx="640"
            cy="180"
            r="16"
            fill="#075985"
            stroke={isPartActive('protein-secretion') ? '#38bdf8' : '#0284c7'}
            strokeWidth="3"
          />
          {/* Inside vesicle protein dots */}
          <circle cx="636" cy="177" r="2.5" fill="#bae6fd" />
          <circle cx="644" cy="182" r="2.5" fill="#bae6fd" />

          {/* Animated expelled protein granules streaming upwards into extracellular space */}
          <g className="animate-secretion-move">
            <circle cx="632" cy="115" r="3.5" fill="#38bdf8" />
            <circle cx="642" cy="100" r="4" fill="#7dd3fc" />
            <circle cx="648" cy="85" r="3.5" fill="#bae6fd" />
            <circle cx="636" cy="72" r="3" fill="#e0f2fe" />
            <circle cx="645" cy="58" r="2.5" fill="#f0f9ff" />
          </g>
        </g>

        {/* 4. WASTE EXCRETION (إخراج الفضلات) - Top Left */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectPart('waste-excretion')}
          onMouseEnter={() => onHoverPart('waste-excretion')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('waste-excretion') ? 'url(#lyso-glow)' : undefined}
        >
          {/* Residual body fusing with the membrane and expelling debris */}
          <path
            d="M 330 134 C 330 162, 365 162, 365 134"
            fill="#450a0a"
            stroke={isPartActive('waste-excretion') ? '#f43f5e' : '#e11d48'}
            strokeWidth="3.5"
          />
          {/* Residual body moving towards membrane */}
          <g transform="translate(340, 195)">
            <circle
              cx="0"
              cy="0"
              r="17"
              fill="#500724"
              stroke={isPartActive('waste-excretion') ? '#f43f5e' : '#be123c'}
              strokeWidth="3"
            />
            {/* Irregular waste debris dots inside */}
            <circle cx="-5" cy="-4" r="3" fill="#fda4af" />
            <circle cx="4" cy="3" r="3.5" fill="#f43f5e" />
            <circle cx="-2" cy="6" r="2.5" fill="#fb7185" />
          </g>

          {/* Animated expelled waste debris bursting out */}
          <g className="animate-excretion-move">
            <rect x="340" y="112" width="4" height="4" fill="#f43f5e" rx="1" />
            <circle cx="352" cy="98" r="3.5" fill="#fb7185" />
            <rect x="334" y="85" width="5" height="5" fill="#f43f5e" rx="1" />
            <circle cx="348" cy="70" r="3" fill="#fda4af" />
            <circle cx="340" cy="55" r="2.5" fill="#ffe4e6" />
          </g>
        </g>

        {/* 5. NUCLEUS (النواة) at the bottom */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectPart('nucleus')}
          onMouseEnter={() => onHoverPart('nucleus')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('nucleus') ? 'url(#lyso-glow)' : undefined}
        >
          {/* Large Nuclear Envelope Arch */}
          <path
            d="M 350 610 C 370 510, 630 510, 650 610"
            fill="url(#nucleus-grad)"
            stroke={isPartActive('nucleus') ? '#94a3b8' : '#475569'}
            strokeWidth={isPartActive('nucleus') ? 6 : 4.5}
          />
          {/* Double membrane inner outline */}
          <path
            d="M 365 610 C 385 525, 615 525, 635 610"
            fill="none"
            stroke="#334155"
            strokeWidth="3"
            strokeDasharray="16 6"
          />
          {/* Chromatin fibers */}
          <path
            d="M 430 580 Q 500 550 570 580"
            fill="none"
            stroke="#64748b"
            strokeWidth="2.5"
            strokeDasharray="4 3"
          />
          <text
            x="500"
            y="585"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="14"
            fontWeight="bold"
            className="select-none"
          >
            النواة
          </text>
        </g>

        {/* 6. ROUGH ENDOPLASMIC RETICULUM (الشبكة البلازمية الداخلية) */}
        {/* Connected to nuclear envelope on the right, folded cisternae with ribosomes */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectPart('endoplasmic-reticulum')}
          onMouseEnter={() => onHoverPart('endoplasmic-reticulum')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('endoplasmic-reticulum') ? 'url(#lyso-glow)' : undefined}
        >
          {/* Fold 1 */}
          <path
            d="M 580 500 C 640 470, 710 470, 740 430"
            fill="none"
            stroke={isPartActive('endoplasmic-reticulum') ? '#22d3ee' : '#0891b2'}
            strokeWidth="5"
          />
          {/* Fold 2 */}
          <path
            d="M 595 480 C 655 450, 720 450, 755 410"
            fill="none"
            stroke={isPartActive('endoplasmic-reticulum') ? '#22d3ee' : '#0891b2'}
            strokeWidth="5"
          />
          {/* Fold 3 */}
          <path
            d="M 610 460 C 670 430, 735 430, 765 390"
            fill="none"
            stroke={isPartActive('endoplasmic-reticulum') ? '#22d3ee' : '#0891b2'}
            strokeWidth="5"
          />

          {/* Studded Ribosomes on RER */}
          {[
            { x: 610, y: 495 }, { x: 640, y: 480 }, { x: 670, y: 470 }, { x: 700, y: 460 }, { x: 725, y: 445 },
            { x: 625, y: 475 }, { x: 655, y: 460 }, { x: 685, y: 450 }, { x: 715, y: 440 }, { x: 740, y: 420 },
            { x: 640, y: 455 }, { x: 670, y: 440 }, { x: 700, y: 430 }, { x: 730, y: 415 }, { x: 755, y: 400 }
          ].map((ribo, idx) => (
            <circle
              key={`rer-ribo-${idx}`}
              cx={ribo.x}
              cy={ribo.y}
              r="2.8"
              fill="#facc15"
              className="animate-pulse"
            />
          ))}

          {/* Transport vesicle from ER heading to Golgi */}
          <circle
            cx="750"
            cy="365"
            r="10"
            fill="#164e63"
            stroke="#22d3ee"
            strokeWidth="2.5"
            className="animate-pulse"
          />
        </g>

        {/* 7. GOLGI APPARATUS (جهاز كولجي) */}
        {/* Curved purple cisternae above the ER, budding vesicles */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectPart('golgi-apparatus')}
          onMouseEnter={() => onHoverPart('golgi-apparatus')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('golgi-apparatus') ? 'url(#lyso-glow)' : undefined}
        >
          {/* Cisterna 1 (Cis-face) */}
          <path
            d="M 680 340 C 720 330, 755 330, 785 350"
            fill="none"
            stroke={isPartActive('golgi-apparatus') ? '#c084fc' : '#9333ea'}
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Cisterna 2 */}
          <path
            d="M 670 315 C 715 305, 755 305, 785 325"
            fill="none"
            stroke={isPartActive('golgi-apparatus') ? '#c084fc' : '#9333ea'}
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Cisterna 3 */}
          <path
            d="M 660 290 C 710 275, 750 275, 785 295"
            fill="none"
            stroke={isPartActive('golgi-apparatus') ? '#c084fc' : '#9333ea'}
            strokeWidth="7"
            strokeLinecap="round"
          />
          {/* Cisterna 4 (Trans-face) */}
          <path
            d="M 650 265 C 700 248, 745 248, 780 270"
            fill="none"
            stroke={isPartActive('golgi-apparatus') ? '#c084fc' : '#9333ea'}
            strokeWidth="7"
            strokeLinecap="round"
          />

          {/* Budding Golgi vesicles */}
          <circle
            cx="635"
            cy="260"
            r="11"
            fill="#581c87"
            stroke={isPartActive('golgi-apparatus') ? '#e9d5ff' : '#c084fc'}
            strokeWidth="2.5"
            className="animate-pulse"
          />
          <circle
            cx="795"
            cy="275"
            r="9"
            fill="#581c87"
            stroke={isPartActive('golgi-apparatus') ? '#e9d5ff' : '#c084fc'}
            strokeWidth="2.5"
            className="animate-pulse"
          />
        </g>

        {/* 8. PRIMARY LYSOSOME (جسيم حال) */}
        {/* Yellow/amber spherical vesicle with hydrolytic enzymes budding from Golgi */}
        <g
          className="cursor-pointer transition-transform duration-300"
          onClick={() => onSelectPart('primary-lysosome')}
          onMouseEnter={() => onHoverPart('primary-lysosome')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('primary-lysosome') ? 'url(#lyso-glow)' : undefined}
          transform="translate(490, 310)"
        >
          <circle
            cx="0"
            cy="0"
            r="28"
            fill="#713f12"
            fillOpacity="0.75"
            stroke={isPartActive('primary-lysosome') ? '#facc15' : '#eab308'}
            strokeWidth={isPartActive('primary-lysosome') ? 4.5 : 3}
            className="animate-gentle-pulse"
          />
          {/* Fine hydrolytic enzyme dots */}
          {[-12, -4, 4, 12].map((ox) =>
            [-10, 0, 10].map((oy) => (
              <circle
                key={`enzyme-${ox}-${oy}`}
                cx={ox + (oy % 4)}
                cy={oy}
                r="2"
                fill="#fde047"
                className="animate-pulse"
              />
            ))
          )}
        </g>

        {/* 9. FOOD VACUOLE (فجوة غذائية) - Formed by endocytosis on the left */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectPart('food-vacuole')}
          onMouseEnter={() => onHoverPart('food-vacuole')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('food-vacuole') ? 'url(#lyso-glow)' : undefined}
          transform="translate(270, 360)"
        >
          {/* Invaginating entry at membrane */}
          <circle
            cx="0"
            cy="0"
            r="27"
            fill="#7c2d12"
            fillOpacity="0.7"
            stroke={isPartActive('food-vacuole') ? '#fb923c' : '#ea580c'}
            strokeWidth={isPartActive('food-vacuole') ? 4 : 3}
          />
          {/* Engulfed nutrient food particles inside */}
          <polygon points="-8,-6 -2,-12 6,-8 2,-2 -6,2" fill="#fed7aa" />
          <polygon points="2,2 10,0 8,8 0,8" fill="#fdba74" />
          <circle cx="-5" cy="8" r="3" fill="#ffedd5" />
        </g>

        {/* 10. SECONDARY LYSOSOME / DIGESTION (اتحاد الجسيم الحال مع الفجوة الغذائية) */}
        {/* Phagolysosome active digestion state */}
        <g
          className="cursor-pointer"
          onClick={() => onSelectPart('digestive-vacuole')}
          onMouseEnter={() => onHoverPart('digestive-vacuole')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('digestive-vacuole') ? 'url(#lyso-glow)' : undefined}
          transform="translate(360, 290)"
        >
          {/* Merging double envelope */}
          <path
            d="M -30 -10 C -30 -30, 0 -35, 20 -20 C 35 -5, 30 25, 10 32 C -15 38, -30 20, -30 -10 Z"
            fill="#831843"
            fillOpacity="0.75"
            stroke={isPartActive('digestive-vacuole') ? '#f43f5e' : '#e11d48'}
            strokeWidth={isPartActive('digestive-vacuole') ? 4.5 : 3.2}
            className="animate-digest-merge"
          />
          {/* Active digestive swirl particles */}
          <circle cx="-10" cy="-6" r="4" fill="#fde047" className="animate-pulse" />
          <circle cx="8" cy="8" r="3.5" fill="#f43f5e" className="animate-pulse" />
          <circle cx="-4" cy="14" r="3" fill="#fed7aa" className="animate-pulse" />
          <circle cx="12" cy="-10" r="3" fill="#fecdd3" className="animate-pulse" />
        </g>

        {/* Dynamic arrows showing vesicular transport flow matching textbook diagram */}
        <g opacity="0.65" stroke="#38bdf8" strokeWidth="2" fill="none">
          {/* Endocytosis arrow down to food vacuole */}
          <path d="M 230 165 Q 245 230 260 325" strokeDasharray="4 3" />
          {/* Food vacuole merging into digestive vacuole */}
          <path d="M 295 340 Q 320 320 340 305" strokeDasharray="4 3" />
          {/* Primary lysosome heading to merge */}
          <path d="M 460 305 L 395 295" strokeDasharray="4 3" />
          {/* Digestive vacuole to waste body */}
          <path d="M 355 260 L 345 220" strokeDasharray="4 3" />
          {/* Golgi to lysosome */}
          <path d="M 640 275 Q 560 285 520 300" strokeDasharray="4 3" />
        </g>

        {/* ULTRA-CLEAR, HIGH-CONTRAST LABELS & POINTERS */}
        {showLabels && (
          <g id="lysosome-textbook-labels">
            {parts.map((part) => {
              const active = isPartActive(part.id);
              const { targetX, targetY, labelX, labelY, anchor = 'start' } = part.pointer;
              const isLeftColumn = anchor === 'end';
              const leaderPath = `M ${labelX} ${labelY} L ${targetX} ${targetY}`;

              return (
                <g
                  key={`lyso-callout-${part.id}`}
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

                  {/* Pinpoint Target Ring with ping */}
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
                      x={isLeftColumn ? -220 : 0}
                      y="-18"
                      width="220"
                      height="36"
                      rx="10"
                      fill={active ? '#0f172a' : '#090d16'}
                      stroke={active ? part.color : 'rgba(51, 65, 85, 0.9)'}
                      strokeWidth={active ? 2.5 : 1.5}
                      className="transition-all duration-200 drop-shadow-lg"
                    />
                    <circle
                      cx={isLeftColumn ? -15 : 205}
                      cy="0"
                      r="5"
                      fill={part.color}
                    />
                    <text
                      x={isLeftColumn ? -115 : 105}
                      y="4"
                      textAnchor="middle"
                      fill={active ? '#ffffff' : '#f1f5f9'}
                      fontSize="12.5"
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
