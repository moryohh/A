import React, { useEffect, useState } from 'react';
import { Award, BookOpenCheck, ChevronLeft, Loader2, Shuffle, X } from 'lucide-react';
import { chooseRandomExam, CurriculumExamRecord, fetchChapterExamBank } from '../services/examBankService';

interface ChapterExamIconsProps {
  subjectId: string;
  subjectName: string;
  chapterNumber: number;
  className?: string;
}

type QuestionEntry = { title: string; text: string; answer?: string };
type ExamPickerMode = 'monthly' | 'ministry';

function readQuestion(value: unknown, title = ''): QuestionEntry | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const obj = value as Record<string, unknown>;
  const question = obj.question || obj.text || obj.prompt;
  const answer = obj.answer || obj.model_answer;
  if (typeof question !== 'string' || !question.trim()) return null;
  return { title, text: question.trim(), answer: typeof answer === 'string' ? answer : undefined };
}

export function questionEntries(payload: Record<string, unknown>): QuestionEntry[] {
  const source = payload.exam_paper || payload.questions || payload.exam;
  if (Array.isArray(source)) {
    return source.map((item, index) => readQuestion(item, `السؤال ${index + 1}`)).filter(Boolean) as QuestionEntry[];
  }
  if (source && typeof source === 'object') {
    const entries = Object.entries(source as Record<string, unknown>);
    const direct = entries.map(([key, value]) => readQuestion(value, key)).filter(Boolean) as QuestionEntry[];
    if (direct.length > 0) return direct;
  }
  const fallback: QuestionEntry[] = [];
  const walk = (value: unknown, key = '') => {
    const entry = readQuestion(value, key);
    if (entry) {
      if (!fallback.some((item) => item.text === entry.text)) fallback.push(entry);
      return;
    }
    if (Array.isArray(value)) value.forEach((item, index) => walk(item, `السؤال ${index + 1}`));
    else if (value && typeof value === 'object') Object.entries(value as Record<string, unknown>).forEach(([childKey, childValue]) => walk(childValue, childKey));
  };
  walk(payload);
  return fallback;
}

const ExamPreview: React.FC<{ exam: CurriculumExamRecord; subjectName: string; onClose: () => void }> = ({ exam, subjectName, onClose }) => {
  const entries = questionEntries(exam.payload);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const activeQuestion = entries[activeQuestionIndex];
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

  useEffect(() => {
    setActiveQuestionIndex(0);
  }, [exam.id]);

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
              <p className="mt-1 text-[10px] text-slate-500">عدد الأسئلة: {entries.length}</p>
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

        {entries.length > 0 && (
          <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-stone-100 px-3 py-2" aria-label="التنقل بين أسئلة الامتحان">
            {entries.map((_, index) => {
              const isActive = index === activeQuestionIndex;
              return (
                <button
                  key={`exam-question-tab-${index}`}
                  type="button"
                  onClick={() => setActiveQuestionIndex(index)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black transition ${
                    isActive
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  س{index + 1}
                </button>
              );
            })}
          </nav>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          {entries.length === 0 ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-800">تم حفظ الملف، لكن صيغة الأسئلة تحتاج مراجعة قبل العرض التفاعلي.</p>
          ) : activeQuestion && (
            <article className="min-h-full rounded-xl border border-slate-200 bg-white p-4 text-right shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-950">{activeQuestion.title || `س${activeQuestionIndex + 1}`}</h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-600">
                  س{activeQuestionIndex + 1} من {entries.length}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-8 text-slate-900">{activeQuestion.text}</p>
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
  const [pickerMode, setPickerMode] = useState<ExamPickerMode | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadBank = async () => {
    setIsLoading(true);
    try {
      const bank = await fetchChapterExamBank(subjectId, chapterNumber);
      setMonthly(bank.monthly);
      setMinistry(bank.ministry);
      return bank;
    } finally {
      setIsLoading(false);
    }
  };

  const openMonthly = async () => {
    if (!monthly.length && !ministry.length) await loadBank();
    setPickerMode('monthly');
  };

  const openMinistry = async () => {
    if (!monthly.length && !ministry.length) await loadBank();
    setPickerMode('ministry');
  };

  const pickerExams = pickerMode === 'monthly' ? monthly : ministry;
  const pickerTitle = pickerMode === 'monthly' ? 'الامتحانات الشهرية' : 'الامتحانات الوزارية';
  const pickerEmpty = pickerMode === 'monthly' ? 'لا توجد نماذج شهرية لهذا الفصل حاليًا.' : 'لا توجد نماذج وزارية لهذا الموضوع حاليًا.';

  const openRandomFromPicker = () => {
    const randomExam = chooseRandomExam(pickerExams);
    if (randomExam) {
      setSelected(randomExam);
      setPickerMode(null);
    }
  };

  return (
    <>
      <div className={`${className || 'absolute left-3 top-3'} z-40 flex items-center gap-2`} dir="rtl">
        <button type="button" onClick={openMonthly} disabled={isLoading} className="group flex items-center gap-2 rounded-2xl border border-amber-200/50 bg-amber-400 px-3 py-2 text-right text-[11px] font-black text-slate-950 shadow-xl transition hover:scale-[1.03] disabled:opacity-60" aria-label={`الامتحان الشهري للفصل ${chapterNumber}`}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpenCheck className="h-4 w-4" />}
          <span>الامتحان الشهري</span>
        </button>
        <button type="button" onClick={openMinistry} disabled={isLoading} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-200/50 bg-sky-500 text-white shadow-xl transition hover:scale-[1.03] disabled:opacity-60" aria-label="الامتحانات الوزارية">
          <Award className="h-5 w-5" />
        </button>
      </div>

      {pickerMode && !selected && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm" dir="rtl">
          <div className="flex max-h-[84vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950 text-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-white/10 p-4">
              <div>
                <p className="text-[10px] font-bold text-sky-300">{subjectName}</p>
                <h2 className="text-base font-black">{pickerTitle}</h2>
              </div>
              <button type="button" onClick={() => setPickerMode(null)} className="rounded-full bg-white/10 p-2" aria-label="خروج">
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-4">
              {pickerExams.length > 0 && (
                <button type="button" onClick={openRandomFromPicker} className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 p-3 text-xs font-black text-slate-950 transition hover:bg-amber-300">
                  <Shuffle className="h-4 w-4" />
                  اختيار امتحان عشوائي
                </button>
              )}
              {pickerExams.length === 0 ? (
                <p className="p-4 text-center text-sm text-white/60">{pickerEmpty}</p>
              ) : pickerExams.map((exam) => (
                <button key={exam.id} type="button" onClick={() => { setSelected(exam); setPickerMode(null); }} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 text-right transition hover:bg-sky-500/15">
                  <span className="min-w-0 text-xs font-bold leading-6">{exam.title} · {questionEntries(exam.payload).length} سؤال</span>
                  <ChevronLeft className="h-4 w-4 shrink-0 text-sky-300" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
      {selected && <ExamPreview exam={selected} subjectName={subjectName} onClose={() => setSelected(null)} />}
    </>
  );
};
