import React, { useState } from 'react';
import { DiagramPart } from '../types';
import { Droplet, Sparkles, ZoomIn, Info, CheckCircle2 } from 'lucide-react';

interface OsmosisCellsSVGProps {
  parts: DiagramPart[];
  selectedPartId: string | null;
  hoveredPartId: string | null;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string | null) => void;
  showLabels?: boolean;
}

export const OsmosisCellsSVG: React.FC<OsmosisCellsSVGProps> = ({
  parts,
  selectedPartId,
  hoveredPartId,
  onSelectPart,
  onHoverPart,
  showLabels = true,
}) => {
  const [filterSolution, setFilterSolution] = useState<'all' | 'isotonic' | 'hypotonic' | 'hypertonic'>('all');
  const [showRbcInspector, setShowRbcInspector] = useState<boolean>(false);
  const [inspectedRbc, setInspectedRbc] = useState<'normal' | 'lysed' | 'crenated'>('normal');

  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  return (
    <div className="relative w-full overflow-hidden select-none flex flex-col items-center">
      
      {/* Top Filter & Inspection Toolbar */}
      <div className="w-full max-w-5xl flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 mb-2 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Droplet className="w-4 h-4" />
          </span>
          <span className="text-xs font-bold text-slate-200">
            محاكاة التناضح في خلايا الدم الحمراء والخلايا النباتية:
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setFilterSolution('all')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filterSolution === 'all'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-900/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            جميع الحالات (3 محاليل)
          </button>
          <button
            onClick={() => setFilterSolution('isotonic')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filterSolution === 'isotonic'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            1. متعادل (Isotonic)
          </button>
          <button
            onClick={() => setFilterSolution('hypotonic')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filterSolution === 'hypotonic'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-900/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            2. واطئ (انتفاخ وتحلل)
          </button>
          <button
            onClick={() => setFilterSolution('hypertonic')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filterSolution === 'hypertonic'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            3. عالي (انكماش وتسنن/بلزمة)
          </button>

          <button
            onClick={() => setShowRbcInspector(!showRbcInspector)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              showRbcInspector
                ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                : 'bg-rose-950/70 text-rose-300 hover:bg-rose-900/70 border border-rose-800/60'
            }`}
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>فحص كرية الدم ثلاثية الأبعاد (3D RBC)</span>
          </button>
        </div>
      </div>

      {/* RBC Detailed 3D Anatomy Modal / Inspector */}
      {showRbcInspector && (
        <div className="w-full max-w-5xl mb-3 p-4 bg-slate-900/95 border border-rose-500/40 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <span>الفحص المجهري الدقيق لكرية الدم الحمراء (Servier Medical Art High-Res Erythrocyte)</span>
              </h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setInspectedRbc('normal')}
                className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                  inspectedRbc === 'normal' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                الكرية الطبيعية (قرصية)
              </button>
              <button
                onClick={() => setInspectedRbc('lysed')}
                className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                  inspectedRbc === 'lysed' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                المتفجرة (تحلل دموي)
              </button>
              <button
                onClick={() => setInspectedRbc('crenated')}
                className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                  inspectedRbc === 'crenated' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                المنكمشة المسننة (Echinocyte)
              </button>
              <button
                onClick={() => setShowRbcInspector(false)}
                className="text-slate-400 hover:text-white px-2 py-0.5 text-xs rounded bg-slate-800 mr-2"
              >
                إغلاق
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* 3D Magnified Canvas */}
            <div className="w-full h-56 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center p-2 relative overflow-hidden">
              <svg viewBox="0 0 400 240" className="w-full h-full max-h-52">
                <defs>
                  {/* High quality 3D Erythrocyte Shading */}
                  <radialGradient id="rbc-macro-torus" cx="40%" cy="30%" r="70%">
                    <stop offset="0%" stopColor="#fda4af" />
                    <stop offset="25%" stopColor="#f43f5e" />
                    <stop offset="65%" stopColor="#be123c" />
                    <stop offset="90%" stopColor="#881337" />
                    <stop offset="100%" stopColor="#4c0519" />
                  </radialGradient>
                  
                  <radialGradient id="rbc-macro-dimple" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#350311" />
                    <stop offset="50%" stopColor="#50071c" />
                    <stop offset="90%" stopColor="#881337" />
                    <stop offset="100%" stopColor="#be123c" />
                  </radialGradient>

                  <filter id="rbc-macro-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#000000" floodOpacity="0.75" />
                  </filter>
                </defs>

                {inspectedRbc === 'normal' && (
                  <g transform="translate(200, 115)">
                    {/* Shadow */}
                    <ellipse cx="0" cy="55" rx="100" ry="22" fill="#000000" opacity="0.6" filter="blur(8px)" />

                    {/* 3D Oblique Biconcave Disc Outer Toroid */}
                    <ellipse
                      cx="0"
                      cy="0"
                      rx="115"
                      ry="65"
                      fill="url(#rbc-macro-torus)"
                      stroke="#fecdd3"
                      strokeWidth="2.5"
                      strokeOpacity="0.7"
                      filter="url(#rbc-macro-shadow)"
                    />

                    {/* Specular curved rim gloss highlight */}
                    <path
                      d="M -90 -15 C -60 -48, 50 -48, 90 -12 C 70 -35, -40 -40, -90 -15 Z"
                      fill="#ffffff"
                      opacity="0.38"
                    />

                    {/* Central Biconcave Well / Concavity */}
                    <ellipse cx="0" cy="0" rx="55" ry="28" fill="url(#rbc-macro-dimple)" stroke="#881337" strokeWidth="1.5" />
                    <ellipse cx="-2" cy="-2" rx="35" ry="16" fill="#380413" opacity="0.9" />

                    {/* Water equilibrium indicator */}
                    <g transform="translate(0, 75)">
                      <text x="0" y="0" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="bold">
                        اتزان أسموزي تام: H₂O داخل = H₂O خارج
                      </text>
                    </g>
                  </g>
                )}

                {inspectedRbc === 'lysed' && (
                  <g transform="translate(200, 110)">
                    {/* Dispersing hemoglobin cloud */}
                    <circle cx="0" cy="0" r="85" fill="#f43f5e" opacity="0.15" filter="blur(16px)" />
                    
                    {/* Tense spherical ruptured membrane */}
                    <path
                      d="M -70 -25 C -50 -75, 45 -70, 70 -20 
                         C 85 20, 60 70, 20 75 
                         C -30 80, -75 50, -80 0 
                         C -82 -15, -78 -20, -70 -25 Z"
                      fill="url(#rbc-macro-torus)"
                      stroke="#ffffff"
                      strokeWidth="3"
                      filter="url(#rbc-macro-shadow)"
                    />

                    {/* Rupture fissures and escaping hemoglobin */}
                    <path d="M 45 -45 L 68 -65 M 55 -38 L 78 -50 M 60 40 L 90 60 M -65 30 L -90 45" stroke="#ffe4e6" strokeWidth="3" strokeLinecap="round" />
                    
                    {/* Leaking hemoglobin beads */}
                    <circle cx="85" cy="-60" r="8" fill="#e11d48" stroke="#ffe4e6" strokeWidth="1.5" />
                    <circle cx="100" cy="-45" r="5.5" fill="#e11d48" />
                    <circle cx="95" cy="55" r="7" fill="#be123c" stroke="#ffe4e6" strokeWidth="1" />
                    <circle cx="-95" cy="40" r="6" fill="#f43f5e" />
                    <circle cx="-80" cy="-40" r="5" fill="#e11d48" />

                    <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="black" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.8))">
                      تمزق وتحلل الغشاء (Hemolysis)
                    </text>
                  </g>
                )}

                {inspectedRbc === 'crenated' && (
                  <g transform="translate(200, 115)">
                    {/* Shadow */}
                    <ellipse cx="0" cy="55" rx="75" ry="18" fill="#000000" opacity="0.6" filter="blur(6px)" />

                    {/* True 3D Crenated Echinocyte Body with multiple conical blunt spicules */}
                    {/* Outer spicules ring */}
                    {[0, 24, 48, 72, 96, 120, 144, 168, 192, 216, 240, 264, 288, 312, 336].map((deg, i) => {
                      const rad = (deg * Math.PI) / 180;
                      const dist = 68;
                      const x = Math.cos(rad) * dist * 1.15;
                      const y = Math.sin(rad) * dist * 0.75;
                      return (
                        <g key={`spicule-${i}`} transform={`translate(${x}, ${y})`}>
                          <circle cx="0" cy="0" r="11" fill="#be123c" stroke="#fda4af" strokeWidth="1.5" />
                          <circle cx="-3" cy="-3" r="4.5" fill="#fecdd3" opacity="0.8" />
                        </g>
                      );
                    })}

                    {/* Central collapsed body */}
                    <ellipse cx="0" cy="0" rx="60" ry="38" fill="#881337" stroke="#4c0519" strokeWidth="3" />
                    
                    {/* Surface protruding spicules (facing viewer) */}
                    <g transform="translate(-25, -12)">
                      <circle cx="0" cy="0" r="10" fill="#e11d48" stroke="#fecdd3" strokeWidth="1.2" />
                      <circle cx="-2.5" cy="-2.5" r="3.5" fill="#ffffff" opacity="0.75" />
                    </g>
                    <g transform="translate(22, -10)">
                      <circle cx="0" cy="0" r="9.5" fill="#be123c" stroke="#fecdd3" strokeWidth="1.2" />
                      <circle cx="-2.5" cy="-2.5" r="3" fill="#ffffff" opacity="0.7" />
                    </g>
                    <g transform="translate(2, 14)">
                      <circle cx="0" cy="0" r="10.5" fill="#be123c" stroke="#fecdd3" strokeWidth="1.2" />
                      <circle cx="-2.5" cy="-2.5" r="3.5" fill="#ffffff" opacity="0.7" />
                    </g>
                    <g transform="translate(-20, 15)">
                      <circle cx="0" cy="0" r="8.5" fill="#9f1239" stroke="#fda4af" strokeWidth="1" />
                    </g>

                    <text x="0" y="4" textAnchor="middle" fill="#fecdd3" fontSize="10" fontWeight="bold">
                      انكماش وتسنن (Echinocyte)
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Scientific Explanation & Diagnostic Notes */}
            <div className="text-xs space-y-2 text-slate-300">
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <div className="font-bold text-rose-400 mb-1 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  <span>التحليل الشكلي والوظيفي حسب رسوم Servier الطبية:</span>
                </div>
                {inspectedRbc === 'normal' && (
                  <p className="leading-relaxed">
                    كرية الدم الحمراء الطبيعية عبارة عن قرص مقعر الوجهين (Biconcave Disc). هذا التقعر ليس عشوائياً، بل يمنحها مرونة فائقة للمرور في أضيق الشعيرات الدموية ويزيد مساحة سطح الغشاء بنسبة 30% مقارنة بالكرة، مما يسرع تبادل الغازات التنفسية.
                  </p>
                )}
                {inspectedRbc === 'lysed' && (
                  <p className="leading-relaxed">
                    عند وضعها في ماء مقطر (محلول واطئ التركيز)، يتدفق الماء بسرعة خيالية لداخل الكرية لارتفاع تركيز المذابات داخلها. وبسبب افتقار الخلية الحيوانية إلى جدار خلوي متين، تتمدد الكرية حتى يبلغ الضغط الهيدروستاتيكي حداً يفوق قوة تحمل الغشاء، فتنفجر متناثرة في عملية تدعى <b>التحلل الدموي (Hemolysis)</b>.
                  </p>
                )}
                {inspectedRbc === 'crenated' && (
                  <p className="leading-relaxed">
                    عند غمر الكرية في محلول ملحي مركز (عالي التركيز)، ينسحب الماء من السيتوبلازم نحو الخارج بالخاصية الأسموزية. ينكمش الحجم الخلوي وتتجمع خيوط الهيكل الخلوي تحت الغشاء مكونة نتوءات كروية مسننة تُسمى الكريات المسننة <b>(Echinocytes / Crenation)</b>.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>مطابق لرسومات بنك الرسوم الطبية العالمية (Servier Medical Art) ومفردات منهج الأحياء.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Comparative Diagram SVG */}
      <svg
        viewBox="0 0 1000 600"
        className="w-full h-auto max-h-[600px] drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Medical Erythrocyte 3D Gradients */}
          <radialGradient id="rbc-3d-isotonic" cx="42%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fda4af" />
            <stop offset="30%" stopColor="#f43f5e" />
            <stop offset="70%" stopColor="#be123c" />
            <stop offset="92%" stopColor="#881337" />
            <stop offset="100%" stopColor="#4c0519" />
          </radialGradient>

          <radialGradient id="rbc-dimple" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2e020d" />
            <stop offset="55%" stopColor="#50071c" />
            <stop offset="85%" stopColor="#881337" />
            <stop offset="100%" stopColor="#be123c" />
          </radialGradient>

          <radialGradient id="rbc-swollen" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffe4e6" />
            <stop offset="35%" stopColor="#f43f5e" />
            <stop offset="75%" stopColor="#be123c" />
            <stop offset="100%" stopColor="#670622" />
          </radialGradient>

          <radialGradient id="rbc-crenated-body" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#e11d48" />
            <stop offset="50%" stopColor="#9f1239" />
            <stop offset="90%" stopColor="#4c0519" />
            <stop offset="100%" stopColor="#25020a" />
          </radialGradient>

          {/* Plant Cell Gradients */}
          <linearGradient id="plant-wall-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#15803d" />
            <stop offset="50%" stopColor="#166534" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>

          <radialGradient id="vacuole-turgid-grad" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="40%" stopColor="#38bdf8" />
            <stop offset="80%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#0369a1" />
          </radialGradient>

          <radialGradient id="vacuole-plasmolyzed-grad" cx="50%" cy="45%" r="55%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="60%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#075985" />
          </radialGradient>

          {/* Water Arrow Marker */}
          <marker id="water-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
          </marker>
          <marker id="water-arrow-out" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#38bdf8" />
          </marker>

          {/* Glow Filters */}
          <filter id="cell-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient Dark Biological Field */}
        <rect width="1000" height="600" fill="#020617" rx="20" />

        {/* Column Headers */}
        <g transform="translate(0, 0)">
          <rect x="30" y="14" width="450" height="34" rx="8" fill="#1e1b4b" fillOpacity="0.4" stroke="#4338ca" strokeWidth="1" />
          <text x="255" y="36" textAnchor="middle" fill="#f43f5e" fontSize="13.5" fontWeight="bold">
            الخلية الحيوانية (كرية الدم الحمراء — Erythrocyte)
          </text>

          <rect x="520" y="14" width="450" height="34" rx="8" fill="#064e3b" fillOpacity="0.3" stroke="#047857" strokeWidth="1" />
          <text x="745" y="36" textAnchor="middle" fill="#22c55e" fontSize="13.5" fontWeight="bold">
            الخلية النباتية (جدار سليلوزي وفجوة عصيرية — Plant Cell)
          </text>

          {/* Vertical Divider */}
          <line x1="500" y1="15" x2="500" y2="585" stroke="#1e293b" strokeWidth="1.5" strokeDasharray="5 5" />
        </g>

        {/* =========================================================
            ROW 1: ISOTONIC SOLUTION (محلول متعادل التركيز)
           ========================================================= */}
        {(filterSolution === 'all' || filterSolution === 'isotonic') && (
          <g id="row-isotonic" className="transition-all duration-300">
            {/* Background container */}
            <rect
              x="20"
              y="58"
              width="960"
              height="160"
              rx="14"
              fill="#064e3b"
              fillOpacity="0.10"
              stroke="#059669"
              strokeWidth="1"
            />
            <text x="40" y="82" fill="#34d399" fontSize="12" fontWeight="bold">
              1. محلول متعادل التركيز (Isotonic Solution) — اتزان مائي ديناميكي مستمر (الداخل = الخارج)
            </text>

            {/* -------------------------------------------
                ANIMAL CELL (Normal 3D Biconcave Erythrocyte)
               ------------------------------------------- */}
            <g
              id="part-isotonic-animal"
              className="cursor-pointer transition-transform duration-200 hover:scale-105"
              transform="translate(280, 135)"
              onClick={() => onSelectPart('isotonic-animal')}
              onMouseEnter={() => onHoverPart('isotonic-animal')}
              onMouseLeave={() => onHoverPart(null)}
              filter={isPartActive('isotonic-animal') ? 'url(#cell-glow)' : undefined}
            >
              {/* Drop shadow */}
              <ellipse cx="0" cy="38" rx="55" ry="14" fill="#000000" opacity="0.5" filter="blur(5px)" />

              {/* 3D Biconcave Disc Toroid (Servier Style) */}
              <ellipse
                cx="0"
                cy="0"
                rx="62"
                ry="36"
                fill="url(#rbc-3d-isotonic)"
                stroke={isPartActive('isotonic-animal') ? '#ffffff' : '#fda4af'}
                strokeWidth={isPartActive('isotonic-animal') ? 3 : 1.5}
              />

              {/* Specular crest rim highlight */}
              <path
                d="M -48 -8 C -32 -25, 28 -25, 48 -6 C 36 -19, -20 -22, -48 -8 Z"
                fill="#ffffff"
                opacity="0.4"
              />

              {/* Central Biconcave Hollow / Dimple */}
              <ellipse cx="0" cy="0" rx="30" ry="15" fill="url(#rbc-dimple)" stroke="#881337" strokeWidth="1" />

              <text x="0" y="3" textAnchor="middle" fill="#ffe4e6" fontSize="9" fontWeight="bold">
                قرص مقعر الوجهين
              </text>

              {/* Dynamic Equilibrium Water Arrows */}
              <g className="text-sky-400">
                {/* Water IN arrow */}
                <path d="M -85 -10 L -66 -5" stroke="#38bdf8" strokeWidth="2.2" markerEnd="url(#water-arrow)" />
                <text x="-95" y="-12" fill="#38bdf8" fontSize="8.5" fontWeight="bold">H₂O</text>

                {/* Water OUT arrow */}
                <path d="M 66 5 L 85 10" stroke="#38bdf8" strokeWidth="2.2" markerEnd="url(#water-arrow)" />
                <text x="88" y="22" fill="#38bdf8" fontSize="8.5" fontWeight="bold">H₂O</text>
              </g>

              {/* Status Badge */}
              <rect x="-45" y="44" width="90" height="18" rx="6" fill="#0f172a" stroke="#f43f5e" strokeWidth="1" />
              <text x="0" y="56" textAnchor="middle" fill="#fca5a5" fontSize="8.5" fontWeight="bold">
                حجم وشكل طبيعي
              </text>
            </g>

            {/* -------------------------------------------
                PLANT CELL (Normal Hydration in Isotonic)
               ------------------------------------------- */}
            <g
              id="part-isotonic-plant"
              className="cursor-pointer transition-transform duration-200 hover:scale-105"
              transform="translate(720, 135)"
              onClick={() => onSelectPart('isotonic-plant')}
              onMouseEnter={() => onHoverPart('isotonic-plant')}
              onMouseLeave={() => onHoverPart(null)}
              filter={isPartActive('isotonic-plant') ? 'url(#cell-glow)' : undefined}
            >
              {/* Outer Thick Cellulose Cell Wall */}
              <rect
                x="-75"
                y="-46"
                width="150"
                height="92"
                rx="14"
                fill="url(#plant-wall-grad)"
                stroke={isPartActive('isotonic-plant') ? '#ffffff' : '#4ade80'}
                strokeWidth={isPartActive('isotonic-plant') ? 3 : 2}
              />
              {/* Inner primary wall line */}
              <rect x="-70" y="-41" width="140" height="82" rx="10" fill="#022c22" stroke="#15803d" strokeWidth="1.2" />

              {/* Plasma membrane adhering to wall */}
              <rect x="-65" y="-36" width="130" height="72" rx="7" fill="#034e3f" fillOpacity="0.4" stroke="#34d399" strokeWidth="1" strokeDasharray="3 2" />

              {/* Cytoplasm & Chloroplasts */}
              <circle cx="-50" cy="-22" r="5" fill="#22c55e" stroke="#16a34a" strokeWidth="0.8" />
              <circle cx="-48" cy="22" r="5" fill="#22c55e" stroke="#16a34a" strokeWidth="0.8" />
              <circle cx="50" cy="20" r="5" fill="#22c55e" stroke="#16a34a" strokeWidth="0.8" />

              {/* Normal Central Vacuole */}
              <ellipse cx="2" cy="0" rx="42" ry="24" fill="#0284c7" fillOpacity="0.75" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="2" y="3" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">فجوة طبيعية</text>

              {/* Nucleus */}
              <circle cx="-42" cy="-2" r="9" fill="#a855f7" stroke="#c084fc" strokeWidth="1" />
              <circle cx="-42" cy="-2" r="3.5" fill="#581c87" />

              {/* Balanced Water arrows */}
              <path d="M -95 -12 L -78 -6" stroke="#38bdf8" strokeWidth="2.2" markerEnd="url(#water-arrow)" />
              <path d="M 78 6 L 95 12" stroke="#38bdf8" strokeWidth="2.2" markerEnd="url(#water-arrow)" />

              {/* Status Badge */}
              <rect x="-45" y="44" width="90" height="18" rx="6" fill="#0f172a" stroke="#10b981" strokeWidth="1" />
              <text x="0" y="56" textAnchor="middle" fill="#86efac" fontSize="8.5" fontWeight="bold">
                حالة توازن واستقرار
              </text>
            </g>
          </g>
        )}

        {/* =========================================================
            ROW 2: HYPOTONIC SOLUTION (محلول واطئ التركيز - انتفاخ وتحلل)
           ========================================================= */}
        {(filterSolution === 'all' || filterSolution === 'hypotonic') && (
          <g id="row-hypotonic" className="transition-all duration-300">
            {/* Background container */}
            <rect
              x="20"
              y="230"
              width="960"
              height="165"
              rx="14"
              fill="#0369a1"
              fillOpacity="0.10"
              stroke="#0284c7"
              strokeWidth="1"
            />
            <text x="40" y="254" fill="#38bdf8" fontSize="12" fontWeight="bold">
              2. محلول واطئ التركيز (Hypotonic Solution / ماء مقطر) — تدفق صافٍ للماء إلى داخل الخلية
            </text>

            {/* -------------------------------------------
                ANIMAL CELL (Swollen & Lysed Spherocyte)
               ------------------------------------------- */}
            <g
              id="part-hypotonic-lysed"
              className="cursor-pointer transition-transform duration-200 hover:scale-105"
              transform="translate(280, 310)"
              onClick={() => onSelectPart('hypotonic-lysed')}
              onMouseEnter={() => onHoverPart('hypotonic-lysed')}
              onMouseLeave={() => onHoverPart(null)}
              filter={isPartActive('hypotonic-lysed') ? 'url(#cell-glow)' : undefined}
            >
              {/* Leaking hemoglobin cloud */}
              <circle cx="0" cy="0" r="58" fill="#f43f5e" opacity="0.2" filter="blur(10px)" />

              {/* Stretched Spherocyte Balloon Body with Rupture Tearing */}
              <path
                d="M -48 -18 
                   C -35 -52, 35 -50, 52 -15 
                   C 62 12, 45 48, 15 52 
                   C -20 56, -52 38, -55 8 
                   C -56 -4, -53 -12, -48 -18 Z"
                fill="url(#rbc-swollen)"
                stroke={isPartActive('hypotonic-lysed') ? '#ffffff' : '#f43f5e'}
                strokeWidth={isPartActive('hypotonic-lysed') ? 3.2 : 2}
              />

              {/* Specular high-tension highlight (showing ballooned stretch) */}
              <ellipse cx="-18" cy="-22" rx="20" ry="10" fill="#ffffff" opacity="0.45" transform="rotate(-25 -18 -22)" />

              {/* Rupture Tears & Fissures */}
              <path d="M 38 -32 L 56 -48 M 46 -24 L 62 -34" stroke="#ffe4e6" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M 46 25 L 68 40 M 35 38 L 50 54" stroke="#ffe4e6" strokeWidth="2" strokeLinecap="round" />
              <path d="M -45 22 L -65 32" stroke="#ffe4e6" strokeWidth="2" strokeLinecap="round" />

              {/* Escaping Hemoglobin Subunit Drops (تحلل الدم) */}
              <circle cx="68" cy="-44" r="5" fill="#be123c" stroke="#ffe4e6" strokeWidth="1" />
              <circle cx="78" cy="-32" r="3.5" fill="#e11d48" />
              <circle cx="70" cy="42" r="5.5" fill="#9f1239" stroke="#fda4af" strokeWidth="1" />
              <circle cx="-68" cy="30" r="4.5" fill="#e11d48" />
              <circle cx="-60" cy="-28" r="3.8" fill="#fda4af" />

              <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="black" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.8))">
                انتفاخ ثم تمزق!
              </text>

              {/* Inward Water Influx Arrows (Water rushing in) */}
              <g className="text-sky-400">
                <path d="M -85 0 L -60 0" stroke="#38bdf8" strokeWidth="2.8" markerEnd="url(#water-arrow)" />
                <path d="M 85 0 L 60 0" stroke="#38bdf8" strokeWidth="2.8" markerEnd="url(#water-arrow)" />
                <path d="M 0 -75 L 0 -55" stroke="#38bdf8" strokeWidth="2.8" markerEnd="url(#water-arrow)" />
                <text x="-95" y="4" fill="#38bdf8" fontSize="8.5" fontWeight="bold">H₂O ➔</text>
                <text x="75" y="-12" fill="#38bdf8" fontSize="8.5" fontWeight="bold">H₂O ➔</text>
              </g>

              {/* Status Badge */}
              <rect x="-65" y="48" width="130" height="18" rx="6" fill="#450a0a" stroke="#ef4444" strokeWidth="1" />
              <text x="0" y="60" textAnchor="middle" fill="#fca5a5" fontSize="8.5" fontWeight="bold">
                تحلل دموي (Hemolysis) وانفجار
              </text>
            </g>

            {/* -------------------------------------------
                PLANT CELL (Turgid Full Osmotic Pressure)
               ------------------------------------------- */}
            <g
              id="part-hypotonic-turgid"
              className="cursor-pointer transition-transform duration-200 hover:scale-105"
              transform="translate(720, 310)"
              onClick={() => onSelectPart('hypotonic-turgid')}
              onMouseEnter={() => onHoverPart('hypotonic-turgid')}
              onMouseLeave={() => onHoverPart(null)}
              filter={isPartActive('hypotonic-turgid') ? 'url(#cell-glow)' : undefined}
            >
              {/* Rigid Cellulose Wall Resisting Expansion */}
              <rect
                x="-78"
                y="-48"
                width="156"
                height="96"
                rx="14"
                fill="url(#plant-wall-grad)"
                stroke={isPartActive('hypotonic-turgid') ? '#ffffff' : '#22c55e'}
                strokeWidth={isPartActive('hypotonic-turgid') ? 3.5 : 2.5}
              />
              <rect x="-72" y="-42" width="144" height="84" rx="10" fill="#022c22" stroke="#16a34a" strokeWidth="1.2" />

              {/* Swollen Turgid Vacuole pushing hard against the wall */}
              <rect
                x="-68"
                y="-38"
                width="136"
                height="76"
                rx="8"
                fill="url(#vacuole-turgid-grad)"
                stroke="#7dd3fc"
                strokeWidth="2"
              />

              {/* Compressed cytoplasm rim */}
              <circle cx="-54" cy="-26" r="4" fill="#22c55e" />
              <circle cx="-54" cy="26" r="4" fill="#22c55e" />
              <circle cx="56" cy="24" r="4" fill="#22c55e" />
              <circle cx="-54" cy="0" r="7.5" fill="#a855f7" />

              <text x="0" y="3" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="black" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.8))">
                امتلاء كامل (ضغط الامتلاء)
              </text>
              <text x="0" y="16" textAnchor="middle" fill="#bae6fd" fontSize="8.5" fontWeight="bold">
                الجدار يمنع الانفجار
              </text>

              {/* Influx stopped by wall pressure */}
              <path d="M -98 0 L -82 0" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#water-arrow)" />
              <path d="M 98 0 L 82 0" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#water-arrow)" />

              {/* Status Badge */}
              <rect x="-55" y="48" width="110" height="18" rx="6" fill="#064e3b" stroke="#22c55e" strokeWidth="1" />
              <text x="0" y="60" textAnchor="middle" fill="#86efac" fontSize="8.5" fontWeight="bold">
                خلية متوترة منتفخة (Turgid)
              </text>
            </g>
          </g>
        )}

        {/* =========================================================
            ROW 3: HYPERTONIC SOLUTION (محلول عالي التركيز - انكماش وبلزمة)
           ========================================================= */}
        {(filterSolution === 'all' || filterSolution === 'hypertonic') && (
          <g id="row-hypertonic" className="transition-all duration-300">
            {/* Background container */}
            <rect
              x="20"
              y="405"
              width="960"
              height="175"
              rx="14"
              fill="#881337"
              fillOpacity="0.10"
              stroke="#be123c"
              strokeWidth="1"
            />
            <text x="40" y="429" fill="#fb7185" fontSize="12" fontWeight="bold">
              3. محلول عالي التركيز (Hypertonic Solution / ماء ملحي مركز) — خروج صافٍ للماء من الخلية
            </text>

            {/* -------------------------------------------
                ANIMAL CELL (Crenated Echinocyte / 3D Spikes)
               ------------------------------------------- */}
            <g
              id="part-hypertonic-crenated"
              className="cursor-pointer transition-transform duration-200 hover:scale-105"
              transform="translate(280, 485)"
              onClick={() => onSelectPart('hypertonic-crenated')}
              onMouseEnter={() => onHoverPart('hypertonic-crenated')}
              onMouseLeave={() => onHoverPart(null)}
              filter={isPartActive('hypertonic-crenated') ? 'url(#cell-glow)' : undefined}
            >
              {/* Drop shadow */}
              <ellipse cx="0" cy="36" rx="42" ry="12" fill="#000000" opacity="0.6" filter="blur(4px)" />

              {/* Conical 3D Spicules (Echinocyte crenations around rim) */}
              {[0, 24, 48, 72, 96, 120, 144, 168, 192, 216, 240, 264, 288, 312, 336].map((deg, i) => {
                const rad = (deg * Math.PI) / 180;
                const dist = 38;
                const x = Math.cos(rad) * dist * 1.15;
                const y = Math.sin(rad) * dist * 0.78;
                return (
                  <g key={`crenate-spic-${i}`} transform={`translate(${x}, ${y})`}>
                    <circle cx="0" cy="0" r="7.5" fill="#9f1239" stroke="#fda4af" strokeWidth="1" />
                    <circle cx="-2" cy="-2" r="2.8" fill="#fecdd3" opacity="0.8" />
                  </g>
                );
              })}

              {/* Central collapsed, puckered dense body */}
              <ellipse
                cx="0"
                cy="0"
                rx="36"
                ry="24"
                fill="url(#rbc-crenated-body)"
                stroke={isPartActive('hypertonic-crenated') ? '#ffffff' : '#be123c'}
                strokeWidth={isPartActive('hypertonic-crenated') ? 2.8 : 1.8}
              />

              {/* Surface protruding spicules pointing towards viewer */}
              <g transform="translate(-14, -7)">
                <circle cx="0" cy="0" r="6.5" fill="#be123c" stroke="#fecdd3" strokeWidth="0.8" />
                <circle cx="-1.5" cy="-1.5" r="2.2" fill="#ffffff" opacity="0.7" />
              </g>
              <g transform="translate(14, -5)">
                <circle cx="0" cy="0" r="6" fill="#be123c" stroke="#fecdd3" strokeWidth="0.8" />
                <circle cx="-1.5" cy="-1.5" r="2" fill="#ffffff" opacity="0.7" />
              </g>
              <g transform="translate(0, 9)">
                <circle cx="0" cy="0" r="6.8" fill="#9f1239" stroke="#fecdd3" strokeWidth="0.8" />
                <circle cx="-1.5" cy="-1.5" r="2.2" fill="#ffffff" opacity="0.7" />
              </g>

              <text x="0" y="2" textAnchor="middle" fill="#fca5a5" fontSize="8.5" fontWeight="bold">
                تسنن الكرية
              </text>

              {/* Water Efflux Arrows (Water leaving in all directions) */}
              <g className="text-sky-400">
                <path d="M -48 -14 L -72 -22" stroke="#38bdf8" strokeWidth="2.2" markerEnd="url(#water-arrow-out)" />
                <path d="M 48 -14 L 72 -22" stroke="#38bdf8" strokeWidth="2.2" markerEnd="url(#water-arrow-out)" />
                <path d="M 48 14 L 72 22" stroke="#38bdf8" strokeWidth="2.2" markerEnd="url(#water-arrow-out)" />
                <text x="-86" y="-22" fill="#38bdf8" fontSize="8" fontWeight="bold">H₂O ⇦</text>
                <text x="76" y="-22" fill="#38bdf8" fontSize="8" fontWeight="bold">⇨ H₂O</text>
              </g>

              {/* Status Badge */}
              <rect x="-60" y="44" width="120" height="18" rx="6" fill="#2a060c" stroke="#f97316" strokeWidth="1" />
              <text x="0" y="56" textAnchor="middle" fill="#fdba74" fontSize="8.5" fontWeight="bold">
                انكماش وتسنن (Crenation)
              </text>
            </g>

            {/* -------------------------------------------
                PLANT CELL (Plasmolyzed with Hechtian Strands)
               ------------------------------------------- */}
            <g
              id="part-hypertonic-plasmolysis"
              className="cursor-pointer transition-transform duration-200 hover:scale-105"
              transform="translate(720, 485)"
              onClick={() => onSelectPart('hypertonic-plasmolysis')}
              onMouseEnter={() => onHoverPart('hypertonic-plasmolysis')}
              onMouseLeave={() => onHoverPart(null)}
              filter={isPartActive('hypertonic-plasmolysis') ? 'url(#cell-glow)' : undefined}
            >
              {/* Outer Rigid Cell Wall Stays Untouched */}
              <rect
                x="-75"
                y="-46"
                width="150"
                height="92"
                rx="14"
                fill="url(#plant-wall-grad)"
                stroke={isPartActive('hypertonic-plasmolysis') ? '#ffffff' : '#22c55e'}
                strokeWidth={isPartActive('hypertonic-plasmolysis') ? 3 : 2}
              />
              <rect x="-70" y="-41" width="140" height="82" rx="10" fill="#1c1917" stroke="#15803d" strokeWidth="1" />

              {/* Space between wall and shrunken protoplast is filled with hypertonic fluid */}
              <text x="0" y="-26" textAnchor="middle" fill="#f59e0b" fontSize="7.5" fontWeight="bold">
                محلول عالي التركيز يملأ الفراغ
              </text>

              {/* Hechtian Strands (خيوط هيولية ممتدة من الغشاء المنكمش للزوايا) */}
              <path d="M -40 -16 L -66 -36 M 38 -16 L 66 -36 M -40 16 L -66 36 M 38 16 L 66 36" stroke="#4ade80" strokeWidth="1.2" strokeDasharray="2 2" />

              {/* Shrunken, Wrinkled Retracted Protoplast (البلزمة) */}
              <path
                d="M -38 -18 
                   C -20 -28, 24 -26, 38 -14 
                   C 46 2, 34 24, 18 28 
                   C -6 32, -30 25, -40 10 
                   C -45 -5, -44 -14, -38 -18 Z"
                fill="url(#vacuole-plasmolyzed-grad)"
                stroke={isPartActive('hypertonic-plasmolysis') ? '#ffffff' : '#38bdf8'}
                strokeWidth={isPartActive('hypertonic-plasmolysis') ? 2.8 : 1.8}
              />

              {/* Shrunken central vacuole inside */}
              <ellipse cx="2" cy="2" rx="22" ry="12" fill="#0369a1" opacity="0.85" />
              <circle cx="-16" cy="2" r="6" fill="#a855f7" />

              <text x="4" y="5" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
                انكماش الغشاء
              </text>

              {/* Water leaving cell */}
              <path d="M -76 0 L -98 0" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#water-arrow-out)" />
              <path d="M 76 0 L 98 0" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#water-arrow-out)" />

              {/* Status Badge */}
              <rect x="-60" y="44" width="120" height="18" rx="6" fill="#1c1917" stroke="#f59e0b" strokeWidth="1" />
              <text x="0" y="56" textAnchor="middle" fill="#fde047" fontSize="8.5" fontWeight="bold">
                البلزمة (Plasmolysis)
              </text>
            </g>
          </g>
        )}

        {/* Labels & Callout Pointers Layer */}
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
                      fontSize="10.5"
                      fontWeight="bold"
                    >
                      {part.nameAr.length > 28 ? part.nameAr.slice(0, 27) + '...' : part.nameAr}
                    </text>
                    <text
                      x={anchor === 'end' ? -85 : anchor === 'middle' ? 5 : 85}
                      y="11"
                      textAnchor="middle"
                      fill={active ? part.color : '#94a3b8'}
                      fontSize="8"
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
