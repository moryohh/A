import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Apple,
  BookOpen,
  Clock3,
  Hand,
  LockKeyhole,
  Mic,
  MicOff,
  Radio,
  PenLine,
  Presentation,
  Snowflake,
  UnlockKeyhole,
  Users,
  X,
} from "lucide-react";
import { OpenLessonContext } from "../types";
import { getSupabaseClient } from "../lib/supabase";
import { loadGuestSession } from "../services/guestPreviewService";
import { fetchLessonCurriculum } from "../services/curriculumService";
import { getSubjectIndex } from "../services/lessonsService";
import { fetchSolveWithMeTopics } from "../services/solveWithMeCatalog";
import { LessonBookletView } from "./LessonBookletView";
import type { LessonBookletData } from "../data/lessonBooklet";

const API = (import.meta.env.VITE_ONLINE_CHALLENGE_API_URL || "").replace(
  /\/$/,
  "",
);
const CAPACITIES = [2, 4, 8, 12, 20, 30, 50] as const;
type Capacity = (typeof CAPACITIES)[number];
type Point = { x: number; y: number };
type Stroke = {
  id: string;
  owner: string;
  color: string;
  size: number;
  points: Point[];
};
type Participant = {
  id: string;
  name?: string;
  avatar?: string;
  connected: boolean;
  handRaised?: boolean;
  micAllowed?: boolean;
  drawAllowed?: boolean;
  answerFrozen?: boolean;
  lastAnswer?: string;
  progress?: { step?: number; solved?: number; total?: number; answer?: string } | null;
};
type ClassroomState = {
  type: "state";
  status: string;
  players: Participant[];
  classroom: {
    hostId: string;
    capacity: Capacity;
    answersLocked: boolean;
    endsAt: number;
    contentMode: "board" | "booklet";
    content?: {
      subject?: string;
      chapter?: number;
      lesson?: number;
      lessonId?: string;
      lessonTitle?: string;
      exerciseFile?: string;
      exerciseIndex?: number;
      exerciseNumber?: number;
    };
    strokes: Stroke[];
    drawingVersion: number;
    presenterId?: string;
    presenterState?: Record<string, unknown> | null;
  };
};

interface Props {
  onClose: () => void;
  lessonTitle: string;
  category: string;
  openLessonContext?: OpenLessonContext | null;
  initialRoomCode?: string;
  initialContentMode?: "board" | "booklet";
}

async function authorization() {
  const guest = loadGuestSession();
  if (guest) return `Guest ${guest.id}`;
  const client = getSupabaseClient();
  const { data } = (await client?.auth.getSession()) || {
    data: { session: null },
  };
  if (!data.session?.access_token)
    throw new Error("سجّل الدخول أولًا لإنشاء الفصل.");
  return `Bearer ${data.session.access_token}`;
}

async function profile() {
  const guest = loadGuestSession();
  if (guest) return { name: guest.name, avatar: "" };
  const client = getSupabaseClient();
  const { data } = (await client?.auth.getSession()) || {
    data: { session: null },
  };
  const meta = data.session?.user?.user_metadata || {};
  return {
    name: String(
      meta.full_name ||
        meta.name ||
        data.session?.user?.email?.split("@")[0] ||
        "طالب",
    ),
    avatar: String(meta.avatar_url || meta.picture || ""),
  };
}

function isScienceBoard(subject: string) {
  const value = subject.toLowerCase();
  return (
    value.includes("math") ||
    value.includes("رياض") ||
    value.includes("physics") ||
    value.includes("فيز") ||
    value.includes("chem") ||
    value.includes("كيمي")
  );
}

type LockableScreenOrientation = ScreenOrientation & {
  lock?: (orientation: "landscape") => Promise<void>;
  unlock?: () => void;
};

async function enterClassroomLandscape() {
  try {
    if (!document.fullscreenElement)
      await document.documentElement.requestFullscreen();
  } catch {
    // Some in-app browsers refuse fullscreen; orientation lock is still tried.
  }
  try {
    await (screen.orientation as LockableScreenOrientation).lock?.("landscape");
  } catch {
    // Unsupported browsers keep the same two-column landscape canvas.
  }
}

