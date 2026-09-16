import React, { useState } from 'react';
import { DiagramPart } from '../types';
import { FlaskConical, Play } from 'lucide-react';

interface DiffusionExpSVGProps {
  parts: DiagramPart[];
  selectedPartId: string | null;
  hoveredPartId: string | null;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string | null) => void;
  showLabels?: boolean;
}

export const DiffusionExpSVG: React.FC<DiffusionExpSVGProps> = ({
  parts,
  selectedPartId,
  hoveredPartId,
  onSelectPart,
  onHoverPart,
  showLabels = true,
}) => {
  const [activeBeaker, setActiveBeaker] = useState<1 | 2 | 3 | null>(null);

  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  return (
    <div className="relative w-full overflow-hidden select-none flex flex-col items-center">
      
      {/* Interactive Phase Info Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between px-4 py-2 mb-2 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <FlaskConical className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold text-slate-200">
            تجربة الانتشار (Diffusion Experiment) في سائل:
          </span>
        </div>
        <span className="text-xs text-slate-400">
          انتقال جزيئات المادة المذابة من منطقة التركيز العالي إلى منطقة التركيز الواطئ
        </span>
      </div>

      <svg
        viewBox="0 0 1000 600"
        className="w-full h-auto max-h-[600px] drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="diff-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Liquid gradients */}
          <linearGradient id="beaker1-water" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.2" />
            <stop offset="90%" stopColor="#0284c7" stopOpacity="0.35" />
            <stop offset="92%" stopColor="#7c3aed" stopOpacity="0.9" />
          </linearGradient>

          <radialGradient id="beaker2-diff" cx="50%" cy="85%" r="60%">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.95" />
            <stop offset="40%" stopColor="#8b5cf6" stopOpacity="0.75" />
            <stop offset="80%" stopColor="#38bdf8" stopOpacity="0.3" />
          </radialGradient>

          <linearGradient id="beaker3-homo" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#6d28d9" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {/* Ambient Dark Canvas */}
        <rect width="1000" height="600" fill="#030712" rx="20" />

        {/* Lab bench table line */}
        <rect x="50" y="490" width="900" height="12" rx="4" fill="#1e293b" />
        <rect x="40" y="502" width="920" height="6" rx="2" fill="#0f172a" />

        {/* =========================================================
            BEAKER 1: Initial drop of Crystal (وضع البلورة)
           ========================================================= */}
        <g
          id="crystal-drop-group"
          className="cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
          onClick={() => {
            setActiveBeaker(1);
            onSelectPart('crystal-drop');
          }}
          onMouseEnter={() => onHoverPart('crystal-drop')}
          onMouseLeave={() => onHoverPart(null)}
        >
          {/* Glass Beaker */}
          <path
            d="M 120 170 L 120 480 Q 120 490 130 490 L 270 490 Q 280 490 280 480 L 280 170"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="3.5"
          />
          {/* Beaker Lip */}
          <path d="M 112 170 L 128 170 M 272 170 L 288 170" stroke="#94a3b8" strokeWidth="3" />
          {/* Meniscus / Water level */}
          <path
            d="M 122 220 Q 200 230 278 220 L 278 488 L 122 488 Z"
            fill="url(#beaker1-water)"
          />
          {/* Graduation marks */}
          <line x1="120" y1="260" x2="135" y2="260" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="120" y1="310" x2="145" y2="310" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="120" y1="360" x2="135" y2="360" stroke="#cbd5e1" strokeWidth="1.5" />
          <line x1="120" y1="410" x2="145" y2="410" stroke="#cbd5e1" strokeWidth="1.5" />

          {/* Solid Concentrated Crystal at the bottom (كبريتات النحاس / برمنغنات) */}
          <path
            d="M 185 486 L 195 465 L 210 460 L 220 472 L 215 488 L 195 488 Z"
            fill="#6d28d9"
            stroke={isPartActive('crystal-drop') ? '#ffffff' : '#c084fc'}
            strokeWidth={isPartActive('crystal-drop') ? 3 : 1.5}
            filter={isPartActive('crystal-drop') ? 'url(#diff-glow)' : undefined}
          />
          <text x="200" y="525" textAnchor="middle" fill="#c084fc" fontSize="12" fontWeight="bold">
            (أ) وضع البلورة
          </text>
          <text x="200" y="545" textAnchor="middle" fill="#94a3b8" fontSize="10">
            تركيز فائق في القاع فقط
          </text>
        </g>

        {/* Transition Arrow 1 -> 2 */}
        <g transform="translate(320, 330)">
          <path d="M 0 0 L 40 0" stroke="#6366f1" strokeWidth="3" markerEnd="url(#arrow)" />
          <polygon points="45,0 35,-6 35,6" fill="#6366f1" />
          <text x="20" y="-12" textAnchor="middle" fill="#818cf8" fontSize="9" fontWeight="bold">تدفق</text>
        </g>

        {/* =========================================================
            BEAKER 2: Spreading Diffusion Stage (انتشار المادة)
           ========================================================= */}
        <g
          id="spreading-phase-group"
          className="cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
          onClick={() => {
            setActiveBeaker(2);
            onSelectPart('spreading-phase');
          }}
          onMouseEnter={() => onHoverPart('spreading-phase')}
          onMouseLeave={() => onHoverPart(null)}
        >
          {/* Glass Beaker */}
          <path
            d="M 420 170 L 420 480 Q 420 490 430 490 L 570 490 Q 580 490 580 480 L 580 170"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="3.5"
          />
          {/* Beaker Lip */}
          <path d="M 412 170 L 428 170 M 572 170 L 588 170" stroke="#94a3b8" strokeWidth="3" />
          {/* Water with spreading purple cloud */}
          <path
            d="M 422 220 Q 500 230 578 220 L 578 488 L 422 488 Z"
            fill="url(#beaker2-diff)"
          />

          {/* Upward diffusion plume lines */}
          <g opacity="0.6">
            <path d="M 500 480 Q 480 380 450 320" stroke="#c084fc" strokeWidth="2" fill="none" strokeDasharray="4 3" />
            <path d="M 500 480 Q 500 360 500 280" stroke="#c084fc" strokeWidth="2.5" fill="none" strokeDasharray="4 3" />
            <path d="M 500 480 Q 520 380 550 320" stroke="#c084fc" strokeWidth="2" fill="none" strokeDasharray="4 3" />
          </g>

          {/* Floating diffusing particle dots */}
          {[
            { cx: 490, cy: 450 }, { cx: 510, cy: 430 }, { cx: 470, cy: 400 },
            { cx: 530, cy: 390 }, { cx: 480, cy: 350 }, { cx: 520, cy: 340 },
            { cx: 460, cy: 300 }, { cx: 540, cy: 290 }, { cx: 500, cy: 260 }
          ].map((pt, i) => (
            <circle key={i} cx={pt.cx} cy={pt.cy} r="4" fill="#e9d5ff" className="animate-particle-drift" />
          ))}

          <text x="500" y="525" textAnchor="middle" fill="#c084fc" fontSize="12" fontWeight="bold">
            (ب) بدء الانتشار
          </text>
          <text x="500" y="545" textAnchor="middle" fill="#94a3b8" fontSize="10">
            صعود الجزيئات بفعل الحركة البراونية
          </text>
        </g>

        {/* Transition Arrow 2 -> 3 */}
        <g transform="translate(620, 330)">
          <polygon points="45,0 35,-6 35,6" fill="#6366f1" />
          <path d="M 0 0 L 40 0" stroke="#6366f1" strokeWidth="3" />
          <text x="20" y="-12" textAnchor="middle" fill="#818cf8" fontSize="9" fontWeight="bold">اكتمال</text>
        </g>

        {/* =========================================================
            BEAKER 3: Uniform Solution Stage (محلول متجانس)
           ========================================================= */}
        <g
          id="uniform-solution-group"
          className="cursor-pointer transition-transform duration-300 hover:scale-[1.02]"
          onClick={() => {
            setActiveBeaker(3);
            onSelectPart('uniform-solution');
          }}
          onMouseEnter={() => onHoverPart('uniform-solution')}
          onMouseLeave={() => onHoverPart(null)}
        >
          {/* Glass Beaker */}
          <path
            d="M 720 170 L 720 480 Q 720 490 730 490 L 870 490 Q 880 490 880 480 L 880 170"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="3.5"
          />
          {/* Beaker Lip */}
          <path d="M 712 170 L 728 170 M 872 170 L 888 170" stroke="#94a3b8" strokeWidth="3" />
          {/* Uniform evenly colored solution */}
          <path
            d="M 722 220 Q 800 230 878 220 L 878 488 L 722 488 Z"
            fill="url(#beaker3-homo)"
            stroke={isPartActive('uniform-solution') ? '#ffffff' : 'none'}
            strokeWidth={isPartActive('uniform-solution') ? 2 : 0}
            filter={isPartActive('uniform-solution') ? 'url(#diff-glow)' : undefined}
          />

          {/* Evenly distributed particles throughout */}
          {Array.from({ length: 24 }).map((_, i) => {
            const row = Math.floor(i / 4);
            const col = i % 4;
            const px = 745 + col * 36 + (row % 2) * 10;
            const py = 250 + row * 38;
            return <circle key={i} cx={px} cy={py} r="3" fill="#ffffff" opacity="0.75" />;
          })}

          <text x="800" y="525" textAnchor="middle" fill="#c084fc" fontSize="12" fontWeight="bold">
            (جـ) محلول متجانس
          </text>
          <text x="800" y="545" textAnchor="middle" fill="#94a3b8" fontSize="10">
            تساوي التراكيز وانعدام التدرج
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
