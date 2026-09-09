import React, { useState } from 'react';
import { Award, BookOpenCheck, ChevronLeft, Loader2, X } from 'lucide-react';
import {
  chooseRandomExam,
  CurriculumExamRecord,
  fetchChapterExamBank,
} from '../services/examBankService';

interface ChapterExamIconsProps {
  subjectId: string;
  subjectName: string;
  chapterNumber: number;
}

function questionEntries(payload: Record<string, unknown>): Array<{ title: string; text: string; answer?: string }> {
  const candidates: unknown[] = [];
  const collect = (value: unknown, key = '') => {
    if (Array.isArray(value)) {
      value.forEach((item) => collect(item, key));
      return;
    }
    if (!value || typeof value !== 'object') return;
    const obj = value as Record<string, unknown>;
    const question = obj.question || obj.text || obj.prompt;
    const answer = obj.answer || obj.model_answer;
    if (typeof question === 'string' && question.trim()) {
      candidates.push({ title: key, text: question.trim(), answer: typeof answer === 'string' ? answer : undefined });
    }
    Object.entries(obj).forEach(([childKey, childValue]) => collect(childValue, childKey));
  };
  collect(payload);
  return candidates as Array<{ title: string; text: string; answer?: string }>;
}

const ExamPreview: React.FC<{ exam: CurriculumExamRecord; onClose: () => void }> = ({ exam, onClose }) => {
  const entries = questionEntries(exam.payload);
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center" dir="rtl">
      <div className="max-h-[88vh] w-full max-w-xl overflow-hidden rounded-3xl border border-white/15 bg-slate-950 text-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 p-4">
          <div>
            <p className="text-[10px] font-bold text-sky-300">{exam.exam_type === 'monthly' ? 'امتحان شهري' : 'امتحان وزاري'}</p>
            <h2 className="mt-1 text-base font-black">{exam.title}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-white/10 p-2" aria-label="إغلاق الامتحان"><X className="h-5 w-5" /></button>
        </header>
        <div className="max-h-[72vh] space-y-3 overflow-y-auto p-4">
          {entries.length === 0 ? (
            <p className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100">تم حفظ الملف، لكن صيغة الأسئلة تحتاج مراجعة قبل العرض التفاعلي.</p>
          ) : entries.map((entry, index) => (
            <article key={`${index}-${entry.text.slice(0, 20)}`} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-right">
              <h3 className="text-sm font-black text-sky-200">س{index + 1}{entry.title ? ` — ${entry.title}` : ''}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-white/90">{entry.text}</p>
              {entry.answer && <details className="mt-3 rounded-xl bg-black/20 p-3"><summary className="cursor-pointer text-xs font-black text-emerald-300">إظهار الجواب النموذجي</summary><p className="mt-2 whitespace-pre-wrap text-xs leading-6 text-white/75">{entry.answer}</p></details>}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export const ChapterExamIcons: React.FC<ChapterExamIconsProps> = ({ subjectId, subjectName, chapterNumber }) => {
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
    } finally {
      setIsLoading(false);
    }
  };

  const openMonthly = async () => {
    const bank = monthly.length || ministry.length ? { monthly, ministry } : await loadBank();
    setSelected(chooseRandomExam(bank.monthly));
  };

  const openMinistry = async () => {
    const bank = monthly.length || ministry.length ? { monthly, ministry } : await loadBank();
    setIsMinistryOpen(true);
    if (bank.ministry.length === 1) setSelected(bank.ministry[0]);
  };

  return (
    <>
      <div className="absolute left-3 top-3 z-40 flex items-center gap-2" dir="rtl">
        <button type="button" onClick={openMonthly} disabled={isLoading} className="group flex items-center gap-2 rounded-2xl border border-amber-200/50 bg-amber-400 px-3 py-2 text-right text-[11px] font-black text-slate-950 shadow-xl transition hover:scale-[1.03] disabled:opacity-60" aria-label={`الامتحان الشهري للفصل ${chapterNumber}`}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpenCheck className="h-4 w-4" />}
          <span>شهري الفصل {chapterNumber}</span>
        </button>
        <button type="button" onClick={openMinistry} disabled={isLoading} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-200/50 bg-sky-500 text-white shadow-xl transition hover:scale-[1.03] disabled:opacity-60" aria-label="الامتحانات الوزارية">
          <Award className="h-5 w-5" />
        </button>
      </div>

      {isMinistryOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 p-3 backdrop-blur-sm sm:items-center" dir="rtl">
          <div className="max-h-[78vh] w-full max-w-md overflow-hidden rounded-3xl border border-white/15 bg-slate-950 text-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-white/10 p-4"><div><p className="text-[10px] font-bold text-sky-300">{subjectName}</p><h2 className="text-base font-black">الامتحانات الوزارية</h2></div><button type="button" onClick={() => setIsMinistryOpen(false)} className="rounded-full bg-white/10 p-2"><X className="h-5 w-5" /></button></header>
            <div className="space-y-2 overflow-y-auto p-4">
              {ministry.length === 0 ? <p className="p-4 text-center text-sm text-white/60">لا توجد نماذج وزارية لهذا الموضوع حاليًا.</p> : ministry.map((exam) => <button key={exam.id} type="button" onClick={() => { setSelected(exam); setIsMinistryOpen(false); }} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 text-right transition hover:bg-sky-500/15"><span className="min-w-0 text-xs font-bold leading-6">{exam.title}</span><ChevronLeft className="h-4 w-4 shrink-0 text-sky-300" /></button>)}
            </div>
          </div>
        </div>
      )}
      {selected && <ExamPreview exam={selected} onClose={() => setSelected(null)} />}
    </>
  );
};
