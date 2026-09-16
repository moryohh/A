import React from 'react';
import { DiagramPart } from '../types';

interface PlantAnimalCellSVGProps {
  parts: DiagramPart[];
  selectedPartId: string | null;
  hoveredPartId: string | null;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string | null) => void;
  showLabels?: boolean;
}

export const PlantAnimalCellSVG: React.FC<PlantAnimalCellSVGProps> = ({
  parts,
  selectedPartId,
  hoveredPartId,
  onSelectPart,
  onHoverPart,
  showLabels = true,
}) => {
  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  return (
    <div className="relative w-full overflow-hidden select-none flex flex-col items-center">
      <svg
        viewBox="0 0 1000 600"
        className="w-full h-auto max-h-[600px] drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="glow-plant-animal" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Vacuole gradient */}
          <radialGradient id="vacuole-grad" cx="45%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#0284c7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#075985" stopOpacity="0.95" />
          </radialGradient>

          {/* Plant cytoplasm */}
          <radialGradient id="plant-cyto-grad" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#064e3b" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#022c22" stopOpacity="0.8" />
          </radialGradient>

          {/* Animal cytoplasm */}
          <radialGradient id="animal-cyto-grad" cx="45%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.85" />
          </radialGradient>
        </defs>

        {/* Ambient Dark Field */}
        <rect width="1000" height="600" fill="#030712" rx="20" />

        {/* Dividing Subtle Center Dashed Marker */}
        <line x1="500" y1="40" x2="500" y2="560" stroke="#334155" strokeWidth="1.5" strokeDasharray="6 6" />
        <text x="250" y="45" textAnchor="middle" fill="#93c5fd" fontSize="14" fontWeight="bold">
          الخلية الحيوانية (Animal Cell)
        </text>
        <text x="750" y="45" textAnchor="middle" fill="#86efac" fontSize="14" fontWeight="bold">
          الخلية النباتية (Plant Cell)
        </text>

        {/* =========================================================
            LEFT: ANIMAL CELL (Organic, flexible, non-geometric)
           ========================================================= */}
        <g className="animate-organic-breathe" transform-origin="250 310">
          {/* Animal Cell Plasma Membrane - Natural Living Undulating Curve */}
          <path
            id="animal-membrane-path"
            d="M 230 110 
               C 340 105, 410 160, 420 240 
               C 430 320, 390 410, 360 470 
               C 330 520, 220 530, 160 490 
               C 90 440, 70 340, 80 250 
               C 90 160, 150 115, 230 110 Z"
            fill="url(#animal-cyto-grad)"
            stroke={isPartActive('animal-membrane') ? '#fb7185' : '#e11d48'}
            strokeWidth={isPartActive('animal-membrane') ? 4 : 2}
            filter={isPartActive('animal-membrane') ? 'url(#glow-plant-animal)' : undefined}
            className="cursor-pointer"
            onClick={() => onSelectPart('animal-membrane')}
            onMouseEnter={() => onHoverPart('animal-membrane')}
            onMouseLeave={() => onHoverPart(null)}
          />

          {/* Animal Nucleus & Nucleolus */}
          <g
            className="cursor-pointer"
            onClick={() => onSelectPart('cell-nucleus')}
            onMouseEnter={() => onHoverPart('cell-nucleus')}
            onMouseLeave={() => onHoverPart(null)}
          >
            {/* Organic nuclear envelope */}
            <path
              d="M 230 270 C 280 265, 305 295, 300 345 C 295 390, 260 415, 220 410 C 175 405, 155 365, 165 320 C 175 280, 200 272, 230 270 Z"
              fill="#581c87"
              fillOpacity="0.7"
              stroke={isPartActive('cell-nucleus') ? '#e9d5ff' : '#a855f7'}
              strokeWidth={isPartActive('cell-nucleus') ? 3 : 1.5}
            />
            {/* Nucleolus */}
            <circle cx="235" cy="340" r="16" fill="#f43f5e" opacity="0.9" />
            {/* Chromatin coils */}
            <path d="M 190 310 Q 215 325 210 360 M 255 315 Q 275 350 250 380" stroke="#d8b4fe" strokeWidth="1.5" fill="none" opacity="0.6" />
          </g>

          {/* Centrosome & Centrioles (الجسيم المركزي - حيوانية فقط) */}
          <g
            className="cursor-pointer transition-transform duration-300 hover:scale-110"
            onClick={() => onSelectPart('animal-centrosome')}
            onMouseEnter={() => onHoverPart('animal-centrosome')}
            onMouseLeave={() => onHoverPart(null)}
          >
            <rect
              x="265"
              y="225"
              width="14"
              height="28"
              rx="3"
              fill="#f59e0b"
              stroke={isPartActive('animal-centrosome') ? '#ffffff' : '#b45309'}
              strokeWidth={isPartActive('animal-centrosome') ? 2.5 : 1}
              transform="rotate(25 272 239)"
            />
            <rect
              x="250"
              y="235"
              width="14"
              height="28"
              rx="3"
              fill="#fbbf24"
              stroke={isPartActive('animal-centrosome') ? '#ffffff' : '#b45309'}
              strokeWidth={isPartActive('animal-centrosome') ? 2.5 : 1}
              transform="rotate(115 257 249)"
            />
            {/* Microtubule rays */}
            <g stroke="#fef08a" strokeWidth="1" opacity="0.6">
              <line x1="260" y1="215" x2="260" y2="200" />
              <line x1="285" y1="230" x2="300" y2="225" />
              <line x1="240" y1="250" x2="225" y2="260" />
            </g>
          </g>

          {/* Mitochondria in animal cell */}
          <g transform="translate(130, 420) rotate(-20)">
            <ellipse cx="25" cy="15" rx="28" ry="14" fill="#991b1b" stroke="#f87171" strokeWidth="1.2" />
            <path d="M 8 15 Q 18 8 20 22 Q 30 8 32 22 Q 40 8 42 18" stroke="#fca5a5" strokeWidth="1.2" fill="none" />
          </g>
          <g transform="translate(120, 190) rotate(40)">
            <ellipse cx="20" cy="12" rx="24" ry="12" fill="#991b1b" stroke="#f87171" strokeWidth="1.2" />
          </g>

          {/* Lysosomes */}
          <circle cx="150" cy="270" r="11" fill="#f97316" stroke="#fdba74" strokeWidth="1.2" opacity="0.9" />
          <circle cx="340" cy="420" r="13" fill="#f97316" stroke="#fdba74" strokeWidth="1.2" opacity="0.9" />

          {/* Endoplasmic Reticulum & Ribosomes */}
          <path
            d="M 295 330 C 340 320, 360 360, 340 380 S 330 430, 300 420"
            fill="none"
            stroke="#818cf8"
            strokeWidth="2.5"
            strokeDasharray="4 2"
          />
        </g>

        {/* =========================================================
            RIGHT: PLANT CELL (Thick wall, huge vacuole, chloroplasts)
           ========================================================= */}
        <g className="animate-organic-wobble" transform-origin="750 310">
          
          {/* Thick Rigid Plant Cell Wall (الجدار الخلوي) - Multi-layered with organic corners */}
          <path
            id="plant-wall-outer"
            d="M 580 90 
               C 700 80, 870 85, 930 115 
               C 960 170, 955 420, 935 495 
               C 870 535, 680 535, 595 505 
               C 560 440, 565 170, 580 90 Z"
            fill="#064e3b"
            stroke={isPartActive('plant-wall') ? '#86efac' : '#22c55e'}
            strokeWidth={isPartActive('plant-wall') ? 6 : 4}
            filter={isPartActive('plant-wall') ? 'url(#glow-plant-animal)' : undefined}
            className="cursor-pointer"
            onClick={() => onSelectPart('plant-wall')}
            onMouseEnter={() => onHoverPart('plant-wall')}
            onMouseLeave={() => onHoverPart(null)}
          />

          {/* Inner Plant Plasma Membrane */}
          <path
            d="M 590 105 
               C 700 95, 860 100, 915 125 
               C 945 175, 940 410, 920 480 
               C 860 515, 690 515, 610 490 
               C 575 430, 580 180, 590 105 Z"
            fill="url(#plant-cyto-grad)"
            stroke="#10b981"
            strokeWidth="1.8"
          />

          {/* Large Central Vacuole (فجوة العصير الخلوي الكبيرة المتموجة) */}
          <g
            className="cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
            onClick={() => onSelectPart('large-vacuole')}
            onMouseEnter={() => onHoverPart('large-vacuole')}
            onMouseLeave={() => onHoverPart(null)}
          >
            <path
              d="M 640 170 
                 C 740 140, 850 160, 870 240 
                 C 890 320, 880 410, 830 450 
                 C 770 480, 680 470, 640 420 
                 C 600 370, 595 240, 640 170 Z"
              fill="url(#vacuole-grad)"
              stroke={isPartActive('large-vacuole') ? '#ffffff' : '#38bdf8'}
              strokeWidth={isPartActive('large-vacuole') ? 3.5 : 2}
              filter={isPartActive('large-vacuole') ? 'url(#glow-plant-animal)' : undefined}
            />

            {/* Inner fluid hatching & Cell Sap label text */}
            <g opacity="0.4" stroke="#e0f2fe" strokeWidth="1">
              <line x1="660" y1="220" x2="840" y2="235" />
              <line x1="640" y1="260" x2="860" y2="280" />
              <line x1="635" y1="310" x2="850" y2="330" />
              <line x1="650" y1="360" x2="830" y2="380" />
              <line x1="670" y1="410" x2="800" y2="425" />
            </g>
            <text x="750" y="300" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="bold" opacity="0.85">
              Cell Sap
            </text>
            <text x="750" y="325" textAnchor="middle" fill="#e0f2fe" fontSize="13" fontWeight="bold" opacity="0.9">
              العصير الخلوي
            </text>
          </g>

          {/* Plant Chloroplasts (البلاستيدة الخضراء) */}
          <g
            className="cursor-pointer transition-transform duration-300 hover:scale-110"
            onClick={() => onSelectPart('plant-chloroplast')}
            onMouseEnter={() => onHoverPart('plant-chloroplast')}
            onMouseLeave={() => onHoverPart(null)}
          >
            {/* Chloroplast 1 - Bottom left */}
            <g transform="translate(615, 455) rotate(-15)">
              <ellipse
                cx="30"
                cy="18"
                rx="32"
                ry="18"
                fill="#15803d"
                stroke={isPartActive('plant-chloroplast') ? '#86efac' : '#22c55e'}
                strokeWidth={isPartActive('plant-chloroplast') ? 2.5 : 1.2}
                filter={isPartActive('plant-chloroplast') ? 'url(#glow-plant-animal)' : undefined}
              />
              {/* Grana stacks */}
              <circle cx="18" cy="18" r="4" fill="#86efac" />
              <circle cx="30" cy="18" r="4" fill="#86efac" />
              <circle cx="42" cy="18" r="4" fill="#86efac" />
            </g>

            {/* Chloroplast 2 - Top right */}
            <g transform="translate(860, 135) rotate(25)">
              <ellipse
                cx="25"
                cy="15"
                rx="28"
                ry="15"
                fill="#15803d"
                stroke={isPartActive('plant-chloroplast') ? '#86efac' : '#22c55e'}
                strokeWidth={isPartActive('plant-chloroplast') ? 2.5 : 1.2}
              />
              <circle cx="16" cy="15" r="3.5" fill="#86efac" />
              <circle cx="26" cy="15" r="3.5" fill="#86efac" />
              <circle cx="36" cy="15" r="3.5" fill="#86efac" />
            </g>
          </g>

          {/* Plant Nucleus (pushed to periphery by large vacuole) */}
          <g
            className="cursor-pointer"
            onClick={() => onSelectPart('cell-nucleus')}
            onMouseEnter={() => onHoverPart('cell-nucleus')}
            onMouseLeave={() => onHoverPart(null)}
          >
            <ellipse
              cx="610"
              cy="250"
              rx="24"
              ry="32"
              fill="#581c87"
              stroke={isPartActive('cell-nucleus') ? '#e9d5ff' : '#a855f7'}
              strokeWidth={isPartActive('cell-nucleus') ? 3 : 1.5}
            />
            <circle cx="610" cy="250" r="10" fill="#f43f5e" opacity="0.9" />
          </g>

          {/* Plant Mitochondria */}
          <g transform="translate(875, 420) rotate(-35)">
            <ellipse cx="20" cy="12" rx="22" ry="12" fill="#991b1b" stroke="#f87171" strokeWidth="1.2" />
          </g>
        </g>

        {/* Labels & Pointers Layer */}
        {showLabels && (
          <g className="labels-layer pointer-events-none">
            {parts.map((part) => {
              const active = isPartActive(part.id);
              const { targetX, targetY, labelX, labelY, anchor } = part.pointer;
              const pathData = `M ${targetX} ${targetY} L ${labelX} ${labelY}`;

              return (
                <g key={part.id} className="pointer-events-auto cursor-pointer" onClick={() => onSelectPart(part.id)}>
                  <path
                    d={pathData}
                    fill="none"
                    stroke={active ? part.color : 'rgba(148, 163, 184, 0.5)'}
                    strokeWidth={active ? 2.2 : 1.2}
                    strokeDasharray={active ? 'none' : '3 3'}
                  />
                  <circle
                    cx={targetX}
                    cy={targetY}
                    r={active ? 5.5 : 3.5}
                    fill={part.color}
                    stroke="#020617"
                    strokeWidth="1.5"
                  />
                  <g transform={`translate(${labelX}, ${labelY})`}>
                    <rect
                      x={anchor === 'end' ? -180 : anchor === 'middle' ? -90 : -10}
                      y="-18"
                      width="190"
                      height="34"
                      rx="8"
                      fill={active ? '#1e293b' : '#0f172a'}
                      stroke={active ? part.color : 'rgba(71, 85, 105, 0.7)'}
                      strokeWidth={active ? 2 : 1}
                      filter={active ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' : undefined}
                    />
                    <text
                      x={anchor === 'end' ? -85 : anchor === 'middle' ? 5 : 85}
                      y="-2"
                      textAnchor="middle"
                      fill={active ? '#ffffff' : '#f1f5f9'}
                      fontSize="11"
                      fontWeight="bold"
                    >
                      {part.nameAr}
                    </text>
                    <text
                      x={anchor === 'end' ? -85 : anchor === 'middle' ? 5 : 85}
                      y="11"
                      textAnchor="middle"
                      fill={active ? part.color : '#94a3b8'}
                      fontSize="8.5"
                      className="font-mono"
                    >
                      {part.nameEn}
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
