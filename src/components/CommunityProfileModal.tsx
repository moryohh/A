import React from 'react';
import { MessageCircle, X } from 'lucide-react';
import { CommunityMember, CommunityPost } from '../types';
import { useAppTheme } from '../services/themeService';

interface CommunityProfileModalProps {
  member: CommunityMember | null;
  posts: CommunityPost[];
  currentUserId?: string;
  onClose: () => void;
  onMessage: (member: CommunityMember) => void;
}

export const CommunityProfileModal: React.FC<CommunityProfileModalProps> = ({
  member,
  posts,
  currentUserId,
  onClose,
  onMessage,
}) => {
  const { theme } = useAppTheme();
  if (!member) return null;

  const memberPosts = posts.filter((post) => member.id ? post.userId === member.id : post.userName === member.name);
  const canMessage = Boolean(member.id && member.id !== currentUserId && !member.isDemoAccount);

  return (
    <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center" dir="rtl">
      <div className={`flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl border sm:rounded-3xl ${theme.classes.cardBorder} ${theme.classes.wrapperBg}`}>
        <div className={`flex items-center justify-between border-b p-3 ${theme.classes.cardBorder} ${theme.classes.headerBg}`}>
          <h2 className={`text-base font-black ${theme.classes.textMain}`}>الملف الشخصي</h2>
          <button type="button" onClick={onClose} className={`flex h-10 w-10 items-center justify-center rounded-full border active:scale-95 ${theme.classes.cardBorder} ${theme.classes.cardSubtleBg}`} aria-label="إغلاق الملف الشخصي">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <div className="text-center">
            {member.avatarUrl ? (
              <img src={member.avatarUrl} alt={member.name} className="mx-auto h-24 w-24 rounded-full border-4 border-sky-400/50 bg-slate-800 object-cover shadow-xl" />
            ) : (
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-sky-400/50 bg-sky-500/15 text-3xl font-black text-sky-400">
                {member.name.trim().charAt(0) || 'ط'}
              </div>
            )}
            <h3 className={`mt-3 text-xl font-black ${theme.classes.textMain}`}>{member.name}</h3>
            {member.isDemoAccount && <p className="mt-1 text-[11px] font-bold text-sky-500">حساب تجريبي</p>}
            <p className={`mt-1 text-xs ${theme.classes.textMuted}`}>{memberPosts.length} منشور في المجتمع</p>
            {member.isDemoAccount && (
              <div className={`mt-4 rounded-2xl border p-3 text-right ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`}>
                <div className={`flex items-center justify-between text-sm font-black ${theme.classes.textMain}`}>
                  <span>المستوى {member.level || 1}</span>
                  <span>{member.points || 0} نقطة</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-300/40">
                  <div className="h-full rounded-full bg-sky-500" style={{ width: `${member.progress || 0}%` }} />
                </div>
                <p className={`mt-2 text-xs leading-6 ${theme.classes.textMuted}`}>{member.bio}</p>
              </div>
            )}
            {canMessage && (
              <button type="button" onClick={() => onMessage(member)} className="mx-auto mt-4 flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-6 py-3 text-sm font-black text-white shadow-lg transition active:scale-95">
                <MessageCircle className="h-5 w-5" />
                مراسلة
              </button>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <h4 className={`text-sm font-black ${theme.classes.textMain}`}>المنشورات</h4>
            {memberPosts.length === 0 ? (
              <p className={`rounded-2xl border p-5 text-center text-sm ${theme.classes.cardBorder} ${theme.classes.cardBg} ${theme.classes.textMuted}`}>لا توجد منشورات ظاهرة لهذا الحساب.</p>
            ) : memberPosts.map((post) => (
              <article key={post.id} className={`rounded-2xl border p-3 ${theme.classes.cardBorder} ${theme.classes.cardBg}`}>
                <p className={`whitespace-pre-wrap text-sm leading-7 ${theme.classes.textMain}`}>{post.content}</p>
                <p className={`mt-2 text-[10px] ${theme.classes.textMuted}`}>{post.timeAgo}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
