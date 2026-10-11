import React from 'react';
import { Bell, ArrowRight, Send, X } from 'lucide-react';
import { useAppTheme } from '../services/themeService';

interface HeaderProps {
  title?: string;
  unreadCount: number;
  showBackButton?: boolean;
  onBack?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile: () => void;
  onOpenGames?: () => void;
  onOpenMessenger?: () => void;
  unreadMessagesCount?: number;
  backButtonVariant?: 'back' | 'close';
}

export const Header: React.FC<HeaderProps> = ({
  unreadCount,
  showBackButton = false,
  onBack,
  onOpenNotifications,
  onOpenProfile,
  onOpenMessenger,
  unreadMessagesCount = 0,
  backButtonVariant = 'back',
}) => {
  const { theme } = useAppTheme();

  return (
    <header
      className={`sticky top-0 z-30 ${theme.classes.headerBg} backdrop-blur-xl border-b ${theme.classes.cardBorder} px-4 py-3 relative flex items-center justify-between min-h-[58px] transition-all duration-300`}
    >
      {/* Right side (in RTL): Back button if needed, or placeholder for balance */}
      <div className="flex items-center gap-2 z-10">
        {showBackButton && onBack ? (
          <button
            onClick={onBack}
            className={backButtonVariant === 'close'
              ? 'lesson-close-button group relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 border-rose-300/80 bg-gradient-to-br from-rose-500 to-red-700 text-white shadow-[0_0_24px_rgba(244,63,94,0.55)] transition-all duration-300 hover:rotate-6 hover:scale-110 active:rotate-0 active:scale-90'
              : `px-3 py-1.5 rounded-xl ${theme.classes.cardBg} border ${theme.classes.cardBorder} flex items-center justify-center gap-1.5 transition-all active:scale-95 shrink-0 shadow-lg cursor-pointer`}
            aria-label={backButtonVariant === 'close' ? 'إغلاق الدرس' : 'رجوع للرئيسية'}
            title={backButtonVariant === 'close' ? 'إغلاق الدرس والعودة للفصل' : 'الرجوع للصفحة الرئيسية'}
            style={{
              color: theme.colors.primary,
            }}
          >
            {backButtonVariant === 'close' ? (
              <X className="h-7 w-7 transition-transform duration-300 group-hover:rotate-90" strokeWidth={3} />
            ) : (
              <><ArrowRight className="w-4 h-4" style={{ color: theme.colors.primary }} /><span className={`text-xs font-bold ${theme.classes.textMain}`}>رجوع</span></>
            )}
          </button>
        ) : (
          <div className="w-9 h-9 opacity-0 pointer-events-none" />
        )}
      </div>

      {/* Center: transparent cat logo + brand name */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex items-center gap-1 select-none pointer-events-auto" dir="rtl">
          <img
            src={`${import.meta.env.BASE_URL}cat-logo-header.png?v=cat-brand-20260908`}
            alt="شعار نحن معك"
            className="h-10 w-10 shrink-0 object-contain transform scale-[1.5]"
            loading="eager"
            decoding="async"
            draggable={false}
            style={{ filter: `drop-shadow(0 2px 5px ${theme.colors.glow})` }}
          />
          <h1
            className="text-base sm:text-lg font-black tracking-wide leading-none font-sans"
            style={{
              color: theme.colors.secondary,
              filter: `drop-shadow(0 0 10px ${theme.colors.glow})`,
            }}
          >
            نحن معك
          </h1>
        </div>
      </div>

      {/* Left side: Icons (Notification & Profile Avatar) */}
      <div className="flex items-center gap-2.5 z-10">
        {/* Private Messenger shortcut */}
        {onOpenMessenger && <button
          onClick={onOpenMessenger}
          disabled={!onOpenMessenger}
          className="relative flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-sky-400/60 bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-[0_4px_14px_rgba(14,165,233,0.35)] transition-all hover:from-sky-300 hover:to-blue-500 active:scale-95 disabled:pointer-events-none disabled:opacity-60"
          aria-label="Messenger"
          title="Messenger"
        >
          <Send className="h-[19px] w-[19px] -rotate-12 fill-white/15" />
          {unreadMessagesCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-white bg-rose-500 px-1 text-[8px] font-black text-white">
              {unreadMessagesCount >= 9 ? '+9' : `+${unreadMessagesCount}`}
            </span>
          )}
        </button>}

        {/* Notification Bell with Badge */}
        {onOpenNotifications && <button
          onClick={onOpenNotifications}
          className={`relative w-9 h-9 rounded-full ${theme.classes.cardBg} border ${theme.classes.cardBorder} flex items-center justify-center transition-all active:scale-95 ${theme.classes.textMuted} hover:${theme.classes.textMain} cursor-pointer`}
          aria-label="الإشعارات"
          title="الإشعارات"
        >
          <Bell className="w-4.5 h-4.5" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-4 h-4 px-1 text-white text-[9px] font-black rounded-full flex items-center justify-center border shadow-sm"
              style={{
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.bgMain,
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>}

      </div>
    </header>
  );
};
