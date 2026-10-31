import React, { useEffect, useRef, useState } from 'react';

type Props = {
  stage: number;
  compact?: boolean;
  sound?: boolean;
  volume?: number;
  className?: string;
  bare?: boolean;
  sourceFolder?: string;
};

export const PlantStageVideo: React.FC<Props> = ({ stage, compact = false, sound = false, volume = 0.5, className = '', bare = false, sourceFolder = 'plant-growth' }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
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
    const safeVolume = Math.max(0, Math.min(1, volume));
    video.volume = safeVolume;
    if (sound) {
      try {
        const AudioContextClass = window.AudioContext;
        const context = new AudioContextClass();
        const source = context.createMediaElementSource(video);
        const gain = context.createGain();
        gain.gain.value = safeVolume;
        source.connect(gain).connect(context.destination);
        // The gain node is the authoritative limiter. Keep the media element at
        // full volume so the requested percentage is applied exactly once.
        video.volume = 1;
        audioContextRef.current = context;
        gainRef.current = gain;
      } catch {
        // Older WebViews still receive the same reduction through video.volume.
      }
    }
    setMuted(!sound);
    video.currentTime = 0;
    const attempt = video.play();
    if (attempt) void attempt.catch(() => {
      video.muted = true;
      setMuted(true);
      void video.play().catch(() => undefined);
    });
    return () => {
      video.pause();
      video.currentTime = 0;
      video.muted = true;
      gainRef.current?.disconnect();
      gainRef.current = null;
      void audioContextRef.current?.close().catch(() => undefined);
      audioContextRef.current = null;
    };
  }, [safeStage, sound, volume]);

  const enableSound = () => {
    if (!sound || !videoRef.current || !muted) return;
    videoRef.current.muted = false;
    if (gainRef.current) gainRef.current.gain.value = Math.max(0, Math.min(1, volume));
    else videoRef.current.volume = Math.max(0, Math.min(1, volume));
    void audioContextRef.current?.resume().catch(() => undefined);
    setMuted(false);
    void videoRef.current.play().catch(() => undefined);
  };

  return (
    <div
      className={`relative shrink-0 transition-[width,height] duration-700 ${bare ? 'overflow-visible bg-transparent shadow-none' : `overflow-hidden bg-[#dff7ff] shadow-sm ${compact ? 'rounded-2xl' : 'h-full w-full rounded-[2rem]'}`} ${className}`}
      style={compact ? { width: compactSize, height: Math.round(compactSize! * 0.72) } : undefined}
      onPointerDown={enableSound}
    >
      <video
        key={safeStage}
        ref={videoRef}
        src={`${import.meta.env.BASE_URL}assets/${sourceFolder}/stage-${String(safeStage).padStart(2, '0')}.mp4`}
        className={`h-full w-full transition-transform duration-700 ${bare ? 'object-contain mix-blend-multiply' : 'object-cover'}`}
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
