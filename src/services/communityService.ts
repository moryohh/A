import { getSupabaseClient } from '../lib/supabase';
import { getSupabaseAccessToken } from './authService';
import { CommunityPost, CommunityComment, UserProfile } from '../types';
import { getDemoCommunityAccount } from '../data/demoCommunityAccounts';

const LOCAL_STORAGE_POSTS_KEY = 'nahn_maak_community_posts_v2';
const LOCAL_STORAGE_LIKES_KEY = 'nahn_maak_user_liked_posts_v2';

const COMMUNITY_API_BASE_URL = (
  import.meta.env.VITE_COMMUNITY_API_URL ||
  'https://community-k8dy.onrender.com/api/v1/community'
).replace(/\/+$/, '');

async function communityRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getSupabaseAccessToken();
  const headers = new Headers(init.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${COMMUNITY_API_BASE_URL}/${path.replace(/^\/+/, '')}`, {
    ...init,
    headers,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error || 'تعذر الاتصال بخدمة المجتمع');
  }
  return payload as T;
}

/**
 * Helper to get locally cached or fallback posts
 */
function getLocalPosts(): CommunityPost[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_POSTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.debug('Failed to read local posts cache:', e);
  }
  return [];
}

function saveLocalPosts(posts: CommunityPost[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(posts));
  } catch (e) {
    console.debug('Failed to save local posts:', e);
  }
}

function getLikedPostIds(): Set<string> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LIKES_KEY);
    if (raw) {
      return new Set(JSON.parse(raw));
    }
  } catch {}
  return new Set();
}

function setLikedPostIds(likedSet: Set<string>) {
  try {
    localStorage.setItem(LOCAL_STORAGE_LIKES_KEY, JSON.stringify(Array.from(likedSet)));
  } catch {}
}

/**
 * Ranking Algorithm:
 * 1. Calculate engagement score for each post: (likes * 2 + comments * 3)
 * 2. Pin the single highest engagement post that has >= 10 interactions to the top (marked with isPinned: true).
 * 3. Order all remaining posts strictly from Newest to Oldest (created_at DESC).
 */
export function rankCommunityPosts(posts: CommunityPost[]): CommunityPost[] {
  if (!posts || posts.length === 0) return [];

  const parsePostTime = (post: CommunityPost): number => {
    if (post.createdAt) {
      const timestamp = new Date(post.createdAt).getTime();
      if (!Number.isNaN(timestamp)) return timestamp;
    }
    if (post.id.startsWith('post-')) {
      const numericId = Number.parseInt(post.id.replace('post-', ''), 10);
      if (!Number.isNaN(numericId)) return numericId;
    }
    return 0;
  };

  return posts
    .map((post) => ({
      ...post,
      isPinned: false,
      engagementScore: (post.likesCount || 0) * 2 + (post.commentsCount || 0) * 3,
    }))
    .sort((a, b) => {
      const reportDifference = (a.reportsCount || 0) - (b.reportsCount || 0);
      if (reportDifference !== 0) return reportDifference;
      return parsePostTime(b) - parsePostTime(a);
    });
}

function mapCommunityApiComment(row: any): CommunityComment {
  const account = getDemoCommunityAccount(`comment:${row?.id || row?.created_at || row?.content || ''}`);
  return {
    id: String(row?.id || `comment-${Date.now()}`),
    postId: row?.post_id ? String(row.post_id) : undefined,
    userId: account.id,
    userName: account.name,
    userAvatar: account.avatarUrl || '',
    timeAgo: calculateTimeAgo(row?.created_at),
    text: row?.comment_text || row?.content || '',
    likes: Number(row?.likes_count || 0),
    isLiked: false,
    createdAt: row?.created_at,
    userLevel: account.level,
    userPoints: account.points,
    userProgress: account.progress,
    isDemoAccount: true,
  };
}

function mapCommunityApiPost(row: any, currentUserId?: string, likedSet?: Set<string>): CommunityPost {
  const rawMedia = Array.isArray(row?.media_urls)
    ? row.media_urls
    : Array.isArray(row?.media)
      ? row.media.map((item: any) => typeof item === 'string' ? item : item?.url).filter(Boolean)
      : [];
  const comments = Array.isArray(row?.comments)
    ? row.comments.map(mapCommunityApiComment)
    : [];
  const postId = String(row?.id || `post-${Date.now()}`);
  const isOwnPost = currentUserId ? row?.user_id === currentUserId : false;
  const account = isOwnPost ? undefined : getDemoCommunityAccount(`post:${postId}`);

  return {
    id: postId,
    userId: account?.id || row?.user_id || undefined,
    userName: account?.name || row?.author_display_name || 'طالب المنصة',
    userAvatar: account?.avatarUrl || row?.author_avatar_url || '',
    timeAgo: calculateTimeAgo(row?.created_at),
    content: row?.content || row?.post_text || '',
    type: (row?.post_type || 'general') as CommunityPost['type'],
    image: rawMedia[0] || undefined,
    images: rawMedia,
    likesCount: Number(row?.likes_count ?? 0),
    commentsCount: Number(row?.comments_count ?? comments.length ?? 0),
    reportsCount: Number(row?.reports_count ?? 0),
    isLiked: Boolean(likedSet?.has(postId)),
    isOwnPost,
    createdAt: row?.created_at,
    comments,
    userLevel: account?.level,
    userPoints: account?.points,
    userProgress: account?.progress,
    isDemoAccount: Boolean(account),
  };
}

/**
 * 1. Fetch all community posts from the Community API in B.
 */
export async function fetchCommunityPosts(currentUserId?: string): Promise<CommunityPost[]> {
  try {
    const payload = await communityRequest<{ success?: boolean; posts?: any[] }>('posts?all=true');
    const rows = Array.isArray(payload?.posts) ? payload.posts : [];
    const posts = rows.map((row) => mapCommunityApiPost(row, currentUserId, getLikedPostIds()));
    saveLocalPosts(posts);
    return rankCommunityPosts(posts);
  } catch (err) {
    console.warn('Could not load Community API from B:', err);
    return [];
  }
}

/**
 * 2. Create a new community post (supporting text & up to 4 images)
 */
export async function createCommunityPost(
  paramsOrPost:
    | {
        userId?: string;
        userName: string;
        userAvatar: string;
        content: string;
        type?: 'question' | 'discussion' | 'summary' | 'general';
        images?: string[];
        image?: string;
        attachmentName?: string;
      }
    | Omit<CommunityPost, 'id' | 'likesCount' | 'commentsCount' | 'isLiked' | 'comments'>,
  _optionalUserId?: string
): Promise<CommunityPost> {
  const token = await getSupabaseAccessToken();
  if (!token) throw new Error('يجب تسجيل الدخول أولاً للنشر في المجتمع');

  const rawImages = (paramsOrPost as any).images || ((paramsOrPost as any).image ? [(paramsOrPost as any).image] : []);
  const validImages = rawImages
    .filter((image: unknown): image is string => typeof image === 'string' && image.startsWith('http'))
    .slice(0, 4);
  const hasUnsupportedMedia = rawImages.some((image: unknown) => typeof image === 'string' && image.startsWith('data:'));
  if (hasUnsupportedMedia) {
    throw new Error('رفع الصور للمجتمع مؤجل حالياً؛ يمكنك نشر النص الآن');
  }

  const payload = await communityRequest<{ post: any }>('posts', {
    method: 'POST',
    body: JSON.stringify({
      content: String(paramsOrPost.content || '').trim(),
      post_type: paramsOrPost.type || 'general',
      media_urls: validImages,
      media: validImages,
    }),
  });

  const createdPost = mapCommunityApiPost(payload?.post || {}, undefined, getLikedPostIds());
  createdPost.isOwnPost = true;
  saveLocalPosts([createdPost]);
  return createdPost;
}

/**
 * 4. Toggle Like on a Post
 */
export async function toggleLikeCommunityPost(postId: string, _userId?: string): Promise<{ isLiked: boolean; likesCount: number }> {
  const likedSet = getLikedPostIds();
  const currentlyLiked = likedSet.has(postId);
  const payload = await communityRequest<{
    action?: 'added' | 'removed' | 'updated';
    likes_count?: number;
    likesCount?: number;
  }>(`posts/${encodeURIComponent(postId)}/reaction`, {
    method: currentlyLiked ? 'DELETE' : 'PUT',
    body: JSON.stringify({ reaction_type: 'like' }),
  });

  const isLiked = payload.action !== 'removed';
  if (isLiked) likedSet.add(postId);
  else likedSet.delete(postId);
  setLikedPostIds(likedSet);

  const posts = getLocalPosts();
  saveLocalPosts(posts.map((post) => post.id === postId ? {
    ...post,
    isLiked,
    likesCount: Number(payload.likes_count ?? payload.likesCount ?? post.likesCount + (isLiked ? 1 : -1)),
  } : post));

  return {
    isLiked,
    likesCount: Number(payload.likes_count ?? payload.likesCount ?? 0),
  };
}

export const togglePostLike = async (postId: string, currentLiked: boolean) => {
  const res = await toggleLikeCommunityPost(postId);
  return res.isLiked;
};

/**
 * 5. Add a comment to a post
 */
export async function addCommunityComment(
  postIdOrParams:
    | string
    | {
        postId: string;
        userId?: string;
        userName: string;
        userAvatar: string;
        text: string;
      },
  textOrUser?: string | UserProfile | null,
  optionalUser?: UserProfile | null
): Promise<CommunityComment> {
  const postId = typeof postIdOrParams === 'object' ? postIdOrParams.postId : postIdOrParams;
  const text = typeof postIdOrParams === 'object'
    ? postIdOrParams.text
    : typeof textOrUser === 'string' ? textOrUser : '';
  if (!text.trim()) throw new Error('نص التعليق مطلوب');
  if (!(await getSupabaseAccessToken())) throw new Error('يجب تسجيل الدخول أولاً لإضافة تعليق');

  const payload = await communityRequest<{ comment: any }>(`posts/${encodeURIComponent(postId)}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content: text.trim() }),
  });
  const comment = mapCommunityApiComment({ ...(payload?.comment || {}), post_id: postId });

  const posts = getLocalPosts();
  saveLocalPosts(posts.map((post) => post.id === postId ? {
    ...post,
    comments: [comment, ...post.comments],
    commentsCount: post.commentsCount + 1,
  } : post));
  return comment;
}

