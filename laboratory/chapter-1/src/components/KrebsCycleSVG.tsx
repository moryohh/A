import React from 'react';
import { DiagramPart } from '../types';
import { Zap, Flame } from 'lucide-react';

interface KrebsCycleSVGProps {
  parts: DiagramPart[];
  selectedPartId: string | null;
  hoveredPartId: string | null;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string | null) => void;
  showLabels?: boolean;
}

export const KrebsCycleSVG: React.FC<KrebsCycleSVGProps> = ({
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
      
      {/* Top Info Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between px-4 py-2 mb-2 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Flame className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold text-slate-200">
            دورة حامض الليمون (دورة كربس - Krebs Cycle) داخل قالب المايتوكوندريا:
          </span>
        </div>

        <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
          إنتاج الدورة الواحدة: 12 ATP (24 ATP لكل جزيء جلوكوز)
        </span>
      </div>

      <svg
        viewBox="0 0 1000 600"
        className="w-full h-auto max-h-[600px] drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="krebs-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="krebs-cycle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="50%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>

          <radialGradient id="matrix-grad" cx="50%" cy="55%" r="45%">
            <stop offset="0%" stopColor="#451a03" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
          </radialGradient>
        </defs>

        {/* Dark Biological Canvas */}
        <rect width="1000" height="600" fill="#030712" rx="20" />

        {/* Mitochondrial Matrix Background Circle */}
        <circle cx="500" cy="330" r="230" fill="url(#matrix-grad)" stroke="#78350f" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.6" />
        <text x="500" y="330" textAnchor="middle" fill="#fdba74" fontSize="13" fontWeight="bold" opacity="0.35">
          قالب المايتوكوندريا (Matrix)
        </text>

        {/* =========================================================
            ENTRY PHASE: PYRUVATE -> ACETYL COA
           ========================================================= */}
        {/* Pyruvate (3C) */}
        <g
          id="pyruvate-feed"
          className="cursor-pointer transition-transform duration-200 hover:scale-105"
          onClick={() => onSelectPart('pyruvate-entry')}
          onMouseEnter={() => onHoverPart('pyruvate-entry')}
          onMouseLeave={() => onHoverPart(null)}
          transform="translate(500, 45)"
        >
          <rect
            x="-110"
            y="-20"
            width="220"
            height="40"
            rx="10"
            fill="#1e293b"
            stroke={isPartActive('pyruvate-entry') ? '#38bdf8' : '#0284c7'}
            strokeWidth={isPartActive('pyruvate-entry') ? 3 : 1.5}
            filter={isPartActive('pyruvate-entry') ? 'url(#krebs-glow)' : undefined}
          />
          <text x="0" y="5" textAnchor="middle" fill="#e0f2fe" fontSize="12" fontWeight="bold">
            حامض بايروفي (3C)
          </text>
        </g>

        {/* Downward reaction arrow to Acetyl-CoA with Decarboxylation & Oxidation */}
        <path d="M 500 65 L 500 120" stroke="#f59e0b" strokeWidth="2.5" />
        <polygon points="500,126 495,114 505,114" fill="#f59e0b" />

        {/* Released CO2 and 2H (3 ATP) */}
        <g transform="translate(595, 95)">
          <rect x="-40" y="-12" width="80" height="24" rx="6" fill="#7f1d1d" stroke="#f87171" strokeWidth="1" />
          <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="bold">
            CO2 + 2H (3 ATP)
          </text>
        </g>

        {/* Acetyl-CoA (أستيل كو - أ 2C) */}
        <g
          id="acetyl-node"
          className="cursor-pointer transition-transform duration-200 hover:scale-105"
          onClick={() => onSelectPart('acetyl-coa')}
          onMouseEnter={() => onHoverPart('acetyl-coa')}
          onMouseLeave={() => onHoverPart(null)}
          transform="translate(500, 145)"
        >
          <rect
            x="-115"
            y="-20"
            width="230"
            height="40"
            rx="10"
            fill="#1e293b"
            stroke={isPartActive('acetyl-coa') ? '#facc15' : '#eab308'}
            strokeWidth={isPartActive('acetyl-coa') ? 3 : 1.8}
            filter={isPartActive('acetyl-coa') ? 'url(#krebs-glow)' : undefined}
          />
          <text x="0" y="5" textAnchor="middle" fill="#fef08a" fontSize="12" fontWeight="bold">
            أستيل كو - أ (Acetyl-CoA - 2C)
          </text>
        </g>

        {/* =========================================================
            CIRCULAR ROTATING KREBS PATHWAY
           ========================================================= */}
        {/* Dynamic circular organic arrows */}
        <g stroke="url(#krebs-cycle-grad)" strokeWidth="3" fill="none" opacity="0.8">
          <path d="M 500 165 C 650 170, 720 260, 700 360" />
          <path d="M 700 360 C 670 480, 520 520, 420 480" />
          <path d="M 420 480 C 310 440, 280 320, 340 230" />
          <path d="M 340 230 C 380 180, 440 165, 470 165" />
        </g>

        {/* NODE 1: CITRIC ACID (حامض الليمون 6C) */}
        <g
          id="citric-node"
          className="cursor-pointer transition-transform duration-200 hover:scale-105"
          onClick={() => onSelectPart('citric-acid')}
          onMouseEnter={() => onHoverPart('citric-acid')}
          onMouseLeave={() => onHoverPart(null)}
          transform="translate(710, 260)"
        >
          <rect
            x="-95"
            y="-20"
            width="190"
            height="40"
            rx="10"
            fill="#1e293b"
            stroke={isPartActive('citric-acid') ? '#f97316' : '#ea580c'}
            strokeWidth={isPartActive('citric-acid') ? 3 : 1.8}
            filter={isPartActive('citric-acid') ? 'url(#krebs-glow)' : undefined}
          />
          <text x="0" y="5" textAnchor="middle" fill="#fed7aa" fontSize="12" fontWeight="bold">
            حامض الليمون (Citric Acid - 6C)
          </text>
        </g>

        {/* NODE 2: ALPHA-KETOGLUTARIC ACID (حامض ألفا كيتو كلوتاريك 5C) */}
        <g
          id="akg-node"
          className="cursor-pointer transition-transform duration-200 hover:scale-105"
          onClick={() => onSelectPart('alpha-ketoglutarate')}
          onMouseEnter={() => onHoverPart('alpha-ketoglutarate')}
          onMouseLeave={() => onHoverPart(null)}
          transform="translate(670, 430)"
        >
          <rect
            x="-105"
            y="-20"
            width="210"
            height="40"
            rx="10"
            fill="#1e293b"
            stroke={isPartActive('alpha-ketoglutarate') ? '#ec4899' : '#db2777'}
            strokeWidth={isPartActive('alpha-ketoglutarate') ? 3 : 1.8}
            filter={isPartActive('alpha-ketoglutarate') ? 'url(#krebs-glow)' : undefined}
          />
          <text x="0" y="5" textAnchor="middle" fill="#fbcfe8" fontSize="11" fontWeight="bold">
            ألفا كيتو كلوتاريك (5C)
          </text>
        </g>

        {/* Energy yield badge between Citric and AKG */}
        <g transform="translate(800, 350)">
          <rect x="-35" y="-12" width="70" height="24" rx="6" fill="#7f1d1d" stroke="#fca5a5" strokeWidth="1" />
          <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
            + 3 ATP ⚡
          </text>
        </g>

        {/* Regeneration energy steps between AKG and Oxaloacetate */}
        <g transform="translate(480, 520)">
          <rect x="-45" y="-12" width="90" height="24" rx="6" fill="#047857" stroke="#34d399" strokeWidth="1" />
          <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
            + 6 ATP ⚡ + CO2
          </text>
        </g>

        {/* NODE 3: OXALOACETIC ACID (حامض الأوكزالوخليك 4C) */}
        <g
          id="oxalo-node"
          className="cursor-pointer transition-transform duration-200 hover:scale-105"
          onClick={() => onSelectPart('oxaloacetic-acid')}
          onMouseEnter={() => onHoverPart('oxaloacetic-acid')}
          onMouseLeave={() => onHoverPart(null)}
          transform="translate(320, 260)"
        >
          <rect
            x="-105"
            y="-20"
            width="210"
            height="40"
            rx="10"
            fill="#1e293b"
            stroke={isPartActive('oxaloacetic-acid') ? '#a855f7' : '#9333ea'}
            strokeWidth={isPartActive('oxaloacetic-acid') ? 3 : 1.8}
            filter={isPartActive('oxaloacetic-acid') ? 'url(#krebs-glow)' : undefined}
          />
          <text x="0" y="5" textAnchor="middle" fill="#e9d5ff" fontSize="11" fontWeight="bold">
            حامض أوكزالوخليك (4C)
          </text>
        </g>

        {/* Condensation connector into Citric */}
        <path d="M 400 240 C 430 200, 480 200, 620 250" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2" fill="none" />

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
