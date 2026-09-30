import React from 'react';

interface DiagramSvgProps {
  onPartHover: (id: string | null) => void;
  onPartSelect: (id: string) => void;
  selectedPartId: string | null;
  hoveredPartId: string | null;
  isLiveMotion: boolean;
}

export const CapacitorDischargingSvg: React.FC<DiagramSvgProps> = ({
  onPartHover,
  onPartSelect,
  selectedPartId,
  hoveredPartId,
  isLiveMotion,
}) => {
  const isPartActive = (id: string) => selectedPartId === id || hoveredPartId === id;

  return (
    <g id="capacitor-discharging-svg" className="font-['Cairo',sans-serif]">
      <defs>
        <filter id="glow-bulb-discharging" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="element-highlight-glow-2" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0284c7" floodOpacity="0.8" />
        </filter>

        <style>{`
          @keyframes currentFlowDischarging {
            from { stroke-dashoffset: 0; }
            to { stroke-dashoffset: 40; }
          }
          .animate-flow-disch {
            stroke-dasharray: 8 6;
            animation: currentFlowDischarging 1s linear infinite;
          }
          @keyframes needleOscillateLeft {
            0% { transform: rotate(0deg); }
            50% { transform: rotate(-26deg); }
            100% { transform: rotate(0deg); }
          }
          .animate-needle-left {
            transform-origin: 460px 480px;
            animation: needleOscillateLeft 2.2s ease-in-out infinite;
          }
          @keyframes bulbPulseDisch {
            0%, 100% { opacity: 0.95; }
            50% { opacity: 0.6; }
          }
          .animate-bulb-disch {
            animation: bulbPulseDisch 1.6s ease-in-out infinite;
          }
        `}</style>
      </defs>

      {/* Grid background */}
      <pattern id="small-grid-2" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f1f5f9" strokeWidth="0.8" />
      </pattern>
      <rect width="920" height="600" fill="url(#small-grid-2)" />

      {/* Main Schematic Wires */}
      <g stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Left Branch (Disconnected) */}
        <path d="M 430 130 L 360 130" strokeDasharray="6 6" stroke="#94a3b8" />
        <path d="M 300 130 L 200 130 L 200 160" strokeDasharray="6 6" stroke="#94a3b8" />
        <path d="M 200 220 L 200 310" strokeDasharray="6 6" stroke="#94a3b8" />
        <path d="M 200 370 L 200 480 L 420 480" strokeDasharray="6 6" stroke="#94a3b8" />

        {/* Center branch */}
        <path d="M 460 160 L 460 260" />
        <path d="M 460 360 L 460 440" />

        {/* Right Branch (CLOSED LOOP) */}
        <path d="M 490 130 L 650 130" stroke="#ef4444" strokeWidth="3.5" />
        <path d="M 710 130 L 780 130 L 780 480 L 500 480" stroke="#ef4444" strokeWidth="3.5" />
      </g>

      {/* Live Discharging Current Animation */}
      {isLiveMotion && (
        <path
          d="M 460 260 L 460 160 L 488 132 L 650 130 M 710 130 L 780 130 L 780 480 L 500 480 L 460 440 L 460 360"
          fill="none"
          stroke="#ef4444"
          strokeWidth="3.5"
          className="animate-flow-disch opacity-85 pointer-events-none"
        />
      )}

      {/* 1. TWO-WAY SWITCH (K) AT POSITION 2 */}
      <g
        id="switch-k2"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('switch-k2')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('switch-k2')}
        filter={isPartActive('switch-k2') ? 'url(#element-highlight-glow-2)' : undefined}
      >
        <rect x="400" y="100" width="120" height="70" rx="8" fill="#f8fafc" stroke={isPartActive('switch-k2') ? '#0284c7' : '#cbd5e1'} strokeWidth="1.5" />
        <circle cx="430" cy="130" r="5" fill="#94a3b8" />
        <text x="430" y="118" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#94a3b8">1</text>
        
        <circle cx="490" cy="130" r="5" fill="#ef4444" />
        <text x="490" y="118" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#ef4444">2</text>
        
        <circle cx="460" cy="160" r="6" fill="#1e293b" />
        <text x="460" y="182" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1e293b">K</text>
        
        <line x1="460" y1="160" x2="488" y2="132" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
      </g>

      {/* 2. DISCONNECTED BATTERY & RESISTOR */}
      <g
        id="disconnected-battery"
        className="cursor-pointer transition-all duration-200 opacity-60"
        onMouseEnter={() => onPartHover('disconnected-battery')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('disconnected-battery')}
        filter={isPartActive('disconnected-battery') ? 'url(#element-highlight-glow-2)' : undefined}
      >
        <line x1="170" y1="310" x2="230" y2="310" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
        <line x1="182" y1="330" x2="218" y2="330" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
        <line x1="170" y1="350" x2="230" y2="350" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
        <line x1="182" y1="370" x2="218" y2="370" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
        <text x="245" y="345" fontSize="13" fontWeight="bold" fill="#94a3b8">E</text>

        <rect x="185" y="160" width="30" height="60" rx="3" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />
        <text x="235" y="195" fontSize="13" fontWeight="bold" fill="#94a3b8">R</text>
      </g>

      {/* 3. LIGHT BULB L1 (330, 130) - Off */}
      <g
        id="bulb-l1-off-disch"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('bulb-l1-off-disch')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('bulb-l1-off-disch')}
        filter={isPartActive('bulb-l1-off-disch') ? 'url(#element-highlight-glow-2)' : undefined}
      >
        <circle cx="330" cy="130" r="18" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 2" />
        <path d="M 322 122 L 338 138 M 338 122 L 322 138" stroke="#94a3b8" strokeWidth="1.5" />
        <text x="330" y="98" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#64748b">L1</text>
      </g>

      {/* 4. CAPACITOR DURING DISCHARGE (460, 310) */}
      <g
        id="discharging-capacitor"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('discharging-capacitor')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('discharging-capacitor')}
        filter={isPartActive('discharging-capacitor') ? 'url(#element-highlight-glow-2)' : undefined}
      >
        <rect x="400" y="260" width="120" height="10" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
        <g fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">
          <text x="430" y="269">+</text>
          <text x="460" y="269">+</text>
          <text x="490" y="269">+</text>
        </g>
        <text x="535" y="270" fontSize="13" fontWeight="bold" fill="#0284c7">A</text>

        <rect x="400" y="270" width="120" height="80" fill="#fef2f2" opacity="0.3" />
        
        <rect x="400" y="350" width="120" height="10" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
        <g fill="#ffffff" fontSize="12" fontWeight="bold" textAnchor="middle">
          <text x="430" y="359">−</text>
          <text x="460" y="359">−</text>
          <text x="490" y="359">−</text>
        </g>
        <text x="535" y="360" fontSize="13" fontWeight="bold" fill="#0284c7">B</text>
      </g>

      {/* 5. GALVANOMETER G (460, 480) - Deflecting to LEFT */}
      <g
        id="galvanometer-reverse"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('galvanometer-reverse')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('galvanometer-reverse')}
        filter={isPartActive('galvanometer-reverse') ? 'url(#element-highlight-glow-2)' : undefined}
      >
        <circle cx="460" cy="480" r="38" fill="#ffffff" stroke="#0f172a" strokeWidth="3" />
        <path d="M 435 465 A 30 30 0 0 1 485 465" fill="none" stroke="#64748b" strokeWidth="1.5" />
        <line x1="460" y1="458" x2="460" y2="453" stroke="#0f172a" strokeWidth="2" />
        <line x1="445" y1="461" x2="442" y2="457" stroke="#64748b" strokeWidth="1.5" />
        <line x1="475" y1="461" x2="478" y2="457" stroke="#64748b" strokeWidth="1.5" />
        <text x="460" y="450" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0f172a">0</text>
        <text x="460" y="505" textAnchor="middle" fontSize="18" fontWeight="bold" fill="#0f172a" fontFamily="'JetBrains Mono', monospace">G</text>

        {/* Needle Deflected to LEFT */}
        <line
          x1="460"
          y1="480"
          x2="440"
          y2="457"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          className={isLiveMotion ? 'animate-needle-left' : ''}
        />
        <circle cx="460" cy="480" r="3.5" fill="#10b981" />
      </g>

      {/* 6. LIGHT BULB L2 (680, 130) - GLOWING */}
      <g
        id="bulb-l2-glowing"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('bulb-l2-glowing')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('bulb-l2-glowing')}
        filter={isPartActive('bulb-l2-glowing') ? 'url(#element-highlight-glow-2)' : undefined}
      >
        <circle cx="680" cy="130" r="30" fill="#fed7aa" opacity="0.75" filter="url(#glow-bulb-discharging)" className={isLiveMotion ? 'animate-bulb-disch' : ''} />
        <circle cx="680" cy="130" r="18" fill="#fef3c7" stroke="#f59e0b" strokeWidth="2.5" />
        <path d="M 670 120 L 690 140 M 690 120 L 670 140" stroke="#b45309" strokeWidth="2" />
        <text x="680" y="98" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#d97706">L2</text>
      </g>

      {/* 7. DISCHARGING CURRENT FLOW ARROW (600, 130) */}
      <g
        id="discharging-current-flow"
        className="cursor-pointer transition-all duration-200"
        onMouseEnter={() => onPartHover('discharging-current-flow')}
        onMouseLeave={() => onPartHover(null)}
        onClick={() => onPartSelect('discharging-current-flow')}
      >
        <path d="M 570 115 L 615 115" stroke="#ef4444" strokeWidth="2.5" />
        <polygon points="615,110 625,115 615,120" fill="#ef4444" />
        <text x="590" y="105" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#ef4444">I_disch</text>
      </g>
    </g>
  );
};
