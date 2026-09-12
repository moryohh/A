import React, { Component, useState } from 'react';
import {
  INITIAL_STORIES,
  FEATURED_LESSON,
} from './data/mockData';
import { getGamesForLesson } from './data/mockGames';
import {
  TeacherStory,
  EducationalLesson,
  LessonAttachment,
  AppNotification,
  CommentItem,
  CommunityPost,
  CommunityComment,
  CommunityMember,
  OpenLessonContext,
  LearningPosition,
  CompetitionSnapshot,
} from './types';
import { Header } from './components/Header';
import { StoriesSection } from './components/StoriesSection';
import { StoryViewerModal } from './components/StoryViewerModal';
import { VideoPlayerCard } from './components/VideoPlayerCard';
import { AttachmentModal } from './components/AttachmentModal';
import { CommentsDrawer } from './components/CommentsDrawer';
import { NotificationsModal } from './components/NotificationsModal';
import { TeacherInfoModal } from './components/TeacherInfoModal';
import { BottomNav, NavTab } from './components/BottomNav';
import { SubscriptionsView } from './components/SubscriptionsView';
import { ProfileView } from './components/ProfileView';
import { PlantGrowthPreview } from './components/PlantGrowthPreview';
import { SettingsView } from './components/SettingsView';
import { CommunityView } from './components/CommunityView';
import { CreatePostModal } from './components/CreatePostModal';
import { CommunityCommentsModal } from './components/CommunityCommentsModal';
import { MessengerModal } from './components/MessengerModal';
import { CommunityProfileModal } from './components/CommunityProfileModal';
import { MainHomeView } from './components/MainHomeView';
import { SubjectLearningPathView } from './components/SubjectLearningPathView';
import { GRADE_6_SUBJECTS } from './data/mockSubjects';
import { Toast } from './components/Toast';
import { PwaInstallBanner } from './components/PwaInstallBanner';
import { cleanTeacherName } from './utils/cleanTeacherName';
import { ThemeProvider, useAppTheme } from './services/themeService';
import { LoginPage } from './components/LoginPage';
import { DailyExamModal } from './components/DailyExamModal';
import {
  getInitialAuthState,
  onAuthStateChange,
  signOutUser,
} from './services/authService';
import { UserProfile } from './types';
import { Loader2 } from 'lucide-react';
import {
  clearLessonsCache,
  getSubjectChapters,
  getChapterLessons,
  buildLessonKey,
  extractYoutubeId,
} from './services/lessonsService';
import {
  fetchCommunityPosts,
  createCommunityPost,
  toggleLikeCommunityPost,
  addCommunityComment,
  reportCommunityPost,
  updateUserProfileData,
} from './services/communityService';
import { fetchUnreadMessageCount } from './services/messengerService';
import { getLevelSnapshot } from './services/pointsService';
import { collectGrowthPoints, getGrowthSession, queueGrowthPoints, resetGrowthSession } from './services/growthSessionService';
import {
  fetchCompetitionSnapshot,
  recordActivityBlock,
  recordPeriodPoints,
  recordAssessmentResult,
} from './services/competitionService';

const LessonGamesModal = React.lazy(() =>
  import('./components/LessonGamesModal').then(({ LessonGamesModal: LazyLessonGamesModal }) => ({
    default: LazyLessonGamesModal,
  }))
);

interface GamesLoadBoundaryProps {
  onClose: () => void;
  children: React.ReactNode;
}

class GamesLoadBoundary extends Component<GamesLoadBoundaryProps, { hasError: boolean }> {
  declare props: GamesLoadBoundaryProps;
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/85 p-4 font-cairo">
        <div className="w-full max-w-sm rounded-3xl border border-amber-400/40 bg-[#08152e] p-6 text-center text-white shadow-2xl">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/40 bg-amber-400/10 text-amber-300">
            <Loader2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-black">تعذر فتح ألعاب الدرس</h2>
          <p className="mt-2 text-sm leading-7 text-slate-300">
            لم يتم تحميل مكوّن الألعاب الآن. يمكنك إغلاق النافذة أو إعادة المحاولة.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={this.props.onClose}
              className="rounded-2xl border border-slate-500/50 bg-slate-700/60 px-3 py-3 text-xs font-black text-slate-100"
            >
              إغلاق
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-300 px-3 py-3 text-xs font-black text-slate-950"
            >
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const LEARNING_POSITIONS_STORAGE_KEY = 'nahnu_maek_learning_positions_v2';
const NOTIFICATIONS_STORAGE_KEY = 'nahnu_maek_notifications_v2';

function loadStoredNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as AppNotification[];
    }
  } catch (error) {
    console.debug('Failed to load notifications:', error);
  }
  return [];
}

