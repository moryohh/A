import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Trophy,
  Sparkles,
  RotateCcw,
  ArrowRight,
  Flame,
  Award,
  CheckCircle2,
  XCircle,
  Users,
  User,
  Swords,
  BookOpen,
  GraduationCap,
  Phone,
  Volume2,
  VolumeX,
  RefreshCw,
  BarChart3,
  Clock,
  Send,
  MessageCircle,
  Radio,
  ShieldCheck,
  Zap,
  MapPin,
  School,
  Smile,
  Check,
} from 'lucide-react';
import { MillionaireGameConfig, MillionaireQuestion, StudentGameResult } from '../types';
import { getMillionaireGameForLesson } from '../data/mockMillionaire';
import { gameAudio } from '../utils/gameAudio';
import { getMillionaireReward } from '../services/pointsService';
import { ScientificText } from './ScientificText';

interface MillionaireGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  lessonTitle: string;
  category?: string;
  onScoreUpdate?: (points: number) => void;
  onAssessmentResult?: (correctPoints: number, totalPoints: number) => void;
  customConfig?: MillionaireGameConfig;
  onOpenOnline?: () => void;
}

// 11-level Iraqi dinar prize ladder shown inside the game.
const LADDER_LEVELS = [
  { level: 1, points: 250, label: '250 د.ع', isSafety: false },
  { level: 2, points: 500, label: '500 د.ع', isSafety: false },
  { level: 3, points: 1000, label: '1 000 د.ع', isSafety: false },
  { level: 4, points: 5000, label: '5 000 د.ع', isSafety: false },
  { level: 5, points: 10000, label: '10 000 د.ع', isSafety: true },
  { level: 6, points: 25000, label: '25 000 د.ع', isSafety: false },
  { level: 7, points: 50000, label: '50 000 د.ع', isSafety: false },
  { level: 8, points: 100000, label: '100 000 د.ع', isSafety: false },
  { level: 9, points: 250000, label: '250 000 د.ع', isSafety: true },
  { level: 10, points: 500000, label: '500 000 د.ع', isSafety: false },
  { level: 11, points: 1000000, label: '1 000 000 د.ع', isSafety: true },
];

