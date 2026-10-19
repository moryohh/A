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

export const ONLINE_TRUE_FALSE_CHARACTERS = (Object.keys(labels) as OnlineTrueFalseCharacterVariant[]).map(value => ({ value, label: labels[value] }));

export function OnlineTrueFalseCharacter({ state, variant }: { state: OnlineTrueFalseCharacterState; variant: OnlineTrueFalseCharacterVariant }) {
  const clip = state === 'correct' ? 'victory' : state === 'wrong' ? 'wrong' : 'idle';
  const base = import.meta.env.BASE_URL || '/';
  const src = `${base}online-true-false/characters/${folders[variant]}/${clip}.webm`;
  const stateLabel = state === 'correct' ? 'فرح بالإجابة الصحيحة' : state === 'wrong' ? 'تفاعل مع الإجابة الخاطئة' : 'بانتظار الإجابة';

  return <div className="relative mx-auto grid h-52 w-full max-w-xs place-items-end overflow-hidden sm:h-60" aria-label={`${labels[variant]}: ${stateLabel}`}>
    {state === 'correct' && <div className="pointer-events-none absolute inset-x-0 top-3 z-10 text-center text-4xl text-emerald-500" aria-hidden="true">✓ ✦ ✧ ✦</div>}
    <video key={src} src={src} autoPlay muted playsInline loop={state === 'idle'} preload="auto" className="h-full w-full select-none object-contain object-bottom drop-shadow-[0_12px_9px_rgba(23,50,77,.18)]" aria-label={`${labels[variant]} المتحرك`} />
  </div>;
}
