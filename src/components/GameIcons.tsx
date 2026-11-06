import React from 'react';

export const MillionaireAuthenticIcon: React.FC<{ className?: string }> = ({
  className = 'w-14 h-14',
}) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_12px_rgba(234,179,8,0.4)]">
        <defs>
          <filter id="gold-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="millionaire-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1E1B4B" />
            <stop offset="60%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>
          <linearGradient id="gold-border" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>
          <linearGradient id="cyan-glow" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>

        {/* Outer Ring with Golden Rim */}
        <circle cx="60" cy="60" r="56" fill="url(#millionaire-bg)" stroke="url(#gold-border)" strokeWidth="3" />

        {/* Inner Cyan Geometric Ring */}
        <circle cx="60" cy="60" r="50" stroke="url(#cyan-glow)" strokeWidth="1.5" strokeDasharray="3 2" />

        {/* Geometric Diamond Starburst Pattern (Like the TV Show studio floor) */}
        <g opacity="0.6" stroke="#38BDF8" strokeWidth="1">
          <polygon points="60,16 68,48 104,60 68,72 60,104 52,72 16,60 52,48" fill="none" />
          <polygon points="60,24 65,50 96,60 65,70 60,96 55,70 24,60 55,50" fill="none" stroke="#FACC15" strokeWidth="0.8" />
        </g>

        {/* Center Blue Circle Container */}
        <circle cx="60" cy="60" r="38" fill="#090d20" stroke="url(#gold-border)" strokeWidth="2" filter="url(#gold-glow)" />

        {/* Arabic Typography 'من سيربح المليون؟' */}
        {/* Top: من سيربح */}
        <text
          x="60"
          y="50"
          fill="#FDE047"
          fontSize="10"
          fontWeight="900"
          textAnchor="middle"
          fontFamily="'Cairo', 'Tajawal', sans-serif"
          filter="url(#gold-glow)"
        >
          مَن سَيَربَح
        </text>

        {/* Center Main: المليون؟ */}
        <text
          x="60"
          y="68"
          fill="#FFFFFF"
          fontSize="13"
          fontWeight="900"
          textAnchor="middle"
          fontFamily="'Cairo', 'Tajawal', sans-serif"
          letterSpacing="0.5"
          filter="url(#gold-glow)"
        >
          المَليُـون؟
        </text>

        {/* Small Golden Star at bottom */}
        <path
          d="M60 76L61.5 79.5L65 80L62.5 82.5L63 86L60 84.5L57 86L57.5 82.5L55 80L58.5 79.5Z"
          fill="#FDE047"
        />
      </svg>
    </div>
  );
};

export const TrueFalseAuthenticIcon: React.FC<{ className?: string }> = ({
  className = 'w-14 h-14',
}) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]">
        <defs>
          <filter id="tf-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="tf-bg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0B1A28" />
            <stop offset="60%" stopColor="#06121D" />
            <stop offset="100%" stopColor="#02060D" />
          </radialGradient>
          <linearGradient id="tf-split-border" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#F43F5E" />
          </linearGradient>
        </defs>

        {/* Outer Circular Rim with Emerald to Rose Neon split */}
        <circle cx="60" cy="60" r="56" fill="url(#tf-bg)" stroke="url(#tf-split-border)" strokeWidth="3" />

        {/* Inner Neon Ring */}
        <circle cx="60" cy="60" r="50" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />

        {/* Center Split Background Pills */}
        {/* Left Side: Emerald Green True */}
        <path
          d="M60 22C40 22 24 38 24 60C24 82 40 98 60 98V22Z"
          fill="#064E3B"
          fillOpacity="0.3"
        />

        {/* Right Side: Rose Red False */}
        <path
          d="M60 22C80 22 96 38 96 60C96 82 80 98 60 98V22Z"
          fill="#881337"
          fillOpacity="0.3"
        />

        {/* Center Vertical Divider Line */}
        <line x1="60" y1="24" x2="60" y2="96" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="2 2" />

        {/* Left Icon: Emerald Checkmark ✓ */}
        <g filter="url(#tf-glow)">
          <circle cx="43" cy="52" r="13" fill="#065F46" stroke="#34D399" strokeWidth="2" />
          <path
            d="M37 52L41 56L49 47"
            stroke="#ECFDF5"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text
            x="43"
            y="76"
            fill="#34D399"
            fontSize="10"
            fontWeight="900"
            textAnchor="middle"
            fontFamily="'Cairo', sans-serif"
          >
            صَح
          </text>
        </g>

        {/* Right Icon: Rose Cross ✗ */}
        <g filter="url(#tf-glow)">
          <circle cx="77" cy="52" r="13" fill="#9F1239" stroke="#FB7185" strokeWidth="2" />
          <path
            d="M72 47L82 57M82 47L72 57"
            stroke="#FFF1F2"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <text
            x="77"
            y="76"
            fill="#FB7185"
            fontSize="10"
            fontWeight="900"
            textAnchor="middle"
            fontFamily="'Cairo', sans-serif"
          >
            خَطَأ
          </text>
        </g>
      </svg>
    </div>
  );
};

