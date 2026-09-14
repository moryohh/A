import React from 'react';
import { CheckCircle2, X, XCircle, AlertTriangle, ClipboardCheck } from 'lucide-react';
import { NotificationExamResult } from '../types';
import { useAppTheme } from '../services/themeService';

interface ExamResultDetailsModalProps {
  result: NotificationExamResult | null;
  onClose: () => void;
}

export const ExamResultDetailsModal: React.FC<ExamResultDetailsModalProps> = ({ result, onClose }) => {
  const { theme } = useAppTheme();
  if (!result) return null;

  const total = result.totalScore ?? result.answers.reduce((sum, answer) => sum + (answer.maxScore || 0), 0);
  const score = result.score ?? result.answers.reduce((sum, answer) => sum + (answer.score || 0), 0);
  const percentage = result.percentage ?? (total > 0 ? Math.round((score / total) * 100) : 0);
  const correct = result.answers.filter((answer) => answer.status === 'correct').length;
  const wrong = result.answers.filter((answer) => answer.status === 'wrong').length;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center" dir="rtl">
      <section className={`flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border sm:rounded-3xl ${theme.classes.cardBorder} ${theme.classes.cardBg}`}>
        <header className={`flex items-center justify-between border-b p-4 ${theme.classes.cardBorder}`}>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-6 w-6 text-sky-500" />
            <div>
              <h2 className={`text-base font-black ${theme.classes.textMain}`}>{result.title}</h2>
              {result.subject && <p className={`text-[11px] ${theme.classes.textMuted}`}>{result.subject}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} className={`rounded-full border p-2 ${theme.classes.cardBorder} ${theme.classes.cardSubtleBg}`} aria-label="إغلاق"><X className="h-5 w-5" /></button>
        </header>

        <div className="overflow-y-auto p-4">
          <div className="rounded-3xl bg-gradient-to-br from-sky-500 to-cyan-600 p-5 text-center text-white shadow-lg">
            <p className="text-xs font-bold opacity-85">درجتك</p>
            <p className="mt-1 text-4xl font-black" dir="ltr">{score} / {total || '—'}</p>
            <p className="mt-1 text-lg font-black">%{percentage}</p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-center">
              <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-500" />
              <p className="mt-1 text-sm font-black text-emerald-600">{correct} صحيحة</p>
            </div>
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-3 text-center">
              <XCircle className="mx-auto h-5 w-5 text-rose-500" />
              <p className="mt-1 text-sm font-black text-rose-600">{wrong} خاطئة</p>
            </div>
          </div>

          {result.summary && <p className={`mt-3 rounded-2xl border p-3 text-xs leading-6 ${theme.classes.cardBorder} ${theme.classes.cardSubtleBg} ${theme.classes.textMain}`}>{result.summary}</p>}

          <div className="mt-4 space-y-3">
            {result.answers.map((answer, index) => {
              const status = answer.status || 'ungraded';
              const statusClass = status === 'correct' ? 'border-emerald-500/35 bg-emerald-500/10' : status === 'wrong' ? 'border-rose-500/35 bg-rose-500/10' : 'border-amber-500/35 bg-amber-500/10';
              return (
                <article key={`${answer.label}-${index}`} className={`rounded-2xl border p-3 ${statusClass}`}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={`text-sm font-black ${theme.classes.textMain}`}>{answer.label}</h3>
                    <span className="text-xs font-black" dir="ltr">{answer.score ?? '—'} / {answer.maxScore ?? '—'}</span>
                  </div>
                  {answer.prompt && <p className={`mt-2 text-xs leading-6 ${theme.classes.textMuted}`}>{answer.prompt}</p>}
                  <div className="mt-2 rounded-xl bg-black/5 p-2">
                    <span className="text-[10px] font-black text-sky-600">إجابتك</span>
                    <p className={`mt-1 whitespace-pre-wrap text-xs leading-6 ${theme.classes.textMain}`}>{answer.userAnswer || 'لم تُسجل إجابة نصية'}</p>
                  </div>
                  {answer.modelAnswer && <div className="mt-2 rounded-xl bg-emerald-500/10 p-2"><span className="text-[10px] font-black text-emerald-600">الإجابة الصحيحة</span><p className={`mt-1 whitespace-pre-wrap text-xs leading-6 ${theme.classes.textMain}`}>{answer.modelAnswer}</p></div>}
                  {answer.feedback && <p className={`mt-2 text-xs leading-6 ${theme.classes.textMuted}`}><AlertTriangle className="ml-1 inline h-3.5 w-3.5 text-amber-500" />{answer.feedback}</p>}
                </article>
              );
            })}
            {result.answers.length === 0 && <p className={`py-6 text-center text-sm ${theme.classes.textMuted}`}>لا توجد تفاصيل إجابات محفوظة لهذه المحاولة القديمة.</p>}
          </div>
        </div>
      </section>
    </div>
  );
};
