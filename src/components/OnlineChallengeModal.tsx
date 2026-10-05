import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, Mic, MicOff, Send, Trophy, Volume2, VolumeX, UserRound, X } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { loadGuestSession } from '../services/guestPreviewService';
import { gameAudio } from '../utils/gameAudio';
import { ScientificText } from './ScientificText';
const API = (import.meta.env.VITE_ONLINE_CHALLENGE_API_URL || '').replace(/\/$/, '');
export type OnlineChallengeGameType = 'millionaire' | 'true_false' | 'gibha_sah';
export type OnlineChallengeQuestion = { question: string; options: string[]; correctAnswer: number };
type Player = { id: string; score: number; answered: boolean; connected: boolean; bot?: boolean; name?: string; avatar?: string; city?: string; school?: string; badge?: string; level?: number };
type State = { type: 'state'; gameType: OnlineChallengeGameType; status: 'waiting' | 'playing' | 'finished' | 'closed' | 'abandoned'; round: number; total: number; turn?: string | null; question: { question: string; options: string[] } | null; players: Player[]; winner: string | null; tie: boolean; endedReason?: string | null; leftPlayerId?: string | null; reconnectDeadline?: number | null };
type RoundResult = { question?: { question: string; options: string[] }; answer: number; selected?: number; answeredBy?: string; scores: Array<{ id: string; score: number }> };
type ChatMessage = { id: string; from: string; text: string; sentAt: number };

interface Props { onClose: () => void; questions: OnlineChallengeQuestion[]; lessonTitle: string; gameType: OnlineChallengeGameType; gameTitle: string; subject?: string; chapterNumber?: number; lessonNumber?: number; initialRoomCode?: string; }

