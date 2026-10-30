import React, { useEffect, useRef, useState } from 'react';

type Props = {
  stage: number;
  compact?: boolean;
  sound?: boolean;
  className?: string;
};

export const PlantStageVideo: React.FC<Props> = ({ stage, compact = false, sound = false, className = '' }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(!sound);
  const safeStage = Math.min(12, Math.max(1, Math.round(stage)));
  const regularSize = 54 + (Math.min(safeStage, 9) - 1) * 4;
  const progressiveSize = compact
    ? safeStage === 10
      ? Math.round(regularSize * 1.1)
      : safeStage >= 11
        ? Math.round(regularSize * 1.1 * 1.15)
        : regularSize
    : undefined;
  const compactSize = progressiveSize === undefined ? undefined : Math.min(progressiveSize, 78);
  const visualScale = safeStage === 10 ? 1.1 : safeStage >= 11 ? 1.265 : 1;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !sound;
    setMuted(!sound);
    video.currentTime = 0;
    const attempt = video.play();
    if (attempt) void attempt.catch(() => {
      video.muted = true;
      setMuted(true);
      void video.play().catch(() => undefined);
    });
  }, [safeStage, sound]);

  const enableSound = () => {
    if (!sound || !videoRef.current || !muted) return;
    videoRef.current.muted = false;
    setMuted(false);
    void videoRef.current.play().catch(() => undefined);
  };

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-[#dff7ff] shadow-sm transition-[width,height] duration-700 ${compact ? 'rounded-2xl' : 'h-full w-full rounded-[2rem]'} ${className}`}
      style={compact ? { width: compactSize, height: Math.round(compactSize! * 0.72) } : undefined}
      onPointerDown={enableSound}
    >
      <video
        key={safeStage}
        ref={videoRef}
        src={`${import.meta.env.BASE_URL}assets/plant-growth/stage-${String(safeStage).padStart(2, '0')}.mp4`}
        className="h-full w-full object-cover transition-transform duration-700"
        style={{ transform: `scale(${visualScale})` }}
        autoPlay
        playsInline
        preload="metadata"
        muted={muted}
        aria-label={`مرحلة نمو النبات ${safeStage}`}
      />
    </div>
  );
};
