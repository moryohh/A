import React, { useState } from 'react';
import { DiagramPart } from '../types';
import { Dna, Sparkles, Eye, Layers } from 'lucide-react';

interface ChromosomeSVGProps {
  parts: DiagramPart[];
  selectedPartId: string | null;
  hoveredPartId: string | null;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string | null) => void;
  animationSpeed?: number;
  showLabels?: boolean;
}

export const ChromosomeSVG: React.FC<ChromosomeSVGProps> = ({
  parts,
  selectedPartId,
  hoveredPartId,
  onSelectPart,
  onHoverPart,
  showLabels = true,
}) => {
  const [showBanding, setShowBanding] = useState<boolean>(true);
  const [showDnaUnravel, setShowDnaUnravel] = useState<boolean>(true);

  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  return (
    <div className="relative w-full overflow-hidden select-none flex flex-col items-center">
      
      {/* Interactive Controls Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between px-4 py-2 mb-2 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Dna className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold text-slate-200">
            تركيب الكروموسوم المتضاعف (Metaphase Chromosome — Servier Medical Art)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBanding(!showBanding)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              showBanding
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showBanding ? 'إخفاء حزم الكروماتين (G-Bands)' : 'إظهار حزم الكروماتين (G-Bands)'}
          </button>
          <button
            onClick={() => setShowDnaUnravel(!showDnaUnravel)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              showDnaUnravel
                ? 'bg-pink-600 text-white shadow-md shadow-pink-900/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showDnaUnravel ? 'إخفاء حلزون الـ DNA المنفرد' : 'إظهار فك التفاف الـ DNA'}
          </button>
        </div>
      </div>

      <svg
        viewBox="0 0 1000 600"
        className="w-full h-auto max-h-[600px] drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* 3D Cylindrical Chromatid Gradients */}
          <linearGradient id="chromatid-3d-left" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4338ca" />
            <stop offset="25%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#818cf8" />
            <stop offset="75%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#3730a3" />
          </linearGradient>

          <linearGradient id="chromatid-3d-right" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0369a1" />
            <stop offset="25%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="75%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>

          <radialGradient id="centromere-3d" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="30%" stopColor="#f59e0b" />
            <stop offset="70%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </radialGradient>

          <radialGradient id="telomere-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0" />
          </radialGradient>

          {/* Bioluminescence glow */}
          <filter id="chromosome-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="dna-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Dark Biological Canvas */}
        <rect width="1000" height="600" fill="#020617" rx="20" />

        {/* Ambient Nuclear Background Grid */}
        <g opacity="0.06">
          <circle cx="500" cy="300" r="260" fill="none" stroke="#6366f1" strokeWidth="2" strokeDasharray="8 8" />
          <circle cx="500" cy="300" r="180" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 6" />
        </g>

        {/* =========================================================
            CHROMOSOME MAIN BODY (Servier Medical Art Style)
           ========================================================= */}
        <g transform="translate(0, 0)">

          {/* ---------------------------------------------------------
              LEFT SISTER CHROMATID (الكروماتيد الأيسر)
             --------------------------------------------------------- */}
          <g
            id="part-chromatid-left"
            className="cursor-pointer transition-all duration-300"
            onClick={() => onSelectPart('chromatid-left')}
            onMouseEnter={() => onHoverPart('chromatid-left')}
            onMouseLeave={() => onHoverPart(null)}
          >
            {/* Left Upper Arm (p-arm / الذراع القصير) */}
            <path
              d="M 488 285 
                 C 470 240, 442 180, 420 120 
                 C 410 92, 420 70, 444 68 
                 C 468 66, 478 88, 484 125 
                 C 490 170, 494 235, 498 280 Z"
              fill="url(#chromatid-3d-left)"
              stroke={isPartActive('chromatid-left') ? '#ffffff' : '#6366f1'}
              strokeWidth={isPartActive('chromatid-left') ? 3.5 : 1.8}
              filter={isPartActive('chromatid-left') ? 'url(#chromosome-glow)' : undefined}
            />

            {/* Left Lower Arm (q-arm / الذراع الطويل) */}
            <path
              d="M 488 315 
                 C 465 370, 430 435, 395 500 
                 C 380 528, 392 548, 422 548 
                 C 452 548, 468 522, 482 470 
                 C 494 415, 496 350, 498 320 Z"
              fill="url(#chromatid-3d-left)"
              stroke={isPartActive('chromatid-left') ? '#ffffff' : '#6366f1'}
              strokeWidth={isPartActive('chromatid-left') ? 3.5 : 1.8}
              filter={isPartActive('chromatid-left') ? 'url(#chromosome-glow)' : undefined}
            />

            {/* Left Chromatid G-Bands (حزم الكروماتين) */}
            {showBanding && (
              <g opacity="0.45" stroke="#1e1b4b" strokeWidth="4" strokeLinecap="round">
                {/* Upper arm bands */}
                <line x1="430" y1="105" x2="455" y2="108" />
                <line x1="440" y1="140" x2="468" y2="144" />
                <line x1="458" y1="190" x2="482" y2="194" strokeWidth="6" />
                {/* Lower arm bands */}
                <line x1="480" y1="365" x2="496" y2="368" strokeWidth="5" />
                <line x1="458" y1="415" x2="480" y2="418" strokeWidth="6" />
                <line x1="432" y1="465" x2="458" y2="468" strokeWidth="5" />
                <line x1="405" y1="515" x2="432" y2="518" strokeWidth="6" />
              </g>
            )}

            {/* Telomeres at Left Tips (القطع الطرفية) */}
            <circle cx="432" cy="72" r="8" fill="#34d399" opacity="0.85" />
            <circle cx="408" cy="535" r="9" fill="#34d399" opacity="0.85" />
          </g>

          {/* ---------------------------------------------------------
              RIGHT SISTER CHROMATID (الكروماتيد الأيمن)
             --------------------------------------------------------- */}
          <g
            id="part-chromatid-right"
            className="cursor-pointer transition-all duration-300"
            onClick={() => onSelectPart('chromatid-right')}
            onMouseEnter={() => onHoverPart('chromatid-right')}
            onMouseLeave={() => onHoverPart(null)}
          >
            {/* Right Upper Arm (p-arm) */}
            <path
              d="M 512 285 
                 C 530 240, 558 180, 580 120 
                 C 590 92, 580 70, 556 68 
                 C 532 66, 522 88, 516 125 
                 C 510 170, 506 235, 502 280 Z"
              fill="url(#chromatid-3d-right)"
              stroke={isPartActive('chromatid-right') ? '#ffffff' : '#0284c7'}
              strokeWidth={isPartActive('chromatid-right') ? 3.5 : 1.8}
              filter={isPartActive('chromatid-right') ? 'url(#chromosome-glow)' : undefined}
            />

            {/* Right Lower Arm (q-arm) */}
            <path
              d="M 512 315 
                 C 535 370, 570 435, 605 500 
                 C 620 528, 608 548, 578 548 
                 C 548 548, 532 522, 518 470 
                 C 506 415, 504 350, 502 320 Z"
              fill="url(#chromatid-3d-right)"
              stroke={isPartActive('chromatid-right') ? '#ffffff' : '#0284c7'}
              strokeWidth={isPartActive('chromatid-right') ? 3.5 : 1.8}
              filter={isPartActive('chromatid-right') ? 'url(#chromosome-glow)' : undefined}
            />

            {/* Right Chromatid G-Bands */}
            {showBanding && (
              <g opacity="0.45" stroke="#082f49" strokeWidth="4" strokeLinecap="round">
                {/* Upper arm bands */}
                <line x1="545" y1="108" x2="570" y2="105" />
                <line x1="532" y1="144" x2="560" y2="140" />
                <line x1="518" y1="194" x2="542" y2="190" strokeWidth="6" />
                {/* Lower arm bands */}
                <line x1="504" y1="368" x2="520" y2="365" strokeWidth="5" />
                <line x1="520" y1="418" x2="542" y2="415" strokeWidth="6" />
                <line x1="542" y1="468" x2="568" y2="465" strokeWidth="5" />
                <line x1="568" y1="518" x2="595" y2="515" strokeWidth="6" />
              </g>
            )}

            {/* Telomeres at Right Tips */}
            <circle cx="568" cy="72" r="8" fill="#34d399" opacity="0.85" />
            <circle cx="592" cy="535" r="9" fill="#34d399" opacity="0.85" />
          </g>

          {/* ---------------------------------------------------------
              CENTROMERE & KINETOCHORE (القطعة المركزية والقرص الحركي)
             --------------------------------------------------------- */}
          <g
            id="part-centromere"
            className="cursor-pointer transition-transform duration-300 hover:scale-110"
            onClick={() => onSelectPart('centromere')}
            onMouseEnter={() => onHoverPart('centromere')}
            onMouseLeave={() => onHoverPart(null)}
          >
            {/* Primary Constriction Waist */}
            <ellipse
              cx="500"
              cy="300"
              rx="24"
              ry="18"
              fill="url(#centromere-3d)"
              stroke={isPartActive('centromere') ? '#ffffff' : '#f59e0b'}
              strokeWidth={isPartActive('centromere') ? 3.5 : 2}
              filter={isPartActive('centromere') ? 'url(#chromosome-glow)' : undefined}
            />

            {/* Left Kinetochore Plate with Microtubule Fibers */}
            <rect x="472" y="292" width="7" height="16" rx="3.5" fill="#fde047" stroke="#b45309" strokeWidth="1" />
            <line x1="472" y1="300" x2="445" y2="300" stroke="#fef08a" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />

            {/* Right Kinetochore Plate with Microtubule Fibers */}
            <rect x="521" y="292" width="7" height="16" rx="3.5" fill="#fde047" stroke="#b45309" strokeWidth="1" />
            <line x1="528" y1="300" x2="555" y2="300" stroke="#fef08a" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />

            <text x="500" y="304" textAnchor="middle" fontSize="10" fontWeight="black" fill="#78350f">
              C
            </text>
          </g>

          {/* ---------------------------------------------------------
              DNA UNRAVELING, NUCLEOSOMES & DOUBLE HELIX (خيوط الـ DNA الملتفة)
             --------------------------------------------------------- */}
          {showDnaUnravel && (
            <g
              id="part-chromatin-loops"
              className="cursor-pointer"
              onClick={() => onSelectPart('chromatin-loops')}
              onMouseEnter={() => onHoverPart('chromatin-loops')}
              onMouseLeave={() => onHoverPart(null)}
              filter={isPartActive('chromatin-loops') ? 'url(#dna-glow)' : undefined}
            >
              {/* Coiling fiber emerging from Upper Right Arm */}
              <path
                d="M 570 70 
                   C 600 50, 630 35, 670 45 
                   C 710 55, 730 85, 765 80
                   C 800 75, 830 50, 870 55"
                fill="none"
                stroke="#ec4899"
                strokeWidth={isPartActive('chromatin-loops') ? 3.5 : 2.5}
                strokeLinecap="round"
              />

              {/* Nucleosome Beads-on-a-string (هستونات ملفوفة بـ DNA) */}
              {[
                { cx: 640, cy: 40 },
                { cx: 670, cy: 46 },
                { cx: 700, cy: 58 },
                { cx: 730, cy: 82 },
                { cx: 760, cy: 80 },
                { cx: 790, cy: 72 },
              ].map((bead, i) => (
                <g key={`bead-${i}`} transform={`translate(${bead.cx}, ${bead.cy})`}>
                  <circle cx="0" cy="0" r="6" fill="#f43f5e" stroke="#ffe4e6" strokeWidth="1" />
                  <path d="M -5 0 A 5 5 0 1 1 5 0" fill="none" stroke="#f472b6" strokeWidth="1.2" />
                </g>
              ))}

              {/* Unwound DNA Double Helix (حلزون الـ DNA المزدوج) */}
              <g transform="translate(820, 60)">
                {/* Strand 1 */}
                <path
                  d="M 0 0 C 15 -18, 30 18, 45 0 C 60 -18, 75 18, 90 0 C 105 -18, 120 18, 135 0"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />
                {/* Strand 2 */}
                <path
                  d="M 0 0 C 15 18, 30 -18, 45 0 C 60 18, 75 -18, 90 0 C 105 18, 120 -18, 135 0"
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2.5"
                />
                {/* Base pairs (درجات سلم الـ DNA) */}
                {[10, 22, 35, 55, 67, 80, 100, 112, 125].map((bx, i) => (
                  <line
                    key={`bp-${i}`}
                    x1={bx}
                    y1={-8}
                    x2={bx}
                    y2={8}
                    stroke={i % 2 === 0 ? '#fbbf24' : '#34d399'}
                    strokeWidth="1.8"
                  />
                ))}
              </g>

              {/* Annotation badge for DNA */}
              <g transform="translate(850, 32)">
                <rect x="-60" y="-12" width="120" height="20" rx="5" fill="#0f172a" stroke="#ec4899" strokeWidth="1" />
                <text x="0" y="2" textAnchor="middle" fill="#f472b6" fontSize="9" fontWeight="bold">
                  حلزون الـ DNA المزدوج
                </text>
              </g>
            </g>
          )}

          {/* Arm Dimension Labels (p-arm and q-arm indicator brackets) */}
          <g opacity="0.75">
            {/* Short Arm (p-arm) label */}
            <path d="M 390 70 L 375 70 L 375 180 L 365 180 M 375 180 L 375 285 L 390 285" fill="none" stroke="#94a3b8" strokeWidth="1.2" />
            <text x="355" y="184" textAnchor="end" fill="#94a3b8" fontSize="10" fontWeight="bold">
              الذراع القصير (p-arm)
            </text>

            {/* Long Arm (q-arm) label */}
            <path d="M 370 315 L 355 315 L 355 430 L 345 430 M 355 430 L 355 545 L 370 545" fill="none" stroke="#94a3b8" strokeWidth="1.2" />
            <text x="335" y="434" textAnchor="end" fill="#94a3b8" fontSize="10" fontWeight="bold">
              الذراع الطويل (q-arm)
            </text>
          </g>
        </g>

        {/* =========================================================
            CALLOUT LABELS & POINTERS LAYER
           ========================================================= */}
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
                    stroke={active ? part.color : 'rgba(148, 163, 184, 0.4)'}
                    strokeWidth={active ? 2.4 : 1.2}
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
                      {part.nameAr.length > 28 ? part.nameAr.slice(0, 27) + '...' : part.nameAr}
                    </text>
                    <text
                      x={anchor === 'end' ? -85 : anchor === 'middle' ? 5 : 85}
                      y="11"
                      textAnchor="middle"
                      fill={active ? part.color : '#94a3b8'}
                      fontSize="8.5"
                      className="font-mono"
                    >
                      {part.nameEn.length > 32 ? part.nameEn.slice(0, 30) + '...' : part.nameEn}
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
