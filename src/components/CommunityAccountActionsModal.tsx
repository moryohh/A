import React from 'react';
import { MessageCircle, UserRound, X } from 'lucide-react';
import { CommunityMember } from '../types';
import { useAppTheme } from '../services/themeService';
import { CommunityAvatar } from './CommunityAvatar';

interface CommunityAccountActionsModalProps {
  member: CommunityMember | null;
  onClose: () => void;
  onVisitProfile: (member: CommunityMember) => void;
  onMessage: (member: CommunityMember) => void;
}

export const CommunityAccountActionsModal: React.FC<CommunityAccountActionsModalProps> = ({ member, onClose, onVisitProfile, onMessage }) => {
  const { theme } = useAppTheme();
  if (!member) return null;

  return (
    <div className="fixed inset-0 z-[94] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" dir="rtl" onClick={onClose}>
      <section className={`w-full max-w-sm rounded-t-3xl border p-4 shadow-2xl sm:rounded-3xl ${theme.classes.cardBorder} ${theme.classes.wrapperBg}`} onClick={(event) => event.stopPropagation()} aria-label={`خيارات حساب ${member.name}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <CommunityAvatar src={member.avatarUrl} alt={member.name} className="h-14 w-14 shrink-0 rounded-full border-2 border-lime-500 bg-lime-500 object-cover" />
            <div className="min-w-0"><h2 className={`truncate text-base font-black ${theme.classes.textMain}`}>{member.name}</h2><p className={`mt-1 text-xs ${theme.classes.textMuted}`}>اختر ما تريد فعله</p></div>
          </div>
          <button type="button" onClick={onClose} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${theme.classes.cardBorder} ${theme.classes.cardSubtleBg}`} aria-label="إغلاق"><X className="h-5 w-5" /></button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => onVisitProfile(member)} className="flex items-center justify-center gap-2 rounded-2xl bg-sky-600 px-3 py-3 text-sm font-black text-white transition active:scale-95"><UserRound className="h-5 w-5" />زيارة الصفحة</button>
          <button type="button" onClick={() => onMessage(member)} className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-3 text-sm font-black transition active:scale-95 ${theme.classes.cardBorder} ${theme.classes.cardSubtleBg} ${theme.classes.textMain}`}><MessageCircle className="h-5 w-5 text-sky-500" />مراسلة</button>
        </div>
      </section>
    </div>
  );
};