export const LiveClassroomModal: React.FC<Props> = ({
  onClose,
  lessonTitle,
  category,
  openLessonContext,
  initialRoomCode,
  initialContentMode,
}) => {
  const defaultMode: "board" | "booklet" =
    initialContentMode ||
    (isScienceBoard(openLessonContext?.subjectId || category)
      ? "board"
      : "booklet");
  const [capacity, setCapacity] = useState<Capacity>(8);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [room, setRoom] = useState("");
  const [entry, setEntry] = useState("");
  const [me, setMe] = useState("");
  const [state, setState] = useState<ClassroomState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [booklet, setBooklet] = useState<LessonBookletData | null>(null);
  const [bookletLoading, setBookletLoading] = useState(false);
  const [bookletError, setBookletError] = useState("");
  const [color, setColor] = useState("#facc15");
  const [size, setSize] = useState(4);
  const [draft, setDraft] = useState<Point[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [micOn, setMicOn] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const [lessonChoices, setLessonChoices] = useState<Array<{ lessonId: string; lessonNumber: number; title: string }>>([]);
  const [speakerMenu, setSpeakerMenu] = useState(false);
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [classroomExercises, setClassroomExercises] = useState<Array<{ file: string; questionIndex: number; number: number; title: string }>>([]);
  const socketRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const boardFrameRef = useRef<HTMLIFrameElement | null>(null);

  const classroom = state?.classroom;
  const isTeacher = classroom?.hostId === me;
  const self = state?.players.find((player) => player.id === me);
  const canDraw = Boolean(isTeacher || self?.drawAllowed);
  const currentContent = classroom?.content || {
    subject: openLessonContext?.subjectId || category,
    chapter: openLessonContext?.chapterNumber || 1,
    lesson: openLessonContext?.lessonNumber || 1,
    lessonId: openLessonContext?.lessonId,
    lessonTitle,
  };
  const currentSubjectKey = String(currentContent.subject || category).toLowerCase();
  const isMathClassroom = currentSubjectKey.includes("math") || currentSubjectKey.includes("رياض");

  useEffect(() => {
    const receiveExercises = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "classroom_select_exercise" && isTeacher) {
        const item = event.data.item;
        if (item?.file && socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify({
          type: "classroom_control",
          action: "change_content",
          contentMode: "board",
          content: { ...currentContent, exerciseFile: item.file, exerciseIndex: Number(item.questionIndex || 0), exerciseNumber: Number(item.number || 1) },
        }));
        return;
      }
      if (event.data?.type === "classroom_presenter_state" && (isTeacher || classroom?.presenterId === me)) {
        send({ type: "classroom_presenter_state", state: event.data.state });
        return;
      }
      if (event.data?.type === "classroom_student_progress" && !isTeacher) {
        send({ type: "classroom_progress", progress: event.data.progress });
        return;
      }
      if (event.data?.type !== "classroom_exercises") return;
      const items = Array.isArray(event.data.items) ? event.data.items : [];
      setClassroomExercises(items);
      if (isTeacher && !currentContent.exerciseFile && items[0] && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({
          type: "classroom_control",
          action: "change_content",
          contentMode: "board",
          content: { ...currentContent, exerciseFile: items[0].file, exerciseIndex: items[0].questionIndex, exerciseNumber: 1 },
        }));
      }
    };
    window.addEventListener("message", receiveExercises);
    return () => window.removeEventListener("message", receiveExercises);
  }, [isTeacher, currentContent, classroom?.presenterId, me]);

  useEffect(() => {
    if (isTeacher || classroom?.presenterId === me || !classroom?.presenterState) return;
    boardFrameRef.current?.contentWindow?.postMessage(
      { type: "classroom_apply_presenter_state", state: classroom.presenterState },
      window.location.origin,
    );
  }, [isTeacher, classroom?.presenterId, classroom?.presenterState, me]);

  const send = (payload: unknown) => {
    if (socketRef.current?.readyState === WebSocket.OPEN)
      socketRef.current.send(JSON.stringify(payload));
  };

  useEffect(
    () => () => {
      socketRef.current?.close();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );
  useEffect(() => {
    if (!classroom?.endsAt) return;
    const update = () =>
      setSeconds(
        Math.max(0, Math.ceil((classroom.endsAt - Date.now()) / 1000)),
      );
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [classroom?.endsAt]);
  useEffect(() => {
    if (classroom?.contentMode !== "booklet") return;
    setBookletLoading(true);
    setBookletError("");
    const context: OpenLessonContext = {
      subjectId: currentContent.subject || category,
      chapterNumber: Number(currentContent.chapter) || 1,
      lessonNumber: Number(currentContent.lesson) || 1,
      lessonId:
        currentContent.lessonId || `lesson-${currentContent.lesson || 1}`,
      lessonKey: `${currentContent.subject || category}-ch${currentContent.chapter || 1}-les${currentContent.lesson || 1}`,
      title: currentContent.lessonTitle || lessonTitle,
      lessonTitle: currentContent.lessonTitle || lessonTitle,
    };
    fetchLessonCurriculum(context)
      .then((result) => {
        setBooklet(result.data);
        setBookletError(result.error || "");
      })
      .finally(() => setBookletLoading(false));
  }, [
    classroom?.contentMode,
    currentContent.subject,
    currentContent.chapter,
    currentContent.lesson,
    currentContent.lessonId,
  ]);
  useEffect(() => {
    if (!room || !isTeacher) return;
    let cancelled = false;
    const subject = String(currentContent.subject || category).toLowerCase();
    if (classroom?.contentMode === "board" && ["mathematics", "math", "physics", "chemistry"].includes(subject)) {
      fetchSolveWithMeTopics(subject).then((topics) => {
        if (!cancelled) setLessonChoices(topics
          .filter((topic) => topic.chapterNumber === Number(currentContent.chapter))
          .map((topic) => ({ lessonId: topic.id, lessonNumber: topic.lessonNumber, title: topic.title })));
      }).catch(() => { if (!cancelled) setLessonChoices([]); });
      return () => { cancelled = true; };
    }
    getSubjectIndex(currentContent.subject || category, category).then((index) => {
      const chapter = index.chapters.find((item) => item.chapterNumber === Number(currentContent.chapter));
      if (!cancelled) setLessonChoices((chapter?.lessons || []).map((lesson) => ({ lessonId: lesson.lessonId, lessonNumber: lesson.lessonNumber, title: lesson.title })));
    }).catch(() => { if (!cancelled) setLessonChoices([]); });
    return () => { cancelled = true; };
  }, [room, isTeacher, classroom?.contentMode, currentContent.subject, currentContent.chapter, category]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width * ratio));
      const height = Math.max(1, Math.floor(rect.height * ratio));
      if (canvas.width === width && canvas.height === height) return;
      canvas.width = width;
      canvas.height = height;
      setCanvasVersion((value) => value + 1);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [room, classroom?.contentMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    [
      ...(classroom?.strokes || []),
      ...(draft.length > 1
        ? [{ id: "draft", owner: me, color, size, points: draft }]
        : []),
    ].forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.beginPath();
      stroke.points.forEach((point, index) => {
        const x = point.x * rect.width,
          y = point.y * rect.height;
        if (!index) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    });
  }, [classroom?.drawingVersion, classroom?.strokes, draft, canvasVersion, me]);

  async function connect(code: string) {
    const response = await fetch(`${API}/rooms/${code}/connect`, {
      method: "POST",
      headers: {
        Authorization: await authorization(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profile: await profile() }),
    });
    if (!response.ok)
      throw new Error(
        response.status === 409 ? "الفصل ممتلئ." : "تعذر دخول الفصل.",
      );
    const data = await response.json();
    const ws = new WebSocket(
      `${API.replace(/^http/, "ws")}/rooms/${data.roomId}/ws?ticket=${encodeURIComponent(data.ticket)}`,
    );
    socketRef.current = ws;
    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === "welcome") setMe(payload.userId);
        if (payload.type === "state" && payload.gameType === "live_classroom")
          setState(payload);
      } catch {
        /* ignore malformed messages */
      }
    };
    ws.onclose = () => setMicOn(false);
    setRoom(code);
  }

  async function create() {
    void enterClassroomLandscape();
    setBusy(true);
    setError("");
    try {
      const content = {
        subject: openLessonContext?.subjectId || category,
        chapter: openLessonContext?.chapterNumber || 1,
        lesson: openLessonContext?.lessonNumber || 1,
        lessonId: openLessonContext?.lessonId,
        lessonTitle,
      };
      const response = await fetch(`${API}/rooms`, {
        method: "POST",
        headers: {
          Authorization: await authorization(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameType: "live_classroom",
          gameTitle: "الفصل التعليمي المباشر",
          questions: [
            {
              question: lessonTitle,
              options: ["شرح مباشر", "متابعة"],
              correctAnswer: 0,
            },
          ],
          subject: content.subject,
          chapter: content.chapter,
          lesson: content.lesson,
          lessonTitle,
          capacity,
          durationMinutes,
          contentMode: defaultMode,
          content,
        }),
      });
      if (!response.ok) throw new Error("تعذر إنشاء الفصل.");
      const data = await response.json();
      await connect(data.roomCode);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر إنشاء الفصل.");
    } finally {
      setBusy(false);
    }
  }

  async function join() {
    void enterClassroomLandscape();
    setBusy(true);
    setError("");
    try {
      await connect(entry.trim());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر الانضمام.");
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    if (!initialRoomCode || room || busy) return;
    setEntry(initialRoomCode);
    setBusy(true);
    void connect(initialRoomCode)
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : "تعذر الانضمام."),
      )
      .finally(() => setBusy(false));
    // Join a selected classroom once when opened from the room hub.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRoomCode]);

  useEffect(() => {
    if (room) void enterClassroomLandscape();
  }, [room]);

  const closeClassroom = () => {
    try {
      (screen.orientation as LockableScreenOrientation).unlock?.();
    } catch {
      /* orientation unlocking is optional */
    }
    if (document.fullscreenElement)
      void document.exitFullscreen().catch(() => undefined);
    onClose();
  };
  async function toggleMic() {
    if (!isTeacher && !self?.micAllowed) return;
    if (micOn) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setMicOn(false);
      send({ type: "audio_state", enabled: false });
      return;
    }
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      setMicOn(true);
      send({ type: "audio_state", enabled: true });
    } catch {
      setError("تعذر تشغيل الميكروفون. تحقق من الإذن.");
    }
  }
  const point = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
  };
  const timerText = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  const isBoardPresenter = Boolean(isTeacher || classroom?.presenterId === me);
  const boardUrl = `${import.meta.env.BASE_URL}solve-with-me/index.html?build=live-presenter-1&embedded=1&classroom=1&role=${isBoardPresenter ? "teacher" : "student"}&subject=${encodeURIComponent(currentContent.subject || category)}&chapter=${currentContent.chapter || 1}&lesson=${currentContent.lesson || 1}&lessonId=${encodeURIComponent(currentContent.lessonId || "")}&topicTitle=${encodeURIComponent(currentContent.lessonTitle || lessonTitle)}&exerciseFile=${encodeURIComponent(currentContent.exerciseFile || "")}&exerciseIndex=${Number(currentContent.exerciseIndex || 0)}`;

  if (!room)
    return (
      <div
        className="fixed inset-0 z-[100] overflow-y-auto bg-[#061126] p-4 font-cairo text-white"
        dir="rtl"
      >
        <div className="mx-auto mt-8 max-w-lg rounded-3xl border border-cyan-400/35 bg-slate-950/80 p-5 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-cyan-100">
                {defaultMode === "board"
                  ? "حل معي — درس رياضيات أونلاين"
                  : "الملزمة — درس رياضيات أونلاين"}
              </h2>
              <p className="mt-1 text-xs text-slate-300">
                {defaultMode === "board"
                  ? "صبورة حل معي المباشرة للمدرس والطلاب"
                  : "شرح الملزمة مباشرة للمدرس والطلاب"}
              </p>
            </div>
            <button onClick={closeClassroom} className="rounded-full bg-white/10 p-2">
              <X />
            </button>
          </div>
          <label className="mt-5 block text-xs font-black">عدد الطلاب</label>
          <div className="mt-2 rounded-2xl border border-cyan-300/20 bg-white/5 p-4">
            <div className="mb-3 flex items-center justify-between"><span className="text-xs text-slate-300">اسحب لتحديد السعة</span><b className="rounded-xl bg-cyan-400 px-4 py-2 text-xl text-slate-950">{capacity} طالب</b></div>
            <input aria-label="عدد الطلاب" type="range" min="0" max={CAPACITIES.length - 1} step="1" value={CAPACITIES.indexOf(capacity)} onChange={(event) => setCapacity(CAPACITIES[Number(event.target.value)])} className="w-full accent-cyan-400" />
            <div className="mt-2 flex justify-between text-[10px] font-black text-slate-400" dir="ltr">{CAPACITIES.map((value) => <span key={value}>{value}</span>)}</div>
          </div>
          <label className="mt-4 block text-xs font-black">مدة الدرس</label>
          <select
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(Number(event.target.value))}
            className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900 p-3"
          >
            <option value={15}>15 دقيقة</option>
            <option value={30}>30 دقيقة</option>
            <option value={45}>45 دقيقة</option>
            <option value={60}>60 دقيقة</option>
          </select>
          <button
            disabled={busy}
            onClick={create}
            className="mt-5 w-full rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-400 py-4 font-black text-slate-950 disabled:opacity-50"
          >
            إنشاء الفصل كمدرس
          </button>
          <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
            <span className="h-px flex-1 bg-white/10" />
            أو الانضمام
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <div className="flex gap-2">
            <input
              value={entry}
              onChange={(event) =>
                setEntry(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              placeholder="رمز الفصل"
              className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 text-center text-xl tracking-[.35em]"
            />
            <button
              disabled={busy || entry.length < 4}
              onClick={join}
              className="rounded-xl bg-blue-600 px-5 py-3 font-black disabled:opacity-40"
            >
              دخول
            </button>
          </div>
          {error && (
            <p className="mt-3 rounded-xl bg-rose-500/20 p-3 text-center text-xs text-rose-200">
              {error}
            </p>
          )}
        </div>
      </div>
    );

  return (
    <div
      className="live-classroom-root fixed inset-0 z-[100] flex flex-col bg-[#071126] font-cairo text-white"
      dir="rtl"
    >
      <header className="flex items-center justify-between gap-2 bg-gradient-to-l from-[#091a36] to-[#10184a] px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={closeClassroom}
            className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white shadow-[0_0_18px_rgba(244,63,94,.35)]"
          >
            <X />
          </button>
          <div>
            <b className="block text-sm">
              {currentContent.lessonTitle || lessonTitle}
            </b>
            <small className="text-cyan-300">
              رمز الفصل: {room} ·{" "}
              {Math.max(0, (state?.players.length || 1) - 1)}/
              {classroom?.capacity || capacity} طالب
            </small>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 font-mono text-cyan-100 shadow-inner">
            <Clock3 className="h-4 w-4" />
            {timerText}
          </span>
          {!isTeacher && <button onClick={() => void toggleMic()} disabled={!self?.micAllowed} className={`rounded-full p-2.5 ${micOn ? "bg-emerald-400 text-slate-950" : "bg-white/10"} disabled:opacity-35`}>{micOn ? <Mic /> : <MicOff />}</button>}
        </div>
      </header>
      {isTeacher && (
        <div className="border-b border-white/10 bg-[#071126] p-2 text-xs">
          {!isMathClassroom && (
            <select value={currentContent.lessonId || ""} onChange={(event) => { const lesson = lessonChoices.find((item) => item.lessonId === event.target.value); if (lesson) send({ type: "classroom_control", action: "change_content", contentMode: classroom?.contentMode, content: { ...currentContent, lessonId: lesson.lessonId, lesson: lesson.lessonNumber, lessonTitle: lesson.title } }); }} className="mb-2 w-full rounded-2xl border border-cyan-300/30 bg-slate-800 px-3 py-2 font-black text-white"><option value="">اختر الدرس</option>{lessonChoices.map((lesson) => <option key={lesson.lessonId} value={lesson.lessonId}>{lesson.lessonNumber}. {lesson.title}</option>)}</select>
          )}
          <div className="grid grid-cols-3 gap-2 rounded-3xl border border-cyan-300/15 bg-gradient-to-l from-[#10234b] to-[#171947] p-2 shadow-xl">
          <div className="relative min-w-0">
            <button
              onClick={() => setSpeakerMenu((value) => !value)}
              className="group flex h-16 w-full flex-col items-center justify-center gap-1 rounded-2xl border border-cyan-300/35 bg-gradient-to-br from-cyan-400 via-sky-500 to-indigo-600 px-2 font-black text-white shadow-[0_8px_24px_rgba(14,165,233,.28)] transition active:scale-95"
            >
              <span className="relative grid h-8 w-8 place-items-center rounded-full bg-white/20 shadow-inner">
                <span className="absolute inset-0 animate-ping rounded-full border border-white/45" />
                <Radio className="relative h-5 w-5 drop-shadow" />
              </span>
              <span className="text-[11px] leading-none">أدوات الفصل</span>
            </button>
            {speakerMenu && <div className="fixed inset-x-2 top-[9.5rem] z-[120] max-h-[62dvh] overflow-y-auto rounded-3xl border border-cyan-300/25 bg-slate-950/95 p-3 shadow-2xl backdrop-blur" dir="rtl">
              <div className="mb-3 flex items-center justify-between"><div><b className="block text-cyan-200">أدوات الفصل</b><small className="text-slate-400">التحكم بالتحدث والإجابات والشرح</small></div><button onClick={() => setSpeakerMenu(false)} className="rounded-full bg-white/10 p-2"><X className="h-4 w-4"/></button></div>
              {classroom?.presenterId && classroom.presenterId !== me && <button onClick={() => send({ type: "classroom_control", action: "restore_presenter" })} className="mb-3 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 p-3 font-black text-slate-950">استعادة الكتابة والشرح للمعلم</button>}
              <div className="space-y-2">{state?.players.filter((player) => player.id !== me).map((player) => <div key={player.id} className={`rounded-2xl border p-3 ${player.handRaised ? "border-amber-300 bg-amber-400/10" : "border-white/10 bg-white/5"}`}>
                <div className="flex items-center justify-between gap-2"><div className="min-w-0"><b className="block truncate">{player.handRaised ? "✋ " : ""}{player.name || "طالب"}</b><small className="text-slate-400">{player.connected ? "متصل" : "غير متصل"}{player.progress ? ` · الخطوة ${player.progress.step || 1} · ${player.progress.solved || 0}/${player.progress.total || 0}` : ""}</small></div>{classroom?.presenterId === player.id && <span className="rounded-full bg-fuchsia-500/20 px-2 py-1 text-[10px] text-fuchsia-200">يشرح الآن</span>}</div>
                {player.lastAnswer && <div className="mt-2 rounded-xl bg-slate-900 p-2 text-[11px] text-cyan-100"><span className="text-slate-400">آخر إجابة: </span>{player.lastAnswer}</div>}
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  <button onClick={() => send({ type: "classroom_control", action: "select_speaker", targetId: player.id })} className={`rounded-xl p-2 font-black ${player.micAllowed ? "bg-emerald-400 text-slate-950" : "bg-white/10"}`}><Mic className="mx-auto mb-1 h-4 w-4"/><span className="text-[10px]">{player.micAllowed ? "يتحدث" : "سماح تحدث"}</span></button>
                  <button onClick={() => send({ type: "classroom_control", action: "answer_permission", targetId: player.id, value: player.answerFrozen })} className={`rounded-xl p-2 font-black ${player.answerFrozen ? "bg-sky-400 text-slate-950" : "bg-white/10"}`}><Snowflake className="mx-auto mb-1 h-4 w-4"/><span className="text-[10px]">{player.answerFrozen ? "فتح الإجابة" : "تجميد"}</span></button>
                  <button onClick={() => send({ type: "classroom_control", action: "select_presenter", targetId: player.id })} className={`rounded-xl p-2 font-black ${classroom?.presenterId === player.id ? "bg-fuchsia-500" : "bg-white/10"}`}><PenLine className="mx-auto mb-1 h-4 w-4"/><span className="text-[10px]">كتابة وشرح</span></button>
                </div>
              </div>)}</div>
            </div>}
          </div>
          <button
            onClick={() =>
              send({
                type: "classroom_control",
                action: "answers_locked",
                value: !classroom?.answersLocked,
              })
            }
            className={`group flex h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border px-2 font-black shadow-lg transition active:scale-95 ${classroom?.answersLocked ? "border-sky-200/50 bg-gradient-to-br from-sky-400 to-blue-700" : "border-violet-200/45 bg-gradient-to-br from-violet-500 to-fuchsia-700"}`}
          >
            {classroom?.answersLocked ? (
              <>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/20 shadow-inner"><UnlockKeyhole className="h-5 w-5 animate-pulse" /></span>
                <span className="text-[11px] leading-none">فتح الإجابات</span>
              </>
            ) : (
              <>
                <span className="relative grid h-8 w-8 place-items-center rounded-full bg-white/20 shadow-inner"><Snowflake className="h-5 w-5 animate-spin [animation-duration:4s]" /><LockKeyhole className="absolute h-3 w-3" /></span>
                <span className="text-[11px] leading-none">تجميد الإجابات</span>
              </>
            )}
          </button>
          <div className="flex h-16 min-w-0 flex-col items-center justify-center gap-1 rounded-2xl border border-emerald-200/35 bg-gradient-to-br from-emerald-400/25 to-teal-900/70 px-2 text-emerald-50 shadow-[0_8px_24px_rgba(16,185,129,.18)]">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-300/20 shadow-inner">
              <Apple className="h-6 w-6 animate-bounce fill-emerald-300 text-emerald-100 [animation-duration:2s]" />
            </span>
            <span className="text-[11px] font-black leading-none"><b className="text-sm">100</b> تفاحة</span>
          </div>
          {!isMathClassroom && <button
            onClick={() =>
              send({
                type: "classroom_control",
                action: "change_content",
                contentMode:
                  classroom?.contentMode === "board" ? "booklet" : "board",
                content: currentContent,
              })
            }
            className="flex shrink-0 items-center gap-1 rounded-xl bg-indigo-500/20 px-3 py-2"
          >
            {classroom?.contentMode === "board" ? (
              <BookOpen className="h-4 w-4" />
            ) : (
              <Presentation className="h-4 w-4" />
            )}
            {classroom?.contentMode === "board" ? "عرض الملزمة" : "عرض الصبورة"}
          </button>}
          </div>
        </div>
      )}
      <main className="relative min-h-0 flex-1 overflow-auto bg-slate-100 text-slate-900">
        <div className="relative mx-auto min-h-full max-w-5xl">
          {classroom?.contentMode === "booklet" ? (
            <div className="p-3">
              <LessonBookletView
                bookletData={booklet}
                isLoading={bookletLoading}
                  error={bookletError || undefined}
                lessonTitle={currentContent.lessonTitle || lessonTitle}
              />
            </div>
          ) : (
            <iframe
              ref={boardFrameRef}
              src={boardUrl}
              onLoad={() => {
                if (!isBoardPresenter && classroom?.presenterState) boardFrameRef.current?.contentWindow?.postMessage(
                  { type: "classroom_apply_presenter_state", state: classroom.presenterState },
                  window.location.origin,
                );
              }}
              title="الصبورة المباشرة"
              className="h-[calc(100dvh-8rem)] min-h-[560px] w-full border-0 bg-white"
              allow="fullscreen; clipboard-write"
            />
          )}
          {classroom?.contentMode === "booklet" && <canvas
            ref={canvasRef}
            className={`absolute inset-0 z-20 h-full w-full touch-none ${canDraw ? "cursor-crosshair" : "pointer-events-none"}`}
            onPointerDown={(event) => {
              if (canDraw) {
                event.currentTarget.setPointerCapture(event.pointerId);
                setDraft([point(event)]);
              }
            }}
            onPointerMove={(event) => {
              if (canDraw && draft.length) {
                const nextPoint = point(event);
                setDraft((value) => [...value, nextPoint]);
              }
            }}
            onPointerUp={(event) => {
              if (draft.length > 1)
                send({
                  type: "classroom_stroke",
                  stroke: {
                    id: crypto.randomUUID(),
                    color,
                    size,
                    points: [...draft, point(event)],
                  },
                });
              setDraft([]);
            }}
          />}
          {!isTeacher && classroom?.answersLocked && (
            <div className="pointer-events-none fixed inset-x-4 bottom-24 z-30 mx-auto max-w-sm rounded-3xl border border-cyan-200/70 bg-cyan-100/90 p-4 text-center text-cyan-950 shadow-[0_0_35px_rgba(125,211,252,.8)] backdrop-blur">
              <Snowflake className="mx-auto mb-1 animate-pulse" />
              <b>الإجابات مجمّدة حتى يسمح المدرس</b>
            </div>
          )}
        </div>
      </main>
      <footer className="border-t border-white/10 bg-slate-950 p-2">
        <div className="flex items-center gap-2">
          {canDraw && classroom?.contentMode === "booklet" && (
            <>
              <PenLine className="h-4 w-4 text-cyan-300" />
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="h-9 w-10"
              />
              <input
                type="range"
                min="2"
                max="16"
                value={size}
                onChange={(event) => setSize(Number(event.target.value))}
                className="w-20"
              />
            </>
          )}
          {!isTeacher && (
            <button
              onClick={() =>
                send({ type: "raise_hand", raised: !self?.handRaised })
              }
              className={`mr-auto flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-black ${self?.handRaised ? "bg-amber-400 text-slate-950" : "bg-white/10"}`}
            >
              <Hand className="h-4 w-4" />
              {self?.handRaised ? "تم رفع اليد" : "رفع اليد"}
            </button>
          )}
          {!isTeacher && !classroom?.answersLocked && (
            <div className="flex min-w-0 flex-1 gap-1">
              <input
                value={answerText}
                onChange={(event) => setAnswerText(event.target.value)}
                placeholder="اكتب إجابتك"
                className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm text-white"
              />
              <button
                onClick={() => {
                  send({ type: "classroom_answer", value: answerText });
                  setAnswerText("");
                }}
                className="rounded-xl bg-emerald-500 px-3 text-xs font-black text-slate-950"
              >
                إرسال
              </button>
            </div>
          )}
        </div>
        {isTeacher && (
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {state?.players
              .filter((player) => player.id !== me)
              .map((player) => (
                <div
                  key={player.id}
                  className="flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-2 text-xs"
                >
                  <span>
                    {player.handRaised ? "✋ " : ""}
                    {player.name || "طالب"}
                  </span>
                  <button
                    onClick={() =>
                      send({
                        type: "classroom_control",
                        action: "mic_permission",
                        targetId: player.id,
                        value: !player.micAllowed,
                      })
                    }
                    className={`rounded-lg p-1.5 ${player.micAllowed ? "bg-emerald-500 text-slate-950" : "bg-white/10"}`}
                  >
                    {player.micAllowed ? (
                      <Mic className="h-4 w-4" />
                    ) : (
                      <MicOff className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      send({
                        type: "classroom_control",
                        action: "draw_permission",
                        targetId: player.id,
                        value: !player.drawAllowed,
                      })
                    }
                    className={`rounded-lg p-1.5 ${player.drawAllowed ? "bg-cyan-500 text-slate-950" : "bg-white/10"}`}
                  >
                    {player.drawAllowed ? (
                      <UnlockKeyhole className="h-4 w-4" />
                    ) : (
                      <LockKeyhole className="h-4 w-4" />
                    )}
                  </button>
                </div>
              ))}
          </div>
        )}
      </footer>
    </div>
  );
};
