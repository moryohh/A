import React, { useEffect, useRef } from 'react';

interface ClappingAnimationProps {
  playKey?: number;
  className?: string;
  loop?: boolean;
  autoplay?: boolean;
}

export const ClappingAnimation: React.FC<ClappingAnimationProps> = ({
  playKey = 0,
  className = 'h-14 w-14',
  loop = false,
  autoplay = false,
}) => {
  const playerRef = useRef<any>(null);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || playKey <= 0) return;
    const replay = () => {
      try {
        player.stop?.();
        player.seek?.(0);
        player.play?.();
      } catch {
        // The web component may still be upgrading; autoplay remains the fallback.
      }
    };
    if (typeof player.play === 'function') replay();
    else player.addEventListener?.('ready', replay, { once: true });
  }, [playKey]);

  return React.createElement('lottie-player' as any, {
    ref: playerRef,
    src: `${import.meta.env.BASE_URL}animations/clapping-hands.json`,
    background: 'transparent',
    speed: '1',
    loop: loop ? '' : undefined,
    autoplay: autoplay ? '' : undefined,
    class: className,
    'aria-hidden': 'true',
  });
};
