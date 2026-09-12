import React, { useState, useEffect } from 'react';
import {
  X,
  Gamepad2,
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Flame,
  Award,
  Zap,
  Loader2,
  Database,
  FileText,
} from 'lucide-react';
import { EducationalGame, OpenLessonContext } from '../types';
import { MillionaireGameModal } from './MillionaireGameModal';
import { TrueFalseGameModal } from './TrueFalseGameModal';
import { GibhaSahGameModal } from './GibhaSahGameModal';
import { DailyExamModal } from './DailyExamModal';
import { MillionaireAuthenticIcon, TrueFalseAuthenticIcon, GibhaSahAuthenticIcon, DailyExamAuthenticIcon } from './GameIcons';
import { gameAudio } from '../utils/gameAudio';
import { fetchLessonGamesData, LessonGamesBundle } from '../services/gamesService';
import { useAppTheme } from '../services/themeService';
import { ScientificText } from './ScientificText';

interface LessonGamesModalProps {
  isOpen: boolean;
  onClose: () => void;
  games: EducationalGame[];
  lessonTitle: string;
  lessonId?: string;
  category?: string;
  openLessonContext?: OpenLessonContext | null;
  onScoreUpdate?: (points: number) => void;
  onAssessmentResult?: (correctPoints: number, totalPoints: number) => void;
  onDailyExamCompleted?: (result: {
    score: number;
    totalScore: number;
    percentage: number;
    subject: string;
    lessonTitle: string;
    completedAt: string;
  }) => void;
  playerAvatarUrl?: string;
  playerId?: string;
}

