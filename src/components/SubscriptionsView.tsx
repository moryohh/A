import React, { useState } from 'react';
import {
  ArrowRight,
  BadgePercent,
  BellRing,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Layers,
  MapPin,
  MonitorCheck,
  UsersRound,
  Swords,
  Gamepad2,
  DoorOpen,
  Dice5,
  Sparkles,
  GraduationCap,
  ChevronDown,
} from 'lucide-react';
import { useAppTheme } from '../services/themeService';
import { registerCourseReminder } from '../services/communityService';
import {
  COURSE_STATUS_LABELS,
  CourseStatus,
  MOCK_COURSES,
  MockCourse,
} from '../data/mockCourses';
import { CompetitionSnapshot, EducationalLesson } from '../types';
import { getSubjectIndex } from '../services/lessonsService';
import { fetchLessonGamesData } from '../services/gamesService';
import { GRADE_6_SUBJECTS } from '../data/mockSubjects';

const CHALLENGE_API = (import.meta.env.VITE_ONLINE_CHALLENGE_API_URL || '').replace(/\/$/, '');
type ChallengeGame = 'millionaire' | 'millionaire_team' | 'true_false' | 'gibha_sah' | 'live_classroom';
type ChallengeQuestion = { question: string; options: string[]; correctAnswer: number };
type RoomStatus = 'waiting' | 'playing' | 'reconnecting' | 'ended';
type ActiveRoom = { code: string; subject: string; chapter: number; lesson: number; lessonTitle: string; gameType: ChallengeGame; gameTitle: string; capacity?: number; players: number; createdAt: number; status?: RoomStatus; endedAt?: number };

interface SubscriptionsViewProps {
  onSelectLesson: (lesson: EducationalLesson) => void;
  onBack?: () => void;
  competitionSnapshot?: CompetitionSnapshot | null;
  onOpenChallenge?: () => void;
  onJoinChallenge?: (room: ActiveRoom) => void;
  onCreateChallenge?: (config: { questions: ChallengeQuestion[]; lessonTitle: string; gameType: ChallengeGame; gameTitle: string; subject: string; chapterNumber: number; lessonNumber: number; contentMode?: 'board' | 'booklet' }) => void;
}

const STATUS_STYLES: Record<CourseStatus, { text: string; background: string; border: string }> = {
  full: {
    text: '#fbbf24',
    background: 'rgba(245,158,11,0.13)',
    border: 'rgba(245,158,11,0.35)',
  },
  upcoming: {
    text: '#86efac',
    background: 'rgba(34,197,94,0.13)',
    border: 'rgba(34,197,94,0.35)',
  },
  open: {
    text: '#7dd3fc',
    background: 'rgba(14,165,233,0.13)',
    border: 'rgba(14,165,233,0.35)',
  },
  closed: {
    text: '#cbd5e1',
    background: 'rgba(148,163,184,0.13)',
    border: 'rgba(148,163,184,0.35)',
  },
};

const formatPrice = (price?: number) => (price === undefined ? '' : `${price.toLocaleString('en-US')} د.ع`);

const getPriceBoxStyle = (course: MockCourse): React.CSSProperties => {
  if (course.isFree) {
    return {
      color: '#f0fdf4',
      backgroundColor: '#166534',
      borderColor: '#fbbf24',
    };
  }
  if (course.status === 'upcoming') {
    return {
      color: '#eff6ff',
      backgroundColor: '#075985',
      borderColor: '#fbbf24',
    };
  }
  if (course.status === 'full') {
    return {
      color: '#fff7ed',
      backgroundColor: '#c2410c',
      borderColor: '#fbbf24',
    };
  }
  return {
    color: '#0f172a',
    backgroundColor: 'rgba(15,23,42,0.06)',
    borderColor: 'rgba(15,23,42,0.2)',
  };
};

