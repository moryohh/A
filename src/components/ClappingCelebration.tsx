import React, { useRef } from 'react';
import Lottie from 'lottie-react';
import clappingHands from '../assets/animations/clapping-hands.json';

type ClappingHandsAnimationProps = {
  className?: string;
  ariaLabel?: string;
  autoplay?: boolean;
};

export const ClappingHandsAnimation: React.FC<ClappingHandsAnimationProps> = ({ className, ariaLabel = 'تصفيق', autoplay = true }) => {
  const lottieRef = useRef<any>(null);
  const reversingRef = useRef(false);

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={clappingHands}
      autoplay={autoplay}
      loop={false}
      className={className}
      aria-label={ariaLabel}
      rendererSettings={{ preserveAspectRatio: 'xMidYMid meet' }}
      onDOMLoaded={() => lottieRef.current?.setSpeed(0.5)}
      onComplete={() => {
        const animation = lottieRef.current;
        if (!animation || reversingRef.current) return;
        reversingRef.current = true;
        animation.setDirection(-1);
        animation.play();
      }}
    />
  );
};

type ClappingCelebrationProps = {
  show: boolean;
  label?: string;
  compact?: boolean;
  edge?: boolean;
};

export const ClappingCelebration: React.FC<ClappingCelebrationProps> = ({
  show,
  label = 'أحسنت!',
  compact = false,
  edge = false,
}) => {
  if (!show) return null;

  if (edge) {
    const positions = ['left-2 top-20', 'right-2 top-20', 'left-2 bottom-24', 'right-2 bottom-24'];
    return (
      <div className="pointer-events-none fixed inset-0 z-[110]" role="status" aria-live="polite" aria-label={label}>
        {positions.map((position, index) => (
          <ClappingHandsAnimation
            key={position}
            className={`absolute ${position} h-20 w-20 sm:h-24 sm:w-24 ${index % 2 ? '-rotate-12' : 'rotate-12'} drop-shadow-[0_0_14px_rgba(251,191,36,.45)]`}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 z-[110] flex justify-center ${compact ? 'top-[14vh]' : 'top-[18vh]'}`}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="relative flex flex-col items-center motion-safe:animate-[celebrationEnter_3.6s_ease-out_both]">
        <span className="absolute inset-2 rounded-full bg-amber-300/25 blur-2xl" />
        <ClappingHandsAnimation className={compact ? 'h-28 w-28' : 'h-40 w-40'} />
        <span className="-mt-5 rounded-full border border-amber-200/50 bg-slate-950/80 px-4 py-1.5 text-xs font-black text-amber-100 shadow-[0_0_24px_rgba(251,191,36,.35)] backdrop-blur-md">
          {label}
        </span>
        <style>{`@keyframes celebrationEnter{0%{opacity:0;transform:translateY(18px) scale(.72)}18%{opacity:1;transform:translateY(0) scale(1.08)}70%{opacity:1;transform:scale(1)}100%{opacity:0;transform:translateY(-12px) scale(.96)}}`}</style>
      </div>
    </div>
  );
};
