import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Crown,
  PartyPopper,
  Sparkle,
  Edit2,
  Check,
  User,
  Shuffle,
  FastForward,
  HelpCircle
} from 'lucide-react';
import {
  GibhaSahGameConfig,
  GibhaSahQuestion,
  GibhaSahCard,
  getGibhaSahGameForLesson,
} from '../data/mockGibhaSah';
import { gameAudio } from '../utils/gameAudio';
import { getImageChoiceReward } from '../services/pointsService';
import { ScientificText } from './ScientificText';

interface GibhaSahGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  lessonTitle: string;
  category?: string;
  onScoreUpdate?: (points: number) => void;
  onAssessmentResult?: (correctPoints: number, totalPoints: number) => void;
  playerAvatarUrl?: string;
  customConfig?: GibhaSahGameConfig;
}

// Utility to shuffle an array (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildGibhaRound(source: GibhaSahGameConfig): GibhaSahGameConfig {
  const rawPool = source.questionPool?.length ? source.questionPool : source.questions;
  const pool = Array.from(new Map(rawPool.map((question) => [question.question.trim(), question])).values());
  if (pool.length === 0) return source;
  const target = 10;
  const selected = pool.length > target
    ? shuffleArray(pool).slice(0, target)
    : Array.from({ length: target }, (_, idx) => pool[idx % pool.length]);
  const cards: GibhaSahCard[] = selected.map((question, idx) => ({
    id: idx + 1,
    number: idx + 1,
    label: question.answerLabel || source.cards.find((card) => card.number === question.correctCardNumber)?.label || '',
    sublabel: `المصطلح رقم ${idx + 1}`,
    badge: 'بطاقة علمية',
  }));
  const questions: GibhaSahQuestion[] = selected.map((question, idx) => ({
    ...question,
    id: `${question.id}-round-${idx + 1}`,
    questionNumber: idx + 1,
    correctCardNumber: idx + 1,
    explanation: `الإجابة الصحيحة هي بطاقة (${idx + 1}): ${cards[idx]?.label || question.answerLabel || ''}`,
  }));
  return { ...source, mode: 'cards_10', cards, questions };
}

