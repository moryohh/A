import { useEffect, useRef, useState } from 'react';

export type OnlineTrueFalseCharacterVariant = 'anime' | 'student' | 'student2';
export type OnlineTrueFalseCharacterState = 'idle' | 'correct' | 'wrong';

const labels: Record<OnlineTrueFalseCharacterVariant, string> = {
  anime: 'فتاة الأنمي',
  student: 'الطالب',
  student2: 'الطالب الثاني',
};

const folders: Record<OnlineTrueFalseCharacterVariant, string> = {
  anime: 'anime-girl',
  student: 'student',
  student2: 'student2',
};

const clipDurationsMs: Record<OnlineTrueFalseCharacterVariant, Record<'correct' | 'wrong', number>> = {
  anime: { correct: 5000, wrong: 8000 },
  student: { correct: 4000, wrong: 4100 },
  student2: { correct: 4000, wrong: 3350 },
};

export const ONLINE_TRUE_FALSE_CHARACTERS = (Object.keys(labels) as OnlineTrueFalseCharacterVariant[]).map(value => ({ value, label: labels[value] }));

export function onlineTrueFalseCharacterVideo(variant: OnlineTrueFalseCharacterVariant, state: OnlineTrueFalseCharacterState = 'idle') {
  const clip = state === 'correct' ? 'victory' : state === 'wrong' ? 'wrong' : 'idle';
  const base = import.meta.env.BASE_URL || '/';
  return `${base}online-true-false/characters/${folders[variant]}/${clip}.webm`;
}

export function onlineTrueFalseResultDuration(variant: OnlineTrueFalseCharacterVariant, state: 'correct' | 'wrong') {
  return clipDurationsMs[variant][state];
}

export function OnlineTrueFalseCharacter({ state, variant, compact = false }: { state: OnlineTrueFalseCharacterState; variant: OnlineTrueFalseCharacterVariant; compact?: boolean }) {
  const [playbackState, setPlaybackState] = useState<OnlineTrueFalseCharacterState>(state);
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const src = onlineTrueFalseCharacterVideo(variant, playbackState);
  const stateLabel = state === 'correct' ? 'فرح بالإجابة الصحيحة' : state === 'wrong' ? 'تفاعل مع الإجابة الخاطئة' : 'بانتظار الإجابة';

  useEffect(() => {
    setPlaybackState(state);
    setVideoFailed(false);
  }, [state, variant]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setVideoFailed(false);
    video.currentTime = 0;
    void video.play().catch(() => {
      if (playbackState !== 'idle') setPlaybackState('idle');
      else setVideoFailed(true);
    });
  }, [src, playbackState]);

  const recoverToIdle = () => {
    if (playbackState !== 'idle') setPlaybackState('idle');
    else setVideoFailed(true);
  };

  return <div className={`relative mx-auto grid w-full max-w-xs place-items-end overflow-hidden ${compact ? 'h-32 sm:h-36' : 'h-52 sm:h-60'}`} aria-label={`${labels[variant]}: ${stateLabel}`}>
    {state === 'correct' && <div className="pointer-events-none absolute inset-x-0 top-3 z-10 text-center text-4xl text-emerald-500" aria-hidden="true">✓ ✦ ✧ ✦</div>}
    <div className="absolute inset-2 rounded-2xl bg-gradient-to-b from-cyan-50 to-sky-100" aria-hidden="true" />
    {videoFailed && <div className="absolute inset-0 z-[1] grid place-items-center text-5xl" aria-hidden="true">👤</div>}
    <video ref={videoRef} key={src} src={src} autoPlay muted playsInline loop={playbackState === 'idle'} preload="auto" onEnded={recoverToIdle} onError={recoverToIdle} className={`relative z-[2] h-full w-full select-none object-contain object-bottom drop-shadow-[0_12px_9px_rgba(23,50,77,.18)] ${videoFailed ? 'opacity-0' : 'opacity-100'}`} aria-label={`${labels[variant]} المتحرك`} />
  </div>;
}
