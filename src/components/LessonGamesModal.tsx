import React, { useState, useEffect } from "react";
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
  User,
  Users,
  BookOpen,
  Presentation,
} from "lucide-react";
import {
  EducationalGame,
  NotificationExamAnswer,
  OpenLessonContext,
} from "../types";
import { MillionaireGameModal } from "./MillionaireGameModal";
import { TrueFalseGameModal } from "./TrueFalseGameModal";
import { GibhaSahGameModal } from "./GibhaSahGameModal";
import { DailyExamModal } from "./DailyExamModal";
import {
  MillionaireAuthenticIcon,
  TrueFalseAuthenticIcon,
  GibhaSahAuthenticIcon,
  DailyExamAuthenticIcon,
  BookletStudyIcon,
} from "./GameIcons";
import { gameAudio } from "../utils/gameAudio";
import {
  fetchGibhaSahOnlineQuestions,
  fetchLessonGamesData,
  fetchMillionaireTeamQuestions,
  LessonGamesBundle,
} from "../services/gamesService";
import { useAppTheme } from "../services/themeService";
import { ScientificText } from "./ScientificText";
import { ClappingCelebration } from "./ClappingCelebration";
import {
  OnlineChallengeGameType,
  OnlineChallengeModal,
  OnlineChallengeQuestion,
} from "./OnlineChallengeModal";
import { LiveClassroomModal } from "./LiveClassroomModal";

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
    answers?: NotificationExamAnswer[];
  }) => void;
  playerAvatarUrl?: string;
  playerId?: string;
}