function shuffleMillionaire<T>(values: T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function buildMillionaireRound(source: MillionaireGameConfig): MillionaireGameConfig {
  const rawPool = source.questionPool?.length ? source.questionPool : source.questions;
  const pool = Array.from(new Map(rawPool.map((question) => [question.question.trim(), question])).values());
  if (pool.length === 0) return source;
  const target = LADDER_LEVELS.length;
  const selected = pool.length > target
    ? shuffleMillionaire(pool).slice(0, target)
    : Array.from({ length: target }, (_, idx) => pool[idx % pool.length]);
  return {
    ...source,
    questions: selected.map((question, idx) => ({
      ...question,
      id: `${question.id}-round-${idx + 1}`,
      points: LADDER_LEVELS[idx]?.points || question.points,
      difficulty: idx < 4 ? 'easy' : idx < 9 ? 'medium' : 'hard',
    })),
  };
}

const MILLIONAIRE_WRONG_AUDIO_URL = `${import.meta.env.BASE_URL}audio/millionaire-wrong.mp3`;
const MILLIONAIRE_CORRECT_AUDIO_URL = `${import.meta.env.BASE_URL}audio/millionaire-correct.mp3`;
const MILLIONAIRE_THINKING_AUDIO_URL = `${import.meta.env.BASE_URL}audio/millionaire-thinking.mp3`;
const MILLIONAIRE_PRIZE_AUDIO_URL = `${import.meta.env.BASE_URL}audio/millionaire-prize.mp3`;

export interface OpponentProfile {
  id: string;
  name: string;
  avatar: string;
  city: string;
  school: string;
  badge: string;
  level: number;
}

const MOCK_OPPONENTS: OpponentProfile[] = [
  {
    id: 'opp-1',
    name: 'سجاد مهدي',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    city: 'بغداد - الكرخ',
    school: 'إعدادية المتميزين',
    badge: 'نجم التحدي ⚡',
    level: 12,
  },
  {
    id: 'opp-2',
    name: 'فاطمة العبيدي',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    city: 'الموصل - نينوى',
    school: 'ثانوية المتفوقات',
    badge: 'عالمة المستقبل 🔬',
    level: 14,
  },
  {
    id: 'opp-3',
    name: 'علي التميمي',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    city: 'البصرة - العشار',
    school: 'إعدادية المعقل',
    badge: 'فارس الأوائل 🏆',
    level: 11,
  },
  {
    id: 'opp-4',
    name: 'زينب الكرخي',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    city: 'بابل - الحلة',
    school: 'ثانوية الإسراء',
    badge: 'شعلة الذكاء 💡',
    level: 13,
  },
  {
    id: 'opp-5',
    name: 'حيدر الكعبي',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    city: 'النجف الأشرف',
    school: 'إعدادية الكوفة',
    badge: 'صائد المليون 🎯',
    level: 15,
  },
];

// 100 Opponent Loss Reaction Messages (Triggered 3 seconds after student loss)
const USER_LOSS_REACTION_MESSAGES = [
  'اوه خسرت',
  'يلا حظ اوفر',
  'اوف راحت عليك',
  'هالمرة مو الك',
  'شوية ركز',
  'شنو هالجواب 😂',
  'عادي نعيدها',
  'يلا شد حيلك',
  'مو هذا الجواب',
  'هالمرة منك 😏',
  'اوف جانت قريبة',
  'لا تستعجل',
  'بعدك تگدر تفوز',
  'شوية تركيز حبيبي 😂',
  'يلا جرب مرة ثانية',
  'مو آني السبب 😂',
  'عقلك غدر بيك هالمرة',
  'لا تشوش علي',
  'حظك نايم اليوم 😂',
  'عادي نعوضها',
  'اوه راحت',
  'ركز ويا السؤال',
  'الجواب واضح تره 😂',
  'لا تلومني انت اخترت',
  'يلا لا تيأس',
  'هالمرة ما ضبطت وياك',
  'شنو هالورطة 😂',
  'حاول مرة ثانية',
  'لا تستسلم',
  'الخطأ منك هالمرة',
  'راحت نقطة',
  'ركز قبل لا تختار',
  'حظ اوفر بالجولة الجاية',
  'لا تشوش علي بعد 😂',
  'يلا نرجع اقوى',
  'تصير عادي',
  'وين التركيز 😂',
  'لا تلوم السؤال',
  'خسرت الجولة',
  'بعدها اللعبة طويلة',
  'اوه جواب غلط',
  'هالمرة انت السبب 😂',
  'شد حيلك',
  'لا تخلي الحماس يغلبك',
  'راحت عليك هالمرة',
  'يلا جرب من جديد',
  'مو وقت الاستسلام',
  'لا تشتت نفسك',
  'اوف شكد قريبة',
  'السؤال غلبك هالمرة 😂',
  'حظك مو وياك',
  'لا تستعجل بالجواب',
  'نعيدها ونشوف',
  'مو آني جاوبت 😂',
  'ركز اكثر',
  'خسرت عادي',
  'هالمرة الحظ مو وياك',
  'لا تخلي سؤال واحد يحبطك',
  'اوه راحت',
  'الجواب غير 😂',
  'يلا عوضها',
  'لا تشوش على نفسك',
  'هالمرة لخبطتها 😂',
  'لا بأس كمل',
  'اوف خسارة',
  'ركز وياي',
  'بعد عندك فرصة',
  'مو ذنبي والله 😂',
  'هالمرة السؤال فاز',
  'يلا مرة ثانية',
  'لا تستعجل بالاختيار',
  'خسرت بس ما انتهت',
  'شنو هالاختيار 😂',
  'حظ اوفر يا بطل',
  'لا تخلي الغلطة تحبطك',
  'هالمرة منك مو مني 😏',
  'اوف ضاعت',
  'ركز وراح تعوضها',
  'بعدها اكو امل',
  'لا تشوش علي ترى 😂',
  'هالمرة ما مشت',
  'يلا نكمل',
  'جوابك خانك 😂',
  'لا تزعل لعبة',
  'حاول مرة ثانية',
  'اوه خسرت النقطة',
  'لا تلوم الحظ كل مرة 😂',
  'ركز وراح تفوز',
  'هالمرة السؤال اقوى',
  'يلا وريني شطارتك',
  'تصير حتى للشاطر',
  'هالمرة السبب منك 😂',
  'لا تتوتر',
  'اوف راحت الجولة',
  'بعدك تگدر تقلبها',
  'لا تشوش علي بالاختيارات',
  'هالمرة ما وفقت',
  'يلا شدها بالجولة الجاية',
  'خسرت بس لا توقف',
  'اوه لا حظ اوفر 😄',
];

const SEARCH_RADAR_PHRASES = [
  'جاري مسح المتنافسين النشطين في العراق...',
  'البحث عن طالب متصل في محافظتك...',
  'مطابقة المرحلة الدراسية والمادة العلمية...',
  'فحص سرعة الاتصال وجودة الاستجابة...',
  'تحليل الكفاءة العلمية وسرعة البديهة...',
  'تم رصد إشارة لاعب قريب! جاري الاتصال...',
];

const QUICK_CHAT_RESPONSES = [
  'بالتوفيق يا بطل! 👏',
  'سؤال صعب جداً! 🤔',
  'سأفوز عليك بالتأكيد! 🔥',
  'ركز زين يا غالي! 💡',
  'إجابة ممتازة وسريعة! ✨',
  'حظ أوفر في الجولة القادمة! 😉',
];

interface ChatMessage {
  id: string;
  sender: 'user' | 'opponent';
  text: string;
  time: string;
}

export const MillionaireGameModal: React.FC<MillionaireGameModalProps> = ({
  isOpen,
  onClose,
  lessonId,
  lessonTitle,
  category = 'المادة التعليمية',
  onScoreUpdate,
  onAssessmentResult,
  customConfig,
  onOpenOnline,
}) => {
  // Game Configuration & Load (fresh round from the exact lesson-file pool)
  const [gameConfig, setGameConfig] = useState<MillionaireGameConfig>(() =>
    buildMillionaireRound(customConfig || getMillionaireGameForLesson(lessonId, lessonTitle, category))
  );

  useEffect(() => {
    const source = customConfig || getMillionaireGameForLesson(lessonId, lessonTitle, category);
    setGameConfig(buildMillionaireRound(source));
    resetGame(false);
  }, [isOpen, customConfig, lessonId, lessonTitle, category]);

  // Game Mode: 'single' | 'multiplayer'
  const [gameMode, setGameMode] = useState<'single' | 'multiplayer'>('single');

  // Flow Stages
  const [gameState, setGameState] = useState<
    | 'start'
    | 'searching_match'
    | 'match_found'
    | 'playing'
    | 'checking'
    | 'answered'
    | 'victory'
    | 'gameover'
    | 'review'
  >('start');

  // Matchmaking (Clash of Clans style) States
  const [searchTimer, setSearchTimer] = useState(0);
  const [targetSearchDuration, setTargetSearchDuration] = useState(10);
  const [searchPhraseIndex, setSearchPhraseIndex] = useState(0);
  const [selectedOpponent, setSelectedOpponent] = useState<OpponentProfile>(MOCK_OPPONENTS[0]);
  const [matchCountdown, setMatchCountdown] = useState(3);

  // Multiplayer Turn & Chat States
  const [opponentSpeech, setOpponentSpeech] = useState<string>('مرحباً بك! جاهز لسؤال المليون دينار؟ 🤝');
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [customChatMessage, setCustomChatMessage] = useState('');
  const [isOpponentThinking, setIsOpponentThinking] = useState(false);
  const [opponentHoveredOption, setOpponentHoveredOption] = useState<number | null>(null);
  const [hasNewChatNotification, setHasNewChatNotification] = useState(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [isUserEliminated, setIsUserEliminated] = useState(false);
  const [isOpponentEliminated, setIsOpponentEliminated] = useState(false);
  const isAdvancingQuestionRef = useRef(false);
  const rewardIssuedRef = useRef(false);
  const [handoverBanner, setHandoverBanner] = useState<{
    show: boolean;
    title: string;
    message: string;
    target: 'user' | 'opponent';
  } | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Core Game State Trackers
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
  const [showLadderMobile, setShowLadderMobile] = useState(false);

  // Lifelines (وسائل المساعدة)
  const [usedFiftyFifty, setUsedFiftyFifty] = useState(false);
  const [usedAudience, setUsedAudience] = useState(false);
  const [usedCallFriend, setUsedCallFriend] = useState(false);
  const [usedSwitchQuestion, setUsedSwitchQuestion] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  // 60-Second Question Timer
  const [questionTimer, setQuestionTimer] = useState(60);
  const [isTimeOutLoss, setIsTimeOutLoss] = useState(false);

  // 5-Second Auto-Advance Timer for Prize Progression
  const [progressionTimer, setProgressionTimer] = useState(5);

  // Lifeline Dialogs
  const [showAudienceModal, setShowAudienceModal] = useState(false);
  const [audiencePercentages, setAudiencePercentages] = useState<number[]>([25, 25, 25, 25]);
  const [showCallFriendModal, setShowCallFriendModal] = useState(false);
  const [callFriendState, setCallFriendState] = useState<'calling' | 'speaking'>('calling');

  // History & Stats
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [wrongAnswersCount, setWrongAnswersCount] = useState(0);
  const [answeredHistory, setAnsweredHistory] = useState<
    { question: MillionaireQuestion; selected: number | null; isCorrect: boolean; timeout?: boolean }[]
  >([]);
  const [accumulatedPoints, setAccumulatedPoints] = useState(0);
  const [highScore, setHighScore] = useState<number>(0);

  // Animated Prize Climb State
  const [showPrizeProgressionModal, setShowPrizeProgressionModal] = useState(false);
  const [animatedPrizeValue, setAnimatedPrizeValue] = useState(0);
  const [activeClimbLevel, setActiveClimbLevel] = useState(1);

  // Determine whose turn it is:
  // - If single player: always user
  // - If user is eliminated & opponent alive: always opponent (takes over)
  // - If opponent is eliminated & user alive: always user (takes over)
  // - Otherwise: alternating turns (even questions = user, odd questions = opponent)
  const isYourTurn = useMemo(() => {
    if (gameMode === 'single') return true;
    if (isUserEliminated && !isOpponentEliminated) return false;
    if (isOpponentEliminated && !isUserEliminated) return true;
    return currentQuestionIndex % 2 === 0;
  }, [gameMode, isUserEliminated, isOpponentEliminated, currentQuestionIndex]);

  // Sound Toggle
  const handleToggleSound = () => {
    const nextState = !isSoundMuted;
    setIsSoundMuted(nextState);
    gameAudio.setMuted(nextState);
    if (!nextState) {
      gameAudio.playClick(640);
    }
  };

  // Scroll chat to bottom
  useEffect(() => {
    if (isChatModalOpen && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatModalOpen]);

  // 1. MATCHMAKING EFFECT (Clash of Clans Radar Search 5s to 28s)
  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;
    let sonarInterval: NodeJS.Timeout | null = null;
    let phraseInterval: NodeJS.Timeout | null = null;

    if (gameState === 'searching_match') {
      // Pick random opponent and duration
      const randomOpp = MOCK_OPPONENTS[Math.floor(Math.random() * MOCK_OPPONENTS.length)];
      setSelectedOpponent(randomOpp);

      const targetDuration = Math.floor(Math.random() * 20) + 6; // 6 to 25 seconds
      setTargetSearchDuration(targetDuration);
      setSearchTimer(0);

      // Pulse sonar sound
      if (!isSoundMuted) gameAudio.playRadarSonar();
      sonarInterval = setInterval(() => {
        if (!isSoundMuted) gameAudio.playRadarSonar();
      }, 3000);

      // Rotate radar status phrases
      phraseInterval = setInterval(() => {
        setSearchPhraseIndex((prev) => (prev + 1) % SEARCH_RADAR_PHRASES.length);
      }, 3200);

      // Main search seconds ticker
      timerInterval = setInterval(() => {
        setSearchTimer((prev) => {
          const next = prev + 1;
          if (next >= targetDuration) {
            clearInterval(timerInterval as NodeJS.Timeout);
            handleMatchFound(randomOpp);
            return targetDuration;
          }
          return next;
        });
      }, 1000);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
      if (sonarInterval) clearInterval(sonarInterval);
      if (phraseInterval) clearInterval(phraseInterval);
    };
  }, [gameState, isSoundMuted]);

  // When Match is Found
  const handleMatchFound = (opp: OpponentProfile) => {
    if (!isSoundMuted) gameAudio.playBattleMatchFound();
    setGameState('match_found');
    setMatchCountdown(3);

    // Seed initial welcome message
    const initialMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'opponent',
      text: `مرحباً بك! أنا ${opp.name} من ${opp.city}، جاهز للتحدي والفوز بالمليون دينار! 🔥`,
      time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
    };
    setChatMessages([initialMsg]);
    setUnreadMessagesCount(0);
    setHasNewChatNotification(false);
    setOpponentSpeech(`مرحباً يا بطل! جاهز لمسيرة المليون دينار؟ 🤝`);

    let count = 3;
    const cdInterval = setInterval(() => {
      count -= 1;
      setMatchCountdown(count);
      if (count <= 0) {
        clearInterval(cdInterval);
        startMultiplayerGame();
      }
    }, 1000);
  };

  // Start Multiplayer Game
  const startMultiplayerGame = () => {
    gameAudio.playGameStart();
    setGameMode('multiplayer');
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setEliminatedOptions([]);
    setShowPrizeProgressionModal(false);
    setQuestionTimer(60);
    setIsTimeOutLoss(false);
  };

  // 2. QUESTION 60-SECOND COUNTDOWN EFFECT
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (
      gameState === 'playing' &&
      !showAudienceModal &&
      !showCallFriendModal &&
      !showPrizeProgressionModal &&
      !isChatModalOpen
    ) {
      interval = setInterval(() => {
        setQuestionTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval as NodeJS.Timeout);
            handleTimeOutLoss();
            return 0;
          }
          if (prev <= 10 && !isSoundMuted) {
            gameAudio.playTimerTick(true);
          } else if (prev === 20 && !isSoundMuted) {
            gameAudio.playTimerTick(false);
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [
    gameState,
    currentQuestionIndex,
    showAudienceModal,
    showCallFriendModal,
    showPrizeProgressionModal,
    isChatModalOpen,
    isSoundMuted,
  ]);

  // Handle Question Timeout Loss
  const handleTimeOutLoss = () => {
    if (!isSoundMuted) gameAudio.playTimeoutBuzzer();
    setIsTimeOutLoss(true);
    setSelectedOption(null);
    setGameState('answered');
    setWrongAnswersCount((prev) => prev + 1);

    const newHistoryItem = {
      question: currentQuestion,
      selected: null,
      isCorrect: false,
      timeout: true,
    };
    setAnsweredHistory((prev) => [...prev, newHistoryItem]);

    if (gameMode === 'multiplayer') {
      if (isYourTurn) {
        setIsUserEliminated(true);
        triggerUserLossReactionMessage();
        if (isOpponentEliminated) {
          sendOpponentReaction(
            'انتهى الوقت وخسرنا كلينا! كانت تجربة ملحمية ⏳',
            'للأسف انتهت المحاولة لكلينا، حظ أوفر!'
          );
        } else {
          sendOpponentReaction(
            'داهمك الوقت يا بطل! استلمت الأسئلة وسأكمل التحدي نيابة عنا نحو المليون! 💪',
            'انتهى وقتك وانتقلت الأسئلة لي لأكمل المسيرة!'
          );
          setHandoverBanner({
            show: true,
            title: `انتقلت الأسئلة إلى ${selectedOpponent.name}`,
            message: `داهمك الوقت! تم تحويل جميع الأسئلة المتبقية إلى ${selectedOpponent.name} ليواصل التحدي نحو المليون.`,
            target: 'opponent',
          });
        }
      } else {
        setIsOpponentEliminated(true);
        if (isUserEliminated) {
          sendOpponentReaction(
            'انتهى وقتي وخسرنا كلينا! حظ أوفر 🤝',
            'انتهت المحاولة لكلينا!'
          );
        } else {
          sendOpponentReaction(
            'داهمني الوقت! انتقلت القيادة والأسئلة إليك لتنقذ الموقف وتفوز بالمليون! 🏆',
            'انتهى وقتي وانتقلت الأسئلة إليك بالكامل يا بطل!'
          );
          setHandoverBanner({
            show: true,
            title: 'انتقلت الأسئلة إليك يا بطل!',
            message: `انتهى وقت ${selectedOpponent.name}! انتقلت جميع الأسئلة المتبقية إليك لتكمل المسيرة بمفردك نحو المليون.`,
            target: 'user',
          });
          // Automatically transition to user playing
          setTimeout(() => {
            handleNextQuestion();
          }, 3000);
        }
      }
    }
  };

  // Trigger Opponent Chat Reaction after 3 seconds from student's loss
  const triggerUserLossReactionMessage = () => {
    if (gameMode !== 'multiplayer') return;
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * USER_LOSS_REACTION_MESSAGES.length);
      const chosenText = USER_LOSS_REACTION_MESSAGES[randomIndex];

      const newMsg: ChatMessage = {
        id: `opp-loss-react-${Date.now()}`,
        sender: 'opponent',
        text: chosenText,
        time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
      };

      setChatMessages((prev) => [...prev, newMsg]);
      setOpponentSpeech(chosenText);
      setHasNewChatNotification(true);
      setUnreadMessagesCount((prev) => prev + 1);
      if (!isSoundMuted) gameAudio.playMessageReceived();
    }, 3000);
  };

  // 3. PRIZE PROGRESSION 5-SECOND AUTO-ADVANCE TIMER
  useEffect(() => {
    let autoInterval: NodeJS.Timeout | null = null;

    if (showPrizeProgressionModal) {
      setProgressionTimer(5);
      autoInterval = setInterval(() => {
        setProgressionTimer((prev) => {
          if (prev <= 1) {
            clearInterval(autoInterval as NodeJS.Timeout);
            handleNextQuestion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (autoInterval) clearInterval(autoInterval);
    };
  }, [showPrizeProgressionModal]);

  // 4. OPPONENT'S SPEECH & SUGGESTIONS ON USER'S TURN
  useEffect(() => {
    if (
      gameState === 'playing' &&
      gameMode === 'multiplayer' &&
      isYourTurn &&
      !showPrizeProgressionModal
    ) {
      const isAdvanced = currentQuestionIndex >= 10;
      const correctIdx = currentQuestion.correctAnswer;
      const prefix = getOptionPrefix(correctIdx);
      const optText = currentQuestion.options[correctIdx];

      let suggestionText = '';
      if (!isAdvanced) {
        const templates = [
          `أقترح عليك اختيار الخيار (${prefix}) "${optText}" لأنه يوافق قواعد الدرس 📚`,
          `سؤال ممتع! أرى أن الخيار (${prefix}) هو الأصح والأنسب علمياً 💡`,
          `ما رأيك بالخيار (${prefix})؟ يبدو منطقياً جداً، بالتوفيق يا بطل! 👏`,
        ];
        suggestionText = templates[Math.floor(Math.random() * templates.length)];
      } else {
        const wrongIdx = (correctIdx + 1) % 4;
        const wrongPrefix = getOptionPrefix(wrongIdx);
        const templates = [
          `سؤال حاسم فوق المستوى العاشر! محتار بين (${prefix}) و (${wrongPrefix})... ركّز جيداً! 🤔`,
          `هذا من الأسئلة الذهبية الدقيقة! أرجّح الخيار (${prefix}) لكن القرار لك 🏆`,
          `تحدٍ قوي جداً نحو المليون! الخيار (${prefix}) يبدو الأقرب للصواب 🔥`,
        ];
        suggestionText = templates[Math.floor(Math.random() * templates.length)];
      }

      setOpponentSpeech(suggestionText);
      const newMsg: ChatMessage = {
        id: `opp-sug-${Date.now()}`,
        sender: 'opponent',
        text: suggestionText,
        time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, newMsg]);
      setHasNewChatNotification(true);
      if (!isChatModalOpen) {
        setUnreadMessagesCount((prev) => prev + 1);
      }
      if (!isSoundMuted) gameAudio.playMessageReceived();
    }
  }, [gameState, currentQuestionIndex, gameMode, isYourTurn, showPrizeProgressionModal]);

  // 5. OPPONENT'S TURN AUTO-ANSWER SIMULATOR (Difficulty starts at Question 8 with 5% and increases +5% per stage)
  useEffect(() => {
    let mainTimeout: NodeJS.Timeout | null = null;

    if (
      gameState === 'playing' &&
      gameMode === 'multiplayer' &&
      !isYourTurn &&
      !showPrizeProgressionModal
    ) {
      setIsOpponentThinking(true);
      setOpponentHoveredOption(null);

      const isAboveTen = currentQuestionIndex >= 10; // السؤال 11 هو آخر سؤال بعد العشرة الأولى

      // Timing rule: 5 to 15 seconds for Q1-10, and double (10 to 30 seconds) for Q>10
      const thinkingDuration = isAboveTen
        ? Math.floor(Math.random() * 20000) + 10000 // 10s to 30s (ضعف المدة)
        : Math.floor(Math.random() * 10000) + 5000; // 5s to 15s

      // Opponent Error Rate: Starts only after Question 8 (index 7) at 5% and increases +5% per subsequent question
      // Q1 to Q7 (idx 0 to 6): 0%
      // Q8 (idx 7): 5% حتى Q11 (idx 10): 20%
      const opponentErrorRate = currentQuestionIndex >= 7 ? (currentQuestionIndex - 6) * 0.05 : 0;
      const isOpponentCorrect = Math.random() >= opponentErrorRate;

      const chosenOption = isOpponentCorrect
        ? currentQuestion.correctAnswer
        : (currentQuestion.correctAnswer + (Math.random() < 0.5 ? 1 : 2)) % 4;

      const initialSpeech = isAboveTen
        ? `هذا سؤال دقيق فوق المستوى العاشر! أحتاج لمضاعفة وقت التفكير والمقارنة... 🧠`
        : `أنا أفكّر في هذا السؤال الآن... دعني أحلل الخيارات بتأنٍ 🤔`;

      setOpponentSpeech(initialSpeech);
      const newMsg: ChatMessage = {
        id: `opp-turn-${Date.now()}`,
        sender: 'opponent',
        text: initialSpeech,
        time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, newMsg]);
      setHasNewChatNotification(true);
      if (!isChatModalOpen) {
        setUnreadMessagesCount((prev) => prev + 1);
      }
      if (!isSoundMuted) gameAudio.playMessageReceived();

      mainTimeout = setTimeout(() => {
        setIsOpponentThinking(false);

        const lockSpeech = `سأختار الخيار (${getOptionPrefix(chosenOption)}) كجواب نهائي! 🎯`;
        setOpponentSpeech(lockSpeech);

        handleSelectOption(chosenOption, true);
      }, thinkingDuration);
    }

    return () => {
      if (mainTimeout) clearTimeout(mainTimeout);
      setOpponentHoveredOption(null);
    };
  }, [gameState, currentQuestionIndex, gameMode, isYourTurn, showPrizeProgressionModal]);

  // Trigger smooth numeric climb
  const triggerPrizeClimbAnimation = (targetPoints: number, levelIdx: number) => {
    setActiveClimbLevel(levelIdx + 1);
    setShowPrizeProgressionModal(true);
    setAnimatedPrizeValue(0);
    setProgressionTimer(5);

    const startTime = performance.now();
    const duration = 1200;

    const updateCounter = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(ease * targetPoints);
      setAnimatedPrizeValue(current);

      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      }
    };

    requestAnimationFrame(updateCounter);
  };

  // Stop provided audio whenever the game closes or returns to its start screen.
  useEffect(() => {
    if (!isOpen || gameState === 'start') {
      gameAudio.stopAllExternal();
    }
  }, [isOpen, gameState]);

  // Play the thinking music on a loop only while the user's question is active.
  // It stops immediately when the user selects an answer, the question changes,
  // a prize/result screen appears, or the game is closed/reset.
  useEffect(() => {
    const shouldPlayThinkingAudio =
      isOpen && gameState === 'playing' && isYourTurn && !showPrizeProgressionModal;

    if (shouldPlayThinkingAudio) {
      gameAudio.playExternal('millionaire-thinking', MILLIONAIRE_THINKING_AUDIO_URL, 0.65, true);
    } else {
      gameAudio.stopExternal('millionaire-thinking');
    }

    return () => {
      gameAudio.stopExternal('millionaire-thinking');
    };
  }, [isOpen, gameState, currentQuestionIndex, isYourTurn, showPrizeProgressionModal]);

  // Play the provided prize/progression sound only while the prize map is visible.
  // It is stopped before the next question or any other game screen appears.
  useEffect(() => {
    if (isOpen && showPrizeProgressionModal) {
      gameAudio.playExternal('millionaire-prize', MILLIONAIRE_PRIZE_AUDIO_URL, 0.8);
    } else {
      gameAudio.stopExternal('millionaire-prize');
    }

    return () => {
      gameAudio.stopExternal('millionaire-prize');
    };
  }, [isOpen, showPrizeProgressionModal]);

  // Keep the high score tied to the opened lesson without replacing its database config.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`millionaire_hs_${lessonId}`);
      if (saved) setHighScore(Number(saved));
    } catch (e) {}
  }, [lessonId]);

  if (!isOpen) return null;

  if (gameConfig.questions.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 font-cairo">
        <div className="w-full max-w-sm rounded-3xl border border-amber-400/40 bg-[#08152e] p-6 text-center text-white shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/40 bg-amber-400/10 text-amber-300">
            <BookOpen className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-black">لا تتوفر أسئلة لهذا الدرس حاليًا</h2>
          <p className="mt-2 text-sm leading-7 text-slate-300">لم يتم العثور على ملف MCQ صالح للدرس المفتوح أو ملف قريب مناسب داخل الفصل نفسه.</p>
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

  const currentQuestion = gameConfig.questions[currentQuestionIndex] || gameConfig.questions[0];
  const currentLadder = LADDER_LEVELS[currentQuestionIndex] || LADDER_LEVELS[0];

  // Restart / Reset game state
  const resetGame = (reshuffle = true) => {
    if (reshuffle) setGameConfig(buildMillionaireRound(gameConfig));
    gameAudio.stopAllExternal();
    rewardIssuedRef.current = false;
    setGameState('start');
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setEliminatedOptions([]);
    setShowLadderMobile(false);
    setShowAudienceModal(false);
    setShowCallFriendModal(false);
    setShowPrizeProgressionModal(false);
    setIsChatModalOpen(false);
    setUnreadMessagesCount(0);
    setHasNewChatNotification(false);
    setUsedFiftyFifty(false);
    setUsedAudience(false);
    setUsedCallFriend(false);
    setUsedSwitchQuestion(false);
    setCorrectAnswersCount(0);
    setWrongAnswersCount(0);
    setAnsweredHistory([]);
    setAccumulatedPoints(0);
    setQuestionTimer(60);
    setIsTimeOutLoss(false);
    setProgressionTimer(5);
    setIsOpponentThinking(false);
    setIsUserEliminated(false);
    setIsOpponentEliminated(false);
    setHandoverBanner(null);
    isAdvancingQuestionRef.current = false;
  };

  // Start Single Player Directly
  const handleStartSinglePlayer = () => {
    gameAudio.playGameStart();
    setGameMode('single');
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setEliminatedOptions([]);
    setShowPrizeProgressionModal(false);
    setQuestionTimer(60);
    setIsTimeOutLoss(false);
    setIsUserEliminated(false);
    setIsOpponentEliminated(false);
    setHandoverBanner(null);
  };

  // Start Multiplayer Search Flow
  const handleStartMultiplayerSearch = () => {
    gameAudio.playClick(600);
    setIsUserEliminated(false);
    setIsOpponentEliminated(false);
    setHandoverBanner(null);
    setGameState('searching_match');
  };

  // Helper for Opponent speech & chat reaction
  const sendOpponentReaction = (speech: string, chatText?: string) => {
    setOpponentSpeech(speech);
    if (chatText) {
      const newMsg: ChatMessage = {
        id: `opp-msg-${Date.now()}`,
        sender: 'opponent',
        text: chatText,
        time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
      };
      setChatMessages((prev) => [...prev, newMsg]);
      setHasNewChatNotification(true);
      if (!isChatModalOpen) {
        setUnreadMessagesCount((prev) => prev + 1);
      }
      if (!isSoundMuted) gameAudio.playMessageReceived();
    }
  };

  // User sends chat message
  const handleSendUserMessage = (textToSend?: string) => {
    const content = textToSend || customChatMessage.trim();
    if (!content) return;

    if (!isSoundMuted) gameAudio.playMessageSent();
    const userMsg: ChatMessage = {
      id: `usr-msg-${Date.now()}`,
      sender: 'user',
      text: content,
      time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setCustomChatMessage('');

    // Opponent reply simulation
    setTimeout(() => {
      const replyOptions = [
        'شكراً لك! المنافسة معك رائعة جداً 🌟',
        'المليون دينار بانتظارنا، لنواصل التركيز! 🏆',
        'أحسنت القول! لنرى من يصل للمحطة الأخيرة 😎',
        'بالفعل، هذه الأسئلة من صلب الامتحانات الوزارية 📚',
        'كل التوفيق، دعنا نتألق معاً! 👏',
      ];
      const randomReply = replyOptions[Math.floor(Math.random() * replyOptions.length)];
      sendOpponentReaction(randomReply, randomReply);
    }, 1400);
  };

  // Option Selection (User or Opponent)
  const handleSelectOption = (optionIndex: number, isOpponentTurn = false) => {
    if (gameState !== 'playing' || eliminatedOptions.includes(optionIndex)) return;

    gameAudio.playMillionaireLockIn();
    setSelectedOption(optionIndex);
    setGameState('checking');

    setTimeout(() => {
      const isCorrect = optionIndex === currentQuestion.correctAnswer;
      onAssessmentResult?.(isCorrect ? 1 : 0, 1);
      setGameState('answered');

      const newHistoryItem = {
        question: currentQuestion,
        selected: optionIndex,
        isCorrect,
      };

      setAnsweredHistory((prev) => [...prev, newHistoryItem]);

      if (isCorrect) {
        gameAudio.playExternal('millionaire-correct', MILLIONAIRE_CORRECT_AUDIO_URL);
        const pointsForThisLevel = currentLadder.points;
        setAccumulatedPoints(pointsForThisLevel);
        setCorrectAnswersCount((prev) => prev + 1);

        if (pointsForThisLevel > highScore) {
          setHighScore(pointsForThisLevel);
          try {
            localStorage.setItem(`millionaire_hs_${lessonId}`, pointsForThisLevel.toString());
          } catch (e) {}
        }

        // Multiplayer conversational remarks
        if (gameMode === 'multiplayer') {
          if (isOpponentTurn) {
            sendOpponentReaction(
              'أحسنت الاختيار! إجابتي كانت صحيحة وتقدمنا في الجوائز 😎',
              'الحمد لله، إجابة صحيحة! الدور القادم لك يا بطل 👏'
            );
          } else {
            sendOpponentReaction(
              'ما شاء الله عليك! إجابة ممتازة ودقيقة جداً 👏',
              'برافو عليك! إجابة رائعة ومتقنة ✨'
            );
          }
        }

        setTimeout(() => {
          triggerPrizeClimbAnimation(pointsForThisLevel, currentQuestionIndex);
        }, 600);
      } else {
        gameAudio.playExternal('millionaire-wrong', MILLIONAIRE_WRONG_AUDIO_URL);
        setWrongAnswersCount((prev) => prev + 1);

        if (gameMode === 'multiplayer') {
          if (isOpponentTurn) {
            // Opponent made mistake
            setIsOpponentEliminated(true);
            if (isUserEliminated) {
              sendOpponentReaction(
                'للأسف أخطأنا كلينا! كانت منافسة شيقة وممتعة 🤝',
                'للأسف خسرنا المحاولة كلينا، حظ أوفر في التحدي القادم!'
              );
            } else {
              // User takes over all future questions automatically
              sendOpponentReaction(
                `للأسف أخطأت في هذا السؤال! انتقلت جميع الأسئلة المتبقية إليك يا بطل لتكمل المسيرة نحو المليون! 🏆`,
                `أخطأت في هذا السؤال! الدور والقيادة أصبحت بيدك بالكامل الآن، ثقتي بك كبيرة 💪`
              );
              setHandoverBanner({
                show: true,
                title: 'انتقلت الأسئلة إليك يا بطل!',
                message: `أخطأ ${selectedOpponent.name} في الإجابة! تم تحويل جميع الأسئلة المتبقية إليك لتكمل التحدي بمفردك نحو المليون دينار.`,
                target: 'user',
              });
              // Auto advance seamlessly to user's question without asking
              setTimeout(() => {
                handleNextQuestion();
              }, 3200);
            }
          } else {
            // User made mistake
            setIsUserEliminated(true);
            triggerUserLossReactionMessage();
            if (isOpponentEliminated) {
              sendOpponentReaction(
                'للأسف خسرنا كلينا! كانت تجربة ملحمية ومفيدة جداً 🤝',
                'انتهت المحاولة لكلينا، نلتقي في تحديات قادمة بإذن الله!'
              );
            } else {
              // Opponent takes over all future questions
              sendOpponentReaction(
                `للأسف أخطأت يا صديقي! لا تقلق، استلمت جميع الأسئلة القادمة وسأبذل جهدي لإيصالنا للمليون! 💪`,
                `انتقلت الأسئلة لي وسأكمل التحدي نيابة عنا، شاهد وشجعني يا بطل! 🔥`
              );
              setHandoverBanner({
                show: true,
                title: `انتقلت الأسئلة إلى ${selectedOpponent.name}`,
                message: `للأسف إجابتك غير صحيحة! تم تحويل جميع الأسئلة المتبقية إلى ${selectedOpponent.name} ليواصل المسيرة نحو المليون دينار.`,
                target: 'opponent',
              });
            }
          }
        }
      }
    }, 800);
  };

  // Progress to next question or completion (11 questions total)
  const handleNextQuestion = () => {
    if (isAdvancingQuestionRef.current) return;
    isAdvancingQuestionRef.current = true;

    setShowPrizeProgressionModal(false);
    setHandoverBanner(null);
    const isLastQuestion = currentQuestionIndex === LADDER_LEVELS.length - 1;
    const lastAnswer = answeredHistory[answeredHistory.length - 1];

    if (!lastAnswer?.isCorrect) {
      if (gameMode === 'multiplayer') {
        // If both players are eliminated, then it's game over
        if (isUserEliminated && isOpponentEliminated) {
          saveGameResult();
          setGameState('gameover');
          isAdvancingQuestionRef.current = false;
          return;
        }
        // If one was eliminated, the surviving player continues!
      } else {
        saveGameResult();
        gameAudio.playMillionaireWrong();
        setGameState('gameover');
        isAdvancingQuestionRef.current = false;
        return;
      }
    }

    if (isLastQuestion) {
      saveGameResult();
      gameAudio.playVictoryFanfare();
      setGameState('victory');
      isAdvancingQuestionRef.current = false;
      return;
    }

    if (!isSoundMuted) gameAudio.playTurnSwitch();

    // Move to next question strictly one step at a time
    setCurrentQuestionIndex((prev) => prev + 1);
    setSelectedOption(null);
    setEliminatedOptions([]);
    setQuestionTimer(60);
    setIsTimeOutLoss(false);
    setGameState('playing');

    setTimeout(() => {
      isAdvancingQuestionRef.current = false;
    }, 400);
  };

  // Save student result
  const saveGameResult = () => {
    const reachedQuestionCount = Math.min(currentQuestionIndex + 1, LADDER_LEVELS.length);
    const lastAnswer = answeredHistory[answeredHistory.length - 1];
    const completed = reachedQuestionCount >= LADDER_LEVELS.length && Boolean(lastAnswer?.isCorrect);
    const platformReward = getMillionaireReward(reachedQuestionCount, LADDER_LEVELS.length, completed);

    if (!rewardIssuedRef.current) {
      rewardIssuedRef.current = true;
      onScoreUpdate?.(platformReward);
    }

    const result: StudentGameResult = {
      studentId: 'student-current',
      lessonId,
      gameId: gameConfig.gameId,
      score: accumulatedPoints,
      correctAnswers: correctAnswersCount,
      wrongAnswers: wrongAnswersCount,
      completedAt: new Date().toISOString(),
      pointsEarned: platformReward,
      maxLevelReached: reachedQuestionCount,
    };

    try {
      const existing = localStorage.getItem('student_millionaire_results') || '[]';
      const parsed = JSON.parse(existing);
      parsed.unshift(result);
      localStorage.setItem('student_millionaire_results', JSON.stringify(parsed.slice(0, 20)));
    } catch (e) {}
  };

  // --- Lifelines Logic ---
  const handleLifelineFiftyFifty = () => {
    if (usedFiftyFifty || gameState !== 'playing' || !isYourTurn) return;

    gameAudio.playLifelineMagic();
    setUsedFiftyFifty(true);
    const correctIdx = currentQuestion.correctAnswer;
    const wrongIndices = [0, 1, 2, 3].filter((idx) => idx !== correctIdx);
    const shuffled = [...wrongIndices].sort(() => 0.5 - Math.random());
    setEliminatedOptions([shuffled[0], shuffled[1]]);
  };

  const handleLifelineAudience = () => {
    if (usedAudience || gameState !== 'playing' || !isYourTurn) return;

    gameAudio.playAudienceCheer();
    setUsedAudience(true);
    const correctIdx = currentQuestion.correctAnswer;
    const correctPercent = Math.floor(Math.random() * 21) + 60;
    let remaining = 100 - correctPercent;

    const remainingIndices = [0, 1, 2, 3].filter(
      (idx) => idx !== correctIdx && !eliminatedOptions.includes(idx)
    );

    const votes = [0, 0, 0, 0];
    votes[correctIdx] = correctPercent;

    remainingIndices.forEach((idx, index) => {
      if (index === remainingIndices.length - 1) {
        votes[idx] = remaining;
      } else {
        const share = Math.floor(Math.random() * (remaining / 2));
        votes[idx] = share;
        remaining -= share;
      }
    });

    setAudiencePercentages(votes);
    setShowAudienceModal(true);
  };

  const handleLifelineCallFriend = () => {
    if (usedCallFriend || gameState !== 'playing' || !isYourTurn) return;

    gameAudio.playPhoneRing();
    setUsedCallFriend(true);
    setCallFriendState('calling');
    setShowCallFriendModal(true);

    setTimeout(() => {
      gameAudio.playClick(440);
      setCallFriendState('speaking');
    }, 2000);
  };

  const handleLifelineSwitchQuestion = () => {
    if (usedSwitchQuestion || gameState !== 'playing' || !isYourTurn) return;

    gameAudio.playLifelineMagic();
    setUsedSwitchQuestion(true);
    setQuestionTimer(60);
    setEliminatedOptions([]);
    setSelectedOption(null);

    if (gameConfig.backupQuestion) {
      const updatedQuestions = [...gameConfig.questions];
      updatedQuestions[currentQuestionIndex] = gameConfig.backupQuestion;
      setGameConfig({ ...gameConfig, questions: updatedQuestions });
    }
  };

  const getOptionPrefix = (index: number) => {
    switch (index) {
      case 0:
        return 'أ:';
      case 1:
        return 'ب:';
      case 2:
        return 'ج:';
      case 3:
        return 'د:';
      default:
        return '';
    }
  };

  return (
    <div
      id="millionaire-game-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none font-cairo"
      dir="rtl"
    >
      {/* Outer Studio Frame */}
      <div className="relative w-full max-w-5xl h-[92vh] sm:h-[88vh] bg-gradient-to-b from-[#020617] via-[#050e2d] to-[#020617] rounded-3xl border-2 border-[#1e4193] shadow-[0_0_50px_rgba(30,65,147,0.5)] flex flex-col overflow-hidden text-white">
        {/* Subtle Background Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Bar */}
        <div className="relative z-20 px-3 sm:px-4 py-2.5 sm:py-3 border-b border-[#1f3f82]/50 bg-[#04091e]/95 backdrop-blur-md transition-all duration-300">
          <div className="flex items-center justify-between w-full gap-2">
            {/* Logo & Lesson Identity */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 p-0.5 shadow-lg shadow-amber-500/20">
                <div className="w-full h-full rounded-2xl bg-[#060e28] flex items-center justify-center text-amber-400">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xs sm:text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400">
                    من سيربح المليون؟
                  </h2>
                  <span className="text-[10px] bg-[#0c1f54] text-sky-300 px-2 py-0.5 rounded-full border border-sky-400/30 font-bold hidden sm:inline-block">
                    جائزة 1,000,000 دينار
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-blue-200/80 truncate max-w-[140px] sm:max-w-md">
                  {lessonTitle}
                </p>
              </div>
            </div>

            {/* Center / Right: Opponent Profile Button with Animated Message Count Badge (1, 2, ...) */}
            {gameMode === 'multiplayer' &&
              gameState !== 'start' &&
              gameState !== 'searching_match' &&
              gameState !== 'match_found' && (
                <button
                  id="header-opponent-chat-btn"
                  onClick={() => {
                    setIsChatModalOpen(true);
                    setUnreadMessagesCount(0);
                    setHasNewChatNotification(false);
                  }}
                  className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-cyan-950/90 to-[#0b245c] border-2 border-cyan-400/70 hover:border-cyan-300 rounded-2xl shadow-[0_0_20px_rgba(6,182,212,0.35)] transition-all active:scale-95 group cursor-pointer"
                  title="فتح محادثة ماسنجر مع المنافس"
                >
                  {/* Avatar with unread number badge directly in front of / on avatar */}
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 to-blue-500 shadow-md">
                      <img
                        src={selectedOpponent.avatar}
                        alt={selectedOpponent.name}
                        className="w-full h-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#07163d] animate-pulse" />

                    {/* 🔴 Unread Badge (1, 2, ...) */}
                    {unreadMessagesCount > 0 && (
                      <span
                        id="opponent-badge-count-header"
                        className="absolute -top-2 -left-2 min-w-[20px] h-5 px-1 bg-gradient-to-r from-rose-500 to-red-600 text-white font-black text-[11px] rounded-full flex items-center justify-center border-2 border-white shadow-[0_0_12px_rgba(244,63,94,0.9)] animate-bounce font-mono z-10"
                      >
                        {unreadMessagesCount}
                      </span>
                    )}
                  </div>

                  <div className="hidden sm:flex flex-col text-right">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-white">{selectedOpponent.name}</span>
                      <MessageCircle className="w-3 h-3 text-cyan-400 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="text-[9px] text-cyan-300 font-bold truncate max-w-[120px]">
                      {selectedOpponent.city} • انقر للمحادثة 💬
                    </span>
                  </div>

                  {/* Icon for mobile */}
                  <div className="sm:hidden p-1 rounded-lg bg-cyan-500/20 text-cyan-300">
                    <MessageCircle className="w-3.5 h-3.5" />
                  </div>
                </button>
              )}

            {/* Right Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-[#0e1d47] text-gray-300 hover:text-white border border-[#1f3f82]/60 hover:bg-red-500/20 transition-all cursor-pointer"
                title="إغلاق"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Body Grid Layout */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col lg:flex-row gap-4 relative z-10 justify-between">
          {/* LEFT/CENTER AREA: Game Stages */}
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {/* 1. START SCREEN (شعار المليون الدائري + اللعب فردي + اللعب جماعي + زر الخروج فقط) */}
            {gameState === 'start' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6 space-y-8 my-auto max-w-md mx-auto w-full">
                {/* Glowing Circular TV Logo Emblem ONLY (الشعار الدائري الذهبي) */}
                <div className="relative w-36 h-36 mx-auto">
                  <div className="absolute inset-0 rounded-full bg-amber-400/25 animate-ping blur-2xl opacity-60 pointer-events-none" />
                  <div className="w-full h-full rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-200 p-1.5 shadow-[0_0_40px_rgba(245,158,11,0.6)] flex items-center justify-center animate-pulse">
                    <div className="w-full h-full rounded-full bg-[#060c24] border-2 border-amber-400 flex flex-col items-center justify-center p-2 text-amber-400">
                      <GraduationCap className="w-12 h-12 mb-1 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
                      <span className="text-[11px] font-black tracking-widest text-white uppercase drop-shadow">
                        1,000,000
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subtitle / Mode Selection Header */}
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-[#F3C64A] tracking-wide">
                    سؤال المليون دينار
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-200/90 font-medium">
                    11 سؤالاً متدرجاً نحو الجائزة الكبرى — اختر نمط اللعب
                  </p>
                </div>

                {/* The 3 Action Buttons (اللعب فردي + اللعب جماعي + خروج) */}
                <div className="w-full space-y-3 pt-2">
                  {/* 1. Single Player Button */}
                  <button
                    id="btn-millionaire-single-player"
                    onClick={handleStartSinglePlayer}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black rounded-2xl shadow-[0_0_25px_rgba(245,158,11,0.4)] flex items-center justify-between px-6 text-sm sm:text-base transition-all active:scale-95 group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-black">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="text-right">
                        <span className="block font-black text-base">اللعب فردي</span>
                        <span className="text-[10px] text-black/80 font-bold block">
                          خض التحدي بمفردك واصعد سلم الجوائز
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
                  </button>

                  {/* 2. Multiplayer Button */}
                  <button
                    id="btn-millionaire-multiplayer"
                    onClick={onOpenOnline || handleStartMultiplayerSearch}
                    disabled={Boolean(onOpenOnline && !import.meta.env.VITE_ONLINE_CHALLENGE_API_URL)}
                    className="w-full py-4 bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-600 hover:from-sky-400 hover:to-cyan-300 text-black font-black rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-between px-6 text-sm sm:text-base transition-all active:scale-95 group cursor-pointer border border-cyan-300/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-black">
                        <Swords className="w-5 h-5 animate-pulse" />
                      </div>
                      <div className="text-right">
                        <span className="block font-black text-base">اللعب جماعي (تحدي مباشر)</span>
                        <span className="text-[10px] text-black/80 font-bold block">
                          تحدَّ لاعباً حقيقياً وتبادلا الأدوار
                        </span>
                      </div>
                    </div>
                    <Radio className="w-5 h-5 text-black group-hover:scale-110 transition-transform animate-spin" />
                  </button>

                  {/* 3. Exit Button */}
                  <button
                    id="btn-millionaire-exit"
                    onClick={onClose}
                    className="w-full py-3 bg-[#0c183d]/80 hover:bg-rose-950/40 text-gray-300 hover:text-rose-300 font-bold rounded-2xl border border-blue-900/60 hover:border-rose-500/40 text-xs transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <X className="w-4 h-4" />
                    <span>خروج من اللعبة</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. CLASH OF CLANS STYLE MATCHMAKING SEARCH (جاري البحث عن لاعب قريب) */}
            {gameState === 'searching_match' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6 space-y-6 my-auto max-w-lg mx-auto w-full animate-in fade-in">
                {/* Clash of Clans Radar Swirling Scanner */}
                <div className="relative w-44 h-44 flex items-center justify-center">
                  {/* Outer Radar Rings */}
                  <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 animate-ping opacity-50" />
                  <div className="absolute inset-3 rounded-full border-2 border-cyan-400/40 animate-pulse" />
                  <div className="absolute inset-8 rounded-full border border-sky-400/50" />

                  {/* Rotating Sonar Beam */}
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div className="w-1/2 h-1/2 bg-gradient-to-br from-cyan-400/40 to-transparent origin-bottom-right animate-spin rounded-tl-full" />
                  </div>

                  {/* Center Radar Core */}
                  <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-b from-[#0e2a63] to-[#040b1e] border-2 border-cyan-300 shadow-[0_0_30px_rgba(6,182,212,0.6)] flex flex-col items-center justify-center text-cyan-300">
                    <Radio className="w-8 h-8 animate-pulse text-cyan-300 mb-1" />
                    <span className="text-[10px] font-mono font-black text-cyan-200 tracking-wider">
                      00:{searchTimer < 10 ? `0${searchTimer}` : searchTimer}
                    </span>
                  </div>
                </div>

                {/* Radar Searching Texts */}
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-950/60 border border-cyan-500/40 rounded-full text-xs text-cyan-300 font-bold">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>جاري البحث عن لاعب قريب...</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-black text-white">
                    {SEARCH_RADAR_PHRASES[searchPhraseIndex]}
                  </h3>
                  <p className="text-xs text-blue-200/80">
                    البحث في نطاق المحافظات العراقية حسب مستوى المادة ({gameConfig.subject})
                  </p>
                </div>

                {/* Cancel Search Button */}
                <button
                  onClick={() => setGameState('start')}
                  className="px-6 py-2.5 bg-[#0e1d47] hover:bg-red-500/20 text-gray-300 hover:text-red-300 rounded-xl border border-blue-800 text-xs font-bold transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>إلغاء البحث والرجوع</span>
                </button>
              </div>
            )}

            {/* 3. MATCH FOUND CELEBRATION (VS SCREEN WITH 3s COUNTDOWN) */}
            {gameState === 'match_found' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6 space-y-6 my-auto max-w-xl mx-auto w-full animate-in zoom-in-95 duration-300">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-950/80 border border-emerald-500/60 rounded-full text-xs text-emerald-300 font-black shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>تم العثور على منافس قريب بنجاح!</span>
                </div>

                {/* VS Matchup Cards */}
                <div className="w-full grid grid-cols-11 items-center gap-2 bg-[#061233]/90 border-2 border-amber-400/50 rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-amber-500/10 to-blue-600/10 pointer-events-none" />

                  {/* Left: You (أنت) */}
                  <div className="col-span-5 flex flex-col items-center space-y-2">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 p-1 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                      <div className="w-full h-full rounded-full bg-[#09153a] flex items-center justify-center text-amber-400 font-black text-xl">
                        أنت
                      </div>
                    </div>
                    <span className="font-extrabold text-sm sm:text-base text-white">اللاعب الحالي</span>
                    <span className="text-[11px] text-amber-300 font-bold bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                      بطل المسابقة 👑
                    </span>
                  </div>

                  {/* Center: VS Emblem */}
                  <div className="col-span-1 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-amber-500 flex items-center justify-center font-black text-black text-xs shadow-lg animate-bounce">
                      VS
                    </div>
                  </div>

                  {/* Right: Opponent Profile */}
                  <div className="col-span-5 flex flex-col items-center space-y-2">
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-400 p-1 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                      <img
                        src={selectedOpponent.avatar}
                        alt={selectedOpponent.name}
                        className="w-full h-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-[#09153a] rounded-full" />
                    </div>
                    <span className="font-extrabold text-sm sm:text-base text-white truncate max-w-[130px]">
                      {selectedOpponent.name}
                    </span>
                    <span className="text-[10px] text-cyan-300 font-bold bg-cyan-950 px-2 py-0.5 rounded-full border border-cyan-400/40">
                      {selectedOpponent.city}
                    </span>
                  </div>
                </div>

                {/* Countdown to Battle */}
                <div className="space-y-1">
                  <div className="text-3xl font-mono font-black text-amber-400 animate-pulse">
                    تبدأ المواجهة خلال {matchCountdown}...
                  </div>
                  <p className="text-xs text-blue-200">
                    نظام تبادل الأدوار: سؤال لك وسؤال للمنافس نحو المليون دينار!
                  </p>
                </div>
              </div>
            )}

            {/* 4. PLAYING / CHECKING / ANSWERED STAGES */}
            {(gameState === 'playing' || gameState === 'checking' || gameState === 'answered') && (
              <div className="flex-1 flex flex-col justify-between space-y-3 sm:space-y-4">
                {/* TOP TV HUD: Circular Lifelines Bar + Turn Banner & Question Timer */}
                <div className="bg-gradient-to-r from-[#040a1f] via-[#09153a] to-[#040a1f] border-2 border-[#1e4193]/80 rounded-2xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_30px_rgba(16,42,107,0.5)]">
                  {/* Left Side: Circular Lifelines */}
                  <div className="flex items-center gap-2 sm:gap-2.5 justify-center sm:justify-start">
                    {/* 1. Sound Toggle */}
                    <button
                      type="button"
                      onClick={handleToggleSound}
                      className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full p-[2px] shadow-lg transition-all active:scale-95 group ${
                        isSoundMuted
                          ? 'bg-gradient-to-tr from-gray-700 to-gray-500'
                          : 'bg-gradient-to-tr from-sky-500 via-blue-400 to-sky-200 shadow-blue-500/40'
                      }`}
                      title={isSoundMuted ? 'تفعيل الصوت' : 'كتم الصوت'}
                    >
                      <div className="w-full h-full rounded-full bg-gradient-to-b from-[#0e1d47] to-[#040a1c] border border-white/20 flex items-center justify-center">
                        {isSoundMuted ? (
                          <VolumeX className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-sky-400" />
                        )}
                      </div>
                    </button>

                    {/* 2. Call Friend */}
                    <button
                      type="button"
                      disabled={usedCallFriend || gameState !== 'playing' || !isYourTurn}
                      onClick={handleLifelineCallFriend}
                      className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full p-[2px] shadow-lg transition-all group ${
                        usedCallFriend || !isYourTurn
                          ? 'bg-gray-800 opacity-40 cursor-not-allowed'
                          : 'bg-gradient-to-tr from-emerald-600 to-green-400 hover:scale-105 active:scale-95'
                      }`}
                      title="اتصال بصديق أو مُعلم"
                    >
                      <div className="w-full h-full rounded-full bg-[#052b1b] border border-emerald-400/40 flex items-center justify-center relative overflow-hidden">
                        <Phone className="w-4 h-4 text-emerald-400" />
                        {usedCallFriend && (
                          <div className="absolute inset-0 bg-red-950/70 flex items-center justify-center">
                            <span className="text-red-500 font-bold text-xs">✕</span>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* 3. Audience Poll */}
                    <button
                      type="button"
                      disabled={usedAudience || gameState !== 'playing' || !isYourTurn}
                      onClick={handleLifelineAudience}
                      className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full p-[2px] shadow-lg transition-all group ${
                        usedAudience || !isYourTurn
                          ? 'bg-gray-800 opacity-40 cursor-not-allowed'
                          : 'bg-gradient-to-tr from-rose-600 to-pink-400 hover:scale-105 active:scale-95'
                      }`}
                      title="رأي وتصويت الجمهور"
                    >
                      <div className="w-full h-full rounded-full bg-[#330814] border border-rose-400/40 flex items-center justify-center relative overflow-hidden">
                        <BarChart3 className="w-4 h-4 text-rose-400" />
                        {usedAudience && (
                          <div className="absolute inset-0 bg-red-950/70 flex items-center justify-center">
                            <span className="text-red-500 font-bold text-xs">✕</span>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* 4. 50:50 */}
                    <button
                      type="button"
                      disabled={usedFiftyFifty || gameState !== 'playing' || !isYourTurn}
                      onClick={handleLifelineFiftyFifty}
                      className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full p-[2px] shadow-lg transition-all group ${
                        usedFiftyFifty || !isYourTurn
                          ? 'bg-gray-800 opacity-40 cursor-not-allowed'
                          : 'bg-gradient-to-tr from-amber-600 to-yellow-400 hover:scale-105 active:scale-95'
                      }`}
                      title="حذف خيارين (50:50)"
                    >
                      <div className="w-full h-full rounded-full bg-[#2e1c05] border border-amber-400/50 flex items-center justify-center relative overflow-hidden text-amber-300 font-black text-[9px] sm:text-[10px] font-mono">
                        <span>50:50</span>
                        {usedFiftyFifty && (
                          <div className="absolute inset-0 bg-red-950/70 flex items-center justify-center">
                            <span className="text-red-500 font-bold text-xs">✕</span>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* 5. Switch Question */}
                    <button
                      type="button"
                      disabled={usedSwitchQuestion || gameState !== 'playing' || !isYourTurn}
                      onClick={handleLifelineSwitchQuestion}
                      className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full p-[2px] shadow-lg transition-all group ${
                        usedSwitchQuestion || !isYourTurn
                          ? 'bg-gray-800 opacity-40 cursor-not-allowed'
                          : 'bg-gradient-to-tr from-cyan-600 to-sky-400 hover:scale-105 active:scale-95'
                      }`}
                      title="تغيير السؤال وتجديد الوقت"
                    >
                      <div className="w-full h-full rounded-full bg-[#062438] border border-cyan-400/40 flex items-center justify-center relative overflow-hidden">
                        <RefreshCw className="w-4 h-4 text-cyan-300" />
                        {usedSwitchQuestion && (
                          <div className="absolute inset-0 bg-red-950/70 flex items-center justify-center">
                            <span className="text-red-500 font-bold text-xs">✕</span>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>

                  {/* Center: Active Turn Indicator for Multiplayer */}
                  {gameMode === 'multiplayer' && (
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 border transition-all ${
                        isUserEliminated && !isOpponentEliminated
                          ? 'bg-rose-950/80 text-rose-300 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                          : isOpponentEliminated && !isUserEliminated
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-400/50 shadow-[0_0_15px_rgba(52,211,153,0.3)] animate-pulse'
                          : isYourTurn
                          ? 'bg-amber-500/20 text-amber-300 border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.3)] animate-pulse'
                          : 'bg-cyan-950/80 text-cyan-300 border-cyan-400/50'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>
                        {isUserEliminated && !isOpponentEliminated
                          ? `⚠️ خسرت محاولتك — الأسئلة انتقلت لـ ${selectedOpponent.name} (أنت تشاهد)`
                          : isOpponentEliminated && !isUserEliminated
                          ? `👑 خسر ${selectedOpponent.name} — الأسئلة انتقلت إليك بالكامل لتفوز بالمليون!`
                          : isYourTurn
                          ? `السؤال ${currentQuestionIndex + 1} (لك) — دورك للإجابة الآن! ⭐`
                          : `السؤال ${currentQuestionIndex + 1} (لـ ${selectedOpponent.name}) — دور المنافس للتفكير... ⏳`}
                      </span>
                    </div>
                  )}

                  {/* Right: Question Number & 60s Countdown Timer */}
                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="text-[11px] font-extrabold text-blue-200 flex items-center gap-1.5">
                        <span className="text-amber-400">السؤال:</span>
                        <span>{currentQuestionIndex + 1} من 11</span>
                      </div>
                      <div className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                        <span className="text-blue-300">الجائزة:</span>
                        <span className="font-mono font-black">{currentLadder.label}</span>
                      </div>
                    </div>

                    {/* ⏱️ 60-Second Countdown Digital Timer */}
                    <div
                      id="millionaire-question-timer"
                      className={`relative flex items-center justify-center px-3 py-1.5 rounded-2xl border-2 transition-all ${
                        questionTimer <= 10
                          ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.6)] animate-pulse'
                          : questionTimer <= 20
                          ? 'bg-amber-950/80 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                          : 'bg-[#061233]/90 border-sky-400/50 text-sky-200'
                      }`}
                    >
                      <div className="flex items-center gap-1 font-mono font-black text-xs sm:text-sm">
                        <Clock className={`w-3.5 h-3.5 ${questionTimer <= 10 ? 'text-rose-400 animate-spin' : 'text-amber-400'}`} />
                        <span>{questionTimer < 10 ? `0${questionTimer}` : questionTimer}s</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* THE QUESTION DISPLAY BOX */}
                <div
                  id="millionaire-question-box"
                  className="relative bg-gradient-to-b from-[#071339] via-[#040c26] to-[#071339] border-2 border-[#2049a4] rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-center shadow-[0_0_35px_rgba(18,48,128,0.5)] flex flex-col justify-center min-h-[110px] sm:min-h-[130px]"
                >
                  <div className="text-sm sm:text-lg font-black text-white leading-relaxed">
                    <ScientificText value={currentQuestion.question} />
                  </div>
                  {gameMode === 'multiplayer' && !isYourTurn && (
                    <div className="mt-2 text-xs font-bold text-cyan-300 flex items-center justify-center gap-1.5 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                      <span>{selectedOpponent.name} يفكّر في الإجابة واختيار الخيار الصحيح...</span>
                    </div>
                  )}
                </div>

                {/* 4 MULTIPLE CHOICE OPTIONS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {currentQuestion.options.map((optionText, idx) => {
                    const isEliminated = eliminatedOptions.includes(idx);
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === currentQuestion.correctAnswer;

                    let cardStyle =
                      'bg-gradient-to-r from-[#071233] to-[#03091e] border-[#1c3e8a] hover:border-amber-400 text-blue-100 hover:text-white shadow-md';

                    if (isEliminated) {
                      cardStyle =
                        'bg-[#020512]/60 border-blue-950/30 text-gray-700 opacity-20 cursor-not-allowed';
                    } else if (gameState === 'checking' && isSelected) {
                      cardStyle =
                        'bg-amber-500/30 border-amber-400 text-amber-300 font-extrabold animate-pulse shadow-[0_0_25px_rgba(245,158,11,0.6)]';
                    } else if (gameState === 'answered') {
                      if (isCorrect) {
                        cardStyle =
                          'bg-emerald-600/30 border-emerald-400 text-emerald-300 font-extrabold shadow-[0_0_25px_rgba(16,185,129,0.7)]';
                      } else if (isSelected && !isCorrect) {
                        cardStyle =
                          'bg-rose-600/30 border-rose-500 text-rose-300 font-extrabold shadow-[0_0_25px_rgba(244,63,94,0.7)]';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={
                          isEliminated ||
                          gameState !== 'playing' ||
                          (gameMode === 'multiplayer' && !isYourTurn)
                        }
                        onClick={() => handleSelectOption(idx, false)}
                        className={`p-0.5 rounded-2xl transition-all duration-200 active:scale-[0.98] ${
                          isEliminated || (gameMode === 'multiplayer' && !isYourTurn)
                            ? 'cursor-default'
                            : 'cursor-pointer'
                        }`}
                      >
                        <div
                          className={`w-full p-3 sm:p-4 rounded-2xl border flex items-center justify-between text-xs sm:text-sm text-right transition-all relative overflow-hidden ${cardStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-[#F3C64A] font-black text-sm shrink-0">
                              {getOptionPrefix(idx)}
                            </span>
                            <span className="font-semibold leading-relaxed"><ScientificText value={optionText} /></span>
                          </div>

                          {/* Opponent Locked Choice Tag */}
                          {gameMode === 'multiplayer' && !isYourTurn && isSelected && (
                            <div className="flex items-center gap-1 bg-[#091e4a] border border-cyan-400 px-2 py-0.5 rounded-full text-[9px] text-cyan-200 font-black shrink-0 mr-1 shadow-md">
                              <img
                                src={selectedOpponent.avatar}
                                alt={selectedOpponent.name}
                                className="w-3.5 h-3.5 rounded-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <span>اختيار {selectedOpponent.name}</span>
                            </div>
                          )}

                          {/* Status Icons */}
                          {gameState === 'answered' && isCorrect && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 ml-1" />
                          )}
                          {gameState === 'answered' && isSelected && !isCorrect && (
                            <XCircle className="w-5 h-5 text-rose-400 shrink-0 ml-1" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Answer Explanation & Next Question Action */}
                {gameState === 'answered' && (
                  <div className="bg-[#081538] border border-amber-500/40 p-3.5 sm:p-4 rounded-2xl space-y-2.5 animate-in fade-in shadow-xl">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`font-bold flex items-center gap-1.5 ${
                          isTimeOutLoss
                            ? 'text-rose-400'
                            : selectedOption === currentQuestion.correctAnswer
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {isTimeOutLoss ? (
                          <>
                            <Clock className="w-4 h-4 text-rose-400" />
                            انتهى الوقت المحدد (60 ثانية) دون إجابة!
                          </>
                        ) : selectedOption === currentQuestion.correctAnswer ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            إجابة صحيحة مائة بالمائة! 🎉
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-rose-400" />
                            للأسف إجابة غير صحيحة
                          </>
                        )}
                      </span>

                      <span className="text-blue-300 text-[11px]">التوضيح العلمي:</span>
                    </div>

                    <p className="text-xs text-blue-100 leading-relaxed bg-[#040a1d] p-2.5 sm:p-3 rounded-xl border border-blue-900/50">
                      <ScientificText value={currentQuestion.explanation} />
                    </p>

                    {/* Handover Notice Alert inside Answer Panel if active */}
                    {handoverBanner?.show && (
                      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950 via-indigo-950 to-blue-950 border-2 border-cyan-400/70 shadow-[0_0_20px_rgba(6,182,212,0.3)] text-right space-y-1.5 animate-in fade-in">
                        <div className="flex items-center gap-2 text-cyan-300 font-extrabold text-xs">
                          <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
                          <span>{handoverBanner.title}</span>
                        </div>
                        <p className="text-xs text-blue-100 leading-relaxed">
                          {handoverBanner.message}
                        </p>
                      </div>
                    )}

                    <button
                      onClick={handleNextQuestion}
                      className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-extrabold rounded-xl shadow-lg flex items-center justify-center gap-2 text-xs transition-all active:scale-95 cursor-pointer"
                    >
                      <span>
                        {(() => {
                          const isCorrect = selectedOption === currentQuestion.correctAnswer && !isTimeOutLoss;
                          if (currentQuestionIndex === 10 && isCorrect) {
                            return 'تتويج بطل المليونير 🏆';
                          }
                          if (isCorrect) {
                            return 'الانتقال للسؤال التالي ➔';
                          }
                          // Wrong answer or timeout
                          if (gameMode === 'multiplayer') {
                            if (isUserEliminated && isOpponentEliminated) {
                              return 'عرض النتيجة النهائية ➔';
                            }
                            if (isUserEliminated) {
                              return `متابعة التحدي مع ${selectedOpponent.name} (انتقلت الأسئلة له) ➔`;
                            }
                            if (isOpponentEliminated) {
                              return 'استلام جميع الأسئلة ومواصلة التحدي ➔';
                            }
                          }
                          return 'عرض النتيجة النهائية';
                        })()}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 5. VICTORY SCREEN (11 QUESTIONS CLEARED) */}
            {gameState === 'victory' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-6 space-y-5 animate-in fade-in">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 p-1 shadow-[0_0_40px_rgba(245,158,11,0.6)] animate-bounce">
                  <div className="w-full h-full rounded-full bg-[#050d28] border-2 border-amber-400 flex items-center justify-center text-amber-400">
                    <Trophy className="w-12 h-12" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-[#F3C64A]">
                    🎉 ألف مبروك! ربحت المليون دينار!
                  </h2>
                  <p className="text-xs sm:text-sm text-blue-200">
                    أكملت جميع أسئلة الـ 11 بنجاح استثنائي واقتدار تام 🏆
                  </p>
                </div>

                <div className="w-full bg-[#09153a] border border-amber-500/40 p-4 rounded-2xl grid grid-cols-2 gap-3 text-xs text-right">
                  <div className="bg-[#050d26] p-3 rounded-xl border border-blue-900/40">
                    <span className="text-[10px] text-blue-300 block">الجائزة المحققة</span>
                    <span className="text-base font-black text-amber-400 mt-0.5 block font-mono">
                      1 000 000 د.ع
                    </span>
                  </div>

                  <div className="bg-[#050d26] p-3 rounded-xl border border-blue-900/40">
                    <span className="text-[10px] text-blue-300 block">الإجابات الصحيحة</span>
                    <span className="text-base font-bold text-emerald-400 mt-0.5 block">
                      11 / 11
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 w-full pt-2">
                  <button
                    onClick={resetGame}
                    className="flex-1 py-3.5 bg-[#0e1d47] hover:bg-[#152a63] text-white font-bold rounded-2xl border border-blue-800 text-xs flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span>إعادة اللعب</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span>العودة للدرس</span>
                  </button>
                </div>
              </div>
            )}

            {/* 6. GAME OVER SCREEN */}
            {gameState === 'gameover' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-4 space-y-4 animate-in fade-in">
                <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500/50 flex items-center justify-center text-rose-400 mx-auto">
                  <Flame className="w-8 h-8" />
                </div>

                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-white">انتهت المحاولة الحالية</h3>
                  <p className="text-xs text-blue-200">
                    محاولة ممتازة! الهدف هو تثبيت المفاهيم وتصحيح الأخطاء 💪
                  </p>
                </div>

                <div className="w-full bg-[#09153a] border border-blue-900/50 p-4 rounded-2xl grid grid-cols-2 gap-3 text-xs text-right">
                  <div className="bg-[#050d26] p-3 rounded-xl border border-blue-900/40">
                    <span className="text-[10px] text-blue-300 block">الرصيد المضمون المحقق</span>
                    <span className="text-base font-black text-amber-400 mt-0.5 block font-mono">
                      {accumulatedPoints >= 500000
                        ? '500 000 د.ع'
                        : accumulatedPoints >= 100000
                        ? '100 000 د.ع'
                        : '0 د.ع'}
                    </span>
                  </div>

                  <div className="bg-[#050d26] p-3 rounded-xl border border-blue-900/40">
                    <span className="text-[10px] text-blue-300 block">وصلت للسؤال</span>
                    <span className="text-base font-bold text-white mt-0.5 block">
                      {currentQuestionIndex + 1} من 11
                    </span>
                  </div>
                </div>

                <div className="flex gap-3 w-full pt-2">
                  <button
                    onClick={resetGame}
                    className="flex-1 py-3.5 bg-[#0e1d47] hover:bg-[#152a63] text-white font-bold rounded-2xl border border-blue-800 text-xs flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span>محاولة جديدة</span>
                  </button>

                  <button
                    onClick={onClose}
                    className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2"
                  >
                    <span>العودة للدرس</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR: Multiplayer Opponent Avatar + Ladder Stack */}
          <div className="hidden lg:flex w-64 bg-[#050b1f]/90 border border-[#1f3f82]/60 rounded-2xl p-3.5 flex-col justify-between shrink-0 shadow-xl space-y-3">
            {/* OPPONENT CARD IN MULTIPLAYER MODE */}
            {gameMode === 'multiplayer' && gameState !== 'start' && gameState !== 'searching_match' && (
              <div
                id="opponent-profile-widget"
                className="bg-gradient-to-b from-[#09183f] to-[#040c24] border-2 border-cyan-400/50 rounded-2xl p-3 shadow-[0_0_20px_rgba(6,182,212,0.25)] space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setIsChatModalOpen(true);
                          setUnreadMessagesCount(0);
                          setHasNewChatNotification(false);
                        }}
                        className="w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr from-cyan-400 to-blue-500 hover:scale-105 transition-transform cursor-pointer relative"
                        title="انقر لفتح محادثة ماسنجر"
                      >
                        <img
                          src={selectedOpponent.avatar}
                          alt={selectedOpponent.name}
                          className="w-full h-full rounded-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#09183f] rounded-full animate-pulse" />
                      </button>

                      {/* 🔴 Numeric Unread Badge (1, 2, ...) */}
                      {unreadMessagesCount > 0 && (
                        <span className="absolute -top-1.5 -left-1.5 min-w-[20px] h-5 px-1 bg-gradient-to-r from-rose-500 to-red-600 rounded-full text-[10px] font-black flex items-center justify-center text-white border-2 border-white shadow-[0_0_10px_rgba(244,63,94,0.9)] animate-bounce font-mono z-10">
                          {unreadMessagesCount}
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-white block truncate max-w-[120px]">
                        {selectedOpponent.name}
                      </span>
                      <span className="text-[10px] text-cyan-300 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-cyan-400" />
                        {selectedOpponent.city}
                      </span>
                    </div>
                  </div>

                  {/* Messenger Chat Icon Button */}
                  <button
                    onClick={() => {
                      setIsChatModalOpen(true);
                      setUnreadMessagesCount(0);
                      setHasNewChatNotification(false);
                    }}
                    className="p-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-400/40 text-cyan-300 hover:text-white transition-all active:scale-95 relative cursor-pointer"
                    title="محادثة ماسنجر"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>

                {/* Speech Bubble: "ماذا يقول لك" */}
                <div
                  onClick={() => {
                    setIsChatModalOpen(true);
                    setUnreadMessagesCount(0);
                    setHasNewChatNotification(false);
                  }}
                  className="bg-[#050e26] border border-cyan-500/30 p-2 rounded-xl text-[11px] text-cyan-100 leading-relaxed cursor-pointer hover:border-cyan-400 transition-colors relative"
                >
                  <span className="text-[9px] text-cyan-400 font-bold block mb-0.5">
                    💬 ماذا يقول لك:
                  </span>
                  <p className="line-clamp-2 italic">"{opponentSpeech}"</p>
                  <span className="text-[9px] text-sky-400 font-bold block text-left mt-1">
                    انقر للرد عليه ➔
                  </span>
                </div>
              </div>
            )}

            {/* Exact 11 Ladder Stack (من 1,000,000 د.ع إلى 250 د.ع) */}
            <div className="space-y-2 flex-1">
              <div className="flex items-center justify-between border-b border-blue-900/60 pb-1.5">
                <span className="text-xs font-black text-[#E5B869] flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-400" />
                  سلم جوائز المليون دينار
                </span>
                <span className="text-[10px] text-blue-300">11 سؤالاً</span>
              </div>

              <div className="space-y-1 text-xs overflow-y-auto max-h-[380px] pr-1">
                {LADDER_LEVELS.slice()
                  .reverse()
                  .map((item) => {
                    const idx = item.level - 1;
                    const isCurrent = currentQuestionIndex === idx && gameState !== 'start';
                    const isPassed = currentQuestionIndex > idx;

                    let rowStyle = 'bg-[#03081a]/60 border-blue-900/30 text-blue-200/70';

                    if (isCurrent) {
                      rowStyle =
                        'bg-emerald-500 text-black font-black border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] scale-[1.02]';
                    } else if (isPassed) {
                      rowStyle = 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400 font-bold';
                    } else if (item.isSafety) {
                      rowStyle = 'bg-[#0a173d] border-amber-500/40 text-[#F3C64A] font-extrabold';
                    }

                    return (
                      <div
                        key={item.level}
                        className={`p-1 px-2 rounded-xl border flex items-center justify-between transition-all ${rowStyle}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="w-3.5 text-center font-mono text-[10px] font-bold">
                            {item.level}
                          </span>
                          <span className="text-[10px]">
                            {item.isSafety ? '🛡️ أمان' : 'سؤال'}
                          </span>
                        </div>

                        <span className="font-mono font-black tracking-wider text-[11px]">
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Current Level Footer */}
            <div className="pt-2 border-t border-blue-900/60 text-center">
              <span className="text-[10px] text-blue-300 block">السؤال الحالي</span>
              <span className="text-xs font-bold text-amber-400">
                {currentQuestionIndex + 1} من 11 — {currentLadder.label}
              </span>
            </div>
          </div>
        </div>

        {/* 💬 FLOATING MESSENGER CHAT POPUP MODAL (محادثة ماسنجر التفاعلية مع الخصم) 💬 */}
        {isChatModalOpen && (
          <div
            id="messenger-chat-modal"
            className="absolute bottom-4 left-4 sm:left-6 z-50 w-[92vw] sm:w-80 sm:max-w-sm bg-[#071333] border-2 border-cyan-400/80 rounded-3xl shadow-[0_0_40px_rgba(6,182,212,0.5)] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200 text-right"
          >
            {/* Messenger Header */}
            <div className="p-3 bg-gradient-to-r from-[#0a1c4d] to-[#05112e] border-b border-cyan-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <img
                    src={selectedOpponent.avatar}
                    alt={selectedOpponent.name}
                    className="w-9 h-9 rounded-full object-cover border border-cyan-300"
                    referrerPolicy="no-referrer"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-black" />
                </div>
                <div>
                  <span className="text-xs font-black text-white block">
                    {selectedOpponent.name}
                  </span>
                  <span className="text-[9px] text-emerald-400 font-bold block">
                    متصل الآن 🟢 ({selectedOpponent.city})
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsChatModalOpen(false)}
                className="p-1.5 rounded-full bg-[#05112e] hover:bg-rose-500/20 text-gray-300 hover:text-rose-300 border border-blue-800 transition-all cursor-pointer"
                title="إغلاق المحادثة"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messenger Message History */}
            <div className="p-3 space-y-2.5 h-48 overflow-y-auto bg-[#03091e]/90 text-xs">
              {chatMessages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[85%] p-2.5 rounded-2xl leading-relaxed text-xs shadow-md ${
                        isUser
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-[#0e2456] border border-cyan-500/40 text-cyan-100 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] text-gray-400 mt-0.5 px-1">{msg.time}</span>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Reaction Chips */}
            <div className="px-2 py-1.5 bg-[#050e26] border-t border-blue-900/60 overflow-x-auto flex gap-1.5 no-scrollbar">
              {QUICK_CHAT_RESPONSES.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSendUserMessage(chip)}
                  className="px-2 py-1 bg-[#091845] hover:bg-cyan-900 text-cyan-200 hover:text-white rounded-full text-[10px] font-bold shrink-0 border border-cyan-500/30 transition-all active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Text Input Footer */}
            <div className="p-2 bg-[#04091a] border-t border-blue-900/60 flex items-center gap-1.5">
              <input
                type="text"
                value={customChatMessage}
                onChange={(e) => setCustomChatMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendUserMessage();
                }}
                placeholder="اكتب رسالة للمنافس..."
                className="flex-1 bg-[#071333] border border-blue-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => handleSendUserMessage()}
                className="p-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl transition-all active:scale-95 cursor-pointer"
                title="إرسال"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 🏆 PRIZE PROGRESSION 5-SECOND OVERLAY SCREEN 🏆 */}
        {showPrizeProgressionModal && (
          <div
            id="prize-progression-modal"
            className="absolute inset-0 bg-[#030717]/95 backdrop-blur-2xl z-50 flex flex-col items-center justify-between p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-300 select-none text-right font-cairo"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,163,255,0.18)_0%,_rgba(2,5,18,0.98)_70%)] pointer-events-none" />

            {/* Top Bar with 5-Second Countdown */}
            <div className="w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between z-10 border-b border-blue-900/40 pb-2.5 gap-2">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399] animate-pulse" />
                <span className="text-xs sm:text-sm font-black text-amber-400">
                  إجابة صحيحة! تقدمت في سلم الجوائز 🎯
                </span>
              </div>

              {/* 5-Second Auto-Advance Countdown */}
              <div className="flex items-center gap-2 bg-[#0a1845] border border-sky-400/40 px-3 py-1 rounded-full text-xs text-sky-200">
                <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                <span>الانتقال التلقائي خلال</span>
                <span className="font-mono font-black text-amber-300">{progressionTimer}</span>
                <span>ثوانٍ...</span>
              </div>
            </div>

            {/* Main Stage Grid */}
            <div className="w-full max-w-4xl my-auto py-2 grid grid-cols-1 md:grid-cols-12 gap-4 items-center z-10">
              {/* Left Column: Dynamic Ascending Counter */}
              <div className="md:col-span-5 flex flex-col items-center md:items-start justify-center space-y-4 text-center md:text-right">
                <div className="w-full bg-gradient-to-b from-[#0a1845] to-[#040a1d] border-2 border-amber-400/80 rounded-3xl p-4 sm:p-5 shadow-[0_0_40px_rgba(245,158,11,0.35)] relative overflow-hidden">
                  <div className="flex items-center justify-center gap-1.5 mb-1 text-amber-300 text-xs font-bold">
                    <Sparkles className="w-4 h-4 text-yellow-400 animate-spin" />
                    <span>المبلغ المحقق حالياً</span>
                  </div>

                  <div className="py-2">
                    <span
                      id="ascending-prize-counter"
                      className="text-3xl sm:text-4xl lg:text-5xl font-mono font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-200 drop-shadow-[0_0_25px_rgba(245,158,11,0.6)]"
                    >
                      {animatedPrizeValue.toLocaleString('en-US').replace(/,/g, ' ')}
                    </span>
                    <span className="text-sm sm:text-base font-bold text-amber-200 block mt-1">
                      دينار عراقي (د.ع)
                    </span>
                  </div>

                  <div className="mt-2 inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] font-black px-3 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>اجتزت السؤال رقم ({activeClimbLevel}) بنجاح!</span>
                  </div>
                </div>

                <button
                  id="btn-proceed-next-question"
                  onClick={handleNextQuestion}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-sm sm:text-base rounded-2xl shadow-[0_0_30px_rgba(245,158,11,0.5)] flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer group"
                >
                  <span>
                    {activeClimbLevel < LADDER_LEVELS.length ? 'الانتقال للسؤال التالي ➔' : 'تتويج المليونير 🏆'}
                  </span>
                  <ArrowRight className="w-5 h-5 rotate-180 group-hover:-translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Right Column: 11-Level Ladder TV Panel */}
              <div className="md:col-span-7 flex justify-center">
                <div
                  id="millionaire-ladder-tv-panel"
                  className="w-full max-w-sm bg-gradient-to-b from-[#051138] via-[#030a21] to-[#051138] border-2 border-[#1e48aa] rounded-3xl p-3 sm:p-4 shadow-[0_0_40px_rgba(16,56,170,0.6)] relative overflow-hidden"
                >
                  <div className="space-y-1 text-xs">
                    {LADDER_LEVELS.slice()
                      .reverse()
                      .map((item) => {
                        const isCurrentActive = activeClimbLevel === item.level;
                        const isPassedLevel = activeClimbLevel > item.level;

                        return (
                          <div
                            key={item.level}
                            className={`relative flex items-center justify-between px-3 py-1 rounded-xl transition-all duration-300 ${
                              isCurrentActive
                                ? 'bg-gradient-to-r from-amber-500/30 via-yellow-400/40 to-amber-500/30 border-2 border-yellow-300 shadow-[0_0_20px_rgba(250,204,21,0.8)] scale-[1.04] z-10'
                                : isPassedLevel
                                ? 'bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 font-bold'
                                : item.isSafety
                                ? 'text-amber-400 font-extrabold'
                                : 'text-blue-100/80'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-mono">
                              <span
                                className={`text-[11px] sm:text-xs font-bold ${
                                  isCurrentActive
                                    ? 'text-yellow-200 font-black'
                                    : item.isSafety
                                    ? 'text-amber-400'
                                    : 'text-blue-300'
                                }`}
                              >
                                {item.level}.
                              </span>

                              <span
                                className={`text-[10px] ${
                                  isCurrentActive
                                    ? 'text-yellow-300 animate-pulse'
                                    : isPassedLevel
                                    ? 'text-emerald-400'
                                    : item.isSafety
                                    ? 'text-amber-400'
                                    : 'text-blue-400/60'
                                }`}
                              >
                                ◆
                              </span>

                              {item.isSafety && !isCurrentActive && (
                                <span className="text-[9px] bg-amber-500/15 border border-amber-500/30 text-amber-300 px-1 py-0.2 rounded font-sans hidden sm:inline-block">
                                  أمان
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <span
                                className={`font-mono tracking-wider sm:text-sm font-black ${
                                  isCurrentActive
                                    ? 'text-yellow-200 text-sm sm:text-base drop-shadow-[0_0_10px_rgba(250,204,21,0.9)]'
                                    : item.isSafety
                                    ? 'text-[#F3C64A]'
                                    : 'text-white'
                                }`}
                              >
                                {item.label}
                              </span>
                            </div>

                            {isCurrentActive && (
                              <>
                                <span className="absolute -left-2 top-1/2 -translate-y-1/2 text-yellow-300 font-black text-xs animate-bounce">
                                  ◀
                                </span>
                                <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-yellow-300 font-black text-xs animate-bounce">
                                  ▶
                                </span>
                              </>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-blue-300/80 text-center z-10">
              <span>مسابقة من سيربح المليون دينار • الدرس: {lessonTitle}</span>
            </div>
          </div>
        )}

        {/* Audience Poll Modal */}
        {showAudienceModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#0a1845] border-2 border-rose-400/60 rounded-3xl p-5 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-blue-900/60 pb-2">
                <span className="font-extrabold text-sm text-rose-300 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-rose-400" />
                  رأي وتصويت الجمهور
                </span>
                <button
                  onClick={() => setShowAudienceModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2 h-36 items-end pt-4">
                {audiencePercentages.map((percent, i) => (
                  <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[10px] font-mono font-bold text-amber-300">
                      {percent}%
                    </span>
                    <div
                      className="w-full bg-gradient-to-t from-rose-600 to-pink-400 rounded-t-lg transition-all duration-700"
                      style={{ height: `${percent}%` }}
                    />
                    <span className="font-black text-xs text-white">{getOptionPrefix(i)}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowAudienceModal(false)}
                className="w-full py-2.5 bg-rose-500 hover:bg-rose-400 text-black font-extrabold rounded-xl text-xs transition-all cursor-pointer"
              >
                إغلاق والعودة للسؤال
              </button>
            </div>
          </div>
        )}

        {/* Call Friend Modal */}
        {showCallFriendModal && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-[#0a1845] border-2 border-emerald-400/60 rounded-3xl p-5 text-center space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-blue-900/60 pb-2">
                <span className="font-extrabold text-sm text-emerald-300 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-400" />
                  اتصال بصديق / مُعلم المادة
                </span>
                <button
                  onClick={() => setShowCallFriendModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {callFriendState === 'calling' ? (
                <div className="py-6 space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400 mx-auto flex items-center justify-center animate-ping text-emerald-300">
                    <Phone className="w-6 h-6" />
                  </div>
                  <span className="text-xs text-emerald-300 font-bold block">
                    جاري الاتصال بالأستاذ المختص...
                  </span>
                </div>
              ) : (
                <div className="space-y-3 text-right">
                  <div className="bg-[#05112e] p-3 rounded-xl border border-emerald-500/30 text-xs text-emerald-100 leading-relaxed">
                    <span className="font-bold text-amber-300 block mb-1">
                      الأستاذ: "أهلاً بك يا بطل!
                    </span>
                    أنا واثق بنسبة 90% أن الإجابة الصحيحة هي (
                    <span className="text-amber-400 font-black">
                      {getOptionPrefix(currentQuestion.correctAnswer)}{' '}
                      {currentQuestion.options[currentQuestion.correctAnswer]}
                    </span>
                    ) لأنها توافق القواعد والشروحات المنهجية."
                  </div>

                  <button
                    onClick={() => setShowCallFriendModal(false)}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    شكراً للمُعلم، سأحدد إجابتي
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
