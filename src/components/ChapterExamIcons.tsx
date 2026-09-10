import React, { useEffect, useState } from 'react';
import { Award, BookOpenCheck, Camera, ChevronLeft, ChevronRight, ImageIcon, Loader2, Shuffle, X } from 'lucide-react';
import { chooseRandomExam, CurriculumExamRecord, fetchChapterExamBank } from '../services/examBankService';

interface ChapterExamIconsProps {
  subjectId: string;
  subjectName: string;
  chapterNumber: number;
  className?: string;
}

type QuestionEntry = { title: string; text: string; answer?: string };
type ExamQuestion = { title: string; parts: QuestionEntry[] };

const ANSWER_KEY_PATTERN = /answer|model_answer|solution|جواب|اجابة|إجابة|حل/i;
const QUESTION_KEY_PATTERN = /question|prompt|content|body|^q\d*$|^س\d*$/i;
const IGNORED_KEY_PATTERN = /raw_text|raw|json|metadata|lesson_ids|question_type|type|exam_type|source|id|title|date|year|round|dawr|chapter|subject/i;

function isAnswerKey(key: string) {
  return ANSWER_KEY_PATTERN.test(key);
}

function titleFromKey(key: string) {
  const clean = key.replace(/[_-]+/g, ' ').trim();
  return clean || 'سؤال';
}

function parseJsonString(value: string): unknown {
  const text = value.trim();
  if (!text.startsWith('{') && !text.startsWith('[')) return value;
  try {
    return JSON.parse(text);
  } catch {
    return value;
  }
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function formatQuestionItem(item: unknown, index: number) {
  if (typeof item === 'string') return `${index + 1}. ${item.trim()}`;
  if (!item || typeof item !== 'object' || Array.isArray(item)) return '';
  const obj = item as Record<string, unknown>;
  const label = cleanText(obj.label) || cleanText(obj.number) || cleanText(obj.id) || `${index + 1}`;
  const question = cleanText(obj.question) || cleanText(obj.text) || cleanText(obj.prompt) || cleanText(obj.content) || cleanText(obj.body);
  return question ? `${label}. ${question}` : '';
}

function readPartCollection(value: unknown): QuestionEntry[] {
  if (!value) return [];
  const collection = Array.isArray(value)
    ? value.map((partValue, index) => [`${index + 1}`, partValue] as const)
    : typeof value === 'object'
      ? Object.entries(value as Record<string, unknown>)
      : [];
  return collection
    .map(([partTitle, partValue]) => readQuestion(partValue, partTitle))
    .filter(Boolean) as QuestionEntry[];
}

function readQuestion(value: unknown, title = ''): QuestionEntry | null {
  if (isAnswerKey(title) || IGNORED_KEY_PATTERN.test(title)) return null;
  if (typeof value === 'string') {
    const parsed = parseJsonString(value);
    if (parsed !== value) return readQuestion(parsed, title);
    const text = value.trim();
    if (!text || text.length < 4 || !QUESTION_KEY_PATTERN.test(title)) return null;
    return { title: titleFromKey(title), text };
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const obj = value as Record<string, unknown>;
  const question = obj.question || obj.text || obj.prompt || obj.content || obj.body;
  const itemValues = Array.isArray(obj.items)
    ? obj.items
    : obj.items && typeof obj.items === 'object'
      ? Object.values(obj.items as Record<string, unknown>)
      : [];
  const items = itemValues.map(formatQuestionItem).filter(Boolean);
  const answer = obj.answer || obj.model_answer;
  if (typeof question !== 'string' || !question.trim()) return null;
  const text = [question.trim(), ...items].join('\n\n');
  const entryTitle = cleanText(obj.question_number) || cleanText(obj.label) || titleFromKey(title);
  return { title: entryTitle, text, answer: typeof answer === 'string' ? answer : undefined };
}

function readQuestionParts(value: unknown, fallbackTitle: string): QuestionEntry[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const obj = value as Record<string, unknown>;
  const nestedParts = readPartCollection(obj.parts);
  if (nestedParts.length > 0) return nestedParts;
  const nestedItems = readPartCollection(obj.items);
  if (nestedItems.length > 0) return nestedItems;
  const entry = readQuestion(value, fallbackTitle);
  return entry ? [entry] : [];
}

export function examQuestions(payload: Record<string, unknown>): ExamQuestion[] {
  const rawText = typeof payload.raw_text === 'string' ? parseJsonString(payload.raw_text) : null;
  if (rawText && rawText !== payload.raw_text && typeof rawText === 'object') {
    const parsedEntries = examQuestions(rawText as Record<string, unknown>);
    if (parsedEntries.length > 0) return parsedEntries;
  }

  const standaloneParts = readPartCollection(payload.parts || payload.items);
  if (standaloneParts.length > 0) {
    return [{ title: cleanText(payload.question_number) || 'س1', parts: standaloneParts }];
  }

  const source = payload.exam_paper || payload.questions || payload.exam;
  if (Array.isArray(source)) {
    const direct = source
      .map((item, index) => {
        const itemObj = item && typeof item === 'object' && !Array.isArray(item) ? item as Record<string, unknown> : null;
        const title = cleanText(itemObj?.question_number) || `س${index + 1}`;
        const parts = readQuestionParts(item, title);
        return parts.length > 0 ? { title, parts } : null;
      })
      .filter(Boolean) as ExamQuestion[];
    if (direct.length > 0) return direct;
  }
  if (source && typeof source === 'object') {
    const entries = Object.entries(source as Record<string, unknown>);
    const direct = entries
      .map(([key, value]) => {
        const parts = readQuestionParts(value, key);
        return parts.length > 0 ? { title: titleFromKey(key), parts } : null;
      })
      .filter(Boolean) as ExamQuestion[];
    if (direct.length > 0) return direct;
  }
  const fallback: ExamQuestion[] = [];
  const walk = (value: unknown, key = '') => {
    const parts = readQuestionParts(value, key);
    if (parts.length > 0) {
      const title = /^س\d+$/i.test(key) ? key : `س${fallback.length + 1}`;
      if (!fallback.some((item) => item.parts.map((part) => part.text).join('\n') === parts.map((part) => part.text).join('\n'))) {
        fallback.push({ title, parts });
      }
      return;
    }
    if (Array.isArray(value)) value.forEach((item, index) => walk(item, `س${index + 1}`));
    else if (typeof value === 'string') {
      const parsed = parseJsonString(value);
      if (parsed !== value) walk(parsed, key);
    } else if (value && typeof value === 'object') Object.entries(value as Record<string, unknown>).forEach(([childKey, childValue]) => {
      if (!isAnswerKey(childKey) && !IGNORED_KEY_PATTERN.test(childKey)) walk(childValue, childKey);
    });
  };
  walk(payload);
  return fallback;
}

export function questionEntries(payload: Record<string, unknown>): QuestionEntry[] {
  return examQuestions(payload).map((question) => ({
    title: question.title,
    text: question.parts.map((part) => `${part.title}\n${part.text}`).join('\n\n'),
  }));
}

function playPageFlipSound() {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const bufferSize = ctx.sampleRate * 0.18;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }
    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(700, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    noise.buffer = buffer;
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.18);
    setTimeout(() => ctx.close().catch(() => {}), 260);
  } catch {}
}

