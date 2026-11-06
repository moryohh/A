import React, { useRef } from 'react';
import Lottie from 'lottie-react';
import clappingHands from '../assets/animations/clapping-hands.json';

type ClappingHandsAnimationProps = {
  className?: string;
  ariaLabel?: string;
  autoplay?: boolean;
  pingPong?: boolean;
};

export const ClappingHandsAnimation: React.FC<ClappingHandsAnimationProps> = ({ className, ariaLabel = 'تصفيق', autoplay = true, pingPong = false }) => {
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
        if (!animation) return;
        if (pingPong) {
          reversingRef.current = !reversingRef.current;
          animation.setDirection(reversingRef.current ? -1 : 1);
          animation.play();
          return;
        }
        if (reversingRef.current) return;
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
            pingPong
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


export const ClappingWeatherCelebration: React.FC<{ className?: string }> = ({ className = '' }) => {
  const snow = Array.from({ length: 30 }, (_, index) => ({
    left: (index * 37 + 11) % 100,
    delay: (index % 10) * 0.11,
    duration: 2.2 + (index % 7) * 0.18,
    size: 4 + (index % 4) * 2,
  }));
  const rain = Array.from({ length: 22 }, (_, index) => ({
    left: (index * 43 + 7) % 100,
    delay: (index % 8) * 0.13,
    duration: 0.72 + (index % 5) * 0.12,
  }));

  return (
    <div className={`relative h-full w-full overflow-hidden ${className}`} role="status" aria-label="تصفيق مع مطر وثلج احتفالي">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(103,232,249,.22),transparent_48%)] motion-safe:animate-[clapWeatherGlow_4s_ease-out_both]" />
      {rain.map((drop, index) => (
        <span
          key={`rain-${index}`}
          className="absolute -top-8 h-8 w-[2px] rounded-full bg-gradient-to-b from-transparent via-cyan-200 to-white/90 shadow-[0_0_8px_rgba(103,232,249,.85)]"
          style={{ left: `${drop.left}%`, animation: `clapRain ${drop.duration}s linear ${drop.delay}s infinite` }}
        />
      ))}
      {snow.map((flake, index) => (
        <span
          key={`snow-${index}`}
          className="absolute -top-4 rounded-full bg-white shadow-[0_0_9px_rgba(255,255,255,.95)]"
          style={{ left: `${flake.left}%`, width: flake.size, height: flake.size, animation: `clapSnow ${flake.duration}s ease-in ${flake.delay}s infinite` }}
        />
      ))}
      <div className="absolute inset-0 grid place-items-center">
        <span className="absolute h-40 w-40 rounded-full border-2 border-cyan-200/70 motion-safe:animate-[clapWeatherRing_1.35s_ease-out_infinite]" />
        <ClappingHandsAnimation pingPong className="h-32 w-32 drop-shadow-[0_0_22px_rgba(255,255,255,.8)]" />
      </div>
      <style>{`
        @keyframes clapRain{0%{opacity:0;transform:translate3d(0,-12%,0) rotate(8deg)}12%{opacity:.9}85%{opacity:.75}100%{opacity:0;transform:translate3d(-22px,118vh,0) rotate(8deg)}}
        @keyframes clapSnow{0%{opacity:0;transform:translate3d(0,-10%,0) rotate(0deg)}15%{opacity:1}85%{opacity:.95}100%{opacity:0;transform:translate3d(28px,110vh,0) rotate(300deg)}}
        @keyframes clapWeatherRing{0%{opacity:.9;transform:scale(.45)}100%{opacity:0;transform:scale(1.45)}}
        @keyframes clapWeatherGlow{0%{opacity:0}15%{opacity:1}78%{opacity:1}100%{opacity:0}}
      `}</style>
    </div>
  );
};
