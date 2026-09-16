import React, { useState, useEffect } from 'react';
import { DiagramPart } from '../types';
import { Zap, Play, Pause, RotateCcw } from 'lucide-react';

interface ActiveTransportSVGProps {
  parts: DiagramPart[];
  selectedPartId: string | null;
  hoveredPartId: string | null;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string | null) => void;
  showLabels?: boolean;
}

export const ActiveTransportSVG: React.FC<ActiveTransportSVGProps> = ({
  parts,
  selectedPartId,
  hoveredPartId,
  onSelectPart,
  onHoverPart,
  showLabels = true,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [cyclePhase, setCyclePhase] = useState<'capture' | 'atp-bind' | 'pumping' | 'release'>('capture');

  // Active transport pump cycle animation
  useEffect(() => {
    if (!isPlaying) return;
    const phases: Array<'capture' | 'atp-bind' | 'pumping' | 'release'> = [
      'capture',
      'atp-bind',
      'pumping',
      'release',
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % phases.length;
      setCyclePhase(phases[idx]);
    }, 1800);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  return (
    <div className="relative w-full overflow-hidden select-none flex flex-col items-center">
      
      {/* Top Interactive Transport Control Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between px-4 py-2 mb-2 bg-slate-900/70 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Zap className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold text-slate-200">
            حالة المضخة الحيوية:
          </span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 font-mono border border-slate-700">
            {cyclePhase === 'capture' && '1. التقاط الأيون من الوسط واطئ التركيز'}
            {cyclePhase === 'atp-bind' && '2. ارتباط جزيء ATP وتحلله مائياً'}
            {cyclePhase === 'pumping' && '3. تغير الشكل الفراغي للبروتين الحامل'}
            {cyclePhase === 'release' && '4. ضخ الأيون إلى الوسط عالي التركيز'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}</span>
          </button>
          <button
            onClick={() => setCyclePhase('capture')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs flex items-center gap-1"
            title="إعادة التدوير"
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
          <filter id="active-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="pump-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#0891b2" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0e7490" stopOpacity="0.95" />
          </linearGradient>

          <radialGradient id="atp-flash-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="1" />
            <stop offset="60%" stopColor="#eab308" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Dark Canvas */}
        <rect width="1000" height="600" fill="#030712" rx="20" />

        {/* Top: Low concentration area (خارج الخلية) */}
        <g
          id="low-conc-zone"
          className="cursor-pointer"
          onClick={() => onSelectPart('low-conc-zone')}
          onMouseEnter={() => onHoverPart('low-conc-zone')}
          onMouseLeave={() => onHoverPart(null)}
        >
          <rect x="20" y="20" width="960" height="190" fill="#0c4a6e" fillOpacity="0.12" rx="12" />
          <text x="50" y="60" fill="#7dd3fc" fontSize="13" fontWeight="bold">
            خارج الخلية (تركيز واطئ للأيونات)
          </text>

          {/* Sparse ions in low concentration */}
          {[
            { cx: 120, cy: 90 }, { cx: 220, cy: 130 }, { cx: 340, cy: 80 },
            { cx: 680, cy: 100 }, { cx: 790, cy: 75 }, { cx: 900, cy: 120 },
            { cx: 850, cy: 160 }, { cx: 180, cy: 160 }
          ].map((ion, i) => (
            <g key={i} className="animate-particle-drift">
              <circle cx={ion.cx} cy={ion.cy} r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
              <text x={ion.cx} y={ion.cy + 3} textAnchor="middle" fill="#082f49" fontSize="8" fontWeight="bold">+</text>
            </g>
          ))}
        </g>

        {/* Dynamic moving ion inside pump during animation */}
        <circle
          cx="510"
          cy={
            cyclePhase === 'capture'
              ? 170
              : cyclePhase === 'atp-bind'
              ? 250
              : cyclePhase === 'pumping'
              ? 320
              : 430
          }
          r="8"
          fill="#38bdf8"
          stroke="#ffffff"
          strokeWidth="2"
          className="transition-all duration-700 ease-in-out"
          filter="drop-shadow(0 0 8px #38bdf8)"
        />

        {/* Undulating Living Organic Phospholipid Bilayer */}
        <g className="animate-organic-wobble" transform-origin="500 290">
          
          {/* Left Phospholipid Segment */}
          <g>
            {/* Top row lipid heads */}
            {Array.from({ length: 14 }).map((_, i) => {
              const x = 50 + i * 28;
              const y = 230 + Math.sin(i * 0.5) * 5;
              return (
                <g key={`l-top-${i}`}>
                  <circle cx={x} cy={y} r="8.5" fill="#f59e0b" stroke="#d97706" strokeWidth="1.2" />
                  <path d={`M ${x - 3} ${y + 8} Q ${x - 6} ${y + 25} ${x - 3} ${y + 40}`} stroke="#fbbf24" strokeWidth="1.8" fill="none" />
                  <path d={`M ${x + 3} ${y + 8} Q ${x + 6} ${y + 25} ${x + 3} ${y + 40}`} stroke="#fbbf24" strokeWidth="1.8" fill="none" />
                </g>
              );
            })}

            {/* Bottom row lipid heads */}
            {Array.from({ length: 14 }).map((_, i) => {
              const x = 50 + i * 28;
              const y = 330 + Math.sin(i * 0.5) * 5;
              return (
                <g key={`l-bot-${i}`}>
                  <circle cx={x} cy={y} r="8.5" fill="#f59e0b" stroke="#d97706" strokeWidth="1.2" />
                  <path d={`M ${x - 3} ${y - 8} Q ${x - 6} ${y - 25} ${x - 3} ${y - 40}`} stroke="#fbbf24" strokeWidth="1.8" fill="none" />
                  <path d={`M ${x + 3} ${y - 8} Q ${x + 6} ${y - 25} ${x + 3} ${y - 40}`} stroke="#fbbf24" strokeWidth="1.8" fill="none" />
                </g>
              );
            })}
          </g>

          {/* Right Phospholipid Segment */}
          <g>
            {/* Top row lipid heads */}
            {Array.from({ length: 14 }).map((_, i) => {
              const x = 580 + i * 28;
              const y = 230 + Math.sin(i * 0.5) * 5;
              return (
                <g key={`r-top-${i}`}>
                  <circle cx={x} cy={y} r="8.5" fill="#f59e0b" stroke="#d97706" strokeWidth="1.2" />
                  <path d={`M ${x - 3} ${y + 8} Q ${x - 6} ${y + 25} ${x - 3} ${y + 40}`} stroke="#fbbf24" strokeWidth="1.8" fill="none" />
                  <path d={`M ${x + 3} ${y + 8} Q ${x + 6} ${y + 25} ${x + 3} ${y + 40}`} stroke="#fbbf24" strokeWidth="1.8" fill="none" />
                </g>
              );
            })}

            {/* Bottom row lipid heads */}
            {Array.from({ length: 14 }).map((_, i) => {
              const x = 580 + i * 28;
              const y = 330 + Math.sin(i * 0.5) * 5;
              return (
                <g key={`r-bot-${i}`}>
                  <circle cx={x} cy={y} r="8.5" fill="#f59e0b" stroke="#d97706" strokeWidth="1.2" />
                  <path d={`M ${x - 3} ${y - 8} Q ${x - 6} ${y - 25} ${x - 3} ${y - 40}`} stroke="#fbbf24" strokeWidth="1.8" fill="none" />
                  <path d={`M ${x + 3} ${y - 8} Q ${x + 6} ${y - 25} ${x + 3} ${y - 40}`} stroke="#fbbf24" strokeWidth="1.8" fill="none" />
                </g>
              );
            })}
          </g>

          {/* Carrier Protein / Active Pump (البروتين الحامل المتغير الشكل) */}
          <g
            id="carrier-protein"
            className="cursor-pointer transition-transform duration-500"
            onClick={() => onSelectPart('carrier-protein')}
            onMouseEnter={() => onHoverPart('carrier-protein')}
            onMouseLeave={() => onHoverPart(null)}
          >
            {/* Left Subunit of Pump */}
            <path
              d={
                cyclePhase === 'capture' || cyclePhase === 'atp-bind'
                  ? 'M 450 205 C 475 210, 480 250, 470 290 C 460 330, 440 350, 465 365 C 430 375, 410 320, 420 270 C 425 220, 435 205, 450 205 Z'
                  : 'M 465 205 C 485 215, 475 250, 485 290 C 495 330, 460 365, 445 365 C 430 365, 410 320, 420 270 C 425 220, 440 205, 465 205 Z'
              }
              fill="url(#pump-grad)"
              stroke={isPartActive('carrier-protein') ? '#67e8f9' : '#0891b2'}
              strokeWidth={isPartActive('carrier-protein') ? 3.5 : 2}
              filter={isPartActive('carrier-protein') ? 'url(#active-glow)' : undefined}
            />

            {/* Right Subunit of Pump */}
            <path
              d={
                cyclePhase === 'capture' || cyclePhase === 'atp-bind'
                  ? 'M 570 205 C 545 210, 540 250, 550 290 C 560 330, 580 350, 555 365 C 590 375, 610 320, 600 270 C 595 220, 585 205, 570 205 Z'
                  : 'M 555 205 C 535 215, 545 250, 535 290 C 525 330, 560 365, 575 365 C 590 365, 610 320, 600 270 C 595 220, 580 205, 555 205 Z'
              }
              fill="url(#pump-grad)"
              stroke={isPartActive('carrier-protein') ? '#67e8f9' : '#0891b2'}
              strokeWidth={isPartActive('carrier-protein') ? 3.5 : 2}
              filter={isPartActive('carrier-protein') ? 'url(#active-glow)' : undefined}
            />

            <text x="510" y="275" textAnchor="middle" fill="#cffafe" fontSize="10" fontWeight="bold" opacity="0.8">
              مضخة حيوية
            </text>
          </g>

          {/* ATP Energy Binding Site & Hydrolysis Spark */}
          <g
            id="atp-energy"
            className="cursor-pointer"
            onClick={() => onSelectPart('atp-energy')}
            onMouseEnter={() => onHoverPart('atp-energy')}
            onMouseLeave={() => onHoverPart(null)}
          >
            {/* Spark aura when ATP binds */}
            {(cyclePhase === 'atp-bind' || cyclePhase === 'pumping') && (
              <circle cx="560" cy="360" r="30" fill="url(#atp-flash-grad)" className="animate-pulse" />
            )}

            {/* ATP Badge */}
            <g transform="translate(530, 360)">
              <rect x="0" y="0" width="70" height="26" rx="8" fill="#ca8a04" stroke="#fef08a" strokeWidth="1.5" />
              <text x="35" y="17" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="black">
                {cyclePhase === 'pumping' || cyclePhase === 'release' ? 'ADP + Pi' : 'ATP ⚡'}
              </text>
            </g>

            {/* Arrow showing ATP hydrolysis */}
            <path d="M 505 385 Q 545 410 590 385" stroke="#facc15" strokeWidth="2" fill="none" markerEnd="url(#arrow)" />
          </g>
        </g>

        {/* Bottom: High concentration area (داخل الخلية) */}
        <g
          id="high-conc-zone"
          className="cursor-pointer"
          onClick={() => onSelectPart('high-conc-zone')}
          onMouseEnter={() => onHoverPart('high-conc-zone')}
          onMouseLeave={() => onHoverPart(null)}
        >
          <rect x="20" y="390" width="960" height="190" fill="#3b0764" fillOpacity="0.15" rx="12" />
          <text x="50" y="430" fill="#d8b4fe" fontSize="13" fontWeight="bold">
            داخل الخلية السيتوبلازم (تركيز عالي للأيونات)
          </text>

          {/* Densely packed ions in high concentration */}
          {[
            { cx: 80, cy: 460 }, { cx: 140, cy: 490 }, { cx: 190, cy: 450 }, { cx: 230, cy: 520 },
            { cx: 290, cy: 470 }, { cx: 340, cy: 540 }, { cx: 390, cy: 460 }, { cx: 440, cy: 510 },
            { cx: 620, cy: 460 }, { cx: 670, cy: 520 }, { cx: 720, cy: 450 }, { cx: 770, cy: 530 },
            { cx: 820, cy: 480 }, { cx: 880, cy: 540 }, { cx: 920, cy: 460 }, { cx: 950, cy: 510 },
            { cx: 160, cy: 550 }, { cx: 270, cy: 430 }, { cx: 740, cy: 490 }, { cx: 840, cy: 440 }
          ].map((ion, i) => (
            <circle key={i} cx={ion.cx} cy={ion.cy} r="6" fill="#a855f7" stroke="#ffffff" strokeWidth="1.2" />
          ))}
        </g>

        {/* Informative Pointers and Badges Layer */}
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