export const OnlineChallengeModal: React.FC<Props> = ({ onClose, questions, lessonTitle, gameType, gameTitle, subject = 'المادة التعليمية', chapterNumber = 1, lessonNumber = 1, initialRoomCode }) => {
  const [room, setRoom] = useState('');
  const [entry, setEntry] = useState('');
  const [state, setState] = useState<State | null>(null);
  const [me, setMe] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [connected, setConnected] = useState(false);
  const [pendingAnswer, setPendingAnswer] = useState(false);
  const [resultRevealed, setResultRevealed] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [remoteAudioEnabled, setRemoteAudioEnabled] = useState(true);
  const [remoteTalking, setRemoteTalking] = useState(false);
  const [audioBusy, setAudioBusy] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChat, setUnreadChat] = useState(0);
  const suppressCloseMessageRef = useRef(false);
  const meRef = useRef('');
  const socketRef = useRef<WebSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const roundRef = useRef<number | null>(null);
  const resultUntilRef = useRef(0);
  const stateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
  }, []);

  useEffect(() => {
    if (!initialRoomCode || room || busy) return;
    setEntry(initialRoomCode);
    setBusy(true);
    void connect(initialRoomCode).catch((error) => setError(error instanceof Error ? error.message : 'تعذر الانضمام إلى الغرفة.')).finally(() => setBusy(false));
    // The selected room is intentionally joined once when opened from the hub.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRoomCode]);

  async function authorization(): Promise<string> {
    const guest = loadGuestSession();
    if (guest) return `Guest ${guest.id}`;
    const client = getSupabaseClient();
    const { data } = await client?.auth.getSession() || { data: { session: null } };
    if (!data.session?.access_token) throw new Error('سجّل الدخول أولاً لبدء التحدّي.');
    return `Bearer ${data.session.access_token}`;
  }

  async function challengeProfile(): Promise<{ name: string; avatar: string }> {
    const guest = loadGuestSession();
    if (guest) return { name: guest.name, avatar: '' };
    const client = getSupabaseClient();
    const { data } = await client?.auth.getSession() || { data: { session: null } };
    const metadata = data.session?.user?.user_metadata || {};
    return {
      name: String(metadata.full_name || metadata.name || data.session?.user?.email?.split('@')[0] || 'طالب'),
      avatar: String(metadata.avatar_url || metadata.picture || ''),
    };
  }

  async function connect(roomId: string) {
    const response = await fetch(`${API}/rooms/${roomId}/connect`, { method: 'POST', headers: { Authorization: await authorization(), 'Content-Type': 'application/json' }, body: JSON.stringify({ profile: await challengeProfile() }) });
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
      setResultRevealed(false);
      setState(payload);
    };
    ws.onmessage = (event) => {
      let payload;
      try { payload = JSON.parse(event.data); } catch { return; }
      if (payload.type === 'welcome') { meRef.current = payload.userId; setMe(payload.userId); }
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
        suppressCloseMessageRef.current = true;
        ws.close();
      }
      if (payload.type === 'challenge_ended') {
        closePeer();
        setAudioEnabled(false);
        setRemoteTalking(false);
        setConnected(false);
        setPendingAnswer(false);
        setRoundResult(null);
        setError('انسحب اللاعب الآخر. انتهى التحدّي ويمكنك العودة إلى قائمة الغرف.');
        suppressCloseMessageRef.current = true;
        ws.close();
      }
      if (payload.type === 'bot_joined') setError('');
      if (payload.type === 'chat' && typeof payload.text === 'string') {
        setChatMessages(previous => [...previous, { id: `${payload.from}-${payload.sentAt}-${Math.random()}`, from: payload.from, text: payload.text, sentAt: payload.sentAt || Date.now() }]);
        if (payload.from !== meRef.current) {
          setUnreadChat(previous => previous + 1);
          setChatOpen(true);
        }
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
        resultUntilRef.current = Date.now() + (gameType === 'millionaire' ? 5000 : 2200);
        if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
        setResultRevealed(false);
        setRoundResult({ question: payload.question, answer: payload.answer, selected: payload.selected, answeredBy: payload.answeredBy, scores: payload.scores || [] });
        if (gameType === 'millionaire') {
          gameAudio.playMillionaireLockIn();
          revealTimerRef.current = setTimeout(() => {
            setResultRevealed(true);
            if (payload.selected === payload.answer) gameAudio.playMillionaireCorrect();
            else gameAudio.playMillionaireWrong();
          }, 850);
        } else setResultRevealed(true);
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
        if (!suppressCloseMessageRef.current) setError('انقطع الاتصال بالغرفة. اضغط إعادة الاتصال.');
        suppressCloseMessageRef.current = false;
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
    if (!connected || (state?.turn && state.turn !== me) || pendingAnswer || self?.answered || socketRef.current?.readyState !== WebSocket.OPEN) return;
    setPendingAnswer(true);
    socketRef.current.send(JSON.stringify({ type: 'answer', option }));
  }

  function sendChat() {
    const text = chatInput.trim().slice(0, 300);
    if (!text || !connected) return;
    sendSocket({ type: 'chat', text });
    setChatInput('');
  }

  async function create() {
    setError(''); setBusy(true);
    try {
      const selected = questions.slice(0, gameType === 'millionaire' ? 11 : 10).map(q => ({ question: q.question, options: q.options, correctAnswer: q.correctAnswer }));
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
  const opponent = state?.players.find(p => p.id !== me);
  const isMillionaire = gameType === 'millionaire';
  const millionairePrizes = ['250', '500', '1 000', '5 000', '10 000', '25 000', '50 000', '100 000', '250 000', '500 000', '1 000 000'];
  const displayedQuestion = roundResult?.question || state?.question;
  const myTurn = state?.turn === me;
  const answeredByMe = roundResult?.answeredBy === me;
  async function closeModal() {
    if (room) {
      try { await fetch(`${API}/rooms/${room}/leave`, { method: 'POST', headers: { Authorization: await authorization() }, keepalive: true }); } catch (_) { /* socket close still notifies the room */ }
    }
    socketRef.current?.close();
    onClose();
  }

  const chatPanel = chatOpen && <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 p-3 sm:items-center" onClick={() => { setChatOpen(false); setUnreadChat(0); }}>
    <div className="flex h-[65vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-cyan-400/50 bg-[#071333] shadow-2xl" onClick={event => event.stopPropagation()}>
      <div className="flex items-center justify-between border-b border-white/10 p-3">
        <div className="flex items-center gap-2">{opponent?.avatar ? <img src={opponent.avatar} alt={opponent.name || 'المنافس'} className="h-10 w-10 rounded-full object-cover" /> : <UserRound className="h-8 w-8 text-cyan-300" />}<div><strong>{opponent?.name || 'المنافس'}</strong><small className="block text-emerald-300">متصل الآن</small></div></div>
        <button onClick={() => { setChatOpen(false); setUnreadChat(0); }} className="rounded-full bg-white/10 p-2"><X className="h-5 w-5" /></button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">{chatMessages.length === 0 && <p className="mt-8 text-center text-sm text-slate-400">ابدأ المحادثة مع منافسك</p>}{chatMessages.map(message => <div key={message.id} className={`flex ${message.from === me ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${message.from === me ? 'bg-cyan-600' : 'bg-slate-700'}`}>{message.text}</div></div>)}</div>
      <div className="flex gap-2 border-t border-white/10 p-3"><input value={chatInput} onChange={event => setChatInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') sendChat(); }} maxLength={300} placeholder="اكتب رسالة…" className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-2 outline-none"/><button onClick={sendChat} disabled={!chatInput.trim()} className="rounded-xl bg-cyan-500 p-3 disabled:opacity-40"><Send className="h-5 w-5" /></button></div>
    </div>
  </div>;

  if (room && state && isMillionaire) return <div className="fixed inset-0 z-[90] overflow-y-auto bg-slate-950/95 p-2 text-white sm:p-5" dir="rtl">
    <audio ref={remoteAudioRef} autoPlay playsInline />
    <div className="mx-auto min-h-full w-full max-w-2xl overflow-hidden rounded-[2rem] border-2 border-[#2049a4] bg-[radial-gradient(circle_at_center,#0b1b51,#03091e_72%)] shadow-[0_0_40px_rgba(32,73,164,.6)]">
      <header className="flex items-center justify-between border-b border-blue-500/30 bg-[#03091e] p-4">
        <div className="flex items-center gap-3"><div className="rounded-full border-2 border-amber-400 p-2 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,.4)]"><Trophy className="h-6 w-6" /></div><div><h2 className="font-black text-amber-300">من سيربح المليون؟</h2><p className="text-xs text-slate-300">{lessonTitle}</p></div></div>
        <button onClick={() => void closeModal()} aria-label="الخروج من التحدي" className="rounded-full bg-blue-950 p-2"><X className="h-6 w-6" /></button>
      </header>
      <div className="flex items-center justify-between gap-2 border-b border-blue-400/20 bg-blue-950/35 p-3">
        <div className="flex min-w-0 items-center gap-2">{opponent?.avatar ? <img src={opponent.avatar} alt={opponent.name || 'المنافس'} className="h-11 w-11 rounded-full border-2 border-cyan-400 object-cover" /> : <div className="grid h-11 w-11 place-items-center rounded-full border-2 border-cyan-400 bg-slate-800"><UserRound className="h-6 w-6" /></div>}<div className="min-w-0"><strong className="block truncate text-sm">{opponent?.name || 'بانتظار المنافس…'}</strong><small className="text-emerald-300">{opponent ? opponent.bot ? 'منافس آلي' : opponent.connected ? 'متصل' : 'انقطع اتصاله' : 'الغرفة مفتوحة'}</small></div></div>
        <div className="flex gap-1.5"><button onClick={() => { setChatOpen(true); setUnreadChat(0); }} aria-label="المحادثة" className="relative rounded-full border border-cyan-400/60 bg-cyan-500/15 p-2.5 text-cyan-300"><MessageCircle className="h-5 w-5" />{unreadChat > 0 && <span className="absolute -left-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black">{unreadChat}</span>}</button><button type="button" aria-label={audioEnabled ? 'إغلاق الميكروفون' : 'فتح الميكروفون'} disabled={audioBusy || !opponent || opponent.bot} onClick={() => void toggleMicrophone()} className={`rounded-full border p-2.5 ${audioEnabled ? 'border-emerald-300 bg-emerald-500' : 'border-blue-400/50 bg-blue-500/15'} disabled:opacity-40`}>{audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}</button><button type="button" aria-label={remoteAudioEnabled ? 'كتم صوت المنافس' : 'فتح صوت المنافس'} disabled={!opponent || opponent.bot} onClick={toggleRemoteAudio} className="rounded-full border border-blue-400/50 bg-blue-500/15 p-2.5 disabled:opacity-40">{remoteAudioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}</button></div>
      </div>
      <main className="space-y-5 p-3 sm:p-5">
        <div className="rounded-3xl border-2 border-[#2049a4] bg-[#061235] p-4 shadow-[0_0_25px_rgba(18,48,128,.5)]">
          <div className="flex items-center justify-between gap-2 text-xs"><span className="font-black text-amber-300">السؤال {Math.min((state.round || 0) + 1, state.total)} من {state.total}</span><span className="text-amber-300">الجائزة: {millionairePrizes[Math.min(state.round, 10)]} د.ع</span></div>
          <p className="mt-3 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-center text-sm font-black text-amber-200">{roundResult ? answeredByMe ? 'إجابتك الآن — المنافس يشاهد' : `إجابة ${opponent?.name || 'المنافس'} — أنت تشاهد` : state.status === 'waiting' ? 'بانتظار انضمام المنافس' : myTurn ? 'دورك للإجابة الآن! ⭐' : `${opponent?.name || 'المنافس'} يفكّر في الإجابة...`}</p>
          <div className="mt-3 flex items-center justify-between text-xs text-cyan-200"><span>أنت: {self?.score || 0} صحيحة</span><span>{opponent?.name || 'المنافس'}: {opponent?.score || 0} صحيحة</span></div>
        </div>
        {state.status === 'waiting' && <div className="rounded-2xl border border-cyan-500/40 bg-[#071339] p-6 text-center"><p>بانتظار اللاعب الثاني…</p><p className="mt-4 text-sm">رمز الغرفة: <b className="select-all text-lg text-amber-300">{room}</b></p><button className="mt-3 rounded-xl bg-sky-700 px-4 py-2 text-sm" onClick={() => void navigator.clipboard.writeText(room)}>نسخ الرمز</button></div>}
        {!connected && state.status !== 'finished' && <button disabled={busy} onClick={reconnect} className="w-full rounded-xl bg-amber-600 p-3 font-bold">إعادة الاتصال بالغرفة</button>}
        {state.reconnectDeadline && <p className="rounded-xl bg-amber-500/15 p-3 text-center text-sm text-amber-200">انقطع اتصال المنافس؛ ينتظر النظام عودته ثم يُكمل البوت المباراة.</p>}
        {displayedQuestion && (state.status === 'playing' || roundResult) && <>
          <div className="flex min-h-36 items-center justify-center rounded-3xl border-2 border-[#2049a4] bg-[#061235] p-5 text-center text-lg font-black leading-9 shadow-[0_0_30px_rgba(18,48,128,.45)]"><ScientificText value={displayedQuestion.question} /></div>
          <div className="space-y-3">{displayedQuestion.options.map((option, index) => {
            const chosen = roundResult?.selected === index;
            const correct = roundResult?.answer === index;
            const resultStyle = roundResult && resultRevealed ? correct ? 'border-emerald-400 bg-emerald-500/25 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,.45)]' : chosen ? 'border-rose-400 bg-rose-500/25 text-rose-100' : 'border-blue-900/50 bg-[#03091e] opacity-60' : roundResult && chosen ? 'border-amber-400 bg-amber-500/25 animate-pulse' : 'border-[#1c3e8a] bg-gradient-to-r from-[#071233] to-[#03091e]';
            return <button key={index} disabled={!connected || !myTurn || pendingAnswer || Boolean(roundResult) || state.status !== 'playing'} onClick={() => answer(index)} className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 px-4 text-right text-sm font-bold transition ${resultStyle} disabled:cursor-default`}><b className="shrink-0 text-amber-300">{['أ:', 'ب:', 'ج:', 'د:'][index] || `${index + 1}:`}</b><ScientificText value={option} />{chosen && <span className="mr-auto shrink-0 text-xs text-amber-200">{answeredByMe ? 'اختيارك' : 'اختيار المنافس'}</span>}</button>;
          })}</div>
          {roundResult && resultRevealed && <div className={`rounded-2xl border p-4 text-center font-black ${roundResult.selected === roundResult.answer ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-300' : 'border-rose-400/60 bg-rose-500/15 text-rose-200'}`}>{roundResult.selected === roundResult.answer ? 'إجابة صحيحة! ✨' : 'إجابة خاطئة ✗'}<p className="mt-1 text-xs text-slate-200">{answeredByMe ? 'شاهد منافسك اختيارك' : 'شاهدت اختيار المنافس'} — الدور التالي بعد عرض النتيجة</p></div>}
        </>}
        {state.status === 'finished' && !roundResult && <div className="rounded-3xl border border-amber-400/50 bg-amber-500/10 p-8 text-center"><Trophy className="mx-auto h-14 w-14 text-amber-300"/><p className="mt-3 text-2xl font-black">{state.tie ? 'تعادلتم!' : state.winner === me ? 'أنت الفائز! 🎉' : `${opponent?.name || 'المنافس'} فاز`}</p><p className="mt-2 text-sm">إجابات صحيحة: أنت {self?.score || 0} — المنافس {opponent?.score || 0}</p><button onClick={() => void closeModal()} className="mt-5 rounded-xl bg-blue-600 px-8 py-3 font-black">العودة</button></div>}
      </main>
      {error && <p className="m-4 rounded-xl bg-red-500/20 p-3 text-sm text-red-100">{error}</p>}
    </div>{chatPanel}
  </div>;

  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/90 p-4 text-white" dir="rtl">
    <div className="w-full max-w-xl rounded-3xl border border-sky-400/30 bg-[#0b1930] p-5 shadow-2xl">
      <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-black">{gameTitle} — لعب جماعي</h2><p className="text-xs text-sky-200">{lessonTitle}</p></div><button onClick={() => void closeModal()} className="rounded-lg bg-white/10 px-3 py-1">إغلاق</button></div>
      <p className="mb-4 text-sm text-sky-200">تجربة بين لاعبين، بلا نقاط للمستويات حالياً.</p>
      {!room && <div className="space-y-4">
        <button disabled={busy || !questions.length} onClick={create} className="w-full rounded-xl bg-sky-500 p-3 font-bold disabled:opacity-50">أنشئ غرفة وادعُ صديقك</button>
        <div className="flex gap-2"><input inputMode="numeric" maxLength={4} className="min-w-0 flex-1 rounded-xl bg-white/10 p-3" value={entry} onChange={e => setEntry(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="رمز من 4 أرقام"/><button disabled={busy} onClick={join} className="rounded-xl bg-emerald-600 px-5 font-bold">انضم</button></div>
      </div>}
      {room && <div className="space-y-4"><audio ref={remoteAudioRef} autoPlay playsInline /><div className="rounded-xl bg-white/5 p-3 text-sm">رمز الغرفة: <code className="break-all select-all">{room}</code><button className="mr-2 rounded bg-sky-700 px-2 py-1" onClick={() => navigator.clipboard.writeText(room)}>نسخ</button></div>
        {!connected && <button disabled={busy} onClick={reconnect} className="w-full rounded-xl bg-amber-600 p-2 font-bold disabled:opacity-50">{busy ? 'جارٍ الاتصال…' : 'إعادة الاتصال بالغرفة'}</button>}
        <div className="grid grid-cols-2 gap-2">{state?.players.map((p, i) => <div key={p.id} className="flex items-center justify-between rounded-xl bg-white/5 p-3"><span className="flex items-center gap-2 text-sm">{p.bot && p.avatar ? <img src={p.avatar} alt={p.name || 'الخصم'} className="h-9 w-9 rounded-full object-cover" /> : <UserRound className="h-5 w-5 text-sky-300" />}<span><strong className="block">{p.id === me ? 'أنت' : p.bot ? p.name || 'الخصم' : `اللاعب ${i + 1}`}</strong>{p.bot && <small className="block text-[10px] text-violet-200">{p.badge} · المستوى {p.level}</small>}<small className={p.connected ? 'text-emerald-300' : 'text-slate-400'}>{p.bot ? (p.answered ? 'أجاب' : 'يفكر…') : p.connected ? 'متصل' : 'غير متصل'}</small></span></span>{p.id === me ? <button type="button" disabled={audioBusy} onClick={() => void toggleMicrophone()} aria-label={audioEnabled ? 'إغلاق الميكروفون' : 'فتح الميكروفون'} className={`rounded-lg p-2 ${audioEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'} disabled:opacity-50`}>{audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}</button> : p.bot ? <span className="rounded-lg bg-violet-500/20 px-2 py-1 text-xs text-violet-200">AI</span> : <button type="button" onClick={toggleRemoteAudio} aria-label={remoteAudioEnabled ? 'كتم صوت اللاعب المقابل' : 'فتح صوت اللاعب المقابل'} className={`rounded-lg p-2 ${remoteAudioEnabled && remoteTalking ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}>{remoteAudioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}</button>}</div>)}</div>
        {state?.status === 'playing' && state.reconnectDeadline && <p className="rounded-xl bg-amber-500/15 p-3 text-center text-sm text-amber-100">انقطع اتصال اللاعب الآخر. ننتظر عودته لمدة 30 ثانية…</p>}
        {state?.status === 'waiting' && <p className="text-center text-amber-200">بانتظار انضمام اللاعب الثاني…</p>}
        {state?.status === 'playing' && state.question && !roundResult && <div><p className="mb-2 font-bold">السؤال {state.round + 1} من {state.total}: {state.question.question}</p><p className={`mb-3 text-center text-sm font-black ${state.turn === me ? 'text-emerald-300' : 'text-amber-300'}`}>{state.turn === me ? 'دورك — أجب عن سؤالك' : 'دور البوت — سيجيب عن سؤاله المختلف'}</p><div className={`grid gap-2 ${state.question.options.length > 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>{state.question.options.map((option, i) => <button key={i} disabled={!connected || state.turn !== me || pendingAnswer || self?.answered} onClick={() => answer(i)} className="min-h-16 rounded-xl bg-slate-700 p-2 text-sm disabled:opacity-50">{option}</button>)}</div>{(pendingAnswer || self?.answered) && <p className="mt-3 text-center text-sky-200">بانتظار انتقال الدور…</p>}</div>}
        {roundResult && state?.question && <div className="rounded-2xl border border-emerald-400/50 bg-emerald-500/15 p-5 text-center"><p className="text-sm font-bold text-emerald-200">نتيجة الدور</p>{roundResult.question && <p className="mt-2 text-sm text-sky-100">سؤال المنافس: {roundResult.question.question}</p>}<p className="mt-2 text-lg font-black">الإجابة الصحيحة</p><p className="mt-2 rounded-xl bg-white/10 p-3 font-bold text-emerald-100">{(roundResult.question || state.question).options[roundResult.answer]}</p><div className="mt-3 flex justify-center gap-4 text-sm">{roundResult.scores.map((player, index) => <span key={player.id}>{player.id === me ? 'أنت' : `اللاعب ${index + 1}`}: <b>{player.score}</b></span>)}</div></div>}
        {state?.status === 'abandoned' && <div className="rounded-2xl border border-rose-400/50 bg-rose-500/15 p-5 text-center"><p className="text-2xl font-black text-rose-200">انتهى التحدّي</p><p className="mt-3 text-sm leading-7 text-rose-100">انسحب اللاعب الآخر من الغرفة، لذلك توقفت المباراة ولن تبقى عالقاً في السؤال السابق.</p><button onClick={() => void closeModal()} className="mt-4 w-full rounded-xl bg-sky-600 p-3 font-black">العودة إلى قائمة الغرف</button></div>}
        {state?.status === 'closed' && <div className="rounded-2xl border border-rose-400/50 bg-rose-500/15 p-5 text-center"><p className="text-2xl font-black text-rose-200">أُغلقت الغرفة</p><p className="mt-3 text-sm leading-7 text-rose-100">غادر المضيف، وانتهى هذا التحدّي.</p><button onClick={() => void closeModal()} className="mt-4 w-full rounded-xl bg-sky-600 p-3 font-black">العودة إلى قائمة الغرف</button></div>}
        {state?.status === 'finished' && <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-5 text-center"><p className="text-2xl font-black text-amber-200">{state.tie ? 'انتهت المباراة بالتعادل!' : state.winner === me ? 'فزت بالتحدّي! 🎉' : 'فاز اللاعب الآخر'}</p><div className="mt-4 grid grid-cols-2 gap-3">{state.players.map((player, index) => <div key={player.id} className={`rounded-xl border p-3 ${player.id === state.winner ? 'border-amber-300 bg-amber-400/15' : 'border-white/15 bg-white/5'}`}><p className="text-xs text-slate-300">{player.id === me ? 'أنت' : `اللاعب ${index + 1}`}</p><p className="mt-1 text-2xl font-black">{player.score}</p></div>)}</div><button onClick={() => void closeModal()} className="mt-4 w-full rounded-xl bg-sky-600 p-3 font-black">العودة إلى الألعاب</button></div>}
      </div>}
      {error && <p className="mt-4 rounded-xl bg-red-500/20 p-3 text-sm text-red-100">{error}</p>}
    </div>{chatPanel}
  </div>;
};
