import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2, VolumeX, UserRound } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { loadGuestSession } from '../services/guestPreviewService';
const API = (import.meta.env.VITE_ONLINE_CHALLENGE_API_URL || '').replace(/\/$/, '');
export type OnlineChallengeGameType = 'millionaire' | 'true_false' | 'gibha_sah';
export type OnlineChallengeQuestion = { question: string; options: string[]; correctAnswer: number };
type Player = { id: string; score: number; answered: boolean; connected: boolean };
type State = { type: 'state'; gameType: OnlineChallengeGameType; status: 'waiting' | 'playing' | 'finished' | 'closed'; round: number; total: number; question: { question: string; options: string[] } | null; players: Player[]; winner: string | null; tie: boolean };
type RoundResult = { answer: number; scores: Array<{ id: string; score: number }> };
type ActiveRoom = { code: string; subject: string; chapter: number; lesson: number; lessonTitle: string; gameType: OnlineChallengeGameType; gameTitle: string; players: number; createdAt: number };

interface Props { onClose: () => void; questions: OnlineChallengeQuestion[]; lessonTitle: string; gameType: OnlineChallengeGameType; gameTitle: string; subject?: string; chapterNumber?: number; lessonNumber?: number; }

export const OnlineChallengeModal: React.FC<Props> = ({ onClose, questions, lessonTitle, gameType, gameTitle, subject = 'المادة التعليمية', chapterNumber = 1, lessonNumber = 1 }) => {
  const [room, setRoom] = useState('');
  const [entry, setEntry] = useState('');
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [roomSubject, setRoomSubject] = useState('all');
  const [roomChapter, setRoomChapter] = useState('all');
  const [roomGame, setRoomGame] = useState<OnlineChallengeGameType | 'all'>('all');
  const [roomLesson, setRoomLesson] = useState('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [state, setState] = useState<State | null>(null);
  const [me, setMe] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [connected, setConnected] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [remoteAudioEnabled, setRemoteAudioEnabled] = useState(true);
  const [remoteTalking, setRemoteTalking] = useState(false);
  const [audioBusy, setAudioBusy] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const roundRef = useRef<number | null>(null);
  const resultUntilRef = useRef(0);
  const stateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function sendSocket(payload: unknown) {
    if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify(payload));
  }

  function closePeer() {
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
    pendingCandidatesRef.current = [];
  }

  async function ensurePeer() {
    if (peerRef.current) return peerRef.current;
    const peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    peerRef.current = peer;
    localStreamRef.current?.getTracks().forEach(track => peer.addTrack(track, localStreamRef.current as MediaStream));
    peer.onicecandidate = event => { if (event.candidate) sendSocket({ type: 'audio_signal', signal: { candidate: event.candidate.toJSON() } }); };
    peer.ontrack = event => {
      if (remoteAudioRef.current && event.streams[0]) {
        remoteAudioRef.current.srcObject = event.streams[0];
        remoteAudioRef.current.muted = !remoteAudioEnabled;
        void remoteAudioRef.current.play().catch(() => undefined);
      }
    };
    return peer;
  }

  async function toggleMicrophone() {
    if (!audioEnabled) {
      setAudioBusy(true);
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('المتصفح لا يدعم الميكروفون.');
        localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        localStreamRef.current.getAudioTracks().forEach(track => { track.enabled = true; });
        setAudioEnabled(true);
        sendSocket({ type: 'audio_state', enabled: true });
        await ensurePeer();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'تعذر تشغيل الميكروفون.');
      } finally { setAudioBusy(false); }
    } else {
      localStreamRef.current?.getAudioTracks().forEach(track => { track.enabled = false; });
      setAudioEnabled(false);
      sendSocket({ type: 'audio_state', enabled: false });
    }
  }

  function toggleRemoteAudio() {
    setRemoteAudioEnabled(value => {
      const next = !value;
      if (remoteAudioRef.current) remoteAudioRef.current.muted = !next;
      return next;
    });
  }

  useEffect(() => {
    if (!audioEnabled || !connected || state?.players.length !== 2) return;
    void (async () => {
      const peer = await ensurePeer();
      if (peer.signalingState !== 'stable') return;
      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      sendSocket({ type: 'audio_signal', signal: { description: peer.localDescription } });
    })();
  }, [audioEnabled, connected, state?.players.length]);

  useEffect(() => () => {
    socketRef.current?.close();
    closePeer();
    if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
  }, []);

  useEffect(() => {
    if (room) return;
    let cancelled = false;
    const loadRooms = async () => {
      try {
        const response = await fetch(`${API}/rooms`);
        if (!response.ok) return;
        const payload = await response.json();
        if (!cancelled) setActiveRooms(Array.isArray(payload.rooms) ? payload.rooms : []);
      } catch (_) { /* The create/join controls still work when the list is unavailable. */ }
    };
    loadRooms();
    const timer = window.setInterval(loadRooms, 3000);
    return () => { cancelled = true; window.clearInterval(timer); };
  }, [room]);

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
    if (!response.ok) throw new Error(response.status === 404 ? 'أُغلقت هذه الغرفة أو لم تعد متاحة. حدّث القائمة واختر غرفة أخرى.' : response.status === 409 ? 'هذه الغرفة ممتلئة.' : 'تعذر دخول الغرفة. تحقق من الرمز.');
    const { ticket, roomId: internalRoomId } = await response.json();
    socketRef.current?.close();
    setConnected(false);
    const ws = new WebSocket(`${API.replace(/^http/, 'ws')}/rooms/${internalRoomId || roomId}/ws?ticket=${encodeURIComponent(ticket)}`);
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
      if (payload.type === 'audio_state') setRemoteTalking(Boolean(payload.enabled));
      if (payload.type === 'audio_signal') {
        void (async () => {
          const peer = await ensurePeer();
          try {
            if (payload.signal?.description) {
              await peer.setRemoteDescription(payload.signal.description);
              for (const candidate of pendingCandidatesRef.current) await peer.addIceCandidate(candidate);
              pendingCandidatesRef.current = [];
              if (payload.signal.description.type === 'offer') {
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                sendSocket({ type: 'audio_signal', signal: { description: peer.localDescription } });
              }
            }
            if (payload.signal?.candidate) {
              if (peer.remoteDescription) await peer.addIceCandidate(payload.signal.candidate);
              else pendingCandidatesRef.current.push(payload.signal.candidate);
            }
          } catch (_) { setError('تعذر الاتصال الصوتي، حاول إيقاف الميكروفون وتشغيله مرة أخرى.'); }
        })();
      }
      if (payload.type === 'room_closed') {
        closePeer();
        setAudioEnabled(false);
        setRemoteTalking(false);
        setConnected(false);
        setPendingAnswer(false);
        setState(null);
        setError('أغلق المضيف الغرفة. يمكنك العودة واختيار غرفة أخرى.');
        ws.close();
      }
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
        closePeer();
        setAudioEnabled(false);
        setRemoteTalking(false);
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
      const response = await fetch(`${API}/rooms`, { method: 'POST', headers: { Authorization: await authorization(), 'Content-Type': 'application/json' }, body: JSON.stringify({ gameType, questions: selected, subject, chapter: chapterNumber, lesson: lessonNumber, lessonTitle, gameTitle }) });
      if (!response.ok) throw new Error('تعذر إنشاء غرفة التحدّي.');
      const { roomCode } = await response.json();
      await connect(roomCode);
    } catch (e) { setError(e instanceof Error ? e.message : 'حدث خطأ.'); }
    finally { setBusy(false); }
  }

  async function join() {
    setError(''); setBusy(true);
    try {
      const roomCode = entry.trim();
      if (!/^\d{1,4}$/.test(roomCode)) throw new Error('رمز الغرفة يجب أن يكون من 1 إلى 4 أرقام.');
      await connect(roomCode);
    } catch (e) { setError(e instanceof Error ? e.message : 'حدث خطأ.'); }
    finally { setBusy(false); }
  }

  const self = state?.players.find(p => p.id === me);
  const filteredRooms = activeRooms.filter((active) =>
    (roomSubject === 'all' || active.subject === roomSubject) &&
    (roomChapter === 'all' || String(active.chapter) === roomChapter) &&
    (roomLesson === 'all' || String(active.lesson) === roomLesson) &&
    (roomGame === 'all' || active.gameType === roomGame)
  );
  const subjects = Array.from(new Set(activeRooms.map((active) => active.subject))).sort();
  const chapters = Array.from(new Set(activeRooms.map((active) => active.chapter))).sort((a, b) => Number(a) - Number(b));
  const lessons = Array.from(new Set(activeRooms.map((active) => active.lesson))).sort((a, b) => Number(a) - Number(b));
  const gameNames: Record<OnlineChallengeGameType, string> = { millionaire: 'من سيربح المليون', true_false: 'صواب أم خطأ', gibha_sah: 'جبتها صح' };
  const activeFilterCount = [roomSubject !== 'all', roomChapter !== 'all', roomLesson !== 'all', roomGame !== 'all'].filter(Boolean).length;
  async function closeModal() {
    if (room) {
      try { await fetch(`${API}/rooms/${room}/leave`, { method: 'POST', headers: { Authorization: await authorization() }, keepalive: true }); } catch (_) { /* socket close still notifies the room */ }
    }
    socketRef.current?.close();
    onClose();
  }
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/90 p-4 text-white" dir="rtl">
    <div className="w-full max-w-xl rounded-3xl border border-sky-400/30 bg-[#0b1930] p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-black">{gameTitle} — لعب جماعي</h2><p className="text-xs text-sky-200">{lessonTitle}</p></div><button onClick={() => void closeModal()} className="rounded-lg bg-white/10 px-3 py-1">إغلاق</button></div>
      <p className="mb-4 text-sm text-sky-200">تجربة بين لاعبين، بلا نقاط للمستويات حالياً.</p>
      {!room && <div className="space-y-4">
        <div className="rounded-2xl border border-sky-400/20 bg-white/5 p-3">
          <div className="mb-2 flex items-center justify-between"><p className="text-sm font-black text-sky-100">الغرف النشطة المتاحة للانضمام</p><button onClick={() => setFiltersOpen(value => !value)} className="rounded-xl border border-sky-300/30 bg-sky-500/15 px-3 py-2 text-xs font-bold text-sky-100">تصفية {activeFilterCount ? `(${activeFilterCount})` : '⌄'}</button></div>
          {filtersOpen && <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-slate-900/60 p-3 text-xs sm:grid-cols-4">
            <select value={roomSubject} onChange={e => setRoomSubject(e.target.value)} className="rounded-lg bg-slate-800 p-2"><option value="all">كل المواد</option>{subjects.map(value => <option key={value} value={value}>{value}</option>)}</select>
            <select value={roomChapter} onChange={e => setRoomChapter(e.target.value)} className="rounded-lg bg-slate-800 p-2"><option value="all">كل الفصول</option>{chapters.map(value => <option key={value} value={value}>الفصل {value}</option>)}</select>
            <select value={roomLesson} onChange={e => setRoomLesson(e.target.value)} className="rounded-lg bg-slate-800 p-2"><option value="all">كل الدروس</option>{lessons.map(value => <option key={value} value={value}>الدرس {value}</option>)}</select>
            <select value={roomGame} onChange={e => setRoomGame(e.target.value as OnlineChallengeGameType | 'all')} className="rounded-lg bg-slate-800 p-2"><option value="all">كل الألعاب</option>{Object.entries(gameNames).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <button onClick={() => { setRoomSubject('all'); setRoomChapter('all'); setRoomLesson('all'); setRoomGame('all'); }} className="col-span-2 rounded-lg bg-white/10 p-2 text-slate-200 sm:col-span-4">مسح الفلاتر</button>
          </div>}
          <div className="mt-3 max-h-48 space-y-2 overflow-y-auto">
            {filteredRooms.length === 0 ? <p className="rounded-xl bg-black/20 p-3 text-center text-xs text-slate-300">لا توجد غرفة مطابقة حالياً.</p> : filteredRooms.map(active => <button key={active.code} disabled={busy} onClick={() => { setEntry(active.code); void (async () => { setBusy(true); try { await connect(active.code); } catch (e) { setError(e instanceof Error ? e.message : 'تعذر الانضمام.'); } finally { setBusy(false); } })(); }} className="w-full rounded-xl bg-slate-800 p-3 text-right transition hover:bg-slate-700 disabled:opacity-50"><span className="flex items-center justify-between"><b className="text-lg text-sky-200">#{active.code}</b><span className="text-xs text-emerald-300">{active.players}/2 لاعبين</span></span><span className="mt-1 block text-xs text-slate-200">{active.subject} — الفصل {active.chapter} — الدرس {active.lesson}</span><span className="block text-xs text-slate-400">{gameNames[active.gameType]} · {active.lessonTitle}</span></button>)}
          </div>
        </div>
        <button disabled={busy || !questions.length} onClick={create} className="w-full rounded-xl bg-sky-500 p-3 font-bold disabled:opacity-50">أنشئ غرفة وادعُ صديقك</button>
        <div className="flex gap-2"><input inputMode="numeric" maxLength={4} className="min-w-0 flex-1 rounded-xl bg-white/10 p-3" value={entry} onChange={e => setEntry(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="رمز من 4 أرقام"/><button disabled={busy} onClick={join} className="rounded-xl bg-emerald-600 px-5 font-bold">انضم</button></div>
      </div>}
      {room && <div className="space-y-4"><audio ref={remoteAudioRef} autoPlay playsInline /><div className="rounded-xl bg-white/5 p-3 text-sm">رمز الغرفة: <code className="break-all select-all">{room}</code><button className="mr-2 rounded bg-sky-700 px-2 py-1" onClick={() => navigator.clipboard.writeText(room)}>نسخ</button></div>
        {!connected && <button disabled={busy} onClick={reconnect} className="w-full rounded-xl bg-amber-600 p-2 font-bold disabled:opacity-50">{busy ? 'جارٍ الاتصال…' : 'إعادة الاتصال بالغرفة'}</button>}
        <div className="grid grid-cols-2 gap-2">{state?.players.map((p, i) => <div key={p.id} className="flex items-center justify-between rounded-xl bg-white/5 p-3"><span className="flex items-center gap-2 text-sm"><UserRound className="h-5 w-5 text-sky-300" />{p.id === me ? 'أنت' : `اللاعب ${i + 1}`} <span className={p.connected ? 'text-emerald-300' : 'text-slate-400'}>{p.connected ? 'متصل' : 'غير متصل'}</span></span>{p.id === me ? <button type="button" disabled={audioBusy} onClick={() => void toggleMicrophone()} aria-label={audioEnabled ? 'إغلاق الميكروفون' : 'فتح الميكروفون'} className={`rounded-lg p-2 ${audioEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'} disabled:opacity-50`}>{audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}</button> : <button type="button" onClick={toggleRemoteAudio} aria-label={remoteAudioEnabled ? 'كتم صوت اللاعب المقابل' : 'فتح صوت اللاعب المقابل'} className={`rounded-lg p-2 ${remoteAudioEnabled && remoteTalking ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}>{remoteAudioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}</button>}</div>)}</div>
        {state?.status === 'waiting' && <p className="text-center text-amber-200">بانتظار انضمام اللاعب الثاني…</p>}
        {state?.status === 'playing' && state.question && !roundResult && <div><p className="mb-3 font-bold">السؤال {state.round + 1} من {state.total}: {state.question.question}</p><div className={`grid gap-2 ${state.question.options.length > 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>{state.question.options.map((option, i) => <button key={i} disabled={!connected || pendingAnswer || self?.answered} onClick={() => answer(i)} className="min-h-16 rounded-xl bg-slate-700 p-2 text-sm disabled:opacity-50">{option}</button>)}</div>{(pendingAnswer || self?.answered) && <p className="mt-3 text-center text-sky-200">بانتظار إجابة اللاعب الآخر…</p>}</div>}
        {roundResult && state?.question && <div className="rounded-2xl border border-emerald-400/50 bg-emerald-500/15 p-5 text-center"><p className="text-sm font-bold text-emerald-200">نتيجة الجولة</p><p className="mt-2 text-lg font-black">الإجابة الصحيحة</p><p className="mt-2 rounded-xl bg-white/10 p-3 font-bold text-emerald-100">{state.question.options[roundResult.answer]}</p><div className="mt-3 flex justify-center gap-4 text-sm">{roundResult.scores.map((player, index) => <span key={player.id}>{player.id === me ? 'أنت' : `اللاعب ${index + 1}`}: <b>{player.score}</b></span>)}</div></div>}
        {state?.status === 'finished' && <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-5 text-center"><p className="text-2xl font-black text-amber-200">{state.tie ? 'انتهت المباراة بالتعادل!' : state.winner === me ? 'فزت بالتحدّي! 🎉' : 'فاز اللاعب الآخر'}</p><div className="mt-4 grid grid-cols-2 gap-3">{state.players.map((player, index) => <div key={player.id} className={`rounded-xl border p-3 ${player.id === state.winner ? 'border-amber-300 bg-amber-400/15' : 'border-white/15 bg-white/5'}`}><p className="text-xs text-slate-300">{player.id === me ? 'أنت' : `اللاعب ${index + 1}`}</p><p className="mt-1 text-2xl font-black">{player.score}</p></div>)}</div><button onClick={() => void closeModal()} className="mt-4 w-full rounded-xl bg-sky-600 p-3 font-black">العودة إلى الألعاب</button></div>}
      </div>}
      {error && <p className="mt-4 rounded-xl bg-red-500/20 p-3 text-sm text-red-100">{error}</p>}
    </div>
  </div>;
};