function loadStoredPositions(): Record<string, LearningPosition> {
  try {
    const raw = localStorage.getItem(LEARNING_POSITIONS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.debug('Failed to load learning positions:', e);
  }
  return {};
}

function saveStoredPosition(pos: LearningPosition) {
  try {
    const current = loadStoredPositions();
    current[pos.subjectId] = pos;
    localStorage.setItem(LEARNING_POSITIONS_STORAGE_KEY, JSON.stringify(current));
  } catch (e) {
    console.debug('Failed to save learning position:', e);
  }
}

function AppContent() {
  const { theme } = useAppTheme();

  // Authentication state - Strictly driven by Supabase Auth sessions
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [growthSession, setGrowthSession] = useState({ points: 0, pendingPoints: 0 });

  // Main app state
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [homeSubView, setHomeSubView] = useState<'main_home' | 'learning_path' | 'lesson_player'>('main_home');
  const [selectedSubject, setSelectedSubject] = useState<(typeof GRADE_6_SUBJECTS)[0] | null>(GRADE_6_SUBJECTS[0]);
  const [stories, setStories] = useState<TeacherStory[]>(INITIAL_STORIES);
  const [lesson, setLesson] = useState<EducationalLesson>(FEATURED_LESSON);
  const [notifications, setNotifications] = useState<AppNotification[]>(loadStoredNotifications);

  React.useEffect(() => {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.debug('Failed to save notifications:', error);
    }
  }, [notifications]);
  const [competitionSnapshot, setCompetitionSnapshot] = useState<CompetitionSnapshot | null>(null);
  const lastActivityPointsRef = React.useRef<number | null>(null);
  const activityBlockStartedAtRef = React.useRef<number | null>(null);
  const activityRecordingRef = React.useRef(false);

  // Learning Position & Context Management
  const [savedPositions, setSavedPositions] = useState<Record<string, LearningPosition>>(loadStoredPositions);
  const [learningPosition, setLearningPosition] = useState<LearningPosition | null>(() => {
    const initialSubId = GRADE_6_SUBJECTS[0]?.id || 'biology';
    const stored = loadStoredPositions();
    return stored[initialSubId] || { subjectId: initialSubId, chapterNumber: 1, lessonNumber: 1 };
  });
  const [openLessonContext, setOpenLessonContext] = useState<OpenLessonContext | null>(null);

  // Community state
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [activeCommunityPostForComments, setActiveCommunityPostForComments] = useState<CommunityPost | null>(null);
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);
  const [messengerContact, setMessengerContact] = useState<CommunityMember | null>(null);
  const [communityProfileMember, setCommunityProfileMember] = useState<CommunityMember | null>(null);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Load Community posts and stories from Supabase on startup and when user changes
  React.useEffect(() => {
    let isMounted = true;
    async function loadCommunity() {
      try {
        const loadedPosts = await fetchCommunityPosts(currentUser?.id);
        if (isMounted) {
          const posts = loadedPosts || [];
          setCommunityPosts(posts);

          // Comment notifications are generated only for real comments on this student's own posts.
          const commentNotifications: AppNotification[] = posts.flatMap((post) => (
            post.isOwnPost
              ? post.comments
                .filter((comment) => comment.userId !== currentUser?.id && comment.text.trim().length > 0)
                .map((comment) => ({
                  id: `community-comment-${comment.id}`,
                  title: 'تعليق جديد على منشورك',
                  message: `${comment.userName} علّق: ${comment.text.slice(0, 100)}`,
                  time: comment.timeAgo,
                  isRead: false,
                  type: 'community' as const,
                }))
              : []
          ));
          if (commentNotifications.length > 0) {
            setNotifications((previous) => [
              ...commentNotifications,
              ...previous.filter((item) => !commentNotifications.some((notification) => notification.id === item.id)),
            ].slice(0, 50));
          }
        }
      } catch (err) {
        console.debug('Error loading community data:', err);
      }
    }
    loadCommunity();
    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  React.useEffect(() => {
    if (!currentUser?.id) {
      setUnreadMessageCount(0);
      return;
    }
    fetchUnreadMessageCount(currentUser)
      .then(setUnreadMessageCount)
      .catch(() => setUnreadMessageCount(0));
  }, [currentUser?.id]);

  // A message notification is created only from the real unread count returned by the messaging service.
  React.useEffect(() => {
    if (!currentUser?.id || unreadMessageCount <= 0) return;
    const messageNotification: AppNotification = {
      id: `unread-messages-${currentUser.id}`,
      title: 'لديك رسائل جديدة',
      message: `لديك ${unreadMessageCount} رسالة غير مقروءة. افتح الرسائل لقراءتها.`,
      time: 'الآن',
      isRead: false,
      type: 'community',
    };
    setNotifications((previous) => [
      messageNotification,
      ...previous.filter((item) => item.id !== messageNotification.id),
    ].slice(0, 50));
  }, [currentUser?.id, unreadMessageCount]);

  const openMessenger = (member: CommunityMember | null = null) => {
    setMessengerContact(member);
    setCommunityProfileMember(null);
    setIsMessengerOpen(true);
  };

  // Modals & Drawers state
  const [selectedStory, setSelectedStory] = useState<TeacherStory | null>(null);
  const [activeAttachment, setActiveAttachment] = useState<LessonAttachment | null>(null);
  const [isAttachmentOpen, setIsAttachmentOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isTeacherInfoOpen, setIsTeacherInfoOpen] = useState(false);
  const [isGamesOpen, setIsGamesOpen] = useState(false);
  const [isDailyExamOpen, setIsDailyExamOpen] = useState(false);


  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize and listen to Auth state (Google OAuth, dev bypass, sessions)
  React.useEffect(() => {
    let isMounted = true;
    getInitialAuthState().then((user) => {
      if (isMounted) {
        if (user) setCurrentUser(user);
        setIsAuthChecking(false);
      }
    });

    const unsubscribe = onAuthStateChange((user) => {
      if (isMounted) {
        setCurrentUser(user);
        setIsAuthChecking(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    resetGrowthSession(currentUser?.id);
    setGrowthSession({ points: 0, pendingPoints: 0 });
    await signOutUser();
    setCurrentUser(null);
    setActiveTab('home');
    setHomeSubView('main_home');
    showToast('تم تسجيل الخروج بنجاح');
  };

  React.useEffect(() => {
    clearLessonsCache();
  }, []);

  // Restore a locally selected avatar immediately, even before a profile request finishes.
  React.useEffect(() => {
    if (!currentUser?.id) return;
    const storedAvatar = localStorage.getItem(`nahnu_maak_avatar_${currentUser.id}`);
    if (storedAvatar && storedAvatar !== currentUser.avatarUrl) {
      setCurrentUser((previous) => (previous ? { ...previous, avatarUrl: storedAvatar } : previous));
    }
  }, [currentUser?.id]);

  React.useEffect(() => {
    setGrowthSession(getGrowthSession(currentUser?.id));
  }, [currentUser?.id]);

  // Sync stories whenever the active lesson changes (showing the teachers who teach this exact lesson)
  React.useEffect(() => {
    if (lesson && (lesson as any).teacherStories && (lesson as any).teacherStories.length > 0) {
      setStories((lesson as any).teacherStories);
    }
  }, [lesson]);

  const handleSelectSubject = (subject: (typeof GRADE_6_SUBJECTS)[0]) => {
    setSelectedSubject(subject);
    setStories([]);
    setOpenLessonContext(null);
    const existingPos = savedPositions[subject.id] || {
      subjectId: subject.id,
      chapterNumber: 1,
      lessonNumber: 1,
    };
    setLearningPosition(existingPos);
    setHomeSubView('learning_path');
  };

  // Always open a subject from the top so the global header is visible immediately.
  React.useEffect(() => {
    if (activeTab !== 'home' || homeSubView !== 'learning_path') return;

    const resetPageScroll = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetPageScroll();
    const frameId = window.requestAnimationFrame(resetPageScroll);
    return () => window.cancelAnimationFrame(frameId);
  }, [activeTab, homeSubView, selectedSubject?.id]);

  const handlePositionChange = (pos: LearningPosition) => {
    setLearningPosition(pos);
    setSavedPositions((prev) => ({ ...prev, [pos.subjectId]: pos }));
    saveStoredPosition(pos);
  };

  const handleSelectLessonWithContext = (
    selectedLesson: EducationalLesson,
    context?: OpenLessonContext
  ) => {
    setLesson(selectedLesson);
    if (context) {
      const resolvedContext: OpenLessonContext = {
        ...context,
        lessonKey:
          context.lessonKey ||
          buildLessonKey(context.subjectId, context.chapterNumber, context.lessonNumber),
        title: context.title || context.lessonTitle || selectedLesson.title,
        lessonTitle: context.lessonTitle || context.title || selectedLesson.title,
      };
      setOpenLessonContext(resolvedContext);
      const newPos: LearningPosition = {
        subjectId: resolvedContext.subjectId,
        chapterNumber: resolvedContext.chapterNumber,
        lessonNumber: resolvedContext.lessonNumber,
        lessonId: resolvedContext.lessonId,
        lessonKey: resolvedContext.lessonKey,
      };
      handlePositionChange(newPos);
    } else if (selectedSubject) {
      const defaultCtx: OpenLessonContext = {
        subjectId: selectedSubject.id,
        chapterNumber: learningPosition?.chapterNumber || 1,
        lessonNumber: learningPosition?.lessonNumber || 1,
        lessonId: selectedLesson.id,
        lessonKey: buildLessonKey(
          selectedSubject.id,
          learningPosition?.chapterNumber || 1,
          learningPosition?.lessonNumber || 1
        ),
        title: selectedLesson.title,
        lessonTitle: selectedLesson.title,
      };
      setOpenLessonContext(defaultCtx);
    }
    if ((selectedLesson as any).teacherStories && (selectedLesson as any).teacherStories.length > 0) {
      setStories((selectedLesson as any).teacherStories);
    }
    setHomeSubView('lesson_player');
  };

  // Dynamic Stories: Update stories based on selected subject and chapters from Supabase Storage
  React.useEffect(() => {
    let isMounted = true;
    async function loadDynamicStories() {
      if (!selectedSubject) return;

      // Do not overwrite stories belonging to the exact lesson currently open.
      // A lesson from another subject must not block loading the new subject's stories.
      const lessonMatchesSubject =
        lesson &&
        [selectedSubject.id, selectedSubject.name, selectedSubject.enName].some(
          (value) => Boolean(value) && (lesson.category === value || lesson.subtitle?.includes(value as string))
        );
      if (lessonMatchesSubject && (lesson as any).teacherStories && (lesson as any).teacherStories.length > 0) {
        return;
      }

      try {
        const chaptersRes = await getSubjectChapters(selectedSubject.id, selectedSubject.name);
        if (!isMounted) return;

        const chapters = chaptersRes.data || [];
        if (chapters.length > 0) {
          // Fetch lessons from the first chapter
          const firstChapter = chapters[0];
          const lessonsRes = await getChapterLessons(
            selectedSubject.id,
            firstChapter.title,
            1,
            selectedSubject.name
          );
          if (!isMounted) return;

          const chapterLessons = lessonsRes.data || [];
          if (chapterLessons.length > 0) {
            const dynamicStories: TeacherStory[] = chapterLessons
              .filter((cl) => {
                const testId = extractYoutubeId(
                  cl.lessonData?.youtubeId,
                  cl.title,
                  cl.lessonData?.teacherName || selectedSubject.teacher,
                  cl.subtitle
                );
                return Boolean(testId);
              })
              .map((cl, idx) => {
                const rawName = cl.lessonData?.teacherName || selectedSubject.teacher || `مدرس ${idx + 1}`;
                const tName = cleanTeacherName(rawName) || rawName;
                const rawRole = cl.lessonData?.teacherRole || `الدرس ${idx + 1}`;
                const cName = cleanTeacherName(rawRole) || rawRole;
                const yId = extractYoutubeId(
                  cl.lessonData?.youtubeId,
                  cl.title,
                  tName,
                  cl.subtitle
                );
                const yThumb = `https://img.youtube.com/vi/${yId}/hqdefault.jpg`;

                return {
                  id: `story-${selectedSubject.id}-${cl.id}`,
                  teacherName: tName,
                  channelName: cName,
                  subject: selectedSubject.name,
                  title: cl.title,
                  avatar: cl.lessonData?.teacherAvatar && !cl.lessonData.teacherAvatar.includes('unsplash.com/photo-1573496359142') ? cl.lessonData.teacherAvatar : yThumb,
                  hasUnseen: true,
                  duration: '15:20',
                  youtubeId: yId,
                  videoUrl: `https://www.youtube.com/watch?v=${yId}`,
                  storyImage: yThumb,
                  textNotes: cl.subtitle || `شرح ${cl.title} لمادة ${selectedSubject.name}`,
                  lessonData: cl.lessonData,
                  lessonContext: {
                    subjectId: selectedSubject.id,
                    chapterNumber: firstChapter.number,
                    lessonNumber: cl.number,
                    lessonId: cl.id,
                    title: cl.title,
                    lessonTitle: cl.title,
                  },
                };
              });

            setStories(dynamicStories);
          }
        }
      } catch (err) {
        console.error('Error loading dynamic stories:', err);
      }
    }

    loadDynamicStories();
    return () => {
      isMounted = false;
    };
  }, [selectedSubject.id, selectedSubject.name, selectedSubject.enName, lesson?.id, lesson?.category, lesson?.subtitle, lesson?.teacherStories?.length]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const applyCompetitionSnapshot = (snapshot: CompetitionSnapshot, showActivityToast = false) => {
    setCompetitionSnapshot(snapshot);
    setCurrentUser((previous) => {
      if (!previous) return previous;
      if ((previous.points ?? 0) === snapshot.points && (previous.level ?? 1) === snapshot.level) return previous;
      return { ...previous, points: snapshot.points, level: snapshot.level };
    });

    const previousActivityPoints = lastActivityPointsRef.current;
    if (showActivityToast && previousActivityPoints !== null && snapshot.activityPointsToday > previousActivityPoints) {
      showToast(`+${snapshot.activityPointsToday - previousActivityPoints} نقطة نشاط`);
    }
    lastActivityPointsRef.current = snapshot.activityPointsToday;
  };

  const handleAssessmentResult = async (correctPoints: number, totalPoints: number) => {
    const snapshot = await recordAssessmentResult(correctPoints, totalPoints);
    if (snapshot) applyCompetitionSnapshot(snapshot);
  };

  const handleDailyExamCompleted = (result: {
    score: number;
    totalScore: number;
    percentage: number;
    subject: string;
    lessonTitle: string;
    completedAt: string;
  }) => {
    const completedDate = new Date(result.completedAt).toLocaleDateString('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const notification: AppNotification = {
      id: `daily-exam-result-${result.completedAt}`,
      title: 'نتيجة الامتحان اليومي',
      message: `درجتك ${result.score} من ${result.totalScore} في الامتحان اليومي لمادة ${result.subject} — ${result.lessonTitle}. تاريخ الامتحان: ${completedDate}.`,
      time: 'الآن',
      isRead: false,
      type: 'system',
    };
    setNotifications((previous) => [
      notification,
      ...previous.filter((item) => item.id !== notification.id),
    ].slice(0, 50));
    showToast(`تم حفظ نتيجتك: ${result.score} من ${result.totalScore}`);
  };

  React.useEffect(() => {
    const handleChapterExamResult = (event: Event) => {
      const detail = (event as CustomEvent<{
        id: string;
        title: string;
        message: string;
        submittedAt: string;
      }>).detail;
      if (!detail?.id || !detail.message) return;
      const notification: AppNotification = {
        id: detail.id,
        title: detail.title || 'نتيجة الامتحان',
        message: detail.message,
        time: 'الآن',
        isRead: false,
        type: 'system',
      };
      setNotifications((previous) => [
        notification,
        ...previous.filter((item) => item.id !== notification.id),
      ].slice(0, 50));
      showToast('وصل إشعار نتيجة الامتحان');
    };

    window.addEventListener('chapter-exam-result', handleChapterExamResult);
    return () => window.removeEventListener('chapter-exam-result', handleChapterExamResult);
  }, []);

  // Count only visible, recently active time. The database function enforces the 5-point daily cap.
  React.useEffect(() => {
    if (!currentUser?.id) {
      setCompetitionSnapshot(null);
      lastActivityPointsRef.current = null;
      activityBlockStartedAtRef.current = null;
      return;
    }

    let isMounted = true;
    let lastInteractionAt = Date.now();
    const activityEvents = ['pointerdown', 'keydown', 'touchstart', 'scroll'];
    const markInteraction = () => {
      const now = Date.now();
      if (now - lastInteractionAt > 90_000) activityBlockStartedAtRef.current = now;
      lastInteractionAt = now;
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        lastInteractionAt = Date.now();
        activityBlockStartedAtRef.current = Date.now();
      }
    };

    activityEvents.forEach((eventName) => window.addEventListener(eventName, markInteraction, { passive: true }));
    document.addEventListener('visibilitychange', handleVisibility);
    activityBlockStartedAtRef.current = Date.now();

    fetchCompetitionSnapshot().then((snapshot) => {
      if (isMounted && snapshot) applyCompetitionSnapshot(snapshot);
    });

    const intervalId = window.setInterval(async () => {
      const now = Date.now();
      const isVisible = document.visibilityState === 'visible';
      const isRecentlyActive = now - lastInteractionAt <= 90_000;
      const startedAt = activityBlockStartedAtRef.current ?? now;
      if (!isVisible || !isRecentlyActive) {
        activityBlockStartedAtRef.current = now;
        return;
      }
      if (now - startedAt < 5 * 60_000 || activityRecordingRef.current) return;

      activityBlockStartedAtRef.current = now;
      activityRecordingRef.current = true;
      const snapshot = await recordActivityBlock();
      activityRecordingRef.current = false;
      if (isMounted && snapshot) applyCompetitionSnapshot(snapshot, true);
    }, 30_000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, markInteraction));
      document.removeEventListener('visibilitychange', handleVisibility);
      activityRecordingRef.current = false;
    };
  }, [currentUser?.id]);

  const handleScoreUpdate = async (points: number) => {
    if (!currentUser || points <= 0) return;

    const nextTotalPoints = (currentUser.points ?? 0) + points;
    const levelSnapshot = getLevelSnapshot(nextTotalPoints);
    const optimisticUser: UserProfile = {
      ...currentUser,
      points: nextTotalPoints,
      level: levelSnapshot.level,
    };

    setCurrentUser(optimisticUser);
    setGrowthSession(queueGrowthPoints(currentUser.id, points));
    setCompetitionSnapshot((previous) => previous ? { ...previous, points: nextTotalPoints, level: levelSnapshot.level } : previous);
    showToast(`أضيفت ${points} ${points === 1 ? 'نقطة' : 'نقاط'} إلى مستواك`);

    const [savedUser] = await Promise.all([
      updateUserProfileData(currentUser.id, {
        points: nextTotalPoints,
        level: levelSnapshot.level,
      }),
      recordPeriodPoints(points).then((snapshot) => {
        if (snapshot) {
          setCompetitionSnapshot(snapshot);
        }
        return snapshot;
      }),
    ]);
    if (savedUser) {
      setCurrentUser((previous) => ({
        ...(previous || optimisticUser),
        ...savedUser,
        points: savedUser.points ?? nextTotalPoints,
        level: savedUser.level ?? levelSnapshot.level,
      }));
    }
  };

  const handleCollectGrowthPoints = () => {
    if (!currentUser) return 0;
    const result = collectGrowthPoints(currentUser.id, currentUser.growthShieldTier ?? 0);
    if (result.collected <= 0) return 0;
    setGrowthSession({ points: result.points, pendingPoints: 0 });
    if (result.completedCycles > 0) {
      const updatedUser = { ...currentUser, growthShieldTier: result.nextShieldTier };
      setCurrentUser(updatedUser);
      void updateUserProfileData(currentUser.id, { growthShieldTier: result.nextShieldTier });
      showToast('اكتملت دورة النبتة! حصلت على درع جديد.');
    }
    return result.collected;
  };

  // Handlers - Direct Teacher Switching without Story Modals
  const handleSelectStory = (story: TeacherStory) => {
    // Switch the video inside the exact lesson that is already open.
    // Do not fetch by title or default to chapter 1: that can reopen a generic JSON file.
    if (story.lessonContext) {
      setOpenLessonContext((prev) => ({
        ...prev,
        ...story.lessonContext,
        title: story.lessonContext?.title || story.lessonContext?.lessonTitle,
        lessonTitle: story.lessonContext?.lessonTitle || story.lessonContext?.title,
      }));
    }

    if (story.lessonData) {
      setLesson(story.lessonData);
    } else if (story.youtubeId) {
      setLesson((prev) => ({
        ...prev,
        id: story.lessonContext?.lessonId || prev.id,
        title: story.lessonContext?.title || story.lessonContext?.lessonTitle || prev.title,
        subtitle: prev.subtitle,
        category: story.lessonContext?.subjectId || prev.category,
        teacherName: story.teacherName,
        teacherAvatar: story.avatar,
        teacherRole: story.channelName || story.teacherName,
        youtubeId: story.youtubeId,
        duration: story.duration || prev.duration,
        description: story.textNotes || prev.description,
      }));
    }

    // Match the subject without deriving an invalid ID from the story slug.
    const matchedSubject = GRADE_6_SUBJECTS.find(
      (s) => s.name === story.subject || s.id === story.lessonContext?.subjectId
    );
    if (matchedSubject) {
      setSelectedSubject(matchedSubject);
    }

    // Ensure the video player view is shown immediately.
    setActiveTab('home');
    setHomeSubView('lesson_player');

    // DO NOT open any full-screen story modal!
    setSelectedStory(null);

    showToast(`▶ تم اختيار شرح ${story.teacherName}`);

    // Mark story as seen.
    setStories((prev) =>
      prev.map((s) => (s.id === story.id ? { ...s, hasUnseen: false } : s))
    );
  };

  const handleNextStory = () => {
    if (!selectedStory) return;
    const currentIndex = stories.findIndex((s) => s.id === selectedStory.id);
    if (currentIndex < stories.length - 1) {
      handleSelectStory(stories[currentIndex + 1]);
    } else {
      setSelectedStory(null);
    }
  };

  const handlePrevStory = () => {
    if (!selectedStory) return;
    const currentIndex = stories.findIndex((s) => s.id === selectedStory.id);
    if (currentIndex > 0) {
      handleSelectStory(stories[currentIndex - 1]);
    }
  };

  const handleToggleBookmark = () => {
    setLesson((prev) => {
      const nextState = !prev.isBookmarked;
      showToast(nextState ? 'تم حفظ الدرس 📌' : 'تم إزالة الدرس من المحفوظات');
      return { ...prev, isBookmarked: nextState };
    });
  };

  const handleToggleLike = () => {
    setLesson((prev) => {
      const nextLiked = !prev.isLiked;
      showToast(nextLiked ? 'شكراً لإعجابك بالدرس! 👍' : 'تم إلغاء الإعجاب');
      return {
        ...prev,
        isLiked: nextLiked,
      };
    });
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    showToast('تم نسخ رابط الدرس بنجاح! 🔗');
  };

  const handleDownloadAttachment = (title: string) => {
    showToast(`جاري تحميل "${title}"... 📥`);
  };

  const handleAddComment = (text: string) => {
    const newComment: CommentItem = {
      id: `c-${Date.now()}`,
      userName: 'أنت (طالب منصة نحن معك)',
      userAvatar:
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      timeAgo: 'الآن',
      text,
      likes: 0,
      isLiked: false,
    };

    setLesson((prev) => ({
      ...prev,
      comments: [newComment, ...prev.comments],
    }));

    showToast('تم إضافة تعليقك بنجاح! 💬');
  };

  const handleMarkAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('تم تحديد جميع الإشعارات كأنها قُرئت');
  };

  // Community Handlers
  const handleCreatePost = async (newPostData: Omit<CommunityPost, 'id' | 'likesCount' | 'commentsCount' | 'isLiked' | 'comments'>) => {
    try {
      const createdPost = await createCommunityPost(newPostData, currentUser?.id);
      setCommunityPosts((prev) => [createdPost, ...prev]);
      setIsCreatePostOpen(false);
      showToast('تم نشر منشورك في المجتمع الطلابي بنجاح!');
    } catch (err: any) {
      console.error('Failed to create post:', err);
      showToast(err?.message || 'تعذر نشر المنشور حالياً');
    }
  };

  const handleToggleLikeCommunityPost = async (postId: string) => {
    try {
      const result = await toggleLikeCommunityPost(postId, currentUser?.id);
      setCommunityPosts((prev) => prev.map((post) => post.id === postId ? {
        ...post,
        isLiked: result.isLiked,
        likesCount: result.likesCount,
      } : post));
    } catch (err: any) {
      console.error('Error toggling like:', err);
      showToast(err?.message || 'تعذر تسجيل الإعجاب حالياً');
    }
  };

  const handleShareCommunityPost = (post: CommunityPost) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
    }
    showToast(`تم نسخ رابط منشور ${post.userName}! 🔗`);
  };

  const handleReportCommunityPost = async (postId: string) => {
    try {
      await reportCommunityPost(postId);
      showToast('تم إرسال البلاغ إلى الإدارة');
    } catch (err: any) {
      showToast(err?.message || 'تعذر إرسال البلاغ حالياً');
    }
  };

  const handleAddCommunityComment = async (postId: string, text: string) => {
    try {
      const newComment = await addCommunityComment(postId, text, currentUser);
      setCommunityPosts((prev) =>
        prev.map((p) => {
          if (p.id === postId) {
            const updatedComments = [newComment, ...p.comments];
            const updatedPost = {
              ...p,
              comments: updatedComments,
              commentsCount: updatedComments.length,
            };
            if (activeCommunityPostForComments?.id === postId) {
              setActiveCommunityPostForComments(updatedPost);
            }
            return updatedPost;
          }
          return p;
        })
      );
      showToast('تم إضافة تعليقك على المنشور! 💬');
    } catch (err: any) {
      console.error('Error adding comment:', err);
      showToast(err?.message || 'تعذر إضافة التعليق حالياً');
      throw err;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // 1. Initial Auth Verification Loader
  if (isAuthChecking && !currentUser) {
    return (
      <div className={`min-h-screen ${theme.classes.outerBg} ${theme.classes.textMain} flex items-center justify-center font-cairo`}>
        <div className="flex flex-col items-center gap-3 p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.colors.primary }} />
          <p className="text-xs font-bold opacity-75">جاري التحقق من الحساب...</p>
        </div>
      </div>
    );
  }

  // 2. Gateway Login Screen: Shown if not authenticated
  if (!currentUser) {
    return (
      <div className={`min-h-screen ${theme.classes.outerBg} ${theme.classes.textMain} flex flex-col items-center justify-center font-cairo`}>
        <Toast message={toastMessage} onClear={() => setToastMessage(null)} />
        <LoginPage onLoginSuccess={(user) => {
          setCurrentUser(user);
          showToast(`أهلاً بك يا ${user.name}`);
        }} />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${theme.classes.outerBg} ${theme.classes.textMain} flex flex-col items-center justify-start antialiased font-cairo transition-colors duration-300`}
    >
      {/* Toast Feedback Notification */}
      <Toast message={toastMessage} onClear={() => setToastMessage(null)} />

      {/* Outer Shell for Mobile-first responsive wrapper */}
      <div
        className={`w-full max-w-md min-h-screen ${theme.classes.wrapperBg} shadow-2xl relative border-x ${theme.classes.cardBorder} pb-16 flex flex-col overflow-hidden transition-all duration-300`}
      >
        {/* Dynamic Ambient Theme Glows */}
        <div
          className="absolute top-1/4 -right-20 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-30 transition-all duration-500"
          style={{ backgroundColor: theme.colors.primary }}
        />
        <div
          className="absolute top-2/3 -left-20 w-60 h-60 rounded-full blur-3xl pointer-events-none opacity-25 transition-all duration-500"
          style={{ backgroundColor: theme.colors.accent }}
        />

        {/* Header */}
        <Header
          title={
            activeTab === 'home'
              ? homeSubView === 'lesson_player'
                ? lesson.title
                : homeSubView === 'learning_path'
                ? selectedSubject
                  ? `خارطة ${selectedSubject.name}`
                  : 'خارطة المنهج'
                : 'الصفحة الرئيسية - السادس'
              : activeTab === 'community'
              ? 'المجتمع الطلابي'
              : activeTab === 'subscriptions'
              ? 'الاشتراكات والدروس'
              : activeTab === 'profile'
              ? 'الملف الشخصي'
              : 'الإعدادات'
          }
          unreadCount={unreadCount}
          showBackButton={
            activeTab !== 'community' &&
            !(activeTab === 'home' && homeSubView === 'learning_path') &&
            (activeTab !== 'home' || homeSubView !== 'main_home')
          }
          onBack={() => {
            if (activeTab === 'home') {
              if (homeSubView === 'lesson_player') {
                setHomeSubView(selectedSubject ? 'learning_path' : 'main_home');
              } else if (homeSubView === 'learning_path') {
                setHomeSubView('main_home');
              }
            } else {
              setActiveTab('home');
              setHomeSubView('main_home');
            }
          }}
          onOpenNotifications={() => {
            setNotifications((previous) => previous.map((item) => ({ ...item, isRead: true })));
            setIsNotificationsOpen(true);
          }}
          onOpenProfile={() => setActiveTab('profile')}
          onOpenGames={() => setIsGamesOpen(true)}
          onOpenMessenger={() => openMessenger()}
          unreadMessagesCount={unreadMessageCount}
        />

        {/* Tab Content Router */}
        <main className="flex-1">
          {/* 1. Main Home Subject Grid */}
          {activeTab === 'home' && homeSubView === 'main_home' && (
            <MainHomeView
              onSelectSubject={handleSelectSubject}
              onSelectLesson={(selectedLesson) => {
                handleSelectLessonWithContext(selectedLesson);
              }}
              onOpenGames={() => setIsGamesOpen(true)}
            />
          )}

          {/* 2. Intermediate Subject Learning Path (خارطة المادة والتقدم) */}
          {activeTab === 'home' && homeSubView === 'learning_path' && selectedSubject && (
            <SubjectLearningPathView
              subject={selectedSubject}
              learningPosition={learningPosition}
              onPositionChange={handlePositionChange}
              openLessonContext={openLessonContext}
              user={currentUser}
              onSelectLesson={handleSelectLessonWithContext}
              onBack={() => {
                setHomeSubView('main_home');
              }}
              onOpenGames={() => setIsGamesOpen(true)}
              onScoreUpdate={handleScoreUpdate}
            />
          )}

          {/* 3. Lesson Player View */}
          {activeTab === 'home' && homeSubView === 'lesson_player' && (
            <div className="space-y-3 animate-in fade-in duration-300">
              {/* Stories / Teacher Channels Selector Section */}
              <StoriesSection
                stories={stories}
                currentPlayingYoutubeId={lesson.youtubeId}
                currentPlayingTeacher={lesson.teacherName}
                onSelectStory={handleSelectStory}
                onOpenQuiz={() => setIsGamesOpen(true)}
              />

              {/* Main Educational Video & Content Card */}
              <div className="px-3">
                <VideoPlayerCard
                  lesson={lesson}
                  openLessonContext={openLessonContext}
                  onOpenTeacherInfo={() => setIsTeacherInfoOpen(true)}
                  isPaused={isGamesOpen || isAttachmentOpen || isTeacherInfoOpen || isNotificationsOpen}
                  onBackToMap={() => setHomeSubView('learning_path')}
                  onOpenGames={() => setIsGamesOpen(true)}
                />
              </div>
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <SubscriptionsView
              onSelectLesson={(selectedLesson) => {
                setLesson(selectedLesson);
                setActiveTab('home');
                setHomeSubView('lesson_player');
              }}
              onBack={() => {
                setActiveTab('home');
                setHomeSubView('main_home');
              }}
              competitionSnapshot={competitionSnapshot}
            />
          )}

          {activeTab === 'community' && (
            <CommunityView
              posts={communityPosts}
              onOpenCreatePost={() => setIsCreatePostOpen(true)}
              onOpenComments={(post) => setActiveCommunityPostForComments(post)}
              onToggleLikePost={handleToggleLikeCommunityPost}
              onSharePost={handleShareCommunityPost}
              onReportPost={handleReportCommunityPost}
              onOpenProfile={(member) => setCommunityProfileMember(member)}
              onMessage={(member) => openMessenger(member)}
              onBack={() => {
                setActiveTab('home');
                setHomeSubView('main_home');
              }}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              onOpenProfile={() => setActiveTab('profile')}
              onBack={() => {
                setActiveTab('home');
                setHomeSubView('main_home');
              }}
              onSignOut={handleSignOut}
              user={currentUser}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileView
              user={currentUser}
              userPosts={communityPosts.filter((post) => post.isOwnPost)}
              onUpdateUser={(updated) => setCurrentUser(updated)}
              competitionSnapshot={competitionSnapshot}
              onOpenComments={(post) => setActiveCommunityPostForComments(post)}
              onSignOut={handleSignOut}
              growthPoints={growthSession.points}
              pendingGrowthPoints={growthSession.pendingPoints}
              shieldTier={currentUser?.growthShieldTier ?? 0}
              onCollectGrowthPoints={handleCollectGrowthPoints}
            />
          )}
        </main>

        {/* Temporary isolated preview lab — remove this one component to disable it. */}
        <PlantGrowthPreview />

        {/* Fixed Bottom Navigation */}
        <BottomNav
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'home') {
              setActiveTab('home');
              setHomeSubView('main_home');
            } else {
              setActiveTab(tab);
            }
          }}
          communityUnreadCount={0}
          avatarUrl={currentUser?.avatarUrl}
        />
      </div>

      {/* Modals & Drawers */}
      <StoryViewerModal
        story={selectedStory}
        onClose={() => setSelectedStory(null)}
        onNext={handleNextStory}
        onPrev={handlePrevStory}
        onPlayLesson={handleSelectStory}
      />

      <AttachmentModal
        attachment={activeAttachment}
        isOpen={isAttachmentOpen}
        onClose={() => setIsAttachmentOpen(false)}
        onDownload={handleDownloadAttachment}
      />

      <CommentsDrawer
        comments={lesson.comments}
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        onAddComment={handleAddComment}
      />

      <CreatePostModal
        isOpen={isCreatePostOpen}
        currentUser={currentUser}
        onClose={() => setIsCreatePostOpen(false)}
        onSubmitPost={handleCreatePost}
      />

      <CommunityCommentsModal
        post={activeCommunityPostForComments}
        isOpen={!!activeCommunityPostForComments}
        onClose={() => setActiveCommunityPostForComments(null)}
        onAddComment={handleAddCommunityComment}
        currentUserId={currentUser?.id}
        onOpenProfile={(member) => {
          setActiveCommunityPostForComments(null);
          setCommunityProfileMember(member);
        }}
        onMessage={(member) => {
          setActiveCommunityPostForComments(null);
          openMessenger(member);
        }}
      />

      <CommunityProfileModal
        member={communityProfileMember}
        posts={communityPosts}
        currentUserId={currentUser?.id}
        onClose={() => setCommunityProfileMember(null)}
        onMessage={(member) => openMessenger(member)}
      />

      <MessengerModal
        isOpen={isMessengerOpen}
        onClose={() => {
          setIsMessengerOpen(false);
          setMessengerContact(null);
        }}
        currentUser={currentUser}
        initialContact={messengerContact}
        onUnreadCountChange={setUnreadMessageCount}
      />

      <NotificationsModal
        notifications={notifications}
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onMarkAllAsRead={handleMarkAllNotificationsRead}
      />

      <TeacherInfoModal
        isOpen={isTeacherInfoOpen}
        onClose={() => setIsTeacherInfoOpen(false)}
        teacherName={lesson.teacherName}
        teacherAvatar={lesson.teacherAvatar}
        teacherRole={lesson.teacherRole}
      />

      <GamesLoadBoundary onClose={() => setIsGamesOpen(false)}>
        <React.Suspense
          fallback={
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 font-cairo">
              <div className="rounded-3xl border border-sky-400/40 bg-[#08152e] px-6 py-5 text-center text-sky-100 shadow-2xl">
                <Loader2 className="mx-auto mb-2 h-7 w-7 animate-spin text-sky-300" />
                <p className="text-xs font-black">جارٍ فتح ألعاب الدرس...</p>
              </div>
            </div>
          }
        >
          <LessonGamesModal
          isOpen={isGamesOpen}
          onClose={() => setIsGamesOpen(false)}
          games={getGamesForLesson(lesson.id)}
          lessonTitle={lesson.title}
          lessonId={lesson.id}
          category={lesson.category}
          openLessonContext={openLessonContext}
          onScoreUpdate={handleScoreUpdate}
          onAssessmentResult={handleAssessmentResult}
          onDailyExamCompleted={handleDailyExamCompleted}
          playerAvatarUrl={currentUser?.avatarUrl}
            playerId={currentUser?.id}
          />
        </React.Suspense>
      </GamesLoadBoundary>

      <DailyExamModal
        isOpen={isDailyExamOpen}
        onClose={() => setIsDailyExamOpen(false)}
        lessonId={openLessonContext?.lessonId || lesson.id}
        lessonTitle={openLessonContext?.lessonTitle || lesson.title}
        category={openLessonContext?.subjectId || lesson.category}
        openLessonContext={openLessonContext}
        onScoreUpdate={handleScoreUpdate}
        onAssessmentResult={handleAssessmentResult}
        onDailyExamCompleted={handleDailyExamCompleted}
      />

      <PwaInstallBanner
        isAuthenticated={Boolean(currentUser)}
        isHome={activeTab === 'home' && homeSubView === 'main_home'}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