const ExamPreview: React.FC<{ exam: CurriculumExamRecord; subjectName: string; onClose: () => void }> = ({ exam, subjectName, onClose }) => {
  const questions = examQuestions(exam.payload);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [images, setImages] = useState<Record<number, string>>({});
  const activeQuestion = questions[activeQuestionIndex];
  const activePart = activeQuestion?.parts[activePartIndex];
  const examLabel = exam.exam_type === 'monthly' ? 'امتحان شهري' : 'امتحان وزاري';
  const examDate = typeof exam.payload.exam_date === 'string'
    ? exam.payload.exam_date
    : typeof exam.payload.date === 'string'
      ? exam.payload.date
      : typeof exam.payload.year === 'string'
        ? exam.payload.year
        : '';
  const examRound = typeof exam.payload.round === 'string'
    ? exam.payload.round
    : typeof exam.payload.dawr === 'string'
      ? exam.payload.dawr
      : '';
  const answerKey = activeQuestionIndex * 100 + activePartIndex;

  useEffect(() => {
    setActiveQuestionIndex(0);
    setActivePartIndex(0);
    setAnswers({});
    setImages({});
  }, [exam.id]);

  const handleImageSelected = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const previous = images[answerKey];
    if (previous) URL.revokeObjectURL(previous);
    setImages((current) => ({
      ...current,
      [answerKey]: URL.createObjectURL(file),
    }));
  };

  const openQuestion = (index: number) => {
    setActiveQuestionIndex(index);
    setActivePartIndex(0);
  };

  const turnPartPage = (direction: 1 | -1) => {
    if (!activeQuestion) return;
    const nextIndex = activePartIndex + direction;
    if (nextIndex < 0 || nextIndex >= activeQuestion.parts.length) return;
    playPageFlipSound();
    setActivePartIndex(nextIndex);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/65 p-3 backdrop-blur-sm" dir="rtl">
      <div className="flex h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-stone-50 text-slate-950 shadow-2xl sm:h-[88vh]">
        <header className="border-b border-slate-200 bg-white px-4 py-3 text-[11px] font-bold text-slate-700">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 text-right">
              <p>جمهورية العراق - وزارة التربية</p>
              <p className="mt-1 text-slate-500">{subjectName}</p>
            </div>
            <div className="min-w-0 flex-1 text-center">
              <p className="text-[10px] text-emerald-600">{examLabel}</p>
              <h2 className="mt-1 truncate text-sm font-black text-slate-950">{exam.title}</h2>
              <p className="mt-1 text-[10px] text-slate-500">عدد الأسئلة: {questions.length}</p>
            </div>
            <button type="button" onClick={onClose} className="shrink-0 rounded-full border border-slate-200 bg-slate-100 p-2 text-slate-700 shadow-sm" aria-label="خروج من الامتحان">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[10px] text-slate-500">
            <span>المادة: {subjectName}</span>
            {examDate && <span>التاريخ: {examDate}</span>}
            {examRound && <span>الدور: {examRound}</span>}
          </div>
        </header>

        {questions.length > 0 && (
          <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-stone-100 px-3 py-2" aria-label="التنقل بين أسئلة الامتحان">
            {questions.map((question, index) => {
              const isActive = index === activeQuestionIndex;
              return (
                <button
                  key={`exam-question-tab-${index}`}
                  type="button"
                  onClick={() => openQuestion(index)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black transition ${
                    isActive
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {question.title || `س${index + 1}`}
                </button>
              );
            })}
          </nav>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          {questions.length === 0 ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-800">تم حفظ الملف، لكن صيغة الأسئلة تحتاج مراجعة قبل العرض التفاعلي.</p>
          ) : activeQuestion && activePart && (
            <article key={`${activeQuestionIndex}-${activePartIndex}`} className="rounded-xl border border-slate-200 bg-white p-4 text-right shadow-sm transition duration-300 animate-in slide-in-from-left-3">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-950">{activeQuestion.title} - الفرع {activePart.title}</h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600">
                  فرع {activePartIndex + 1} من {activeQuestion.parts.length}
                </span>
              </div>
              <p className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm leading-8 text-slate-900">{activePart.text}</p>
              {activeQuestion.parts.length > 1 && (
                <div className="mt-3 flex items-center justify-between gap-3">
                  <button type="button" onClick={() => turnPartPage(-1)} disabled={activePartIndex === 0} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-40">
                    <ChevronRight className="h-4 w-4" />
                    السابق
                  </button>
                  <div className="flex gap-1">
                    {activeQuestion.parts.map((part, index) => (
                      <button
                        key={`${part.title}-${index}`}
                        type="button"
                        onClick={() => {
                          if (index !== activePartIndex) playPageFlipSound();
                          setActivePartIndex(index);
                        }}
                        className={`h-2.5 rounded-full transition-all ${index === activePartIndex ? 'w-6 bg-slate-950' : 'w-2.5 bg-slate-300'}`}
                        aria-label={`الفرع ${part.title}`}
                      />
                    ))}
                  </div>
                  <button type="button" onClick={() => turnPartPage(1)} disabled={activePartIndex === activeQuestion.parts.length - 1} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 disabled:opacity-40">
                    التالي
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                </div>
              )}
              <div className="mt-5 border-t border-slate-100 pt-4">
                <label className="text-xs font-black text-slate-600" htmlFor={`exam-answer-${exam.id}-${answerKey}`}>
                  اكتب إجابتك هنا
                </label>
                <textarea
                  id={`exam-answer-${exam.id}-${answerKey}`}
                  value={answers[answerKey] || ''}
                  onChange={(event) => setAnswers((current) => ({ ...current, [answerKey]: event.target.value }))}
                  className="mt-2 min-h-32 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-7 outline-none focus:border-sky-400 focus:bg-white"
                  placeholder="اكتب جوابك بدون أن تظهر الإجابة النموذجية للطالب..."
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white">
                    <Camera className="h-4 w-4" />
                    رفع صورة للإجابة
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) handleImageSelected(file);
                        event.target.value = '';
                      }}
                    />
                  </label>
                  {images[answerKey] && (
                    <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                      <ImageIcon className="h-4 w-4" />
                      تم رفع صورة
                    </span>
                  )}
                </div>
                {images[answerKey] && (
                  <img src={images[answerKey]} alt="معاينة إجابة الطالب" className="mt-3 max-h-48 w-full rounded-xl border border-slate-200 object-contain" />
                )}
              </div>
            </article>
          )}
        </div>
      </div>
    </div>
  );
};

