import React, { useState, useEffect, useRef } from 'react';
import { EducationalLesson, SubjectChapter, SubjectChapterLesson, OpenLessonContext, LearningPosition, UserProfile } from '../types';
import { getCurriculumForSubject } from '../data/mockCurriculums';
import { getSubjectIndex, getSubjectChapters, getChapterLessons, getLessonDetails, formatArabicLessonTitle, buildLessonKey } from '../services/lessonsService';
import { MapRewardsModal } from './MapRewardsModal';
import { MapLeaderboardModal } from './MapLeaderboardModal';
import { AdventureWorldMap } from './AdventureWorldMap';
import { useAppTheme } from '../services/themeService';
import {
  ArrowRight,
  CheckCircle2,
  Play,
  Lock,
  Clock,
  BookOpen,
  Sparkles,
  Award,
  ChevronDown,
  ChevronUp,
  Circle,
  FileText,
  Flame,
  Check,
  Map as MapIcon,
  List,
  Trophy,
  Gift,
  Star,
  Zap,
  Users,
  Compass,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

interface SubjectLearningPathViewProps {
  subject: {
    id: string;
    name: string;
    enName?: string;
    teacher: string;
    teacherAvatar: string;
    iconType: string;
    color: string;
    glowColor: string;
    bgGradient: string;
    borderColor: string;
    badgeColor: string;
    totalLessons?: number;
    lessonCountText?: string;
    lessonData?: EducationalLesson;
  };
  learningPosition?: LearningPosition | null;
  onPositionChange?: (pos: LearningPosition) => void;
  openLessonContext?: OpenLessonContext | null;
  user?: UserProfile | null;
  onSelectLesson: (lesson: EducationalLesson, context?: OpenLessonContext) => void;
  onBack: () => void;
  onOpenGames?: () => void;
  onScoreUpdate?: (points: number) => void;
}

export const SubjectLearningPathView: React.FC<SubjectLearningPathViewProps> = ({
  subject,
  learningPosition,
  onPositionChange,
  openLessonContext,
  user,
  onSelectLesson,
  onBack,
  onOpenGames,
  onScoreUpdate,
}) => {
  const { theme } = useAppTheme();
  const [chapters, setChapters] = useState<SubjectChapter[]>([]);
  const [selectedChapterNumber, setSelectedChapterNumber] = useState<number>(
    () => (learningPosition?.subjectId === subject.id && learningPosition?.chapterNumber) || 1
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadRequestIdRef = useRef<number>(0);

  // View state: 'map' (default island adventure map) or 'list' (detailed chapter list)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // State to toggle chapter collapse in list mode
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});

  // Modals state
  const [isRewardsOpen, setIsRewardsOpen] = useState(false);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);

  // Chests opened state
  const [openedChests, setOpenedChests] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Map rewards display the persisted user points without fabricating progress.
  const expCount = user?.points ?? 0;
  const [coinsCount, setCoinsCount] = useState(0);
  const [starsCount, setStarsCount] = useState(0);

  // Sync selectedChapterNumber if learningPosition changes externally
  useEffect(() => {
    if (learningPosition && learningPosition.subjectId === subject.id && learningPosition.chapterNumber) {
      setSelectedChapterNumber(learningPosition.chapterNumber);
    }
  }, [learningPosition, subject.id]);

  // Function to load lessons for a specific chapter number
  const loadLessonsForChapterNumber = async (
    chNumber: number,
    chaptersList: SubjectChapter[] = chapters
  ) => {
    const targetChapter = chaptersList.find((c) => c.number === chNumber) || chaptersList[0];
    if (!targetChapter) return;

    // If already loaded lessons, skip network
    if (targetChapter.lessons && targetChapter.lessons.length > 0) return;

    setIsLoadingLessons(true);
    try {
      const res = await getChapterLessons(
        subject.id,
        targetChapter.title,
        targetChapter.number || chNumber,
        subject.name
      );

      if (res.data && res.data.length > 0) {
        setChapters((prev) =>
          prev.map((c) =>
            c.number === targetChapter.number
              ? { ...c, lessons: res.data, lessonsCount: res.data.length }
              : c
          )
        );
      }
    } catch (e) {
      console.error('Failed to load chapter lessons:', e);
    } finally {
      setIsLoadingLessons(false);
    }
  };

  // 3-Stage Lazy Loading Architecture: Stage 1 Index Fetching
  useEffect(() => {
    const currentReqId = ++loadRequestIdRef.current;
    async function loadData() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        // 1. Try fast Stage 1 Subject Index first
        const subjectIndex = await getSubjectIndex(subject.id, subject.name);
        if (currentReqId !== loadRequestIdRef.current) return;

        let loadedChapters: SubjectChapter[] = [];

        if (subjectIndex && subjectIndex.chapters.length > 0) {
          loadedChapters = subjectIndex.chapters.map((ch) => {
            const lessons: SubjectChapterLesson[] = ch.lessons.map((l, lIdx) => ({
              id: l.lessonId,
              number: l.lessonNumber,
              title: l.title,
              duration: '20:00',
              status: lIdx === 0 ? 'in_progress' : 'available',
              progressPercentage: lIdx === 0 ? 25 : 0,
            }));

            return {
              id: `ch-${subject.id}-${ch.chapterNumber}`,
              number: ch.chapterNumber,
              title: ch.title,
              subtitle: `${subject.name} - السادس العلمي`,
              description: `الفصل الدراسي مع شروحات وألعاب واختبارات المنهج.`,
              lessonsCount: lessons.length,
              completedLessonsCount: 0,
              lessons,
            };
          });
        }

        // 2. If index returned no chapters, try getSubjectChapters
        if (loadedChapters.length === 0) {
          const res = await getSubjectChapters(subject.id, subject.name);
          if (currentReqId !== loadRequestIdRef.current) return;
          if (res.data && res.data.length > 0) {
            loadedChapters = res.data;
          } else {
            loadedChapters = getCurriculumForSubject(subject.id);
          }
          if (res.error) {
            setErrorMessage(res.error);
          }
        }

        setChapters(loadedChapters);

        // Determine starting chapter from saved learning position or default to first
        const initChNum =
          (learningPosition?.subjectId === subject.id && learningPosition?.chapterNumber) ||
          loadedChapters[0]?.number ||
          1;

        setSelectedChapterNumber(initChNum);
        loadLessonsForChapterNumber(initChNum, loadedChapters);
      } catch (err: any) {
        console.error('Failed to load chapters:', err);
        if (currentReqId === loadRequestIdRef.current) {
          const fallbackData = getCurriculumForSubject(subject.id);
          setChapters(fallbackData);
          const initChNum =
            (learningPosition?.subjectId === subject.id && learningPosition?.chapterNumber) ||
            fallbackData[0]?.number ||
            1;
          setSelectedChapterNumber(initChNum);
          loadLessonsForChapterNumber(initChNum, fallbackData);
          setErrorMessage('تعذر الاتصال بـ Supabase لجلب الفصول');
        }
      } finally {
        if (currentReqId === loadRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    }

    loadData();
  }, [subject.id, subject.name]);

  const handleSelectChapterNumber = (chNumber: number) => {
    setSelectedChapterNumber(chNumber);
    const targetChapter = chapters.find((c) => c.number === chNumber);
    const firstLesson = targetChapter?.lessons[0];

    onPositionChange?.({
      subjectId: subject.id,
      chapterNumber: chNumber,
      lessonNumber: firstLesson?.number ?? 1,
      lessonId: firstLesson?.id,
    });

    loadLessonsForChapterNumber(chNumber);
  };

  const toggleChapter = (chapterId: string) => {
    setCollapsedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const handleOpenChest = (chestId: string) => {
    if (openedChests.includes(chestId)) {
      showToast('🎉 لقد فتحت هذا الصندوق مسبقاً!');
      return;
    }
    setOpenedChests((prev) => [...prev, chestId]);
    setCoinsCount((prev) => prev + 50);
    setStarsCount((prev) => prev + 1);
    showToast('✨ مبروك! فُتح صندوق المكافأة وحصلت على +50 كوينز ونجمة ذهبية! ⭐');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Lazy load specific lesson JSON when clicked by user
  const handleSelectLessonWithLazyLoad = async (lessonItem: SubjectChapterLesson) => {
    try {
      const parentChapter =
        chapters.find((ch) => ch.lessons.some((l) => l.id === lessonItem.id)) ||
        chapters.find((ch) => ch.number === selectedChapterNumber) ||
        chapters[0];

      const chapterTitle = parentChapter ? parentChapter.title : 'الفصل الأول';
      const chapterNumber = parentChapter ? parentChapter.number : 1;

      const lessonContext: OpenLessonContext = {
        subjectId: subject.id,
        chapterNumber,
        lessonNumber: lessonItem.number,
        lessonId: lessonItem.id,
        lessonKey: buildLessonKey(subject.id, chapterNumber, lessonItem.number),
        title: lessonItem.title,
        lessonTitle: lessonItem.title,
      };

      onPositionChange?.({
        subjectId: subject.id,
        chapterNumber,
        lessonNumber: lessonItem.number,
        lessonId: lessonItem.id,
      });

      const res = await getLessonDetails(
        subject.id,
        chapterTitle,
        lessonItem.title,
        subject.name,
        chapterNumber,
        lessonItem.number
      );

      if (res.data) {
        onSelectLesson(res.data, lessonContext);
      } else {
        onSelectLesson(lessonItem.lessonData, lessonContext);
      }
    } catch (err) {
      console.error('Error in handleSelectLessonWithLazyLoad:', err);
      const parentChapter = chapters.find((ch) => ch.number === selectedChapterNumber) || chapters[0];
      const fallbackChapterNumber = parentChapter ? parentChapter.number : 1;
      const fallbackContext: OpenLessonContext = {
        subjectId: subject.id,
        chapterNumber: fallbackChapterNumber,
        lessonNumber: lessonItem.number,
        lessonId: lessonItem.id,
        lessonKey: buildLessonKey(subject.id, fallbackChapterNumber, lessonItem.number),
        title: lessonItem.title,
        lessonTitle: lessonItem.title,
      };
      onSelectLesson(lessonItem.lessonData, fallbackContext);
    }
  };

  // Calculate overall curriculum statistics
  const totalLessons = chapters.reduce((sum, ch) => sum + ch.lessons.length, 0);
  const completedLessons = chapters.reduce(
    (sum, ch) => sum + ch.lessons.filter((l) => l.status === 'completed').length,
    0
  );
  const overallPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  // Find active/current lesson to resume quickly in the active chapter or based on learningPosition
  const activeChapter = chapters.find((c) => c.number === selectedChapterNumber) || chapters[0];
  let currentResumeLesson: SubjectChapterLesson | null = null;

  if (activeChapter && activeChapter.lessons.length > 0) {
    currentResumeLesson =
      activeChapter.lessons.find(
        (l) =>
          l.id === learningPosition?.lessonId ||
          l.number === learningPosition?.lessonNumber
      ) ||
      activeChapter.lessons.find((l) => l.status === 'in_progress') ||
      activeChapter.lessons[0];
  }

  const handleStartNextChallenge = () => {
    if (currentResumeLesson) {
      handleSelectLessonWithLazyLoad(currentResumeLesson);
    }
  };

  const selectedChapterIndex = Math.max(0, chapters.findIndex((c) => c.number === selectedChapterNumber));

  return (
    <div className="min-h-full px-2 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-1 text-right animate-in fade-in duration-300 select-none space-y-2 sm:px-3">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-black text-xs sm:text-sm shadow-2xl border-2 border-white animate-bounce flex items-center gap-2">
          <span>🎁</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ERROR NOTICE (If Supabase error happens) */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage} (تم تفعيل المنهاج الاحتياطي)</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-[10px] text-rose-300 hover:text-white px-2 py-0.5 rounded bg-white/10"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* 2. MAIN VIEW BODY */}
      {viewMode === 'map' ? (
        /* ADVENTURE ISLANDS WORLD MAP VIEW */
        <div className="relative">
          <AdventureWorldMap
            chapters={chapters}
            subjectId={subject.id}
            subjectName={subject.name}
            subjectColor={subject.color}
            activeLesson={currentResumeLesson}
            onSelectLesson={handleSelectLessonWithLazyLoad}
            onOpenChest={handleOpenChest}
            openedChests={openedChests}
            selectedChapterNumber={selectedChapterNumber}
            onSelectChapterNumber={handleSelectChapterNumber}
            selectedChapterIndex={selectedChapterIndex}
            onSelectChapter={(idx) => {
              const ch = chapters[idx];
              if (ch) handleSelectChapterNumber(ch.number);
            }}
            isLoadingLessons={isLoadingLessons}
            isLoadingChapters={isLoading}
            onBack={onBack}
            onScoreUpdate={onScoreUpdate}
          />
        </div>
      ) : (
        /* DETAILED CHAPTERS & LESSONS LIST VIEW */
        <div className="space-y-4 animate-in fade-in">
          {chapters.map((chapter, chapterIndex) => {
            const isCollapsed = !!collapsedChapters[chapter.id];
            const chapterCompletedCount = chapter.lessons.filter((l) => l.status === 'completed').length;
            const isChapterFullyCompleted =
              chapter.lessons.length > 0 && chapterCompletedCount === chapter.lessons.length;
            const chapterProgress =
              chapter.lessons.length > 0
                ? Math.round((chapterCompletedCount / chapter.lessons.length) * 100)
                : 0;

            return (
              <div key={chapter.id} className="space-y-3">
                {/* Chapter Card */}
                <div className="rounded-2xl bg-[#091124]/95 border border-sky-500/30 overflow-hidden shadow-xl">
                  {/* Chapter Header */}
                  <div
                    onClick={() => toggleChapter(chapter.id)}
                    className="p-3.5 sm:p-4 bg-gradient-to-r from-[#0e1b3d] to-[#0a142c] flex items-center justify-between gap-3 cursor-pointer border-b border-white/5 select-none hover:bg-[#12224d] transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                          isChapterFullyCompleted
                            ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300'
                            : 'bg-[#182852] border-sky-400/40 text-sky-300'
                        }`}
                      >
                        {isChapterFullyCompleted ? <Check className="w-5 h-5" /> : chapter.number}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-black text-white truncate">
                          {chapter.title}
                        </h3>
                        {chapter.subtitle && (
                          <p className="text-[11px] sm:text-xs text-blue-200/70 truncate mt-0.5">
                            {chapter.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isChapterFullyCompleted
                            ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                            : 'bg-[#0f1d42] border-sky-500/30 text-sky-300'
                        }`}
                      >
                        {chapterCompletedCount}/{chapter.lessons.length} درس
                      </span>
                      <button
                        type="button"
                        aria-label="تبديل عرض الفصل"
                        className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors"
                      >
                        {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Lessons inside chapter */}
                  {!isCollapsed && (
                    <div className="p-3 sm:p-4 space-y-2.5">
                      {chapter.lessons.map((lessonItem) => {
                        const isCompleted = lessonItem.status === 'completed';
                        const isInProgress = lessonItem.status === 'in_progress';
                        const isLocked = lessonItem.status === 'locked';

                        return (
                          <div
                            key={lessonItem.id}
                            onClick={() => handleSelectLessonWithLazyLoad(lessonItem)}
                            className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer active:scale-[0.99] ${
                              isInProgress
                                ? 'bg-gradient-to-r from-[#0c224d] to-[#071533] border-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.2)]'
                                : isCompleted
                                ? 'bg-[#081229]/80 border-emerald-500/30 hover:border-emerald-400/60'
                                : 'bg-[#070f24] border-white/10 hover:border-sky-400/50'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 border ${
                                  isCompleted
                                    ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400'
                                    : isInProgress
                                    ? 'bg-amber-400 border-white text-black animate-pulse'
                                    : isLocked
                                    ? 'bg-gray-900 border-gray-700 text-gray-500'
                                    : 'bg-[#0e1f47] border-sky-400 text-sky-200'
                                }`}
                              >
                                {isCompleted ? (
                                  <Check className="w-4 h-4 stroke-[3]" />
                                ) : isLocked ? (
                                  <Lock className="w-3.5 h-3.5" />
                                ) : (
                                  <span>{lessonItem.number}</span>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                                  {formatArabicLessonTitle(lessonItem.title)}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                                  <Clock className="w-3 h-3 text-sky-400" />
                                  <span>{lessonItem.duration}</span>
                                  {isCompleted && <span className="text-emerald-400 font-bold">• تم الإنجاز</span>}
                                  {isInProgress && <span className="text-amber-300 font-bold">• جاري التعلم</span>}
                                </div>
                              </div>
                            </div>

                            <button className="px-3 py-1 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-black text-xs flex items-center gap-1 shadow">
                              <Play className="w-3 h-3 fill-current" />
                              <span>{isInProgress ? 'متابعة' : 'بدء'}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODALS */}
      <MapRewardsModal
        isOpen={isRewardsOpen}
        onClose={() => setIsRewardsOpen(false)}
        starsCount={starsCount}
        coinsCount={coinsCount}
        expCount={expCount}
      />

      <MapLeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
        currentUser={user}
      />
    </div>
  );
};

