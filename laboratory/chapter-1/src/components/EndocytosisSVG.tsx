import React, { useState } from 'react';
import { DiagramPart } from '../types';
import { Sparkles, ArrowDown } from 'lucide-react';

interface EndocytosisSVGProps {
  type: 'phagocytosis' | 'pinocytosis';
  parts: DiagramPart[];
  selectedPartId: string | null;
  hoveredPartId: string | null;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string | null) => void;
  showLabels?: boolean;
}

export const EndocytosisSVG: React.FC<EndocytosisSVGProps> = ({
  type,
  parts,
  selectedPartId,
  hoveredPartId,
  onSelectPart,
  onHoverPart,
  showLabels = true,
}) => {
  const [animationStep, setAnimationStep] = useState<number>(1);
  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  const isPhago = type === 'phagocytosis';

  return (
    <div className="relative w-full overflow-hidden select-none flex flex-col items-center">
      
      {/* Interactive Step Switcher */}
      <div className="w-full max-w-3xl flex items-center justify-between px-4 py-2 mb-2 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold text-slate-200">
            {isPhago ? 'مراحل البلعمة (الأكل الخلوي):' : 'مراحل الشرب الخلوي:'}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {[1, 2, 3].map((step) => (
            <button
              key={step}
              onClick={() => setAnimationStep(step)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                animationStep === step
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {step === 1 && '1. الاقتراب'}
              {step === 2 && '2. الانبعاج الغشائي'}
              {step === 3 && '3. انفصال الحويصلة'}
            </button>
          ))}
        </div>
      </div>

      <svg
        viewBox="0 0 1000 600"
        className="w-full h-auto max-h-[600px] drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="endo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="food-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>

          <linearGradient id="liquid-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>

          <radialGradient id="cyto-endo-grad" cx="50%" cy="80%" r="70%">
            <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#090d16" stopOpacity="0.95" />
          </radialGradient>
        </defs>

        {/* Ambient Dark Canvas */}
        <rect width="1000" height="600" fill="#030712" rx="20" />

        {/* Extracellular Area Label */}
        <text x="70" y="55" fill="#94a3b8" fontSize="13" fontWeight="bold">
          خارج الخلية (Extracellular Medium)
        </text>

        {/* Intracellular / Cytoplasm Background */}
        <rect x="0" y="240" width="1000" height="360" fill="url(#cyto-endo-grad)" />
        <text x="70" y="560" fill="#818cf8" fontSize="13" fontWeight="bold">
          داخل الخلية (سيتوبلازم الخلية)
        </text>

        {/* Organic Biological Living Plasma Membrane with Natural Undulations */}
        <g className="animate-organic-wobble" transform-origin="500 240">
          {/* Invaginating Membrane Path */}
          <path
            id="endo-membrane"
            d={
              isPhago
                ? animationStep === 1
                  ? 'M 0 240 C 200 235, 380 245, 430 250 C 470 255, 530 255, 570 250 C 620 245, 800 235, 1000 240 L 1000 265 C 800 260, 620 270, 570 275 C 530 280, 470 280, 430 275 C 380 270, 200 260, 0 265 Z'
                  : animationStep === 2
                  ? 'M 0 240 C 200 235, 360 245, 410 245 C 440 245, 440 370, 500 370 C 560 370, 560 245, 590 245 C 640 245, 800 235, 1000 240 L 1000 265 C 800 260, 630 270, 580 270 C 540 270, 540 395, 500 395 C 460 395, 460 270, 420 270 C 370 270, 200 260, 0 265 Z'
                  : 'M 0 240 C 200 235, 420 242, 480 245 C 520 245, 580 242, 1000 240 L 1000 265 C 580 267, 520 270, 480 270 C 420 267, 200 260, 0 265 Z'
                : animationStep === 1
                ? 'M 0 240 C 250 238, 450 242, 500 245 C 550 242, 750 238, 1000 240 L 1000 260 C 750 258, 550 262, 500 265 C 450 262, 250 258, 0 260 Z'
                : animationStep === 2
                ? 'M 0 240 C 250 238, 440 240, 470 245 C 480 250, 485 360, 500 360 C 515 360, 520 250, 530 245 C 560 240, 750 238, 1000 240 L 1000 260 C 750 258, 550 260, 525 265 C 510 270, 510 380, 500 380 C 490 380, 490 270, 475 265 C 450 260, 250 258, 0 260 Z'
                : 'M 0 240 C 250 238, 450 242, 500 245 C 550 242, 750 238, 1000 240 L 1000 260 C 750 258, 550 262, 500 265 C 450 262, 250 258, 0 260 Z'
            }
            fill="#e11d48"
            fillOpacity="0.4"
            stroke={isPartActive('plasma-membrane-invagination') ? '#fda4af' : '#f43f5e'}
            strokeWidth={isPartActive('plasma-membrane-invagination') ? 4 : 2.5}
            filter={isPartActive('plasma-membrane-invagination') ? 'url(#endo-glow)' : undefined}
            className="cursor-pointer transition-all duration-700 ease-in-out"
            onClick={() => onSelectPart('plasma-membrane-invagination')}
            onMouseEnter={() => onHoverPart('plasma-membrane-invagination')}
            onMouseLeave={() => onHoverPart(null)}
          />

          {/* Biological lipid head beads along membrane */}
          {Array.from({ length: 22 }).map((_, i) => {
            const x = 30 + i * 44;
            return (
              <circle
                key={i}
                cx={x}
                cy={238 + Math.sin(i * 0.8) * 3}
                r="4.5"
                fill="#fda4af"
                stroke="#e11d48"
                strokeWidth="1"
                opacity="0.85"
              />
            );
          })}
        </g>

        {/* The Ingested Material: Food particle or Liquid droplets */}
        {isPhago ? (
          /* Solid Food Particle (حبيبة الغذاء ذات التعرجات الحيوية) */
          <g
            id="food-particle"
            className="cursor-pointer transition-all duration-700 ease-in-out"
            onClick={() => onSelectPart('food-particle')}
            onMouseEnter={() => onHoverPart('food-particle')}
            onMouseLeave={() => onHoverPart(null)}
            transform={`translate(0, ${animationStep === 1 ? 0 : animationStep === 2 ? 140 : 250})`}
          >
            {/* Organic irregular polygonal food nugget (not a rigid sphere) */}
            <path
              d="M 480 130 C 510 120, 540 135, 545 160 C 550 185, 520 205, 490 200 C 460 195, 455 150, 480 130 Z"
              fill="url(#food-grad)"
              stroke={isPartActive('food-particle') ? '#ffffff' : '#f43f5e'}
              strokeWidth={isPartActive('food-particle') ? 3 : 1.5}
              filter={isPartActive('food-particle') ? 'url(#endo-glow)' : undefined}
            />
            {/* Texture speckles */}
            <circle cx="495" cy="155" r="3" fill="#ffffff" opacity="0.6" />
            <circle cx="515" cy="170" r="2.5" fill="#fecdd3" opacity="0.8" />
            <circle cx="485" cy="180" r="2" fill="#ffe4e6" opacity="0.7" />
          </g>
        ) : (
          /* Liquid Droplets for Pinocytosis (قطيرات سائلة) */
          <g
            id="liquid-droplets"
            className="cursor-pointer transition-all duration-700 ease-in-out"
            onClick={() => onSelectPart('liquid-droplets')}
            onMouseEnter={() => onHoverPart('liquid-droplets')}
            onMouseLeave={() => onHoverPart(null)}
            transform={`translate(0, ${animationStep === 1 ? 0 : animationStep === 2 ? 130 : 240})`}
          >
            <ellipse cx="500" cy="140" rx="18" ry="14" fill="url(#liquid-grad)" stroke="#bae6fd" strokeWidth="1.5" />
            <ellipse cx="480" cy="170" rx="12" ry="10" fill="url(#liquid-grad)" stroke="#bae6fd" strokeWidth="1.2" />
            <ellipse cx="520" cy="165" rx="14" ry="11" fill="url(#liquid-grad)" stroke="#bae6fd" strokeWidth="1.2" />
          </g>
        )}

        {/* Pinched-off Vesicle / Vacuole inside cytoplasm (Step 3) */}
        {animationStep === 3 && (
          <g
            id="food-vacuole"
            className="cursor-pointer animate-organic-wobble"
            transform-origin="500 420"
            onClick={() => onSelectPart(isPhago ? 'food-vacuole' : 'pinocytic-vesicle')}
            onMouseEnter={() => onHoverPart(isPhago ? 'food-vacuole' : 'pinocytic-vesicle')}
            onMouseLeave={() => onHoverPart(null)}
          >
            {/* Vesicle membrane */}
            <ellipse
              cx="500"
              cy="420"
              rx="55"
              ry="45"
              fill="#be123c"
              fillOpacity="0.25"
              stroke={isPartActive(isPhago ? 'food-vacuole' : 'pinocytic-vesicle') ? '#ffffff' : '#fb7185'}
              strokeWidth={isPartActive(isPhago ? 'food-vacuole' : 'pinocytic-vesicle') ? 3.5 : 2}
              filter="url(#endo-glow)"
            />
            {/* Lipid beads around vesicle */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              const vx = 500 + Math.cos(angle) * 55;
              const vy = 420 + Math.sin(angle) * 45;
              return <circle key={i} cx={vx} cy={vy} r="3" fill="#fda4af" />;
            })}
          </g>
        )}

        {/* Lysosome approaching for digestion in Phagocytosis */}
        {isPhago && (
          <g
            id="lysosome-fusion"
            className="cursor-pointer transition-transform duration-500 hover:scale-105"
            onClick={() => onSelectPart('lysosome-fusion')}
            onMouseEnter={() => onHoverPart('lysosome-fusion')}
            onMouseLeave={() => onHoverPart(null)}
            transform={`translate(${animationStep === 3 ? '610, 420' : '720, 440'})`}
          >
            <circle
              cx="0"
              cy="0"
              r="34"
              fill="#f97316"
              stroke={isPartActive('lysosome-fusion') ? '#ffffff' : '#fb923c'}
              strokeWidth={isPartActive('lysosome-fusion') ? 3 : 1.5}
              filter={isPartActive('lysosome-fusion') ? 'url(#endo-glow)' : undefined}
            />
            {/* Hydrolytic enzyme dots */}
            <circle cx="-10" cy="-10" r="3.5" fill="#fef08a" />
            <circle cx="10" cy="-8" r="3.5" fill="#fef08a" />
            <circle cx="0" cy="12" r="3.5" fill="#fef08a" />
            <circle cx="-12" cy="8" r="3" fill="#fef08a" />
            <circle cx="14" cy="9" r="3" fill="#fef08a" />
            <text x="0" y="3" textAnchor="middle" fill="#431407" fontSize="8.5" fontWeight="bold">
              إنزيمات
            </text>
          </g>
        )}

        {/* Direction Flow Arrows */}
        <g opacity="0.7">
          <path d="M 500 90 L 500 120" stroke="#f43f5e" strokeWidth="2.5" strokeDasharray="4 2" />
          <polygon points="500,128 495,116 505,116" fill="#f43f5e" />
        </g>

        {/* Informative Labels and Pointers */}
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
