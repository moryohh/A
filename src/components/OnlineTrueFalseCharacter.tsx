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

const clipPreloads = new Map<string, Promise<boolean>>();

function preloadClip(src: string) {
  if (typeof document === 'undefined') return Promise.resolve(false);
  const existing = clipPreloads.get(src);
  if (existing) return existing;
  const loading = new Promise<boolean>((resolve) => {
    const video = document.createElement('video');
    let settled = false;
    const finish = (ready: boolean) => {
      if (settled) return;
      settled = true;
      video.removeAttribute('src');
      video.load();
      resolve(ready);
    };
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.addEventListener('canplaythrough', () => finish(true), { once: true });
    video.addEventListener('loadeddata', () => finish(true), { once: true });
    video.addEventListener('error', () => finish(false), { once: true });
    window.setTimeout(() => finish(video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA), 12000);
    video.src = src;
    video.load();
  });
  clipPreloads.set(src, loading);
  return loading;
}

let preloadQueue: Promise<void> | null = null;
export function preloadOnlineTrueFalseCharacters() {
  if (preloadQueue) return preloadQueue;
  const clips: OnlineTrueFalseCharacterState[] = ['idle', 'correct', 'wrong'];
  const orderedSources = clips.flatMap(state => ONLINE_TRUE_FALSE_CHARACTERS.map(({ value }) => onlineTrueFalseCharacterVideo(value, state)));
  preloadQueue = orderedSources.reduce<Promise<void>>((queue, src) => queue.then(() => preloadClip(src).then(() => undefined)), Promise.resolve());
  return preloadQueue;
}

export function OnlineTrueFalseCharacter({ state, variant, compact = false }: { state: OnlineTrueFalseCharacterState; variant: OnlineTrueFalseCharacterVariant; compact?: boolean }) {
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const src = onlineTrueFalseCharacterVideo(variant, state);
  const stateLabel = state === 'correct' ? 'فرح بالإجابة الصحيحة' : state === 'wrong' ? 'تفاعل مع الإجابة الخاطئة' : 'بانتظار الإجابة';

  useEffect(() => {
    setVideoFailed(false);
    // A keyed video owns one clip. Do not play the previous idle element while
    // React is replacing it, or let an aborted play promise cancel the result.
    const video = videoRef.current;
    if (!video) return;
    void video.play().catch(() => { /* autoPlay/onCanPlay retries after loading */ });
  }, [src]);

  return <div className={`relative mx-auto grid w-full max-w-xs place-items-end overflow-hidden ${compact ? 'h-32 sm:h-36' : 'h-52 sm:h-60'}`} aria-label={`${labels[variant]}: ${stateLabel}`}>
    {state === 'correct' && <div className="pointer-events-none absolute inset-x-0 top-3 z-10 text-center text-4xl text-emerald-500" aria-hidden="true">✓ ✦ ✧ ✦</div>}
    <div className="absolute inset-2 rounded-2xl bg-gradient-to-b from-cyan-50 to-sky-100" aria-hidden="true" />
    {videoFailed && <div className="absolute inset-0 z-[1] grid place-items-center text-5xl" aria-hidden="true">👤</div>}
    <video ref={videoRef} key={src} src={src} autoPlay muted playsInline loop={state === 'idle'} preload="auto" onCanPlay={event => { void event.currentTarget.play().catch(() => {}); }} onError={() => setVideoFailed(true)} className={`relative z-[2] h-full w-full select-none object-contain object-bottom drop-shadow-[0_12px_9px_rgba(23,50,77,.18)] ${videoFailed ? 'opacity-0' : 'opacity-100'}`} aria-label={`${labels[variant]} المتحرك`} />
  </div>;
}
