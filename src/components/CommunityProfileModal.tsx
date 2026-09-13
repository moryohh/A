import React from 'react';
import { Award, BookOpen, Flame, MessageCircle, ShieldCheck, Sparkles, X } from 'lucide-react';
import { CommunityMember, CommunityPost } from '../types';
import { useAppTheme } from '../services/themeService';
import { CommunityAvatar } from './CommunityAvatar';

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
  const canMessage = Boolean(member.id && member.id !== currentUserId);
  const stableSeed = String(member.id || member.name).split('').reduce<number>((value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0, 2166136261);
  const isPrivateFallback = !member.isDemoAccount && !member.hasRealProfileData;
  const level = isPrivateFallback ? 1 + (stableSeed % 20) : member.level ?? (20 + (stableSeed % 51));
  const progress = isPrivateFallback ? 15 + (stableSeed % 81) : member.progress ?? (15 + (stableSeed % 81));
  const points = isPrivateFallback ? Math.min(2399, level * 100 + progress) : member.points ?? (level * 120 + progress * 3);
  const calculatedShieldCount = Math.max(0, Math.floor(Math.max(0, points - 20) / 100) + (points >= 20 ? 1 : 0));
  const shieldCount = member.isDemoAccount ? 1 + (stableSeed % 8) : member.hasRealProfileData ? Math.min(8, Math.max(calculatedShieldCount, (member.shieldTier ?? -1) + 1)) : 1 + ((stableSeed >>> 3) % 4);
  const streakDays = isPrivateFallback ? 1 + ((stableSeed >>> 4) % 4) : member.streakDays ?? 1 + ((stableSeed >>> 4) % 31);
  const studyHours = isPrivateFallback ? 1 + ((stableSeed >>> 8) % 20) : member.studyHours ?? 8 + ((stableSeed >>> 8) % 94);
  const shieldTier = member.isDemoAccount ? Math.max(0, Math.min(7, shieldCount - 1)) : Math.max(0, Math.min(member.hasRealProfileData ? 7 : 3, member.shieldTier ?? shieldCount - 1));

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
            <CommunityAvatar src={member.avatarUrl} alt={member.name} className="mx-auto h-24 w-24 rounded-full border-4 border-lime-500/60 bg-lime-500 object-cover shadow-xl" />
            <h3 className={`mt-3 text-xl font-black ${theme.classes.textMain}`}>{member.name}</h3>
            <p className={`mt-1 text-xs ${theme.classes.textMuted}`}>{memberPosts.length} منشور في المجتمع</p>
            {isPrivateFallback && <p className="mt-2 text-[10px] font-bold text-amber-500">معاينة عامة محدودة للحساب</p>}
            {canMessage && (
              <button type="button" onClick={() => onMessage(member)} className="mx-auto mt-4 flex items-center justify-center gap-2 rounded-2xl bg-sky-500 px-7 py-3 text-sm font-black text-white shadow-lg transition active:scale-95">
                <MessageCircle className="h-5 w-5" />مراسلة
              </button>
            )}
            <div className={`mt-4 rounded-2xl border p-3 text-right ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`}>
                <div className={`flex items-center justify-between text-sm font-black ${theme.classes.textMain}`}>
                  <span>المستوى {level}</span>
                  <span>{points} نقطة</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-300/40">
                  <div className="h-full rounded-full bg-sky-500" style={{ width: `${progress}%` }} />
                </div>
                {member.bio && <p className={`mt-2 text-xs leading-6 ${theme.classes.textMuted}`}>{member.bio}</p>}
              </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className={`rounded-2xl border p-3 ${theme.classes.cardBorder} ${theme.classes.cardBg}`}><ShieldCheck className="mx-auto h-5 w-5 text-emerald-500" /><strong className={`mt-1 block text-sm ${theme.classes.textMain}`}>{shieldCount}</strong><span className={`text-[10px] ${theme.classes.textMuted}`}>دروع</span></div>
              <div className={`rounded-2xl border p-3 ${theme.classes.cardBorder} ${theme.classes.cardBg}`}><Flame className="mx-auto h-5 w-5 text-orange-500" /><strong className={`mt-1 block text-sm ${theme.classes.textMain}`}>{streakDays}</strong><span className={`text-[10px] ${theme.classes.textMuted}`}>يوم نشاط</span></div>
              <div className={`rounded-2xl border p-3 ${theme.classes.cardBorder} ${theme.classes.cardBg}`}><BookOpen className="mx-auto h-5 w-5 text-sky-500" /><strong className={`mt-1 block text-sm ${theme.classes.textMain}`}>{studyHours}</strong><span className={`text-[10px] ${theme.classes.textMuted}`}>ساعة دراسة</span></div>
            </div>
            {shieldCount > 0 && <div className={`mt-3 rounded-3xl border p-3 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}><div className="flex items-center justify-center gap-2"><img src={`${import.meta.env.BASE_URL}assets/shields/shield-${Math.min(shieldTier, 4)}.png`} alt="درع الحساب" className="h-24 w-24 object-contain drop-shadow-xl" style={{ filter: shieldTier >= 5 ? `hue-rotate(${shieldTier === 5 ? 62 : shieldTier === 6 ? 92 : 292}deg) saturate(1.8)` : undefined }} /><div className="text-right"><p className={`flex items-center gap-1 text-sm font-black ${theme.classes.textMain}`}><Award className="h-4 w-4 text-amber-500" />أقوى درع</p><p className={`mt-1 text-xs ${theme.classes.textMuted}`}>يمتلك {shieldCount} من الدروع المتاحة</p><p className="mt-2 flex items-center gap-1 text-xs font-bold text-emerald-500"><Sparkles className="h-3.5 w-3.5" />حساب نشط</p></div></div></div>}
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
