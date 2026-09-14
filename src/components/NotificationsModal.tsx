import React from 'react';
import { AppNotification } from '../types';
import { X, Bell, CheckCheck, Sparkles, FileText, Users, MessageSquare } from 'lucide-react';
import { useAppTheme } from '../services/themeService';

interface NotificationsModalProps {
  notifications: AppNotification[];
  isOpen: boolean;
  onClose: () => void;
  onMarkAllAsRead: () => void;
  onOpenNotification: (notification: AppNotification) => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  notifications,
  isOpen,
  onClose,
  onMarkAllAsRead,
  onOpenNotification,
}) => {
  const { theme } = useAppTheme();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div
        className={`${theme.classes.cardBg} border ${theme.classes.cardBorder} w-full max-w-md rounded-3xl p-5 shadow-2xl text-right relative max-h-[85vh] flex flex-col transition-all duration-300`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" style={{ color: theme.colors.primary }} />
            <h3 className={`text-base font-bold ${theme.classes.textMain}`}>الإشعارات والتحديثات</h3>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-full ${theme.classes.cardSubtleBg} ${theme.classes.textMuted} hover:${theme.classes.textMain} border ${theme.classes.cardBorder} cursor-pointer`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action bar */}
        <div className="flex justify-between items-center py-2 text-xs">
          <span className={theme.classes.textMuted}>
            لديك {notifications.filter((n) => !n.isRead).length} إشعار جديد
          </span>
          <button
            onClick={onMarkAllAsRead}
            className="font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            style={{ color: theme.colors.primary }}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            تحديد الكل كأنها قُرئت
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 my-2 no-scrollbar">
          {notifications.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => onOpenNotification(item)}
              className={`w-full p-3 rounded-2xl border text-right transition-all cursor-pointer active:scale-[0.99]`}
              style={{
                backgroundColor: !item.isRead
                  ? `${theme.colors.primary}18`
                  : theme.colors.bgCardSubtle,
                borderColor: !item.isRead
                  ? `${theme.colors.primary}40`
                  : theme.colors.border,
              }}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`p-2 rounded-xl shrink-0 mt-0.5 border`}
                  style={{
                    backgroundColor: `${theme.colors.primary}20`,
                    borderColor: `${theme.colors.primary}40`,
                    color: theme.colors.primary,
                  }}
                >
                  {item.type === 'community' ? (
                    <Users className="w-4 h-4" />
                  ) : item.type === 'attachment' ? (
                    <FileText className="w-4 h-4" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className={`text-xs font-bold ${theme.classes.textMain} truncate`}>
                      {item.title}
                    </h4>
                    <span className={`text-[10px] ${theme.classes.textMuted} shrink-0`}>
                      {item.time}
                    </span>
                  </div>
                  <p className={`text-xs ${theme.classes.textMuted} mt-1 leading-relaxed`}>
                    {item.message}
                  </p>
                </div>
              </div>
            </button>
          ))}

          {notifications.length === 0 && (
            <div className={`text-center py-8 ${theme.classes.textMuted} text-xs`}>
              لا توجد إشعارات حالياً
            </div>
          )}
        </div>

        {/* Close Button Footer */}
        <button
          onClick={onClose}
          className="w-full py-2.5 mt-2 rounded-xl text-white font-bold text-xs shadow-lg transition-all active:scale-95 cursor-pointer"
          style={{
            backgroundColor: theme.colors.primary,
          }}
        >
          إغلاق النافذة
        </button>
      </div>
    </div>
  );
};
