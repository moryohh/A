import React, { useState, useRef } from 'react';
import { DIAGRAMS } from '../data/diagrams';
import { DiagramConfig } from '../types';
import { PointerOverlay } from './svg/PointerOverlay';
import { CapacitorChargingSvg } from './svg/CapacitorChargingSvg';
import { CapacitorDischargingSvg } from './svg/CapacitorDischargingSvg';
import { ChargingCurrentGraphSvg } from './svg/ChargingCurrentGraphSvg';
import { DischargingCurrentGraphSvg } from './svg/DischargingCurrentGraphSvg';
import { InductiveReactanceFreqSvg } from './svg/InductiveReactanceFreqSvg';
import { InductiveReactanceInductanceSvg } from './svg/InductiveReactanceInductanceSvg';
import { CapacitiveReactanceFreqSvg } from './svg/CapacitiveReactanceFreqSvg';
import { CapacitiveReactanceCapacitanceSvg } from './svg/CapacitiveReactanceCapacitanceSvg';
import { PhotoelectricEffectSvg } from './svg/PhotoelectricEffectSvg';
import { DiodeForwardBiasSvg } from './svg/DiodeForwardBiasSvg';
import { DiodeReverseBiasSvg } from './svg/DiodeReverseBiasSvg';
import { FloatingExplanation } from './FloatingExplanation';

export const ORDERED_DIAGRAM_IDS = [
  'capacitor-charging-circuit',       // الرسم 1
  'capacitor-discharging-circuit',    // الرسم 2
  'charging-current-graph',          // الرسم 3
  'discharging-current-graph',       // الرسم 4
  'inductive-reactance-freq',        // الرسم 5
  'inductive-reactance-inductance',  // الرسم 6
  'capacitive-reactance-freq',       // الرسم 7
  'capacitive-reactance-capacitance',// الرسم 8
  'photoelectric-effect-graph',      // الرسم 9
  'diode-forward-bias',              // الرسم 10
  'diode-reverse-bias',              // الرسم 11
];

const ORDERED_DIAGRAMS: DiagramConfig[] = ORDERED_DIAGRAM_IDS
  .map((id) => DIAGRAMS.find((d) => d.id === id))
  .filter((d): d is DiagramConfig => Boolean(d));

