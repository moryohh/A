import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Trophy,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Award,
  Zap,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { TrueFalseGameConfig, TrueFalseQuestion, getTrueFalseGameForLesson } from '../data/mockTrueFalse';
import { gameAudio } from '../utils/gameAudio';
import { TrueFalseAuthenticIcon } from './GameIcons';
import { getTrueFalseReward } from '../services/pointsService';
import { ScientificText } from './ScientificText';

interface TrueFalseGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  lessonTitle: string;
  category?: string;
  onScoreUpdate?: (points: number) => void;
  onAssessmentResult?: (correctPoints: number, totalPoints: number) => void;
  customConfig?: TrueFalseGameConfig;
}

function shuffleTrueFalse<T>(values: T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function buildTrueFalseRound(source: TrueFalseGameConfig): TrueFalseGameConfig {
  const rawPool = source.questionPool?.length ? source.questionPool : source.questions;
  const pool = Array.from(new Map(rawPool.map((question) => [question.question.trim(), question])).values());
  if (pool.length === 0) return source;
  const target = 12;
  const selected = pool.length > target
    ? shuffleTrueFalse(pool).slice(0, target)
    : Array.from({ length: target }, (_, idx) => pool[idx % pool.length]);
  return {
    ...source,
    questions: selected.map((question, idx) => ({
      ...question,
      id: `${question.id}-round-${idx + 1}`,
      difficulty: idx < 4 ? 'سهل' : idx < 8 ? 'متوسط' : 'متقدم',
    })),
    totalQuestions: selected.length,
    totalPoints: selected.length * 100,
  };
}

export const TrueFalseGameModal: React.FC<TrueFalseGameModalProps> = ({
  isOpen,
  onClose,
  lessonId,
  lessonTitle,
  category = 'المادة التعليمية',
  onScoreUpdate,
  onAssessmentResult,
  customConfig,
}) => {
  const [config, setConfig] = useState<TrueFalseGameConfig>(() =>
    customConfig || getTrueFalseGameForLesson(lessonId, lessonTitle, category)
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<boolean | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [feedbackBurst, setFeedbackBurst] = useState<'correct' | 'wrong' | 'streak' | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [timerActive, setTimerActive] = useState(true);

  // History for review
  const [history, setHistory] = useState<
    { question: TrueFalseQuestion; chosen: boolean; isCorrect: boolean }[]
  >([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const rewardIssuedRef = useRef(false);

  // Reload config if lessonId or customConfig changes
  useEffect(() => {
    const loadedConfig = customConfig || getTrueFalseGameForLesson(lessonId, lessonTitle, category);
    setConfig(buildTrueFalseRound(loadedConfig));
    resetGame(false);
  }, [isOpen, customConfig, lessonId, lessonTitle, category]);

  useEffect(() => {
    if (isCompleted && !rewardIssuedRef.current) {
      rewardIssuedRef.current = true;
      onScoreUpdate?.(getTrueFalseReward(correctCount, config.questions.length));
    }
  }, [isCompleted, correctCount, config.questions.length, onScoreUpdate]);

  // Play the supplied 24-second game bed while the game is open.
  useEffect(() => {
    if (isOpen && soundEnabled) gameAudio.playGameSessionTheme();
    else gameAudio.stopGameSessionTheme();
    return () => gameAudio.stopGameSessionTheme();
  }, [isOpen, soundEnabled]);

  // Audio effects using GameAudioEngine
  const playAudio = (type: 'correct' | 'wrong' | 'win' | 'click' | 'streak') => {
    if (!soundEnabled) return;
    switch (type) {
      case 'correct':
        gameAudio.playTrueFalseCorrect();
        break;
      case 'wrong':
        gameAudio.playTrueFalseWrong();
        break;
      case 'streak':
        gameAudio.playTrueFalseStreak();
        break;
      case 'win':
        gameAudio.playVictoryFanfare();
        break;
      case 'click':
      default:
        gameAudio.playClick(600);
        break;
    }
  };

  // Timer per question (20 seconds)
  useEffect(() => {
    if (!isOpen || isCompleted || isAnswered || !timerActive) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          // Time's up -> mark as wrong timeout
          handleChoice(false, true);
          return 0;
        }
        if (prev <= 5 && soundEnabled) {
          gameAudio.playTimerTick(true);
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, currentIndex, isAnswered, isCompleted, timerActive, soundEnabled]);

  if (!isOpen) return null;

  if (config.questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 font-cairo">
        <div className="w-full max-w-sm rounded-3xl border border-cyan-400/40 bg-[#08152e] p-6 text-center text-white shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/40 bg-cyan-400/10 text-cyan-300">
            <HelpCircle className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-black">لا تتوفر أسئلة لهذا الدرس حاليًا</h2>
          <p className="mt-2 text-sm leading-7 text-slate-300">لم يتم العثور على ملف صح وخطأ مطابق للمادة والفصل والدرس المفتوح.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-400 px-4 py-3 font-black text-slate-950 transition-transform active:scale-95"
          >
            حسنًا
          </button>
        </div>
      </div>
    );
  }

  const currentQ = config.questions[currentIndex];
  const totalQuestions = config.questions.length;

  const handleChoice = (choice: boolean, isTimeout = false) => {
    if (isAnswered) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setIsAnswered(true);
    setSelectedChoice(choice);

    const isCorrect = !isTimeout && choice === currentQ.isCorrect;
    onAssessmentResult?.(isCorrect ? 1 : 0, 1);

    setFeedbackBurst(isCorrect ? 'correct' : 'wrong');
    window.setTimeout(() => setFeedbackBurst(null), 700);

    if (isCorrect) {
      playAudio('correct');
      const timeBonus = Math.floor(timeLeft * 2);
      const earned = currentQ.points + timeBonus;
      setScore((prev) => prev + earned);
      setCorrectCount((prev) => prev + 1);
      setStreak((prev) => {
        const next = prev + 1;
        if (next > maxStreak) setMaxStreak(next);
        if (next >= 3 && next % 2 === 1) {
          setTimeout(() => {
            setFeedbackBurst('streak');
            playAudio('streak');
            window.setTimeout(() => setFeedbackBurst(null), 700);
          }, 300);
        }
        return next;
      });
    } else {
      playAudio('wrong');
      if (soundEnabled) gameAudio.playGameLoss();
      setWrongCount((prev) => prev + 1);
      setStreak(0);
    }

    setHistory((prev) => [
      ...prev,
      {
        question: currentQ,
        chosen: choice,
        isCorrect,
      },
    ]);
  };

  const handleNext = () => {
    playAudio('click');
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedChoice(null);
      setIsAnswered(false);
      setFeedbackBurst(null);
      setTimeLeft(20);
    } else {
      setIsCompleted(true);
      playAudio('win');
    }
  };

  const resetGame = (reshuffle = true) => {
    if (reshuffle && config.questions.length > 0) setConfig(buildTrueFalseRound(config));
    rewardIssuedRef.current = false;
    setCurrentIndex(0);
    setSelectedChoice(null);
    setIsAnswered(false);
    setScore(0);
    setCorrectCount(0);
    setWrongCount(0);
    setStreak(0);
    setMaxStreak(0);
    setIsCompleted(false);
    setFeedbackBurst(null);
    setTimeLeft(20);
    setHistory([]);
  };

  const accuracy = Math.round((correctCount / totalQuestions) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-[#020617]/95 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-3 animate-in fade-in duration-200 font-cairo select-none overscroll-contain">
      <div className="bg-gradient-to-b from-[#13264a] via-[#0b1731] to-[#050b1d] border-2 border-cyan-400/30 w-full max-w-lg rounded-[30px] p-3 sm:p-5 shadow-[0_0_70px_rgba(14,165,233,0.24)] text-right relative max-h-[94vh] flex flex-col text-white overflow-hidden">
        {/* Lightweight ambient color, kept static enough for smooth scrolling. */}
        <div className="absolute -top-20 -right-16 w-56 h-56 bg-cyan-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-300 to-transparent opacity-80 pointer-events-none" />

        {/* Lightweight answer celebration: visual feedback only, never changes the lesson content. */}
        {feedbackBurst && (
          <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden" aria-hidden="true">
            <div
              className={`game-pop absolute left-1/2 top-20 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-black shadow-2xl animate-in zoom-in-95 fade-in duration-200 ${
                feedbackBurst === 'wrong'
                  ? 'bg-rose-500/90 text-white shadow-rose-500/30'
                  : 'bg-emerald-400/95 text-emerald-950 shadow-emerald-400/30'
              }`}
            >
              {feedbackBurst === 'wrong' ? 'حاول مرة أخرى' : feedbackBurst === 'streak' ? 'سلسلة رائعة!' : 'أحسنت!'}
            </div>
            {feedbackBurst !== 'wrong' &&
              Array.from({ length: 10 }).map((_, index) => (
                <span
                  key={`burst-${index}`}
                  className={`absolute top-24 h-3 w-1.5 rounded-full animate-bounce ${
                    index % 2 === 0 ? 'bg-amber-300' : 'bg-cyan-300'
                  }`}
                  style={{
                    left: `${12 + index * 8}%`,
                    transform: `rotate(${index * 18 - 80}deg)`,
                    animationDelay: `${index * 35}ms`,
                  }}
                />
              ))}
          </div>
        )}

        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 z-10">
          <div className="flex items-center gap-2.5">
            {/* Professional True/False Glowing Split Badge */}
            <div className="w-14 h-14 rounded-2xl p-1 bg-gradient-to-br from-emerald-400 via-cyan-300 to-rose-400 shadow-[0_0_24px_rgba(34,211,238,0.35)] shrink-0">
              <div className="w-full h-full rounded-xl bg-[#08152e] flex items-center justify-center overflow-hidden">
                <TrueFalseAuthenticIcon className="w-12 h-12" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-black text-white">تحدي صح أم خطأ</h3>
                  <span className="bg-amber-300/15 border border-amber-300/40 text-amber-200 text-[9px] font-black px-2 py-1 rounded-full shadow-[0_0_12px_rgba(251,191,36,0.12)]">
                  {totalQuestions} سؤالاً
                </span>
              </div>
              <p className="text-[10px] text-gray-400 line-clamp-1 mt-0.5">
                {config.subject} • {lessonTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-colors"
              title={soundEnabled ? 'كتم الصوت' : 'تشغيل الصوت'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-gray-400" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 z-10 custom-scrollbar overscroll-contain">
          {!isCompleted ? (
            <>
              {/* Status Bar: Progress, Points, Streak, Timer */}
              <div className="flex items-center justify-between bg-[#07142d]/90 border border-cyan-300/20 px-3 py-2.5 rounded-2xl text-xs shadow-[0_8px_24px_rgba(0,0,0,0.25)]">
                {/* Question index */}
                <div className="flex items-center gap-1.5">
                  <span className="text-cyan-400 font-black">السؤال {currentIndex + 1}</span>
                  <span className="text-gray-500 text-[11px]">من {totalQuestions}</span>
                </div>

                {/* Streak Badge */}
                {streak >= 2 && (
                  <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full text-amber-400 text-[10px] font-bold animate-pulse">
                    <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span>متتالية {streak}x!</span>
                  </div>
                )}

                {/* Score & Timer */}
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1 text-cyan-300 font-bold text-xs bg-cyan-500/10 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>{score} نقطة</span>
                  </div>

                  {/* 20s Countdown timer */}
                  <div
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-bold border transition-colors ${
                      timeLeft <= 5
                        ? 'bg-rose-500/20 border-rose-400 text-rose-300 animate-pulse'
                        : timeLeft <= 10
                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                        : 'bg-white/5 border-white/10 text-gray-300'
                    }`}
                  >
                    <Clock className="w-3 h-3" />
                    <span>{timeLeft}ث</span>
                  </div>
                </div>
              </div>

              {/* Progress Line */}
              <div className="w-full bg-[#06112a] h-3 rounded-full overflow-hidden border border-cyan-300/15 p-0.5">
                <div
                  className="bg-gradient-to-r from-emerald-400 via-cyan-300 to-blue-500 h-full rounded-full transition-[width] duration-300 shadow-[0_0_12px_rgba(34,211,238,0.55)]"
                  style={{
                    width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
                  }}
                />
              </div>

              {/* Question Card */}
              <div className="game-sheen bg-gradient-to-br from-[#18345b] via-[#102653] to-[#0a1735] border border-cyan-300/30 p-5 sm:p-6 rounded-[26px] space-y-4 relative shadow-[0_12px_30px_rgba(2,8,23,0.35)]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-cyan-100 bg-cyan-400/15 border border-cyan-300/30 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-[0_0_14px_rgba(34,211,238,0.12)]">
                    <Zap className="w-3 h-3 text-cyan-400" />
                    {currentQ.difficulty} • +{currentQ.points} نقطة
                  </span>

                  <span className="text-[10px] text-sky-100/70 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3 text-amber-300" />
                    اختر إجابة واحدة
                  </span>
                </div>

                <h4 className="text-base sm:text-lg font-black text-white leading-[2] pt-1 drop-shadow-sm">
                  <ScientificText value={currentQ.question} />
                </h4>
              </div>

              {/* Big Responsive True / False Interaction Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* 1. صح (TRUE) BUTTON */}
                <button
                  disabled={isAnswered}
                  onClick={() => handleChoice(true)}
                  className={`relative p-5 min-h-[132px] sm:min-h-[146px] rounded-3xl border-2 flex flex-col items-center justify-center gap-2.5 transition-[transform,box-shadow,background-color,border-color,opacity] duration-200 cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/40 ${
                    isAnswered
                      ? currentQ.isCorrect === true
                        ? 'bg-emerald-500/25 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)] text-emerald-200'
                        : selectedChoice === true
                        ? 'bg-rose-500/25 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)] text-rose-300 opacity-80'
                        : 'bg-white/5 border-white/10 text-gray-500 opacity-40'
                      : 'bg-gradient-to-b from-emerald-950/40 to-[#0c1c18] border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-900/30 hover:-translate-y-1 hover:scale-[1.02] text-white shadow-[0_4px_20px_rgba(16,185,129,0.15)] group'
                  }`}
                >
                  <div className="w-14 h-14 rounded-3xl bg-emerald-400/20 border border-emerald-300/50 flex items-center justify-center shadow-[0_0_18px_rgba(52,211,153,0.18)] group-hover:scale-105 transition-transform">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  </div>
                  <span className="text-base sm:text-lg font-black tracking-wide text-emerald-300">
                    صـــــح
                  </span>
                  <span className="text-[10px] text-emerald-400/80 font-bold">
                    عبارة صحيحة (True)
                  </span>
                </button>

                {/* 2. خطأ (FALSE) BUTTON */}
                <button
                  disabled={isAnswered}
                  onClick={() => handleChoice(false)}
                  className={`relative p-5 min-h-[132px] sm:min-h-[146px] rounded-3xl border-2 flex flex-col items-center justify-center gap-2.5 transition-[transform,box-shadow,background-color,border-color,opacity] duration-200 cursor-pointer active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-300/40 ${
                    isAnswered
                      ? currentQ.isCorrect === false
                        ? 'bg-emerald-500/25 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)] text-emerald-200'
                        : selectedChoice === false
                        ? 'bg-rose-500/25 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.3)] text-rose-300 opacity-80'
                        : 'bg-white/5 border-white/10 text-gray-500 opacity-40'
                      : 'bg-gradient-to-b from-rose-950/40 to-[#1c0c12] border-rose-500/40 hover:border-rose-400 hover:bg-rose-900/30 hover:-translate-y-1 hover:scale-[1.02] text-white shadow-[0_4px_20px_rgba(244,63,94,0.15)] group'
                  }`}
                >
                  <div className="w-14 h-14 rounded-3xl bg-rose-400/20 border border-rose-300/50 flex items-center justify-center shadow-[0_0_18px_rgba(251,113,133,0.18)] group-hover:scale-105 transition-transform">
                    <XCircle className="w-7 h-7 text-rose-400" />
                  </div>
                  <span className="text-base sm:text-lg font-black tracking-wide text-rose-300">
                    خـطــــأ
                  </span>
                  <span className="text-[10px] text-rose-400/80 font-bold">
                    عبارة خاطئة (False)
                  </span>
                </button>
              </div>

              {/* Immediate Feedback & Explanation Card */}
              {isAnswered && (
                <div
                  className={`game-pop p-3.5 rounded-2xl border space-y-1.5 animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                    selectedChoice === currentQ.isCorrect
                      ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                      : 'bg-rose-950/50 border-rose-500/50 text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs flex items-center gap-1.5">
                      {selectedChoice === currentQ.isCorrect ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>إجابة صحيحة! أحسنت 🎯</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4 text-rose-400" />
                          <span>إجابة غير دقيقة!</span>
                        </>
                      )}
                    </span>
                    <span className="text-[10px] font-bold opacity-80">
                      الصواب: {currentQ.isCorrect ? 'صحيحة (صح)' : 'خاطئة (خطأ)'}
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-200 leading-relaxed pt-0.5">
                      <ScientificText value={currentQ.explanation} />
                  </p>
                </div>
              )}
            </>
          ) : (
            /* Final Results Screen */
            <div className="text-center py-4 space-y-4 animate-in fade-in">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 via-emerald-400 to-blue-500 p-[2px] mx-auto shadow-[0_0_30px_rgba(6,182,212,0.4)]">
                <div className="w-full h-full rounded-full bg-[#0d1322] flex items-center justify-center text-cyan-400">
                  <Trophy className="w-10 h-10 animate-bounce text-amber-400" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">
                  {accuracy >= 80
                    ? 'ممتاز جداً! بطل التحدي 🌟'
                    : accuracy >= 50
                    ? 'أحسنت! إنجاز رائع 👍'
                    : 'محاولة جيدة، راجع الإجابات وحاول مجدداً 📚'}
                </h3>
                <p className="text-xs text-gray-400">
                  أكملت بنجاح جميع أسئلة تحدي (صح أم خطأ) لدرس: {lessonTitle}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-[#0c1220] border border-white/10 p-2.5 rounded-2xl">
                  <span className="text-[10px] text-gray-400 block">الإجابات الصحيحة</span>
                  <span className="text-base font-black text-emerald-400 mt-1 block">
                    {correctCount} / {totalQuestions}
                  </span>
                </div>
                <div className="bg-[#0c1220] border border-white/10 p-2.5 rounded-2xl">
                  <span className="text-[10px] text-gray-400 block">نسبة الدقة</span>
                  <span className="text-base font-black text-cyan-400 mt-1 block">
                    %{accuracy}
                  </span>
                </div>
                <div className="bg-[#0c1220] border border-white/10 p-2.5 rounded-2xl">
                  <span className="text-[10px] text-gray-400 block">النقاط المكتسبة</span>
                  <span className="text-base font-black text-amber-400 mt-1 block">
                    {score}
                  </span>
                </div>
              </div>

              {/* Review List of 12 Questions */}
              <div className="space-y-2 text-right max-h-48 overflow-y-auto pr-1">
                <h5 className="text-xs font-bold text-gray-300">مراجعة الأسئلة الـ 12:</h5>
                {history.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${
                      item.isCorrect
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                        : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>س {idx + 1}: <ScientificText value={item.question.question} /></span>
                      <span>{item.isCorrect ? '✓ صحيح' : '✗ خطأ'}</span>
                    </div>
                    <p className="text-[10px] text-gray-400 leading-normal">
                      💡 <ScientificText value={item.question.explanation} />
                    </p>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={resetGame}
                  className="flex-1 py-3 bg-[#172033] hover:bg-[#1f2b45] text-white font-bold rounded-2xl border border-white/10 text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>إعادة التحدي</span>
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-black font-black rounded-2xl shadow-lg text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <span>تم، العودة للدرس</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Next Button */}
        {!isCompleted && isAnswered && (
          <div className="pt-2 border-t border-white/10 z-10">
            <button
              onClick={handleNext}
              className="w-full bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 transition-all text-xs"
            >
              <span>
                {currentIndex < totalQuestions - 1 ? 'السؤال التالي (متابعة)' : 'عرض النتيجة النهائية (12 سؤالاً)'}
              </span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