const getStatusMessage = (course: MockCourse) => {
  if (course.status === 'upcoming') {
    return {
      title: 'التقديم يبدأ في الشهر الحادي عشر',
      description: 'سيبدأ التقديم على هذه الدورة في الشهر الحادي عشر.',
    };
  }

  if (course.status === 'full') {
    return {
      title: 'المقاعد ممتلئة',
      description: 'اكتملت المقاعد المتاحة لهذه الدورة حاليًا.',
    };
  }

  if (course.status === 'open') {
    if (course.isFree) {
      return {
        title: 'دورة مجانية — ابدأ الآن',
        description: 'تبدأ هذه الدورة في 1/12، ويمكنك التقديم الآن بعد استيفاء شروط المستوى والتقييم.',
      };
    }

    return {
      title: 'التسجيل متاح',
      description: 'يمكنك الاطلاع على تفاصيل التسجيل عند تفعيل الدورة رسميًا.',
    };
  }

  return {
    title: 'التسجيل مغلق',
    description: 'التسجيل غير متاح لهذه الدورة حاليًا.',
  };
};

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ onBack, competitionSnapshot, onOpenChallenge, onJoinChallenge, onCreateChallenge }) => {
  const { theme } = useAppTheme();
  const [activeSection, setActiveSection] = useState<'challenge' | 'courses'>('challenge');
  const [challengeSubject, setChallengeSubject] = useState('');
  const [challengeChapter, setChallengeChapter] = useState('');
  const [challengeChapters, setChallengeChapters] = useState<Array<{ number: number; title: string }>>([]);
  const [challengeGame, setChallengeGame] = useState<ChallengeGame | ''>('');
  const [classroomContentMode, setClassroomContentMode] = useState<'board' | 'booklet'>('board');
  const [challengeLessons, setChallengeLessons] = useState<Array<{ number: number; title: string; id: string }>>([]);
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [challengeBusy, setChallengeBusy] = useState(false);
  const [challengeMessage, setChallengeMessage] = useState('');

  const selectedChallengeSubject = GRADE_6_SUBJECTS.find((subject) => subject.id === challengeSubject);
  const visibleRooms = activeRooms.filter((room) =>
    (!challengeSubject || room.subject === selectedChallengeSubject?.name || room.subject === challengeSubject) &&
    (!challengeChapter || room.chapter === Number(challengeChapter)) &&
    (!challengeGame || room.gameType === challengeGame)
  );

  React.useEffect(() => {
    let cancelled = false;
    const loadRooms = async () => {
      if (!CHALLENGE_API) return;
      try {
        const response = await fetch(`${CHALLENGE_API}/rooms`);
        const payload = await response.json();
        if (!cancelled) setActiveRooms(Array.isArray(payload.rooms) ? payload.rooms : []);
      } catch (_) { if (!cancelled) setActiveRooms([]); }
    };
    loadRooms();
    const timer = window.setInterval(loadRooms, 2000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    if (!challengeSubject) { setChallengeLessons([]); setChallengeChapters([]); setChallengeChapter(''); return; }
    getSubjectIndex(challengeSubject, selectedChallengeSubject?.name || 'المادة').then((index) => {
      if (cancelled) return;
      setChallengeChapters(index.chapters.map((item) => ({ number: item.chapterNumber, title: item.title })));
      const chapter = index.chapters.find((item) => item.chapterNumber === Number(challengeChapter)) || index.chapters[0];
      setChallengeChapter(chapter ? String(chapter.chapterNumber) : '');
      setChallengeLessons(chapter?.lessons.map((lesson) => ({ number: lesson.lessonNumber, title: lesson.title, id: lesson.lessonId })) || []);
    }).catch(() => { if (!cancelled) setChallengeLessons([]); });
    return () => { cancelled = true; };
  }, [challengeSubject, challengeChapter, selectedChallengeSubject?.name]);

  const createRandomChallenge = async () => {
    if (!challengeSubject || !challengeChapter || !challengeGame || !challengeLessons.length || !onCreateChallenge) return;
    setChallengeBusy(true); setChallengeMessage('جارٍ اختيار درس عشوائي وتجهيز أسئلته…');
    try {
      const selectedLesson = challengeLessons[Math.floor(Math.random() * challengeLessons.length)];
      const context = { subjectId: challengeSubject, chapterNumber: Number(challengeChapter), lessonNumber: selectedLesson.number, lessonId: selectedLesson.id, lessonTitle: selectedLesson.title };
      if (challengeGame === 'live_classroom') {
        onCreateChallenge({ questions: [], lessonTitle: selectedLesson.title, gameType: challengeGame, gameTitle: classroomContentMode === 'board' ? 'حل معي — درس رياضيات أونلاين' : 'الملزمة — درس رياضيات أونلاين', subject: selectedChallengeSubject?.id || selectedChallengeSubject?.name || challengeSubject, chapterNumber: Number(challengeChapter), lessonNumber: selectedLesson.number, contentMode: classroomContentMode });
        setChallengeMessage('');
        return;
      }
      const bundle = await fetchLessonGamesData(context);
      const config: any = challengeGame === 'millionaire' ? bundle.mcqConfig : challengeGame === 'true_false' ? bundle.trueFalseConfig : bundle.gibhaSahConfig;
      const questions: ChallengeQuestion[] = challengeGame === 'millionaire'
        ? config.questions.map((item: any) => ({ question: item.question, options: item.options, correctAnswer: item.correctAnswer }))
        : challengeGame === 'true_false'
          ? config.questions.map((item: any) => ({ question: item.question, options: ['صح', 'خطأ'], correctAnswer: item.isCorrect ? 0 : 1 }))
          : config.questions.map((item: any) => ({ question: item.question, options: config.cards.map((card: any) => card.label), correctAnswer: Math.max(0, Number(item.correctCardNumber) - 1) }));
      if (questions.length < 1) throw new Error('لا توجد أسئلة لهذا الدرس. اختر مادة أو فصلاً آخر.');
      onCreateChallenge({ questions: questions.slice(0, 11), lessonTitle: selectedLesson.title, gameType: challengeGame, gameTitle: challengeGame === 'live_classroom' ? 'الفصل التعليمي المباشر' : challengeGame === 'millionaire' ? 'من سيربح المليون' : challengeGame === 'true_false' ? 'صواب أم خطأ' : 'جبتها صح', subject: selectedChallengeSubject?.id || selectedChallengeSubject?.name || challengeSubject, chapterNumber: Number(challengeChapter), lessonNumber: selectedLesson.number });
      setChallengeMessage('');
    } catch (error) { setChallengeMessage(error instanceof Error ? error.message : 'تعذر تجهيز الغرفة.'); }
    finally { setChallengeBusy(false); }
  };
  const [selectedCourse, setSelectedCourse] = useState<MockCourse | null>(null);
  const [reminderState, setReminderState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [reminderMessage, setReminderMessage] = useState('');
  const [applicationState, setApplicationState] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [applicationMessage, setApplicationMessage] = useState('');

  const openCourseDialog = (course: MockCourse) => {
    setSelectedCourse(course);
    setReminderState('idle');
    setReminderMessage('');
    setApplicationState('idle');
    setApplicationMessage('');
  };

  const closeCourseDialog = () => {
    setSelectedCourse(null);
    setReminderState('idle');
    setReminderMessage('');
    setApplicationState('idle');
    setApplicationMessage('');
  };

  const handleApplyForFreeCourse = () => {
    if (!selectedCourse?.isFree) return;
    setApplicationState('checking');
    setApplicationMessage('');

    const requiredLevel = selectedCourse.requiredLevel ?? 80;
    const currentLevel = competitionSnapshot?.level ?? 0;
    const hasRequiredRating = competitionSnapshot?.ratingTier === selectedCourse.requiredRating;
    const hasRequiredLevel = currentLevel >= requiredLevel;

    if (!hasRequiredRating || !hasRequiredLevel) {
      const reasons = [
        !hasRequiredRating ? 'تقييمك الحالي ليس ذهبيًا.' : '',
        !hasRequiredLevel ? `مستواك الحالي ${currentLevel}، ويجب أن يصل إلى ${requiredLevel}.` : '',
      ].filter(Boolean);
      setApplicationState('error');
      setApplicationMessage(`لم تستوفِ الشروط بعد. ${reasons.join(' ')} آخر موعد لاستيفاء الشروط هو ${selectedCourse.applicationDeadline || '25 نوفمبر'}.`);
      return;
    }

    setApplicationState('success');
    setApplicationMessage('تم استيفاء شروط التقديم مبدئيًا. تبدأ الدورة في 1/12.');
  };

  const handleRegisterReminder = async () => {
    if (!selectedCourse || selectedCourse.status !== 'upcoming') return;
    setReminderState('saving');
    setReminderMessage('');
    try {
      const response = await registerCourseReminder(selectedCourse.id);
      setReminderState('success');
      setReminderMessage(response.message || 'تم تسجيل تذكيرك بنجاح');
    } catch (error: any) {
      setReminderState('error');
      setReminderMessage(error?.message || 'تعذر تسجيل التذكير حاليًا');
    }
  };

  return (
    <div className="space-y-4 p-3 pb-[calc(7rem+env(safe-area-inset-bottom))] text-right select-none sm:p-4 animate-in fade-in duration-200">
      <section className={`rounded-3xl border p-2 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}>
        <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="دوراتي والتحدي">
          <button type="button" role="tab" aria-selected={activeSection === 'challenge'} onClick={() => setActiveSection('challenge')} className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-black transition ${activeSection === 'challenge' ? 'bg-sky-500 text-white shadow-lg' : theme.classes.textMuted}`}>
            <Swords className="h-5 w-5" /> التحدّي
          </button>
          <button type="button" role="tab" aria-selected={activeSection === 'courses'} onClick={() => setActiveSection('courses')} className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-sm font-black transition ${activeSection === 'courses' ? 'bg-sky-500 text-white shadow-lg' : theme.classes.textMuted}`}>
            <BookOpen className="h-5 w-5" /> دوراتي
          </button>
        </div>
      </section>

      {activeSection === 'challenge' && (
        <div className="space-y-4">
        <section className="relative overflow-hidden rounded-[28px] border border-cyan-300/45 bg-[radial-gradient(circle_at_50%_-20%,rgba(56,189,248,.35),transparent_42%),linear-gradient(145deg,#071a3a_0%,#0b1e55_52%,#241052_100%)] p-4 text-white shadow-[0_24px_65px_rgba(30,64,175,.28)] sm:p-5">
          <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 15% 20%, white 0 1px, transparent 1.5px), radial-gradient(circle at 82% 15%, #67e8f9 0 1.5px, transparent 2px)', backgroundSize: '54px 54px, 78px 78px' }} />
          <div className="pointer-events-none absolute -left-10 top-10 h-36 w-36 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="pointer-events-none absolute -right-12 bottom-0 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative mb-4 flex flex-col items-center">
            <div className="relative grid h-16 w-16 place-items-center rounded-full border border-cyan-200/40 bg-gradient-to-br from-cyan-400/25 to-violet-500/25 shadow-[0_0_34px_rgba(34,211,238,.35)] motion-safe:animate-[pulse_2.4s_ease-in-out_infinite]">
              <span className="absolute inset-1 rounded-full border border-white/10" />
              <Swords className="h-8 w-8 text-cyan-100 drop-shadow-[0_0_10px_rgba(103,232,249,.8)]" />
              <Sparkles className="absolute -right-1 -top-1 h-5 w-5 text-amber-300 motion-safe:animate-pulse" />
            </div>
            <h1 className="mt-2 text-xl font-black tracking-tight text-white">إنشاء غرفة لعب</h1>
            <p className="mt-1 text-[10px] font-bold text-cyan-100/70">اختر المادة والفصل واللعبة ثم ابدأ التحدّي</p>
          </div>
          <div className="relative space-y-2.5 rounded-3xl border border-white/10 bg-black/15 p-2.5 shadow-inner backdrop-blur-sm">
            <label className="relative flex items-center overflow-hidden rounded-2xl border border-cyan-300/35 bg-slate-950/55 shadow-[0_7px_20px_rgba(2,8,23,.28)] transition focus-within:border-cyan-300 focus-within:ring-2 focus-within:ring-cyan-400/20">
              <BookOpen className="mr-3 h-5 w-5 shrink-0 text-cyan-300" />
              <select value={challengeSubject} onChange={(event) => { setChallengeSubject(event.target.value); setChallengeChapter(''); }} className="h-14 w-full appearance-none bg-transparent px-3 text-xs font-bold text-white outline-none"><option value="">اختر المادة</option>{GRADE_6_SUBJECTS.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select>
              <ChevronDown className="ml-3 h-4 w-4 shrink-0 text-cyan-200" />
            </label>
            <label className="relative flex items-center overflow-hidden rounded-2xl border border-blue-300/35 bg-slate-950/55 shadow-[0_7px_20px_rgba(2,8,23,.28)] transition focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-400/20">
              <GraduationCap className="mr-3 h-5 w-5 shrink-0 text-blue-300" />
              <select value={challengeChapter} onChange={(event) => setChallengeChapter(event.target.value)} disabled={!challengeChapters.length} className="h-14 w-full appearance-none bg-transparent px-3 text-xs font-bold text-white outline-none disabled:opacity-45"><option value="">اختر الفصل</option>{challengeChapters.map((chapter) => <option key={chapter.number} value={chapter.number}>الفصل {chapter.number}</option>)}</select>
              <ChevronDown className="ml-3 h-4 w-4 shrink-0 text-blue-200" />
            </label>
            {challengeSubject === 'mathematics' && challengeChapter && (
              <div className="rounded-2xl border border-cyan-300/30 bg-slate-950/45 p-2.5">
                <p className="mb-2 text-center text-[11px] font-black text-cyan-100">درس الرياضيات الأونلاين</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => { setClassroomContentMode('board'); setChallengeGame('live_classroom'); }} className={`flex min-h-24 flex-col items-center justify-center rounded-2xl border p-3 transition active:scale-95 ${challengeGame === 'live_classroom' && classroomContentMode === 'board' ? 'border-sky-200 bg-sky-400/30 ring-2 ring-sky-300/30' : 'border-sky-300/35 bg-sky-500/10'}`}>
                    <MonitorCheck className="mb-2 h-8 w-8 text-sky-200" />
                    <b className="text-sm text-white">حل معي</b>
                    <small className="mt-1 text-[9px] text-sky-100/70">صبورة تفاعلية مباشرة</small>
                  </button>
                  <button type="button" onClick={() => { setClassroomContentMode('booklet'); setChallengeGame('live_classroom'); }} className={`flex min-h-24 flex-col items-center justify-center rounded-2xl border p-3 transition active:scale-95 ${challengeGame === 'live_classroom' && classroomContentMode === 'booklet' ? 'border-emerald-200 bg-emerald-400/30 ring-2 ring-emerald-300/30' : 'border-emerald-300/35 bg-emerald-500/10'}`}>
                    <BookOpen className="mb-2 h-8 w-8 text-emerald-200" />
                    <b className="text-sm text-white">الملزمة</b>
                    <small className="mt-1 text-[9px] text-emerald-100/70">شرح الملزمة مباشرة</small>
                  </button>
                </div>
              </div>
            )}
            <label className="relative flex items-center overflow-hidden rounded-2xl border border-violet-300/35 bg-slate-950/55 shadow-[0_7px_20px_rgba(2,8,23,.28)] transition focus-within:border-violet-300 focus-within:ring-2 focus-within:ring-violet-400/20">
              <Gamepad2 className="mr-3 h-5 w-5 shrink-0 text-violet-300" />
              <select value={challengeGame === 'live_classroom' ? '' : challengeGame} onChange={(event) => setChallengeGame(event.target.value as ChallengeGame | '')} className="h-14 w-full appearance-none bg-transparent px-3 text-xs font-bold text-white outline-none"><option value="">الألعاب الجماعية الأخرى</option><option value="true_false">صواب أم خطأ</option><option value="millionaire">من سيربح المليون</option><option value="gibha_sah">جبتها صح</option></select>
              <ChevronDown className="ml-3 h-4 w-4 shrink-0 text-violet-200" />
            </label>
            <button type="button" disabled={challengeBusy || !challengeSubject || !challengeChapter || !challengeGame || !challengeLessons.length} onClick={() => void createRandomChallenge()} className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl border border-white/30 bg-gradient-to-l from-violet-500 via-blue-500 to-cyan-400 px-4 py-4 text-sm font-black text-white shadow-[0_12px_30px_rgba(37,99,235,.4)] transition-all hover:-translate-y-0.5 hover:brightness-110 active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-45">
              <span className="pointer-events-none absolute -left-8 top-0 h-full w-16 skew-x-[-20deg] bg-white/20 blur-md transition-transform duration-700 group-hover:translate-x-[420px]" />
              <Dice5 className={`h-5 w-5 ${challengeBusy ? 'animate-spin' : 'transition-transform group-hover:rotate-12 group-hover:scale-110'}`} />
              {challengeBusy ? 'جارٍ تجهيز الدرس…' : challengeGame === 'live_classroom' ? 'ابدأ درس الرياضيات الأونلاين' : 'أنشئ غرفة من درس عشوائي'}
            </button>
            {challengeMessage && <p className="rounded-xl bg-amber-500/15 p-3 text-center text-xs leading-6 text-amber-100">{challengeMessage}</p>}
          </div>
        </section>
        <section className={`overflow-hidden rounded-3xl border shadow-xl ${theme.classes.cardBg} ${theme.classes.cardBorder}`}>
          <div className="relative overflow-hidden border-b border-cyan-300/20 bg-gradient-to-l from-[#0a1d49] via-[#102b67] to-[#261052] px-4 py-4 text-white">
            <div className="pointer-events-none absolute -left-8 -top-10 h-28 w-28 rounded-full bg-violet-400/20 blur-2xl" />
            <div className="relative flex items-center gap-3">
              <div className="relative grid h-11 w-11 place-items-center rounded-2xl border border-cyan-200/35 bg-cyan-400/15 shadow-[0_0_22px_rgba(34,211,238,.25)]">
                <DoorOpen className="h-6 w-6 text-cyan-200" />
                <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.9)] motion-safe:animate-ping" />
              </div>
              <div>
                <h2 className="text-base font-black">الغرف المتاحة للدخول</h2>
                <p className="text-[10px] font-bold text-cyan-100/65">اختر غرفة نشطة وانضم إلى المنافسة</p>
              </div>
            </div>
            <div className="absolute inset-x-4 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-300 to-violet-400" />
          </div>
          <div className="space-y-2 p-4">
            {visibleRooms.length === 0 ? <p className={`rounded-2xl bg-black/15 p-4 text-center text-xs ${theme.classes.textMuted}`}>لا توجد غرف مطابقة حالياً.</p> : visibleRooms.map((room) => {
              const status = room.status || 'waiting';
              const ended = status === 'ended';
              const statusLabel = status === 'waiting' ? 'بانتظار لاعب' : status === 'playing' ? 'جارية' : status === 'reconnecting' ? 'بانتظار العودة' : 'منتهية';
              return <button key={room.code} type="button" disabled={ended || status === 'playing' || status === 'reconnecting'} onClick={() => onJoinChallenge?.(room)} className="w-full rounded-2xl bg-slate-800/80 p-3 text-right transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-65"><span className="flex items-center justify-between"><b className="text-lg text-sky-200">#{room.code}</b><span className={`rounded-full px-2 py-1 text-[10px] font-black ${ended ? 'bg-rose-500/20 text-rose-200' : status === 'waiting' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-200'}`}>{statusLabel}</span></span><span className="mt-1 block text-xs text-slate-200">{room.subject} — الفصل {room.chapter} — الدرس {room.lesson}</span><span className="mt-1 block text-xs text-slate-400">{room.gameTitle || room.gameType} · {room.lessonTitle} · {room.players}/2 لاعبين</span></button>;
            })}
          </div>
        </section>
        </div>
      )}

      {activeSection === 'courses' && <>
      <section
        className={`relative overflow-hidden rounded-3xl border p-4 shadow-xl ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
        style={{ boxShadow: `0 8px 28px ${theme.colors.glow}` }}
      >
        <div
          className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full blur-3xl"
          style={{ backgroundColor: `${theme.colors.primary}30` }}
        />
        <div className="relative flex items-start justify-end gap-3">
          <div className="min-w-0">
            <h1 className={`text-xl font-black tracking-tight sm:text-2xl ${theme.classes.textMain}`}>الدورات التعليمية</h1>
            <p className={`mt-1 text-xs leading-6 sm:text-sm ${theme.classes.textMuted}`}>
              اختر الدورة المناسبة لك وابدأ رحلتك نحو التفوق
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-3">
        {MOCK_COURSES.map((course) => {
          const statusStyle = STATUS_STYLES[course.status];

          return (
            <button
              key={course.id}
              type="button"
              onClick={() => openCourseDialog(course)}
              className={`group relative w-full overflow-hidden rounded-3xl border p-4 text-right shadow-lg transition-[transform,box-shadow,border-color] duration-200 active:scale-[0.99] hover:-translate-y-0.5 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
              style={{
                boxShadow: course.featured ? `0 10px 32px ${theme.colors.glow}` : undefined,
                borderColor: course.featured ? `${theme.colors.primary}70` : undefined,
              }}
            >
              {course.featured && (
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-1"
                  style={{ background: `linear-gradient(90deg, ${theme.colors.secondary}, ${theme.colors.primary}, ${theme.colors.accent})` }}
                />
              )}

              <div className="flex items-start justify-between gap-3">
                <span
                  className="flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black"
                  style={{
                    color: statusStyle.text,
                    backgroundColor: statusStyle.background,
                    borderColor: statusStyle.border,
                  }}
                >
                  {course.status === 'full' ? <UsersRound className="h-3.5 w-3.5" /> : <CalendarDays className="h-3.5 w-3.5" />}
                  {course.statusLabel || COURSE_STATUS_LABELS[course.status]}
                </span>

                <div className="min-w-0">
                  <div className="mb-1 flex items-center justify-end gap-1.5">
                    {course.featured && <BadgePercent className="h-4 w-4" style={{ color: theme.colors.secondary }} />}
                    <h2 className={`text-base font-black leading-7 sm:text-lg ${theme.classes.textMain}`}>{course.title}</h2>
                  </div>
                </div>
              </div>


              <div className={`mt-4 flex items-end justify-between gap-3 border-t pt-3 ${theme.classes.cardBorder}`}>
                <span
                  className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-black transition-transform group-hover:translate-x-0.5"
                  style={{ color: theme.colors.primary, backgroundColor: `${theme.colors.primary}14` }}
                >
                  <span>عرض التفاصيل</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>

                <div className="rounded-2xl border px-3 py-2 text-left" style={getPriceBoxStyle(course)}>
                  {course.oldPrice !== undefined && (
                    <div className="text-sm font-black line-through" style={{ color: 'rgba(255,255,255,0.96)' }}>{formatPrice(course.oldPrice)}</div>
                  )}
                  {course.isFree ? (
                    <div className="flex items-center justify-end gap-1.5 text-2xl font-black">
                      <span>مجانية</span>
                      <CheckCircle2 className="h-5 w-5" style={{ color: '#fbbf24' }} />
                    </div>
                  ) : course.currentPrice !== undefined ? (
                    <div className="flex items-baseline justify-end gap-1.5">
                      <span className="text-xs font-black">د.ع</span>
                      <span className="text-3xl font-black tracking-tight">{course.currentPrice.toLocaleString('en-US')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs font-black">
                      <Clock3 className="h-3.5 w-3.5" />
                      بدون سعر حالي
                    </div>
                  )}
                  {course.badge && (
                    <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] font-black">
                      <BadgePercent className="h-3.5 w-3.5" style={{ color: '#fbbf24' }} />
                      {course.badge}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[10px] font-bold">
                <span className="flex items-center gap-1" style={{ color: theme.colors.primary }}>
                  <MonitorCheck className="h-3.5 w-3.5" />
                  امتحان إلكتروني
                </span>
                {course.includesInPersonExam && (
                  <span className="flex items-center gap-1" style={{ color: theme.colors.secondary }}>
                    <MapPin className="h-3.5 w-3.5" />
                    امتحان حضوري
                  </span>
                )}
                {course.registrationMonth && (
                  <span className="flex items-center gap-1" style={{ color: statusStyle.text }}>
                    <CalendarDays className="h-3.5 w-3.5" />
                    يبدأ في {course.registrationMonth}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedCourse && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/70 p-4 pb-[calc(7rem+env(safe-area-inset-bottom))] backdrop-blur-sm animate-in fade-in duration-150 sm:items-center"
          role="presentation"
          onClick={closeCourseDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-status-title"
            className={`my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl border p-5 text-right shadow-2xl animate-in zoom-in-95 duration-150 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={closeCourseDialog}
                  className={`flex items-center gap-1 rounded-xl border px-2.5 py-2 text-[10px] font-black transition-transform active:scale-95 ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`}
                  style={{ color: theme.colors.primary }}
                  aria-label="الرجوع إلى قائمة الدورات"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>رجوع</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border"
                  style={{
                    color: STATUS_STYLES[selectedCourse.status].text,
                    backgroundColor: STATUS_STYLES[selectedCourse.status].background,
                    borderColor: STATUS_STYLES[selectedCourse.status].border,
                  }}
                >
                  {selectedCourse.status === 'upcoming' ? <Clock3 className="h-5 w-5" /> : <UsersRound className="h-5 w-5" />}
                </span>
                <div>
                  <h3 id="course-status-title" className={`text-base font-black ${theme.classes.textMain}`}>
                    {getStatusMessage(selectedCourse).title}
                  </h3>
                  <p className={`mt-0.5 text-[10px] ${theme.classes.textMuted}`}>{selectedCourse.title}</p>
                </div>
              </div>
            </div>

            <p className={`mt-5 rounded-2xl border p-3 text-xs leading-6 ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder} ${theme.classes.textMuted}`}>
              {getStatusMessage(selectedCourse).description}
            </p>

            <div className={`mt-3 rounded-2xl border p-3 ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`}>
              <div className={`mb-2 text-xs font-black ${theme.classes.textMain}`}>المواد التي تغطيها</div>
              <div className="flex flex-wrap justify-end gap-1.5">
                {selectedCourse.subjects.map((subject) => (
                  <span key={subject} className="rounded-full px-2 py-1 text-[10px] font-bold" style={{ color: theme.colors.primary, backgroundColor: `${theme.colors.primary}18` }}>
                    {subject}
                  </span>
                ))}
              </div>
            </div>

            <div className={`mt-3 space-y-2 rounded-2xl border p-3 text-xs ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`}>
              <div className="flex items-center justify-end gap-2" style={{ color: theme.colors.primary }}>
                <span>تشمل جدول المواد التي تغطيها</span>
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-end gap-2" style={{ color: theme.colors.primary }}>
                <span>تشمل الامتحان الإلكتروني</span>
                <MonitorCheck className="h-4 w-4" />
              </div>
              {selectedCourse.includesInPersonExam && (
                <div className="flex items-center justify-end gap-2" style={{ color: theme.colors.secondary }}>
                  <span>تشمل الامتحان الحضوري</span>
                  <MapPin className="h-4 w-4" />
                </div>
              )}
              {!selectedCourse.includesInPersonExam && (
                <div className={`text-[10px] ${theme.classes.textMuted}`}>لا تشمل الامتحان الحضوري</div>
              )}
            </div>

            {(selectedCourse.status === 'upcoming' || selectedCourse.isFree) && selectedCourse.registrationMonth && (
              <div className="mt-3 flex items-center justify-end gap-1.5 text-xs font-black" style={{ color: theme.colors.secondary }}>
                <CalendarDays className="h-4 w-4" />
                تبدأ الدورة في {selectedCourse.registrationMonth}
              </div>
            )}

            {selectedCourse.isFree && (
              <>
                <div className={`mt-3 space-y-2 rounded-2xl border p-3 text-xs leading-6 ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`}>
                  <div className="font-black" style={{ color: theme.colors.secondary }}>تفاصيل المقاعد</div>
                  <div className={theme.classes.textMuted}>السعة: {selectedCourse.seatsPerGovernorate || 400} مقعد لكل محافظة.</div>
                  <div className={theme.classes.textMuted}>تبدأ الدورة في 1/12، ويفتح الدخول مع بدء الدورة.</div>
                </div>
                {selectedCourse.sponsorNote && (
                  <div className={`mt-3 rounded-2xl border p-3 text-xs leading-6 ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`}>
                    <div className="flex items-center justify-end gap-3">
                      {selectedCourse.sponsorLogo && (
                        <img
                          src={selectedCourse.sponsorLogo}
                          alt="شعار Thompson"
                          loading="lazy"
                          className="h-14 w-14 rounded-xl bg-white object-contain p-1"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-black" style={{ color: theme.colors.secondary }}>الداعم الرسمي</div>
                        <div className={theme.classes.textMuted}>{selectedCourse.sponsorNote}</div>
                      </div>
                    </div>
                  </div>
                )}
                <div className={`mt-3 space-y-2 rounded-2xl border p-3 text-xs leading-6 ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`}>
                  <div className="font-black" style={{ color: theme.colors.secondary }}>شروط التقديم للدورة المجانية</div>
                  <div className={theme.classes.textMuted}>يجب أن يكون مستواك 80 أو أكثر، وأن يكون تقييمك ذهبيًا.</div>
                  <div className={theme.classes.textMuted}>آخر موعد للوصول إلى الشروط: {selectedCourse.applicationDeadline || '25 نوفمبر'}.</div>
                </div>
              </>
            )}

            {applicationMessage && (
              <div
                className={`mt-3 rounded-xl border px-3 py-2 text-center text-[10px] font-bold leading-6 ${applicationState === 'error' ? 'border-red-400/30 text-red-300' : 'border-emerald-400/30 text-emerald-300'}`}
              >
                {applicationMessage}
              </div>
            )}

            {reminderMessage && (
              <div
                className={`mt-3 rounded-xl border px-3 py-2 text-center text-[10px] font-bold ${reminderState === 'error' ? 'border-red-400/30 text-red-300' : 'border-emerald-400/30 text-emerald-300'}`}
              >
                {reminderMessage}
              </div>
            )}

            <div className={`mt-5 grid gap-2 ${selectedCourse.status === 'upcoming' ? 'grid-cols-2' : selectedCourse.isFree ? 'grid-cols-1' : 'grid-cols-1'}`}>
              {selectedCourse.isFree && (
                <button
                  type="button"
                  onClick={handleApplyForFreeCourse}
                  disabled={applicationState === 'checking' || applicationState === 'success'}
                  className="flex items-center justify-center gap-1.5 rounded-2xl px-3 py-3 text-xs font-black text-slate-950 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.primary})` }}
                >
                  <UsersRound className="h-4 w-4" />
                  {applicationState === 'checking' ? 'جارٍ التحقق...' : applicationState === 'success' ? 'تم التحقق من الشروط' : 'حجز المقعد الآن'}
                </button>
              )}
              {selectedCourse.status === 'upcoming' && (
                <button
                  type="button"
                  onClick={handleRegisterReminder}
                  disabled={reminderState === 'saving' || reminderState === 'success'}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-3 text-[10px] font-black transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  style={{
                    color: theme.colors.secondary,
                    borderColor: `${theme.colors.secondary}55`,
                    backgroundColor: `${theme.colors.secondary}14`,
                  }}
                >
                  <BellRing className="h-4 w-4" />
                  {reminderState === 'saving' ? 'جارٍ الحفظ...' : reminderState === 'success' ? 'تم تذكيري' : 'ذكرني عند فتح الدورة'}
                </button>
              )}
              <button
                type="button"
                onClick={closeCourseDialog}
                className="rounded-2xl px-4 py-3 text-xs font-black text-white transition-transform active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}
              >
                حسنًا
              </button>
            </div>
          </div>
        </div>
      )}
      </>}
    </div>
  );
};
