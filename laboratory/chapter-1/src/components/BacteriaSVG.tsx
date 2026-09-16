import React from 'react';
import { DiagramPart } from '../types';

interface BacteriaSVGProps {
  parts: DiagramPart[];
  selectedPartId: string | null;
  hoveredPartId: string | null;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string | null) => void;
  animationSpeed?: number;
  showLabels?: boolean;
  motilityActive?: boolean;
}

export const BacteriaSVG: React.FC<BacteriaSVGProps> = ({
  parts,
  selectedPartId,
  hoveredPartId,
  onSelectPart,
  onHoverPart,
  animationSpeed = 1,
  showLabels = true,
  motilityActive = true,
}) => {
  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  // Compute animation durations scaled by animationSpeed
  const flagellaDuration = `${2 / Math.max(animationSpeed, 0.2)}s`;
  const plasmidFloatDuration = `${4 / Math.max(animationSpeed, 0.2)}s`;
  const dnaPulseDuration = `${3.5 / Math.max(animationSpeed, 0.2)}s`;

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg
        viewBox="0 0 1000 600"
        className="w-full h-auto max-h-[600px] drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Intense neon glows */}
          <filter id="bacteria-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="bacteria-bright-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur1" />
            <feGaussianBlur stdDeviation="3" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradients */}
          <radialGradient id="cytoplasm-grad" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#065f46" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#044e3b" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#022c22" stopOpacity="1" />
          </radialGradient>

          <linearGradient id="capsule-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#0284c7" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#0369a1" stopOpacity="0.75" />
          </linearGradient>

          <linearGradient id="cellwall-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>

          <linearGradient id="membrane-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Pattern for Peptidoglycan mesh */}
          <pattern id="peptido-mesh" width="10" height="10" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="10" y2="10" stroke="#ca8a04" strokeWidth="0.8" opacity="0.3" />
            <line x1="10" y1="0" x2="0" y2="10" stroke="#ca8a04" strokeWidth="0.8" opacity="0.3" />
          </pattern>
        </defs>

        {/* Ambient Dark Biological Fluid Background */}
        <rect x="0" y="0" width="1000" height="600" fill="#030712" rx="20" />
        <circle cx="500" cy="300" r="380" fill="#047857" opacity="0.04" filter="blur(60px)" />
        <circle cx="200" cy="350" r="220" fill="#0284c7" opacity="0.05" filter="blur(50px)" />

        {/* ========================================================
            1. BACTERIAL FLAGELLA (السوط البكتيري الدوار والخطاف)
           ======================================================== */}
        <g
          id="flagellum-group"
          className="cursor-pointer transition-all duration-300"
          onClick={() => onSelectPart('flagellum')}
          onMouseEnter={() => onHoverPart('flagellum')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('flagellum') ? 'url(#bacteria-bright-glow)' : undefined}
        >
          {/* Basal Body Motor & Hook (القاعدة والخطاف في الغلاف) */}
          <ellipse cx="230" cy="310" rx="7" ry="12" fill="#0891b2" stroke="#06b6d4" strokeWidth="2" />
          <path
            d="M 230 310 Q 200 315 180 330"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle cx="180" cy="330" r="5" fill="#e0f2fe" />

          {/* Main Primary Helical Flagellum Filament */}
          <path
            d="M 180 330 C 130 360, 110 260, 60 320 C 20 370, -20 280, -80 340"
            fill="none"
            stroke={isPartActive('flagellum') ? '#67e8f9' : '#06b6d4'}
            strokeWidth={isPartActive('flagellum') ? 8 : 5.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={motilityActive ? 'animate-gentle-float' : ''}
            style={{
              animationDuration: flagellaDuration,
            }}
          />

          {/* Secondary trailing Flagellum Filament for realism */}
          <path
            d="M 185 325 C 145 280, 120 380, 70 330 C 30 290, -10 370, -60 310"
            fill="none"
            stroke={isPartActive('flagellum') ? '#38bdf8' : '#0891b2'}
            strokeWidth={isPartActive('flagellum') ? 6 : 3.5}
            strokeOpacity="0.75"
            strokeLinecap="round"
            className={motilityActive ? 'animate-gentle-float' : ''}
            style={{
              animationDuration: flagellaDuration,
              animationDelay: '0.4s',
            }}
          />

          {/* Dynamic rotation ripple indicators around flagellar base */}
          {motilityActive && (
            <g opacity="0.6">
              <ellipse cx="215" cy="320" rx="9" ry="18" fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3 3" />
              <ellipse cx="205" cy="325" rx="14" ry="24" fill="none" stroke="#67e8f9" strokeWidth="0.8" strokeDasharray="4 4" />
            </g>
          )}
        </g>

        {/* ========================================================
            2. PILI & FIMBRIAE (الأهداب والشعيرات السطحية الدقيقة)
           ======================================================== */}
        <g
          id="pili-fimbriae-group"
          className="cursor-pointer"
          onClick={() => onSelectPart('pili-fimbriae')}
          onMouseEnter={() => onHoverPart('pili-fimbriae')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('pili-fimbriae') ? 'url(#bacteria-glow)' : undefined}
        >
          {/* Array of short radiating fimbriae hairs around the capsule perimeter */}
          {[
            // Top rim pili
            { x1: 320, y1: 170, x2: 300, y2: 125 },
            { x1: 370, y1: 155, x2: 360, y2: 105 },
            { x1: 420, y1: 148, x2: 415, y2: 95 },
            { x1: 470, y1: 145, x2: 470, y2: 90 },
            { x1: 520, y1: 145, x2: 520, y2: 90 },
            { x1: 570, y1: 148, x2: 575, y2: 95 },
            { x1: 620, y1: 155, x2: 630, y2: 105 },
            { x1: 670, y1: 170, x2: 690, y2: 125 },
            { x1: 720, y1: 195, x2: 755, y2: 155 },
            // Right round cap pili
            { x1: 760, y1: 235, x2: 815, y2: 215 },
            { x1: 780, y1: 280, x2: 845, y2: 275 },
            { x1: 780, y1: 320, x2: 845, y2: 325 },
            { x1: 760, y1: 365, x2: 815, y2: 385 },
            // Bottom rim pili
            { x1: 720, y1: 405, x2: 755, y2: 445 },
            { x1: 670, y1: 430, x2: 690, y2: 475 },
            { x1: 620, y1: 445, x2: 630, y2: 495 },
            { x1: 570, y1: 452, x2: 575, y2: 505 },
            { x1: 520, y1: 455, x2: 520, y2: 510 },
            { x1: 470, y1: 455, x2: 470, y2: 510 },
            { x1: 420, y1: 452, x2: 415, y2: 505 },
            { x1: 370, y1: 445, x2: 360, y2: 495 },
            { x1: 320, y1: 430, x2: 300, y2: 475 },
            // Left round cap pili
            { x1: 255, y1: 395, x2: 215, y2: 435 },
            { x1: 235, y1: 250, x2: 190, y2: 230 },
            { x1: 255, y1: 205, x2: 215, y2: 165 },
          ].map((pilus, idx) => (
            <line
              key={`pilus-${idx}`}
              x1={pilus.x1}
              y1={pilus.y1}
              x2={pilus.x2}
              y2={pilus.y2}
              stroke={isPartActive('pili-fimbriae') ? '#fef08a' : '#eab308'}
              strokeWidth={isPartActive('pili-fimbriae') ? 3 : 2}
              strokeLinecap="round"
              opacity={isPartActive('pili-fimbriae') ? 1 : 0.75}
            />
          ))}

          {/* Conjugative Sex Pilus (هدب جنسي طويل متميز للاقتران) */}
          <path
            d="M 770 250 Q 820 230 870 210"
            fill="none"
            stroke={isPartActive('pili-fimbriae') ? '#fef08a' : '#fbbf24'}
            strokeWidth={isPartActive('pili-fimbriae') ? 4.5 : 3}
            strokeDasharray="6 3"
            strokeLinecap="round"
          />
          <circle cx="870" cy="210" r="3.5" fill="#facc15" />
        </g>

        {/* ========================================================
            3. BACTERIAL CAPSULE (المحفظة / الكبسولة اللزجة)
           ======================================================== */}
        <g
          id="capsule-group"
          className="cursor-pointer"
          onClick={() => onSelectPart('capsule')}
          onMouseEnter={() => onHoverPart('capsule')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('capsule') ? 'url(#bacteria-bright-glow)' : undefined}
        >
          {/* Outer Capsule Rod Shape (Pill/Capsule geometry) */}
          <rect
            x="240"
            y="145"
            width="520"
            height="310"
            rx="155"
            ry="155"
            fill="url(#capsule-grad)"
            stroke={isPartActive('capsule') ? '#38bdf8' : '#0284c7'}
            strokeWidth={isPartActive('capsule') ? 7 : 4}
            opacity="0.9"
          />
          {/* Subtle glossy sheen highlight along upper curvature */}
          <path
            d="M 330 165 Q 500 152 670 165"
            fill="none"
            stroke="#bae6fd"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.6"
          />
        </g>

        {/* ========================================================
            4. CELL WALL (الجدار الخلوي الببتيدوجلايكاني الصلب)
           ======================================================== */}
        <g
          id="cell-wall-group"
          className="cursor-pointer"
          onClick={() => onSelectPart('cell-wall')}
          onMouseEnter={() => onHoverPart('cell-wall')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('cell-wall') ? 'url(#bacteria-glow)' : undefined}
        >
          {/* Middle Peptidoglycan Cell Wall */}
          <rect
            x="260"
            y="165"
            width="480"
            height="270"
            rx="135"
            ry="135"
            fill="url(#cellwall-grad)"
            stroke={isPartActive('cell-wall') ? '#fef08a' : '#d97706'}
            strokeWidth={isPartActive('cell-wall') ? 6 : 3.5}
          />
          {/* Structural Mesh Pattern Overlay */}
          <rect
            x="260"
            y="165"
            width="480"
            height="270"
            rx="135"
            ry="135"
            fill="url(#peptido-mesh)"
            pointerEvents="none"
          />
        </g>

        {/* ========================================================
            5. PLASMA MEMBRANE (الغشاء البلازمي الداخلي)
           ======================================================== */}
        <g
          id="plasma-membrane-group"
          className="cursor-pointer"
          onClick={() => onSelectPart('plasma-membrane')}
          onMouseEnter={() => onHoverPart('plasma-membrane')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('plasma-membrane') ? 'url(#bacteria-glow)' : undefined}
        >
          <rect
            x="278"
            y="183"
            width="444"
            height="234"
            rx="117"
            ry="117"
            fill="url(#membrane-grad)"
            stroke={isPartActive('plasma-membrane') ? '#6ee7b7' : '#059669'}
            strokeWidth={isPartActive('plasma-membrane') ? 5 : 2.5}
          />
        </g>

        {/* ========================================================
            6. CYTOPLASM (السيتوبلازم والمحلول الخلوي الداخلي)
           ======================================================== */}
        <g
          id="cytoplasm-group"
          className="cursor-pointer"
          onClick={() => onSelectPart('cytoplasm')}
          onMouseEnter={() => onHoverPart('cytoplasm')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('cytoplasm') ? 'url(#bacteria-glow)' : undefined}
        >
          <rect
            x="288"
            y="193"
            width="424"
            height="214"
            rx="107"
            ry="107"
            fill="url(#cytoplasm-grad)"
            stroke={isPartActive('cytoplasm') ? '#34d399' : 'transparent'}
            strokeWidth={isPartActive('cytoplasm') ? 3 : 0}
          />
          {/* Organic cytosol texture granules */}
          {[
            { cx: 330, cy: 260, r: 1.5 },
            { cx: 350, cy: 320, r: 1.2 },
            { cx: 370, cy: 230, r: 1 },
            { cx: 640, cy: 240, r: 1.5 },
            { cx: 660, cy: 280, r: 1.2 },
            { cx: 630, cy: 370, r: 1 },
            { cx: 430, cy: 380, r: 1.5 },
            { cx: 570, cy: 380, r: 1.2 },
          ].map((dot, i) => (
            <circle key={`cyto-dot-${i}`} cx={dot.cx} cy={dot.cy} r={dot.r} fill="#6ee7b7" opacity="0.3" />
          ))}
        </g>

        {/* ========================================================
            7. MESOSOME (الميزوسوم / الانثناء الغشائي العميق)
           ======================================================== */}
        <g
          id="mesosome-group"
          className="cursor-pointer"
          onClick={() => onSelectPart('mesosome')}
          onMouseEnter={() => onHoverPart('mesosome')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('mesosome') ? 'url(#bacteria-bright-glow)' : undefined}
        >
          {/* Invaginating convolutions from bottom membrane inwards */}
          <path
            d="M 500 405 C 505 375, 490 355, 515 340 C 535 330, 550 350, 545 375 C 540 395, 555 400, 540 405 Z"
            fill="#0f766e"
            stroke={isPartActive('mesosome') ? '#2dd4bf' : '#14b8a6'}
            strokeWidth={isPartActive('mesosome') ? 4 : 2.5}
            strokeLinejoin="round"
          />
          {/* Internal vesicular folds of mesosome */}
          <path
            d="M 515 390 C 510 370, 530 360, 535 385"
            fill="none"
            stroke="#5eead4"
            strokeWidth="1.8"
          />
        </g>

        {/* ========================================================
            8. NUCLEOID / BACTERIAL DNA (المنطقة النووية و DNA الحلقي)
           ======================================================== */}
        <g
          id="nucleoid-group"
          className="cursor-pointer"
          onClick={() => onSelectPart('nucleoid')}
          onMouseEnter={() => onHoverPart('nucleoid')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('nucleoid') ? 'url(#bacteria-bright-glow)' : undefined}
        >
          {/* Tangled continuous circular dsDNA supercoil in center */}
          <g
            className="animate-gentle-pulse"
            style={{ animationDuration: dnaPulseDuration }}
          >
            {/* Ambient DNA halo */}
            <ellipse cx="470" cy="285" rx="110" ry="60" fill="#ec4899" opacity="0.12" filter="blur(14px)" />

            {/* Primary intricate supercoiled strand loops */}
            <path
              d="M 400 280 
                 C 380 240, 440 220, 480 240 
                 C 530 220, 560 260, 540 290 
                 C 560 330, 490 340, 450 320 
                 C 410 340, 370 310, 400 280 Z"
              fill="none"
              stroke={isPartActive('nucleoid') ? '#f472b6' : '#ec4899'}
              strokeWidth={isPartActive('nucleoid') ? 6 : 4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Inner secondary interwoven helical ribbons */}
            <path
              d="M 420 270 
                 C 440 290, 470 260, 500 280 
                 C 520 300, 470 330, 430 300 
                 C 450 250, 530 260, 490 300"
              fill="none"
              stroke={isPartActive('nucleoid') ? '#fbcfe8' : '#f43f5e'}
              strokeWidth={isPartActive('nucleoid') ? 4 : 2.8}
              strokeLinecap="round"
            />

            {/* Cross-linking loops to illustrate supercoiling */}
            <path
              d="M 445 255 Q 460 295 485 270"
              fill="none"
              stroke="#fda4af"
              strokeWidth="2"
            />
            <path
              d="M 490 285 Q 520 270 515 315"
              fill="none"
              stroke="#fda4af"
              strokeWidth="2"
            />
            <path
              d="M 425 295 Q 460 320 480 305"
              fill="none"
              stroke="#fda4af"
              strokeWidth="2"
            />
          </g>
        </g>

        {/* ========================================================
            9. PLASMIDS (البلازميد - حلقات DNA الصغيرة المستقلة)
           ======================================================== */}
        <g
          id="plasmid-group"
          className="cursor-pointer"
          onClick={() => onSelectPart('plasmid')}
          onMouseEnter={() => onHoverPart('plasmid')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('plasmid') ? 'url(#bacteria-bright-glow)' : undefined}
        >
          {/* Floating Plasmid 1 */}
          <g
            className="animate-gentle-float"
            style={{ animationDuration: plasmidFloatDuration }}
          >
            <circle
              cx="610"
              cy="315"
              r="22"
              fill="#581c87"
              fillOpacity="0.4"
              stroke={isPartActive('plasmid') ? '#e9d5ff' : '#a855f7'}
              strokeWidth={isPartActive('plasmid') ? 4.5 : 3}
            />
            {/* Inner ring to depict double-stranded circular DNA */}
            <circle
              cx="610"
              cy="315"
              r="17"
              fill="none"
              stroke="#c084fc"
              strokeWidth="1.5"
              strokeDasharray="5 2"
            />
            {/* Resistance Gene marker dot (موقع جين المقاومة) */}
            <circle cx="625" cy="308" r="3.5" fill="#f43f5e" />
          </g>

          {/* Floating Plasmid 2 */}
          <g
            className="animate-gentle-float"
            style={{ animationDuration: plasmidFloatDuration, animationDelay: '1.5s' }}
          >
            <circle
              cx="580"
              cy="235"
              r="15"
              fill="#581c87"
              fillOpacity="0.4"
              stroke={isPartActive('plasmid') ? '#e9d5ff' : '#a855f7'}
              strokeWidth={isPartActive('plasmid') ? 3.8 : 2.5}
            />
            <circle
              cx="580"
              cy="235"
              r="11"
              fill="none"
              stroke="#c084fc"
              strokeWidth="1.2"
              strokeDasharray="4 2"
            />
            <circle cx="590" cy="230" r="2.5" fill="#38bdf8" />
          </g>
        </g>

        {/* ========================================================
            10. 70S RIBOSOMES (الريبوسومات البكتيرية 70S)
           ======================================================== */}
        <g
          id="ribosomes-70s-group"
          className="cursor-pointer"
          onClick={() => onSelectPart('ribosomes-70s')}
          onMouseEnter={() => onHoverPart('ribosomes-70s')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('ribosomes-70s') ? 'url(#bacteria-bright-glow)' : undefined}
        >
          {[
            // Distribution across cytoplasm (50S large subunit + 30S small subunit)
            { x: 340, y: 225, rot: 15 },
            { x: 360, y: 275, rot: -20 },
            { x: 335, y: 340, rot: 45 },
            { x: 375, y: 360, rot: 10 },
            { x: 420, y: 220, rot: 30 },
            { x: 535, y: 220, rot: -15 },
            { x: 570, y: 260, rot: 25 },
            { x: 635, y: 225, rot: -30 },
            { x: 650, y: 265, rot: 5 },
            { x: 670, y: 305, rot: 40 },
            { x: 645, y: 350, rot: -10 },
            { x: 585, y: 360, rot: 20 },
            { x: 460, y: 375, rot: -25 },
          ].map((ribo, idx) => (
            <g
              key={`ribo-${idx}`}
              transform={`translate(${ribo.x}, ${ribo.y}) rotate(${ribo.rot})`}
            >
              {/* 50S Large subunit */}
              <ellipse
                cx="0"
                cy="-2.5"
                rx={isPartActive('ribosomes-70s') ? 5 : 4}
                ry={isPartActive('ribosomes-70s') ? 4 : 3}
                fill={isPartActive('ribosomes-70s') ? '#fdba74' : '#f97316'}
                stroke="#c2410c"
                strokeWidth="0.8"
              />
              {/* 30S Small subunit */}
              <ellipse
                cx="0"
                cy="2.5"
                rx={isPartActive('ribosomes-70s') ? 4 : 3}
                ry={isPartActive('ribosomes-70s') ? 2.8 : 2}
                fill={isPartActive('ribosomes-70s') ? '#fed7aa' : '#fb923c'}
                stroke="#c2410c"
                strokeWidth="0.6"
              />
            </g>
          ))}
        </g>

        {/* ========================================================
            11. INCLUSION GRANULES (الحبيبات التخزينية المشتملة)
           ======================================================== */}
        <g
          id="inclusion-granules-group"
          className="cursor-pointer"
          onClick={() => onSelectPart('inclusion-granules')}
          onMouseEnter={() => onHoverPart('inclusion-granules')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('inclusion-granules') ? 'url(#bacteria-bright-glow)' : undefined}
        >
          {/* Volutin / Polyphosphate & Glycogen storage bodies */}
          {[
            { cx: 685, cy: 235, r: 9, color: '#8b5cf6', stroke: '#c4b5fd' },
            { cx: 690, cy: 345, r: 12, color: '#7c3aed', stroke: '#ddd6fe' },
            { cx: 660, cy: 375, r: 8, color: '#6d28d9', stroke: '#c4b5fd' },
            { cx: 320, cy: 305, r: 10, color: '#8b5cf6', stroke: '#ddd6fe' },
          ].map((granule, idx) => (
            <g key={`granule-${idx}`}>
              <circle
                cx={granule.cx}
                cy={granule.cy}
                r={isPartActive('inclusion-granules') ? granule.r * 1.25 : granule.r}
                fill={granule.color}
                stroke={isPartActive('inclusion-granules') ? '#ffffff' : granule.stroke}
                strokeWidth={isPartActive('inclusion-granules') ? 2.5 : 1.5}
              />
              {/* Crystalline facets highlight */}
              <circle
                cx={granule.cx - granule.r * 0.3}
                cy={granule.cy - granule.r * 0.3}
                r={granule.r * 0.3}
                fill="#ffffff"
                opacity="0.6"
              />
            </g>
          ))}
        </g>

        {/* ========================================================
            12. SCIENTIFIC LABELS & POINTER CALLOUTS
           ======================================================== */}
        {showLabels && (
          <g id="bacteria-labels">
            {parts.map((part) => {
              const active = isPartActive(part.id);
              const { targetX, targetY, labelX, labelY, anchor = 'start' } = part.pointer;
              const midX = (targetX + labelX) / 2;
              const pathData = `M ${labelX} ${labelY} L ${midX} ${labelY} L ${targetX} ${targetY}`;

              return (
                <g
                  key={`bacteria-callout-${part.id}`}
                  className="cursor-pointer group"
                  onClick={() => onSelectPart(part.id)}
                  onMouseEnter={() => onHoverPart(part.id)}
                  onMouseLeave={() => onHoverPart(null)}
                >
                  {/* Pointer connection line */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke={active ? part.color : 'rgba(148, 163, 184, 0.45)'}
                    strokeWidth={active ? 2.5 : 1.2}
                    strokeDasharray={active ? 'none' : '3 3'}
                  />
                  {/* Pinhead point on the target */}
                  <circle
                    cx={targetX}
                    cy={targetY}
                    r={active ? 5.5 : 3.5}
                    fill={part.color}
                    stroke="#020617"
                    strokeWidth="1.5"
                  />

                  {/* Label card badge */}
                  <g transform={`translate(${labelX}, ${labelY})`}>
                    <rect
                      x={anchor === 'end' ? -175 : anchor === 'middle' ? -85 : -10}
                      y="-18"
                      width="185"
                      height="34"
                      rx="8"
                      fill={active ? '#1e293b' : '#0f172a'}
                      stroke={active ? part.color : 'rgba(71, 85, 105, 0.7)'}
                      strokeWidth={active ? 2 : 1}
                      filter={active ? 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' : undefined}
                    />
                    <text
                      x={anchor === 'end' ? -82 : anchor === 'middle' ? 7 : 82}
                      y="-2"
                      textAnchor="middle"
                      fill={active ? '#ffffff' : '#f1f5f9'}
                      fontSize="11.5"
                      fontWeight="bold"
                    >
                      {part.nameAr}
                    </text>
                    <text
                      x={anchor === 'end' ? -82 : anchor === 'middle' ? 7 : 82}
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
