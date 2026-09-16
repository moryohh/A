import React from 'react';
import { DiagramPart, TransportType } from '../types';

interface PlasmaMembraneSVGProps {
  parts: DiagramPart[];
  selectedPartId: string | null;
  hoveredPartId: string | null;
  onSelectPart: (id: string) => void;
  onHoverPart: (id: string | null) => void;
  transportMode: TransportType;
  animationSpeed: number; // 0 = paused, 1 = normal, 1.5 = fast
  showLabels: boolean;
}

export const PlasmaMembraneSVG: React.FC<PlasmaMembraneSVGProps> = ({
  parts,
  selectedPartId,
  hoveredPartId,
  onSelectPart,
  onHoverPart,
  transportMode,
  animationSpeed,
  showLabels,
}) => {
  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  // Upper layer phospholipid head X coordinates (leaving gaps for proteins)
  // Channel protein at ~400-470, Carrier protein at ~590-670
  const upperHeadXs = [
    180, 202, 224, 246, 268, 290, 312, 334, 356, 378,
    // gap for channel protein (400 - 470)
    490, 512, 534, 556, 578,
    // gap for carrier protein (590 - 665)
    685, 707, 729, 751, 773, 795, 817
  ];

  const lowerHeadXs = [
    180, 202, 224, 246, 268, 290, 312, 334, 356, 378,
    // gap for channel
    490, 512, 534, 556, 578,
    // gap for carrier
    685, 707, 729, 751, 773, 795, 817
  ];

  const upperHeadY = 230;
  const lowerHeadY = 350;

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg
        viewBox="0 0 1000 620"
        className="w-full h-auto max-h-[620px] drop-shadow-2xl"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Neon Glow Filter for Highlights */}
          <filter id="pm-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.22  0 0 0 0 0.85  0 0 0 0 0.98  0 0 0 1 0"
              result="coloredBlur"
            />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="gold-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.98  0 0 0 0 0.75  0 0 0 0 0.18  0 0 0 1 0"
              result="goldBlur"
            />
            <feMerge>
              <feMergeNode in="goldBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Background Environment Gradients */}
          <linearGradient id="ecf-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0369a1" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.04" />
          </linearGradient>

          <linearGradient id="icf-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0d9488" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#042f2e" stopOpacity="0.30" />
          </linearGradient>

          {/* Phospholipid Head Spherical Gradient */}
          <radialGradient id="head-gradient-outer" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="45%" stopColor="#0ea5e9" />
            <stop offset="90%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#075985" />
          </radialGradient>

          <radialGradient id="head-gradient-inner" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="45%" stopColor="#06b6d4" />
            <stop offset="90%" stopColor="#0e7490" />
            <stop offset="100%" stopColor="#155e75" />
          </radialGradient>

          <radialGradient id="head-gradient-active" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#ca8a04" />
          </radialGradient>

          {/* Integral Channel Protein Gradient */}
          <linearGradient id="channel-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#7e22ce" />
            <stop offset="30%" stopColor="#a855f7" />
            <stop offset="70%" stopColor="#9333ea" />
            <stop offset="100%" stopColor="#6b21a8" />
          </linearGradient>

          {/* Carrier Protein Gradient */}
          <linearGradient id="carrier-gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#be185d" />
            <stop offset="35%" stopColor="#ec4899" />
            <stop offset="75%" stopColor="#db2777" />
            <stop offset="100%" stopColor="#9d174d" />
          </linearGradient>

          {/* Peripheral Protein Gradient */}
          <radialGradient id="peripheral-gradient" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fdba74" />
            <stop offset="50%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#c2410c" />
          </radialGradient>

          {/* Cholesterol Gradient */}
          <linearGradient id="cholesterol-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="60%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#ca8a04" />
          </linearGradient>

          {/* Carbohydrate Hexose Monomer Gradient */}
          <radialGradient id="hexose-gradient" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="60%" stopColor="#22c55e" />
            <stop offset="100%" stopColor="#15803d" />
          </radialGradient>
        </defs>

        {/* 1. Fluid Environments (ECF & Cytoplasm) */}
        <g
          className="cursor-pointer transition-opacity duration-300"
          onClick={() => onSelectPart('extracellular-fluid')}
          onMouseEnter={() => onHoverPart('extracellular-fluid')}
          onMouseLeave={() => onHoverPart(null)}
        >
          <rect
            x="30"
            y="20"
            width="940"
            height="190"
            rx="16"
            fill="url(#ecf-gradient)"
            stroke={isPartActive('extracellular-fluid') ? '#38bdf8' : 'rgba(56, 189, 248, 0.15)'}
            strokeWidth={isPartActive('extracellular-fluid') ? 2 : 1}
            strokeDasharray={isPartActive('extracellular-fluid') ? 'none' : '4 4'}
          />
          <text
            x="60"
            y="55"
            fill="#38bdf8"
            className="text-sm font-semibold tracking-wide"
            opacity={0.85}
          >
            السائل خارج الخلوي (Extracellular Fluid) — تركيز عالٍ لـ Na+ و O₂
          </text>
        </g>

        <g
          className="cursor-pointer transition-opacity duration-300"
          onClick={() => onSelectPart('cytoplasm')}
          onMouseEnter={() => onHoverPart('cytoplasm')}
          onMouseLeave={() => onHoverPart(null)}
        >
          <rect
            x="30"
            y="390"
            width="940"
            height="200"
            rx="16"
            fill="url(#icf-gradient)"
            stroke={isPartActive('cytoplasm') ? '#2dd4bf' : 'rgba(45, 212, 191, 0.15)'}
            strokeWidth={isPartActive('cytoplasm') ? 2 : 1}
            strokeDasharray={isPartActive('cytoplasm') ? 'none' : '4 4'}
          />
          <text
            x="60"
            y="575"
            fill="#2dd4bf"
            className="text-sm font-semibold tracking-wide"
            opacity={0.85}
          >
            السيتوبلازم (Cytoplasm) — سائل داخل الخلية، تركيز عالٍ لـ K+ وشحنة سالبة نسبية (-70mV)
          </text>
        </g>

        {/* Ambient floating ions in ECF and Cytoplasm */}
        <g opacity={0.65}>
          {/* ECF Na+ ions */}
          <g transform="translate(180, 80)">
            <circle r="9" fill="#38bdf8" opacity="0.3" />
            <circle r="6" fill="#38bdf8" />
            <text x="0" y="3" textAnchor="middle" fill="#0f172a" fontSize="8" fontWeight="bold">Na⁺</text>
          </g>
          <g transform="translate(240, 50)">
            <circle r="7" fill="#38bdf8" opacity="0.25" />
            <circle r="5" fill="#38bdf8" />
            <text x="0" y="2.5" textAnchor="middle" fill="#0f172a" fontSize="7" fontWeight="bold">Na⁺</text>
          </g>
          <g transform="translate(320, 95)">
            <circle r="8" fill="#38bdf8" opacity="0.25" />
            <circle r="5.5" fill="#38bdf8" />
            <text x="0" y="2.5" textAnchor="middle" fill="#0f172a" fontSize="7" fontWeight="bold">Na⁺</text>
          </g>
          <g transform="translate(740, 70)">
            <circle r="8" fill="#38bdf8" opacity="0.3" />
            <circle r="5.5" fill="#38bdf8" />
            <text x="0" y="2.5" textAnchor="middle" fill="#0f172a" fontSize="7" fontWeight="bold">Na⁺</text>
          </g>
          {/* O2 Molecules in ECF */}
          <g transform="translate(210, 115)">
            <ellipse rx="8" ry="4.5" fill="#a7f3d0" opacity="0.7" />
            <text x="0" y="2.5" textAnchor="middle" fill="#064e3b" fontSize="6.5" fontWeight="bold">O₂</text>
          </g>
          <g transform="translate(370, 75)">
            <ellipse rx="8" ry="4.5" fill="#a7f3d0" opacity="0.7" />
            <text x="0" y="2.5" textAnchor="middle" fill="#064e3b" fontSize="6.5" fontWeight="bold">O₂</text>
          </g>
          {/* Cytoplasm K+ ions */}
          <g transform="translate(200, 480)">
            <circle r="9" fill="#a855f7" opacity="0.25" />
            <circle r="6" fill="#c084fc" />
            <text x="0" y="3" textAnchor="middle" fill="#2e1065" fontSize="8" fontWeight="bold">K⁺</text>
          </g>
          <g transform="translate(340, 520)">
            <circle r="9" fill="#a855f7" opacity="0.25" />
            <circle r="6" fill="#c084fc" />
            <text x="0" y="3" textAnchor="middle" fill="#2e1065" fontSize="8" fontWeight="bold">K⁺</text>
          </g>
          <g transform="translate(720, 510)">
            <circle r="9" fill="#a855f7" opacity="0.25" />
            <circle r="6" fill="#c084fc" />
            <text x="0" y="3" textAnchor="middle" fill="#2e1065" fontSize="8" fontWeight="bold">K⁺</text>
          </g>
        </g>

        {/* 2. Cytoskeleton Microfilaments ( خيوط الأكتين في السيتوبلازم ) */}
        <g
          id="cytoskeleton-layer"
          className="cursor-pointer"
          onClick={() => onSelectPart('cytoskeleton-filaments')}
          onMouseEnter={() => onHoverPart('cytoskeleton-filaments')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('cytoskeleton-filaments') ? 'url(#pm-glow)' : undefined}
        >
          {/* Microfilament strand 1 */}
          <path
            d="M 150 410 Q 280 430, 410 405 T 670 415 T 840 405"
            fill="none"
            stroke={isPartActive('cytoskeleton-filaments') ? '#38bdf8' : '#64748b'}
            strokeWidth="5"
            strokeLinecap="round"
          />
          {/* Actin beads on strand 1 */}
          {[160, 200, 240, 280, 320, 360, 400, 440, 480, 520, 560, 600, 640, 680, 720, 760, 800, 830].map(
            (bx, idx) => {
              const by = 410 + Math.sin(idx * 0.7) * 8;
              return (
                <circle
                  key={`actin-1-${idx}`}
                  cx={bx}
                  cy={by}
                  r="4"
                  fill={isPartActive('cytoskeleton-filaments') ? '#7dd3fc' : '#94a3b8'}
                  stroke="#334155"
                  strokeWidth="1"
                />
              );
            }
          )}

          {/* Microfilament strand 2 (cross-linked) */}
          <path
            d="M 170 435 Q 310 445, 450 430 T 700 440 T 830 425"
            fill="none"
            stroke={isPartActive('cytoskeleton-filaments') ? '#38bdf8' : '#475569'}
            strokeWidth="4"
            strokeDasharray="1 1"
          />
          {/* Connecting anchors to membrane proteins */}
          <path
            d="M 430 380 L 420 405 M 620 375 L 630 415 M 760 380 L 760 410"
            stroke={isPartActive('cytoskeleton-filaments') ? '#0284c7' : '#475569'}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>

        {/* 3. Hydrophobic Tails (ذيول الأحماض الدهنية الكارهة للماء) */}
        <g
          id="hydrophobic-tails-layer"
          className="cursor-pointer"
          onClick={() => onSelectPart('hydrophobic-tail')}
          onMouseEnter={() => onHoverPart('hydrophobic-tail')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('hydrophobic-tail') ? 'url(#gold-glow)' : undefined}
        >
          {/* Upper layer tails pointing downwards */}
          {upperHeadXs.map((hx, idx) => {
            const isTailActive = isPartActive('hydrophobic-tail') || isPartActive('phospholipid-bilayer');
            const strokeCol = isTailActive ? '#fde047' : '#f59e0b';
            const strokeWidth = isTailActive ? 2.5 : 2;
            const waveOffset = Math.sin(idx * 0.8) * (animationSpeed > 0 ? 3 : 0);

            return (
              <g key={`upper-tail-${idx}`}>
                {/* Straight wavy tail 1 */}
                <path
                  d={`M ${hx - 4} ${upperHeadY + 9} Q ${hx - 8 + waveOffset} ${upperHeadY + 30}, ${hx - 3} ${upperHeadY + 55}`}
                  fill="none"
                  stroke={strokeCol}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  opacity={0.9}
                />
                {/* Kinked tail 2 with double bond kink */}
                <path
                  d={`M ${hx + 4} ${upperHeadY + 9} Q ${hx + 6} ${upperHeadY + 25}, ${hx + 2} ${upperHeadY + 35} L ${hx + 11 - waveOffset} ${upperHeadY + 54}`}
                  fill="none"
                  stroke={strokeCol}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  opacity={0.9}
                />
              </g>
            );
          })}

          {/* Lower layer tails pointing upwards */}
          {lowerHeadXs.map((hx, idx) => {
            const isTailActive = isPartActive('hydrophobic-tail') || isPartActive('phospholipid-bilayer');
            const strokeCol = isTailActive ? '#fde047' : '#f59e0b';
            const strokeWidth = isTailActive ? 2.5 : 2;
            const waveOffset = Math.cos(idx * 0.8) * (animationSpeed > 0 ? 3 : 0);

            return (
              <g key={`lower-tail-${idx}`}>
                {/* Straight wavy tail 1 */}
                <path
                  d={`M ${hx - 4} ${lowerHeadY - 9} Q ${hx - 7 - waveOffset} ${lowerHeadY - 30}, ${hx - 3} ${lowerHeadY - 55}`}
                  fill="none"
                  stroke={strokeCol}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  opacity={0.9}
                />
                {/* Kinked tail 2 */}
                <path
                  d={`M ${hx + 4} ${lowerHeadY - 9} Q ${hx + 7} ${lowerHeadY - 24}, ${hx + 3} ${lowerHeadY - 35} L ${hx + 10 + waveOffset} ${lowerHeadY - 54}`}
                  fill="none"
                  stroke={strokeCol}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  opacity={0.9}
                />
              </g>
            );
          })}
        </g>

        {/* 4. Cholesterol Molecules (الكوليسترول المنظم للسيولة) */}
        <g
          id="cholesterol-layer"
          className="cursor-pointer"
          onClick={() => onSelectPart('cholesterol')}
          onMouseEnter={() => onHoverPart('cholesterol')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('cholesterol') ? 'url(#gold-glow)' : undefined}
        >
          {[
            { x: 236, y: 270, rotate: 12 },
            { x: 345, y: 265, rotate: -8 },
            { x: 502, y: 265, rotate: 10 },
            { x: 546, y: 310, rotate: -15 },
            { x: 740, y: 275, rotate: 5 },
            { x: 785, y: 315, rotate: -10 }
          ].map((ch, idx) => (
            <g
              key={`cholesterol-${idx}`}
              transform={`translate(${ch.x}, ${ch.y}) rotate(${ch.rotate})`}
              className="transition-transform duration-200 hover:scale-110"
            >
              {/* Four fused hydrocarbon rings */}
              {/* Ring A */}
              <rect
                x="-8"
                y="-18"
                width="16"
                height="10"
                rx="2"
                fill="url(#cholesterol-gradient)"
                stroke="#78350f"
                strokeWidth="1.2"
              />
              {/* Ring B */}
              <rect
                x="-6"
                y="-9"
                width="15"
                height="9"
                rx="2"
                fill="url(#cholesterol-gradient)"
                stroke="#78350f"
                strokeWidth="1.2"
              />
              {/* Ring C */}
              <rect
                x="-7"
                y="-1"
                width="15"
                height="9"
                rx="2"
                fill="url(#cholesterol-gradient)"
                stroke="#78350f"
                strokeWidth="1.2"
              />
              {/* Ring D (5-membered) */}
              <polygon
                points="-5,8 8,8 10,16 1,18 -4,15"
                fill="url(#cholesterol-gradient)"
                stroke="#78350f"
                strokeWidth="1.2"
              />
              {/* Polar -OH group interacting with phosphate head */}
              <circle cx="-1" cy="-21" r="3" fill="#f87171" stroke="#991b1b" strokeWidth="0.8" />
              {/* Nonpolar isooctyl tail */}
              <path
                d="M 4 18 L 8 26 L 14 28"
                fill="none"
                stroke="#b45309"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </g>
          ))}
        </g>

        {/* 5. Phospholipid Polar Heads (الرؤوس المحبة للماء) */}
        <g
          id="hydrophilic-heads-layer"
          className="cursor-pointer"
          onClick={() => onSelectPart('hydrophilic-head')}
          onMouseEnter={() => onHoverPart('hydrophilic-head')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('hydrophilic-head') ? 'url(#pm-glow)' : undefined}
        >
          {/* Upper heads */}
          {upperHeadXs.map((hx, idx) => {
            const isHeadActive = isPartActive('hydrophilic-head') || isPartActive('phospholipid-bilayer');
            const floatY = animationSpeed > 0 ? Math.sin((idx + Date.now() / 1500) * 0.5) * 1.5 : 0;

            return (
              <circle
                key={`upper-head-${idx}`}
                cx={hx}
                cy={upperHeadY + floatY}
                r="10.5"
                fill={isHeadActive ? 'url(#head-gradient-active)' : 'url(#head-gradient-outer)'}
                stroke={isHeadActive ? '#facc15' : '#0369a1'}
                strokeWidth={isHeadActive ? 2 : 1}
                className="transition-colors duration-200"
              />
            );
          })}

          {/* Lower heads */}
          {lowerHeadXs.map((hx, idx) => {
            const isHeadActive = isPartActive('hydrophilic-head') || isPartActive('phospholipid-bilayer');
            const floatY = animationSpeed > 0 ? Math.cos((idx + Date.now() / 1500) * 0.5) * 1.5 : 0;

            return (
              <circle
                key={`lower-head-${idx}`}
                cx={hx}
                cy={lowerHeadY + floatY}
                r="10.5"
                fill={isHeadActive ? 'url(#head-gradient-active)' : 'url(#head-gradient-inner)'}
                stroke={isHeadActive ? '#facc15' : '#0e7490'}
                strokeWidth={isHeadActive ? 2 : 1}
                className="transition-colors duration-200"
              />
            );
          })}
        </g>

        {/* 6. Peripheral Protein (بروتين طرفي سطحي) */}
        <g
          id="peripheral-protein-layer"
          className="cursor-pointer"
          onClick={() => onSelectPart('peripheral-protein')}
          onMouseEnter={() => onHoverPart('peripheral-protein')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('peripheral-protein') ? 'url(#pm-glow)' : undefined}
        >
          <ellipse
            cx="750"
            cy="380"
            rx="38"
            ry="24"
            fill="url(#peripheral-gradient)"
            stroke={isPartActive('peripheral-protein') ? '#facc15' : '#9a3412'}
            strokeWidth={isPartActive('peripheral-protein') ? 3 : 1.5}
            className="transition-transform duration-200 hover:scale-105"
          />
          {/* Internal protein folds / peptide domains */}
          <path
            d="M 725 375 Q 750 365, 770 380 Q 750 395, 730 385"
            fill="none"
            stroke="#fed7aa"
            strokeWidth="2"
            opacity="0.6"
          />
          <text
            x="750"
            y="384"
            textAnchor="middle"
            fill="#431407"
            fontSize="10"
            fontWeight="bold"
          >
            بروتين طرفي
          </text>
        </g>

        {/* 7. Integral Channel Protein (بروتين القناة الناقلة المدمج) */}
        <g
          id="channel-protein-layer"
          className="cursor-pointer"
          onClick={() => onSelectPart('channel-protein')}
          onMouseEnter={() => onHoverPart('channel-protein')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('channel-protein') ? 'url(#pm-glow)' : undefined}
        >
          {/* Left Lobe (Subunit A) */}
          <path
            d="M 405 205 C 385 220, 385 270, 390 300 C 385 330, 390 365, 415 375 C 425 372, 428 350, 428 330 L 426 250 C 426 230, 420 208, 405 205 Z"
            fill="url(#channel-gradient)"
            stroke={isPartActive('channel-protein') ? '#facc15' : '#581c87'}
            strokeWidth={isPartActive('channel-protein') ? 2.5 : 1.5}
          />
          {/* Alpha-helix highlights on Left Lobe */}
          <path
            d="M 398 225 Q 415 235, 400 250 Q 418 265, 402 280 Q 418 295, 402 310 Q 418 325, 405 340 Q 420 355, 410 365"
            fill="none"
            stroke="#e9d5ff"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.75"
          />

          {/* Right Lobe (Subunit B) */}
          <path
            d="M 465 205 C 485 220, 485 270, 480 300 C 485 330, 480 365, 455 375 C 445 372, 442 350, 442 330 L 444 250 C 444 230, 450 208, 465 205 Z"
            fill="url(#channel-gradient)"
            stroke={isPartActive('channel-protein') ? '#facc15' : '#581c87'}
            strokeWidth={isPartActive('channel-protein') ? 2.5 : 1.5}
          />
          {/* Alpha-helix highlights on Right Lobe */}
          <path
            d="M 472 225 Q 455 235, 470 250 Q 452 265, 468 280 Q 452 295, 468 310 Q 452 325, 465 340 Q 450 355, 460 365"
            fill="none"
            stroke="#e9d5ff"
            strokeWidth="2.2"
            strokeLinecap="round"
            opacity="0.75"
          />

          {/* Central Hydrophilic Pore (مجرى القناة) */}
          <rect
            x="427"
            y="210"
            width="16"
            height="162"
            fill="#3b82f6"
            opacity="0.25"
          />
          <text
            x="435"
            y="295"
            transform="rotate(-90 435 295)"
            textAnchor="middle"
            fill="#d8b4fe"
            fontSize="9"
            fontWeight="bold"
            letterSpacing="1"
          >
            ممر مائي أيوني
          </text>
        </g>

        {/* 8. Carrier Protein / Pump (بروتين حامل ومضخة غشائية) */}
        <g
          id="carrier-protein-layer"
          className="cursor-pointer"
          onClick={() => onSelectPart('carrier-protein')}
          onMouseEnter={() => onHoverPart('carrier-protein')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('carrier-protein') ? 'url(#pm-glow)' : undefined}
        >
          {/* Left domain */}
          <path
            d="M 590 200 C 570 220, 565 260, 570 300 C 565 340, 575 375, 595 385 C 605 380, 615 350, 610 320 L 605 285 C 600 250, 605 220, 590 200 Z"
            fill="url(#carrier-gradient)"
            stroke={isPartActive('carrier-protein') ? '#facc15' : '#831843'}
            strokeWidth={isPartActive('carrier-protein') ? 2.5 : 1.5}
          />
          {/* Right domain */}
          <path
            d="M 645 200 C 665 220, 670 260, 665 300 C 670 340, 660 375, 640 385 C 630 380, 620 350, 625 320 L 630 285 C 635 250, 630 220, 645 200 Z"
            fill="url(#carrier-gradient)"
            stroke={isPartActive('carrier-protein') ? '#facc15' : '#831843'}
            strokeWidth={isPartActive('carrier-protein') ? 2.5 : 1.5}
          />

          {/* Central binding pocket */}
          <ellipse cx="617" cy="275" rx="11" ry="16" fill="#be185d" opacity="0.4" />
          {/* ATP Binding site badge on intracellular side */}
          <g transform="translate(617, 385)">
            <rect x="-18" y="-4" width="36" height="15" rx="6" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
            <text x="0" y="7" textAnchor="middle" fill="#451a03" fontSize="8" fontWeight="bold">ATP</text>
          </g>
        </g>

        {/* 9. Glycoprotein & Glycolipid Carbohydrate Chains */}
        {/* Glycoprotein at x: 345, y: 220 */}
        <g
          id="glycoprotein-layer"
          className="cursor-pointer"
          onClick={() => onSelectPart('glycoprotein')}
          onMouseEnter={() => onHoverPart('glycoprotein')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('glycoprotein') ? 'url(#pm-glow)' : undefined}
        >
          {/* Integral Protein Anchor */}
          <path
            d="M 335 215 C 325 240, 325 280, 332 310 C 328 335, 335 365, 350 375 C 362 365, 362 330, 358 300 C 362 265, 358 230, 348 215 Z"
            fill="#10b981"
            stroke={isPartActive('glycoprotein') ? '#facc15' : '#065f46'}
            strokeWidth="1.5"
          />
          {/* Oligosaccharide Tree 1 */}
          <g id="glycan-tree-1" transform="translate(340, 215)">
            {/* Stem line */}
            <path
              d="M 0 0 L -5 -25 L -20 -45 M -5 -25 L 15 -48 L 10 -75 M 15 -48 L 35 -65"
              fill="none"
              stroke={isPartActive('glycoprotein') ? '#4ade80' : '#15803d'}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Hexose Hexagon Monomers */}
            {[
              { x: -5, y: -25 },
              { x: -20, y: -45 },
              { x: -35, y: -65 },
              { x: 15, y: -48 },
              { x: 10, y: -75 },
              { x: 35, y: -65 }
            ].map((node, nIdx) => (
              <g key={`glyco-node-1-${nIdx}`} transform={`translate(${node.x}, ${node.y})`}>
                <polygon
                  points="0,-6 5,-3 5,3 0,6 -5,3 -5,-3"
                  fill="url(#hexose-gradient)"
                  stroke="#166534"
                  strokeWidth="1"
                />
              </g>
            ))}
          </g>
        </g>

        {/* Carbohydrate chain attached to channel protein / lipid (x: 520, y: 220) */}
        <g
          id="carbohydrate-chain-layer"
          className="cursor-pointer"
          onClick={() => onSelectPart('carbohydrate-chain')}
          onMouseEnter={() => onHoverPart('carbohydrate-chain')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('carbohydrate-chain') ? 'url(#pm-glow)' : undefined}
        >
          <g transform="translate(520, 220)">
            <path
              d="M 0 0 L 10 -25 L -5 -50 L 5 -75 M 10 -25 L 28 -40 L 40 -65"
              fill="none"
              stroke={isPartActive('carbohydrate-chain') ? '#facc15' : '#ca8a04'}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {[
              { x: 10, y: -25 },
              { x: -5, y: -50 },
              { x: 5, y: -75 },
              { x: 28, y: -40 },
              { x: 40, y: -65 }
            ].map((hex, hIdx) => (
              <g key={`carb-chain-${hIdx}`} transform={`translate(${hex.x}, ${hex.y})`}>
                <polygon
                  points="0,-6 5.5,-3 5.5,3 0,6 -5.5,3 -5.5,-3"
                  fill="#fef08a"
                  stroke="#a16207"
                  strokeWidth="1"
                />
              </g>
            ))}
          </g>
        </g>

        {/* Glycolipid (دهن سكري) at x: 707, y: 230 */}
        <g
          id="glycolipid-layer"
          className="cursor-pointer"
          onClick={() => onSelectPart('glycolipid')}
          onMouseEnter={() => onHoverPart('glycolipid')}
          onMouseLeave={() => onHoverPart(null)}
          filter={isPartActive('glycolipid') ? 'url(#pm-glow)' : undefined}
        >
          <g transform="translate(707, 220)">
            <path
              d="M 0 0 L 8 -25 L 2 -50 L 16 -70 M 8 -25 L 24 -35"
              fill="none"
              stroke={isPartActive('glycolipid') ? '#bef264' : '#65a30d'}
              strokeWidth="2"
              strokeLinecap="round"
            />
            {[
              { x: 8, y: -25 },
              { x: 2, y: -50 },
              { x: 16, y: -70 },
              { x: 24, y: -35 }
            ].map((node, idx) => (
              <g key={`glycolipid-node-${idx}`} transform={`translate(${node.x}, ${node.y})`}>
                <polygon
                  points="0,-5.5 5,-2.7 5,2.7 0,5.5 -5,2.7 -5,-2.7"
                  fill="#a3e635"
                  stroke="#3f6212"
                  strokeWidth="1"
                />
              </g>
            ))}
          </g>
        </g>

        {/* 10. Active Dynamic Transport Simulation Particles */}
        {transportMode === 'simple-diffusion' && (
          <g id="simple-diffusion-particles">
            {/* O2 / CO2 small non-polar molecules slipping directly through lipid bilayer */}
            {[
              { x: 240, startY: 130, endY: 450, delay: 0 },
              { x: 280, startY: 140, endY: 460, delay: 1.2 },
              { x: 740, startY: 135, endY: 455, delay: 0.6 },
              { x: 790, startY: 150, endY: 440, delay: 1.8 },
            ].map((mol, idx) => (
              <g key={`simple-diff-${idx}`}>
                <circle cx={mol.x} cy={mol.startY} r="7" fill="#4ade80" opacity="0.9">
                  <animate
                    attributeName="cy"
                    from={mol.startY}
                    to={mol.endY}
                    dur="3s"
                    begin={`${mol.delay}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0; 1; 1; 0.9; 0"
                    keyTimes="0; 0.15; 0.85; 0.95; 1"
                    dur="3s"
                    begin={`${mol.delay}s`}
                    repeatCount="indefinite"
                  />
                </circle>
                <text
                  x={mol.x}
                  y={mol.startY}
                  textAnchor="middle"
                  fill="#064e3b"
                  fontSize="7"
                  fontWeight="bold"
                >
                  <animate
                    attributeName="y"
                    from={mol.startY + 2.5}
                    to={mol.endY + 2.5}
                    dur="3s"
                    begin={`${mol.delay}s`}
                    repeatCount="indefinite"
                  />
                  O₂
                </text>
              </g>
            ))}
          </g>
        )}

        {transportMode === 'facilitated-diffusion' && (
          <g id="facilitated-diffusion-particles">
            {/* Na+ ions traversing smoothly through the Channel Protein pore at x: 435 */}
            {[
              { delay: 0 },
              { delay: 0.8 },
              { delay: 1.6 },
              { delay: 2.4 }
            ].map((p, idx) => (
              <g key={`fac-diff-${idx}`}>
                <circle cx="435" cy="150" r="9" fill="#c084fc" opacity="0.9">
                  <animate
                    attributeName="cy"
                    from="150"
                    to="440"
                    dur="2.4s"
                    begin={`${p.delay}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0; 1; 1; 0.9; 0"
                    keyTimes="0; 0.1; 0.85; 0.95; 1"
                    dur="2.4s"
                    begin={`${p.delay}s`}
                    repeatCount="indefinite"
                  />
                </circle>
                <text
                  x="435"
                  y="153"
                  textAnchor="middle"
                  fill="#3b0764"
                  fontSize="8"
                  fontWeight="bold"
                >
                  <animate
                    attributeName="y"
                    from="153"
                    to="443"
                    dur="2.4s"
                    begin={`${p.delay}s`}
                    repeatCount="indefinite"
                  />
                  Na⁺
                </text>
              </g>
            ))}
          </g>
        )}

        {transportMode === 'active-transport' && (
          <g id="active-transport-particles">
            {/* K+ ions pumped into cytoplasm, Na+ pumped out against gradient via carrier at x: 617 */}
            {/* Upward pumped Na+ */}
            {[0, 1.4].map((delay, idx) => (
              <g key={`act-up-${idx}`}>
                <circle cx="610" cy="430" r="8" fill="#38bdf8">
                  <animate
                    attributeName="cy"
                    from="430"
                    to="150"
                    dur="2.8s"
                    begin={`${delay}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0; 1; 1; 0.9; 0"
                    dur="2.8s"
                    begin={`${delay}s`}
                    repeatCount="indefinite"
                  />
                </circle>
                <text x="610" y="433" textAnchor="middle" fill="#0c4a6e" fontSize="7.5" fontWeight="bold">
                  <animate
                    attributeName="y"
                    from="433"
                    to="153"
                    dur="2.8s"
                    begin={`${delay}s`}
                    repeatCount="indefinite"
                  />
                  3Na⁺
                </text>
              </g>
            ))}

            {/* Downward pumped K+ */}
            {[0.7, 2.1].map((delay, idx) => (
              <g key={`act-down-${idx}`}>
                <circle cx="625" cy="150" r="8" fill="#f43f5e">
                  <animate
                    attributeName="cy"
                    from="150"
                    to="430"
                    dur="2.8s"
                    begin={`${delay}s`}
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0; 1; 1; 0.9; 0"
                    dur="2.8s"
                    begin={`${delay}s`}
                    repeatCount="indefinite"
                  />
                </circle>
                <text x="625" y="153" textAnchor="middle" fill="#fff" fontSize="7.5" fontWeight="bold">
                  <animate
                    attributeName="y"
                    from="153"
                    to="433"
                    dur="2.8s"
                    begin={`${delay}s`}
                    repeatCount="indefinite"
                  />
                  2K⁺
                </text>
              </g>
            ))}
          </g>
        )}

        {/* 11. Interactive Callout Labels & Pointers (التأشيرات والأسهم التوضيحية الواضحة) */}
        {showLabels && (
          <g id="labels-and-callouts" className="transition-opacity duration-300">
            {parts.map((part) => {
              const active = isPartActive(part.id);
              const { targetX, targetY, labelX, labelY, anchor = 'start' } = part.pointer;
              const isLeftColumn = anchor === 'end';
              const leaderPath = `M ${labelX} ${labelY} L ${targetX} ${targetY}`;

              return (
                <g
                  key={`callout-${part.id}`}
                  className="cursor-pointer group transition-all duration-200"
                  onClick={() => onSelectPart(part.id)}
                  onMouseEnter={() => onHoverPart(part.id)}
                  onMouseLeave={() => onHoverPart(null)}
                >
                  {/* High-contrast solid connecting line */}
                  <path
                    d={leaderPath}
                    fill="none"
                    stroke={active ? part.color : 'rgba(100, 116, 139, 0.75)'}
                    strokeWidth={active ? 3 : 1.8}
                  />

                  {/* Target Pinpoint with animated pulse */}
                  <circle
                    cx={targetX}
                    cy={targetY}
                    r={active ? 6 : 4}
                    fill={part.color}
                    stroke="#020617"
                    strokeWidth="2"
                  />
                  {active && (
                    <circle
                      cx={targetX}
                      cy={targetY}
                      r="12"
                      fill="none"
                      stroke={part.color}
                      strokeWidth="2"
                      opacity="0.8"
                      className="animate-ping"
                    />
                  )}

                  {/* High-contrast solid label badge */}
                  <g transform={`translate(${labelX}, ${labelY})`}>
                    <rect
                      x={isLeftColumn ? -200 : anchor === 'middle' ? -100 : 0}
                      y="-18"
                      width="200"
                      height="36"
                      rx="10"
                      fill={active ? '#0f172a' : '#090d16'}
                      stroke={active ? part.color : 'rgba(51, 65, 85, 0.9)'}
                      strokeWidth={active ? 2.5 : 1.5}
                      className="transition-all duration-200 drop-shadow-lg"
                    />

                    <circle
                      cx={isLeftColumn ? -15 : anchor === 'middle' ? 85 : 185}
                      cy="0"
                      r="5"
                      fill={part.color}
                    />

                    {/* Arabic Primary Label */}
                    <text
                      x={isLeftColumn ? -105 : anchor === 'middle' ? 0 : 95}
                      y="4"
                      textAnchor="middle"
                      fill={active ? '#ffffff' : '#f1f5f9'}
                      fontSize="12.5"
                      fontWeight="800"
                      className="select-none tracking-wide"
                    >
                      {part.nameAr}
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
