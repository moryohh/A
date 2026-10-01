import React, { useEffect, useRef, useState } from 'react';
import { getSupabaseClient } from '../lib/supabase';
import { loadGuestSession } from '../services/guestPreviewService';
const API = (import.meta.env.VITE_ONLINE_CHALLENGE_API_URL || '').replace(/\/$/, '');
export type OnlineChallengeGameType = 'millionaire' | 'true_false' | 'gibha_sah';
export type OnlineChallengeQuestion = { question: string; options: string[]; correctAnswer: number };
type Player = { id: string; score: number; answered: boolean; connected: boolean };
type State = { type: 'state'; gameType: OnlineChallengeGameType; status: 'waiting' | 'playing' | 'finished'; round: number; total: number; question: { question: string; options: string[] } | null; players: Player[]; winner: string | null; tie: boolean };
type RoundResult = { answer: number; scores: Array<{ id: string; score: number }> };

interface Props { onClose: () => void; questions: OnlineChallengeQuestion[]; lessonTitle: string; gameType: OnlineChallengeGameType; gameTitle: string; }

export const OnlineChallengeModal: React.FC<Props> = ({ onClose, questions, lessonTitle, gameType, gameTitle }) => {
  const [room, setRoom] = useState('');
  const [entry, setEntry] = useState('');
  const [state, setState] = useState<State | null>(null);
  const [me, setMe] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [connected, setConnected] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const roundRef = useRef<number | null>(null);
  const resultUntilRef = useRef(0);
  const stateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    socketRef.current?.close();
    if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
  }, []);

  async function authorization(): Promise<string> {
    const guest = loadGuestSession();
    if (guest) return `Guest ${guest.id}`;
    const client = getSupabaseClient();
    const { data } = await client?.auth.getSession() || { data: { session: null } };
    if (!data.session?.access_token) throw new Error('سجّل الدخول أولاً لبدء التحدّي.');
    return `Bearer ${data.session.access_token}`;
  }

  async function connect(roomId: string) {
    const response = await fetch(`${API}/rooms/${roomId}/connect`, { method: 'POST', headers: { Authorization: await authorization() } });
    if (!response.ok) throw new Error(response.status === 409 ? 'هذه الغرفة ممتلئة.' : 'تعذر دخول الغرفة. تحقق من الرمز.');
    const { ticket } = await response.json();
    socketRef.current?.close();
    setConnected(false);
    const ws = new WebSocket(`${API.replace(/^http/, 'ws')}/rooms/${roomId}/ws?ticket=${encodeURIComponent(ticket)}`);
    socketRef.current = ws;
    ws.onopen = () => { setConnected(true); setError(''); };
    const applyState = (payload: State) => {
      if (roundRef.current !== payload.round) roundRef.current = payload.round;
      setPendingAnswer(false);
      setRoundResult(null);
      setState(payload);
    };
    ws.onmessage = (event) => {
      let payload;
      try { payload = JSON.parse(event.data); } catch { return; }
      if (payload.type === 'welcome') setMe(payload.userId);
      if (payload.type === 'state') {
        const remaining = resultUntilRef.current - Date.now();
        if (remaining > 0) {
          if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
          stateTimerRef.current = setTimeout(() => applyState(payload), remaining);
        } else {
          applyState(payload);
        }
      }
      if (payload.type === 'round_result') {
        resultUntilRef.current = Date.now() + 2200;
        setRoundResult({ answer: payload.answer, scores: payload.scores || [] });
      }
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
      const response = await fetch(`${API}/rooms`, { method: 'POST', headers: { Authorization: await authorization(), 'Content-Type': 'application/json' }, body: JSON.stringify({ gameType, questions: selected }) });
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
      <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-black">{gameTitle} — لعب جماعي</h2><p className="text-xs text-sky-200">{lessonTitle}</p></div><button onClick={onClose} className="rounded-lg bg-white/10 px-3 py-1">إغلاق</button></div>
      <p className="mb-4 text-sm text-sky-200">تجربة بين لاعبين، بلا نقاط للمستويات حالياً.</p>
      {!room && <div className="space-y-3"><button disabled={busy || !questions.length} onClick={create} className="w-full rounded-xl bg-sky-500 p-3 font-bold disabled:opacity-50">أنشئ غرفة وادعُ صديقك</button>
        <div className="flex gap-2"><input className="min-w-0 flex-1 rounded-xl bg-white/10 p-3" value={entry} onChange={e => setEntry(e.target.value)} placeholder="رمز غرفة صديقك"/><button disabled={busy} onClick={join} className="rounded-xl bg-emerald-600 px-5 font-bold">انضم</button></div></div>}
      {room && <div className="space-y-4"><div className="rounded-xl bg-white/5 p-3 text-sm">رمز الغرفة: <code className="break-all select-all">{room}</code><button className="mr-2 rounded bg-sky-700 px-2 py-1" onClick={() => navigator.clipboard.writeText(room)}>نسخ</button></div>
        {!connected && <button disabled={busy} onClick={reconnect} className="w-full rounded-xl bg-amber-600 p-2 font-bold disabled:opacity-50">{busy ? 'جارٍ الاتصال…' : 'إعادة الاتصال بالغرفة'}</button>}
        <div className="flex justify-between text-sm">{state?.players.map((p, i) => <span key={p.id}>{p.id === me ? 'أنت' : `اللاعب ${i + 1}`}: {p.score} {p.connected ? '🟢' : '⚪'}</span>)}</div>
        {state?.status === 'waiting' && <p className="text-center text-amber-200">بانتظار انضمام اللاعب الثاني…</p>}
        {state?.status === 'playing' && state.question && !roundResult && <div><p className="mb-3 font-bold">السؤال {state.round + 1} من {state.total}: {state.question.question}</p><div className={`grid gap-2 ${state.question.options.length > 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>{state.question.options.map((option, i) => <button key={i} disabled={!connected || pendingAnswer || self?.answered} onClick={() => answer(i)} className="min-h-16 rounded-xl bg-slate-700 p-2 text-sm disabled:opacity-50">{option}</button>)}</div>{(pendingAnswer || self?.answered) && <p className="mt-3 text-center text-sky-200">بانتظار إجابة اللاعب الآخر…</p>}</div>}
        {roundResult && state?.question && <div className="rounded-2xl border border-emerald-400/50 bg-emerald-500/15 p-5 text-center"><p className="text-sm font-bold text-emerald-200">نتيجة الجولة</p><p className="mt-2 text-lg font-black">الإجابة الصحيحة</p><p className="mt-2 rounded-xl bg-white/10 p-3 font-bold text-emerald-100">{state.question.options[roundResult.answer]}</p><div className="mt-3 flex justify-center gap-4 text-sm">{roundResult.scores.map((player, index) => <span key={player.id}>{player.id === me ? 'أنت' : `اللاعب ${index + 1}`}: <b>{player.score}</b></span>)}</div></div>}
        {state?.status === 'finished' && <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-5 text-center"><p className="text-2xl font-black text-amber-200">{state.tie ? 'انتهت المباراة بالتعادل!' : state.winner === me ? 'فزت بالتحدّي! 🎉' : 'فاز اللاعب الآخر'}</p><div className="mt-4 grid grid-cols-2 gap-3">{state.players.map((player, index) => <div key={player.id} className={`rounded-xl border p-3 ${player.id === state.winner ? 'border-amber-300 bg-amber-400/15' : 'border-white/15 bg-white/5'}`}><p className="text-xs text-slate-300">{player.id === me ? 'أنت' : `اللاعب ${index + 1}`}</p><p className="mt-1 text-2xl font-black">{player.score}</p></div>)}</div><button onClick={onClose} className="mt-4 w-full rounded-xl bg-sky-600 p-3 font-black">العودة إلى الألعاب</button></div>}
      </div>}
      {error && <p className="mt-4 rounded-xl bg-red-500/20 p-3 text-sm text-red-100">{error}</p>}
    </div>
  </div>;
};
