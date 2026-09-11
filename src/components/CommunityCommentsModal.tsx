import React, { useRef, useState } from 'react';
import { Heart, MessageSquare, Reply, Send, X } from 'lucide-react';
import { CommunityComment, CommunityMember, CommunityPost } from '../types';

interface CommunityCommentsModalProps {
  post: CommunityPost | null;
  isOpen: boolean;
  onClose: () => void;
  onAddComment: (postId: string, text: string) => void | Promise<void>;
  currentUserId?: string;
  onOpenProfile: (member: CommunityMember) => void;
  onMessage: (member: CommunityMember) => void;
}

export const CommunityCommentsModal: React.FC<CommunityCommentsModalProps> = ({ post, isOpen, onClose, onAddComment, onOpenProfile }) => {
  const [newText, setNewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<CommunityComment | null>(null);
  const [likedComments, setLikedComments] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !post) return null;

  const openReply = (comment: CommunityComment) => {
    setReplyTo(comment);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = newText.trim();
    if (!text || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddComment(post.id, `${replyTo ? `@${replyTo.userName} ` : ''}${text}`);
      setNewText('');
      setReplyTo(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/35 backdrop-blur-[2px] sm:items-center" dir="rtl">
      <section className="flex max-h-[92dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-[28px] bg-[#f7f8fa] text-right shadow-2xl sm:rounded-[28px]" aria-label="تعليقات المنشور">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3.5">
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition active:scale-95" aria-label="إغلاق التعليقات"><X className="h-5 w-5" /></button>
          <div className="flex items-center gap-2 text-slate-900"><MessageSquare className="h-5 w-5 text-sky-600" /><h3 className="text-base font-black">التعليقات ({post.commentsCount})</h3></div>
          <span className="w-10" />
        </header>

        <div className="border-b border-slate-200 bg-white px-4 py-3">
          <button type="button" onClick={() => onOpenProfile({ id: post.userId, name: post.userName, avatarUrl: post.userAvatar, level: post.userLevel, points: post.userPoints, progress: post.userProgress, isDemoAccount: post.isDemoAccount })} className="text-sm font-black text-slate-800 transition hover:text-sky-700">{post.userName}</button>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">{post.content}</p>
        </div>

        <main className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4">
          {post.comments.length === 0 ? (
            <div className="rounded-3xl bg-white px-5 py-10 text-center text-sm leading-7 text-slate-500 shadow-sm">لا توجد تعليقات بعد. كن أول من يشارك برأيه.</div>
          ) : post.comments.map((comment) => {
            const isLiked = Boolean(likedComments[comment.id]);
            const likes = Number(comment.likes || 0) + (isLiked ? 1 : 0);
            return (
              <article key={comment.id} className="flex items-start gap-2.5">
                <button type="button" onClick={() => onOpenProfile({ id: comment.userId, name: comment.userName, avatarUrl: comment.userAvatar, level: comment.userLevel, points: comment.userPoints, progress: comment.userProgress, isDemoAccount: comment.isDemoAccount })} className="mt-1 shrink-0 active:scale-95" aria-label={`فتح ملف ${comment.userName}`}><img src={comment.userAvatar} alt={comment.userName} className="h-10 w-10 rounded-full border border-sky-100 bg-sky-50 object-cover" /></button>
                <div className="min-w-0 flex-1">
                  <div className="rounded-2xl rounded-tr-md bg-[#e9eef5] px-3.5 py-2.5">
                    <button type="button" onClick={() => onOpenProfile({ id: comment.userId, name: comment.userName, avatarUrl: comment.userAvatar, level: comment.userLevel, points: comment.userPoints, progress: comment.userProgress, isDemoAccount: comment.isDemoAccount })} className="text-sm font-black text-slate-800 transition hover:text-sky-700">{comment.userName}</button>
                    <p className="mt-0.5 whitespace-pre-wrap text-sm leading-6 text-slate-700">{comment.text}</p>
                  </div>
                  <div className="mr-2 mt-1 flex items-center gap-4 text-xs font-bold text-slate-500">
                    <span>{comment.timeAgo}</span>
                    <button type="button" onClick={() => setLikedComments((previous) => ({ ...previous, [comment.id]: !previous[comment.id] }))} className={`inline-flex items-center gap-1 transition ${isLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}><Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} /><span>{likes > 0 ? `${likes} إعجاب` : 'إعجاب'}</span></button>
                    <button type="button" onClick={() => openReply(comment)} className="inline-flex items-center gap-1 transition hover:text-sky-600"><Reply className="h-3.5 w-3.5" />رد</button>
                  </div>
                </div>
              </article>
            );
          })}
        </main>

        <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white p-3">
          {replyTo && <div className="mb-2 flex items-center justify-between rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-800"><span>رد على {replyTo.userName}</span><button type="button" onClick={() => setReplyTo(null)} className="font-black" aria-label="إلغاء الرد">×</button></div>}
          <div className="flex items-center gap-2">
            <input ref={inputRef} type="text" value={newText} onChange={(event) => setNewText(event.target.value)} placeholder={replyTo ? `اكتب ردك على ${replyTo.userName}...` : 'اكتب تعليقًا...'} className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white" />
            <button type="submit" disabled={!newText.trim() || isSubmitting} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white shadow-sm transition active:scale-95 disabled:opacity-40" aria-label="نشر التعليق"><Send className="h-5 w-5 rotate-180" /></button>
          </div>
        </form>
      </section>
    </div>
  );
};
