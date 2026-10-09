import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Clock, Crosshair, MessageCircle, Mic, MicOff, Music, Music2, Send, Sparkles, Trophy, Volume2, VolumeX, UserRound, X, XCircle, Zap } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { loadGuestSession } from '../services/guestPreviewService';
import { gameAudio } from '../utils/gameAudio';
import { millionaireAudio } from '../utils/millionaireAudio';
import { ScientificText } from './ScientificText';
import { TrueFalseAuthenticIcon } from './GameIcons';
const API = (import.meta.env.VITE_ONLINE_CHALLENGE_API_URL || '').replace(/\/$/, '');
export type OnlineChallengeGameType = 'millionaire' | 'millionaire_team' | 'true_false' | 'gibha_sah';
export type OnlineChallengeQuestion = { question: string; options: string[]; correctAnswer: number };
type Player = { id: string; team?: 'A' | 'B' | null; score: number; streak?: number; answered: boolean; connected: boolean; bot?: boolean; name?: string; avatar?: string; city?: string; school?: string; badge?: string; level?: number };
type State = { type: 'state'; gameType: OnlineChallengeGameType; status: 'waiting' | 'playing' | 'finished' | 'closed' | 'abandoned'; round: number; total: number; turn?: string | null; activeTeam?: 'A' | 'B' | null; question: { question: string; options: string[] } | null; gibhaRefillSlots?: number[]; gibhaRefillVersion?: number; players: Player[]; winner: string | null; tie: boolean; endedReason?: string | null; leftPlayerId?: string | null; reconnectDeadline?: number | null; teamLives?: { A: number; B: number }; teamScores?: { A: number; B: number }; questionDeadline?: number | null; discussionPhase?: 'thinking' | 'recommended' | null; lifelines?: { fifty: boolean; audience: boolean; phone: boolean } | null };
type RoundResult = { question?: { question: string; options: string[] }; answer?: number; selected?: number; correct?: boolean; answeredBy?: string; scores: Array<{ id: string; score: number }>; botSelected?: number; botCorrect?: boolean; stealAwarded?: boolean };
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
  const [turnSeconds, setTurnSeconds] = useState(25);
  const [lifelineResult, setLifelineResult] = useState<{ kind: 'fifty' | 'audience' | 'phone'; keep?: number[]; percentages?: number[]; suggested?: number } | null>(null);
  const [teamRecommendation, setTeamRecommendation] = useState<{ from: string; option: number } | null>(null);
  const [gibhaPowerResult, setGibhaPowerResult] = useState<{ kind: 'fifty' | 'freeze' | 'reveal'; keep?: number[]; seconds?: number; option?: number | null } | null>(null);
  const [usedGibhaPowers, setUsedGibhaPowers] = useState<Array<'fifty' | 'freeze' | 'reveal'>>([]);
  const [musicMuted, setMusicMuted] = useState(false);
  const [reactionUsed, setReactionUsed] = useState(false);
  const [rocketTargeting, setRocketTargeting] = useState(false);
  const [reactionFx, setReactionFx] = useState<{ kind: string; from: string; targetId?: string | null; nonce: number } | null>(null);
  const suppressCloseMessageRef = useRef(false);
  const meRef = useRef('');
  const socketRef = useRef<WebSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const roundRef = useRef<number | null>(null);
  const roomGameTypeRef = useRef<OnlineChallengeGameType>(gameType);
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
    if (!audioEnabled || !connected) return;
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
    gameAudio.stopExternal('millionaire-thinking');
    gameAudio.stopExternal('millionaire-prize');
    gameAudio.stopExternal('millionaire-correct');
    gameAudio.stopExternal('millionaire-wrong');
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
      if (payload.type === 'team_recommendation' && Number.isInteger(payload.option)) setTeamRecommendation({ from: payload.from, option: payload.option });
      if (payload.type === 'lifeline_result') setLifelineResult(payload);
      if (payload.type === 'gibha_power_result') {
        setGibhaPowerResult(payload);
        setUsedGibhaPowers(previous => previous.includes(payload.kind) ? previous : [...previous, payload.kind]);
        if (payload.kind === 'freeze') setTurnSeconds(value => value + Number(payload.seconds || 5));
      }
      if (payload.type === 'chat' && typeof payload.text === 'string') {
        setChatMessages(previous => [...previous, { id: `${payload.from}-${payload.sentAt}-${Math.random()}`, from: payload.from, text: payload.text, sentAt: payload.sentAt || Date.now() }]);
        if (payload.from !== meRef.current) {
          setUnreadChat(previous => previous + 1);
          setChatOpen(true);
        }
      }
      if (payload.type === 'reaction') {
        setReactionFx({ kind: payload.kind, from: payload.from, targetId: payload.targetId, nonce: Date.now() });
        if (payload.kind === 'rocket') { gameAudio.playClick(1050); window.setTimeout(() => gameAudio.playGibhaWrong(), 650); }
        else gameAudio.playClick(payload.kind === 'angry' ? 180 : 620);
        window.setTimeout(() => setReactionFx(null), payload.kind === 'rocket' ? 1700 : 1100);
      }
      if (payload.type === 'state') {
        if (payload.gameType === 'millionaire' || payload.gameType === 'millionaire_team' || payload.gameType === 'true_false' || payload.gameType === 'gibha_sah') {
          roomGameTypeRef.current = payload.gameType;
        }
        const remaining = resultUntilRef.current - Date.now();
        if (remaining > 0) {
          if (stateTimerRef.current) clearTimeout(stateTimerRef.current);
          stateTimerRef.current = setTimeout(() => applyState(payload), remaining);
        } else {
          applyState(payload);
        }
      }
      if (payload.type === 'round_result') {
        resultUntilRef.current = Date.now() + (roomGameTypeRef.current === 'millionaire' || roomGameTypeRef.current === 'millionaire_team' ? 5000 : 3000);
        if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
        setResultRevealed(false);
        setRoundResult({ question: payload.question, answer: payload.answer, selected: payload.selected, correct: payload.correct ?? payload.selected === payload.answer, answeredBy: payload.answeredBy, scores: payload.scores || [], botSelected: payload.botSelected, botCorrect: payload.botCorrect, stealAwarded: payload.stealAwarded });
        if (roomGameTypeRef.current === 'millionaire' || roomGameTypeRef.current === 'millionaire_team') {
          gameAudio.stopExternal('millionaire-thinking');
          gameAudio.playMillionaireLockIn();
          revealTimerRef.current = setTimeout(() => {
            setResultRevealed(true);
            if (payload.selected === payload.answer) gameAudio.playExternal('millionaire-correct', millionaireAudio.correct);
            else gameAudio.playExternal('millionaire-wrong', millionaireAudio.wrong);
          }, 850);
        } else {
          setResultRevealed(true);
          const correct = payload.selected === payload.answer;
          if (roomGameTypeRef.current === 'true_false') {
            if (correct) gameAudio.playTrueFalseCorrect();
            else { gameAudio.playTrueFalseWrong(); gameAudio.playGameLoss(); }
          } else if (roomGameTypeRef.current === 'gibha_sah') {
            if (correct) gameAudio.playCardSolved();
            else gameAudio.playGibhaWrong();
          }
        }
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
    if ((state?.gameType || gameType) === 'gibha_sah') gameAudio.playCardSelect();
    socketRef.current.send(JSON.stringify({ type: 'answer', option }));
  }

  function sendChat() {
    const text = chatInput.trim().slice(0, 300);
    if (!text || !connected) return;
    sendSocket({ type: 'chat', text });
    setChatInput('');
  }

  function useLifeline(kind: 'fifty' | 'audience' | 'phone') {
    if (!myTurn || state?.lifelines?.[kind] || roundResult) return;
    sendSocket({ type: 'lifeline', kind });
  }

  function useGibhaPower(kind: 'fifty' | 'freeze' | 'reveal') {
    if (!myTurn || roundResult || usedGibhaPowers.includes(kind)) return;
    setGibhaPowerResult(null);
    sendSocket({ type: 'gibha_power', kind });
  }

  function sendReaction(kind: 'clap' | 'laugh' | 'think' | 'angry' | 'rocket', targetId?: string) {
    if (reactionUsed || !connected) return;
    if (kind === 'rocket' && !targetId) { setRocketTargeting(true); return; }
    sendSocket({ type: 'reaction', kind, targetId });
    setReactionUsed(true);
    setRocketTargeting(false);
  }

  function toggleMusic() {
    const next = !musicMuted;
    setMusicMuted(next);
    gameAudio.setMuted(next);
    if (!next && isGibhaSah && state?.status === 'playing') gameAudio.playGameSessionTheme();
  }

  async function create() {
    setError(''); setBusy(true);
    try {
      const optionPool = questions.flatMap(question => question.options).filter((option, index, all) => option.trim() && all.indexOf(option) === index);
      const selected = questions.slice(0, gameType === 'gibha_sah' ? Math.max(24, questions.length) : gameType === 'millionaire_team' ? 20 : gameType === 'millionaire' ? 11 : 10).map((q, questionIndex) => {
        if (gameType !== 'gibha_sah') return { question: q.question, options: q.options, correctAnswer: q.correctAnswer };
        const correctOption = q.options[q.correctAnswer];
        const options = q.options.filter((option, index, all) => option.trim() && all.indexOf(option) === index).slice(0, 6);
        if (correctOption && !options.includes(correctOption)) options[options.length - 1] = correctOption;
        const rotatedPool = optionPool.slice(questionIndex).concat(optionPool.slice(0, questionIndex));
        for (const candidate of rotatedPool) {
          if (options.length >= 6) break;
          if (!options.includes(candidate)) options.push(candidate);
        }
        return { question: q.question, options, correctAnswer: Math.max(0, options.indexOf(correctOption)) };
      });
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
  const myTeam = self?.team || 'A';
  const teammate = state?.players.find(p => p.id !== me && p.team === myTeam);
  const enemyTeam = state?.players.filter(p => p.team && p.team !== myTeam) || [];
  const teamAPlayers = state?.players.filter(player => player.team === 'A') || [];
  const teamBPlayers = state?.players.filter(player => player.team === 'B') || [];
  // A room selected in the challenge hub is joined without local lesson config.
  // Its server state, not the hub's default game type, determines the game screen.
  const isMillionaireTeam = (state?.gameType || gameType) === 'millionaire_team';
  const isMillionaire = (state?.gameType || gameType) === 'millionaire' || isMillionaireTeam;
  const chatPartner = isMillionaireTeam ? teammate : opponent;
  const isTrueFalse = (state?.gameType || gameType) === 'true_false';
  const isGibhaSah = (state?.gameType || gameType) === 'gibha_sah';
  const millionairePrizes = ['250', '500', '1 000', '5 000', '10 000', '25 000', '50 000', '100 000', '250 000', '500 000', '1 000 000'];
  const displayedQuestion = roundResult?.question || state?.question;
  const myTurn = state?.turn === me;
  const myTeamActive = isMillionaireTeam && state?.activeTeam === myTeam;
  const canRecommend = myTeamActive && !myTurn && state?.status === 'playing';
  const activeCaptain = state?.players.find(player => player.id === state.turn);
  const answeredByMe = roundResult?.answeredBy === me;
  const turnIndicators = <div className="grid grid-cols-2 gap-3">
    {[
      { label: 'أنت', player: self, active: myTurn },
      { label: opponent?.name || 'المنافس', player: opponent, active: Boolean(opponent && !myTurn) },
    ].map(({ label, player, active }) => <div key={label} className={`relative rounded-2xl border px-3 pb-3 pt-9 text-center transition-all duration-500 ${active ? 'border-amber-300 bg-amber-400/15 shadow-[0_0_24px_rgba(250,204,21,.4)]' : 'border-cyan-400/20 bg-white/5'}`}>
      <div className={`pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 ${active ? 'opacity-100' : 'opacity-20 grayscale'}`}><span className={`block rotate-180 text-3xl ${active ? 'animate-pulse drop-shadow-[0_0_12px_rgba(250,204,21,1)]' : ''}`}>💡</span></div>
      <strong className="block truncate text-sm">{label}</strong><small className={active ? 'font-black text-amber-200' : 'text-cyan-200'}>{active ? 'الدور الآن' : `${player?.score || 0} نقطة`}</small>
    </div>)}
  </div>;
  useEffect(() => {
    const themed = (isTrueFalse || isGibhaSah) && room && state?.status !== 'finished';
    if (themed) gameAudio.playGameSessionTheme();
    else gameAudio.stopGameSessionTheme();
    return () => gameAudio.stopGameSessionTheme();
  }, [isTrueFalse, isGibhaSah, room, state?.status]);

  useEffect(() => {
    setTurnSeconds(isMillionaireTeam ? Math.max(0, Math.ceil(((state?.questionDeadline || Date.now() + 60000) - Date.now()) / 1000)) : isTrueFalse ? 20 : 25);
    if (!connected || state?.status !== 'playing' || roundResult) return;
    const timer = window.setInterval(() => setTurnSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [isTrueFalse, isMillionaireTeam, connected, state?.status, state?.round, state?.turn, state?.questionDeadline, roundResult]);

  useEffect(() => {
    if (isGibhaSah) gameAudio.setGameSessionThemeRate(turnSeconds <= 5 ? 1.28 : 1);
    return () => gameAudio.setGameSessionThemeRate(1);
  }, [isGibhaSah, turnSeconds]);

  useEffect(() => { setLifelineResult(null); setTeamRecommendation(null); setGibhaPowerResult(null); }, [state?.round]);
  useEffect(() => { setReactionUsed(false); setRocketTargeting(false); }, [state?.round, state?.turn]);

  useEffect(() => {
    if ((isTrueFalse || isGibhaSah) && state?.status === 'finished' && state.winner === me && !roundResult) gameAudio.playVictoryFanfare();
  }, [isTrueFalse, isGibhaSah, state?.status, state?.winner, me, roundResult]);
  useEffect(() => {
    // Every player receives the same authoritative room state, so the game music
    // must follow that shared state instead of running only on the captain's client.
    const active = isMillionaire && connected && state?.status === 'playing' && !roundResult;
    if (active) gameAudio.playExternal('millionaire-thinking', millionaireAudio.thinking, 0.65, true);
    else gameAudio.stopExternal('millionaire-thinking');
    return () => gameAudio.stopExternal('millionaire-thinking');
  }, [isMillionaire, connected, state?.status, state?.round, roundResult]);

  useEffect(() => {
    const won = isMillionaireTeam ? state?.winner === self?.team : state?.winner === me;
    if (isMillionaire && state?.status === 'finished' && won && !roundResult) {
      gameAudio.playExternal('millionaire-prize', millionaireAudio.prize, 0.8);
    }
    return () => gameAudio.stopExternal('millionaire-prize');
  }, [isMillionaire, isMillionaireTeam, state?.status, state?.winner, self?.team, me, roundResult]);
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
        <div className="flex items-center gap-2">{chatPartner?.avatar ? <img src={chatPartner.avatar} alt={chatPartner.name || 'الزميل'} className="h-10 w-10 rounded-full object-cover" /> : <UserRound className="h-8 w-8 text-cyan-300" />}<div><strong>{chatPartner?.name || (isMillionaireTeam ? 'زميل الفريق' : 'المنافس')}</strong><small className="block text-emerald-300">{isMillionaireTeam ? 'محادثة الفريق الخاصة' : 'متصل الآن'}</small></div></div>
        <button onClick={() => { setChatOpen(false); setUnreadChat(0); }} className="rounded-full bg-white/10 p-2"><X className="h-5 w-5" /></button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">{chatMessages.length === 0 && <p className="mt-8 text-center text-sm text-slate-400">{isMillionaireTeam ? 'ابدأ التشاور مع زميل فريقك' : 'ابدأ المحادثة مع منافسك'}</p>}{chatMessages.map(message => <div key={message.id} className={`flex ${message.from === me ? 'justify-start' : 'justify-end'}`}><div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm ${message.from === me ? 'bg-cyan-600' : 'bg-slate-700'}`}>{message.text}</div></div>)}</div>
      <div className="flex gap-2 border-t border-white/10 p-3"><input value={chatInput} onChange={event => setChatInput(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') sendChat(); }} maxLength={300} placeholder="اكتب رسالة…" className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-2 outline-none"/><button onClick={sendChat} disabled={!chatInput.trim()} className="rounded-xl bg-cyan-500 p-3 disabled:opacity-40"><Send className="h-5 w-5" /></button></div>
    </div>
  </div>;

  const opponentControls = <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-black/15 p-3">
    <div className="flex min-w-0 items-center gap-2">{opponent?.avatar ? <img src={opponent.avatar} alt={opponent.name || 'المنافس'} className="h-11 w-11 rounded-full border-2 border-cyan-400 object-cover" /> : <div className="grid h-11 w-11 place-items-center rounded-full border-2 border-cyan-400 bg-slate-800"><UserRound className="h-6 w-6" /></div>}<div className="min-w-0"><strong className="block truncate text-sm">{opponent?.name || 'بانتظار المنافس…'}</strong><small className="text-emerald-300">{opponent ? opponent.connected ? 'متصل' : 'يفكر…' : 'الغرفة مفتوحة'}</small></div></div>
    <div className="flex gap-1.5"><button onClick={() => { setChatOpen(true); setUnreadChat(0); }} aria-label="المحادثة" className="relative rounded-full border border-cyan-400/50 bg-cyan-500/15 p-2.5 text-cyan-300"><MessageCircle className="h-5 w-5" />{unreadChat > 0 && <span className="absolute -left-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black">{unreadChat}</span>}</button><button type="button" disabled={audioBusy || !opponent || opponent.bot} onClick={() => void toggleMicrophone()} className={`rounded-full border p-2.5 ${audioEnabled ? 'border-emerald-300 bg-emerald-500' : 'border-white/20 bg-white/5'} disabled:opacity-40`}>{audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}</button><button type="button" disabled={!opponent || opponent.bot} onClick={toggleRemoteAudio} className="rounded-full border border-white/20 bg-white/5 p-2.5 disabled:opacity-40">{remoteAudioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}</button></div>
  </div>;

  const waitingOrReconnect = <>{state?.status === 'waiting' && <div className="rounded-2xl border border-cyan-400/30 bg-white/5 p-5 text-center"><p>{isGibhaSah ? 'بانتظار اكتمال أربعة لاعبين…' : 'بانتظار اللاعب الثاني…'}</p><p className="mt-3">رمز الغرفة: <b className="select-all text-xl text-amber-300">{room}</b></p><button onClick={() => void navigator.clipboard.writeText(room)} className="mt-3 rounded-xl bg-sky-700 px-4 py-2">نسخ الرمز</button></div>}{!connected && state?.status !== 'finished' && <button disabled={busy} onClick={reconnect} className="w-full rounded-xl bg-amber-600 p-3 font-bold">إعادة الاتصال بالغرفة</button>}{state?.reconnectDeadline && <p className="rounded-xl bg-amber-500/15 p-3 text-center text-sm text-amber-200">انقطع اتصال المنافس؛ ننتظر عودته ثم تستمر المباراة.</p>}</>;

  const finalResult = state?.status === 'finished' && !roundResult && <div className="rounded-3xl border border-amber-400/50 bg-amber-500/10 p-8 text-center"><Trophy className="mx-auto h-14 w-14 text-amber-300"/><p className="mt-3 text-2xl font-black">{state.tie ? 'تعادلتم!' : state.winner === me ? 'أنت الفائز! 🎉' : `${opponent?.name || 'المنافس'} فاز`}</p><p className="mt-2 text-sm">إجابات صحيحة: أنت {self?.score || 0} — المنافس {opponent?.score || 0}</p><button onClick={() => void closeModal()} className="mt-5 rounded-xl bg-blue-600 px-8 py-3 font-black">العودة</button></div>;
  const gibhaFinalResult = state?.status === 'finished' && !roundResult && <div className="rounded-3xl border border-amber-400/50 bg-amber-500/10 p-6 text-center"><Trophy className="mx-auto h-14 w-14 text-amber-300"/><p className="mt-3 text-2xl font-black">{state.tie ? 'تعادل المتصدرون!' : state.winner === me ? 'فزت بالتحدي! 🎉' : `فاز ${state.players.find(player => player.id === state.winner)?.name || 'أحد اللاعبين'}`}</p><div className="mt-5 grid grid-cols-2 gap-3">{state.players.map((player, index) => <div key={player.id} className={`rounded-2xl border p-3 ${player.id === state.winner ? 'border-amber-300 bg-amber-400/20' : 'border-white/10 bg-white/5'}`}><strong className="block truncate text-sm">{player.id === me ? 'أنت' : player.name || `اللاعب ${index + 1}`}</strong><span className="text-xl font-black text-cyan-200">{player.score}</span></div>)}</div><button onClick={() => void closeModal()} className="mt-5 rounded-xl bg-blue-600 px-8 py-3 font-black">العودة</button></div>;

  const renderGibhaPlayer = (player: Player | undefined, seat: number) => {
    const active = Boolean(player && state?.turn === player.id && state.status === 'playing' && !roundResult);
    const activeMe = active && player?.id === me;
    const label = player?.id === me ? 'أنت' : player?.name || `اللاعب ${seat + 1}`;
    return <div key={player?.id || `seat-${seat}`} onClick={() => rocketTargeting && player && player.id !== me && sendReaction('rocket', player.id)} className={`relative min-w-0 rounded-2xl border px-2 pb-2 pt-7 text-center transition-all duration-500 ${rocketTargeting && player?.id !== me ? 'cursor-crosshair ring-2 ring-rose-400' : ''} ${activeMe ? 'border-emerald-200 bg-emerald-400/20 shadow-[0_0_45px_rgba(52,211,153,.95)]' : active ? 'border-yellow-200 bg-yellow-400/20 shadow-[0_0_42px_rgba(250,204,21,.9)]' : 'border-cyan-400/25 bg-cyan-500/5'} ${reactionFx?.targetId === player?.id && reactionFx.kind === 'rocket' ? 'gibha-rocket-target' : ''}`}>
      <div className={`pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 transition-all duration-500 ${active ? 'opacity-100' : 'opacity-15 grayscale'}`}><span className={`relative z-10 block rotate-180 text-4xl ${activeMe ? 'animate-pulse drop-shadow-[0_0_26px_rgba(52,211,153,1)] [filter:hue-rotate(70deg)_brightness(1.5)]' : active ? 'animate-pulse drop-shadow-[0_0_25px_rgba(250,204,21,1)] brightness-150' : ''}`}>💡</span>{active && <span className={`absolute left-1/2 top-8 h-16 w-24 -translate-x-1/2 bg-gradient-to-b to-transparent blur-[2px] [clip-path:polygon(42%_0,58%_0,100%_100%,0_100%)] ${activeMe ? 'from-emerald-100/90' : 'from-yellow-100/85'}`}/>}</div>
      <div className="relative z-10 mx-auto h-11 w-11 overflow-hidden rounded-full border-2 border-cyan-300 bg-slate-800">{player?.avatar ? <img src={player.avatar} alt={label} className="h-full w-full object-cover"/> : <UserRound className="m-2 h-6 w-6 text-cyan-200"/>}</div>
      <strong className="relative z-10 mt-1 block truncate text-xs">{label}</strong><small className="relative z-10 text-cyan-200">{player ? `${player.score} نقطة` : 'بانتظار لاعب'}{(player?.streak || 0) >= 3 && <b className="mr-1 text-orange-300">🔥 ×2</b>}</small>{player && player.id !== me && <button type="button" onClick={event => { event.stopPropagation(); toggleRemoteAudio(); }} className="absolute bottom-1 left-1 z-20 rounded-full bg-black/35 p-1" aria-label="كتم صوت اللاعب">{remoteAudioEnabled ? <Volume2 className="h-3.5 w-3.5"/> : <VolumeX className="h-3.5 w-3.5"/>}</button>}{active && <small className={`relative z-10 block font-black ${activeMe ? 'text-emerald-200' : 'text-amber-200'}`}>{player?.bot ? 'يفكر' : 'دوره الآن'}{player?.bot && <span className="gibha-thinking-dots mr-1">•••</span>}</small>}
    </div>;
  };

  if (room && state && isTrueFalse) return <div className="fixed inset-0 z-[90] overflow-y-auto bg-black/90 p-2 text-white sm:p-5" dir="rtl">
    <audio ref={remoteAudioRef} autoPlay playsInline />
    <div className="relative mx-auto min-h-full w-full max-w-lg overflow-hidden rounded-[2rem] border border-cyan-300/30 bg-gradient-to-b from-[#13264a] via-[#0b1731] to-[#050b1d] shadow-[0_0_40px_rgba(34,211,238,.25)]">
      <header className="flex items-center justify-between border-b border-white/10 p-4"><div className="flex items-center gap-2.5"><div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-300 to-rose-400 p-1"><div className="flex h-full w-full items-center justify-center rounded-xl bg-[#08152e]"><TrueFalseAuthenticIcon className="h-12 w-12" /></div></div><p className="text-xs text-slate-300">{lessonTitle}</p></div><button onClick={() => void closeModal()} className="rounded-xl border border-white/10 bg-white/5 p-2"><X className="h-5 w-5" /></button></header>
      {opponentControls}
      <main className="space-y-4 p-4">{waitingOrReconnect}
        {state.status === 'playing' && displayedQuestion && <>
          {turnIndicators}
          <div className="flex items-center justify-between rounded-2xl border border-cyan-300/20 bg-[#07142d]/90 px-3 py-2.5 text-xs"><span className="font-black text-cyan-400">السؤال {Math.min(state.round + 1, state.total)} من {state.total}</span><span className="flex items-center gap-1 text-cyan-300"><Sparkles className="h-3 w-3" />أنت {self?.score || 0} — المنافس {opponent?.score || 0}</span><span className={`flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono ${turnSeconds <= 5 ? 'border-rose-400 bg-rose-500/20 text-rose-300' : 'border-white/10 bg-white/5'}`}><Clock className="h-3 w-3" />{turnSeconds}ث</span></div>
          <div className="rounded-3xl border border-cyan-300/30 bg-gradient-to-br from-[#18345b] via-[#102653] to-[#0a1735] p-6 text-center text-lg font-black leading-9"><p className="mb-2 text-xs text-cyan-300">{roundResult ? answeredByMe ? 'إجابتك — المنافس يشاهد' : `إجابة ${opponent?.name || 'المنافس'} — أنت تشاهد` : myTurn ? 'دورك الآن' : `${opponent?.name || 'المنافس'} يفكّر…`}</p><ScientificText value={displayedQuestion.question} /></div>
          <div className="grid grid-cols-2 gap-3">{displayedQuestion.options.slice(0, 2).map((option, index) => { const chosen = roundResult?.selected === index; const correct = roundResult?.answer === index; const base = index === 0 ? 'from-emerald-500 to-teal-600 border-emerald-300' : 'from-rose-500 to-red-700 border-rose-300'; const result = roundResult ? correct ? 'ring-4 ring-emerald-300 brightness-125' : chosen ? 'ring-4 ring-rose-300 opacity-90' : 'opacity-40' : ''; return <button key={index} disabled={!connected || !myTurn || pendingAnswer || Boolean(roundResult)} onClick={() => answer(index)} className={`min-h-36 rounded-[1.75rem] border-2 bg-gradient-to-b p-4 text-xl font-black shadow-xl transition ${base} ${result} disabled:cursor-default`}><span className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-white/15">{index === 0 ? <CheckCircle2 className="h-10 w-10"/> : <XCircle className="h-10 w-10"/>}</span><ScientificText value={option} />{chosen && <small className="mt-2 block">{answeredByMe ? 'اختيارك' : 'اختيار المنافس'}</small>}</button>; })}</div>
          {roundResult && <div className={`rounded-2xl border p-4 text-center font-black ${roundResult.selected === roundResult.answer ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300' : 'border-rose-400 bg-rose-500/15 text-rose-200'}`}>{roundResult.selected === roundResult.answer ? 'إجابة صحيحة! ✓' : 'إجابة خاطئة ✗'}<p className="mt-1 text-xs text-slate-200">الدور التالي بعد عرض النتيجة</p></div>}
        </>}{finalResult}</main>{error && <p className="m-4 rounded-xl bg-red-500/20 p-3 text-sm text-red-100">{error}</p>}
    </div>{chatPanel}
  </div>;

  if (room && state && isGibhaSah) return <div className="fixed inset-0 z-[90] overflow-hidden bg-[#020818] text-white" dir="rtl">
    <audio ref={remoteAudioRef} autoPlay playsInline />
    <div className="relative mx-auto flex h-[100dvh] w-full max-w-3xl flex-col overflow-hidden border-x-2 border-cyan-500/40 bg-[radial-gradient(circle_at_center,rgba(15,67,113,.42),rgba(2,8,24,.98)_70%),linear-gradient(90deg,rgba(34,211,238,.07)_1px,transparent_1px),linear-gradient(rgba(34,211,238,.07)_1px,transparent_1px)] bg-[size:auto,32px_32px,32px_32px] shadow-[0_0_45px_rgba(6,182,212,.28)]">
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-cyan-400/20 px-3"><div className="min-w-0"><b className="block truncate text-sm text-cyan-200">جبتها صح — تحدّي 4 لاعبين</b><p className="truncate text-[10px] text-slate-400">{lessonTitle}</p></div><button onClick={() => void closeModal()} className="rounded-full bg-white/5 p-1.5"><X className="h-5 w-5" /></button></header>
      <main className="flex min-h-0 flex-1 flex-col gap-2 p-2">{waitingOrReconnect}
        {state.status === 'playing' && displayedQuestion && <>
          <div className="grid shrink-0 grid-cols-2 gap-2">{state.players.slice(0, 2).map((player, index) => renderGibhaPlayer(player, index))}</div>
          <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="flex gap-1"><button onClick={() => { setChatOpen(true); setUnreadChat(0); }} className="relative rounded-full bg-cyan-500/15 p-2 text-cyan-200"><MessageCircle className="h-4 w-4"/>{unreadChat > 0 && <b className="absolute -left-1 -top-1 rounded-full bg-red-500 px-1 text-[9px]">{unreadChat}</b>}</button><button disabled={audioBusy} onClick={() => void toggleMicrophone()} className={`rounded-full p-2 ${audioEnabled ? 'bg-emerald-500' : 'bg-white/10'}`}>{audioEnabled ? <Mic className="h-4 w-4"/> : <MicOff className="h-4 w-4"/>}</button><button onClick={toggleMusic} className="rounded-full bg-white/10 p-2">{musicMuted ? <Music className="h-4 w-4 text-rose-300"/> : <Music2 className="h-4 w-4 text-amber-200"/>}</button></div>
            <div className={`grid h-11 w-11 place-items-center rounded-full border-2 font-mono text-lg font-black ${turnSeconds <= 5 ? 'animate-pulse border-rose-400 text-rose-300' : 'border-emerald-300 text-emerald-200'}`}>{String(turnSeconds).padStart(2, '0')}</div>
            <div className="flex justify-end gap-1">{([{kind:'clap',icon:'👏'},{kind:'laugh',icon:'😂'},{kind:'think',icon:'🤔'},{kind:'angry',icon:'😡'},{kind:'rocket',icon:'🚀'}] as const).map(item => <button key={item.kind} disabled={reactionUsed} onClick={() => sendReaction(item.kind)} className={`rounded-full p-1 text-sm ${rocketTargeting && item.kind === 'rocket' ? 'bg-rose-500 ring-2 ring-white' : 'bg-white/5'} disabled:opacity-30`}>{item.icon}</button>)}</div>
          </div>
          <div className="h-1.5 shrink-0 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full transition-all duration-1000 ${turnSeconds <= 5 ? 'bg-rose-500' : turnSeconds <= 12 ? 'bg-amber-400' : 'bg-emerald-400'}`} style={{ width: `${Math.max(0, Math.min(100, (turnSeconds / 25) * 100))}%` }}/></div>
          <div className="flex min-h-16 shrink-0 items-center justify-center rounded-2xl border-2 border-cyan-500/40 bg-[#07142d]/90 px-4 py-2 text-center text-base font-black leading-6 sm:text-xl"><ScientificText value={displayedQuestion.question} /></div>
          <div key={`gibha-cards-${state.round}-${state.gibhaRefillVersion || 0}`} className="grid min-h-0 flex-1 grid-cols-2 grid-rows-3 gap-2">{displayedQuestion.options.slice(0, 6).map((option, index) => {
            const chosen = roundResult?.selected === index;
            const correct = roundResult?.correct === true && roundResult?.answer === index;
            const hidden = gibhaPowerResult?.kind === 'fifty' && !gibhaPowerResult.keep?.includes(index);
            const refillOrder = state.gibhaRefillSlots?.indexOf(index) ?? -1;
            const entrance = refillOrder === 0 ? 'gibha-card-enter-right' : refillOrder === 1 ? 'gibha-card-enter-left' : refillOrder === 2 ? 'gibha-card-enter-bottom' : '';
            const style = correct ? 'gibha-correct-pulse border-emerald-300 bg-emerald-500/30 shadow-[0_0_22px_rgba(16,185,129,.55)]' : chosen && roundResult?.correct === false ? 'gibha-wrong-shake border-rose-400 bg-rose-500/20' : roundResult ? 'border-cyan-900/50 bg-[#0a1833] opacity-55' : 'border-amber-400/45 bg-gradient-to-br from-[#31415e] to-[#17233a] shadow-[inset_0_-5px_0_rgba(0,0,0,.25)] hover:border-cyan-300';
            if (!option) return <div key={`empty-${index}`} className="min-h-0 rounded-2xl border-2 border-dashed border-cyan-900/30 bg-black/10"/>;
            return <button key={`${state.round}-${index}-${option}`} hidden={hidden} disabled={!connected || !myTurn || pendingAnswer || Boolean(roundResult)} onClick={() => answer(index)} className={`${entrance} min-h-0 rounded-2xl border-2 px-2 py-1 text-xs font-bold leading-5 transition sm:text-sm ${style} disabled:cursor-default`}><ScientificText value={option} />{chosen && <small className="mt-1 block">{roundResult?.correct ? 'صحيحة ✓' : 'اختيار غير صحيح'}</small>}</button>;
          })}</div>
          {gibhaPowerResult?.kind === 'reveal' && <div className="shrink-0 rounded-xl bg-amber-500/15 px-3 py-1 text-center text-xs text-amber-100">{Number.isInteger(gibhaPowerResult.option) ? `آخر اختيار لمنافس: البطاقة ${(gibhaPowerResult.option || 0) + 1}` : 'لا يوجد اختيار سابق للمنافس بعد'}</div>}
          {roundResult && <div className={`shrink-0 rounded-xl border px-3 py-1 text-center text-xs font-black ${roundResult.correct ? 'border-emerald-400 bg-emerald-500/15 text-emerald-200' : 'border-rose-500/50 bg-rose-500/10 text-rose-200'}`}>{roundResult.correct ? 'جبتها صح! ✨ البطاقة خرجت من اللوحة' : 'ليست صحيحة — لا نكشف الحل وينتقل الدور'}</div>}
          <div className="grid shrink-0 grid-cols-2 gap-2">{[2, 3].map(index => renderGibhaPlayer(state.players[index], index))}</div>
        </>}{gibhaFinalResult}</main>{rocketTargeting && <div className="pointer-events-none absolute inset-x-3 top-1/2 z-40 flex items-center justify-center"><span className="rounded-full bg-rose-600/95 px-4 py-2 text-sm font-black shadow-xl"><Crosshair className="ml-1 inline h-4 w-4"/>اختر اللاعب الذي تريد قصفه</span></div>}{reactionFx && reactionFx.kind !== 'rocket' && <div key={reactionFx.nonce} className="gibha-reaction-pop pointer-events-none absolute inset-0 z-50 grid place-items-center text-7xl">{{clap:'👏',laugh:'😂',think:'🤔',angry:'😡'}[reactionFx.kind]}</div>}{reactionFx?.kind === 'rocket' && <div key={reactionFx.nonce} className="gibha-rocket-flight pointer-events-none absolute z-50 text-6xl">🚀</div>}{error && <p className="absolute bottom-2 left-2 right-2 z-30 rounded-xl bg-red-500/90 p-2 text-center text-xs text-white">{error}</p>}
    </div>{chatPanel}
  </div>;

  if (room && state && isMillionaire) return <div className="fixed inset-0 z-[90] overflow-y-auto bg-slate-950/95 p-2 text-white sm:p-5" dir="rtl">
    <audio ref={remoteAudioRef} autoPlay playsInline />
    <div className="mx-auto min-h-full w-full max-w-2xl overflow-hidden rounded-[2rem] border-2 border-[#2049a4] bg-[radial-gradient(circle_at_center,#0b1b51,#03091e_72%)] shadow-[0_0_40px_rgba(32,73,164,.6)]">
      <header className="flex items-center justify-between border-b border-blue-500/30 bg-[#03091e] p-4">
        <div className="flex items-center gap-3"><div className="rounded-full border-2 border-amber-400 p-2 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,.4)]"><Trophy className="h-6 w-6" /></div><div>{isMillionaireTeam ? <p className="text-xs text-slate-300">{lessonTitle}</p> : <><h2 className="font-black text-amber-300">من سيربح المليون؟</h2><p className="text-xs text-slate-300">{lessonTitle}</p></>}</div></div>
        <button onClick={() => void closeModal()} aria-label="الخروج من التحدي" className="rounded-full bg-blue-950 p-2"><X className="h-6 w-6" /></button>
      </header>
      {isMillionaireTeam ? <div className="relative grid grid-cols-[1fr_auto_1fr] items-end gap-2 overflow-hidden border-b border-blue-400/20 bg-blue-950/35 px-3 pb-3 pt-16 text-center">
        {(['A', 'B'] as const).map((team, index) => <div key={`lamp-${team}`} aria-label={`مصباح فريق ${team}`} className={`pointer-events-none absolute top-1 z-10 flex w-1/2 justify-center transition-all duration-700 ${index === 0 ? 'right-0' : 'left-0'} ${state.activeTeam === team ? 'opacity-100' : 'opacity-25 grayscale'}`}>
          <div className="relative">
            <span className={`relative z-10 block rotate-180 text-4xl transition-transform duration-500 ${state.activeTeam === team ? 'scale-110 drop-shadow-[0_0_14px_rgba(250,204,21,1)]' : 'scale-90'}`}>💡</span>
            {state.activeTeam === team && <><span className="absolute left-1/2 top-8 h-20 w-24 -translate-x-1/2 bg-gradient-to-b from-yellow-200/55 via-amber-300/25 to-transparent [clip-path:polygon(43%_0,57%_0,100%_100%,0_100%)] animate-pulse"/><span className="absolute left-1/2 top-3 h-8 w-8 -translate-x-1/2 rounded-full bg-yellow-200/60 blur-lg"/></>}
          </div>
        </div>)}
        <div className={`relative z-20 rounded-2xl border p-2 transition-all duration-500 ${state.activeTeam === 'A' ? 'border-amber-300 bg-amber-400/15 shadow-[0_0_24px_rgba(250,204,21,.45)]' : 'border-cyan-400/30 bg-cyan-500/10'}`}><div className="flex justify-center -space-x-2 space-x-reverse">{[0, 1].map(index => { const player = teamAPlayers[index]; return player?.avatar ? <img key={player.id} src={player.avatar} className="h-10 w-10 rounded-full border-2 border-cyan-300 object-cover" alt={player.name || 'لاعب فريق A'}/> : <span key={player?.id || index} className="grid h-10 w-10 place-items-center rounded-full border-2 border-cyan-300 bg-slate-800"><UserRound className="h-5 w-5"/></span>; })}</div><b className="mt-1 block truncate text-xs">فريق A · {teamAPlayers.map(player => player.id === me ? 'أنت' : player.name || 'لاعب').join(' + ') || 'بانتظار اللاعبين'}</b>{state.activeTeam === 'A' && <small className="mt-1 block font-black text-amber-200">الدور الآن</small>}</div>
        <div className="rounded-full border border-amber-400/50 bg-black/30 px-3 py-2 text-xs font-black text-amber-300">VS</div>
        <div className={`relative z-20 rounded-2xl border p-2 transition-all duration-500 ${state.activeTeam === 'B' ? 'border-amber-300 bg-amber-400/15 shadow-[0_0_24px_rgba(250,204,21,.45)]' : 'border-rose-400/30 bg-rose-500/10'}`}><div className="flex justify-center -space-x-2 space-x-reverse">{[0, 1].map(index => { const player = teamBPlayers[index]; return player?.avatar ? <img key={player.id} src={player.avatar} className="h-10 w-10 rounded-full border-2 border-rose-300 object-cover" alt={player.name || 'لاعب فريق B'}/> : <span key={player?.id || index} className="grid h-10 w-10 place-items-center rounded-full border-2 border-rose-300 bg-slate-800"><UserRound className="h-5 w-5"/></span>; })}</div><b className="mt-1 block truncate text-xs">فريق B · {teamBPlayers.map(player => player.id === me ? 'أنت' : player.name || 'لاعب').join(' + ') || 'بانتظار اللاعبين'}</b>{state.activeTeam === 'B' && <small className="mt-1 block font-black text-amber-200">الدور الآن</small>}</div>
        <div className="col-span-3 flex justify-center gap-2"><button onClick={() => { setChatOpen(true); setUnreadChat(0); }} className="relative rounded-full bg-cyan-500/20 p-2"><MessageCircle className="h-5 w-5"/>{unreadChat > 0 && <span className="absolute -top-1 -left-1 rounded-full bg-red-500 px-1 text-[10px]">{unreadChat}</span>}</button><button disabled={audioBusy || !teammate || teammate.bot} onClick={() => void toggleMicrophone()} className="rounded-full bg-emerald-500/20 p-2 disabled:opacity-40">{audioEnabled ? <Mic className="h-5 w-5"/> : <MicOff className="h-5 w-5"/>}</button><span className="rounded-full bg-white/5 px-3 py-2 text-[10px]">محادثة وصوت الفريق</span></div>
      </div> : <div className="flex items-center justify-between gap-2 border-b border-blue-400/20 bg-blue-950/35 p-3">
        <div className="flex min-w-0 items-center gap-2">{opponent?.avatar ? <img src={opponent.avatar} alt={opponent.name || 'المنافس'} className="h-11 w-11 rounded-full border-2 border-cyan-400 object-cover" /> : <div className="grid h-11 w-11 place-items-center rounded-full border-2 border-cyan-400 bg-slate-800"><UserRound className="h-6 w-6" /></div>}<div className="min-w-0"><strong className="block truncate text-sm">{opponent?.name || 'بانتظار المنافس…'}</strong><small className="text-emerald-300">{opponent ? opponent.bot ? 'يفكر…' : opponent.connected ? 'متصل' : 'انقطع اتصاله' : 'الغرفة مفتوحة'}</small></div></div>
        <div className="flex gap-1.5"><button onClick={() => { setChatOpen(true); setUnreadChat(0); }} aria-label="المحادثة" className="relative rounded-full border border-cyan-400/60 bg-cyan-500/15 p-2.5 text-cyan-300"><MessageCircle className="h-5 w-5" />{unreadChat > 0 && <span className="absolute -left-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-black">{unreadChat}</span>}</button><button type="button" aria-label={audioEnabled ? 'إغلاق الميكروفون' : 'فتح الميكروفون'} disabled={audioBusy || !opponent || opponent.bot} onClick={() => void toggleMicrophone()} className={`rounded-full border p-2.5 ${audioEnabled ? 'border-emerald-300 bg-emerald-500' : 'border-blue-400/50 bg-blue-500/15'} disabled:opacity-40`}>{audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}</button><button type="button" aria-label={remoteAudioEnabled ? 'كتم صوت المنافس' : 'فتح صوت المنافس'} disabled={!opponent || opponent.bot} onClick={toggleRemoteAudio} className="rounded-full border border-blue-400/50 bg-blue-500/15 p-2.5 disabled:opacity-40">{remoteAudioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}</button></div>
      </div>}
      <main className="space-y-5 p-3 sm:p-5">
        <div className="rounded-3xl border-2 border-[#2049a4] bg-[#061235] p-4 shadow-[0_0_25px_rgba(18,48,128,.5)]">
          <div className="flex items-center justify-between gap-3"><div><span className="text-xs font-black text-amber-300">السؤال {Math.min((state.round || 0) + 1, state.total)} من {state.total}</span>{isMillionaireTeam && <p className="mt-1 text-sm font-black text-white">القائد: {myTurn ? 'أنت' : activeCaptain?.name || 'اللاعب الآخر'}</p>}</div>{isMillionaireTeam ? <div className={`grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 font-mono text-2xl font-black ${turnSeconds <= 10 ? 'animate-pulse border-rose-400 bg-rose-500/20 text-rose-200' : 'border-cyan-300 bg-cyan-500/10 text-cyan-200'}`}><span>{turnSeconds}</span><small className="-mt-3 text-[9px]">ثانية</small></div> : <span className="text-sm text-amber-300">الجائزة: {millionairePrizes[Math.min(state.round, 10)]} د.ع</span>}</div>
          <p className="mt-3 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-center text-sm font-black text-amber-100">{isMillionaireTeam ? roundResult ? 'ظهرت نتيجة هذا الدور' : state.status === 'waiting' ? 'بانتظار اكتمال الفريقين…' : myTurn ? 'أنت القائد — ناقش زميلك ثم اعتمد الإجابة' : canRecommend ? 'زميلك هو القائد — أرسل له توصيتك' : state.discussionPhase ? 'الفريق المنافس يتشاور…' : 'دور الفريق المنافس' : roundResult ? answeredByMe ? 'إجابتك الآن — المنافس يشاهد' : `إجابة ${opponent?.name || 'المنافس'} — أنت تشاهد` : state.status === 'waiting' ? 'بانتظار انضمام المنافس' : myTurn ? 'دورك للإجابة الآن! ⭐' : `${opponent?.name || 'المنافس'} يفكّر في الإجابة...`}</p>
          {isMillionaireTeam ? <div className="mt-3 flex items-center justify-center gap-5 text-xs text-cyan-100"><span>فريق A: <b>{state.teamScores?.A || 0}</b></span><span>❤ {state.teamLives?.A ?? 3} — {state.teamLives?.B ?? 3}</span><span>فريق B: <b>{state.teamScores?.B || 0}</b></span></div> : <div className="mt-3 flex items-center justify-between text-xs text-cyan-200"><span>أنت: {self?.score || 0} صحيحة</span><span>{opponent?.name || 'المنافس'}: {opponent?.score || 0} صحيحة</span></div>}
        </div>
        {isMillionaireTeam && state.status === 'playing' && <div className="grid grid-cols-3 gap-2"><button disabled={!myTurn || state.lifelines?.audience} onClick={() => useLifeline('audience')} className="rounded-xl bg-violet-600/30 p-2 text-xs font-black disabled:opacity-35">👥 الجمهور</button><button disabled={!myTurn || state.lifelines?.phone} onClick={() => useLifeline('phone')} className="rounded-xl bg-emerald-600/30 p-2 text-xs font-black disabled:opacity-35">📞 صديق</button><button disabled={!myTurn || state.lifelines?.fifty} onClick={() => useLifeline('fifty')} className="rounded-xl bg-amber-600/30 p-2 text-xs font-black disabled:opacity-35">50:50</button></div>}
        {isMillionaireTeam && (lifelineResult?.kind === 'audience' || lifelineResult?.kind === 'phone') && <div className="fixed inset-0 z-[120] grid place-items-center bg-black/65 p-4" onClick={() => setLifelineResult(null)}><div className={`relative w-full max-w-md rounded-[2rem] border-2 p-6 text-center shadow-2xl ${lifelineResult.kind === 'audience' ? 'border-violet-300 bg-gradient-to-b from-violet-950 to-[#071333]' : 'border-emerald-300 bg-gradient-to-b from-emerald-950 to-[#071333]'}`} onClick={event => event.stopPropagation()}><button onClick={() => setLifelineResult(null)} aria-label="إغلاق المساعدة" className="absolute left-4 top-4 rounded-full bg-white/10 p-2"><X className="h-5 w-5"/></button><div className="text-5xl">{lifelineResult.kind === 'audience' ? '👥' : '📞'}</div><h3 className="mt-3 text-2xl font-black">{lifelineResult.kind === 'audience' ? 'رأي الجمهور' : 'اتصال بصديق'}</h3>{lifelineResult.kind === 'audience' ? <div className="mt-5 grid grid-cols-2 gap-3">{lifelineResult.percentages?.map((value, index) => <div key={index} className="rounded-2xl bg-white/10 p-3"><b className="text-lg text-amber-300">{['أ','ب','ج','د'][index]}</b><p className="mt-1 text-2xl font-black">{value}%</p></div>)}</div> : <p className="mt-6 rounded-2xl bg-white/10 p-5 text-xl font-black">أرجّح الإجابة <span className="text-3xl text-amber-300">{['أ','ب','ج','د'][lifelineResult.suggested || 0]}</span></p>}<button onClick={() => setLifelineResult(null)} className="mt-6 rounded-xl bg-blue-600 px-8 py-3 font-black">العودة للسؤال</button></div></div>}
        {state.status === 'waiting' && <div className="rounded-2xl border border-cyan-500/40 bg-[#071339] p-6 text-center"><p>بانتظار اللاعب الثاني…</p><p className="mt-4 text-sm">رمز الغرفة: <b className="select-all text-lg text-amber-300">{room}</b></p><button className="mt-3 rounded-xl bg-sky-700 px-4 py-2 text-sm" onClick={() => void navigator.clipboard.writeText(room)}>نسخ الرمز</button></div>}
        {!connected && state.status !== 'finished' && <button disabled={busy} onClick={reconnect} className="w-full rounded-xl bg-amber-600 p-3 font-bold">إعادة الاتصال بالغرفة</button>}
        {state.reconnectDeadline && <p className="rounded-xl bg-amber-500/15 p-3 text-center text-sm text-amber-200">انقطع اتصال لاعب؛ ينتظر النظام عودته ثم تستمر المباراة.</p>}
        {displayedQuestion && (state.status === 'playing' || roundResult) && <>
          <div className="flex min-h-36 items-center justify-center rounded-3xl border-2 border-[#2049a4] bg-[#061235] p-5 text-center text-lg font-black leading-9 shadow-[0_0_30px_rgba(18,48,128,.45)]"><ScientificText value={displayedQuestion.question} /></div>
          <div className="space-y-3">{displayedQuestion.options.map((option, index) => {
            const chosen = roundResult?.selected === index;
            const correct = roundResult?.answer === index;
            const resultStyle = roundResult && resultRevealed ? correct ? 'border-emerald-400 bg-emerald-500/25 text-emerald-100 shadow-[0_0_20px_rgba(16,185,129,.45)]' : chosen ? 'border-rose-400 bg-rose-500/25 text-rose-100' : 'border-blue-900/50 bg-[#03091e] opacity-60' : roundResult && chosen ? 'border-amber-400 bg-amber-500/25 animate-pulse' : 'border-[#1c3e8a] bg-gradient-to-r from-[#071233] to-[#03091e]';
            const hiddenByFifty = isMillionaireTeam && lifelineResult?.kind === 'fifty' && !lifelineResult.keep?.includes(index);
            const selectable = isMillionaireTeam ? (myTurn || canRecommend) : myTurn;
            return <button key={index} disabled={hiddenByFifty || !connected || !selectable || pendingAnswer || Boolean(roundResult) || state.status !== 'playing'} onClick={() => canRecommend ? sendSocket({ type: 'recommend', option: index }) : answer(index)} className={`flex min-h-16 w-full items-center gap-3 rounded-2xl border-2 px-4 text-right text-sm font-bold transition ${hiddenByFifty ? 'invisible' : resultStyle} ${teamRecommendation?.option === index ? 'ring-2 ring-violet-300' : ''} disabled:cursor-default`}><b className="shrink-0 text-amber-300">{['أ:', 'ب:', 'ج:', 'د:'][index] || `${index + 1}:`}</b><ScientificText value={option} />{canRecommend && <span className="mr-auto shrink-0 text-xs text-violet-200">أرسل توصية</span>}{teamRecommendation?.option === index && <span className="mr-auto shrink-0 text-xs text-violet-200">توصية زميلك</span>}{chosen && <span className="mr-auto shrink-0 text-xs text-amber-200">{answeredByMe ? 'اختيارك' : 'اختيار القائد'}</span>}</button>;
          })}</div>
          {roundResult && resultRevealed && <div className={`rounded-2xl border p-4 text-center font-black ${roundResult.selected === roundResult.answer ? 'border-emerald-400/60 bg-emerald-500/15 text-emerald-300' : 'border-rose-400/60 bg-rose-500/15 text-rose-200'}`}>{roundResult.selected === roundResult.answer ? 'إجابة صحيحة! ✨' : 'إجابة خاطئة ✗'}{isMillionaireTeam && Number.isInteger(roundResult.botSelected) && <p className="mt-2 text-xs text-slate-100">اختار الفريق المنافس {['أ','ب','ج','د'][roundResult.botSelected ?? 0]}: {roundResult.botCorrect ? 'صحيح' : 'خطأ'} {roundResult.stealAwarded && '— حصل فريقك على نقطة إضافية! ⚡'}</p>}<p className="mt-1 text-xs text-slate-200">{isMillionaireTeam ? 'ينتقل الدور إلى القائد التالي' : `${answeredByMe ? 'شاهد منافسك اختيارك' : 'شاهدت اختيار المنافس'} — الدور التالي بعد عرض النتيجة`}</p></div>}
        </>}
        {state.status === 'finished' && !roundResult && <div className="rounded-3xl border border-amber-400/50 bg-amber-500/10 p-8 text-center"><Trophy className="mx-auto h-14 w-14 text-amber-300"/><p className="mt-3 text-2xl font-black">{isMillionaireTeam ? !state.winner ? 'تعادل الفريقان!' : state.winner === myTeam ? 'فاز فريقكم! 🎉' : 'فاز الفريق المنافس' : state.tie ? 'تعادلتم!' : state.winner === me ? 'أنت الفائز! 🎉' : `${opponent?.name || 'المنافس'} فاز`}</p><p className="mt-2 text-sm">{isMillionaireTeam ? `فريقك ${state.teamScores?.[myTeam] || 0} — المنافسون ${state.teamScores?.[myTeam === 'A' ? 'B' : 'A'] || 0}` : `إجابات صحيحة: أنت ${self?.score || 0} — المنافس ${opponent?.score || 0}`}</p><button onClick={() => void closeModal()} className="mt-5 rounded-xl bg-blue-600 px-8 py-3 font-black">العودة</button></div>}
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
        <div className="grid grid-cols-2 gap-2">{state?.players.map((p, i) => <div key={p.id} className="flex items-center justify-between rounded-xl bg-white/5 p-3"><span className="flex items-center gap-2 text-sm">{p.bot && p.avatar ? <img src={p.avatar} alt={p.name || 'الخصم'} className="h-9 w-9 rounded-full object-cover" /> : <UserRound className="h-5 w-5 text-sky-300" />}<span><strong className="block">{p.id === me ? 'أنت' : p.bot ? p.name || 'الخصم' : `اللاعب ${i + 1}`}</strong>{p.bot && <small className="block text-[10px] text-violet-200">{p.badge} · المستوى {p.level}</small>}<small className={p.connected ? 'text-emerald-300' : 'text-slate-400'}>{p.bot ? (p.answered ? 'أجاب' : 'يفكر…') : p.connected ? 'متصل' : 'غير متصل'}</small></span></span>{p.id === me ? <button type="button" disabled={audioBusy} onClick={() => void toggleMicrophone()} aria-label={audioEnabled ? 'إغلاق الميكروفون' : 'فتح الميكروفون'} className={`rounded-lg p-2 ${audioEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'} disabled:opacity-50`}>{audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}</button> : p.bot ? <span className="rounded-lg bg-violet-500/20 px-2 py-1 text-xs text-violet-200">متصل</span> : <button type="button" onClick={toggleRemoteAudio} aria-label={remoteAudioEnabled ? 'كتم صوت اللاعب المقابل' : 'فتح صوت اللاعب المقابل'} className={`rounded-lg p-2 ${remoteAudioEnabled && remoteTalking ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}>{remoteAudioEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}</button>}</div>)}</div>
        {state?.status === 'playing' && state.reconnectDeadline && <p className="rounded-xl bg-amber-500/15 p-3 text-center text-sm text-amber-100">انقطع اتصال اللاعب الآخر. ننتظر عودته لمدة 30 ثانية…</p>}
        {state?.status === 'waiting' && <p className="text-center text-amber-200">بانتظار انضمام اللاعب الثاني…</p>}
        {state?.status === 'playing' && state.question && !roundResult && <div><p className="mb-2 font-bold">السؤال {state.round + 1} من {state.total}: {state.question.question}</p><p className={`mb-3 text-center text-sm font-black ${state.turn === me ? 'text-emerald-300' : 'text-amber-300'}`}>{state.turn === me ? 'دورك — أجب عن سؤالك' : 'دور المنافس — يفكر في سؤاله'}</p><div className={`grid gap-2 ${state.question.options.length > 2 ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>{state.question.options.map((option, i) => <button key={i} disabled={!connected || state.turn !== me || pendingAnswer || self?.answered} onClick={() => answer(i)} className="min-h-16 rounded-xl bg-slate-700 p-2 text-sm disabled:opacity-50">{option}</button>)}</div>{(pendingAnswer || self?.answered) && <p className="mt-3 text-center text-sky-200">بانتظار انتقال الدور…</p>}</div>}
        {roundResult && state?.question && <div className="rounded-2xl border border-emerald-400/50 bg-emerald-500/15 p-5 text-center"><p className="text-sm font-bold text-emerald-200">نتيجة الدور</p>{roundResult.question && <p className="mt-2 text-sm text-sky-100">سؤال المنافس: {roundResult.question.question}</p>}<p className="mt-2 text-lg font-black">الإجابة الصحيحة</p><p className="mt-2 rounded-xl bg-white/10 p-3 font-bold text-emerald-100">{(roundResult.question || state.question).options[roundResult.answer]}</p><div className="mt-3 flex justify-center gap-4 text-sm">{roundResult.scores.map((player, index) => <span key={player.id}>{player.id === me ? 'أنت' : `اللاعب ${index + 1}`}: <b>{player.score}</b></span>)}</div></div>}
        {state?.status === 'abandoned' && <div className="rounded-2xl border border-rose-400/50 bg-rose-500/15 p-5 text-center"><p className="text-2xl font-black text-rose-200">انتهى التحدّي</p><p className="mt-3 text-sm leading-7 text-rose-100">انسحب اللاعب الآخر من الغرفة، لذلك توقفت المباراة ولن تبقى عالقاً في السؤال السابق.</p><button onClick={() => void closeModal()} className="mt-4 w-full rounded-xl bg-sky-600 p-3 font-black">العودة إلى قائمة الغرف</button></div>}
        {state?.status === 'closed' && <div className="rounded-2xl border border-rose-400/50 bg-rose-500/15 p-5 text-center"><p className="text-2xl font-black text-rose-200">أُغلقت الغرفة</p><p className="mt-3 text-sm leading-7 text-rose-100">غادر المضيف، وانتهى هذا التحدّي.</p><button onClick={() => void closeModal()} className="mt-4 w-full rounded-xl bg-sky-600 p-3 font-black">العودة إلى قائمة الغرف</button></div>}
        {state?.status === 'finished' && <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-5 text-center"><p className="text-2xl font-black text-amber-200">{state.tie ? 'انتهت المباراة بالتعادل!' : state.winner === me ? 'فزت بالتحدّي! 🎉' : 'فاز اللاعب الآخر'}</p><div className="mt-4 grid grid-cols-2 gap-3">{state.players.map((player, index) => <div key={player.id} className={`rounded-xl border p-3 ${player.id === state.winner ? 'border-amber-300 bg-amber-400/15' : 'border-white/15 bg-white/5'}`}><p className="text-xs text-slate-300">{player.id === me ? 'أنت' : `اللاعب ${index + 1}`}</p><p className="mt-1 text-2xl font-black">{player.score}</p></div>)}</div><button onClick={() => void closeModal()} className="mt-4 w-full rounded-xl bg-sky-600 p-3 font-black">العودة إلى الألعاب</button></div>}
      </div>}
      {error && <p className="mt-4 rounded-xl bg-red-500/20 p-3 text-sm text-red-100">{error}</p>}
    </div>{chatPanel}
  </div>;
};
