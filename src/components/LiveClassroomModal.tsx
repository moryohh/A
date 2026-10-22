import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  Clock3,
  Eraser,
  Hand,
  LockKeyhole,
  Mic,
  MicOff,
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
import { LessonBookletView } from "./LessonBookletView";
import type { LessonBookletData } from "../data/lessonBooklet";

const API = (import.meta.env.VITE_ONLINE_CHALLENGE_API_URL || "").replace(
  /\/$/,
  "",
);
type Capacity = 1 | 5 | 10 | 50;
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
    };
    strokes: Stroke[];
    drawingVersion: number;
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
  const [capacity, setCapacity] = useState<Capacity>(5);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [room, setRoom] = useState("");
  const [entry, setEntry] = useState("");
  const [me, setMe] = useState("");
  const [state, setState] = useState<ClassroomState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [booklet, setBooklet] = useState<LessonBookletData | null>(null);
  const [bookletLoading, setBookletLoading] = useState(false);
  const [color, setColor] = useState("#facc15");
  const [size, setSize] = useState(4);
  const [draft, setDraft] = useState<Point[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [micOn, setMicOn] = useState(false);
  const [answerText, setAnswerText] = useState("");
  const socketRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

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
      .then((result) => setBooklet(result.data))
      .finally(() => setBookletLoading(false));
  }, [
    classroom?.contentMode,
    currentContent.subject,
    currentContent.chapter,
    currentContent.lesson,
    currentContent.lessonId,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
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
  }, [classroom?.drawingVersion, classroom?.strokes, draft, color, size, me]);

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
  const boardUrl = `${import.meta.env.BASE_URL}solve-with-me/index.html?embedded=1&subject=${encodeURIComponent(currentContent.subject || category)}&chapter=${currentContent.chapter || 1}&lesson=${currentContent.lesson || 1}&lessonId=${encodeURIComponent(currentContent.lessonId || "")}`;

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
            <button onClick={onClose} className="rounded-full bg-white/10 p-2">
              <X />
            </button>
          </div>
          <label className="mt-5 block text-xs font-black">عدد الطلاب</label>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {([1, 5, 10, 50] as Capacity[]).map((value) => (
              <button
                key={value}
                onClick={() => setCapacity(value)}
                className={`rounded-xl border py-3 font-black ${capacity === value ? "border-cyan-300 bg-cyan-500 text-slate-950" : "border-white/15 bg-white/5"}`}
              >
                {value}
              </button>
            ))}
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
      className="fixed inset-0 z-[100] flex flex-col bg-[#071126] font-cairo text-white"
      dir="rtl"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-slate-950/95 p-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="rounded-xl bg-rose-500/20 p-2 text-rose-200"
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
          <span className="flex items-center gap-1 rounded-xl bg-white/10 px-3 py-2 font-mono">
            <Clock3 className="h-4 w-4" />
            {timerText}
          </span>
          <button
            onClick={() => void toggleMic()}
            disabled={!isTeacher && !self?.micAllowed}
            className={`rounded-xl p-2.5 ${micOn ? "bg-emerald-500 text-slate-950" : "bg-white/10"} disabled:opacity-35`}
          >
            {micOn ? <Mic /> : <MicOff />}
          </button>
        </div>
      </header>
      {isTeacher && (
        <div className="flex gap-2 overflow-x-auto border-b border-white/10 bg-slate-900/90 p-2 text-xs">
          <button
            onClick={() =>
              send({
                type: "classroom_control",
                action: "answers_locked",
                value: !classroom?.answersLocked,
              })
            }
            className="flex shrink-0 items-center gap-1 rounded-xl bg-cyan-500/15 px-3 py-2"
          >
            {classroom?.answersLocked ? (
              <>
                <Snowflake />
                فتح الإجابات
              </>
            ) : (
              <>
                <LockKeyhole />
                تجميد الإجابات
              </>
            )}
          </button>
          <button
            onClick={() =>
              send({ type: "classroom_control", action: "mute_all" })
            }
            className="shrink-0 rounded-xl bg-rose-500/15 px-3 py-2"
          >
            كتم الجميع
          </button>
          <button
            onClick={() =>
              send({ type: "classroom_control", action: "clear_drawing" })
            }
            className="flex shrink-0 items-center gap-1 rounded-xl bg-amber-500/15 px-3 py-2"
          >
            <Eraser className="h-4 w-4" />
            مسح الرسم
          </button>
          <button
            onClick={() =>
              send({
                type: "classroom_control",
                action: "extend_time",
                minutes: 5,
              })
            }
            className="shrink-0 rounded-xl bg-white/10 px-3 py-2"
          >
            +5 دقائق
          </button>
          <button
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
          </button>
        </div>
      )}
      <main className="relative min-h-0 flex-1 overflow-auto bg-slate-100 text-slate-900">
        <div className="relative mx-auto min-h-full max-w-5xl">
          {classroom?.contentMode === "booklet" ? (
            <div className="p-3">
              <LessonBookletView
                bookletData={booklet}
                isLoading={bookletLoading}
                lessonTitle={currentContent.lessonTitle || lessonTitle}
              />
            </div>
          ) : (
            <iframe
              src={boardUrl}
              title="الصبورة المباشرة"
              className="h-[calc(100dvh-8rem)] min-h-[560px] w-full border-0 bg-white"
              allow="fullscreen; clipboard-write"
            />
          )}
          <canvas
            ref={canvasRef}
            className={`absolute inset-0 z-20 h-full w-full touch-none ${canDraw ? "cursor-crosshair" : "pointer-events-none"}`}
            onPointerDown={(event) => {
              if (canDraw) {
                event.currentTarget.setPointerCapture(event.pointerId);
                setDraft([point(event)]);
              }
            }}
            onPointerMove={(event) => {
              if (canDraw && draft.length)
                setDraft((value) => [...value, point(event)]);
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
          />
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
          {canDraw && (
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
