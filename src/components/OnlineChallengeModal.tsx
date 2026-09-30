import React, { useEffect, useRef, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { MillionaireQuestion } from '../types';

const API = (import.meta.env.VITE_ONLINE_CHALLENGE_API_URL || '').replace(/\/$/, '');
type Player = { id: string; score: number; answered: boolean; connected: boolean };
type State = { type: 'state'; status: 'waiting' | 'playing' | 'finished'; round: number; total: number; question: { question: string; options: string[] } | null; players: Player[]; winner: string | null; tie: boolean };

interface Props { onClose: () => void; questions: MillionaireQuestion[]; lessonTitle: string; }

export const OnlineChallengeModal: React.FC<Props> = ({ onClose, questions, lessonTitle }) => {
  const [room, setRoom] = useState('');
  const [entry, setEntry] = useState('');
  const [state, setState] = useState<State | null>(null);
  const [me, setMe] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [lastAnswer, setLastAnswer] = useState<number | null>(null);
  const [connected, setConnected] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const roundRef = useRef<number | null>(null);

  useEffect(() => () => socketRef.current?.close(), []);

  async function token() {
    const client = getSupabaseClient();
    const { data } = await client?.auth.getSession() || { data: { session: null } };
    if (!data.session?.access_token) throw new Error('سجّل الدخول أولاً لبدء التحدّي.');
    return data.session.access_token;
  }

  async function connect(roomId: string) {
    const response = await fetch(`${API}/rooms/${roomId}/connect`, { method: 'POST', headers: { Authorization: `Bearer ${await token()}` } });
    if (!response.ok) throw new Error(response.status === 409 ? 'هذه الغرفة ممتلئة.' : 'تعذر دخول الغرفة. تحقق من الرمز.');
    const { ticket } = await response.json();
    socketRef.current?.close();
    setConnected(false);
    const ws = new WebSocket(`${API.replace(/^http/, 'ws')}/rooms/${roomId}/ws?ticket=${encodeURIComponent(ticket)}`);
    socketRef.current = ws;
    ws.onopen = () => { setConnected(true); setError(''); };
    ws.onmessage = (event) => {
      let payload;
      try { payload = JSON.parse(event.data); } catch { return; }
      if (payload.type === 'welcome') setMe(payload.userId);
      if (payload.type === 'state') {
        if (roundRef.current !== payload.round) {
          roundRef.current = payload.round;
          if (payload.status !== 'finished') setLastAnswer(null);
          setPendingAnswer(false);
        }
        setState(payload);
      }
      if (payload.type === 'round_result') setLastAnswer(payload.answer);
    };
    ws.onerror = () => setError('تعذر الاتصال بالغرفة. اضغط إعادة الاتصال.');
    ws.onclose = () => {
      if (socketRef.current === ws) {
        socketRef.current = null;
        setConnected(false);
        setPendingAnswer(false);
        setError('انقطع الاتصال بالغرفة. اضغط إعادة الاتصال.');
      }
    };
    setRoom(roomId);
  }

  async function reconnect() {
    setBusy(true);
    try { await connect(room); }
    catch (e) { setError(e instanceof Error ? e.message : 'تعذر إعادة الاتصال.'); }
    finally { setBusy(false); }
  }

  function answer(option: number) {
    if (!connected || pendingAnswer || self?.answered || socketRef.current?.readyState !== WebSocket.OPEN) return;
    setPendingAnswer(true);
    socketRef.current.send(JSON.stringify({ type: 'answer', option }));
  }

  async function create() {
    setError(''); setBusy(true);
    try {
      const selected = questions.slice(0, 10).map(q => ({ question: q.question, options: q.options, correctAnswer: q.correctAnswer }));
      if (!selected.length) throw new Error('لا توجد أسئلة لهذا الدرس.');
      const response = await fetch(`${API}/rooms`, { method: 'POST', headers: { Authorization: `Bearer ${await token()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ questions: selected }) });
      if (!response.ok) throw new Error('تعذر إنشاء غرفة التحدّي.');
      const { roomId } = await response.json();
      await connect(roomId);
    } catch (e) { setError(e instanceof Error ? e.message : 'حدث خطأ.'); }
    finally { setBusy(false); }
  }

  async function join() {
    setError(''); setBusy(true);
    try {
      const roomId = entry.trim().toLowerCase();
      if (!/^[0-9a-f-]{36}$/.test(roomId)) throw new Error('رمز الغرفة غير صالح.');
      await connect(roomId);
    } catch (e) { setError(e instanceof Error ? e.message : 'حدث خطأ.'); }
    finally { setBusy(false); }
  }

  const self = state?.players.find(p => p.id === me);
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/90 p-4 text-white" dir="rtl">
    <div className="w-full max-w-xl rounded-3xl border border-sky-400/30 bg-[#0b1930] p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-black">تحدّي مباشر: {lessonTitle}</h2><button onClick={onClose} className="rounded-lg bg-white/10 px-3 py-1">إغلاق</button></div>
      <p className="mb-4 text-sm text-sky-200">تجربة بين لاعبين، بلا نقاط للمستويات حالياً.</p>
      {!room && <div className="space-y-3"><button disabled={busy || !questions.length} onClick={create} className="w-full rounded-xl bg-sky-500 p-3 font-bold disabled:opacity-50">أنشئ غرفة وادعُ صديقك</button>
        <div className="flex gap-2"><input className="min-w-0 flex-1 rounded-xl bg-white/10 p-3" value={entry} onChange={e => setEntry(e.target.value)} placeholder="رمز غرفة صديقك"/><button disabled={busy} onClick={join} className="rounded-xl bg-emerald-600 px-5 font-bold">انضم</button></div></div>}
      {room && <div className="space-y-4"><div className="rounded-xl bg-white/5 p-3 text-sm">رمز الغرفة: <code className="break-all select-all">{room}</code><button className="mr-2 rounded bg-sky-700 px-2 py-1" onClick={() => navigator.clipboard.writeText(room)}>نسخ</button></div>
        {!connected && <button disabled={busy} onClick={reconnect} className="w-full rounded-xl bg-amber-600 p-2 font-bold disabled:opacity-50">{busy ? 'جارٍ الاتصال…' : 'إعادة الاتصال بالغرفة'}</button>}
        <div className="flex justify-between text-sm">{state?.players.map((p, i) => <span key={p.id}>{p.id === me ? 'أنت' : `اللاعب ${i + 1}`}: {p.score} {p.connected ? '🟢' : '⚪'}</span>)}</div>
        {state?.status === 'waiting' && <p className="text-center text-amber-200">بانتظار انضمام اللاعب الثاني…</p>}
        {state?.status === 'playing' && state.question && <div><p className="mb-3 font-bold">السؤال {state.round + 1} من {state.total}: {state.question.question}</p><div className="grid grid-cols-2 gap-2">{state.question.options.map((option, i) => <button key={i} disabled={!connected || pendingAnswer || self?.answered} onClick={() => answer(i)} className="min-h-16 rounded-xl bg-slate-700 p-2 text-sm disabled:opacity-50">{option}</button>)}</div>{(pendingAnswer || self?.answered) && <p className="mt-3 text-center text-sky-200">بانتظار إجابة اللاعب الآخر…</p>}</div>}
        {lastAnswer !== null && state?.status === 'finished' && <p>الإجابة الصحيحة في الجولة الأخيرة: الخيار {lastAnswer + 1}</p>}
        {state?.status === 'finished' && <p className="text-center text-xl font-bold">{state.tie ? 'تعادل!' : state.winner === me ? 'فزت بالتحدّي!' : 'انتهى التحدّي'}</p>}
      </div>}
      {error && <p className="mt-4 rounded-xl bg-red-500/20 p-3 text-sm text-red-100">{error}</p>}
    </div>
  </div>;
};
