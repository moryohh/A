import React from 'react';

interface DiagramSvgProps {
  onPartHover: (id: string | null) => void;
  onPartSelect: (id: string) => void;
  selectedPartId: string | null;
  hoveredPartId: string | null;
  isLiveMotion: boolean;
}

export const CapacitorChargingSvg: React.FC<DiagramSvgProps> = ({
  onPartHover,
  onPartSelect,
  selectedPartId,
  hoveredPartId,
  isLiveMotion,
}) => {
  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  return (
    <g id="capacitor-charging-svg" className="font-['Cairo',sans-serif]">
      <defs>
        <filter id="glow-bulb-charging" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="element-highlight-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0284c7" floodOpacity="0.8" />
        </filter>

        <style>{`
          @keyframes currentFlowCharging {
            from { stroke-dashoffset: 40; }
            to { stroke-dashoffset: 0; }
          }
          .animate-flow-charge {
            stroke-dasharray: 8 6;
            animation: currentFlowCharging 1.2s linear infinite;
          }
          @keyframes needleOscillate {
            0% { transform: rotate(0deg); }
            50% { transform: rotate(26deg); }
            100% { transform: rotate(0deg); }
          }
          .animate-needle {
            transform-origin: 460px 480px;
            animation: needleOscillate 2.4s ease-in-out infinite;
          }
          @keyframes bulbPulse {
            0%, 100% { opacity: 0.95; }
            50% { opacity: 0.65; }
          }
          .animate-bulb {
            animation: bulbPulse 1.8s ease-in-out infinite;
          }
        `}</style>
      </defs>

      {/* Grid background */}
      <pattern id="small-grid-1" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
      </pattern>
      <rect width="920" height="600" fill="url(#small-grid-1)" />

      {/* Main Schematic Wires (Solid Circuit Lines) */}
      <g stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* From Switch 1 to Bulb L1 */}
        <path d="M 430 130 L 360 130" />
        {/* From Bulb L1 to Resistor */}
        <path d="M 300 130 L 200 130 L 200 160" />
        {/* From Resistor to Battery */}
        <path d="M 200 220 L 200 310" />
        {/* From Battery down to bottom common rail */}
        <path d="M 200 370 L 200 480 L 420 480" />

        {/* Center branch (Switch common pivot down to Capacitor then to Galvanometer) */}
        <path d="M 460 160 L 460 260" />
        <path d="M 460 360 L 460 440" />

        {/* Branch 2 Right (Open in Charging, to Bulb L2) */}
        <path d="M 490 130 L 650 130" />
        <path d="M 710 130 L 780 130 L 780 480 L 500 480" strokeDasharray="6 6" stroke="#94a3b8" />
      </g>

      {/* Animated Current Flow Line in Branch 1 */}
      {isLiveMotion && (
        <path
          d="M 200 310 L 200 220 M 200 160 L 200 130 L 300 130 M 360 130 L 430 130 L 460 160 L 460 260 M 460 360 L 460 440 M 420 480 L 200 480 L 200 370"
          fill="none"
          stroke="#0284c7"
          strokeWidth="3.5"
          className="animate-flow-charge opacity-80 pointer-events-none"
        />
      )}

      {/* 1. TWO-WAY SWITCH (K) AT (460, 130) */}
      <g
        id="switch-k1"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('switch-k1')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('switch-k1')}
        filter={isPartActive('switch-k1') ? 'url(#element-highlight-glow)' : undefined}
      >
        <rect x="400" y="100" width="120" height="70" rx="8" fill="#f8fafc" stroke={isPartActive('switch-k1') ? '#0284c7' : '#cbd5e1'} strokeWidth="1.5" />
        <circle cx="430" cy="130" r="5" fill="#0284c7" />
        <text x="430" y="118" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#0284c7">1</text>
        
        <circle cx="490" cy="130" r="5" fill="#64748b" />
        <text x="490" y="118" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#64748b">2</text>
        
        <circle cx="460" cy="160" r="6" fill="#1e293b" />
        <text x="460" y="182" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1e293b">K</text>
        
        {/* Switch Blade connected to Position 1 */}
        <line x1="460" y1="160" x2="432" y2="132" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* 2. DC BATTERY (200, 340) */}
      <g
        id="dc-battery"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('dc-battery')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('dc-battery')}
        filter={isPartActive('dc-battery') ? 'url(#element-highlight-glow)' : undefined}
      >
        <line x1="170" y1="310" x2="230" y2="310" stroke="#dc2626" strokeWidth="4.5" strokeLinecap="round" />
        <text x="150" y="315" fontSize="18" fontWeight="bold" fill="#dc2626">+</text>

        <line x1="182" y1="330" x2="218" y2="330" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
        <text x="152" y="335" fontSize="20" fontWeight="bold" fill="#1e293b">−</text>

        <line x1="170" y1="350" x2="230" y2="350" stroke="#dc2626" strokeWidth="4.5" strokeLinecap="round" />
        <line x1="182" y1="370" x2="218" y2="370" stroke="#1e293b" strokeWidth="6" strokeLinecap="round" />
        <text x="245" y="345" fontSize="14" fontWeight="bold" fill="#1e293b" fontFamily="'JetBrains Mono', monospace">E</text>
      </g>

      {/* 3. RESISTOR R (200, 190) */}
      <g
        id="charging-resistor"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('charging-resistor')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('charging-resistor')}
        filter={isPartActive('charging-resistor') ? 'url(#element-highlight-glow)' : undefined}
      >
        <rect x="185" y="160" width="30" height="60" rx="3" fill={isPartActive('charging-resistor') ? '#fed7aa' : '#ffedd5'} stroke="#ea580c" strokeWidth="2.5" />
        <line x1="185" y1="175" x2="215" y2="175" stroke="#9a3412" strokeWidth="2" />
        <line x1="185" y1="190" x2="215" y2="190" stroke="#9a3412" strokeWidth="2" />
        <line x1="185" y1="205" x2="215" y2="205" stroke="#9a3412" strokeWidth="2" />
        <text x="235" y="195" fontSize="14" fontWeight="bold" fill="#ea580c" fontFamily="'JetBrains Mono', monospace">R</text>
      </g>

      {/* 4. LIGHT BULB L1 (330, 130) - Glowing momentarily */}
      <g
        id="bulb-l1"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('bulb-l1')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('bulb-l1')}
        filter={isPartActive('bulb-l1') ? 'url(#element-highlight-glow)' : undefined}
      >
        <circle cx="330" cy="130" r="28" fill="#fef08a" opacity="0.6" filter="url(#glow-bulb-charging)" className={isLiveMotion ? 'animate-bulb' : ''} />
        <circle cx="330" cy="130" r="18" fill="#fef9c3" stroke="#ca8a04" strokeWidth="2.5" />
        <path d="M 320 120 L 340 140 M 340 120 L 320 140" stroke="#b45309" strokeWidth="2" />
        <text x="330" y="98" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#b45309">L1</text>
      </g>

      {/* 5. CAPACITOR C (460, 310) */}
      <g
        id="capacitor-c"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('capacitor-c')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('capacitor-c')}
        filter={isPartActive('capacitor-c') ? 'url(#element-highlight-glow)' : undefined}
      >
        {/* Plate A */}
        <rect x="400" y="260" width="120" height="10" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
        <g fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
          <text x="420" y="269">+</text>
          <text x="440" y="269">+</text>
          <text x="460" y="269">+</text>
          <text x="480" y="269">+</text>
          <text x="500" y="269">+</text>
        </g>
        <text x="535" y="270" fontSize="13" fontWeight="bold" fill="#0284c7">A (+Q)</text>

        {/* Dielectric / Air gap */}
        <rect x="400" y="270" width="120" height="80" fill="#f0f9ff" opacity="0.5" />
        {isLiveMotion && (
          <g stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3">
            <line x1="430" y1="272" x2="430" y2="348" />
            <line x1="460" y1="272" x2="460" y2="348" />
            <line x1="490" y1="272" x2="490" y2="348" />
          </g>
        )}

        {/* Plate B */}
        <rect x="400" y="350" width="120" height="10" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
        <g fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">
          <text x="420" y="359">−</text>
          <text x="440" y="359">−</text>
          <text x="460" y="359">−</text>
          <text x="480" y="359">−</text>
          <text x="500" y="359">−</text>
        </g>
        <text x="535" y="360" fontSize="13" fontWeight="bold" fill="#0284c7">B (-Q)</text>
      </g>

      {/* 6. GALVANOMETER G (460, 480) */}
      <g
        id="galvanometer-g"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('galvanometer-g')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('galvanometer-g')}
        filter={isPartActive('galvanometer-g') ? 'url(#element-highlight-glow)' : undefined}
      >
        <circle cx="460" cy="480" r="38" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
        <path d="M 435 465 A 30 30 0 0 1 485 465" fill="none" stroke="#64748b" strokeWidth="1.5" />
        <line x1="460" y1="458" x2="460" y2="453" stroke="#0f172a" strokeWidth="2" />
        <line x1="445" y1="461" x2="442" y2="457" stroke="#64748b" strokeWidth="1.5" />
        <line x1="475" y1="461" x2="478" y2="457" stroke="#64748b" strokeWidth="1.5" />
        <text x="460" y="450" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f172a">0</text>
        <text x="460" y="505" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#0f172a" fontFamily="'JetBrains Mono', monospace">G</text>

        {/* Deflected Needle (Right) */}
        <line
          x1="460"
          y1="480"
          x2="480"
          y2="457"
          stroke="#dc2626"
          strokeWidth="2.5"
          strokeLinecap="round"
          className={isLiveMotion ? 'animate-needle' : ''}
        />
        <circle cx="460" cy="480" r="3.5" fill="#dc2626" />
      </g>

      {/* 7. LIGHT BULB L2 (680, 130) - Off during charging */}
      <g
        id="bulb-l2-off"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('bulb-l2-off')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('bulb-l2-off')}
        filter={isPartActive('bulb-l2-off') ? 'url(#element-highlight-glow)' : undefined}
      >
        <circle cx="680" cy="130" r="18" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 2" />
        <path d="M 672 122 L 688 138 M 688 122 L 672 138" stroke="#94a3b8" strokeWidth="1.5" />
        <text x="680" y="98" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#64748b">L2</text>
      </g>

      {/* 8. CURRENT ARROW (250, 115) */}
      <g
        id="current-flow"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('current-flow')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('current-flow')}
      >
        <path d="M 230 115 L 265 115" stroke="#0ea5e9" strokeWidth="2.5" />
        <polygon points="265,110 275,115 265,120" fill="#0ea5e9" />
        <text x="250" y="105" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#0284c7">I</text>
      </g>
    </g>
  );
};
