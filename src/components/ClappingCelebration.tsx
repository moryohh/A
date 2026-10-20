import React from 'react';
import Lottie from 'lottie-react';
import clappingHands from '../assets/animations/clapping-hands.json';

type ClappingCelebrationProps = {
  show: boolean;
  label?: string;
  compact?: boolean;
};

export const ClappingCelebration: React.FC<ClappingCelebrationProps> = ({
  show,
  label = 'أحسنت!',
  compact = false,
}) => {
  if (!show) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 z-[110] flex justify-center ${compact ? 'top-[14vh]' : 'top-[18vh]'}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="relative flex flex-col items-center motion-safe:animate-[celebrationEnter_.9s_ease-out_both]">
        <span className="absolute inset-2 rounded-full bg-amber-300/25 blur-2xl" />
        <Lottie
          animationData={clappingHands}
          autoplay
          loop={false}
          className={compact ? 'h-28 w-28' : 'h-40 w-40'}
          rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
        />
        <span className="-mt-5 rounded-full border border-amber-200/50 bg-slate-950/80 px-4 py-1.5 text-xs font-black text-amber-100 shadow-[0_0_24px_rgba(251,191,36,.35)] backdrop-blur-md">
          {label}
        </span>
        <style>{`@keyframes celebrationEnter{0%{opacity:0;transform:translateY(18px) scale(.72)}35%{opacity:1;transform:translateY(0) scale(1.08)}75%{opacity:1;transform:scale(1)}100%{opacity:0;transform:translateY(-12px) scale(.96)}}`}</style>
      </div>
    </div>
  );
};

