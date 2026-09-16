import React, { useState } from 'react';
import { DiagramPart } from '../types';
import { Zap, ArrowDown, Sparkles } from 'lucide-react';

interface GlycolysisSVGProps {
  parts: DiagramPart[];
  selectedPartId: string | null;
  hoveredPartId: string | null;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string | null) => void;
  showLabels?: boolean;
}

export const GlycolysisSVG: React.FC<GlycolysisSVGProps> = ({
  parts,
  selectedPartId,
  hoveredPartId,
  onSelectPart,
  onHoverPart,
  showLabels = true,
}) => {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  return (
    <div className="relative w-full overflow-hidden select-none flex flex-col items-center">
      
      {/* Top Pathway Highlights */}
      <div className="w-full max-w-4xl flex items-center justify-between px-4 py-2 mb-2 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Zap className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold text-slate-200">
            مسار التحلل السكري (Glycolysis) في السيتوبلازم:
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 font-mono">
            استهلاك: 2 ATP
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-mono">
            إنتاج: 4 ATP
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold font-mono">
            الربح الصافي = 2 ATP ⚡
          </span>
        </div>
      </div>

      <svg
        viewBox="0 0 1000 600"
        className="w-full h-auto max-h-[600px] drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="glyco-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="node-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          <linearGradient id="atp-spend" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>

          <linearGradient id="atp-gain" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>

        {/* Ambient Dark Canvas */}
        <rect width="1000" height="600" fill="#030712" rx="20" />

        {/* Cytoplasm Watermark */}
        <text x="50" y="45" fill="#475569" fontSize="13" fontWeight="bold">
          موقع التفاعل: سيتوبلازم الخلية (بدون الحاجة للأكسجين)
        </text>

        {/* Dynamic Flow lines */}
        <g stroke="#4f46e5" strokeWidth="2.5" fill="none" opacity="0.6">
          <path d="M 500 80 L 500 125" />
          <path d="M 500 165 L 500 210" />
          <path d="M 500 250 L 500 295" />
          {/* Cleavage fork */}
          <path d="M 500 335 C 500 350, 360 365, 360 385" />
          <path d="M 500 335 C 500 350, 640 365, 640 385" />
          {/* Reversible isomer arrow */}
          <path d="M 430 405 L 570 405" stroke="#f59e0b" strokeWidth="2" strokeDasharray="3 3" />
          {/* Convergence to Pyruvate */}
          <path d="M 360 425 C 360 455, 470 480, 485 505" />
          <path d="M 640 425 C 640 455, 530 480, 515 505" />
        </g>

        {/* =========================================================
            STEP 1: GLUCOSE (جلوكوز 6C)
           ========================================================= */}
        <g
          id="glucose-node"
          className="cursor-pointer transition-transform duration-200 hover:scale-105"
          onClick={() => onSelectPart('glucose-start')}
          onMouseEnter={() => onHoverPart('glucose-start')}
          onMouseLeave={() => onHoverPart(null)}
          transform="translate(500, 60)"
        >
          <rect
            x="-110"
            y="-22"
            width="220"
            height="44"
            rx="12"
            fill="url(#node-grad)"
            stroke={isPartActive('glucose-start') ? '#60a5fa' : '#3b82f6'}
            strokeWidth={isPartActive('glucose-start') ? 3 : 1.5}
            filter={isPartActive('glucose-start') ? 'url(#glyco-glow)' : undefined}
          />
          <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold">
            جلوكوز (Glucose - 6C)
          </text>
        </g>

        {/* ATP 1 Consumed: ATP -> ADP */}
        <g transform="translate(640, 100)">
          <path d="M -20 -15 C 20 -15, 20 15, -20 15" stroke="#f43f5e" strokeWidth="2" fill="none" />
          <rect x="-10" y="-12" width="70" height="24" rx="6" fill="#be123c" />
          <text x="25" y="4" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="bold">
            ATP ➔ ADP
          </text>
        </g>

        {/* =========================================================
            STEP 2: GLUCOSE 6-PHOSPHATE (جلوكوز أحادي الفوسفات)
           ========================================================= */}
        <g transform="translate(500, 145)">
          <rect x="-130" y="-20" width="260" height="40" rx="10" fill="url(#node-grad)" stroke="#6366f1" strokeWidth="1.5" />
          <text x="0" y="4" textAnchor="middle" fill="#e0e7ff" fontSize="12" fontWeight="bold">
            جلوكوز أحادي الفوسفات (6C)
          </text>
        </g>

        {/* =========================================================
            STEP 3: FRUCTOSE 6-PHOSPHATE (فركتوز أحادي الفوسفات)
           ========================================================= */}
        <g transform="translate(500, 230)">
          <rect x="-130" y="-20" width="260" height="40" rx="10" fill="url(#node-grad)" stroke="#6366f1" strokeWidth="1.5" />
          <text x="0" y="4" textAnchor="middle" fill="#e0e7ff" fontSize="12" fontWeight="bold">
            فركتوز أحادي الفوسفات (6C)
          </text>
        </g>

        {/* ATP 2 Consumed: ATP -> ADP */}
        <g transform="translate(640, 270)">
          <path d="M -20 -15 C 20 -15, 20 15, -20 15" stroke="#f43f5e" strokeWidth="2" fill="none" />
          <rect x="-10" y="-12" width="70" height="24" rx="6" fill="#be123c" />
          <text x="25" y="4" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="bold">
            ATP ➔ ADP
          </text>
        </g>

        {/* =========================================================
            STEP 4: FRUCTOSE 1,6-BISPHOSPHATE (فركتوز ثنائي الفوسفات)
           ========================================================= */}
        <g transform="translate(500, 315)">
          <rect x="-140" y="-20" width="280" height="40" rx="10" fill="url(#node-grad)" stroke="#a855f7" strokeWidth="2" />
          <text x="0" y="4" textAnchor="middle" fill="#f3e8ff" fontSize="12" fontWeight="bold">
            فركتوز ثنائي الفوسفات (6C)
          </text>
        </g>

        {/* =========================================================
            STEP 5: CLEAVAGE INTO DHAP & PGAL (الانشطار)
           ========================================================= */}
        {/* Left: DHAP */}
        <g transform="translate(360, 405)">
          <rect x="-105" y="-20" width="210" height="40" rx="10" fill="url(#node-grad)" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="0" y="4" textAnchor="middle" fill="#bae6fd" fontSize="10.5" fontWeight="bold">
            ثنائي هيدروكسي أسيتون مفسفر (3C)
          </text>
        </g>

        {/* Right: PGAL */}
        <g
          id="pgal-node"
          className="cursor-pointer transition-transform duration-200 hover:scale-105"
          onClick={() => onSelectPart('pgal-split')}
          onMouseEnter={() => onHoverPart('pgal-split')}
          onMouseLeave={() => onHoverPart(null)}
          transform="translate(640, 405)"
        >
          <rect
            x="-105"
            y="-20"
            width="210"
            height="40"
            rx="10"
            fill="url(#node-grad)"
            stroke={isPartActive('pgal-split') ? '#facc15' : '#eab308'}
            strokeWidth={isPartActive('pgal-split') ? 3 : 1.8}
            filter={isPartActive('pgal-split') ? 'url(#glyco-glow)' : undefined}
          />
          <text x="0" y="4" textAnchor="middle" fill="#fef08a" fontSize="11" fontWeight="bold">
            2 × كليسر ألدهايد مفسفر (PGAL - 3C)
          </text>
        </g>

        {/* Oxidation & ATP Generation Highlights: 4 ADP -> 4 ATP & 2(2H) */}
        <g transform="translate(680, 465)">
          <rect x="-10" y="-12" width="110" height="24" rx="6" fill="#047857" stroke="#34d399" strokeWidth="1" />
          <text x="45" y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="black">
            + 4 ATP ⚡ & 2(2H)
          </text>
        </g>

        {/* =========================================================
            FINAL PRODUCT: 2 PYRUVIC ACID (2 حامض بايروفي)
           ========================================================= */}
        <g
          id="pyruvate-node"
          className="cursor-pointer transition-transform duration-200 hover:scale-105"
          onClick={() => onSelectPart('pyruvate-product')}
          onMouseEnter={() => onHoverPart('pyruvate-product')}
          onMouseLeave={() => onHoverPart(null)}
          transform="translate(500, 535)"
        >
          <rect
            x="-140"
            y="-25"
            width="280"
            height="50"
            rx="14"
            fill="url(#node-grad)"
            stroke={isPartActive('pyruvate-product') ? '#4ade80' : '#22c55e'}
            strokeWidth={isPartActive('pyruvate-product') ? 3.5 : 2}
            filter="url(#glyco-glow)"
          />
          <text x="0" y="-3" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="black">
            2 جزيء من الحامض البايروفي (2 × 3C)
          </text>
          <text x="0" y="14" textAnchor="middle" fill="#86efac" fontSize="10" fontWeight="bold">
            الناتج النهائي للتحلل السكري
          </text>
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
