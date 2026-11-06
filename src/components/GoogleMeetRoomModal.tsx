import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Clipboard, ExternalLink, Radio, Share2, Video } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { loadGuestSession } from '../services/guestPreviewService';
import { createGoogleMeet } from '../services/googleMeetService';
import { signInWithGoogle } from '../services/authService';
import { appSfx } from '../utils/appSfx';

const API = (import.meta.env.VITE_ONLINE_CHALLENGE_API_URL || '').replace(/\/$/, '');

async function authorization() {
  const guest = loadGuestSession();
  if (guest) return `Guest ${guest.id}`;
  const client = getSupabaseClient();
  const { data } = (await client?.auth.getSession()) || { data: { session: null } };
  if (!data.session?.access_token) throw new Error('سجّل الدخول أولًا لإنشاء البث.');
  return `Bearer ${data.session.access_token}`;
}

interface Props {
  onClose: () => void;
  title: string;
  subject: string;
  chapter: number;
  initialRoomCode?: string;
  initialMeetingUrl?: string;
  onRoomCreated?: (roomCode: string) => void;
}

export const GoogleMeetRoomModal: React.FC<Props> = ({ onClose, title, subject, chapter, initialRoomCode, initialMeetingUrl, onRoomCreated }) => {
  const [meetingUrl, setMeetingUrl] = useState(initialMeetingUrl || '');
  const [roomCode, setRoomCode] = useState(initialRoomCode || '');
  const [busy, setBusy] = useState(!initialMeetingUrl);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (initialMeetingUrl || startedRef.current) return;
    startedRef.current = true;
    (async () => {
      try {
        const meet = await createGoogleMeet(`${title} — ${subject} — الفصل ${chapter}`, 60);
        const response = await fetch(`${API}/rooms`, {
          method: 'POST',
          headers: { Authorization: await authorization(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameType: 'live_classroom', gameTitle: `بث مباشر — ${title}`,
            questions: [{ question: title, options: ['انضمام', 'متابعة'], correctAnswer: 0 }],
            subject, chapter, lesson: 1, lessonTitle: title,
            capacity: 50, durationMinutes: 60, contentMode: 'meet', meetingUrl: meet.meetingUrl,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error('تعذر نشر غرفة البث في قائمة الطلاب.');
        setMeetingUrl(meet.meetingUrl);
        setRoomCode(data.roomCode || '');
        appSfx.success();
        onRoomCreated?.(data.roomCode || '');
      } catch (reason) {
        appSfx.attention();
        setError(reason instanceof Error ? reason.message : 'تعذر إنشاء البث.');
      } finally { setBusy(false); }
    })();
  }, [chapter, initialMeetingUrl, onRoomCreated, subject, title]);

  const copy = async () => {
    if (!meetingUrl) return;
    await navigator.clipboard.writeText(meetingUrl);
    appSfx.tap(); setCopied(true); window.setTimeout(() => setCopied(false), 1500);
  };
  const join = () => { if (meetingUrl) { appSfx.success(); window.open(meetingUrl, '_blank', 'noopener,noreferrer'); } };
  const share = async () => {
    if (!meetingUrl) return;
    const text = `${title}\n${subject} — الفصل ${chapter}\n${meetingUrl}`;
    if (navigator.share) await navigator.share({ title: 'دعوة بث مباشر', text, url: meetingUrl });
    else await navigator.clipboard.writeText(text);
  };

  return <div className="fixed inset-0 z-[190] overflow-y-auto bg-slate-950/90 p-4 backdrop-blur-xl" dir="rtl">
    <div className="mx-auto flex min-h-full max-w-lg items-center justify-center">
      <section className="relative w-full overflow-hidden rounded-[32px] border border-cyan-300/30 bg-gradient-to-b from-slate-900 to-slate-950 p-5 text-white shadow-[0_0_70px_rgba(34,211,238,.22)]">
        <button onClick={onClose} className="absolute left-4 top-4 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/10" aria-label="رجوع"><ArrowRight className="h-5 w-5" /></button>
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl border border-rose-300/40 bg-gradient-to-br from-rose-500 to-fuchsia-600 shadow-[0_0_35px_rgba(244,63,94,.45)]"><Video className="h-10 w-10" /></div>
        <div className="mt-3 text-center"><div className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-3 py-1 text-[10px] font-black text-rose-300"><Radio className="h-3 w-3 animate-pulse" /> بث مباشر لمدة ساعة</div><h1 className="mt-3 text-xl font-black">{title}</h1><p className="mt-1 text-xs font-bold text-cyan-200">{subject} — الفصل {chapter}</p></div>

        {busy && <div className="my-8 text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-cyan-400/25 border-t-cyan-300"/><p className="mt-3 text-sm font-bold text-slate-300">جارٍ إنشاء رابط Google Meet…</p></div>}
        {error && <div className="my-5 rounded-2xl border border-amber-300/25 bg-amber-500/10 p-4 text-center"><p className="text-sm font-bold leading-7 text-amber-100">{error}</p><button onClick={() => void signInWithGoogle()} className="mt-3 rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-900">ربط حساب Google ومنح الصلاحية</button></div>}
        {meetingUrl && <>
          <div className="mt-5 rounded-2xl border border-cyan-300/25 bg-white/5 p-3"><p className="mb-2 text-[10px] font-bold text-slate-400">رابط الاجتماع {roomCode && `· الغرفة #${roomCode}`}</p><div className="flex items-center gap-2"><div className="min-w-0 flex-1 truncate rounded-xl bg-slate-950/70 px-3 py-3 text-left text-xs text-cyan-200" dir="ltr">{meetingUrl}</div><button onClick={copy} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-cyan-500/15 text-cyan-200" aria-label="نسخ الرابط">{copied ? <Check className="h-5 w-5"/> : <Clipboard className="h-5 w-5"/>}</button></div></div>
          <button onClick={join} className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-600 px-5 py-5 text-lg font-black shadow-[0_14px_35px_rgba(37,99,235,.38)] transition active:scale-95"><ExternalLink className="h-7 w-7"/>انضم إلى البث الآن</button>
          <button onClick={() => void share()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-black text-slate-200"><Share2 className="h-5 w-5"/>إرسال دعوة للطلاب</button>
          <p className="mt-4 text-center text-[10px] leading-5 text-slate-400">سيختفي هذا البث تلقائيًا من قائمة الغرف بعد 60 دقيقة.</p>
        </>}
      </section>
    </div>
  </div>;
};
