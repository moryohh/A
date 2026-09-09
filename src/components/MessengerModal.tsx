import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Loader2, MessageCircle, Send, X } from 'lucide-react';
import { CommunityMember, UserProfile } from '../types';
import { getSupabaseClient } from '../lib/supabase';
import {
  ConversationSummary,
  DirectMessage,
  fetchConversationSummaries,
  fetchDirectMessages,
  fetchUnreadMessageCount,
  markConversationRead,
  sendDirectMessage,
} from '../services/messengerService';
import { useAppTheme } from '../services/themeService';

interface MessengerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  initialContact: CommunityMember | null;
  onUnreadCountChange?: (count: number) => void;
}

const Avatar: React.FC<{ member: CommunityMember; size?: 'sm' | 'lg' }> = ({ member, size = 'sm' }) => {
  const dimension = size === 'lg' ? 'h-20 w-20 text-2xl' : 'h-11 w-11 text-base';
  if (member.avatarUrl) {
    return <img src={member.avatarUrl} alt={member.name} className={`${dimension} shrink-0 rounded-full border-2 border-sky-400/50 bg-slate-800 object-cover`} />;
  }
  return (
    <div className={`${dimension} flex shrink-0 items-center justify-center rounded-full border-2 border-sky-400/50 bg-sky-500/15 font-black text-sky-300`}>
      {member.name.trim().charAt(0) || 'ط'}
    </div>
  );
};

