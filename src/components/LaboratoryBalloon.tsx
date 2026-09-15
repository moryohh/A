import React from 'react';

interface LaboratoryBalloonProps {
  onClick: () => void;
  subjectName: string;
}

/** An SVG hot-air balloon drawn in code, so it stays sharp on mobile without an image request. */
export const LaboratoryBalloon: React.FC<LaboratoryBalloonProps> = ({ onClick, subjectName }) => (
  <button
    type="button"
    onClick={onClick}
    className="science-lab-balloon-drift group relative block h-[120px] w-[80px] cursor-pointer drop-shadow-[0_10px_10px_rgba(8,30,48,0.7)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300"
    aria-label={`فتح مختبر ${subjectName}`}
    title={`مختبر ${subjectName}`}
  >
    <svg viewBox="0 0 106 160" role="presentation" aria-hidden="true" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="lab-envelope" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffe7a2" />
          <stop offset="0.35" stopColor="#ffae67" />
          <stop offset="0.7" stopColor="#e87379" />
          <stop offset="1" stopColor="#a64f87" />
        </linearGradient>
        <linearGradient id="lab-blue-panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#b4f5ff" />
          <stop offset="0.55" stopColor="#47bcd4" />
          <stop offset="1" stopColor="#17577f" />
        </linearGradient>
        <linearGradient id="lab-basket" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f9d398" />
          <stop offset="1" stopColor="#9d673d" />
        </linearGradient>
      </defs>
      {/* Envelope and coloured fabric panels. */}
      <path d="M53 8 C26 8 9 27 9 54 C9 78 27 91 38 105 L68 105 C79 91 97 78 97 54 C97 27 80 8 53 8Z" fill="url(#lab-envelope)" stroke="#ffe6a6" strokeWidth="3" />
      <path d="M53 9 C36 13 27 32 27 55 C27 80 38 94 45 105 L53 105Z" fill="url(#lab-blue-panel)" opacity=".94" />
      <path d="M53 9 C70 13 79 32 79 55 C79 80 68 94 61 105 L53 105Z" fill="url(#lab-blue-panel)" opacity=".86" />
      <path d="M30 23 C40 16 68 15 79 23" fill="none" stroke="white" strokeOpacity=".8" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="53" cy="105" rx="17" ry="5" fill="#f6d190" stroke="#fff0c0" strokeWidth="2" />
      {/* Rigging, burner and a visible basket. */}
      <path d="M39 106 L42 130 M67 106 L64 130" fill="none" stroke="#493e3d" strokeWidth="2.5" />
      <path d="M50 108 Q53 116 56 108" fill="none" stroke="#ffbf3d" strokeWidth="3" />
      <path d="M37 130 H69 L64 151 Q53 156 42 151Z" fill="url(#lab-basket)" stroke="#5b3e31" strokeWidth="2.5" />
      <path d="M39 138 H67 M40 145 H66" stroke="#714933" strokeOpacity=".7" strokeWidth="2" />
      <rect x="17" y="54" width="72" height="30" rx="13" fill="#082c45" stroke="#d7fbff" strokeWidth="2.5" />
      <text x="53" y="74" textAnchor="middle" fill="white" fontFamily="Cairo, sans-serif" fontSize="18" fontWeight="900">مختبر</text>
    </svg>
  </button>
);