export const GibhaSahAuthenticIcon: React.FC<{ className?: string }> = ({
  className = 'w-14 h-14',
}) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full drop-shadow-[0_0_14px_rgba(16,185,129,0.5)]">
        <defs>
          <filter id="gs-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <radialGradient id="gs-impact" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="#F0FDF4" />
            <stop offset="58%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#047857" />
          </radialGradient>
        </defs>
        <path d="M60 7L66 23L83 14L80 32L100 29L88 44L108 51L89 59L105 72L84 72L89 92L72 82L64 109L54 84L35 98L39 76L16 79L31 62L10 53L32 44L18 28L40 32L39 12L54 24L60 7Z" fill="#FACC15" fillOpacity=".35" />
        <circle cx="58" cy="57" r="38" fill="url(#gs-impact)" stroke="#A7F3D0" strokeWidth="4" filter="url(#gs-glow)" />
        <path d="M39 57L52 70L78 42" stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        <g transform="rotate(-36 87 83)">
          <rect x="82" y="58" width="10" height="48" rx="5" fill="#92400E" stroke="#FBBF24" strokeWidth="2" />
          <rect x="79" y="54" width="16" height="12" rx="4" fill="#F59E0B" />
        </g>
        <path d="M92 24L97 16M101 31L112 27M93 36L101 43" stroke="#67E8F9" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
};

export const BookletStudyIcon: React.FC<{ className?: string }> = ({
  className = 'w-20 h-16',
}) => (
  <div className={`relative flex shrink-0 items-center justify-center ${className}`}>
    <svg viewBox="0 0 140 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full drop-shadow-[0_0_14px_rgba(52,211,153,.35)]">
      <defs>
        <linearGradient id="booklet-paper" x1="20" y1="15" x2="120" y2="90" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#D1FAE5" />
        </linearGradient>
      </defs>
      <path d="M69 28C57 17 38 14 20 20V80C38 74 56 77 69 88V28Z" fill="url(#booklet-paper)" stroke="#6EE7B7" strokeWidth="3" />
      <path d="M71 28C83 17 102 14 120 20V80C102 74 84 77 71 88V28Z" fill="url(#booklet-paper)" stroke="#6EE7B7" strokeWidth="3" />
      <path d="M70 29V88" stroke="#047857" strokeWidth="3" />
      <path d="M31 38H58M31 49H58M31 60H53M83 39H108M83 50H108M83 61H103" stroke="#10B981" strokeWidth="3" strokeLinecap="round" opacity=".75" />
      <path d="M105 17H116V34L110.5 30L105 34V17Z" fill="#FBBF24" />
      <path d="M65 21C62 12 56 8 49 7C50 15 55 20 65 21Z" fill="#4ADE80" />
      <path d="M75 21C78 12 84 8 91 7C90 15 85 20 75 21Z" fill="#22C55E" />
    </svg>
  </div>
);

