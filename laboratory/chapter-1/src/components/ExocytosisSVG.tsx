import React, { useState, useEffect } from 'react';
import { DiagramPart } from '../types';
import { Sparkles, Play, Pause } from 'lucide-react';

interface ExocytosisSVGProps {
  parts: DiagramPart[];
  selectedPartId: string | null;
  hoveredPartId: string | null;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string | null) => void;
  showLabels?: boolean;
}

export const ExocytosisSVG: React.FC<ExocytosisSVGProps> = ({
  parts,
  selectedPartId,
  hoveredPartId,
  onSelectPart,
  onHoverPart,
  showLabels = true,
}) => {
  const [stage, setStage] = useState<number>(1);
  const [autoPlay, setAutoPlay] = useState<boolean>(true);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setStage((prev) => (prev >= 3 ? 1 : prev + 1));
    }, 2500);
    return () => clearInterval(interval);
  }, [autoPlay]);

  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  return (
    <div className="relative w-full overflow-hidden select-none flex flex-col items-center">
      
      {/* Top Interactive Stage Controller */}
      <div className="w-full max-w-3xl flex items-center justify-between px-4 py-2 mb-2 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Sparkles className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold text-slate-200">
            مراحل الإخراج الخلوي (Exocytosis):
          </span>
        </div>

        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStage(s);
                setAutoPlay(false);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                stage === s
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {s === 1 && '1. هجرة الحويصلة الإفرازية'}
              {s === 2 && '2. اندماج الحويصلة مع الغشاء'}
              {s === 3 && '3. تحرر المواد الإفرازية'}
            </button>
          ))}

          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1"
          >
            {autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <svg
        viewBox="0 0 1000 600"
        className="w-full h-auto max-h-[600px] drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="exo-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="exo-vesicle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          <radialGradient id="cyto-exo-grad" cx="50%" cy="100%" r="70%">
            <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#090d16" stopOpacity="0.95" />
          </radialGradient>
        </defs>

        {/* Ambient Dark Canvas */}
        <rect width="1000" height="600" fill="#030712" rx="20" />

        {/* Outside Cell (خارج الخلية) */}
        <rect x="0" y="0" width="1000" height="230" fill="#022c22" fillOpacity="0.25" />
        <text x="60" y="55" fill="#6ee7b7" fontSize="13" fontWeight="bold">
          خارج الخلية (وسط التحرير الإفرازي)
        </text>

        {/* Inside Cell (داخل الخلية) */}
        <rect x="0" y="230" width="1000" height="370" fill="url(#cyto-exo-grad)" />
        <text x="60" y="560" fill="#818cf8" fontSize="13" fontWeight="bold">
          داخل الخلية (سيتوبلازم وتكوين الإفرازات)
        </text>

        {/* Dynamic Organic Living Plasma Membrane */}
        <g className="animate-organic-wobble" transform-origin="500 230">
          <path
            id="exo-plasma-membrane"
            d={
              stage === 1
                ? 'M 0 230 C 250 225, 450 235, 500 232 C 550 230, 750 225, 1000 230 L 1000 255 C 750 250, 550 255, 500 257 C 450 260, 250 250, 0 255 Z'
                : stage === 2
                ? 'M 0 230 C 250 225, 420 232, 455 240 C 465 245, 460 300, 500 300 C 540 300, 535 245, 545 240 C 580 232, 750 225, 1000 230 L 1000 255 C 750 250, 580 257, 560 260 C 545 275, 545 325, 500 325 C 455 325, 455 275, 440 260 C 420 257, 250 250, 0 255 Z'
                : 'M 0 230 C 250 225, 410 230, 440 240 C 455 248, 470 270, 500 270 C 530 270, 545 248, 560 240 C 590 230, 750 225, 1000 230 L 1000 255 C 750 250, 590 255, 560 265 C 545 270, 535 295, 500 295 C 465 295, 455 270, 440 265 C 410 255, 250 250, 0 255 Z'
            }
            fill="#059669"
            fillOpacity="0.45"
            stroke={isPartActive('plasma-membrane') ? '#a7f3d0' : '#10b981'}
            strokeWidth={isPartActive('plasma-membrane') ? 4 : 2}
            filter={isPartActive('plasma-membrane') ? 'url(#exo-glow)' : undefined}
            className="cursor-pointer transition-all duration-700 ease-in-out"
            onClick={() => onSelectPart('plasma-membrane')}
            onMouseEnter={() => onHoverPart('plasma-membrane')}
            onMouseLeave={() => onHoverPart(null)}
          />

          {/* Lipid beads along undulating membrane */}
          {Array.from({ length: 24 }).map((_, i) => (
            <circle
              key={i}
              cx={25 + i * 40}
              cy={230 + Math.sin(i * 0.7) * 4}
              r="4.5"
              fill="#6ee7b7"
              stroke="#047857"
              strokeWidth="1"
              opacity="0.85"
            />
          ))}
        </g>

        {/* Migrating Secretory Vesicle inside Cytoplasm */}
        <g
          id="secretory-vesicle"
          className="cursor-pointer transition-all duration-700 ease-in-out"
          onClick={() => onSelectPart('secretory-vesicle')}
          onMouseEnter={() => onHoverPart('secretory-vesicle')}
          onMouseLeave={() => onHoverPart(null)}
          transform={`translate(0, ${stage === 1 ? 0 : stage === 2 ? -130 : -220})`}
        >
          {stage === 1 && (
            <g>
              <circle
                cx="500"
                cy="440"
                r="46"
                fill="url(#exo-vesicle-grad)"
                stroke={isPartActive('secretory-vesicle') ? '#ffffff' : '#34d399'}
                strokeWidth={isPartActive('secretory-vesicle') ? 3.5 : 2}
                filter="url(#exo-glow)"
              />
              {/* Membrane border beads */}
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i / 12) * Math.PI * 2;
                return (
                  <circle
                    key={i}
                    cx={500 + Math.cos(angle) * 46}
                    cy={440 + Math.sin(angle) * 46}
                    r="3.5"
                    fill="#a7f3d0"
                  />
                );
              })}
            </g>
          )}

          {/* Internal Secretory Granules / Products */}
          <g>
            <circle cx="490" cy="430" r="7" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
            <circle cx="515" cy="425" r="8" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
            <circle cx="485" cy="450" r="6.5" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
            <circle cx="510" cy="455" r="7" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
            <circle cx="500" cy="440" r="5" fill="#fde047" />
          </g>
        </g>

        {/* Expelled Content / Waste / Cellular secretions in extracellular medium (Stage 3) */}
        {stage === 3 && (
          <g
            id="expelled-content"
            className="cursor-pointer"
            onClick={() => onSelectPart('expelled-content')}
            onMouseEnter={() => onHoverPart('expelled-content')}
            onMouseLeave={() => onHoverPart(null)}
          >
            {[
              { cx: 470, cy: 150, r: 8, color: '#fbbf24' },
              { cx: 530, cy: 130, r: 9, color: '#f59e0b' },
              { cx: 500, cy: 90, r: 7.5, color: '#fde047' },
              { cx: 440, cy: 110, r: 7, color: '#fbbf24' },
              { cx: 560, cy: 100, r: 8, color: '#f59e0b' },
              { cx: 510, cy: 60, r: 8.5, color: '#fde047' },
            ].map((p, i) => (
              <g key={i} className="animate-particle-drift">
                <circle cx={p.cx} cy={p.cy} r={p.r} fill={p.color} stroke="#ffffff" strokeWidth="1.5" filter="url(#exo-glow)" />
              </g>
            ))}

            {/* Dispersion wave rings */}
            <circle cx="500" cy="200" r="40" fill="none" stroke="#34d399" strokeWidth="1.5" opacity="0.6" strokeDasharray="4 4" />
            <circle cx="500" cy="200" r="80" fill="none" stroke="#34d399" strokeWidth="1" opacity="0.4" strokeDasharray="6 6" />
          </g>
        )}

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
