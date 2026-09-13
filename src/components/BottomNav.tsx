import React from 'react';
import { Home, Layers, Users } from 'lucide-react';
import { useAppTheme } from '../services/themeService';
import { FALLBACK_DEFAULT_AVATAR } from '../data/cartoonAvatars';
import { gameAudio } from '../utils/gameAudio';

export type NavTab = 'home' | 'subscriptions' | 'community' | 'settings' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  communityUnreadCount?: number;
  avatarUrl?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  communityUnreadCount = 0,
  avatarUrl,
}) => {
  const { theme } = useAppTheme();

  const tabs = [
    { id: 'home' as NavTab, label: 'الرئيسية', icon: Home },
    { id: 'subscriptions' as NavTab, label: 'الاشتراكات', icon: Layers },
    { id: 'community' as NavTab, label: 'المجتمع', icon: Users, badge: communityUnreadCount },
    { id: 'profile' as NavTab, label: 'حسابي', avatar: true },
  ];

  return (
    <nav
      className={`fixed bottom-0 inset-x-0 z-40 ${theme.classes.navBg} backdrop-blur-lg border-t ${theme.classes.cardBorder} px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] shadow-2xl transition-all duration-300`}
    >
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => { gameAudio.playPrimaryNavigation(); onSelectTab(tab.id); }}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all active:scale-90 cursor-pointer ${
                isActive ? 'font-bold opacity-100' : `${theme.classes.textMuted} opacity-60 hover:opacity-100`
              }`}
              style={{
                color: isActive ? theme.colors.primary : undefined,
              }}
            >
              {/* Active top pill indicator */}
              {isActive && (
                <span
                  className="absolute -top-2.5 w-7 h-1 rounded-full shadow-sm"
                  style={{
                    backgroundColor: theme.colors.primary,
                    boxShadow: `0 0 8px ${theme.colors.glow}`,
                  }}
                />
              )}

              <div className="relative flex items-center justify-center">
                {tab.avatar ? (
                  <img
                    src={avatarUrl || FALLBACK_DEFAULT_AVATAR}
                    alt="حسابي"
                    width={24}
                    height={24}
                    decoding="async"
                    className={`w-6 h-6 rounded-full object-cover border-2 transition-transform ${isActive ? 'scale-110' : ''} ${avatarUrl?.includes('/avatars/') ? 'scale-[1.3]' : ''}`}
                    style={{ borderColor: isActive ? theme.colors.primary : `${theme.colors.primary}70` }}
                  />
                ) : Icon ? (
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                ) : null}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 text-white text-[9px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border"
                    style={{
                      backgroundColor: theme.colors.primary,
                      borderColor: theme.colors.bgMain,
                    }}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="text-[11px] mt-1 font-medium tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