export const InteractiveScientificCanvas: React.FC = () => {
  const [selectedDiagramId, setSelectedDiagramId] = useState<string>(
    ORDERED_DIAGRAMS[0]?.id || DIAGRAMS[0].id
  );
  const [hoveredPartId, setHoveredPartId] = useState<string | null>(null);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [quizMode, setQuizMode] = useState<boolean>(false);
  const [isLiveMotion, setIsLiveMotion] = useState<boolean>(true);
  const [lineDisplayMode, setLineDisplayMode] = useState<'hover' | 'always'>('hover');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const containerRef = useRef<HTMLDivElement>(null);

  const currentIndex = ORDERED_DIAGRAMS.findIndex((d) => d.id === selectedDiagramId);
  const currentDiagram: DiagramConfig =
    ORDERED_DIAGRAMS[currentIndex] || ORDERED_DIAGRAMS[0] || DIAGRAMS[0];

  const activePartId = hoveredPartId || selectedPartId;
  const activePart = currentDiagram.parts.find((p) => p.id === activePartId) || null;

  const handleHover = (id: string | null) => {
    setHoveredPartId(id);
  };

  const handleSelect = (id: string) => {
    setSelectedPartId((prev) => (prev === id ? null : id));
  };

  const handlePrevDiagram = () => {
    if (currentIndex > 0) {
      setSelectedDiagramId(ORDERED_DIAGRAMS[currentIndex - 1].id);
      setSelectedPartId(null);
      setHoveredPartId(null);
    }
  };

  const handleNextDiagram = () => {
    if (currentIndex < ORDERED_DIAGRAMS.length - 1) {
      setSelectedDiagramId(ORDERED_DIAGRAMS[currentIndex + 1].id);
      setSelectedPartId(null);
      setHoveredPartId(null);
    }
  };

  const renderDiagramSvg = () => {
    const props = {
      onPartHover: handleHover,
      onPartSelect: handleSelect,
      selectedPartId,
      hoveredPartId,
      isLiveMotion,
    };

    switch (currentDiagram.id) {
      case 'capacitor-charging-circuit':
        return <CapacitorChargingSvg {...props} />;
      case 'capacitor-discharging-circuit':
        return <CapacitorDischargingSvg {...props} />;
      case 'charging-current-graph':
        return <ChargingCurrentGraphSvg {...props} />;
      case 'discharging-current-graph':
        return <DischargingCurrentGraphSvg {...props} />;
      case 'inductive-reactance-freq':
        return <InductiveReactanceFreqSvg {...props} />;
      case 'inductive-reactance-inductance':
        return <InductiveReactanceInductanceSvg {...props} />;
      case 'capacitive-reactance-freq':
        return <CapacitiveReactanceFreqSvg {...props} />;
      case 'capacitive-reactance-capacitance':
        return <CapacitiveReactanceCapacitanceSvg {...props} />;
      case 'photoelectric-effect-graph':
        return <PhotoelectricEffectSvg {...props} />;
      case 'diode-forward-bias':
        return <DiodeForwardBiasSvg {...props} />;
      case 'diode-reverse-bias':
        return <DiodeReverseBiasSvg {...props} />;
      default:
        return <CapacitorChargingSvg {...props} />;
    }
  };

  return (
    <div
      ref={containerRef}
      id="scientific-canvas-board"
      className="w-full max-w-5xl mx-auto flex flex-col bg-white border border-slate-200 shadow-sm select-none rounded-xl overflow-hidden text-slate-800"
      dir="rtl"
    >
      {/* Educational Header with Clean Title & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50/80 text-xs">
        {/* Drawing title and figure tag */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono font-bold text-sky-800 bg-sky-100/80 px-2 py-0.5 rounded text-xs">
            {currentDiagram.numberTag}
          </span>
          <h2 className="font-bold text-slate-900 text-sm tracking-tight">
            {currentDiagram.title}
          </h2>
          <span className="text-slate-400 text-xs hidden md:inline">
            · {currentDiagram.curriculumCategory}
          </span>
        </div>

        {/* Minimalist Controls */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Previous / Next Diagram navigation arrows */}
          <div className="flex items-center border border-slate-200 rounded bg-white">
            <button
              type="button"
              onClick={handlePrevDiagram}
              disabled={currentIndex <= 0}
              className="px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent font-bold transition-colors"
              title="الرسم السابق"
            >
              →
            </button>
            <span className="px-1.5 text-[11px] font-mono text-slate-500 border-x border-slate-200">
              {currentIndex + 1} / {ORDERED_DIAGRAMS.length}
            </span>
            <button
              type="button"
              onClick={handleNextDiagram}
              disabled={currentIndex >= ORDERED_DIAGRAMS.length - 1}
              className="px-2 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent font-bold transition-colors"
              title="الرسم التالي"
            >
              ←
            </button>
          </div>

          {/* Diagram Selector Dropdown */}
          <select
            value={selectedDiagramId}
            onChange={(e) => {
              setSelectedDiagramId(e.target.value);
              setSelectedPartId(null);
              setHoveredPartId(null);
            }}
            className="bg-white border border-slate-200 text-slate-700 text-xs px-2.5 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-sky-500 font-medium max-w-[220px] sm:max-w-[270px] truncate"
            title="اختر الرسم الوزاري المطلوب"
          >
            {ORDERED_DIAGRAMS.map((diag) => (
              <option key={diag.id} value={diag.id}>
                {diag.numberTag}: {diag.title}
              </option>
            ))}
          </select>

          {/* Non-overlapping line display toggle */}
          <button
            type="button"
            onClick={() => setLineDisplayMode(lineDisplayMode === 'hover' ? 'always' : 'hover')}
            className={`px-2.5 py-1.5 text-xs rounded border transition-colors flex items-center gap-1 ${
              lineDisplayMode === 'hover'
                ? 'bg-sky-50 text-sky-800 border-sky-300 font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="التبديل بين التأشيرات الهادئة بدون خطوط متقاطعة وإظهار كافة الخطوط دائماً"
          >
            {lineDisplayMode === 'hover' ? 'تأشيرات نقية (بدون تقاطع)' : 'خطوط التأشير كاملة'}
          </button>

          {/* Live Physical Motion Toggle */}
          <button
            type="button"
            onClick={() => setIsLiveMotion(!isLiveMotion)}
            className={`px-2.5 py-1.5 text-xs rounded border transition-colors flex items-center gap-1.5 ${
              isLiveMotion
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
            }`}
            title="تشغيل / إيقاف الحركات والتدفقات الفيزيائية"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isLiveMotion ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
              }`}
            />
            {isLiveMotion ? 'حركة فيزيائية' : 'تجميد الحركة'}
          </button>

          {/* Quiz mode toggle */}
          <button
            type="button"
            onClick={() => setQuizMode(!quizMode)}
            className={`px-2.5 py-1.5 text-xs rounded border transition-colors ${
              quizMode
                ? 'bg-amber-50 text-amber-800 border-amber-300 font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title="إخفاء المسميات لاختبار الحفظ والاستذكار"
          >
            {quizMode ? 'وضع المذاكرة (مُفعل)' : 'اختبار الحفظ'}
          </button>

          {/* Toggle Labels */}
          <button
            type="button"
            onClick={() => setShowLabels(!showLabels)}
            className="px-2.5 py-1.5 text-xs rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 transition-colors hidden sm:inline-block"
            title="إظهار / إخفاء خطوط التأشير"
          >
            {showLabels ? 'إخفاء التأشيرات' : 'إظهار التأشيرات'}
          </button>

          {/* Zoom In / Out */}
          <div className="hidden lg:flex items-center gap-1 border-r border-slate-200 pr-1.5 mr-1">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.8, +(z - 0.1).toFixed(1)))}
              className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded font-mono"
              title="تصغير"
            >
              -
            </button>
            <span className="font-mono text-[10px] text-slate-400 w-8 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.4, +(z + 0.1).toFixed(1)))}
              className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 rounded font-mono"
              title="تكبير"
            >
              +
            </button>
            {zoomLevel !== 1 && (
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="text-[10px] text-slate-400 hover:text-slate-700 px-1"
                title="إعادة التعيين"
              >
                100%
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Diode Simulation State Switcher (الرسم 10 و 11) */}
      {(selectedDiagramId === 'diode-forward-bias' || selectedDiagramId === 'diode-reverse-bias') && (
        <div className="flex items-center justify-center gap-3 px-4 py-2.5 bg-sky-50/70 border-b border-sky-100 text-xs">
          <span className="font-bold text-slate-700 hidden sm:inline">محاكاة الثنائي البلوري (p-n):</span>
          <div className="inline-flex rounded-lg p-1 bg-white border border-slate-200 shadow-2xs">
            <button
              type="button"
              id="btn-forward"
              onClick={() => {
                setSelectedDiagramId('diode-forward-bias');
                setSelectedPartId(null);
                setHoveredPartId(null);
              }}
              className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all ${
                selectedDiagramId === 'diode-forward-bias'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-sky-700 hover:bg-slate-50'
              }`}
            >
              دائرة الانحياز الأمامي (p-n) — الرسم (10)
            </button>
            <button
              type="button"
              id="btn-reverse"
              onClick={() => {
                setSelectedDiagramId('diode-reverse-bias');
                setSelectedPartId(null);
                setHoveredPartId(null);
              }}
              className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all ${
                selectedDiagramId === 'diode-reverse-bias'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              دائرة الانحياز العكسي (p-n) — الرسم (11)
            </button>
          </div>
        </div>
      )}

      {/* Capacitor Charging / Discharging Switcher (الرسم 1 و 2) */}
      {(selectedDiagramId === 'capacitor-charging-circuit' || selectedDiagramId === 'capacitor-discharging-circuit') && (
        <div className="flex items-center justify-center gap-3 px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs">
          <span className="font-bold text-slate-700 hidden sm:inline">حالة دائرة المتسعة:</span>
          <div className="inline-flex rounded-lg p-1 bg-white border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setSelectedDiagramId('capacitor-charging-circuit');
                setSelectedPartId(null);
                setHoveredPartId(null);
              }}
              className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all ${
                selectedDiagramId === 'capacitor-charging-circuit'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-sky-700 hover:bg-slate-50'
              }`}
            >
              الرسم (1): دائرة شحن المتسعة (المفتاح K في 1)
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedDiagramId('capacitor-discharging-circuit');
                setSelectedPartId(null);
                setHoveredPartId(null);
              }}
              className={`px-3 py-1.5 rounded-md font-bold text-xs transition-all ${
                selectedDiagramId === 'capacitor-discharging-circuit'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-700 hover:bg-slate-50'
              }`}
            >
              الرسم (2): دائرة تفريغ المتسعة (المفتاح K في 2)
            </button>
          </div>
        </div>
      )}

      {/* 
        The Pure 2D Educational Drawing Board (SVG Canvas)
      */}
      <div className="relative w-full overflow-hidden flex items-center justify-center bg-white p-2 min-h-[500px]">
        {/* Floating Tooltip during Hover if Quiz Mode */}
        {activePart && (
          <div
            className="absolute top-4 left-4 z-30 pointer-events-none bg-slate-900/90 text-white backdrop-blur-xs text-xs px-3 py-2 rounded-lg shadow-lg border border-slate-700 max-w-xs transition-opacity duration-150"
            dir="rtl"
          >
            <div className="font-bold text-sky-300 mb-0.5">{activePart.name}</div>
            <div className="text-[11px] text-slate-300 leading-snug">{activePart.functionText}</div>
          </div>
        )}

        <div
          className="w-full flex items-center justify-center transition-transform duration-200 origin-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg
            viewBox={currentDiagram.viewBox}
            className="w-full h-auto max-h-[560px]"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* 1. Physics Schematic / Graph 2D SVG */}
            {renderDiagramSvg()}

            {/* 2. Precision Pointer Lines & Labels */}
            <PointerOverlay
              parts={currentDiagram.parts}
              activePartId={activePartId}
              onHoverPart={handleHover}
              onSelectPart={handleSelect}
              showLabels={showLabels && !quizMode}
              lineDisplayMode={lineDisplayMode}
            />

            {/* Quiz Mode: Interactive Numbered Target Markers */}
            {quizMode && (
              <g id="quiz-markers">
                {currentDiagram.parts.map((part, idx) => {
                  const isHovered = activePartId === part.id;
                  return (
                    <g
                      key={`quiz-${part.id}`}
                      className="cursor-pointer"
                      onClick={() => handleSelect(part.id)}
                      onMouseEnter={() => handleHover(part.id)}
                      onMouseLeave={() => handleHover(null)}
                    >
                      <circle
                        cx={part.pointer.originX}
                        cy={part.pointer.originY}
                        r={isHovered ? 14 : 11}
                        fill={isHovered ? '#0284c7' : '#0f172a'}
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="transition-all duration-150"
                      />
                      <text
                        x={part.pointer.originX}
                        y={part.pointer.originY + 4}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="bold"
                        fontFamily="'JetBrains Mono', monospace"
                      >
                        {idx + 1}
                      </text>
                    </g>
                  );
                })}
              </g>
            )}
          </svg>
        </div>
      </div>

      {/* 
        Scientific Explanations & Annotations
      */}
      <FloatingExplanation part={activePart} onClear={() => setSelectedPartId(null)} />
    </div>
  );
};
