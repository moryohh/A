import React, { useEffect, useRef, useState } from 'react';

const readyPlantStages = new Set<string>();

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
  const [visibleStage, setVisibleStage] = useState(safeStage);
  const [pendingStage, setPendingStage] = useState<number | null>(null);
  const stageSource = (stageNumber: number) => `${import.meta.env.BASE_URL}assets/${sourceFolder}/stage-${String(stageNumber).padStart(2, '0')}.mp4`;
  const regularSize = 54 + (Math.min(visibleStage, 9) - 1) * 4;
  const progressiveSize = compact
    ? visibleStage === 10
      ? Math.round(regularSize * 1.1)
      : visibleStage >= 11
        ? Math.round(regularSize * 1.1 * 1.15)
        : regularSize
    : undefined;
  const compactSize = progressiveSize === undefined ? undefined : Math.min(progressiveSize, 78);
  const visualScale = visibleStage === 10 ? 1.1 : visibleStage >= 11 ? 1.265 : 1;

  useEffect(() => {
    if (safeStage === visibleStage) {
      setPendingStage(null);
      return;
    }
    // Freeze the last good frame until the requested stage has a decodable
    // frame. This prevents a transparent flash on slower Android devices.
    videoRef.current?.pause();
    const requestedSource = stageSource(safeStage);
    if (readyPlantStages.has(requestedSource)) {
      setVisibleStage(safeStage);
      setPendingStage(null);
    } else {
      setPendingStage(safeStage);
    }
  }, [safeStage, sourceFolder, visibleStage]);

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
  }, [visibleStage, sound, volume, sourceFolder]);

  const preloadStage = pendingStage ?? (visibleStage < 12 ? visibleStage + 1 : null);

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
        key={`${sourceFolder}-${visibleStage}`}
        ref={videoRef}
        src={stageSource(visibleStage)}
        className={`h-full w-full transition-transform duration-700 ${bare ? 'object-contain mix-blend-multiply' : 'object-cover'}`}
        style={{ transform: `scale(${visualScale})` }}
        autoPlay
        playsInline
        preload="auto"
        muted={muted}
        onLoadedData={() => readyPlantStages.add(stageSource(visibleStage))}
        aria-label={`مرحلة نمو النبات ${visibleStage}`}
      />
      {preloadStage && preloadStage !== visibleStage && (
        <video
          key={`preload-${sourceFolder}-${preloadStage}`}
          src={stageSource(preloadStage)}
          className="pointer-events-none absolute h-px w-px opacity-0"
          preload="auto"
          playsInline
          muted
          aria-hidden="true"
          onCanPlay={(event) => {
            const loadedStage = preloadStage;
            readyPlantStages.add(stageSource(loadedStage));
            event.currentTarget.pause();
            if (loadedStage === safeStage) {
              setVisibleStage(loadedStage);
              setPendingStage(null);
            }
          }}
        />
      )}
    </div>
  );
};
