import React, { useEffect, useRef, useState } from 'react';
import {
  Users,
  Plus,
  Heart,
  MessageSquare,
  MessageCircle,
  Share2,
  MoreHorizontal,
  HelpCircle,
  FileText,
  Sparkles,
  Flag,
  Paperclip,
  Check,
  Eye,
  X,
  ArrowRight,
} from 'lucide-react';
import { CommunityMember, CommunityPost } from '../types';
import { useAppTheme } from '../services/themeService';

interface CommunityViewProps {
  posts: CommunityPost[];
  onOpenCreatePost: () => void;
  onOpenComments: (post: CommunityPost) => void;
  onToggleLikePost: (postId: string) => void;
  onSharePost: (post: CommunityPost) => void;
  onReportPost: (postId: string) => void;
  onOpenProfile: (member: CommunityMember) => void;
  onMessage: (member: CommunityMember) => void;
  onBack?: () => void;
}

export const CommunityView: React.FC<CommunityViewProps> = ({
  posts,
  onOpenCreatePost,
  onOpenComments,
  onToggleLikePost,
  onSharePost,
  onReportPost,
  onOpenProfile,
  onMessage,
  onBack,
}) => {
  const { theme } = useAppTheme();
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null);
  const [visiblePostCount, setVisiblePostCount] = useState(10);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const filteredPosts = posts;

  useEffect(() => {
    setVisiblePostCount(10);
  }, [posts.length]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || visiblePostCount >= filteredPosts.length) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisiblePostCount((count) => Math.min(count + 10, filteredPosts.length));
        }
      },
      { rootMargin: '240px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredPosts.length, visiblePostCount]);

  const visiblePosts = filteredPosts.slice(0, visiblePostCount);

  const handleShare = (post: CommunityPost) => {
    onSharePost(post);
    setCopiedPostId(post.id);
    setTimeout(() => setCopiedPostId(null), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto p-0 sm:p-3 space-y-3 text-right select-none animate-in fade-in duration-200">
      {/* Lightbox / Expanded Image Modal */}
      {expandedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in"
          onClick={() => setExpandedImage(null)}
        >
          <button
            onClick={() => setExpandedImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={expandedImage}
            alt="صورة مكبرة"
            className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
          />
        </div>
      )}

      {/* Compact community actions: the global header keeps notifications, while back is placed here. */}
      <div className={`flex items-center justify-between px-3 pt-2 pb-1 ${theme.classes.cardBg}`}>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className={`border font-black py-2.5 px-4 rounded-2xl text-xs flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder} ${theme.classes.textMain}`}
            aria-label="العودة من المجتمع"
          >
            <ArrowRight className="w-4 h-4" style={{ color: theme.colors.primary }} />
            <span>رجوع</span>
          </button>
        ) : <span />}

        <button
          type="button"
          onClick={onOpenCreatePost}
          className="text-white font-black py-2.5 px-4 rounded-2xl text-xs flex items-center gap-1.5 shadow-lg active:scale-95 transition-all cursor-pointer"
          style={{
            backgroundColor: theme.colors.primary,
            boxShadow: `0 4px 15px ${theme.colors.glow}`,
          }}
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء منشور</span>
        </button>
      </div>

      {/* Community Feed Posts */}
      <div className="space-y-3.5">
        {filteredPosts.length === 0 ? (
          <div className={`border rounded-3xl p-8 text-center space-y-2 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}>
            <Users className="w-10 h-10 mx-auto opacity-40" style={{ color: theme.colors.primary }} />
            <h3 className={`text-sm font-bold ${theme.classes.textMain}`}>لا توجد منشورات في هذه الفئة</h3>
            <p className={`text-xs ${theme.classes.textMuted}`}>كن أول من يشارك بسؤال أو ملخص دراسي في المجتمع الطلابي!</p>
          </div>
        ) : (
          visiblePosts.map((post) => {
            const isMenuOpen = activeMenuPostId === post.id;
            const postImages: string[] = post.images && post.images.length > 0 
              ? post.images 
              : (post.image ? [post.image] : []);
            const publicComments = post.comments
              .filter((comment) => comment.text.trim().length > 0)
              .slice(0, 2);
            
            return (
              <div
                key={post.id}
                className={`border-b sm:border rounded-none sm:rounded-2xl p-3.5 sm:p-4 shadow-sm sm:shadow-lg space-y-3.5 text-right relative transition-all duration-300 ${theme.classes.cardBorder} ${theme.classes.cardBg}`}
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
              >

                {/* Post Header */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => onOpenProfile({ id: post.userId, name: post.userName, avatarUrl: post.userAvatar, level: post.userLevel, points: post.userPoints, progress: post.userProgress, isDemoAccount: post.isDemoAccount })}
                    className="flex min-w-0 items-center gap-2.5 text-right transition active:scale-[0.98]"
                    aria-label={`فتح ملف ${post.userName}`}
                  >
                    <img
                      src={post.userAvatar}
                      alt={post.userName}
                      width={40}
                      height={40}
                      decoding="async"
                      loading="lazy"
                      className="w-10 h-10 rounded-full border-2 object-cover bg-slate-800"
                      style={{ borderColor: theme.colors.primary }}
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className={`text-base sm:text-lg font-black ${theme.classes.textMain}`}>{post.userName}</h3>
                        {post.type === 'question' && (
                          <span
                            className="text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border"
                            style={{
                              backgroundColor: `${theme.colors.primary}20`,
                              borderColor: `${theme.colors.primary}40`,
                              color: theme.colors.primary,
                            }}
                          >
                            <HelpCircle className="w-2.5 h-2.5" />
                            سؤال وزاري
                          </span>
                        )}
                        {post.type === 'summary' && (
                          <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <FileText className="w-2.5 h-2.5" />
                            ملخص دراسي
                          </span>
                        )}
                        {post.type === 'discussion' && (
                          <span className="bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-[9px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5" />
                            مناقشة
                          </span>
                        )}
                      </div>
                      <span className={`text-xs block mt-1 ${theme.classes.textMuted}`}>
                        {post.timeAgo}
                      </span>
                    </div>
                  </button>

                  {/* Options Menu Button */}
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuPostId(isMenuOpen ? null : post.id)}
                      className={`p-1.5 rounded-full border transition-colors cursor-pointer ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder} ${theme.classes.textMuted}`}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {isMenuOpen && (
                      <div className={`absolute top-8 left-0 border rounded-2xl shadow-2xl z-30 py-1.5 text-xs w-44 animate-in fade-in ${theme.classes.cardBg} ${theme.classes.cardBorder}`}>
                        {post.userId && !post.isOwnPost && !post.isDemoAccount && (
                          <button
                            onClick={() => {
                              onMessage({ id: post.userId, name: post.userName, avatarUrl: post.userAvatar });
                              setActiveMenuPostId(null);
                            }}
                            className="w-full px-3.5 py-2 text-right hover:opacity-80 flex items-center gap-2 text-sky-400 font-medium cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>مراسلة خاصة</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            handleShare(post);
                            setActiveMenuPostId(null);
                          }}
                          className="w-full px-3.5 py-2 text-right hover:opacity-80 flex items-center gap-2 text-sky-400 font-medium cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>نسخ رابط المنشور</span>
                        </button>

                        <button
                          onClick={() => {
                            onReportPost(post.id);
                            setActiveMenuPostId(null);
                          }}
                          className="w-full px-3.5 py-2 text-right hover:opacity-80 flex items-center gap-2 text-amber-500 font-medium cursor-pointer border-t border-white/5"
                        >
                          <Flag className="w-3.5 h-3.5" />
                          <span>الإبلاغ عن المنشور</span>
                        </button>


                      </div>
                    )}
                  </div>
                </div>

                {/* Post Content */}
                <p className={`text-[15px] sm:text-[17px] leading-8 font-normal whitespace-pre-wrap ${theme.classes.textMain}`}>
                  {post.content}
                </p>

                {/* Multi-Images Grid (Supports up to 4 images per post) */}
                {postImages.length > 0 && (
                  <div
                    className={`rounded-2xl overflow-hidden border gap-1.5 p-1 ${theme.classes.cardBorder} ${theme.classes.cardSubtleBg} ${
                      postImages.length === 1
                        ? 'grid grid-cols-1'
                        : postImages.length === 2
                        ? 'grid grid-cols-2'
                        : postImages.length === 3
                        ? 'grid grid-cols-3'
                        : 'grid grid-cols-2'
                    }`}
                  >
                    {postImages.slice(0, 4).map((imgUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => setExpandedImage(imgUrl)}
                        className={`relative rounded-xl overflow-hidden group cursor-pointer bg-black/40 ${postImages.length === 1 ? '' : 'aspect-square sm:aspect-video'}`}
                      >
                        <img
                          src={imgUrl}
                          alt={`مرفق منشور ${idx + 1}`}
                          loading="lazy"
                          decoding="async"
                          className={`w-full ${postImages.length === 1 ? 'h-auto max-h-[620px] object-contain' : 'h-full object-cover'} transition-transform group-hover:scale-[1.02]`}
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-5 h-5" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Optional Attachment Card */}
                {post.attachmentName && (
                  <div className={`rounded-2xl p-3 border flex items-center justify-between text-xs ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`}>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="p-2 rounded-xl"
                        style={{
                          backgroundColor: `${theme.colors.primary}20`,
                          color: theme.colors.primary,
                        }}
                      >
                        <Paperclip className="w-4 h-4" />
                      </div>
                      <div>
                        <span className={`font-bold block text-[11px] ${theme.classes.textMain}`}>
                          {post.attachmentName}
                        </span>
                        <span className={`text-[9px] ${theme.classes.textMuted}`}>ملف دراسي جاهز للمطالعة</span>
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-black px-2.5 py-1 rounded-lg border"
                      style={{
                        backgroundColor: `${theme.colors.primary}20`,
                        borderColor: `${theme.colors.primary}40`,
                        color: theme.colors.primary,
                      }}
                    >
                      PDF
                    </span>
                  </div>
                )}

                {/* Share copied toast */}
                {copiedPostId === post.id && (
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in">
                    <Check className="w-3.5 h-3.5" />
                    <span>تم نسخ رابط ومحتوى المنشور للمشاركة!</span>
                  </div>
                )}

                {/* Stats line */}
                <div className={`flex items-center justify-between pt-3 text-sm border-t ${theme.classes.textMuted} ${theme.classes.cardBorder}`}>
                  <div className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    <span>{post.likesCount} إعجاب</span>
                  </div>
                  <button
                    onClick={() => onOpenComments(post)}
                    className="hover:opacity-80 cursor-pointer font-bold"
                  >
                    {post.commentsCount} تعليق
                  </button>
                </div>

                {/* Public text comment preview: maximum two comments per post */}
                {publicComments.length > 0 && (
                  <div className={`space-y-2 rounded-2xl border p-3 ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`}>
                    <div className={`flex items-center justify-between text-[10px] font-bold ${theme.classes.textMuted}`}>
                      <span>أبرز التعليقات</span>
                      <button
                        onClick={() => onOpenComments(post)}
                        className="cursor-pointer hover:opacity-80"
                      >
                        عرض الكل ({post.commentsCount})
                      </button>
                    </div>
                    {publicComments.map((comment) => (
                      <div key={comment.id} className="flex items-start gap-2 text-right">
                        <button type="button" onClick={() => onOpenProfile({ id: comment.userId, name: comment.userName, avatarUrl: comment.userAvatar, level: comment.userLevel, points: comment.userPoints, progress: comment.userProgress, isDemoAccount: comment.isDemoAccount })} className="shrink-0" aria-label={`فتح ملف ${comment.userName}`}>
                          <img src={comment.userAvatar} alt={comment.userName} width={24} height={24} loading="lazy" decoding="async" className="w-6 h-6 rounded-full object-cover border border-white/10" />
                        </button>
                        <p className={`text-[13px] leading-7 ${theme.classes.textMain}`}>
                          <strong className="font-bold">{comment.userName}:</strong> {comment.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Interaction Action Buttons */}
                <div className={`grid grid-cols-4 gap-1.5 pt-2 border-t text-xs font-bold ${theme.classes.cardBorder}`}>
                  {/* Like Button */}
                  <button
                    onClick={() => onToggleLikePost(post.id)}
                    className={`py-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      post.isLiked
                        ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                        : `${theme.classes.cardSubtleBg} ${theme.classes.textMuted} border ${theme.classes.cardBorder}`
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        post.isLiked ? 'fill-rose-500 text-rose-500' : ''
                      }`}
                    />
                    <span>{post.isLiked ? 'أعجبني' : 'إعجاب'}</span>
                  </button>

                  {/* Comment Button */}
                  <button
                    onClick={() => onOpenComments(post)}
                    className={`py-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder} ${theme.classes.textMuted}`}
                  >
                    <MessageSquare className="w-4 h-4" style={{ color: theme.colors.primary }} />
                    <span>تعليق ({post.commentsCount})</span>
                  </button>

                  {/* Private message button */}
                  <button
                    onClick={() => post.userId && !post.isOwnPost && !post.isDemoAccount && onMessage({ id: post.userId, name: post.userName, avatarUrl: post.userAvatar })}
                    disabled={!post.userId || post.isOwnPost || post.isDemoAccount}
                    className={`py-3 rounded-xl border flex items-center justify-center gap-1 transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder} ${theme.classes.textMuted}`}
                    title={!post.userId ? 'هذا الحساب غير متاح للمراسلة' : post.isOwnPost ? 'هذا منشورك' : post.isDemoAccount ? 'الحسابات التجريبية غير متاحة للمراسلة' : 'مراسلة خاصة'}
                  >
                    <MessageCircle className="w-4 h-4 text-sky-400" />
                    <span>مراسلة</span>
                  </button>

                  {/* Share Button */}
                  <button
                    onClick={() => handleShare(post)}
                    className={`py-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder} ${theme.classes.textMuted}`}
                  >
                    <Share2 className="w-4 h-4" />
                    <span>مشاركة</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
        {visiblePostCount < filteredPosts.length && (
          <div ref={loadMoreRef} className={`py-3 text-center text-[11px] ${theme.classes.textMuted}`}>
            مرّر للأسفل لعرض منشورات أقدم…
          </div>
        )}
      </div>
    </div>
  );
};