/**
 * 8. Update User Profile in Supabase profiles table
 */
export async function reportCommunityPost(postId: string, reason = 'محتوى غير مناسب', details?: string): Promise<void> {
  if (!(await getSupabaseAccessToken())) throw new Error('يجب تسجيل الدخول أولاً لإرسال بلاغ');
  await communityRequest(`posts/${encodeURIComponent(postId)}/reports`, {
    method: 'POST',
    body: JSON.stringify({ reason, details }),
  });
}

export async function updateUserProfileData(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
  const client = getSupabaseClient();
  if (!client || !userId) return null;

  try {
    const payload: any = {
      id: userId,
      updated_at: new Date().toISOString(),
    };

    if (updates.name) payload.full_name = updates.name;
    if (updates.avatarUrl) payload.avatar_url = updates.avatarUrl;
    if (updates.grade) payload.grade = updates.grade;
    if (updates.branch) payload.branch = updates.branch;
    if (updates.points !== undefined) payload.points = updates.points;
    if (updates.level !== undefined) payload.level = updates.level;
    if (updates.studyHours !== undefined) payload.study_hours = updates.studyHours;
    if (updates.streakDays !== undefined) payload.streak_days = updates.streakDays;
    if (updates.themeId !== undefined) payload.theme_id = updates.themeId;

    const { data, error } = await client
      .from('profiles')
      .upsert(payload, { onConflict: 'id' })
      .select('*')
      .maybeSingle();

    if (!error && data) {
      return {
        id: userId,
        email: data.email,
        name: data.full_name || updates.name || 'طالب',
        avatarUrl: data.avatar_url || updates.avatarUrl,
        grade: data.grade || updates.grade,
        branch: data.branch || updates.branch,
        level: data.level ?? updates.level ?? 1,
        points: data.points ?? updates.points ?? 0,
        studyHours: data.study_hours ?? updates.studyHours ?? 0,
        streakDays: data.streak_days ?? updates.streakDays ?? 0,
        themeId: data.theme_id ?? updates.themeId,
      };
    }
  } catch (err) {
    console.warn('Error updating user profile in Supabase:', err);
  }
  return null;
}

/**
 * Helper to calculate Arabic time ago
 */
function calculateTimeAgo(dateStr?: string): string {
  if (!dateStr) return 'الآن';
  try {
    const time = new Date(dateStr).getTime();
    if (isNaN(time)) return 'الآن';
    const diffSec = Math.floor((Date.now() - time) / 1000);

    if (diffSec < 60) return 'الآن';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) return `منذ ${diffDays} يوم`;
    return 'منذ فترة';
  } catch {
    return 'الآن';
  }
}


/**
 * Register the authenticated student's interest in an upcoming course.
 * The API derives name, email, and user ID from the verified Supabase A JWT.
 */
export async function registerCourseReminder(courseId: string): Promise<{
  success: boolean;
  alreadyRegistered?: boolean;
  message: string;
  reminder?: { id: string; course_id: string; user_id: string };
}> {
  if (!courseId.trim()) throw new Error('معرف الدورة مطلوب');
  return communityRequest('course-reminders', {
    method: 'POST',
    body: JSON.stringify({ course_id: courseId.trim() }),
  });
}
