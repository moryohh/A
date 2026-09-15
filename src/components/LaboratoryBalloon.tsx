import React from 'react';

interface LaboratoryBalloonProps {
  onClick: () => void;
  subjectName: string;
  compact?: boolean;
}

/** A recognizable hot-air balloon, including its striped envelope, ropes, basket and hanging laboratory sign. */
export const LaboratoryBalloon: React.FC<LaboratoryBalloonProps> = ({ onClick, subjectName, compact = false }) => (
  <button
    type="button"
    onClick={(event) => { event.stopPropagation(); onClick(); }}
    className={`science-lab-balloon-drift group relative block shrink-0 cursor-pointer drop-shadow-[0_12px_8px_rgba(8,30,48,0.7)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-300 ${compact ? 'h-[76px] w-[48px]' : 'h-[158px] w-[100px]'}`}
    aria-label={`فتح مختبر ${subjectName}`}
    title={`مختبر ${subjectName}`}
  >
    <svg viewBox="0 0 110 176" role="presentation" aria-hidden="true" className="h-full w-full overflow-visible">
      <defs>
        <linearGradient id="science-balloon-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff3bd" />
          <stop offset="0.55" stopColor="#ffd866" />
          <stop offset="1" stopColor="#dc8e3f" />
        </linearGradient>
        <linearGradient id="science-balloon-teal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a9faff" />
          <stop offset="0.55" stopColor="#39c7d7" />
          <stop offset="1" stopColor="#087ca5" />
        </linearGradient>
        <linearGradient id="science-balloon-coral" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffcec6" />
          <stop offset="0.6" stopColor="#ff7c83" />
          <stop offset="1" stopColor="#bc4b78" />
        </linearGradient>
      </defs>
      {/* Three contrasted fabric panels make the balloon visible even against snowy mountains. */}
      <path d="M55 8 C27 8 10 29 10 59 C10 83 30 102 42 109 L68 109 C80 102 100 83 100 59 C100 29 83 8 55 8Z" fill="url(#science-balloon-gold)" stroke="#fff8dc" strokeWidth="4" />
      <path d="M55 9 C34 17 25 38 25 60 C25 82 37 101 46 109 L55 109Z" fill="url(#science-balloon-teal)" stroke="#fff3ca" strokeWidth="1.5" />
      <path d="M55 9 C76 17 85 38 85 60 C85 82 73 101 64 109 L55 109Z" fill="url(#science-balloon-coral)" stroke="#fff3ca" strokeWidth="1.5" />
      <path d="M55 9 C44 21 41 44 41 63 C41 85 46 102 50 109 L60 109 C64 102 69 85 69 63 C69 44 66 21 55 9Z" fill="url(#science-balloon-gold)" stroke="#fff3ca" strokeWidth="1.5" />
      <path d="M25 39 Q55 26 85 39" fill="none" stroke="#fffbe8" strokeWidth="3" opacity=".8" />
      <ellipse cx="55" cy="109" rx="16" ry="5" fill="#f8d987" stroke="#fff8da" strokeWidth="2" />
      {/* Suspension cables and the actual travel basket. */}
      <path d="M42 110 L43 128 M68 110 L67 128" fill="none" stroke="#554234" strokeWidth="3" />
      <path d="M40 127 H70 L66 143 Q55 147 44 143Z" fill="#a86f39" stroke="#fff0c4" strokeWidth="2.5" />
      <path d="M42 134 H68 M45 140 H65" stroke="#ecb97b" strokeWidth="2" />
      <path d="M55 145 V150" stroke="#fff0c4" strokeWidth="2" />
      {/* A hanging sign, not a rectangle hiding the balloon's envelope. */}
      <rect x="13" y="150" width="84" height="23" rx="11" fill="#093c54" stroke="#fff5c5" strokeWidth="2.5" />
      <text x="55" y="167" textAnchor="middle" fill="white" fontFamily="Cairo, sans-serif" fontSize="17" fontWeight="900">مختبر</text>
    </svg>
  </button>
);