export const LessonGamesModal: React.FC<LessonGamesModalProps> = ({
  isOpen,
  onClose,
  games,
  lessonTitle,
  lessonId = "lesson-bio-ch3",
  category = "المادة التعليمية",
  openLessonContext,
  onScoreUpdate,
  onAssessmentResult,
  onDailyExamCompleted,
  playerAvatarUrl,
  playerId,
}) => {
  const { theme } = useAppTheme();
  // Mode: games, online challenges, or the teacher-led live classroom.
  const [activeGameMode, setActiveGameMode] = useState<
    | "menu"
    | "millionaire"
    | "true_false"
    | "gibha_sah"
    | "daily_exam"
    | "quick"
    | "online"
    | "live_classroom"
    | "offline_booklet"
  >("menu");
  const [onlineGameType, setOnlineGameType] =
    useState<OnlineChallengeGameType>("millionaire");
  const [liveClassroomMode, setLiveClassroomMode] = useState<
    "board" | "booklet"
  >("board");
  const [expandedMenuGame, setExpandedMenuGame] = useState<
    "millionaire" | "true_false" | "gibha_sah" | "offline_booklet" | null
  >(null);
  const [offlineBookletRole, setOfflineBookletRole] = useState<"teacher" | "student">("teacher");
  const [teamQuestions, setTeamQuestions] = useState<OnlineChallengeQuestion[]>(
    [],
  );
  const [gibhaOnlineQuestions, setGibhaOnlineQuestions] = useState<
    OnlineChallengeQuestion[]
  >([]);

  // Dynamic Supabase Games Bundle (Lazy-loaded on demand only when modal opens)
  const [gamesBundle, setGamesBundle] = useState<LessonGamesBundle | null>(
    null,
  );
  const [isLoadingBundle, setIsLoadingBundle] = useState(false);
  const [bundleLoadError, setBundleLoadError] = useState(false);
  const hasMillionaireQuestions = Boolean(
    gamesBundle?.mcqConfig.questions.length,
  );
  const hasTrueFalseQuestions = Boolean(
    gamesBundle?.trueFalseConfig.questions.length,
  );
  const hasGibhaSahCards = Boolean(gamesBundle?.gibhaSahConfig.cards.length);
  const hasDailyExam = Boolean(gamesBundle?.dailyExamAvailable);
  const canLoadGame =
    Boolean(gamesBundle) && !isLoadingBundle && !bundleLoadError;
  const hasAnyAvailableGame =
    hasMillionaireQuestions ||
    hasTrueFalseQuestions ||
    hasGibhaSahCards ||
    hasDailyExam;
  const canOpenMillionaire = canLoadGame && hasMillionaireQuestions;
  const canOpenTrueFalse = canLoadGame && hasTrueFalseQuestions;
  const canOpenGibhaSah = canLoadGame && hasGibhaSahCards;
  const canOpenDailyExam = canLoadGame && hasDailyExam;
  const subjectKey = `${openLessonContext?.subjectId || ""} ${category}`.toLowerCase();
  const isMathLesson = subjectKey.includes("math") || subjectKey.includes("رياض");
  const isPhysicsLesson = subjectKey.includes("phys") || subjectKey.includes("فيز");
  const isChemistryLesson = subjectKey.includes("chem") || subjectKey.includes("كيمي");
  // Every subject can open the booklet study room. The interactive "solve
  // with me" board keeps its existing subject restrictions.
  const supportsLiveLesson = Boolean(openLessonContext?.subjectId || category);
  const supportsSolveBoard = isMathLesson || isPhysicsLesson || isChemistryLesson;

  const lessonRewardIdentity = [
    playerId || "anonymous",
    openLessonContext?.subjectId || category,
    openLessonContext?.chapterNumber ?? "unknown-chapter",
    openLessonContext?.lessonNumber ?? "unknown-lesson",
    openLessonContext?.lessonId || lessonId,
  ]
    .map((part) => encodeURIComponent(String(part).trim().toLowerCase()))
    .join(":");

  const awardLessonReward = (
    gameType: "millionaire" | "true_false" | "gibha_sah" | "daily_exam",
    points: number,
  ) => {
    const safePoints = Math.max(0, Number(points) || 0);
    const storageKey = `nahnu_maak:reward-attempt:v2:${lessonRewardIdentity}:${gameType}`;
    let attempt = 1;
    try {
      attempt = Math.max(
        1,
        Number.parseInt(localStorage.getItem(storageKey) || "0", 10) + 1,
      );
      localStorage.setItem(storageKey, String(attempt));
    } catch (error) {
      console.debug("Unable to save reward attempt state:", error);
    }

    // The first attempt gets the earned reward; every repeat gets one quarter.
    const awardedPoints = attempt > 1 ? safePoints / 4 : safePoints;
    onScoreUpdate?.(Number.parseFloat(awardedPoints.toFixed(1)));
  };

  useEffect(() => {
    let isCancelled = false;
    if (isOpen) {
      setActiveGameMode("menu");
      setGamesBundle(null);
      setExpandedMenuGame(null);
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
            console.error("Failed to load games bundle:", err);
            if (!isCancelled) {
              setBundleLoadError(true);
              setIsLoadingBundle(false);
            }
          });
      } else {
        const subjectId = category;
        fetchLessonGamesData(subjectId, lessonId, lessonTitle, subjectId)
          .then((bundle) => {
            if (!isCancelled) {
              setGamesBundle(bundle);
              setBundleLoadError(false);
              setIsLoadingBundle(false);
            }
          })
          .catch((err) => {
            console.error("Failed to load games bundle:", err);
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
  }, [
    isOpen,
    category,
    lessonId,
    lessonTitle,
    openLessonContext?.subjectId,
    openLessonContext?.chapterNumber,
    openLessonContext?.lessonNumber,
    openLessonContext?.lessonId,
  ]);

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

  const onlineGame = ((): {
    title: string;
    questions: OnlineChallengeQuestion[];
  } => {
    if (onlineGameType === "true_false")
      return {
        title: "صواب أم خطأ",
        questions: (gamesBundle?.trueFalseConfig.questions || [])
          .slice(0, 10)
          .map((question) => ({
            question: question.question,
            options: ["صح", "خطأ"],
            correctAnswer: question.isCorrect ? 0 : 1,
          })),
      };
    if (onlineGameType === "gibha_sah") {
      return {
        title: "جبتها صح",
        questions: gibhaOnlineQuestions,
      };
    }
    const millionairePool =
      onlineGameType === "millionaire_team" && teamQuestions.length
        ? teamQuestions
        : gamesBundle?.mcqConfig.questionPool ||
          gamesBundle?.mcqConfig.questions ||
          [];
    const millionaireCount = onlineGameType === "millionaire_team" ? 20 : 11;
    const millionaireQuestions = millionairePool.length
      ? Array.from(
          { length: millionaireCount },
          (_, index) => millionairePool[index % millionairePool.length],
        )
      : [];
    return {
      title:
        onlineGameType === "millionaire_team"
          ? "من سيربح المليون — لعب فرق"
          : "من سيربح المليون",
      questions: millionaireQuestions.map((question) => ({
        question: question.question,
        options: [...question.options],
        correctAnswer: question.correctAnswer,
      })),
    };
  })();

  const openOnlineGame = async (gameType: OnlineChallengeGameType) => {
    if (gameType === "millionaire_team" && openLessonContext) {
      setIsLoadingBundle(true);
      try {
        const loaded = await fetchMillionaireTeamQuestions(
          openLessonContext,
          20,
        );
        setTeamQuestions(
          loaded.map((question) => ({
            question: question.question,
            options: [...question.options],
            correctAnswer: question.correctAnswer,
          })),
        );
      } finally {
        setIsLoadingBundle(false);
      }
    }
    if (gameType === "gibha_sah" && openLessonContext) {
      setIsLoadingBundle(true);
      try {
        const loaded = await fetchGibhaSahOnlineQuestions(
          openLessonContext,
          24,
        );
        setGibhaOnlineQuestions(loaded);
      } finally {
        setIsLoadingBundle(false);
      }
    }
    setOnlineGameType(gameType);
    gameAudio.playGameStart();
    setActiveGameMode("online");
  };

  if (activeGameMode === "online")
    return (
      <OnlineChallengeModal
        onClose={() => setActiveGameMode("menu")}
        questions={onlineGame.questions}
        lessonTitle={lessonTitle}
        gameType={onlineGameType}
        gameTitle={onlineGame.title}
        subject={openLessonContext?.subjectId || category}
        chapterNumber={openLessonContext?.chapterNumber || 1}
        lessonNumber={openLessonContext?.lessonNumber || 1}
      />
    );

  if (activeGameMode === "live_classroom")
    return (
      <LiveClassroomModal
        onClose={() => setActiveGameMode("menu")}
        lessonTitle={openLessonContext?.lessonTitle || lessonTitle}
        category={openLessonContext?.subjectId || category}
        openLessonContext={openLessonContext}
        initialContentMode={liveClassroomMode}
      />
    );

  if (activeGameMode === "offline_booklet")
    return (
      <LiveClassroomModal
        onClose={() => setActiveGameMode("menu")}
        lessonTitle={openLessonContext?.lessonTitle || lessonTitle}
        category={openLessonContext?.subjectId || category}
        openLessonContext={openLessonContext}
        initialContentMode="booklet"
        offlinePreview
        offlineRole={offlineBookletRole}
      />
    );

  // Render Millionaire Modal (MCQ)
  if (activeGameMode === "millionaire") {
    return (
      <MillionaireGameModal
        isOpen={true}
        onClose={() => setActiveGameMode("menu")}
        lessonId={openLessonContext?.lessonId || lessonId}
        lessonTitle={openLessonContext?.lessonTitle || lessonTitle}
        category={openLessonContext?.subjectId || category}
        customConfig={gamesBundle?.mcqConfig}
        onScoreUpdate={(points) => awardLessonReward("millionaire", points)}
        onAssessmentResult={onAssessmentResult}
        onOpenTeam={() => void openOnlineGame("millionaire_team")}
      />
    );
  }

  // Render True/False Modal (12 questions)
  if (activeGameMode === "true_false") {
    return (
      <TrueFalseGameModal
        isOpen={true}
        onClose={() => setActiveGameMode("menu")}
        lessonId={openLessonContext?.lessonId || lessonId}
        lessonTitle={openLessonContext?.lessonTitle || lessonTitle}
        category={openLessonContext?.subjectId || category}
        customConfig={gamesBundle?.trueFalseConfig}
        onScoreUpdate={(points) => awardLessonReward("true_false", points)}
        onAssessmentResult={onAssessmentResult}
      />
    );
  }

  // Render Gibha Sah Modal (12 cards interactive challenge)
  if (activeGameMode === "gibha_sah") {
    return (
      <GibhaSahGameModal
        isOpen={true}
        onClose={() => setActiveGameMode("menu")}
        lessonId={openLessonContext?.lessonId || lessonId}
        lessonTitle={openLessonContext?.lessonTitle || lessonTitle}
        category={openLessonContext?.subjectId || category}
        customConfig={gamesBundle?.gibhaSahConfig}
        onScoreUpdate={(points) => awardLessonReward("gibha_sah", points)}
        onAssessmentResult={onAssessmentResult}
        playerAvatarUrl={playerAvatarUrl}
      />
    );
  }

  // Render Daily Exam Modal (2 structured questions extracted from Curriculum JSON)
  if (activeGameMode === "daily_exam") {
    return (
      <DailyExamModal
        isOpen={true}
        onClose={() => setActiveGameMode("menu")}
        lessonId={openLessonContext?.lessonId || lessonId}
        lessonTitle={openLessonContext?.lessonTitle || lessonTitle}
        category={openLessonContext?.subjectId || category}
        openLessonContext={openLessonContext}
        onScoreUpdate={(points) => awardLessonReward("daily_exam", points)}
        onAssessmentResult={onAssessmentResult}
        onDailyExamCompleted={onDailyExamCompleted}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200 font-cairo select-none">
      <ClappingCelebration
        show={activeGameMode === "quick" && isCompleted}
        label="أحسنت — أكملت التحدي!"
      />
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
                <h3 className={`text-base font-bold ${theme.classes.textMain}`}>
                  ألعاب ومسابقات الدرس
                </h3>
                {activeGameMode === "quick" && (
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
              <p
                className={`text-[10px] ${theme.classes.textMuted} line-clamp-1 mt-0.5`}
              >
                الدرس: {lessonTitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (activeGameMode !== "menu") {
                setActiveGameMode("menu");
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
          {activeGameMode === "menu" && (
            <div className="space-y-3 animate-in fade-in" dir="rtl">
              {supportsLiveLesson && (
                <section className="relative overflow-hidden rounded-3xl border-2 border-cyan-300/50 bg-gradient-to-l from-cyan-950 via-blue-950 to-indigo-950 p-3 shadow-[0_0_24px_rgba(34,211,238,.18)]">
                  <span className="absolute -left-5 -top-8 h-24 w-24 rounded-full bg-cyan-400/15 blur-2xl" />
                  <div className="relative mb-3 flex items-center gap-2">
                    <span className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-300/40 bg-cyan-400/15 text-cyan-200">
                      <Users className="h-5 w-5" />
                    </span>
                    <div>
                      <b className="block text-sm text-cyan-100">
                        قسم الدرس الأونلاين
                      </b>
                      <small className="text-[10px] text-cyan-200/75">
                        {isMathLesson ? "ابدأ صبورة حل معي المباشرة" : supportsSolveBoard ? "اختر حل معي أو الملزمة" : "افتح الملزمة وادرس مع زملائك"}
                      </small>
                    </div>
                  </div>
                  <div className="relative grid grid-cols-1 gap-2">
                    {supportsSolveBoard && !isMathLesson && <button
                      type="button"
                      onClick={() => {
                        setLiveClassroomMode("board");
                        setActiveGameMode("live_classroom");
                      }}
                      disabled={!import.meta.env.VITE_ONLINE_CHALLENGE_API_URL}
                      className="flex min-h-24 items-center justify-between rounded-2xl border border-sky-300/50 bg-gradient-to-l from-sky-400/20 to-blue-950/60 p-4 text-right text-white transition active:scale-[.98] disabled:opacity-40"
                    >
                      <span><b className="block text-sm">حل معي</b><small className="mt-1 block text-[9px] text-sky-100/75">صبورة تفاعلية أونلاين</small></span>
                      <Presentation className="h-12 w-12 text-sky-200" />
                    </button>}
                    {!isMathLesson && <button
                      type="button"
                      onClick={() => {
                        setLiveClassroomMode("booklet");
                        setActiveGameMode("live_classroom");
                      }}
                      disabled={!import.meta.env.VITE_ONLINE_CHALLENGE_API_URL}
                      className="flex min-h-24 items-center justify-between rounded-2xl border border-emerald-300/50 bg-gradient-to-l from-emerald-400/20 to-teal-950/60 p-4 text-right text-white transition active:scale-[.98] disabled:opacity-40"
                    >
                      <span><b className="block text-sm">الملزمة أونلاين</b><small className="mt-1 block text-[9px] text-emerald-100/75">أنشئ غرفة وادعُ الطلاب للدراسة معًا</small></span>
                      <BookletStudyIcon className="h-16 w-20" />
                    </button>}
                    {!isMathLesson && <div className="overflow-hidden rounded-2xl border border-amber-300/35 bg-amber-400/10">
                      <button
                        type="button"
                        onClick={() => setExpandedMenuGame((current) => current === "offline_booklet" ? null : "offline_booklet")}
                        className="flex min-h-12 w-full items-center justify-center gap-2 px-4 py-2 text-xs font-black text-amber-100 transition active:scale-[.98]"
                      >
                        <BookOpen className="h-4 w-4" />
                        معاينة الملزمة الأوفلاين
                      </button>
                      {expandedMenuGame === "offline_booklet" && <div className="grid grid-cols-2 gap-2 border-t border-amber-200/20 p-2">
                        <button type="button" onClick={() => { setOfflineBookletRole("teacher"); setActiveGameMode("offline_booklet"); }} className="rounded-xl bg-amber-300 px-3 py-3 text-xs font-black text-slate-950"><Presentation className="mx-auto mb-1 h-4 w-4"/>الدخول كمدرس</button>
                        <button type="button" onClick={() => { setOfflineBookletRole("student"); setActiveGameMode("offline_booklet"); }} className="rounded-xl bg-white/10 px-3 py-3 text-xs font-black text-white"><User className="mx-auto mb-1 h-4 w-4"/>الدخول كطالب</button>
                      </div>}
                    </div>}
                  </div>
                </section>
              )}
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
                    لا توجد ألعاب أو اختبارات متاحة لهذا الدرس حاليًا. يرجى رفع
                    ملفات JSON الخاصة بالدرس أولًا.
                  </span>
                </div>
              ) : null}

              {/* Wide game artwork cards; tap the artwork to enter or reveal modes. */}
              <div className="grid grid-cols-1 gap-3 pt-1">
                {/* 1. TOP RIGHT: امتحان يومي (الأول على اليمين) */}
                <div className="bg-gradient-to-b from-[#25133d] via-[#1a0c2c] to-[#0e0719] border-2 border-purple-500/40 hover:border-purple-400 rounded-2xl p-3.5 flex flex-col items-center justify-between text-center shadow-xl relative overflow-hidden group transition-all">
                  <div className="absolute -top-8 -right-8 w-20 h-20 bg-purple-500/15 rounded-full blur-xl pointer-events-none" />

                  <button type="button" disabled={!canOpenDailyExam} onClick={() => { if (!canOpenDailyExam) return; gameAudio.playGameStart(); gameAudio.playExamSessionTheme(); setActiveGameMode("daily_exam"); }} className="flex min-h-28 w-full items-center justify-between rounded-2xl px-3 text-right transition active:scale-[.98] disabled:opacity-45">
                    <span><h4 className="text-sm font-black text-white">امتحان يومي</h4><small className="mt-1 block text-[10px] text-purple-100/75">اضغط على المجسّم للبدء</small></span>
                    <DailyExamAuthenticIcon className="w-16 h-16 transform group-hover:scale-105 transition-transform duration-300" />
                  </button>
                </div>

                  {/* 2. TOP LEFT: من سيربح المليون */}
                  <div className="bg-gradient-to-b from-[#251c14] via-[#1a140d] to-[#0e0a05] border-2 border-amber-500/40 hover:border-amber-400 rounded-2xl p-3.5 flex flex-col items-center justify-between text-center shadow-xl relative overflow-hidden group transition-all">
                    <div className="absolute -top-8 -left-8 w-20 h-20 bg-amber-500/15 rounded-full blur-xl pointer-events-none" />

                    <button type="button" disabled={!canOpenMillionaire} onClick={() => { if (!canOpenMillionaire) return; gameAudio.playGameStart(); setActiveGameMode("millionaire"); }} className="flex min-h-28 w-full items-center justify-between rounded-2xl px-3 text-right transition active:scale-[.98] disabled:opacity-45">
                      <span><h4 className="text-sm font-black text-white">من سيربح المليون</h4><small className="mt-1 block text-[10px] text-amber-100/75">اضغط على المجسّم للبدء</small></span>
                      <MillionaireAuthenticIcon className="w-16 h-16 transform group-hover:scale-105 transition-transform duration-300" />
                    </button>
                  </div>

                {/* 3. BOTTOM RIGHT: صواب أم خطأ */}
                <div className="bg-gradient-to-b from-[#0f231e] via-[#091814] to-[#040e0b] border-2 border-emerald-500/40 hover:border-emerald-400 rounded-2xl p-3.5 flex flex-col items-center justify-between text-center shadow-xl relative overflow-hidden group transition-all">
                  <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-emerald-500/15 rounded-full blur-xl pointer-events-none" />

                  <button type="button" disabled={!canOpenTrueFalse} onClick={() => setExpandedMenuGame((current) => current === "true_false" ? null : "true_false")} className="flex min-h-28 w-full items-center justify-between rounded-2xl px-3 text-right transition active:scale-[.98] disabled:opacity-45">
                    <span><h4 className="text-sm font-black text-white">صواب أم خطأ</h4><small className="mt-1 block text-[10px] text-emerald-100/75">اضغط لعرض طرق اللعب</small></span>
                    <TrueFalseAuthenticIcon className="w-16 h-16 transform group-hover:scale-105 transition-transform duration-300" />
                  </button>
                  {expandedMenuGame === "true_false" && <div className="mt-1.5 grid w-full grid-cols-2 gap-2 animate-in slide-in-from-top-2">
                    <button
                      onClick={() => {
                        if (!canOpenTrueFalse) return;
                        gameAudio.playGameStart();
                        setActiveGameMode("true_false");
                      }}
                      disabled={!canOpenTrueFalse}
                      className="min-h-14 py-2.5 px-2 bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 text-black font-black rounded-xl text-xs shadow-md flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <User className="w-4 h-4" />
                      <span>
                        {hasTrueFalseQuestions ? "لعب فردي" : "غير متوفر"}
                      </span>
                    </button>
                    <button
                      onClick={() => openOnlineGame("true_false")}
                      disabled={
                        !canOpenTrueFalse ||
                        !import.meta.env.VITE_ONLINE_CHALLENGE_API_URL
                      }
                      className="min-h-14 py-2.5 px-2 bg-gradient-to-r from-sky-600 to-blue-500 text-white font-black rounded-xl text-xs flex flex-col items-center justify-center gap-1 shadow-md shadow-sky-500/20 transition-all active:scale-95 disabled:opacity-40"
                    >
                      <Users className="w-4 h-4" />
                      <span>لعب جماعي</span>
                    </button>
                  </div>}
                </div>

                {/* 4. BOTTOM LEFT: جبتها صح */}
                <div className="bg-gradient-to-b from-[#0b2130] via-[#071622] to-[#040c14] border-2 border-cyan-400/45 hover:border-cyan-300 rounded-2xl p-3.5 flex flex-col items-center justify-between text-center shadow-xl relative overflow-hidden group transition-all">
                  <div className="absolute -bottom-8 -left-8 w-20 h-20 bg-cyan-400/15 rounded-full blur-xl pointer-events-none" />

                  <button type="button" disabled={!canOpenGibhaSah} onClick={() => setExpandedMenuGame((current) => current === "gibha_sah" ? null : "gibha_sah")} className="flex min-h-28 w-full items-center justify-between rounded-2xl px-3 text-right transition active:scale-[.98] disabled:opacity-45">
                    <span><h4 className="text-sm font-black text-white">جبتها صح</h4><small className="mt-1 block text-[10px] text-cyan-100/75">اضغط لعرض طرق اللعب</small></span>
                    <GibhaSahAuthenticIcon className="w-16 h-16 transform group-hover:scale-105 transition-transform duration-300" />
                  </button>
                  {expandedMenuGame === "gibha_sah" && <div className="mt-1.5 grid w-full grid-cols-2 gap-2 animate-in slide-in-from-top-2">
                    <button
                      onClick={() => {
                        if (!canOpenGibhaSah) return;
                        gameAudio.playGameStart();
                        setActiveGameMode("gibha_sah");
                      }}
                      disabled={!canOpenGibhaSah}
                      className="min-h-14 py-2.5 px-2 bg-gradient-to-r from-cyan-400 via-teal-300 to-cyan-400 text-black font-black rounded-xl text-xs shadow-md flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <User className="w-4 h-4" />
                      <span>{hasGibhaSahCards ? "لعب فردي" : "غير متوفر"}</span>
                    </button>
                    <button
                      onClick={() => openOnlineGame("gibha_sah")}
                      disabled={
                        !canOpenGibhaSah ||
                        !import.meta.env.VITE_ONLINE_CHALLENGE_API_URL
                      }
                      className="min-h-14 py-2.5 px-2 bg-gradient-to-r from-sky-600 to-blue-500 text-white font-black rounded-xl text-xs flex flex-col items-center justify-center gap-1 shadow-md shadow-sky-500/20 transition-all active:scale-95 disabled:opacity-40"
                    >
                      <Users className="w-4 h-4" />
                      <span>لعب جماعي</span>
                    </button>
                  </div>}
                </div>
              </div>
            </div>
          )}

          {/* QUICK PRACTICE GAME MODE (Fallback) */}
          {activeGameMode === "quick" && currentGame && (
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
                            currentGame.difficulty === "سهل"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : currentGame.difficulty === "متوسط"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : "bg-rose-500/10 text-rose-400 border-rose-500/30"
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
                        "bg-[#0D0D12]/90 border-white/10 text-gray-200 hover:border-white/30";

                      if (isAnswered) {
                        if (isCorrect) {
                          buttonStyle =
                            "bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold";
                        } else if (isSelected && !isCorrect) {
                          buttonStyle =
                            "bg-rose-500/20 border-rose-500 text-rose-300 font-bold";
                        } else {
                          buttonStyle =
                            "bg-[#0D0D12]/40 border-white/5 text-gray-500 opacity-60";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isAnswered}
                          onClick={() => handleSelectOption(idx)}
                          className={`w-full p-3.5 rounded-2xl border text-xs text-right transition-all flex items-center justify-between ${buttonStyle}`}
                        >
                          <span className="leading-relaxed">
                            <ScientificText value={option} />
                          </span>
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
                    <h3 className="text-lg font-bold text-white">
                      أحسنت! أكملت التحدي 🎉
                    </h3>
                    <p className="text-xs text-gray-400">
                      تفاعل رائع لترسيخ فهم المفاهيم التعليمية
                    </p>
                  </div>

                  <div className="bg-[#0D0D12] border border-white/5 p-4 rounded-2xl grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-[#1A1A24] p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-gray-400 block">
                        الإجابات الصحيحة
                      </span>
                      <span className="text-base font-bold text-emerald-400 mt-1 block">
                        {correctAnswersCount} / {games.length}
                      </span>
                    </div>
                    <div className="bg-[#1A1A24] p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-gray-400 block">
                        إجمالي النقاط
                      </span>
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
                      onClick={() => setActiveGameMode("menu")}
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
        {activeGameMode === "quick" && !isCompleted && isAnswered && (
          <div className="pt-3 border-t border-white/5">
            <button
              onClick={handleNextGame}
              className="w-full bg-[#00A3FF] hover:bg-[#0092E6] text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20 active:scale-95 transition-all text-xs"
            >
              <span>
                {currentIndex < games.length - 1
                  ? "السؤال التالي"
                  : "عرض النتيجة النهائية"}
              </span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
