import React, { useState } from 'react';
import { QuizQuestion, DiagramPart } from '../types';
import { Award, HelpCircle, CheckCircle2, XCircle, RotateCcw, ArrowLeft } from 'lucide-react';

interface QuizModeProps {
  questions: QuizQuestion[];
  parts: DiagramPart[];
  selectedPartId: string | null;
  onSelectPart: (id: string) => void;
  onExitQuiz: () => void;
}

export const QuizMode: React.FC<QuizModeProps> = ({
  questions,
  parts,
  selectedPartId,
  onSelectPart,
  onExitQuiz,
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [answerStatus, setAnswerStatus] = useState<'unanswered' | 'correct' | 'incorrect'>('unanswered');
  const [quizCompleted, setQuizCompleted] = useState(false);

  const currentQ = questions[currentIdx];

  // Check user answer when selectedPartId changes
  React.useEffect(() => {
    if (!selectedPartId || answerStatus !== 'unanswered') return;

    if (selectedPartId === currentQ.targetPartId) {
      setAnswerStatus('correct');
      setScore((prev) => prev + 1);
    } else {
      setAnswerStatus('incorrect');
    }
  }, [selectedPartId, currentQ, answerStatus]);

  const handleNext = () => {
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
      setShowHint(false);
      setAnswerStatus('unanswered');
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setScore(0);
    setShowHint(false);
    setAnswerStatus('unanswered');
    setQuizCompleted(false);
  };

  const targetPart = parts.find((p) => p.id === currentQ?.targetPartId);

  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl backdrop-blur-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 text-amber-400 mb-4">
          <Award className="w-8 h-8" />
        </div>
        <h3 className="text-2xl font-black text-white mb-2">
          اكتمل الاختبار العلمي بنجاح!
        </h3>
        <p className="text-slate-300 mb-4">
          نتيجتك: <span className="font-bold text-sky-400 text-lg">{score}</span> من{' '}
          <span className="font-bold text-slate-400">{questions.length}</span> ({percentage}%)
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleRestart}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/30 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>إعادة الاختبار</span>
          </button>
          <button
            onClick={onExitQuiz}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-colors"
          >
            <span>العودة للاستكشاف</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-400 text-xs font-black">
            سؤال {currentIdx + 1} من {questions.length}
          </span>
          <span className="text-xs text-slate-400">
            النقاط: <strong className="text-emerald-400">{score}</strong>
          </span>
        </div>

        <button
          onClick={onExitQuiz}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
        >
          <span>إنهاء الاختبار</span>
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Question Prompt */}
      <div className="my-4">
        <p className="text-base md:text-lg font-bold text-white leading-relaxed">
          {currentQ.prompt}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          (انقر مباشرة على الجزء المقصود في الرسم البياني أعلاه)
        </p>
      </div>

      {/* Answer feedback status */}
      {answerStatus === 'correct' && (
        <div className="p-3.5 bg-emerald-950/60 border border-emerald-500/40 rounded-xl mb-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs md:text-sm text-emerald-200">
            <p className="font-bold mb-0.5">{currentQ.explanation}</p>
            <p className="text-emerald-300/80">العنصر المحدد: {targetPart?.nameAr}</p>
          </div>
        </div>
      )}

      {answerStatus === 'incorrect' && (
        <div className="p-3.5 bg-rose-950/60 border border-rose-500/40 rounded-xl mb-4 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs md:text-sm text-rose-200">
            <p className="font-bold">إجابة غير صحيحة، حاول مجدداً أو استعن بالتلميح أدناه!</p>
          </div>
        </div>
      )}

      {/* Actions and Hint */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <div>
          {!showHint ? (
            <button
              onClick={() => setShowHint(true)}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>إظهار تلميح</span>
            </button>
          ) : (
            <p className="text-xs text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg max-w-md">
              💡 <strong>تلميح:</strong> {currentQ.hint}
            </p>
          )}
        </div>

        {answerStatus !== 'unanswered' && (
          <button
            onClick={handleNext}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-600/30 transition-colors"
          >
            {currentIdx + 1 < questions.length ? 'السؤال التالي ←' : 'عرض النتيجة النهائية'}
          </button>
        )}
      </div>
    </div>
  );
};
