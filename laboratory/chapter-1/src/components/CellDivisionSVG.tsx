import React, { useState, useEffect } from 'react';
import { DiagramPart } from '../types';
import { Play, Pause, RotateCcw, GitFork } from 'lucide-react';

interface CellDivisionSVGProps {
  type: 'mitosis' | 'meiosis';
  parts: DiagramPart[];
  selectedPartId: string | null;
  hoveredPartId: string | null;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string | null) => void;
  showLabels?: boolean;
}

export const CellDivisionSVG: React.FC<CellDivisionSVGProps> = ({
  type,
  parts,
  selectedPartId,
  hoveredPartId,
  onSelectPart,
  onHoverPart,
  showLabels = true,
}) => {
  const isMitosis = type === 'mitosis';
  const stages = isMitosis
    ? ['prophase', 'metaphase', 'anaphase', 'telophase']
    : ['prophase1', 'metaphase1', 'anaphase1', 'telophase2'];

  const [currentStageIdx, setCurrentStageIdx] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentStageIdx((prev) => (prev + 1) % stages.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [isPlaying, stages.length]);

  const currentStage = stages[currentStageIdx];
  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  return (
    <div className="relative w-full overflow-hidden select-none flex flex-col items-center">
      
      {/* Interactive Phase Controller */}
      <div className="w-full max-w-4xl flex items-center justify-between px-4 py-2 mb-2 bg-slate-900/80 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <GitFork className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold text-slate-200">
            {isMitosis ? 'أطوار الانقسام الخيطي (Mitosis):' : 'أطوار الانقسام الاختزالي (Meiosis):'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {stages.map((stg, idx) => (
            <button
              key={stg}
              onClick={() => {
                setCurrentStageIdx(idx);
                setIsPlaying(false);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                currentStageIdx === idx
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {isMitosis ? (
                <>
                  {idx === 0 && 'الطور التمهيدي'}
                  {idx === 1 && 'الطور الاستوائي'}
                  {idx === 2 && 'الطور الانفصالي'}
                  {idx === 3 && 'الطور النهائي'}
                </>
              ) : (
                <>
                  {idx === 0 && 'التمهيدي الأول (التعابر)'}
                  {idx === 1 && 'الاستوائي الأول'}
                  {idx === 2 && 'الانفصالي الأول'}
                  {idx === 3 && 'النهائي (4 خلايا)'}
                </>
              )}
            </button>
          ))}

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs ml-1"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <svg
        viewBox="0 0 1000 600"
        className="w-full h-auto max-h-[600px] drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="division-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <radialGradient id="div-cyto-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e1b4b" stopOpacity="0.5" />
            <stop offset="85%" stopColor="#0f172a" stopOpacity="0.9" />
          </radialGradient>
        </defs>

        {/* Ambient Dark Canvas */}
        <rect width="1000" height="600" fill="#030712" rx="20" />

        {/* Current Stage Indicator Banner */}
        <text x="500" y="45" textAnchor="middle" fill="#c7d2fe" fontSize="15" fontWeight="bold">
          {isMitosis
            ? currentStageIdx === 0
              ? 'الطور التمهيدي (Prophase) - تكاثف الكروموسومات وظهور خيوط المغزل'
              : currentStageIdx === 1
              ? 'الطور الاستوائي (Metaphase) - انتظام الكروموسومات على خط استواء المغزل'
              : currentStageIdx === 2
              ? 'الطور الانفصالي (Anaphase) - انكماش خيوط المغزل وسحب الكروماتيدات الشقيقة'
              : 'الطور النهائي وتخصر السيتوبلازم (Telophase & Cytokinesis) - تكوين خليتين'
            : currentStageIdx === 0
            ? 'الطور التمهيدي الأول - ظاهرة العبور والتعابر الوراثي وتكوين الرباعيات'
            : currentStageIdx === 1
            ? 'الطور الاستوائي الأول - اصطفاف أزواج الكروموسومات المتماثلة'
            : currentStageIdx === 2
            ? 'الطور الانفصالي الأول - انفصال الكروموسومات المتماثلة نحو القطبين'
            : 'الطور النهائي الثاني - تكوين 4 خلايا أحادية المجموعة الكروموسومية (1n)'}
        </text>

        {/* =========================================================
            DIVIDING CELL BODY - WAVY ORGANIC LIVING CLEAVAGE
           ========================================================= */}
        <g className="animate-organic-breathe" transform-origin="500 310">
          
          {/* Cell Membrane Shape depending on Telophase Cleavage Furrow */}
          <path
            id="cell-cleavage"
            d={
              currentStageIdx === 3
                ? /* Organic Telophase Cleavage Furrow (تخصر السيتوبلازم الحيوي المنحني) */
                  'M 240 160 C 370 150, 470 240, 500 270 C 530 240, 630 150, 760 160 C 850 170, 870 450, 760 460 C 630 470, 530 380, 500 350 C 470 380, 370 470, 240 460 C 140 450, 150 170, 240 160 Z'
                : /* Intact rounded organic living cell membrane (غير هندسية، كائن حي) */
                  'M 220 170 C 350 155, 650 155, 780 170 C 860 250, 860 370, 780 450 C 650 465, 350 465, 220 450 C 140 370, 140 250, 220 170 Z'
            }
            fill="url(#div-cyto-grad)"
            stroke={isPartActive('telophase-cleavage') || isPartActive('cleavage-furrow') ? '#fda4af' : '#6366f1'}
            strokeWidth={isPartActive('telophase-cleavage') || isPartActive('cleavage-furrow') ? 4 : 2}
            filter="url(#division-glow)"
            className="cursor-pointer transition-all duration-700 ease-in-out"
            onClick={() => onSelectPart(isMitosis ? 'telophase-cleavage' : 'cleavage-furrow')}
            onMouseEnter={() => onHoverPart(isMitosis ? 'telophase-cleavage' : 'cleavage-furrow')}
            onMouseLeave={() => onHoverPart(null)}
          />

          {/* Centrosomes / Aster Poles (النجوم والمريكزات في القطبين) */}
          {/* Left Pole (قطب الخلية الأيسر) */}
          <g
            id="left-pole"
            className="cursor-pointer transition-transform duration-300 hover:scale-110"
            onClick={() => onSelectPart('centrosome-asters')}
            onMouseEnter={() => onHoverPart('centrosome-asters')}
            onMouseLeave={() => onHoverPart(null)}
            transform={`translate(${currentStageIdx === 3 ? 310 : 250}, 310)`}
          >
            <circle cx="0" cy="0" r="14" fill="#f59e0b" stroke="#fde047" strokeWidth="2" filter="url(#division-glow)" />
            {/* Aster rays (خيوط النجم المنطلقة) */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              return (
                <line
                  key={i}
                  x1={Math.cos(angle) * 14}
                  y1={Math.sin(angle) * 14}
                  x2={Math.cos(angle) * 32}
                  y2={Math.sin(angle) * 32}
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  opacity="0.8"
                />
              );
            })}
          </g>

          {/* Right Pole (قطب الخلية الأيمن) */}
          <g
            id="right-pole"
            className="cursor-pointer transition-transform duration-300 hover:scale-110"
            onClick={() => onSelectPart('centrosome-asters')}
            onMouseEnter={() => onHoverPart('centrosome-asters')}
            onMouseLeave={() => onHoverPart(null)}
            transform={`translate(${currentStageIdx === 3 ? 690 : 750}, 310)`}
          >
            <circle cx="0" cy="0" r="14" fill="#f59e0b" stroke="#fde047" strokeWidth="2" filter="url(#division-glow)" />
            {/* Aster rays */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i / 12) * Math.PI * 2;
              return (
                <line
                  key={i}
                  x1={Math.cos(angle) * 14}
                  y1={Math.sin(angle) * 14}
                  x2={Math.cos(angle) * 32}
                  y2={Math.sin(angle) * 32}
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  opacity="0.8"
                />
              );
            })}
          </g>

          {/* Dynamic Spindle Fibers (خيوط المغزل المتوترة والمتحركة) */}
          <g
            id="spindle-fibers"
            className="cursor-pointer animate-spindle-pull"
            onClick={() => onSelectPart('spindle-fibers')}
            onMouseEnter={() => onHoverPart('spindle-fibers')}
            onMouseLeave={() => onHoverPart(null)}
          >
            {/* Upper spindle arc */}
            <path
              d={
                currentStageIdx === 3
                  ? 'M 310 310 Q 500 240 690 310'
                  : 'M 250 310 Q 500 180 750 310'
              }
              fill="none"
              stroke={isPartActive('spindle-fibers') ? '#ffffff' : '#38bdf8'}
              strokeWidth={isPartActive('spindle-fibers') ? 2.5 : 1.2}
              strokeDasharray="4 3"
            />
            {/* Center spindle straight rays to chromosomes */}
            <line x1={currentStageIdx === 3 ? 310 : 250} y1="310" x2={currentStageIdx === 2 ? 400 : 500} y2="240" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="5 3" />
            <line x1={currentStageIdx === 3 ? 310 : 250} y1="310" x2={currentStageIdx === 2 ? 400 : 500} y2="310" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="5 3" />
            <line x1={currentStageIdx === 3 ? 310 : 250} y1="310" x2={currentStageIdx === 2 ? 400 : 500} y2="380" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="5 3" />

            <line x1={currentStageIdx === 3 ? 690 : 750} y1="310" x2={currentStageIdx === 2 ? 600 : 500} y2="240" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="5 3" />
            <line x1={currentStageIdx === 3 ? 690 : 750} y1="310" x2={currentStageIdx === 2 ? 600 : 500} y2="310" stroke="#38bdf8" strokeWidth="1.8" strokeDasharray="5 3" />
            <line x1={currentStageIdx === 3 ? 690 : 750} y1="310" x2={currentStageIdx === 2 ? 600 : 500} y2="380" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="5 3" />

            {/* Lower spindle arc */}
            <path
              d={
                currentStageIdx === 3
                  ? 'M 310 310 Q 500 380 690 310'
                  : 'M 250 310 Q 500 440 750 310'
              }
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
          </g>

          {/* =========================================================
              CHROMOSOMES POSITIONING BASED ON STAGE
             ========================================================= */}
          {/* STAGE 0: PROPHASE (Chromatin condensing randomly inside nucleus) */}
          {currentStageIdx === 0 && (
            <g className="animate-organic-wobble" transform-origin="500 310">
              {/* Degrading nuclear envelope */}
              <circle cx="500" cy="310" r="95" fill="none" stroke="#a855f7" strokeWidth="2" strokeDasharray="8 6" opacity="0.6" />
              
              {/* Randomly condensing chromosome X-shapes */}
              <g transform="translate(460, 270) rotate(20)">
                <path d="M -15 -18 Q 0 0 15 18 M 15 -18 Q 0 0 -15 18" stroke="#ec4899" strokeWidth="4.5" strokeLinecap="round" />
                <circle cx="0" cy="0" r="3" fill="#facc15" />
              </g>
              <g transform="translate(530, 290) rotate(-35)">
                <path d="M -15 -18 Q 0 0 15 18 M 15 -18 Q 0 0 -15 18" stroke="#38bdf8" strokeWidth="4.5" strokeLinecap="round" />
                <circle cx="0" cy="0" r="3" fill="#facc15" />
              </g>
              <g transform="translate(480, 350) rotate(45)">
                <path d="M -15 -18 Q 0 0 15 18 M 15 -18 Q 0 0 -15 18" stroke="#ec4899" strokeWidth="4.5" strokeLinecap="round" />
                <circle cx="0" cy="0" r="3" fill="#facc15" />
              </g>
              <g transform="translate(535, 360) rotate(-15)">
                <path d="M -15 -18 Q 0 0 15 18 M 15 -18 Q 0 0 -15 18" stroke="#38bdf8" strokeWidth="4.5" strokeLinecap="round" />
                <circle cx="0" cy="0" r="3" fill="#facc15" />
              </g>
            </g>
          )}

          {/* STAGE 1: METAPHASE (Aligned on equatorial plate / خط الاستواء) */}
          {currentStageIdx === 1 && (
            <g
              id="metaphase-plate"
              className="cursor-pointer"
              onClick={() => onSelectPart(isMitosis ? 'metaphase-chromosomes' : 'homologous-pairs')}
              onMouseEnter={() => onHoverPart(isMitosis ? 'metaphase-chromosomes' : 'homologous-pairs')}
              onMouseLeave={() => onHoverPart(null)}
            >
              {/* Equatorial guide dashed line */}
              <line x1="500" y1="180" x2="500" y2="440" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.6" />

              {/* 3 Chromosomes lined up vertically with organic curves */}
              {[240, 310, 380].map((y, i) => (
                <g key={i} transform={`translate(500, ${y})`} className="animate-organic-wobble">
                  {/* Left chromatid */}
                  <path d="M -8 -22 C -18 -10, -18 10, -8 22" stroke={i % 2 === 0 ? '#ec4899' : '#38bdf8'} strokeWidth="5.5" strokeLinecap="round" fill="none" />
                  {/* Right chromatid */}
                  <path d="M 8 -22 C 18 -10, 18 10, 8 22" stroke={i % 2 === 0 ? '#f43f5e' : '#0284c7'} strokeWidth="5.5" strokeLinecap="round" fill="none" />
                  {/* Centromere */}
                  <circle cx="0" cy="0" r="4.5" fill="#facc15" stroke="#78350f" strokeWidth="1" />
                </g>
              ))}
            </g>
          )}

          {/* STAGE 2: ANAPHASE (Sister chromatids pulled towards opposite poles) */}
          {currentStageIdx === 2 && (
            <g
              id="anaphase-group"
              className="cursor-pointer"
              onClick={() => onSelectPart(isMitosis ? 'anaphase-chromatids' : 'anaphase-separation')}
              onMouseEnter={() => onHoverPart(isMitosis ? 'anaphase-chromatids' : 'anaphase-separation')}
              onMouseLeave={() => onHoverPart(null)}
            >
              {/* Leftward Pulled V-shaped Chromatids */}
              {[240, 310, 380].map((y, i) => (
                <g key={`l-${i}`} transform={`translate(400, ${y})`}>
                  {/* V-shape chromatid pointing toward left pole */}
                  <path d="M 16 -18 Q -2 0 16 18" stroke={i % 2 === 0 ? '#ec4899' : '#38bdf8'} strokeWidth="5" strokeLinecap="round" fill="none" />
                  <circle cx="-1" cy="0" r="4" fill="#facc15" />
                </g>
              ))}

              {/* Rightward Pulled V-shaped Chromatids */}
              {[240, 310, 380].map((y, i) => (
                <g key={`r-${i}`} transform={`translate(600, ${y})`}>
                  {/* V-shape pointing toward right pole */}
                  <path d="M -16 -18 Q 2 0 -16 18" stroke={i % 2 === 0 ? '#f43f5e' : '#0284c7'} strokeWidth="5" strokeLinecap="round" fill="none" />
                  <circle cx="1" cy="0" r="4" fill="#facc15" />
                </g>
              ))}
            </g>
          )}

          {/* STAGE 3: TELOPHASE & REFORMING DAUGHTER CELLS */}
          {currentStageIdx === 3 && (
            <g>
              {/* Left daughter nucleus reforming */}
              <g transform="translate(320, 310)">
                <circle cx="0" cy="0" r="50" fill="#4c1d95" fillOpacity="0.5" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 3" />
                <circle cx="0" cy="0" r="8" fill="#f43f5e" />
                <path d="M -20 -15 Q 0 -5 15 -20 M -15 15 Q 5 20 20 5" stroke="#c084fc" strokeWidth="2.5" fill="none" />
              </g>

              {/* Right daughter nucleus reforming */}
              <g transform="translate(680, 310)">
                <circle cx="0" cy="0" r="50" fill="#4c1d95" fillOpacity="0.5" stroke="#a855f7" strokeWidth="2" strokeDasharray="4 3" />
                <circle cx="0" cy="0" r="8" fill="#f43f5e" />
                <path d="M -20 -15 Q 0 -5 15 -20 M -15 15 Q 5 20 20 5" stroke="#c084fc" strokeWidth="2.5" fill="none" />
              </g>

              {/* Cleavage furrow pinching arrows */}
              <path d="M 500 240 L 500 270" stroke="#fda4af" strokeWidth="3" markerEnd="url(#arrow)" />
              <path d="M 500 380 L 500 350" stroke="#fda4af" strokeWidth="3" markerEnd="url(#arrow)" />
            </g>
          )}
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