export const MessengerModal: React.FC<MessengerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialContact,
  onUnreadCountChange,
}) => {
  const { theme } = useAppTheme();
  const [summaries, setSummaries] = useState<ConversationSummary[]>([]);
  const [activeContact, setActiveContact] = useState<CommunityMember | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  const refreshSummaries = useCallback(async () => {
    if (!currentUser) return;
    const loaded = await fetchConversationSummaries(currentUser);
    setSummaries(loaded);
    onUnreadCountChange?.(loaded.reduce((total, item) => total + item.unreadCount, 0));
  }, [currentUser, onUnreadCountChange]);

  const openConversation = useCallback(async (member: CommunityMember) => {
    if (!currentUser || !member.id) {
      setError('لا يمكن مراسلة هذا الحساب حاليًا');
      return;
    }
    setActiveContact(member);
    setError('');
    setIsLoading(true);
    try {
      const loaded = await fetchDirectMessages(currentUser, member.id);
      setMessages(loaded);
      await markConversationRead(currentUser, member.id);
      await refreshSummaries();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر فتح المحادثة');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, refreshSummaries]);

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (!currentUser) return;
    refreshSummaries().catch(() => setError('تعذر تحميل المحادثات'));
    if (initialContact?.id && initialContact.id !== currentUser.id) {
      openConversation(initialContact);
    } else {
      setActiveContact(null);
      setMessages([]);
    }
  }, [isOpen, currentUser?.id, initialContact?.id, openConversation, refreshSummaries]);

  useEffect(() => {
    if (!isOpen || !currentUser?.id) return;
    const client = getSupabaseClient();
    if (!client) return;
    const channel = client
      .channel(`direct-messages-${currentUser.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'direct_messages' }, (payload) => {
        const row = payload.new as Record<string, unknown>;
        const senderId = String(row.sender_id || '');
        const recipientId = String(row.recipient_id || '');
        if (senderId !== currentUser.id && recipientId !== currentUser.id) return;
        if (activeContact?.id && (senderId === activeContact.id || recipientId === activeContact.id)) {
          openConversation(activeContact);
        } else {
          refreshSummaries().catch(() => undefined);
        }
      })
      .subscribe();
    return () => {
      client.removeChannel(channel);
    };
  }, [isOpen, currentUser?.id, activeContact?.id, openConversation, refreshSummaries]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, activeContact?.id]);

  const activeMessages = useMemo(() => messages, [messages]);

  const handleSend = async () => {
    if (!currentUser || !activeContact || isSending || !draft.trim()) return;
    setIsSending(true);
    setError('');
    try {
      const sent = await sendDirectMessage(currentUser, activeContact, draft);
      setMessages((previous) => previous.some((message) => message.id === sent.id) ? previous : [...previous, sent]);
      setDraft('');
      await refreshSummaries();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر إرسال الرسالة');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-center bg-black/70 backdrop-blur-sm" dir="rtl">
      <div className={`flex h-[100dvh] w-full max-w-md flex-col overflow-hidden border-x ${theme.classes.cardBorder} ${theme.classes.wrapperBg}`}>
        <header className={`flex min-h-[64px] shrink-0 items-center justify-between gap-3 border-b px-3 pt-[env(safe-area-inset-top)] ${theme.classes.cardBorder} ${theme.classes.headerBg}`}>
          {activeContact ? (
            <button type="button" onClick={() => { setActiveContact(null); setMessages([]); setError(''); }} className={`flex h-10 w-10 items-center justify-center rounded-full border active:scale-95 ${theme.classes.cardBorder} ${theme.classes.cardSubtleBg}`} aria-label="العودة إلى المحادثات">
              <ArrowRight className="h-5 w-5" />
            </button>
          ) : <div className="h-10 w-10" />}

          <div className="flex min-w-0 flex-1 items-center justify-center gap-2">
            {activeContact ? <Avatar member={activeContact} /> : <MessageCircle className="h-6 w-6 text-sky-400" />}
            <div className="min-w-0 text-right">
              <h2 className={`truncate text-base font-black ${theme.classes.textMain}`}>{activeContact?.name || 'Messenger'}</h2>
              <p className={`text-[10px] ${theme.classes.textMuted}`}>{activeContact ? 'محادثة خاصة' : 'محادثاتك الخاصة'}</p>
            </div>
          </div>

          <button type="button" onClick={onClose} className={`flex h-10 w-10 items-center justify-center rounded-full border active:scale-95 ${theme.classes.cardBorder} ${theme.classes.cardSubtleBg}`} aria-label="إغلاق Messenger">
            <X className="h-5 w-5" />
          </button>
        </header>

        {!currentUser ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <MessageCircle className="mb-3 h-12 w-12 text-sky-400" />
            <h3 className={`text-lg font-black ${theme.classes.textMain}`}>سجّل الدخول للمراسلة</h3>
            <p className={`mt-2 text-sm leading-7 ${theme.classes.textMuted}`}>المحادثات الخاصة متاحة للحسابات المسجلة فقط.</p>
          </div>
        ) : activeContact ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
              {isLoading ? (
                <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-sky-400" /></div>
              ) : activeMessages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Avatar member={activeContact} size="lg" />
                  <p className={`mt-3 text-sm font-black ${theme.classes.textMain}`}>{activeContact.name}</p>
                  <p className={`mt-1 text-xs ${theme.classes.textMuted}`}>ابدأ أول رسالة خاصة بينكما</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {activeMessages.map((message) => {
                    const own = message.senderId === currentUser.id;
                    return (
                      <div key={message.id} className={`flex ${own ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[82%] rounded-2xl px-3 py-2.5 text-sm leading-6 shadow-sm ${own ? 'rounded-bl-md bg-sky-500 text-white' : `rounded-br-md border ${theme.classes.cardBorder} ${theme.classes.cardBg} ${theme.classes.textMain}`}`}>
                          <p className="whitespace-pre-wrap break-words">{message.body}</p>
                          <span className={`mt-1 block text-[9px] ${own ? 'text-white/70' : theme.classes.textMuted}`}>
                            {new Date(message.createdAt).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>
              )}
            </div>
            {error && <p className="mx-3 mb-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center text-xs font-bold text-rose-400">{error}</p>}
            <div className={`shrink-0 border-t p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${theme.classes.cardBorder} ${theme.classes.headerBg}`}>
              <div className={`flex items-end gap-2 rounded-2xl border p-2 ${theme.classes.cardBorder} ${theme.classes.cardSubtleBg}`}>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value.slice(0, 2000))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  placeholder="اكتب رسالة..."
                  className={`max-h-28 min-h-[42px] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none ${theme.classes.textMain}`}
                />
                <button type="button" onClick={handleSend} disabled={isSending || !draft.trim()} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg transition active:scale-95 disabled:opacity-40" aria-label="إرسال الرسالة">
                  {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {error && <p className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-center text-xs font-bold text-rose-400">{error}</p>}
            {summaries.length === 0 ? (
              <div className="flex min-h-[65vh] flex-col items-center justify-center px-6 text-center">
                <MessageCircle className="mb-3 h-14 w-14 text-sky-400/70" />
                <h3 className={`text-lg font-black ${theme.classes.textMain}`}>لا توجد محادثات بعد</h3>
                <p className={`mt-2 text-sm leading-7 ${theme.classes.textMuted}`}>افتح ملف أي شخص من منشوره ثم اضغط «مراسلة» لبدء محادثة خاصة.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {summaries.map((summary) => (
                  <button key={summary.member.id} type="button" onClick={() => openConversation(summary.member)} className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-right transition active:scale-[0.99] ${theme.classes.cardBorder} ${theme.classes.cardBg}`}>
                    <div className="relative">
                      <Avatar member={summary.member} />
                      {summary.unreadCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-500 px-1 text-[9px] font-black text-white">{summary.unreadCount}</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`truncate text-sm font-black ${theme.classes.textMain}`}>{summary.member.name}</span>
                        <span className={`shrink-0 text-[9px] ${theme.classes.textMuted}`}>{new Date(summary.lastMessageAt).toLocaleDateString('ar-IQ')}</span>
                      </div>
                      <p className={`mt-1 truncate text-xs ${summary.unreadCount > 0 ? `${theme.classes.textMain} font-black` : theme.classes.textMuted}`}>{summary.lastMessage}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
