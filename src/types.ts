export interface TeacherStory {
  id: string;
  teacherName: string;
  channelName?: string;
  avatar: string;
  subject: string;
  title: string;
  hasUnseen: boolean;
  videoUrl?: string;
  youtubeId?: string;
  duration?: string;
  storyImage?: string;
  textNotes?: string;
  lessonData?: EducationalLesson;
  /** Exact lesson identity used when switching teachers/videos. */
  lessonContext?: OpenLessonContext;
}

export interface CommunityStory {
  id: string;
  userId?: string;
  userName: string;
  userAvatar: string;
  title: string;
  hasUnseen: boolean;
  storyImage?: string;
  textNotes?: string;
  createdAt?: string;
}

export interface LessonAttachment {
  id: string;
  title: string;
  type: 'pdf' | 'psh' | 'summary' | 'exercise';
  size: string;
  downloadUrl: string;
  description: string;
}

export interface CommentItem {
  id: string;
  userName: string;
  userAvatar: string;
  timeAgo: string;
  text: string;
  likes: number;
  isLiked?: boolean;
}

export interface CommunityComment {
  id: string;
  postId?: string;
  userId?: string;
  userName: string;
  userAvatar: string;
  timeAgo: string;
  text: string;
  likes: number;
  isLiked?: boolean;
  createdAt?: string;
  replies?: CommunityComment[];
  userLevel?: number;
  userPoints?: number;
  userProgress?: number;
  isDemoAccount?: boolean;
}

export interface CommunityMember {
  id?: string;
  name: string;
  avatarUrl?: string;
  level?: number;
  points?: number;
  progress?: number;
  isDemoAccount?: boolean;
  bio?: string;
}

export interface CommunityPost {
  id: string;
  userId?: string;
  userName: string;
  userAvatar: string;
  timeAgo: string;
  content: string;
  type?: 'question' | 'discussion' | 'summary' | 'general';
  image?: string;
  images?: string[]; // Supports up to 4 images per post
  attachmentName?: string;
  likesCount: number;
  commentsCount: number;
  reportsCount?: number;
  isLiked: boolean;
  isOwnPost?: boolean;
  isPinned?: boolean; // Highlighted / pinned engaged post
  engagementScore?: number;
  createdAt?: string;
  comments: CommunityComment[];
  userLevel?: number;
  userPoints?: number;
  userProgress?: number;
  isDemoAccount?: boolean;
}

export interface EducationalLesson {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  teacherName: string;
  teacherAvatar: string;
  teacherRole: string;
  youtubeId: string;
  duration: string;
  currentTime: string;
  progressPercentage: number;
  description: string;
  viewsCount: string;
  likesCount: number;
  isLiked: boolean;
  isBookmarked: boolean;
  attachments: {
    aids: LessonAttachment;
    psh: LessonAttachment;
  };
  comments: CommentItem[];
  teacherStories?: TeacherStory[];
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'lesson' | 'attachment' | 'system' | 'community';
}

export interface EducationalGame {
  id: string;
  lessonId: string;
  type: 'mcq' | 'true_false' | 'image_choice';
  title: string;
  question: string;
  options: string[];
  images?: string[];
  correctAnswer: number;
  difficulty: 'سهل' | 'متوسط' | 'متقدم';
  points: number;
  explanation?: string;
}

export interface MillionaireQuestion {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  question: string;
  options: [string, string, string, string];
  correctAnswer: number;
  explanation: string;
  hint?: string;
}

export interface MillionaireGameConfig {
  gameId: string;
  gameType: 'millionaire';
  lessonId: string;
  subject: string;
  grade: string;
  title: string;
  subtitle: string;
  questions: MillionaireQuestion[];
  /** Full lesson-file pool used to build a fresh non-repeating round. */
  questionPool?: MillionaireQuestion[];
  backupQuestion?: MillionaireQuestion;
}

export interface StudentGameResult {
  studentId: string;
  lessonId: string;
  gameId: string;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  completedAt: string;
  pointsEarned: number;
  maxLevelReached: number;
}

export interface SubjectChapterLesson {
  id: string;
  number: number;
  title: string;
  subtitle?: string;
  duration: string;
  status: 'completed' | 'in_progress' | 'available' | 'locked';
  progressPercentage: number;
  lessonData?: EducationalLesson;
}

export type LessonSectionType = 'curriculum' | 'lessons' | 'mcq' | 'ph' | 'true_false';

export interface LessonIndexFile {
  recordId: string;
  fileName: string;
}

export interface LessonIndex {
  lessonKey: string;
  subjectId: string;
  chapterNumber: number;
  lessonNumber: number;
  lessonId: string;
  title: string;
  files: Partial<Record<LessonSectionType, LessonIndexFile>>;
}

export interface SubjectChapterIndex {
  chapterNumber: number;
  title: string;
  lessons: LessonIndex[];
}

export interface SubjectIndex {
  subjectId: string;
  subjectName?: string;
  chapters: SubjectChapterIndex[];
  allLessons: Record<string, LessonIndex>;
  totalLessons: number;
}

export interface OpenLessonContext {
  subjectId: string;
  chapterNumber: number;
  lessonNumber: number;
  lessonId: string;
  lessonKey?: string;
  title?: string;
  lessonTitle?: string;
}

export interface LearningPosition {
  subjectId: string;
  chapterNumber: number;
  lessonNumber: number;
  lessonId?: string;
  lessonKey?: string;
}

export interface SubjectChapter {
  id: string;
  number: number;
  title: string;
  subtitle?: string;
  description?: string;
  lessonsCount: number;
  completedLessonsCount: number;
  lessons: SubjectChapterLesson[];
}

export type RatingTier = 'diamond' | 'gold' | 'silver' | 'bronze';

export interface CompetitionSnapshot {
  userId: string;
  level: number;
  points: number;
  activityMinutesToday: number;
  activityPointsToday: number;
  periodCorrect: number;
  periodAnswered: number;
  accuracyPercent: number;
  ratingTier: RatingTier;
  ratingLabel: string;
  ratingVisible: boolean;
  periodStart: string;
  periodEnd: string;
  rank: number | null;
  participants: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl?: string;
  level: number;
  points: number;
  ratingTier: RatingTier;
  ratingLabel: string;
  accuracyPercent: number;
  isCurrentUser: boolean;
}

export interface UserProfile {
  id: string;
  email?: string;
  name: string;
  avatarUrl?: string;
  grade?: string;
  branch?: string;
  level?: number;
  points?: number;
  studyHours?: number;
  streakDays?: number;
  themeId?: string;
}
