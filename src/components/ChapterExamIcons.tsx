import React, { useState } from 'react';
import { Award, BookOpenCheck, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { chooseRandomExam, CurriculumExamRecord, fetchChapterExamBank } from '../services/examBankService';

interface ChapterExamIconsProps {
  subjectId: string;
  subjectName: string;
  chapterNumber: number;
  className?: string;
}

type QuestionEntry = { title: string; text: string };

type Meta = { date?: string; role?: string; duration?: string };

function readQuestion(value: unknown, title = ''): QuestionEntry | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const obj = value as Record<string, unknown>;
  const question = obj.question || obj.text || obj.prompt || obj.question_text;
  if (typeof question !== 'string' || !question.trim()) return null;
  return { title, text: question.trim() };
}

export function questionEntries(payload: Record<string, unknown>): QuestionEntry[] {
  const source = payload.exam_paper || payload.questions || payload.exam || payload.items;
  if (Array.isArray(source)) return source.map((item, index) => readQuestion(item, `س${index + 1}`)).filter(Boolean) as QuestionEntry[];
  if (source && typeof source === 'object') {
    const direct = Object.entries(source as Record<string, unknown>).map(([key, value]) => readQuestion(value, key)).filter(Boolean) as QuestionEntry[];
    if (direct.length) return direct;
  }
  const found: QuestionEntry[] = [];
  const walk = (value: unknown, key = '') => {
    const item = readQuestion(value, key);
    if (item) {
      if (!found.some((existing) => existing.text === item.text)) found.push({ ...item, title: item.title || `س${found.length + 1}` });
      return;
    }
    if (Array.isArray(value)) value.forEach((child, index) => walk(child, `س${index + 1}`));
    else if (value && typeof value === 'object') Object.entries(value as Record<string, unknown>).forEach(([childKey, child]) => walk(child, childKey));
  };
  walk(payload);
  return found;
}

