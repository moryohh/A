import React, { useState, useEffect } from 'react';
import { DiagramPart } from '../types';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface OsmosisExpSVGProps {
  parts: DiagramPart[];
  selectedPartId: string | null;
  hoveredPartId: string | null;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string | null) => void;
  showLabels?: boolean;
}

export const OsmosisExpSVG: React.FC<OsmosisExpSVGProps> = ({
  parts,
  selectedPartId,
  hoveredPartId,
  onSelectPart,
  onHoverPart,
  showLabels = true,
}) => {
  const [fluidLevel, setFluidLevel] = useState<number>(260); // y-coordinate of fluid meniscus
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  useEffect(() => {
    if (!isSimulating) return;
    const interval = setInterval(() => {
      setFluidLevel((prev) => {
        if (prev <= 120) return 260; // reset loop
        return prev - 2;
      });
    }, 150);
    return () => clearInterval(interval);
  }, [isSimulating]);

  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  return (
    <div className="relative w-full overflow-hidden select-none flex flex-col items-center">
      
      {/* Simulation Controls */}
      <div className="w-full max-w-4xl flex items-center justify-between px-4 py-2 mb-2 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-200">
            محاكاة الضغط الإسموزي (Osmotic Pressure):
          </span>
          <span className="text-xs text-sky-400 font-mono">
            ارتفاع عمود السائل: {Math.round(((260 - fluidLevel) / 140) * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1.5"
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? 'إيقاف' : 'بدء التدفق'}</span>
          </button>
          <button
            onClick={() => setFluidLevel(260)}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
            title="إعادة التعيين"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <svg
        viewBox="0 0 1000 600"
        className="w-full h-auto max-h-[600px] drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="osm-exp-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="beaker-water-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.5" />
          </linearGradient>

          <linearGradient id="sugar-sol-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#9333ea" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Ambient Dark Canvas */}
        <rect width="1000" height="600" fill="#030712" rx="20" />

        {/* Retort Stand (حامل حديدي) */}
        <g opacity="0.8">
          {/* Base */}
          <rect x="220" y="520" width="300" height="14" rx="4" fill="#334155" />
          {/* Vertical Rod */}
          <rect x="250" y="60" width="12" height="460" rx="3" fill="#475569" />
          {/* Horizontal Clamp */}
          <path d="M 256 160 L 465 160" stroke="#64748b" strokeWidth="8" strokeLinecap="round" />
          <circle cx="256" cy="160" r="10" fill="#1e293b" stroke="#94a3b8" strokeWidth="2" />
          {/* Clamp jaws */}
          <path d="M 465 145 C 475 145, 485 152, 485 160 C 485 168, 475 175, 465 175" stroke="#94a3b8" strokeWidth="4" fill="none" />
          <path d="M 535 145 C 525 145, 515 152, 515 160 C 515 168, 525 175, 535 175" stroke="#94a3b8" strokeWidth="4" fill="none" />
        </g>

        {/* =========================================================
            GLASS BEAKER & PURE DISTILLED WATER
           ========================================================= */}
        <g
          id="beaker-water"
          className="cursor-pointer"
          onClick={() => onSelectPart('distilled-water')}
          onMouseEnter={() => onHoverPart('distilled-water')}
          onMouseLeave={() => onHoverPart(null)}
        >
          {/* Glass beaker body */}
          <path
            d="M 360 270 L 360 510 Q 360 520 370 520 L 630 520 Q 640 520 640 510 L 640 270"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="3.5"
          />
          <path d="M 352 270 L 368 270 M 632 270 L 648 270" stroke="#94a3b8" strokeWidth="3" />

          {/* Distilled Water inside beaker */}
          <path
            d="M 362 300 Q 500 310 638 300 L 638 518 L 362 518 Z"
            fill="url(#beaker-water-grad)"
            stroke={isPartActive('distilled-water') ? '#38bdf8' : 'none'}
            strokeWidth={2}
          />

          {/* Shimmering pure water particles entering the funnel */}
          {Array.from({ length: 18 }).map((_, i) => (
            <circle
              key={i}
              cx={380 + (i % 6) * 45}
              cy={350 + Math.floor(i / 6) * 50}
              r="3.5"
              fill="#7dd3fc"
              className="animate-particle-drift"
            />
          ))}
        </g>

        {/* =========================================================
            THISTLE FUNNEL TUBE (أنبوب القمع ذو العنق الضيق)
           ========================================================= */}
        <g
          id="thistle-funnel"
          className="cursor-pointer"
          onClick={() => onSelectPart('thistle-funnel')}
          onMouseEnter={() => onHoverPart('thistle-funnel')}
          onMouseLeave={() => onHoverPart(null)}
        >
          {/* Glass outline of thistle tube */}
          {/* Top flared mouth */}
          <path
            d="M 465 70 Q 500 65 535 70 L 520 90 L 515 420 
               C 555 435, 565 475, 560 500 
               L 440 500 
               C 435 475, 445 435, 485 420 
               L 485 90 Z"
            fill="none"
            stroke={isPartActive('thistle-funnel') ? '#ffffff' : '#cbd5e1'}
            strokeWidth={isPartActive('thistle-funnel') ? 3.5 : 2.5}
            filter={isPartActive('thistle-funnel') ? 'url(#osm-exp-glow)' : undefined}
          />

          {/* Rising Sugar Solution inside the tube */}
          <path
            d={`M 487 ${fluidLevel} L 513 ${fluidLevel} L 513 420 
               C 553 435, 563 475, 558 498 
               L 442 498 
               C 437 475, 447 435, 487 420 Z`}
            fill="url(#sugar-sol-grad)"
            className="transition-all duration-300"
          />

          {/* Fluid Meniscus Curve */}
          <ellipse
            cx="500"
            cy={fluidLevel}
            rx="13"
            ry="4"
            fill="#f472b6"
            stroke="#ffffff"
            strokeWidth="1.5"
          />

          {/* Dynamic rising arrow indicator */}
          <g transform={`translate(528, ${fluidLevel})`}>
            <path d="M 0 25 L 0 5" stroke="#f43f5e" strokeWidth="2.5" />
            <polygon points="0,0 -4,8 4,8" fill="#f43f5e" />
          </g>
        </g>

        {/* =========================================================
            CELLOPHANE MEMBRANE (غشاء السيلوفان / اختياري النفوذية)
           ========================================================= */}
        <g
          id="cellophane-membrane"
          className="cursor-pointer"
          onClick={() => onSelectPart('cellophane-membrane')}
          onMouseEnter={() => onHoverPart('cellophane-membrane')}
          onMouseLeave={() => onHoverPart(null)}
        >
          {/* Elastic tied membrane with slight living curvature */}
          <path
            d="M 436 498 Q 500 514 564 498"
            fill="none"
            stroke={isPartActive('cellophane-membrane') ? '#ffffff' : '#fbbf24'}
            strokeWidth={isPartActive('cellophane-membrane') ? 5 : 3.5}
            strokeDasharray="4 2"
            filter={isPartActive('cellophane-membrane') ? 'url(#osm-exp-glow)' : undefined}
          />

          {/* Elastic Rubber Band tie */}
          <ellipse cx="500" cy="497" rx="63" ry="5" fill="none" stroke="#e11d48" strokeWidth="2.5" />
          <text x="500" y="492" textAnchor="middle" fill="#fef08a" fontSize="8" fontWeight="bold">
            رباط محكم
          </text>
        </g>

        {/* Inward water osmotic flow arrows across membrane */}
        <g stroke="#38bdf8" strokeWidth="2" fill="none">
          <path d="M 460 540 L 475 515" markerEnd="url(#arrow)" />
          <path d="M 500 545 L 500 518" markerEnd="url(#arrow)" />
          <path d="M 540 540 L 525 515" markerEnd="url(#arrow)" />
        </g>

        {/* Labels and Callouts Layer */}
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