export const LessonGamesModal: React.FC<LessonGamesModalProps> = ({
  isOpen,
  onClose,
  games,
  lessonTitle,
  lessonId = 'lesson-bio-ch3',
  category = 'المادة التعليمية',
  openLessonContext,
  onScoreUpdate,
  onAssessmentResult,
  onDailyExamCompleted,
  playerAvatarUrl,
  playerId,
}) => {
  const { theme } = useAppTheme();
  // Mode: 'menu' | 'millionaire' | 'true_false' | 'gibha_sah' | 'daily_exam' | 'quick'
  const [activeGameMode, setActiveGameMode] = useState<
    'menu' | 'millionaire' | 'true_false' | 'gibha_sah' | 'daily_exam' | 'quick'
  >('menu');

  // Dynamic Supabase Games Bundle (Lazy-loaded on demand only when modal opens)
  const [gamesBundle, setGamesBundle] = useState<LessonGamesBundle | null>(null);
  const [isLoadingBundle, setIsLoadingBundle] = useState(false);
  const [bundleLoadError, setBundleLoadError] = useState(false);
  const hasMillionaireQuestions = Boolean(gamesBundle?.mcqConfig.questions.length);
  const hasTrueFalseQuestions = Boolean(gamesBundle?.trueFalseConfig.questions.length);
  const hasGibhaSahCards = Boolean(gamesBundle?.gibhaSahConfig.cards.length);
  const hasDailyExam = Boolean(gamesBundle?.dailyExamAvailable);
  const canLoadGame = Boolean(gamesBundle) && !isLoadingBundle && !bundleLoadError;
  const hasAnyAvailableGame = hasMillionaireQuestions || hasTrueFalseQuestions || hasGibhaSahCards || hasDailyExam;
  const canOpenMillionaire = canLoadGame && hasMillionaireQuestions;
  const canOpenTrueFalse = canLoadGame && hasTrueFalseQuestions;
  const canOpenGibhaSah = canLoadGame && hasGibhaSahCards;
  const canOpenDailyExam = canLoadGame && hasDailyExam;

  const lessonRewardIdentity = [
    playerId || 'anonymous',
    openLessonContext?.subjectId || category,
    openLessonContext?.chapterNumber ?? 'unknown-chapter',
    openLessonContext?.lessonNumber ?? 'unknown-lesson',
    openLessonContext?.lessonId || lessonId,
  ].map((part) => encodeURIComponent(String(part).trim().toLowerCase())).join(':');

  const awardLessonReward = (gameType: 'millionaire' | 'true_false' | 'gibha_sah' | 'daily_exam', points: number) => {
    const safePoints = Math.max(0, Number(points) || 0);
    const storageKey = `nahnu_maak:reward-attempt:v2:${lessonRewardIdentity}:${gameType}`;
    let attempt = 1;
    try {
      attempt = Math.max(1, Number.parseInt(localStorage.getItem(storageKey) || '0', 10) + 1);
      localStorage.setItem(storageKey, String(attempt));
    } catch (error) {
      console.debug('Unable to save reward attempt state:', error);
    }

    // The first attempt gets the earned reward; every repeat gets one quarter.
    const awardedPoints = attempt > 1 ? safePoints / 4 : safePoints;
    onScoreUpdate?.(Number.parseFloat(awardedPoints.toFixed(1)));
  };

  useEffect(() => {
    let isCancelled = false;
    if (isOpen) {
      setActiveGameMode('menu');
      setGamesBundle(null);
      setBundleLoadError(false);
      setIsLoadingBundle(true);
      if (openLessonContext) {
        fetchLessonGamesData(openLessonContext)
          .then((bundle) => {
            if (!isCancelled) {
              setGamesBundle(bundle);
              setBundleLoadError(false);
              setIsLoadingBundle(false);
            }
          })
          .catch((err) => {
            console.error('Failed to load games bundle:', err);
            if (!isCancelled) {
              setBundleLoadError(true);
              setIsLoadingBundle(false);
            }
          });
      } else {
        const subjectId = category;
        fetchLessonGamesData(
          subjectId,
          lessonId,
          lessonTitle,
          subjectId
        )
          .then((bundle) => {
            if (!isCancelled) {
              setGamesBundle(bundle);
              setBundleLoadError(false);
              setIsLoadingBundle(false);
            }
          })
          .catch((err) => {
            console.error('Failed to load games bundle:', err);
            if (!isCancelled) {
              setBundleLoadError(true);
              setIsLoadingBundle(false);
            }
          });
      }
    }
    return () => {
      isCancelled = true;
    };
  }, [isOpen, category, lessonId, lessonTitle, openLessonContext?.subjectId, openLessonContext?.chapterNumber, openLessonContext?.lessonNumber, openLessonContext?.lessonId]);

  // Quick game states (fallback direct quiz)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isOpen) return null;

  const currentGame = games[currentIndex];

  const handleSelectOption = (optionIndex: number) => {
    if (isAnswered) return;

    setSelectedOption(optionIndex);
    setIsAnswered(true);

    if (optionIndex === currentGame?.correctAnswer) {
      gameAudio.playMillionaireCorrect();
      setScore((prev) => prev + currentGame.points);
      setCorrectAnswersCount((prev) => prev + 1);
    } else {
      gameAudio.playMillionaireWrong();
    }
  };

  const handleNextGame = () => {
    gameAudio.playClick();
    if (currentIndex < games.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setIsCompleted(true);
      gameAudio.playVictoryFanfare();
    }
  };

  const handleRestart = () => {
    gameAudio.playClick();
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setCorrectAnswersCount(0);
    setIsCompleted(false);
  };

  const totalPointsAvailable = games.reduce((acc, g) => acc + g.points, 0);

  // Render Millionaire Modal (MCQ)
  if (activeGameMode === 'millionaire') {
    return (
      <MillionaireGameModal
        isOpen={true}
        onClose={() => setActiveGameMode('menu')}
        lessonId={openLessonContext?.lessonId || lessonId}
        lessonTitle={openLessonContext?.lessonTitle || lessonTitle}
        category={openLessonContext?.subjectId || category}
        customConfig={gamesBundle?.mcqConfig}
        onScoreUpdate={(points) => awardLessonReward('millionaire', points)}
        onAssessmentResult={onAssessmentResult}
      />
    );
  }

  // Render True/False Modal (12 questions)
  if (activeGameMode === 'true_false') {
    return (
      <TrueFalseGameModal
        isOpen={true}
        onClose={() => setActiveGameMode('menu')}
        lessonId={openLessonContext?.lessonId || lessonId}
        lessonTitle={openLessonContext?.lessonTitle || lessonTitle}
        category={openLessonContext?.subjectId || category}
        customConfig={gamesBundle?.trueFalseConfig}
        onScoreUpdate={(points) => awardLessonReward('true_false', points)}
        onAssessmentResult={onAssessmentResult}
      />
    );
  }

  // Render Gibha Sah Modal (12 cards interactive challenge)
  if (activeGameMode === 'gibha_sah') {
    return (
      <GibhaSahGameModal
        isOpen={true}
        onClose={() => setActiveGameMode('menu')}
        lessonId={openLessonContext?.lessonId || lessonId}
        lessonTitle={openLessonContext?.lessonTitle || lessonTitle}
        category={openLessonContext?.subjectId || category}
        customConfig={gamesBundle?.gibhaSahConfig}
        onScoreUpdate={(points) => awardLessonReward('gibha_sah', points)}
        onAssessmentResult={onAssessmentResult}
        playerAvatarUrl={playerAvatarUrl}
      />
    );
  }

  // Render Daily Exam Modal (2 structured questions extracted from Curriculum JSON)
  if (activeGameMode === 'daily_exam') {
    return (
      <DailyExamModal
        isOpen={true}
        onClose={() => setActiveGameMode('menu')}
        lessonId={openLessonContext?.lessonId || lessonId}
        lessonTitle={openLessonContext?.lessonTitle || lessonTitle}
        category={openLessonContext?.subjectId || category}
        openLessonContext={openLessonContext}
        onScoreUpdate={(points) => awardLessonReward('daily_exam', points)}
        onAssessmentResult={onAssessmentResult}
        onDailyExamCompleted={onDailyExamCompleted}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200 font-cairo select-none">
      <div
        className="w-full max-w-md rounded-3xl p-4 sm:p-5 shadow-2xl text-right relative max-h-[90vh] flex flex-col border-2 transition-all duration-300"
        style={{
          backgroundColor: theme.colors.bgCard,
          borderColor: `${theme.colors.primary}60`,
          boxShadow: `0 0 35px ${theme.colors.glow}`,
          color: theme.classes.textMain,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-2xl border flex items-center justify-center shrink-0"
              style={{
                backgroundColor: `${theme.colors.primary}25`,
                borderColor: theme.colors.primary,
                color: theme.colors.primary,
              }}
            >
              <Gamepad2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`text-base font-bold ${theme.classes.textMain}`}>ألعاب ومسابقات الدرس</h3>
                {activeGameMode === 'quick' && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border"
                    style={{
                      backgroundColor: `${theme.colors.primary}20`,
                      borderColor: theme.colors.primary,
                      color: theme.colors.primary,
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    {score} نقطة
                  </span>
                )}
              </div>
              <p className={`text-[10px] ${theme.classes.textMuted} line-clamp-1 mt-0.5`}>
                الدرس: {lessonTitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (activeGameMode !== 'menu') {
                setActiveGameMode('menu');
              } else {
                onClose();
              }
            }}
            className={`p-1.5 rounded-full ${theme.classes.cardSubtleBg} text-gray-300 hover:text-white border ${theme.classes.cardBorder} transition-colors cursor-pointer`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-3">
          {/* MENU MODE */}
          {activeGameMode === 'menu' && (
            <div className="space-y-3 animate-in fade-in" dir="rtl">
              {isLoadingBundle ? (
                <div className="flex items-center gap-2.5 bg-sky-500/10 border border-sky-500/30 px-3.5 py-2 rounded-xl text-xs text-sky-300 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-sky-400 shrink-0" />
                  <span className="font-semibold text-[11px]">
                    جاري جلب أسئلة واختبارات هذا الدرس...
                  </span>
                </div>
              ) : bundleLoadError ? (
                <div className="flex items-center gap-2.5 bg-rose-500/10 border border-rose-500/30 px-3.5 py-2 rounded-xl text-xs text-rose-200">
                  <XCircle className="w-4 h-4 text-rose-300 shrink-0" />
                  <span className="font-semibold text-[11px]">
                    تعذر تحميل ألعاب هذا الدرس. أغلق النافذة وافتحها مرة أخرى.
                  </span>
                </div>
              ) : gamesBundle && !hasAnyAvailableGame ? (
                <div className="flex items-center gap-2.5 bg-amber-500/10 border border-amber-500/30 px-3.5 py-3 rounded-xl text-xs text-amber-100">
                  <FileText className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="font-semibold text-[11px] leading-6">
                    لا توجد ألعاب أو اختبارات متاحة لهذا الدرس حاليًا. يرجى رفع ملفات JSON الخاصة بالدرس أولًا.
                  </span>
                </div>
              ) : null}

              {/* 2x2 Grid (4 Quadrants / Square Sides) */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* 1. TOP RIGHT: امتحان يومي (الأول على اليمين) */}
                <div className="bg-gradient-to-b from-[#25133d] via-[#1a0c2c] to-[#0e0719] border-2 border-purple-500/40 hover:border-purple-400 rounded-2xl p-3.5 flex flex-col items-center justify-between text-center shadow-xl relative overflow-hidden group transition-all">
                  <div className="absolute -top-8 -right-8 w-20 h-20 bg-purple-500/15 rounded-full blur-xl pointer-events-none" />
                  
                  <div className="flex flex-col items-center">
                    <DailyExamAuthenticIcon className="w-16 h-16 transform group-hover:scale-105 transition-transform duration-300" />
                    <h4 className="text-xs sm:text-sm font-black text-white mt-2">
                      امتحان يومي
                    </h4>
                  </div>

                  <button
                    onClick={() => {
                      if (!canOpenDailyExam) return;
                      gameAudio.playGameStart();
                      setActiveGameMode('daily_exam');
                    }}
                    disabled={!canOpenDailyExam}
                    className="w-full mt-3 py-2 px-2.5 bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-500 hover:from-purple-400 hover:to-indigo-400 text-white font-bold rounded-xl text-xs shadow-md shadow-purple-600/25 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>{hasDailyExam ? 'ابدأ الآن' : 'غير متوفر'}</span>
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>

                {/* 2. TOP LEFT: من سيربح المليون */}
                <div className="bg-gradient-to-b from-[#251c14] via-[#1a140d] to-[#0e0a05] border-2 border-amber-500/40 hover:border-amber-400 rounded-2xl p-3.5 flex flex-col items-center justify-between text-center shadow-xl relative overflow-hidden group transition-all">
                  <div className="absolute -top-8 -left-8 w-20 h-20 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />

                  <div className="flex flex-col items-center">
                    <MillionaireAuthenticIcon className="w-16 h-16 transform group-hover:scale-105 transition-transform duration-300" />
                    <h4 className="text-xs sm:text-sm font-black text-white mt-2">
                      من سيربح المليون
                    </h4>
                  </div>

                  <button
                    onClick={() => {
                      if (!canOpenMillionaire) return;
                      gameAudio.playGameStart();
                      setActiveGameMode('millionaire');
                    }}
                    disabled={!canOpenMillionaire}
                    className="w-full mt-3 py-2 px-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black rounded-xl text-xs shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>{hasMillionaireQuestions ? 'ابدأ الآن' : 'غير متوفر'}</span>
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>

                {/* 3. BOTTOM RIGHT: صواب أم خطأ */}
                <div className="bg-gradient-to-b from-[#0f231e] via-[#091814] to-[#040e0b] border-2 border-emerald-500/40 hover:border-emerald-400 rounded-2xl p-3.5 flex flex-col items-center justify-between text-center shadow-xl relative overflow-hidden group transition-all">
                  <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-emerald-500/15 rounded-full blur-xl pointer-events-none" />

                  <div className="flex flex-col items-center">
                    <TrueFalseAuthenticIcon className="w-16 h-16 transform group-hover:scale-105 transition-transform duration-300" />
                    <h4 className="text-xs sm:text-sm font-black text-white mt-2">
                      صواب أم خطأ
                    </h4>
                  </div>

                  <button
                    onClick={() => {
                      if (!canOpenTrueFalse) return;
                      gameAudio.playGameStart();
                      setActiveGameMode('true_false');
                    }}
                    disabled={!canOpenTrueFalse}
                    className="w-full mt-3 py-2 px-2.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black rounded-xl text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>{hasTrueFalseQuestions ? 'ابدأ الآن' : 'غير متوفر'}</span>
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>

                {/* 4. BOTTOM LEFT: جبتها صح */}
                <div className="bg-gradient-to-b from-[#0b2130] via-[#071622] to-[#040c14] border-2 border-cyan-400/45 hover:border-cyan-300 rounded-2xl p-3.5 flex flex-col items-center justify-between text-center shadow-xl relative overflow-hidden group transition-all">
                  <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-cyan-400/15 rounded-full blur-xl pointer-events-none" />

                  <div className="flex flex-col items-center">
                    <GibhaSahAuthenticIcon className="w-16 h-16 transform group-hover:scale-105 transition-transform duration-300" />
                    <h4 className="text-xs sm:text-sm font-black text-white mt-2">
                      جبتها صح 🎯
                    </h4>
                  </div>

                  <button
                    onClick={() => {
                      if (!canOpenGibhaSah) return;
                      gameAudio.playGameStart();
                      setActiveGameMode('gibha_sah');
                    }}
                    disabled={!canOpenGibhaSah}
                    className="w-full mt-3 py-2 px-2.5 bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 hover:from-cyan-300 hover:to-teal-200 text-black font-black rounded-xl text-xs shadow-md shadow-cyan-500/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span>{hasGibhaSahCards ? 'ابدأ الآن' : 'غير متوفر'}</span>
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* QUICK PRACTICE GAME MODE (Fallback) */}
          {activeGameMode === 'quick' && currentGame && (
            <>
              {!isCompleted ? (
                <div className="space-y-4">
                  {/* Game Progress Bar & Badges */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400">
                      <span>
                        السؤال {currentIndex + 1} من {games.length}
                      </span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                            currentGame.difficulty === 'سهل'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : currentGame.difficulty === 'متوسط'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {currentGame.difficulty}
                        </span>
                        <span className="text-[#00A3FF] font-bold">
                          +{currentGame.points} نقطة
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-[#0D0D12] h-2 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="bg-gradient-to-r from-[#00A3FF] to-sky-400 h-full transition-all duration-300"
                        style={{
                          width: `${((currentIndex + 1) / games.length) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Game Title & Question Card */}
                  <div className="bg-[#0D0D12]/80 border border-white/5 p-4 rounded-2xl space-y-2">
                    <span className="text-[10px] font-bold text-[#00A3FF] bg-[#00A3FF]/10 px-2 py-0.5 rounded-md inline-block">
                      {currentGame.title}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-white leading-relaxed">
                      <ScientificText value={currentGame.question} />
                    </h4>
                  </div>

                  {/* Options */}
                  <div className="grid gap-2">
                    {currentGame.options.map((option, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = idx === currentGame.correctAnswer;

                      let buttonStyle =
                        'bg-[#0D0D12]/90 border-white/10 text-gray-200 hover:border-white/30';

                      if (isAnswered) {
                        if (isCorrect) {
                          buttonStyle =
                            'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold';
                        } else if (isSelected && !isCorrect) {
                          buttonStyle =
                            'bg-rose-500/20 border-rose-500 text-rose-300 font-bold';
                        } else {
                          buttonStyle = 'bg-[#0D0D12]/40 border-white/5 text-gray-500 opacity-60';
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isAnswered}
                          onClick={() => handleSelectOption(idx)}
                          className={`w-full p-3.5 rounded-2xl border text-xs text-right transition-all flex items-center justify-between ${buttonStyle}`}
                        >
                          <span className="leading-relaxed"><ScientificText value={option} /></span>
                          {isAnswered && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mr-2" />
                          )}
                          {isAnswered && isSelected && !isCorrect && (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0 mr-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Explanation */}
                  {isAnswered && currentGame.explanation && (
                    <div className="bg-[#1E1E2C] border border-[#00A3FF]/30 p-3.5 rounded-2xl space-y-1 text-xs animate-in fade-in">
                      <span className="font-bold text-[#00A3FF] flex items-center gap-1.5 text-[11px]">
                        <HelpCircle className="w-3.5 h-3.5" />
                        الشرح والتوضيح:
                      </span>
                      <p className="text-gray-300 leading-relaxed text-[11px]">
                        <ScientificText value={currentGame.explanation} />
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Results Screen */
                <div className="text-center py-6 space-y-4 animate-in fade-in">
                  <div className="w-20 h-20 rounded-full bg-[#00A3FF]/10 border-2 border-[#00A3FF] flex items-center justify-center text-[#00A3FF] mx-auto shadow-xl shadow-sky-500/20">
                    <Trophy className="w-10 h-10 animate-bounce" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-white">أحسنت! أكملت التحدي 🎉</h3>
                    <p className="text-xs text-gray-400">تفاعل رائع لترسيخ فهم المفاهيم التعليمية</p>
                  </div>

                  <div className="bg-[#0D0D12] border border-white/5 p-4 rounded-2xl grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#1A1A24] p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-gray-400 block">الإجابات الصحيحة</span>
                      <span className="text-base font-bold text-emerald-400 mt-1 block">
                        {correctAnswersCount} / {games.length}
                      </span>
                    </div>
                    <div className="bg-[#1A1A24] p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-gray-400 block">إجمالي النقاط</span>
                      <span className="text-base font-bold text-[#00A3FF] mt-1 block">
                        {score} / {totalPointsAvailable}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={handleRestart}
                      className="flex-1 py-3 bg-[#1E1E2C] hover:bg-white/10 text-white font-bold rounded-2xl border border-white/10 text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>إعادة التحدي</span>
                    </button>
                    <button
                      onClick={() => setActiveGameMode('menu')}
                      className="flex-1 py-3 bg-[#00A3FF] hover:bg-[#0092E6] text-white font-bold rounded-2xl shadow-lg shadow-sky-500/20 text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <span>قائمة الألعاب</span>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Next Button for Quick Practice */}
        {activeGameMode === 'quick' && !isCompleted && isAnswered && (
          <div className="pt-3 border-t border-white/5">
            <button
              onClick={handleNextGame}
              className="w-full bg-[#00A3FF] hover:bg-[#0092E6] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95 transition-all text-xs"
            >
              <span>
                {currentIndex < games.length - 1 ? 'السؤال التالي' : 'عرض النتيجة النهائية'}
              </span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