function firstText(payload: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function examMeta(exam: CurriculumExamRecord): Meta {
  const payload = exam.payload;
  return {
    date: firstText(payload, ['date', 'exam_date', 'examDate', 'تاريخ', 'التاريخ']),
    role: firstText(payload, ['role', ' الدور', 'الدور', 'round', 'session', 'year_role']),
    duration: firstText(payload, ['duration', 'time', 'الوقت', 'المدة']),
  };
}

const ExamViewer: React.FC<{ exam: CurriculumExamRecord; onClose: () => void }> = ({ exam, onClose }) => {
  const questions = questionEntries(exam.payload);
  const [current, setCurrent] = useState(0);
  const meta = examMeta(exam);
  const active = questions[current];
  const label = (index: number) => `س${index + 1}`;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[#f2f2f2] p-2 sm:p-4" dir="rtl">
      <div className="flex h-[96vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-[#fffef8] text-slate-900 shadow-2xl">
        <header className="shrink-0 border-b border-slate-200 bg-white px-3 py-2 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-700 hover:bg-slate-100" aria-label="خروج من الامتحان"><X className="h-5 w-5" /></button>
            <div className="min-w-0 flex-1 text-center">
              <h2 className="truncate text-sm font-black sm:text-base">{exam.title}</h2>
              <p className="truncate text-[10px] font-bold text-slate-500">{exam.exam_type === 'monthly' ? 'امتحان شهري' : 'امتحان وزاري'}{meta.date ? ` · ${meta.date}` : ''}{meta.role ? ` · ${meta.role}` : ''}</p>
            </div>
            <span className="whitespace-nowrap text-[10px] font-black text-slate-500">{questions.length} سؤال</span>
          </div>
          <div className="mt-2 flex items-center gap-1 overflow-x-auto pb-0.5">
            {questions.map((_, index) => (
              <button key={index} type="button" onClick={() => setCurrent(index)} className={`min-w-10 rounded-lg px-2 py-1 text-[11px] font-black transition ${index === current ? 'bg-slate-900 text-white' : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'}`} aria-label={`الانتقال إلى السؤال ${index + 1}`}>{label(index)}</button>
            ))}
          </div>
        </header>

        <main className="relative flex-1 overflow-y-auto px-4 py-6 sm:px-8">
          <div className="pointer-events-none absolute inset-y-0 right-7 w-px bg-red-200/80 sm:right-12" />
          <div className="min-h-full rounded-sm border border-slate-200 bg-[repeating-linear-gradient(to_bottom,#fffef8_0px,#fffef8_31px,#cbd5e1_32px)] px-5 py-5 pr-10 text-right sm:px-10 sm:pr-16">
            <div className="mb-7 text-center text-[10px] font-bold leading-5 text-slate-500">
              <p>{subjectLabel(exam.subject_id)} · {exam.exam_type === 'monthly' ? 'الامتحان الشهري' : 'الامتحان الوزاري'}</p>
              {meta.duration && <p>{meta.duration}</p>}
            </div>
            {active ? (
              <article>
                <h3 className="text-base font-black leading-8 text-slate-900 sm:text-lg">{active.title || label(current)}: {active.text}</h3>
                <div className="mt-7 min-h-[55vh] pt-2 text-sm font-bold text-slate-700">الإجابة:</div>
              </article>
            ) : (
              <p className="rounded-lg bg-amber-50 p-4 text-sm font-bold text-amber-800">لا توجد أسئلة قابلة للعرض في هذا الملف.</p>
            )}
          </div>
        </main>

        <footer className="flex shrink-0 items-center justify-between border-t border-slate-200 bg-white px-3 py-2">
          <button type="button" onClick={() => setCurrent((value) => Math.max(0, value - 1))} disabled={current === 0} className="rounded-full p-2 text-slate-700 disabled:opacity-30" aria-label="السؤال السابق"><ChevronRight className="h-5 w-5" /></button>
          <span className="text-[11px] font-black text-slate-500">{questions.length ? `${label(current)} من ${questions.length}` : 'لا توجد أسئلة'}</span>
          <button type="button" onClick={() => setCurrent((value) => Math.min(Math.max(questions.length - 1, 0), value + 1))} disabled={current >= questions.length - 1} className="rounded-full p-2 text-slate-700 disabled:opacity-30" aria-label="السؤال التالي"><ChevronLeft className="h-5 w-5" /></button>
        </footer>
      </div>
    </div>
  );
};

function subjectLabel(subjectId: string): string {
  const labels: Record<string, string> = { biology: 'الأحياء', chemistry: 'الكيمياء', physics: 'الفيزياء', mathematics: 'الرياضيات', math: 'الرياضيات' };
  return labels[subjectId] || subjectId;
}

export const ChapterExamIcons: React.FC<ChapterExamIconsProps> = ({ subjectId, subjectName, chapterNumber, className }) => {
  const [monthly, setMonthly] = useState<CurriculumExamRecord[]>([]);
  const [ministry, setMinistry] = useState<CurriculumExamRecord[]>([]);
  const [selected, setSelected] = useState<CurriculumExamRecord | null>(null);
  const [isMinistryOpen, setIsMinistryOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadBank = async () => {
    setIsLoading(true);
    try {
      const bank = await fetchChapterExamBank(subjectId, chapterNumber);
      setMonthly(bank.monthly);
      setMinistry(bank.ministry);
      return bank;
    } finally { setIsLoading(false); }
  };
  const ensureBank = () => (monthly.length || ministry.length ? Promise.resolve({ monthly, ministry }) : loadBank());
  const openMonthly = async () => { const bank = await ensureBank(); setSelected(chooseRandomExam(bank.monthly)); };
  const openMinistry = async () => { const bank = await ensureBank(); setIsMinistryOpen(true); if (bank.ministry.length === 1) { setSelected(bank.ministry[0]); setIsMinistryOpen(false); } };

  return (
    <>
      <div className={`${className || 'absolute left-3 top-3'} z-40 flex items-center gap-2`} dir="rtl">
        <button type="button" onClick={openMonthly} disabled={isLoading} className="group flex items-center gap-2 rounded-2xl border border-amber-200/50 bg-amber-400 px-3 py-2 text-right text-[11px] font-black text-slate-950 shadow-xl transition hover:scale-[1.03] disabled:opacity-60" aria-label={`الامتحان الشهري للفصل ${chapterNumber}`}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpenCheck className="h-4 w-4" />}<span>الامتحان الشهري</span>
        </button>
        <button type="button" onClick={openMinistry} disabled={isLoading} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-200/50 bg-sky-500 text-white shadow-xl transition hover:scale-[1.03] disabled:opacity-60" aria-label="الامتحانات الوزارية"><Award className="h-5 w-5" /></button>
      </div>
      {isMinistryOpen && <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center" dir="rtl"><div className="max-h-[78vh] w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-slate-950 text-white shadow-2xl"><header className="flex items-center justify-between border-b border-white/10 p-4"><div><p className="text-[10px] font-bold text-sky-300">{subjectName}</p><h2 className="text-base font-black">الامتحانات الوزارية</h2></div><button type="button" onClick={() => setIsMinistryOpen(false)} className="rounded-full bg-white/10 p-2" aria-label="إغلاق"><X className="h-5 w-5" /></button></header><div className="space-y-2 overflow-y-auto p-4">{ministry.length === 0 ? <p className="p-4 text-center text-sm text-white/60">لا توجد نماذج وزارية لهذا الفصل حاليًا.</p> : ministry.map((exam) => <button key={exam.id} type="button" onClick={() => { setSelected(exam); setIsMinistryOpen(false); }} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 text-right transition hover:bg-sky-500/15"><span className="min-w-0 text-xs font-bold leading-6">{exam.title} · {questionEntries(exam.payload).length} سؤال</span><ChevronLeft className="h-4 w-4 shrink-0 text-sky-300" /></button>)}</div></div></div>}
      {selected && <ExamViewer exam={selected} onClose={() => setSelected(null)} />}
    </>
  );
};