export const DailyExamAuthenticIcon: React.FC<{ className?: string }> = ({
  className = 'w-14 h-14',
}) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 select-none ${className}`}>
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_4px_16px_rgba(147,51,234,0.35)]">
        <defs>
          <linearGradient id="folder-grad" x1="15" y1="15" x2="105" y2="105" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3B185F" />
            <stop offset="40%" stopColor="#2A1147" />
            <stop offset="100%" stopColor="#150824" />
          </linearGradient>
          <linearGradient id="paper-grad" x1="30" y1="20" x2="90" y2="95" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFDF7" />
            <stop offset="100%" stopColor="#F5EEDC" />
          </linearGradient>
          <linearGradient id="gold-border" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#CA8A04" />
          </linearGradient>
          <linearGradient id="pen-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
        </defs>

        {/* Outer Circular Rim with Academic Gold Border */}
        <circle cx="60" cy="60" r="56" fill="url(#folder-grad)" stroke="url(#gold-border)" strokeWidth="2.5" />
        
        {/* Subtle Radial Education Ring */}
        <circle cx="60" cy="60" r="49" stroke="#EAB308" strokeOpacity="0.25" strokeDasharray="3 3" strokeWidth="1" />

        {/* Exam Booklet / Clipboard Base (3D Tilt effect) */}
        <rect x="32" y="24" width="56" height="68" rx="8" fill="#1F1135" stroke="#9333EA" strokeWidth="1.5" />
        
        {/* Primary Crisp Examination Paper Sheet */}
        <rect x="36" y="28" width="48" height="60" rx="5" fill="url(#paper-grad)" stroke="#D4AF37" strokeWidth="1" />

        {/* Exam Paper Top Header Band (Red/Burgundy Ministerial Bar) */}
        <path d="M36 33C36 30.2386 38.2386 28 41 28H79C81.7614 28 84 30.2386 84 33V37H36V33Z" fill="#881337" />

        {/* Gold Exam Header Label dots */}
        <circle cx="43" cy="32.5" r="1.5" fill="#FDE047" />
        <line x1="48" y1="32.5" x2="77" y2="32.5" stroke="#FDE047" strokeWidth="1.5" strokeLinecap="round" />

        {/* Exam Question Lines (Simulated Arabic exam lines with checkmarks) */}
        {/* Q1 */}
        <circle cx="42" cy="45" r="2" fill="#9333EA" />
        <line x1="47" y1="45" x2="77" y2="45" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="43" y1="51" x2="73" y2="51" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 1.5" />

        {/* Q2 */}
        <circle cx="42" cy="60" r="2" fill="#2563EB" />
        <line x1="47" y1="60" x2="77" y2="60" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="43" y1="66" x2="68" y2="66" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2 1.5" />

        {/* High Grade Seal / Stamp 100% or A+ in Emerald Badge */}
        <circle cx="71" cy="74" r="9" fill="#047857" stroke="#34D399" strokeWidth="1" />
        <path d="M68 74L70 76L74 71.5" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

        {/* Floating Ministerial Fountain Pen with Gold Nib */}
        <g transform="translate(68, 62) rotate(-35)">
          {/* Pen Barrel */}
          <rect x="0" y="0" width="7" height="38" rx="2" fill="url(#pen-grad)" stroke="#0C4A6E" strokeWidth="0.5" />
          {/* Gold Grip Band */}
          <rect x="0" y="26" width="7" height="3" fill="#FDE047" />
          {/* Gold Fountain Nib */}
          <path d="M0 32L3.5 42L7 32H0Z" fill="#FBBF24" stroke="#D97706" strokeWidth="0.5" />
          {/* Nib slit */}
          <line x1="3.5" y1="34" x2="3.5" y2="39" stroke="#78350F" strokeWidth="0.6" />
          {/* Pen Clip */}
          <line x1="5" y1="3" x2="5" y2="16" stroke="#FDE047" strokeWidth="1" strokeLinecap="round" />
        </g>

        {/* Sparkle star / Excellence badge at top left */}
        <path d="M28 22L30 16L32 22L38 24L32 26L30 32L28 26L22 24L28 22Z" fill="#FDE047" opacity="0.9" />
      </svg>
    </div>
  );
};