export const GibhaSahGameModal: React.FC<GibhaSahGameModalProps> = ({
  isOpen,
  onClose,
  lessonId,
  lessonTitle,
  category = 'المادة التعليمية',
  onScoreUpdate,
  onAssessmentResult,
  playerAvatarUrl,
  customConfig,
}) => {
  const [config, setConfig] = useState<GibhaSahGameConfig>(() =>
    customConfig || getGibhaSahGameForLesson(lessonId, lessonTitle, category)
  );

  // Player Names (Default: المستخدم 1 و المستخدم 2)
  const [user1Name, setUser1Name] = useState<string>('المستخدم 1');
  const [user2Name, setUser2Name] = useState<string>('المستخدم 2');
  const [editingPlayer, setEditingPlayer] = useState<'user1' | 'user2' | null>(null);
  const [tempPlayerName, setTempPlayerName] = useState<string>('');

  // Game Settings & State
  const [gameMode, setGameMode] = useState<'teams' | 'solo'>('teams');
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);

  // Shuffled Questions list to guarantee non-sequential, randomized question delivery
  const [shuffledQuestions, setShuffledQuestions] = useState<GibhaSahQuestion[]>([]);

  // Track eliminated/solved card numbers
  const [solvedCardNumbers, setSolvedCardNumbers] = useState<number[]>([]);

  // Turn status: 'idle' | 'correct' | 'wrong'
  const [feedbackStatus, setFeedbackStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [celebrationBurst, setCelebrationBurst] = useState<'correct' | 'combo' | 'wrong' | null>(null);

  // Scores
  const [team1Score, setTeam1Score] = useState(0);
  const [team2Score, setTeam2Score] = useState(0);
  const [activeTurn, setActiveTurn] = useState<'user1' | 'user2'>('user1');
  const [soloScore, setSoloScore] = useState(0);

  // Timer
  const [timeLeft, setTimeLeft] = useState(25);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFinished, setIsFinished] = useState(false);

  // Solved History log
  const [history, setHistory] = useState<
    {
      question: GibhaSahQuestion;
      winningUser: string;
      cardNumber: number;
    }[]
  >([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const rewardIssuedRef = useRef(false);

  // Initialize or re-sync config & shuffle questions
  useEffect(() => {
    const loaded = customConfig || getGibhaSahGameForLesson(lessonId, lessonTitle, category);
    const round = buildGibhaRound(loaded);
    setConfig(round);
    handleRestartInternal(round.questions);
  }, [isOpen, customConfig, lessonId, lessonTitle, category]);

  // Play the supplied 24-second game bed while the game is open.
  useEffect(() => {
    if (isOpen && soundEnabled) gameAudio.playGameSessionTheme();
    else gameAudio.stopGameSessionTheme();
    return () => gameAudio.stopGameSessionTheme();
  }, [isOpen, soundEnabled]);

  // Remaining questions filtered by unsolved card numbers
  const remainingQuestions = shuffledQuestions.filter(
    (q) => !solvedCardNumbers.includes(q.correctCardNumber)
  );

  const currentQ: GibhaSahQuestion | undefined = remainingQuestions[0];
  const totalCardsCount = config.cards.length; // 10
  const remainingCardsCount = totalCardsCount - solvedCardNumbers.length; // 10 -> 9 -> 8 ... -> 0

  // Filter only active, non-solved cards so their boxes completely disappear from the DOM
  const activeCards = config.cards.filter((card) => !solvedCardNumbers.includes(card.number));

  // Check victory / finish condition
  useEffect(() => {
    if (solvedCardNumbers.length === totalCardsCount && totalCardsCount > 0) {
      setIsFinished(true);
      if (soundEnabled) gameAudio.playVictoryFanfare();
      if (!rewardIssuedRef.current) {
        rewardIssuedRef.current = true;
        onScoreUpdate?.(getImageChoiceReward(totalCardsCount, totalCardsCount));
      }
    }
  }, [solvedCardNumbers.length, totalCardsCount, soundEnabled]);

  // Rotate current question to the end of the series so next question appears immediately
  const rotateCurrentQuestionToBack = () => {
    if (!currentQ) return;
    setShuffledQuestions((prev) => {
      const idx = prev.findIndex((q) => q.id === currentQ.id);
      if (idx === -1) return prev;
      const item = prev[idx];
      return [...prev.slice(0, idx), ...prev.slice(idx + 1), item];
    });
  };

  // Sound FX helper
  const playAudio = (type: 'correct' | 'wrong' | 'click' | 'win' | 'select' | 'pass' | 'turn' | 'combo') => {
    if (!soundEnabled) return;
    switch (type) {
      case 'correct':
        gameAudio.playCardSolved();
        break;
      case 'wrong':
        gameAudio.playGibhaWrong();
        break;
      case 'select':
        gameAudio.playCardSelect();
        break;
      case 'pass':
        gameAudio.playQuestionPass();
        break;
      case 'turn':
        gameAudio.playTurnSwitch();
        break;
      case 'combo':
        gameAudio.playCardCombo();
        break;
      case 'win':
        gameAudio.playVictoryFanfare();
        break;
      case 'click':
      default:
        gameAudio.playClick();
        break;
    }
  };

  // Timer effect
  useEffect(() => {
    if (!isOpen || isFinished || !isTimerRunning || feedbackStatus !== 'idle' || remainingQuestions.length === 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeOut();
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
  }, [isOpen, isFinished, isTimerRunning, feedbackStatus, activeTurn, remainingQuestions.length, soundEnabled]);

  // Handle timeout -> moves question to end of queue so next question comes up!
  const handleTimeOut = () => {
    playAudio('wrong');
    if (soundEnabled) gameAudio.playGameLoss();
    setFeedbackStatus('wrong');
    const currentUser = activeTurn === 'user1' ? user1Name : user2Name;
    setFeedbackMessage(
      gameMode === 'teams'
        ? `انتهى الوقت المحدد لـ (${currentUser})! تم نقل السؤال لآخر السلسلة.`
        : 'انتهى الوقت! تم نقل السؤال لآخر السلسلة.'
    );

    // Switch turn, rotate question to back and reset timer
    setTimeout(() => {
      rotateCurrentQuestionToBack();
      setFeedbackStatus('idle');
      setFeedbackMessage('');
      setSelectedCardId(null);
      setTimeLeft(25);
      if (gameMode === 'teams') {
        playAudio('turn');
        setActiveTurn((prev) => (prev === 'user1' ? 'user2' : 'user1'));
      }
    }, 1500);
  };

  if (!isOpen) return null;

  if (config.questions.length === 0 || config.cards.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 font-cairo">
        <div className="w-full max-w-sm rounded-3xl border border-amber-400/40 bg-[#08152e] p-6 text-center text-white shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/40 bg-amber-400/10 text-amber-300">
            <HelpCircle className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-black">لا تتوفر بطاقات كافية لهذا الدرس حاليًا</h2>
          <p className="mt-2 text-sm leading-7 text-slate-300">لم يتم العثور على بنك بطاقات PH صالح للدرس المفتوح أو ملف قريب مناسب داخل الفصل نفسه.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-300 px-4 py-3 font-black text-slate-950 transition-transform active:scale-95"
          >
            حسنًا
          </button>
        </div>
      </div>
    );
  }

  // Handle clicking a card in the active grid
  const handleCardClick = (cardNum: number) => {
    if (solvedCardNumbers.includes(cardNum) || feedbackStatus !== 'idle') return;
    playAudio('select');
    setSelectedCardId(cardNum);
    if (soundEnabled) gameAudio.playRadarSonar();
  };

  // Manual Skip question to back of queue
  const handleSkipQuestion = () => {
    if (!currentQ || feedbackStatus !== 'idle') return;
    playAudio('pass');
    rotateCurrentQuestionToBack();
    setSelectedCardId(null);
    setTimeLeft(25);
    if (gameMode === 'teams') {
      playAudio('turn');
      setActiveTurn((prev) => (prev === 'user1' ? 'user2' : 'user1'));
    }
  };

  // Execute answer confirmation
  const handleConfirmAnswer = () => {
    if (selectedCardId === null || !currentQ || feedbackStatus !== 'idle') return;

    const isCorrect = selectedCardId === currentQ.correctCardNumber;
    onAssessmentResult?.(isCorrect ? 1 : 0, 1);
    const currentUser = activeTurn === 'user1' ? user1Name : user2Name;

    if (isCorrect) {
      // CORRECT ANSWER:
      const solvedCountAfterAnswer = solvedCardNumbers.length + 1;
      const isCombo = solvedCountAfterAnswer % 3 === 0;
      setCelebrationBurst(isCombo ? 'combo' : 'correct');
      window.setTimeout(() => setCelebrationBurst(null), isCombo ? 900 : 650);
      playAudio('correct');
      if (isCombo) playAudio('combo');
      setFeedbackStatus('correct');
      setFeedbackMessage(
        gameMode === 'teams'
          ? `إجابة صحيحة! أحسنت يا (${currentUser}) (+${currentQ.points} نقطة)`
          : `إجابة صحيحة وممتازة! (+${currentQ.points} نقطة)`
      );

      // Add score
      if (gameMode === 'teams') {
        if (activeTurn === 'user1') {
          setTeam1Score((prev) => prev + currentQ.points);
        } else {
          setTeam2Score((prev) => prev + currentQ.points);
        }
      } else {
        setSoloScore((prev) => prev + currentQ.points);
      }
      // Platform reward is calculated once when the attempt ends.

      // Record in history
      setHistory((prev) => [
        ...prev,
        {
          question: currentQ,
          winningUser: gameMode === 'teams' ? currentUser : 'المستخدم',
          cardNumber: selectedCardId,
        },
      ]);

      // Remove card from board completely to free up space (10 -> 9 -> 8 ...)
      setTimeout(() => {
        setSolvedCardNumbers((prev) => [...prev, selectedCardId]);
        setSelectedCardId(null);
        setFeedbackStatus('idle');
        setFeedbackMessage('');
        setTimeLeft(25);
        if (gameMode === 'teams') {
          setActiveTurn((prev) => (prev === 'user1' ? 'user2' : 'user1'));
        }
      }, 1200);
    } else {
      // WRONG ANSWER:
      // Informs user it's wrong, does NOT reveal solution, and pushes question to back of queue!
      setCelebrationBurst('wrong');
      window.setTimeout(() => setCelebrationBurst(null), 650);
      playAudio('wrong');
      if (soundEnabled) gameAudio.playGameLoss();
    if (soundEnabled) gameAudio.playGameLoss();
      setFeedbackStatus('wrong');
      setFeedbackMessage('إجابة خاطئة! تم نقل السؤال لآخر السلسلة والانتقال للسؤال التالي.');

      // Clear selection, rotate question to back of list, switch turn
      setTimeout(() => {
        rotateCurrentQuestionToBack();
        setSelectedCardId(null);
        setFeedbackStatus('idle');
        setFeedbackMessage('');
        setTimeLeft(25);
        if (gameMode === 'teams') {
          setActiveTurn((prev) => (prev === 'user1' ? 'user2' : 'user1'));
        }
      }, 1500);
    }
  };

  // Referee Scoring Actions (Manual Referee buttons for live games)
  const handleJudgeAnswer = (isCorrect: boolean) => {
    if (!currentQ || feedbackStatus !== 'idle') return;

    const currentUser = activeTurn === 'user1' ? user1Name : user2Name;
    onAssessmentResult?.(isCorrect ? 1 : 0, 1);

    if (isCorrect) {
      playAudio('correct');
      setFeedbackStatus('correct');
      setFeedbackMessage(
        gameMode === 'teams'
          ? `تم احتساب إجابة صحيحة لـ (${currentUser})!`
          : 'تم احتساب إجابة صحيحة!'
      );

      if (gameMode === 'teams') {
        if (activeTurn === 'user1') {
          setTeam1Score((prev) => prev + currentQ.points);
        } else {
          setTeam2Score((prev) => prev + currentQ.points);
        }
      } else {
        setSoloScore((prev) => prev + currentQ.points);
      }
      setHistory((prev) => [
        ...prev,
        {
          question: currentQ,
          winningUser: gameMode === 'teams' ? currentUser : 'المستخدم',
          cardNumber: currentQ.correctCardNumber,
        },
      ]);

      setTimeout(() => {
        setSolvedCardNumbers((prev) => [...prev, currentQ.correctCardNumber]);
        setSelectedCardId(null);
        setFeedbackStatus('idle');
        setFeedbackMessage('');
        setTimeLeft(25);
        if (gameMode === 'teams') {
          setActiveTurn((prev) => (prev === 'user1' ? 'user2' : 'user1'));
        }
      }, 1200);
    } else {
      playAudio('wrong');
      if (soundEnabled) gameAudio.playGameLoss();
    if (soundEnabled) gameAudio.playGameLoss();
      setFeedbackStatus('wrong');
      setFeedbackMessage('تم احتساب إجابة خاطئة! تم نقل السؤال لآخر السلسلة.');

      setTimeout(() => {
        rotateCurrentQuestionToBack();
        setSelectedCardId(null);
        setFeedbackStatus('idle');
        setFeedbackMessage('');
        setTimeLeft(25);
        if (gameMode === 'teams') {
          setActiveTurn((prev) => (prev === 'user1' ? 'user2' : 'user1'));
        }
      }, 1400);
    }
  };

  const handleCloseGame = () => {
    if (!rewardIssuedRef.current) {
      rewardIssuedRef.current = true;
      onScoreUpdate?.(getImageChoiceReward(solvedCardNumbers.length, totalCardsCount));
    }
    onClose();
  };

  // Internal restart helper with shuffled questions
  const handleRestartInternal = (qs: GibhaSahQuestion[]) => {
    rewardIssuedRef.current = false;
    setShuffledQuestions(shuffleArray(qs));
    setSolvedCardNumbers([]);
    setSelectedCardId(null);
    setFeedbackStatus('idle');
    setFeedbackMessage('');
    setTeam1Score(0);
    setTeam2Score(0);
    setSoloScore(0);
    setActiveTurn('user1');
    setTimeLeft(25);
    setIsFinished(false);
    setCelebrationBurst(null);
    setHistory([]);
  };

  // Restart full game with new random shuffle
  const handleRestart = () => {
    const round = buildGibhaRound(config);
    setConfig(round);
    handleRestartInternal(round.questions);
  };

  // Start editing player name
  const handleStartEditName = (player: 'user1' | 'user2') => {
    setEditingPlayer(player);
    setTempPlayerName(player === 'user1' ? user1Name : user2Name);
  };

  // Save edited player name
  const handleSavePlayerName = () => {
    if (!tempPlayerName.trim()) {
      setEditingPlayer(null);
      return;
    }
    if (editingPlayer === 'user1') {
      setUser1Name(tempPlayerName.trim());
    } else if (editingPlayer === 'user2') {
      setUser2Name(tempPlayerName.trim());
    }
    setEditingPlayer(null);
  };

  return (
    <div
      id="gibha-sah-modal-root"
      className="fixed inset-0 z-50 bg-[#020617]/95 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 font-cairo select-none overscroll-contain"
    >
      <div
        id="gibha-sah-container"
        className="bg-gradient-to-b from-[#102b58] via-[#081a3b] to-[#040b20] border-2 border-cyan-300/30 w-full max-w-xl sm:max-w-2xl rounded-[32px] shadow-[0_0_80px_rgba(14,165,233,0.25)] text-right relative max-h-[96vh] flex flex-col text-white overflow-hidden"
      >
        {/* Futuristic Background Ambient Glows & Grid Pattern */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />

        {/* Playful success overlay: feedback only, with no effect on the question data. */}
        {celebrationBurst && (
          <div className="absolute inset-0 z-30 pointer-events-none overflow-hidden" aria-hidden="true">
            <div
              className={`absolute left-1/2 top-24 -translate-x-1/2 rounded-full px-4 py-2 text-xs sm:text-sm font-black shadow-2xl animate-in zoom-in-95 fade-in duration-200 ${
                celebrationBurst === 'wrong'
                  ? 'bg-rose-500/90 text-white shadow-rose-500/30'
                  : celebrationBurst === 'combo'
                  ? 'bg-amber-300/95 text-amber-950 shadow-amber-300/40'
                  : 'bg-emerald-400/95 text-emerald-950 shadow-emerald-400/30'
              }`}
            >
              {celebrationBurst === 'wrong' ? 'جرّب البطاقة التالية' : celebrationBurst === 'combo' ? 'سلسلة ثلاثية!' : 'بطاقة صحيحة!'}
            </div>
            {celebrationBurst !== 'wrong' &&
              Array.from({ length: 12 }).map((_, index) => (
                <span
                  key={`card-burst-${index}`}
                  className={`absolute top-28 h-3 w-1.5 rounded-full animate-bounce ${
                    index % 3 === 0 ? 'bg-amber-300' : index % 3 === 1 ? 'bg-cyan-300' : 'bg-emerald-300'
                  }`}
                  style={{
                    left: `${8 + index * 7.5}%`,
                    transform: `rotate(${index * 15 - 85}deg)`,
                    animationDelay: `${index * 30}ms`,
                  }}
                />
              ))}
          </div>
        )}
        <div 
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(#00ffff 1px, transparent 1px), linear-gradient(90deg, #00ffff 1px, transparent 1px)`,
            backgroundSize: '32px 32px'
          }}
        />

        {/* 1. Compact Header: player avatar and essential controls only */}
        <div
          id="gibha-sah-header"
          className="relative z-20 px-4 py-3 rounded-t-[30px] border-b-2 border-cyan-300/30 shadow-lg flex items-center justify-between overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #12356d 0%, #0b1f4b 52%, #071532 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.16), 0 8px 22px rgba(2,8,23,0.45)'
          }}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-300 via-cyan-300 to-amber-300 opacity-90 pointer-events-none" />

          {/* Essential controls: no sound toggle; close is deliberately large for touch. */}
          <div className="flex items-center gap-2 relative z-10">
            <button
              id="btn-close-gibha-sah"
              onClick={handleCloseGame}
              className="w-12 h-12 rounded-full bg-gradient-to-b from-[#3b5264] to-[#172532] border-2 border-slate-300/60 text-slate-100 hover:text-rose-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_4px_10px_rgba(0,0,0,0.45)] flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
              title="إغلاق اللعبة"
              aria-label="إغلاق اللعبة"
            >
              <X className="w-6 h-6" strokeWidth={2.5} />
            </button>
            <button
              id="btn-restart-game"
              onClick={handleRestart}
              className="w-10 h-10 rounded-full bg-gradient-to-b from-[#324554] to-[#1a2630] border border-slate-400/50 text-slate-200 hover:text-cyan-300 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),0_2px_4px_rgba(0,0,0,0.4)] flex items-center justify-center transition-transform active:scale-95 cursor-pointer"
              title="إعادة خلط وتجديد التحدي"
              aria-label="إعادة خلط وتجديد التحدي"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* The selected profile avatar replaces the old teacher name and game emblem. */}
          <div className="relative z-10 flex items-center gap-2.5">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border-2 border-cyan-300/70 bg-[#162738] shadow-[0_0_16px_rgba(34,211,238,0.28)]">
              {playerAvatarUrl ? (
                <img src={playerAvatarUrl} alt="صورة اللاعب" width={48} height={48} className="h-full w-full object-cover" />
              ) : (
                <User className="h-6 w-6 text-cyan-200" aria-hidden="true" />
              )}
            </div>
            <span className="hidden text-[10px] font-black text-cyan-100/80 sm:inline">اللاعب</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 space-y-3 z-10 custom-scrollbar overscroll-contain">
          {!isFinished ? (
            <>
              {/* 2. HUD / Players Pods & Timer (Matching Screenshot) */}
              <div id="hud-players-row" className="grid grid-cols-12 gap-2 sm:gap-3 items-center">
                {/* Left Card: User 2 (or second player) */}
                <div
                  id="user2-hud-card"
                  onClick={() => {
                    if (gameMode === 'teams' && feedbackStatus === 'idle') setActiveTurn('user2');
                  }}
                  className={`col-span-5 sm:col-span-5 rounded-2xl p-2 sm:p-2.5 transition-all relative border ${
                    activeTurn === 'user2' && gameMode === 'teams'
                      ? 'bg-gradient-to-b from-[#0f2d2b] to-[#071917] border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.35)] scale-[1.02]'
                      : 'bg-gradient-to-b from-[#102431] to-[#08151f] border-slate-700/80 hover:border-slate-500'
                  }`}
                  style={{
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 4px 10px rgba(0,0,0,0.5)'
                  }}
                >
                  {/* Top: Edit Name & Status indicator dot */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
                      {editingPlayer === 'user2' ? (
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={tempPlayerName}
                            onChange={(e) => setTempPlayerName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSavePlayerName()}
                            autoFocus
                            className="w-16 bg-black/80 border border-emerald-400 text-white text-[10px] px-1 py-0.5 rounded text-center font-bold"
                          />
                          <button
                            onClick={handleSavePlayerName}
                            className="text-emerald-400 hover:text-emerald-300"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-black text-emerald-300 line-clamp-1 max-w-[75px]">
                            {user2Name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditName('user2');
                            }}
                            className="text-gray-400 hover:text-emerald-300 p-0.5"
                            title="تعديل اسم اللاعب"
                          >
                            <Edit2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Center Score Number */}
                  <div className="text-center py-0.5">
                    <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                      {team2Score}
                    </span>
                  </div>

                  {/* Bottom Hearts / Lives (Matching Screenshot) */}
                  <div className="flex items-center justify-center gap-1 mt-0.5">
                    <span className="text-rose-500 text-xs drop-shadow-[0_0_4px_rgba(244,63,94,0.6)]">❤️</span>
                    <span className="text-rose-500 text-xs drop-shadow-[0_0_4px_rgba(244,63,94,0.6)]">❤️</span>
                    <span className="text-rose-500 text-xs drop-shadow-[0_0_4px_rgba(244,63,94,0.6)]">❤️</span>
                    <span className="text-slate-600 text-xs">🖤</span>
                  </div>
                </div>

                {/* Middle Pod: Digital Timer Capsule & Referee Actions */}
                <div className="col-span-2 sm:col-span-2 flex flex-col items-center justify-center gap-1.5">
                  {/* Digital Metallic Timer Pod */}
                  <div
                    id="digital-timer-pod"
                    className="px-2 sm:px-3 py-1 rounded-xl bg-gradient-to-b from-[#182d3d] to-[#0a151f] border border-cyan-500/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.2),0_4px_8px_rgba(0,0,0,0.6)] flex items-center justify-center gap-1 text-center"
                  >
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span className="font-mono font-black text-xs sm:text-sm text-cyan-300">
                      00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                    </span>
                  </div>

                  {/* Action / Referee Check Buttons */}
                  <div className="flex items-center gap-1">
                    {/* Checkmark Button (Correct) */}
                    <button
                      id="referee-btn-correct"
                      disabled={feedbackStatus !== 'idle'}
                      onClick={() => handleJudgeAnswer(true)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-[#163c32] to-[#0d231d] border border-emerald-400/60 text-emerald-300 hover:text-emerald-200 flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.5)] transition-transform active:scale-90 disabled:opacity-40 cursor-pointer"
                      title="احتساب صح وحذف البطاقة"
                    >
                      <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 stroke-[3]" />
                    </button>

                    {/* Cross Button (Wrong / Rotate to Back) */}
                    <button
                      id="referee-btn-wrong"
                      disabled={feedbackStatus !== 'idle'}
                      onClick={() => handleJudgeAnswer(false)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-[#3a1d25] to-[#221016] border border-rose-400/60 text-rose-300 hover:text-rose-200 flex items-center justify-center shadow-[0_2px_6px_rgba(0,0,0,0.5)] transition-transform active:scale-90 disabled:opacity-40 cursor-pointer"
                      title="احتساب خطأ ونقل السؤال لآخر السلسلة"
                    >
                      <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 stroke-[3]" />
                    </button>
                  </div>
                </div>

                {/* Right Card: Doctor / Teacher / User 1 Avatar Card (Matching Screenshot) */}
                <div
                  id="user1-hud-card"
                  onClick={() => {
                    if (gameMode === 'teams' && feedbackStatus === 'idle') setActiveTurn('user1');
                  }}
                  className={`col-span-5 sm:col-span-5 rounded-2xl p-1.5 sm:p-2 transition-all relative border overflow-hidden ${
                    activeTurn === 'user1' && gameMode === 'teams'
                      ? 'bg-gradient-to-b from-[#152e44] to-[#0b1c2b] border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] scale-[1.02]'
                      : 'bg-gradient-to-b from-[#102431] to-[#08151f] border-slate-700/80 hover:border-slate-500'
                  }`}
                  style={{
                    boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 4px 10px rgba(0,0,0,0.5)'
                  }}
                >
                  <div className="flex items-center gap-2">
                    {/* The active player's exact profile avatar */}
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border border-cyan-400/60 bg-[#162738] shrink-0 shadow-[0_0_14px_rgba(34,211,238,0.24)]">
                      {playerAvatarUrl ? (
                        <img src={playerAvatarUrl} alt="صورة اللاعب" width={56} height={56} className="h-full w-full object-cover" />
                      ) : (
                        <User className="absolute inset-0 m-auto h-7 w-7 text-cyan-200" aria-hidden="true" />
                      )}
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-black text-cyan-200/80">اللاعب الحالي</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-mono font-black text-white">{team1Score} نقطة</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-cyan-400 text-xs drop-shadow-[0_0_4px_rgba(6,182,212,0.6)]">💙</span>
                        <span className="text-cyan-400 text-xs drop-shadow-[0_0_4px_rgba(6,182,212,0.6)]">💙</span>
                        <span className="text-cyan-400 text-xs drop-shadow-[0_0_4px_rgba(6,182,212,0.6)]">💙</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Question Banner with Sci-Fi Oscilloscope Waveform (Matching Screenshot) */}
              {currentQ && (
                <div
                  id="active-question-banner"
                  className="game-sheen relative rounded-2xl p-4 sm:p-5 border border-cyan-300/35 overflow-hidden shadow-[0_12px_28px_rgba(2,8,23,0.35)]"
                  style={{
                    background: 'linear-gradient(180deg, #0f2738 0%, #081723 100%)',
                    boxShadow: 'inset 0 1px 2px rgba(0,255,255,0.15), 0 4px 14px rgba(0,0,0,0.6)'
                  }}
                >
                  {/* Oscilloscope Glowing Sound Wave in Background */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
                    viewBox="0 0 500 120"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M 0,60 L 60,60 L 90,30 L 120,90 L 150,45 L 180,75 L 210,20 L 240,100 L 270,40 L 300,80 L 330,30 L 360,90 L 390,50 L 420,70 L 500,60"
                      fill="none"
                      stroke="#00ffff"
                      strokeWidth="2"
                    />
                  </svg>

                  {/* Top Badge Indicators Row (Matching Screenshot Tags) */}
                  <div className="flex items-center justify-between text-[10px] font-bold text-gray-300 mb-2 relative z-10">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>تحدي مباشر</span>
                      </span>
                      <span className="bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded-full">
                        {totalCardsCount - remainingCardsCount + 1} تم الإنجاز
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-amber-300 font-mono font-black">
                        +{currentQ.points} نقطة
                      </span>
                      <button
                        id="btn-skip-question"
                        disabled={feedbackStatus !== 'idle'}
                        onClick={handleSkipQuestion}
                        className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-gray-200 hover:text-cyan-300 border border-white/10 transition-colors cursor-pointer"
                        title="نقل السؤال لآخر السلسلة وعرض التالي"
                      >
                        <FastForward className="w-3 h-3 text-cyan-400" />
                        <span>تخطي ⏭</span>
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <h4 className="text-xs sm:text-base font-bold text-white leading-relaxed text-center relative z-10 px-1">
                    <ScientificText value={currentQ.question} />
                  </h4>

                  {/* Selection Confirmation Bar */}
                  {feedbackStatus === 'idle' && selectedCardId !== null && (
                    <div className="flex items-center justify-center gap-2 pt-2 relative z-10 animate-in fade-in">
                      <span className="text-xs text-gray-300">
                        تم اختيار: <strong className="text-cyan-300">البطاقة ({selectedCardId})</strong>
                      </span>
                      <button
                        id="btn-confirm-answer"
                        onClick={handleConfirmAnswer}
                        className="px-3.5 py-1 bg-gradient-to-r from-emerald-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 text-black font-black rounded-xl text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
                      >
                        تأكيد الإجابة ✓
                      </button>
                    </div>
                  )}

                  {/* Correct Feedback Banner */}
                  {feedbackStatus === 'correct' && (
                    <div className="game-pop mt-2 p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-black flex items-center justify-center gap-1.5 animate-in zoom-in-95">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{feedbackMessage}</span>
                    </div>
                  )}

                  {/* Wrong Feedback Banner */}
                  {feedbackStatus === 'wrong' && (
                    <div className="game-pop mt-2 p-2 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-black flex items-center justify-center gap-1.5 animate-in shake">
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{feedbackMessage}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 4. Minimal answer choices: only the answer and its number. */}
              <div className="flex items-center justify-between px-1 pt-1 text-[11px] font-black text-amber-200">
                <span>الاختيارات</span>
                <span className="rounded-md border border-amber-300/50 bg-amber-400/10 px-2 py-0.5 font-mono text-[10px] text-amber-200">
                  {remainingCardsCount} متبقية
                </span>
              </div>

              {/* 5. Compact gold answer boxes */}
              <div
                id="gibha-sah-cards-grid"
                className={`grid grid-cols-2 gap-2 sm:gap-2.5 transition-all duration-300 pb-2 ${
                  celebrationBurst === 'combo' ? 'scale-[1.01] drop-shadow-[0_0_18px_rgba(251,191,36,0.35)]' : ''
                }`}
              >
                {activeCards.map((card, cardIndex) => {
                  const isSelected = selectedCardId === card.number;

                  return (
                    <button
                      key={card.id}
                      id={`card-item-${card.number}`}
                      disabled={feedbackStatus !== 'idle'}
                      onClick={() => handleCardClick(card.number)}
                      style={{ animationDelay: `${cardIndex * 35}ms` }}
                      className={`min-h-0 rounded-xl border px-2.5 py-2.5 text-center transition-[transform,box-shadow,background-color,border-color,opacity] duration-150 flex items-center justify-between gap-2 cursor-pointer active:scale-[0.97] animate-in fade-in zoom-in-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 ${
                        isSelected
                          ? 'border-amber-200 bg-gradient-to-r from-amber-300 to-yellow-200 text-amber-950 shadow-[0_0_18px_rgba(251,191,36,0.5)] ring-2 ring-amber-200'
                          : 'border-amber-300/65 bg-gradient-to-r from-amber-500/20 via-yellow-400/10 to-amber-500/20 text-amber-100 hover:border-amber-200 hover:bg-amber-400/25 hover:shadow-[0_6px_14px_rgba(251,191,36,0.22)]'
                      }`}
                    >
                      <span className="min-w-0 truncate text-[12px] font-black leading-5 sm:text-[13px]">{card.label}</span>
                      <span className={`flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md border px-1 font-mono text-[10px] font-black ${isSelected ? 'border-amber-700/40 bg-amber-950/10 text-amber-950' : 'border-amber-200/70 bg-amber-300/20 text-amber-100'}`}>
                        {card.number}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            /* Winner / Final Ceremony Screen */
            <div id="game-finished-screen" className="text-center py-6 space-y-4 animate-in fade-in">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-500 via-amber-400 to-emerald-500 p-[2px] mx-auto shadow-[0_0_35px_rgba(245,158,11,0.4)]">
                <div className="w-full h-full rounded-full bg-[#08121f] flex items-center justify-center text-amber-400">
                  <Crown className="w-10 h-10 animate-bounce" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-black px-3 py-1 rounded-full mb-1">
                  <PartyPopper className="w-4 h-4 text-emerald-400" />
                  <span>تم مسح وتفريغ جميع البطاقات الـ 10 بنجاح!</span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  {gameMode === 'teams' ? (
                    team1Score > team2Score ? (
                      <span className="text-cyan-400">🎉 مبروك لـ ({user1Name === 'المستخدم 1' ? 'اللاعب الحالي' : user1Name}) الفوز بتحدي جيبها صح!</span>
                    ) : team2Score > team1Score ? (
                      <span className="text-emerald-400">🏆 مبروك لـ ({user2Name}) الفوز بتحدي جيبها صح!</span>
                    ) : (
                      <span className="text-amber-400">🤝 تعادل بطولي رائع بين اللاعبين!</span>
                    )
                  ) : (
                    <span className="text-cyan-300">أحسنت! أكملت تحدي جيبها صح الفردي بنجاح</span>
                  )}
                </h3>
                <p className="text-xs text-gray-400">
                  انتهت جولة التحدي وحل جميع البطاقات لدرس: {lessonTitle}
                </p>
              </div>

              {/* Final Scoreboard */}
              {gameMode === 'teams' ? (
                <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-xs">
                  <div className="bg-[#0b1726] border border-cyan-500/40 p-3 rounded-2xl text-center">
                    <span className="text-[10px] text-cyan-300 block font-bold">نقاط {user1Name === 'المستخدم 1' ? 'اللاعب الحالي' : user1Name}</span>
                    <span className="text-2xl font-black text-white mt-1 block font-mono">
                      {team1Score}
                    </span>
                  </div>
                  <div className="bg-[#0b1726] border border-emerald-500/40 p-3 rounded-2xl text-center">
                    <span className="text-[10px] text-emerald-300 block font-bold">نقاط {user2Name}</span>
                    <span className="text-2xl font-black text-white mt-1 block font-mono">
                      {team2Score}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0b1726] border border-cyan-500/40 p-3 rounded-2xl max-w-xs mx-auto text-center">
                  <span className="text-[10px] text-gray-400 block font-bold">مجموع النقاط المحققة</span>
                  <span className="text-2xl font-black text-cyan-300 mt-1 block font-mono">
                    {soloScore} نقطة
                  </span>
                </div>
              )}

              {/* Solved Cards History */}
              <div className="space-y-2 text-right max-h-44 overflow-y-auto pr-1">
                <h5 className="text-xs font-bold text-gray-300">سجل البطاقات المنجزة:</h5>
                {history.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-white/10 bg-[#08121f] text-[11px] flex items-center justify-between"
                  >
                    <div className="space-y-0.5 max-w-[80%]">
                      <span className="line-clamp-1 font-bold text-gray-200"><ScientificText value={item.question.question} /></span>
                      <span className="text-[9px] text-gray-400">
                        الفائز بها: {item.winningUser}
                      </span>
                    </div>
                    <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-black px-2 py-1 rounded-lg border border-cyan-500/30">
                      بطاقة ({item.cardNumber})
                    </span>
                  </div>
                ))}
              </div>

              {/* Bottom Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  id="btn-finished-restart"
                  onClick={handleRestart}
                  className="flex-1 py-3 bg-[#132338] hover:bg-[#1a304d] text-white font-bold rounded-2xl border border-white/10 text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>جولة جديدة عشوائية</span>
                </button>
                <button
                  id="btn-finished-close"
                  onClick={handleCloseGame}
                  className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-black font-black rounded-2xl shadow-lg text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <span>العودة للدرس</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