export const ChapterExamIcons: React.FC<ChapterExamIconsProps> = ({ subjectId, subjectName, chapterNumber, className }) => {
  const [monthly, setMonthly] = useState<CurriculumExamRecord[]>([]);
  const [ministry, setMinistry] = useState<CurriculumExamRecord[]>([]);
  const [selected, setSelected] = useState<CurriculumExamRecord | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadBank = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const bank = await fetchChapterExamBank(subjectId, chapterNumber);
      setMonthly(bank.monthly);
      setMinistry(bank.ministry);
      return bank;
    } catch (error) {
      setLoadError('تعذر تحميل الامتحانات حالياً. حاول مرة أخرى.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const openExamPicker = async () => {
    setIsPickerOpen(true);
    if (!monthly.length && !ministry.length && !isLoading) {
      try {
        await loadBank();
      } catch {
        // The picker remains open and shows the friendly error message.
      }
    }
  };

  const readableExams = (exams: CurriculumExamRecord[]) => exams.filter((exam) => questionEntries(exam.payload).length > 0);

  const openRandomExam = (exams: CurriculumExamRecord[]) => {
    const randomExam = chooseRandomExam(readableExams(exams));
    if (randomExam) {
      setSelected(randomExam);
      setIsPickerOpen(false);
    }
  };

  const renderExamColumn = (
    title: string,
    description: string,
    exams: CurriculumExamRecord[],
    emptyMessage: string,
    accentClass: string,
  ) => (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3">
        <p className={`text-[11px] font-black ${accentClass}`}>{description}</p>
        <h3 className="text-lg font-black text-white">{title}</h3>
      </div>
      {readableExams(exams).length > 0 && (
        <button type="button" onClick={() => openRandomExam(exams)} className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 p-3 text-xs font-black text-slate-950 transition hover:bg-amber-300">
          <Shuffle className="h-4 w-4" />
          اختيار عشوائي
        </button>
      )}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
        {isLoading ? (
          <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-xs font-bold leading-6 text-white/60">جاري تحميل الامتحانات...</p>
        ) : loadError ? (
          <p className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-center text-xs font-bold leading-6 text-red-100">{loadError}</p>
        ) : exams.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-xs font-bold leading-6 text-white/60">{emptyMessage}</p>
        ) : exams.map((exam) => {
          const questionCount = questionEntries(exam.payload).length;
          const isReadable = questionCount > 0;
          return (
            <button
              key={exam.id}
              type="button"
              onClick={() => {
                if (!isReadable) return;
                setSelected(exam);
                setIsPickerOpen(false);
              }}
              disabled={!isReadable}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-right transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="min-w-0">
                <span className="block truncate text-xs font-black leading-6 text-white">{exam.title}</span>
                <span className="block text-[10px] font-bold text-white/55">
                  {isReadable ? `${questionCount} سؤال` : 'صيغة غير مقروءة'}
                </span>
              </span>
              <ChevronLeft className="h-4 w-4 shrink-0 text-sky-300" />
            </button>
          );
        })}
      </div>
    </section>
  );

  return (
    <>
      <div className={`${className || 'absolute left-3 top-3'} z-40 flex items-center gap-2`} dir="rtl">
        <button type="button" onClick={openExamPicker} disabled={isLoading} className="group flex items-center gap-2 rounded-2xl border border-amber-200/50 bg-amber-400 px-3 py-2 text-right text-[11px] font-black text-slate-950 shadow-xl transition hover:scale-[1.03] disabled:opacity-60" aria-label={`الامتحان الشهري للفصل ${chapterNumber}`}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpenCheck className="h-4 w-4" />}
          <span>الامتحان الشهري</span>
        </button>
        <button type="button" onClick={openExamPicker} disabled={isLoading} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-200/50 bg-sky-500 text-white shadow-xl transition hover:scale-[1.03] disabled:opacity-60" aria-label="الامتحانات الوزارية">
          <Award className="h-5 w-5" />
        </button>
      </div>

      {isPickerOpen && !selected && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm" dir="rtl">
          <div className="flex h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950 text-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-white/10 p-4">
              <div>
                <p className="text-[10px] font-bold text-sky-300">{subjectName}</p>
                <h2 className="text-base font-black">اختر نموذج الامتحان</h2>
              </div>
              <button type="button" onClick={() => setIsPickerOpen(false)} className="rounded-full bg-white/10 p-2" aria-label="خروج">
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="grid min-h-0 flex-1 grid-cols-[1fr_auto_1fr] gap-3 p-4">
              {renderExamColumn(
                'شهري',
                'نماذج الفصل المتوفرة',
                monthly,
                'لا توجد امتحانات شهرية لهذا الفصل حاليًا.',
                'text-amber-300',
              )}
              <div className="w-px bg-white/10" aria-hidden="true" />
              {renderExamColumn(
                'وزاري',
                'أسئلة السنوات والأدوار',
                ministry,
                'لا توجد امتحانات وزارية لهذا الموضوع حاليًا.',
                'text-sky-300',
              )}
            </div>
          </div>
        </div>
      )}
      {selected && <ExamPreview exam={selected} subjectName={subjectName} onClose={() => setSelected(null)} />}
    </>
  );
};
