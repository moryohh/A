import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Apple,
  ArrowLeftRight,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
  Eraser,
  Hand,
  Grid2X2,
  GraduationCap,
  LockKeyhole,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  Radio,
  Share2,
  PenLine,
  Presentation,
  Snowflake,
  Target,
  TreePine,
  Trash2,
  Type,
  UnlockKeyhole,
  Users,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { OpenLessonContext, TeacherStory } from "../types";
import { getSupabaseClient } from "../lib/supabase";
import { loadGuestSession } from "../services/guestPreviewService";
import { fetchLessonCurriculum } from "../services/curriculumService";
import { buildLessonKey, getLessonDetails, getSubjectIndex } from "../services/lessonsService";
import { fetchSolveWithMeTopics } from "../services/solveWithMeCatalog";
import { LessonBookletView } from "./LessonBookletView";
import { PlantStageVideo } from "./PlantStageVideo";
import type { BookletItemQuestion, LessonBookletData } from "../data/lessonBooklet";

const API = (import.meta.env.VITE_ONLINE_CHALLENGE_API_URL || "").replace(
  /\/$/,
  "",
);
const MEMBER_SPROUT_IMAGE = "data:image/webp;base64,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";
const CAPACITIES = [2, 4, 8, 12, 20, 30, 50] as const;
type Capacity = (typeof CAPACITIES)[number];
type Point = { x: number; y: number };
type Stroke = {
  id: string;
  owner: string;
  color: string;
  size: number;
  points: Point[];
  tool?: "pen" | "eraser" | "text";
  text?: string;
  fontSize?: number;
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
  joinedAt?: number | null;
  activity?: string;
  activityAt?: number | null;
  mission?: {
    text: string;
    target: number;
    progress: number;
    completed: boolean;
    updatedAt: number;
  } | null;
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
    studyMode?: "teacher" | "together";
    sharedMission?: string;
    bookletIndex?: number;
    bookletAnswerVisible?: boolean;
    bookletShares?: Array<{ id: string; from: string; index: number; question: string; answer: string; createdAt: number }>;
  };
};

interface Props {
  onClose: () => void;
  lessonTitle: string;
  category: string;
  openLessonContext?: OpenLessonContext | null;
  initialRoomCode?: string;
  initialContentMode?: "board" | "booklet";
  offlinePreview?: boolean;
  offlineRole?: "teacher" | "student";
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
  if (guest) return { name: guest.name, avatar: localStorage.getItem(`nahnu_maak_avatar_${guest.id}`) || "" };
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
    avatar: String(localStorage.getItem(`nahnu_maak_avatar_${data.session?.user?.id}`) || meta.avatar_url || meta.picture || ""),
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

async function restoreClassroomDisplay() {
  try {
    (screen.orientation as LockableScreenOrientation).unlock?.();
  } catch {
    // Orientation locking is not available in every mobile browser.
  }
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
  } catch {
    // Fullscreen cleanup is best effort.
  }
  window.setTimeout(() => window.dispatchEvent(new Event("resize")), 80);
}

function BlankStudyBoard({ strokes, drawingVersion, canDraw, onShare }: {
  strokes: Stroke[];
  drawingVersion: number;
  canDraw: boolean;
  onShare: (strokes: Stroke[]) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<"pen" | "eraser" | "text">("pen");
  const [color, setColor] = useState("#173f5f");
  const [size, setSize] = useState(4);
  const [textValue, setTextValue] = useState("");
  const [draft, setDraft] = useState<Point[]>([]);
  const [privateStrokes, setPrivateStrokes] = useState<Stroke[]>([]);
  const [canvasVersion, setCanvasVersion] = useState(0);

  const normalizedPoint = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / Math.max(1, rect.width))),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / Math.max(1, rect.height))),
    };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = 0;
    const resize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = canvas.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 2);
        const nextWidth = Math.max(1, Math.round(rect.width * ratio));
        const nextHeight = Math.max(1, Math.round(rect.height * ratio));
        if (canvas.width === nextWidth && canvas.height === nextHeight) return;
        canvas.width = nextWidth;
        canvas.height = nextHeight;
        setCanvasVersion((value) => value + 1);
      });
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const scale = Math.max(.55, Math.min(rect.width, rect.height) / 520);
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, rect.width, rect.height);
    context.fillStyle = "#fffef9";
    context.fillRect(0, 0, rect.width, rect.height);
    [...strokes, ...privateStrokes, ...(draft.length > 1 ? [{ id: "draft", owner: "draft", color, size, points: draft, tool }] as Stroke[] : [])].forEach((stroke) => {
      const first = stroke.points[0];
      if (!first) return;
      if (stroke.tool === "text" && stroke.text) {
        context.fillStyle = stroke.color;
        context.font = `700 ${Math.max(12, (stroke.fontSize || 24) * scale)}px Cairo, sans-serif`;
        context.textAlign = "right";
        context.textBaseline = "top";
        context.fillText(stroke.text, first.x * rect.width, first.y * rect.height);
        return;
      }
      if (stroke.points.length < 2) return;
      context.strokeStyle = stroke.tool === "eraser" ? "#fffef9" : stroke.color;
      context.lineWidth = Math.max(1, stroke.size * scale * (stroke.tool === "eraser" ? 3 : 1));
      context.lineCap = "round";
      context.lineJoin = "round";
      context.beginPath();
      stroke.points.forEach((point, index) => index ? context.lineTo(point.x * rect.width, point.y * rect.height) : context.moveTo(point.x * rect.width, point.y * rect.height));
      context.stroke();
    });
  }, [strokes, privateStrokes, drawingVersion, draft, color, size, tool, canvasVersion]);

  return <div
    className="relative isolate h-full min-h-44 overflow-hidden overscroll-contain bg-[#fffef9]"
    onClick={(event) => event.stopPropagation()}
    onContextMenu={(event) => event.preventDefault()}
  >
    <div className="absolute inset-x-2 top-2 z-10 flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white/95 p-1 shadow-md" dir="rtl">
      <button onClick={() => setTool("pen")} className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tool === "pen" ? "bg-cyan-500 text-white" : "bg-slate-100 text-slate-600"}`} title="قلم"><PenLine className="h-4 w-4"/></button>
      <button onClick={() => setTool("eraser")} className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tool === "eraser" ? "bg-amber-400 text-slate-950" : "bg-slate-100 text-slate-600"}`} title="ممحاة"><Eraser className="h-4 w-4"/></button>
      <button onClick={() => setTool("text")} className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${tool === "text" ? "bg-violet-500 text-white" : "bg-slate-100 text-slate-600"}`} title="كتابة نص"><Type className="h-4 w-4"/></button>
      {tool === "text" && <input value={textValue} onChange={(event) => setTextValue(event.target.value)} placeholder="اكتب ثم المس السبورة" className="h-8 min-w-28 flex-1 rounded-lg border border-slate-200 px-2 text-[10px] text-slate-800 outline-none"/>}
      <input type="color" value={color} onChange={(event) => setColor(event.target.value)} className="h-8 w-8 shrink-0 rounded-lg" title="لون القلم"/>
      <input type="range" min="2" max="18" value={size} onChange={(event) => setSize(Number(event.target.value))} className="w-20 shrink-0 accent-cyan-500" title={tool === "text" ? "حجم الخط" : "سمك القلم"}/>
      {canDraw && <button onClick={() => setPrivateStrokes([])} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-600" title="مسح رسمك المحلي"><Trash2 className="h-4 w-4"/></button>}
      {canDraw && <button disabled={!privateStrokes.length} onClick={() => { onShare(privateStrokes); setPrivateStrokes([]); }} className="flex h-8 shrink-0 items-center gap-1 rounded-lg bg-cyan-600 px-2 text-[9px] font-black text-white disabled:opacity-40" title="مشاركة السبورة مع الأعضاء"><Share2 className="h-4 w-4"/>مشاركة</button>}
    </div>
    <canvas ref={canvasRef} className={`block h-full w-full touch-none select-none ${canDraw ? "cursor-crosshair" : "cursor-not-allowed"}`}
      style={{ touchAction: "none", WebkitUserSelect: "none", userSelect: "none" }}
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.pointerType === "mouse" && event.button !== 0) return;
        if (!canDraw) return;
        const point = normalizedPoint(event);
        if (tool === "text") {
          const value = textValue.trim();
          if (!value) return;
          setPrivateStrokes((current) => current.concat({ id: crypto.randomUUID(), owner: "", color, size, points: [point, point], tool: "text", text: value.slice(0, 120), fontSize: Math.max(14, size * 2.2) }));
          setTextValue("");
          return;
        }
        event.currentTarget.setPointerCapture(event.pointerId);
        setDraft([point]);
      }}
      onPointerMove={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (canDraw && draft.length) setDraft((points) => [...points, normalizedPoint(event)]);
      }}
      onPointerUp={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (draft.length) {
          const points = [...draft, normalizedPoint(event)];
          if (points.length > 1) setPrivateStrokes((current) => current.concat({ id: crypto.randomUUID(), owner: "", color, size, points, tool }));
        }
        setDraft([]);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onPointerCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        setDraft([]);
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      }}
      onClick={(event) => { event.preventDefault(); event.stopPropagation(); }}/>
  </div>;
}

export const LiveClassroomModal: React.FC<Props> = ({
  onClose,
  lessonTitle,
  category,
  openLessonContext,
  initialRoomCode,
  initialContentMode,
  offlinePreview = false,
  offlineRole = "teacher",
}) => {
  const defaultMode: "board" | "booklet" =
    initialContentMode ||
    (isScienceBoard(openLessonContext?.subjectId || category)
      ? "board"
      : "booklet");
  const offlineBooklet = offlinePreview && defaultMode === "booklet";
  const offlineGuest = loadGuestSession();
  const offlineHostAvatar = offlineGuest
    ? localStorage.getItem(`nahnu_maak_avatar_${offlineGuest.id}`) || `${import.meta.env.BASE_URL}avatars/avatar-owl-scholar.jpg`
    : `${import.meta.env.BASE_URL}avatars/avatar-owl-scholar.jpg`;
  const [capacity, setCapacity] = useState<Capacity>(8);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [studyMode, setStudyMode] = useState<"teacher" | "together">("together");
  const [sharedMissionDraft, setSharedMissionDraft] = useState("");
  const [room, setRoom] = useState(offlineBooklet ? "OFFLINE" : "");
  const [entry, setEntry] = useState("");
  const offlineViewerId = offlineRole === "student" ? "offline-viewer" : "offline-host";
  const [me, setMe] = useState(offlineBooklet ? offlineViewerId : "");
  const [state, setState] = useState<ClassroomState | null>(() => offlineBooklet ? {
    type: "state",
    status: "playing",
    players: [
      { id: "offline-host", name: offlineGuest?.name || "محمد", avatar: offlineHostAvatar, connected: true, micAllowed: true, drawAllowed: true, joinedAt: Date.now() - 300000, mission: { text: "قراءة أربع صفحات", target: 4, progress: 2, completed: false, updatedAt: Date.now() } },
      { id: "offline-viewer", name: offlineRole === "student" ? (offlineGuest?.name || "أنت") : "حسن", avatar: offlineHostAvatar, connected: true, micAllowed: false, drawAllowed: false, joinedAt: Date.now() - 295000, mission: { text: "مراجعة سؤالين", target: 2, progress: 1, completed: false, updatedAt: Date.now() } },
      { id: "offline-abdullah", name: "عبدالله", avatar: `${import.meta.env.BASE_URL}avatars/avatar-fox-explorer.jpg`, connected: true, micAllowed: false, joinedAt: Date.now() - 280000, mission: { text: "تلخيص التعاريف", target: 3, progress: 3, completed: true, updatedAt: Date.now() } },
      { id: "offline-zahraa", name: "زهراء", avatar: `${import.meta.env.BASE_URL}avatars/avatar-panda-reader.jpg`, connected: true, micAllowed: false, handRaised: true, joinedAt: Date.now() - 240000, mission: { text: "حل ثلاثة أسئلة", target: 3, progress: 1, completed: false, updatedAt: Date.now() } },
      { id: "offline-ahmed", name: "أحمد", avatar: `${import.meta.env.BASE_URL}avatars/avatar-cat-scientist.jpg`, connected: true, micAllowed: false, joinedAt: Date.now() - 180000, mission: { text: "مراجعة الفصل الأول", target: 5, progress: 4, completed: false, updatedAt: Date.now() } },
    ],
    classroom: {
      hostId: "offline-host",
      capacity: 8,
      answersLocked: true,
      endsAt: Date.now() + 45 * 60000,
      contentMode: "booklet",
      content: { subject: openLessonContext?.subjectId || category, chapter: openLessonContext?.chapterNumber || 1, lesson: openLessonContext?.lessonNumber || 1, lessonId: openLessonContext?.lessonId, lessonTitle },
      strokes: [],
      drawingVersion: 0,
      presenterId: "offline-host",
      presenterState: null,
      studyMode: "together",
      sharedMission: "نقرأ الصفحات 1–5 خلال 15 دقيقة",
    },
  } : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [booklet, setBooklet] = useState<LessonBookletData | null>(null);
  const [bookletLoading, setBookletLoading] = useState(false);
  const [bookletError, setBookletError] = useState("");
  const [color, setColor] = useState("#facc15");
  const [size, setSize] = useState(4);
  const [draft, setDraft] = useState<Point[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [bookletItemIndex, setBookletItemIndex] = useState(0);
  const [bookletAnswerVisible, setBookletAnswerVisible] = useState(false);
  const [bookletPanelVisible, setBookletPanelVisible] = useState(true);
  const [studyWorkspace, setStudyWorkspace] = useState<"plants" | "board" | "teachers">("plants");
  const [lessonTeachers, setLessonTeachers] = useState<TeacherStory[]>([]);
  const [selectedTeacherVideo, setSelectedTeacherVideo] = useState<TeacherStory | null>(null);
  const [teachersLoading, setTeachersLoading] = useState(false);
  const [openSharedBy, setOpenSharedBy] = useState<string | null>(null);
  const [seenShareCounts, setSeenShareCounts] = useState<Record<string, number>>({});
  const [lessonMenuOpen, setLessonMenuOpen] = useState(false);
  const [micOn, setMicOn] = useState(false);
  const [roomSoundOn, setRoomSoundOn] = useState(true);
  const [answerText, setAnswerText] = useState("");
  const [lessonChoices, setLessonChoices] = useState<Array<{ lessonId: string; lessonNumber: number; title: string }>>([]);
  const [speakerMenu, setSpeakerMenu] = useState(false);
  const [exerciseMenu, setExerciseMenu] = useState(false);
  const [canvasVersion, setCanvasVersion] = useState(0);
  const [classroomExercises, setClassroomExercises] = useState<Array<{ file: string; questionIndex: number; number: number; title: string }>>([]);
  const [classroomApples, setClassroomApples] = useState(100);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [missionOpen, setMissionOpen] = useState(false);
  const [missionText, setMissionText] = useState("");
  const [missionTarget, setMissionTarget] = useState(4);
  const [workspaceExpanded, setWorkspaceExpanded] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const boardFrameRef = useRef<HTMLIFrameElement | null>(null);
  const studyWorkspaceRef = useRef<HTMLDivElement | null>(null);
  const exerciseMenuRef = useRef<HTMLDivElement | null>(null);
  const closingRef = useRef(false);
  const workspaceFullscreenRef = useRef(false);
  const historyEntryRef = useRef(false);

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
    if (studyWorkspace === "board") setStudyWorkspace("plants");
  }, [studyWorkspace]);

  useEffect(() => {
    setClassroomExercises([]);
    setExerciseMenu(false);
    setBookletItemIndex(0);
    setBookletAnswerVisible(false);
    setLessonMenuOpen(false);
  }, [currentContent.lessonId, currentContent.lessonTitle]);

  useEffect(() => {
    const receiveExercises = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "classroom_resource_state") {
        setClassroomApples(Math.max(0, Number(event.data.apples) || 0));
        return;
      }
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
    if (offlineBooklet) {
      const message = payload as { type?: string; action?: string; targetId?: string; value?: unknown; content?: ClassroomState["classroom"]["content"]; text?: string; target?: number; progress?: number; raised?: boolean; stroke?: Stroke; strokes?: Stroke[]; index?: number; answerVisible?: boolean; question?: string; answer?: string };
      setState((previous) => {
        if (!previous) return previous;
        const next: ClassroomState = {
          ...previous,
          players: previous.players.map((player) => ({ ...player, mission: player.mission ? { ...player.mission } : null })),
          classroom: { ...previous.classroom, strokes: [...previous.classroom.strokes] },
        };
        const selfPlayer = next.players.find((player) => player.id === me);
        if (message.type === "classroom_mission" && selfPlayer) {
          const target = Math.max(1, Math.min(100, Number(message.target) || 1));
          const progress = Math.max(0, Math.min(target, Number(message.progress) || 0));
          selfPlayer.mission = { text: String(message.text || "").trim().slice(0, 100), target, progress, completed: progress >= target, updatedAt: Date.now() };
        }
        if (message.type === "raise_hand" && selfPlayer) selfPlayer.handRaised = Boolean(message.raised);
        if (message.type === "classroom_booklet_navigation") {
          next.classroom.bookletIndex = Math.max(0, Number(message.index) || 0);
          next.classroom.bookletAnswerVisible = Boolean(message.answerVisible);
        }
        if (message.type === "classroom_booklet_share" && selfPlayer && message.question) {
          next.classroom.bookletShares = [...(next.classroom.bookletShares || []), { id: crypto.randomUUID(), from: selfPlayer.id, index: Number(message.index) || 0, question: message.question, answer: message.answer || "", createdAt: Date.now() }].slice(-50);
          selfPlayer.activity = "شارك سؤالاً";
        }
        if (message.type === "classroom_stroke" && message.stroke) {
          next.classroom.strokes = next.classroom.strokes.slice(-299).concat(message.stroke);
          next.classroom.drawingVersion += 1;
        }
        if (message.type === "classroom_board_share" && selfPlayer && Array.isArray(message.strokes)) {
          next.classroom.strokes = next.classroom.strokes.concat(message.strokes.map((stroke) => ({ ...stroke, owner: selfPlayer.id }))).slice(-300);
          next.classroom.drawingVersion += 1;
          selfPlayer.activity = "شارك سبورته";
          selfPlayer.activityAt = Date.now();
        }
        if (message.type === "classroom_control") {
          const targetPlayer = next.players.find((player) => player.id === message.targetId);
          if (message.action === "change_content" && message.content) {
            next.classroom.content = { ...next.classroom.content, ...message.content };
          }
          if (message.action === "shared_mission") next.classroom.sharedMission = String(message.value || "").trim().slice(0, 120);
          if (message.action === "mic_permission" && targetPlayer) targetPlayer.micAllowed = Boolean(message.value);
          if (message.action === "select_speaker" && targetPlayer) next.players.forEach((player) => { player.micAllowed = player.id === targetPlayer.id; });
          if (message.action === "select_presenter" && targetPlayer) next.classroom.presenterId = targetPlayer.id;
          if (message.action === "restore_presenter") next.classroom.presenterId = next.classroom.hostId;
          if (message.action === "answers_locked") next.classroom.answersLocked = Boolean(message.value);
          if (message.action === "clear_drawing") { next.classroom.strokes = []; next.classroom.drawingVersion += 1; }
        }
        return next;
      });
      return;
    }
    if (socketRef.current?.readyState === WebSocket.OPEN)
      socketRef.current.send(JSON.stringify(payload));
  };

  useEffect(
    () => () => {
      closingRef.current = true;
      socketRef.current?.close();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      void restoreClassroomDisplay();
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
    if (!room || classroom?.contentMode !== "booklet") return;
    const startedAt = Date.now();
    const update = () => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [room, classroom?.contentMode]);
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
      lessonKey: buildLessonKey(currentContent.subject || category, Number(currentContent.chapter) || 1, Number(currentContent.lesson) || 1),
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
    if (classroom?.contentMode !== "booklet") return;
    let cancelled = false;
    setTeachersLoading(true);
    setSelectedTeacherVideo(null);
    const context: OpenLessonContext = {
      subjectId: currentContent.subject || category,
      chapterNumber: Number(currentContent.chapter) || 1,
      lessonNumber: Number(currentContent.lesson) || 1,
      lessonId: currentContent.lessonId || `lesson-${currentContent.lesson || 1}`,
      lessonKey: buildLessonKey(currentContent.subject || category, Number(currentContent.chapter) || 1, Number(currentContent.lesson) || 1),
      title: currentContent.lessonTitle || lessonTitle,
      lessonTitle: currentContent.lessonTitle || lessonTitle,
    };
    getLessonDetails(context)
      .then((result) => {
        if (cancelled) return;
        const teachers = (result.data?.teacherStories || []).filter((story) => Boolean(story.youtubeId));
        setLessonTeachers(teachers);
      })
      .catch(() => { if (!cancelled) setLessonTeachers([]); })
      .finally(() => { if (!cancelled) setTeachersLoading(false); });
    return () => { cancelled = true; };
  }, [classroom?.contentMode, currentContent.subject, currentContent.chapter, currentContent.lesson, currentContent.lessonId, currentContent.lessonTitle, category, lessonTitle]);
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
          studyMode,
          sharedMission: sharedMissionDraft,
          contentMode: defaultMode,
          content,
        }),
      });
      const data = await response.json().catch(() => ({ error: "network_error" }));
      if (!response.ok) {
        if (data.error === "room_runtime_unavailable")
          throw new Error("غرف الأونلاين متوقفة مؤقتًا بسبب بلوغ حصة Cloudflare. حاول لاحقًا.");
        throw new Error("تعذر إنشاء الفصل.");
      }
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
    if (offlineBooklet || !initialRoomCode || room || busy) return;
    setEntry(initialRoomCode);
    setBusy(true);
    void connect(initialRoomCode)
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : "تعذر الانضمام."),
      )
      .finally(() => setBusy(false));
    // Join a selected classroom once when opened from the room hub.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRoomCode, offlineBooklet]);

  useEffect(() => {
    if (room) void enterClassroomLandscape();
  }, [room, defaultMode]);

  useEffect(() => {
    if (!room) return;
    const handleFullscreenExit = () => {
      if (document.fullscreenElement || closingRef.current) return;
      window.setTimeout(() => window.dispatchEvent(new Event("resize")), 80);
    };
    document.addEventListener("fullscreenchange", handleFullscreenExit);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenExit);
  }, [room]);

  useEffect(() => {
    if (!room || offlineBooklet || historyEntryRef.current) return;
    window.history.pushState({ ...window.history.state, liveClassroom: true }, "", window.location.href);
    historyEntryRef.current = true;
    const handleBack = () => {
      if (!historyEntryRef.current || closingRef.current) return;
      if (workspaceFullscreenRef.current) {
        workspaceFullscreenRef.current = false;
        setWorkspaceExpanded(false);
        window.setTimeout(() => window.dispatchEvent(new Event("resize")), 80);
        return;
      }
      historyEntryRef.current = false;
      closingRef.current = true;
      socketRef.current?.close();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      void restoreClassroomDisplay().finally(onClose);
    };
    window.addEventListener("popstate", handleBack);
    return () => window.removeEventListener("popstate", handleBack);
  }, [room, offlineBooklet, onClose]);

  const openStudyFullscreen = () => {
    if (workspaceFullscreenRef.current) {
      window.history.back();
      return;
    }
    workspaceFullscreenRef.current = true;
    setWorkspaceExpanded(true);
    window.history.pushState({ ...window.history.state, classroomWorkspace: true }, "", window.location.href);
    void (screen.orientation as LockableScreenOrientation).lock?.("landscape").catch(() => undefined);
    window.setTimeout(() => window.dispatchEvent(new Event("resize")), 80);
  };

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!exerciseMenuRef.current?.contains(event.target as Node))
        setExerciseMenu(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const closeClassroom = () => {
    if (closingRef.current) return;
    if (historyEntryRef.current) {
      window.history.back();
      return;
    }
    closingRef.current = true;
    socketRef.current?.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    void restoreClassroomDisplay().finally(onClose);
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
  const elapsedTimerText = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:${String(elapsedSeconds % 60).padStart(2, "0")}`;
  const isBoardPresenter = Boolean(isTeacher || classroom?.presenterId === me);
  const selectClassroomExercise = (item: { file: string; questionIndex: number; number: number }) => {
    send({ type: "classroom_control", action: "change_content", contentMode: "board", content: { ...currentContent, exerciseFile: item.file, exerciseIndex: item.questionIndex, exerciseNumber: item.number } });
    setExerciseMenu(false);
  };
  const canAnswer = Boolean(!isTeacher && !classroom?.answersLocked && !self?.answerFrozen);
  const boardUrl = `${import.meta.env.BASE_URL}solve-with-me/index.html?build=live-presenter-1&embedded=1&classroom=1&role=${isBoardPresenter ? "teacher" : "student"}&canAnswer=${canAnswer ? "1" : "0"}&subject=${encodeURIComponent(currentContent.subject || category)}&chapter=${currentContent.chapter || 1}&lesson=${currentContent.lesson || 1}&lessonId=${encodeURIComponent(currentContent.lessonId || "")}&topicTitle=${encodeURIComponent(currentContent.lessonTitle || lessonTitle)}&exerciseFile=${encodeURIComponent(currentContent.exerciseFile || "")}&exerciseIndex=${Number(currentContent.exerciseIndex || 0)}`;
  const activeExercisePosition = Math.max(0, classroomExercises.findIndex((item) => item.file === currentContent.exerciseFile && Number(item.questionIndex) === Number(currentContent.exerciseIndex || 0)));
  const completedMissions = state?.players.filter((player) => player.mission?.completed).length || 0;
  const treeStage = Math.min(12, Math.max(0, completedMissions * 2 + Math.floor(((state?.players.reduce((sum, player) => sum + (player.mission?.progress || 0), 0) || 0) / Math.max(1, state?.players.reduce((sum, player) => sum + (player.mission?.target || 0), 0) || 1)) * 5)));
  const timedTreeStage = Math.min(12, Math.floor(elapsedSeconds / 30));
  const bookletQuestions = useMemo(() => (booklet?.pages || [])
    .flatMap((page) => page.items || [])
    .filter((item): item is BookletItemQuestion => item.type === "question"), [booklet]);
  const bookletQuestion = bookletQuestions[Math.min(bookletItemIndex, Math.max(0, bookletQuestions.length - 1))];
  const openShares = openSharedBy ? (classroom?.bookletShares || []).filter((share) => share.from === openSharedBy) : [];
  const openPlayerShares = (playerId: string) => {
    const total = (classroom?.bookletShares || []).filter((share) => share.from === playerId).length;
    setSeenShareCounts((current) => ({ ...current, [playerId]: total }));
    setOpenSharedBy(playerId);
  };
  useEffect(() => {
    if (classroom?.studyMode !== "teacher") return;
    setBookletItemIndex(Math.max(0, Math.min(bookletQuestions.length - 1, Number(classroom?.bookletIndex) || 0)));
  }, [classroom?.bookletIndex, classroom?.studyMode, bookletQuestions.length]);
  useEffect(() => { if (classroom?.studyMode === "teacher") setBookletAnswerVisible(Boolean(classroom?.bookletAnswerVisible)); }, [classroom?.bookletAnswerVisible, classroom?.studyMode]);
  const navigateBooklet = (index: number, answerVisible = false) => {
    const nextIndex = Math.max(0, Math.min(bookletQuestions.length - 1, index));
    setBookletItemIndex(nextIndex);
    setBookletAnswerVisible(answerVisible);
    if (classroom?.studyMode === "teacher" && isTeacher) send({ type: "classroom_booklet_navigation", index: nextIndex, answerVisible });
  };
  const shareCurrentQuestion = () => {
    if (!bookletQuestion) return;
    send({ type: "classroom_booklet_share", index: bookletItemIndex, question: bookletQuestion.question, answer: bookletQuestion.answer });
  };
  const saveMission = (progress = 0) => {
    const text = missionText.trim();
    if (!text) return;
    send({ type: "classroom_mission", text, target: missionTarget, progress });
    setMissionOpen(false);
  };
  const updateMissionProgress = (next: number) => {
    if (!self?.mission) return;
    send({ type: "classroom_mission", text: self.mission.text, target: self.mission.target, progress: Math.max(0, Math.min(self.mission.target, next)) });
  };
  const inviteStudents = async () => {
    const url = `${window.location.origin}${window.location.pathname}?classroom=${encodeURIComponent(room)}#nahnu-maak-app`;
    const shareData = { title: "انضم إلى درس حل معي", text: `رمز الفصل: ${room}`, url };
    try {
      if (navigator.share) await navigator.share(shareData);
      else await navigator.clipboard.writeText(url);
      setInviteCopied(true);
      window.setTimeout(() => setInviteCopied(false), 1800);
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setInviteCopied(true);
        window.setTimeout(() => setInviteCopied(false), 1800);
      } catch {
        setError(`شارك رمز الفصل مع الطلاب: ${room}`);
      }
    }
  };

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
                  : "الملزمة — غرفة دراسة أونلاين"}
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
          {defaultMode === "booklet" && <>
            <label className="mt-4 block text-xs font-black">نوع الغرفة</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setStudyMode("together")} className={`rounded-2xl border p-3 text-right ${studyMode === "together" ? "border-emerald-300 bg-emerald-400/20 text-emerald-100" : "border-white/10 bg-white/5 text-slate-300"}`}><b className="block text-sm">ندرس معًا</b><small>مهام شخصية وتركيز جماعي</small></button>
              <button type="button" onClick={() => setStudyMode("teacher")} className={`rounded-2xl border p-3 text-right ${studyMode === "teacher" ? "border-cyan-300 bg-cyan-400/20 text-cyan-100" : "border-white/10 bg-white/5 text-slate-300"}`}><b className="block text-sm">مع مدرس</b><small>شرح وتحكم كامل للمضيف</small></button>
            </div>
            <label className="mt-4 block text-xs font-black">المهمة المشتركة (اختياري)</label>
            <input value={sharedMissionDraft} maxLength={120} onChange={(event) => setSharedMissionDraft(event.target.value)} placeholder="مثال: نقرأ الصفحات 1–5 خلال 15 دقيقة" className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900 p-3 text-sm" />
          </>}
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

  if (classroom?.contentMode === "booklet")
    return (
      <div className="fixed inset-0 z-[100] flex h-[100dvh] flex-col overflow-hidden bg-[#0b1d24] font-cairo text-white" dir="rtl">
        <header className="flex min-h-12 shrink-0 flex-wrap items-center justify-between gap-1 border-b border-white/10 bg-[#102832] px-2 py-1 shadow-lg sm:flex-nowrap sm:px-3">
          <div className="flex min-w-0 items-center gap-2">
            <button onClick={closeClassroom} className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-rose-500" aria-label="إغلاق الغرفة"><X className="h-5 w-5"/></button>
          <div className="min-w-0"><b className="block truncate text-xs">{currentContent.lessonTitle || lessonTitle}</b><small className="text-[9px] text-emerald-200">{offlineBooklet ? "معاينة أوفلاين" : "غرفة دراسة أونلاين"} · {state?.players.length || 0} طلاب</small></div>
          </div>
          <div className="order-3 flex w-full items-center justify-center gap-1 sm:order-none sm:w-auto">
          <div className="text-center"><span className="block text-[7px] font-black text-slate-400">مدة الدراسة</span><strong className="block font-mono text-base tracking-[.12em] text-white">{elapsedTimerText}</strong></div>
          <div className="relative z-30">
            <button onClick={() => setLessonMenuOpen((open) => !open)} className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-cyan-200/45 bg-gradient-to-br from-cyan-400/25 via-blue-500/20 to-violet-500/30 text-cyan-50 shadow-[0_0_14px_rgba(34,211,238,.18)]" aria-label="تبديل الدرس" title="تبديل الدرس"><BookOpen className="h-4 w-4"/><ArrowLeftRight className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 text-amber-300"/></button>
            {lessonMenuOpen && <div className="absolute left-0 top-11 max-h-[70dvh] w-52 overflow-y-auto rounded-2xl border border-white/15 bg-[#102832]/95 p-2 shadow-2xl backdrop-blur" dir="rtl">
              <b className="mb-2 block px-1 text-[10px] text-cyan-100">انتقل إلى درس آخر</b>
              <div className="grid grid-cols-2 gap-1.5">
                {lessonChoices.map((lesson, index) => {
                  const active = lesson.lessonId === currentContent.lessonId || lesson.lessonNumber === Number(currentContent.lesson);
                  const colors = ["from-cyan-400 to-blue-500", "from-violet-400 to-fuchsia-500", "from-amber-300 to-orange-500", "from-emerald-300 to-teal-500", "from-rose-400 to-pink-500"];
                  return <button key={lesson.lessonId} onClick={() => send({ type: "classroom_control", action: "change_content", contentMode: "booklet", content: { ...currentContent, lessonId: lesson.lessonId, lesson: lesson.lessonNumber, lessonTitle: lesson.title } })} className={`flex min-h-12 items-center gap-2 rounded-xl border px-2 py-1.5 text-right ${active ? "border-white/70 bg-white/15" : "border-white/10 bg-white/5 hover:bg-white/10"}`} title={lesson.title}>
                    <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${colors[index % colors.length]} text-[10px] font-black text-slate-950 shadow-sm`}>{lesson.lessonNumber}</span>
                    <span className="line-clamp-2 text-[8px] font-bold leading-4 text-white">{lesson.title || `الدرس ${lesson.lessonNumber}`}</span>
                  </button>;
                })}
              </div>
              {!lessonChoices.length && <p className="py-3 text-center text-[9px] text-slate-400">جارٍ تحميل الدروس…</p>}
            </div>}
          </div>
          <div className="z-20 flex items-center gap-1 rounded-xl border border-white/10 bg-black/15 p-1">
            <button onClick={() => { setStudyWorkspace((current) => current === "teachers" ? "plants" : "teachers"); setSelectedTeacherVideo(null); }} className={`grid h-8 w-8 place-items-center rounded-lg border transition ${studyWorkspace === "teachers" ? "border-violet-200 bg-violet-500 text-white shadow-[0_0_12px_rgba(139,92,246,.35)]" : "border-white/10 bg-white/5 text-slate-300"}`} aria-label="مدرسو هذا الدرس" title="مدرسو هذا الدرس"><GraduationCap className="h-4 w-4"/></button>
          </div>
          </div>
          <div className="flex items-center gap-1">
            {!offlineBooklet && <span className="rounded-lg border border-cyan-300/30 bg-cyan-400/10 px-2 py-1 font-mono text-[10px] font-black text-cyan-100" title="رمز الغرفة">#{room}</span>}
            {isTeacher && !offlineBooklet && <button onClick={() => void inviteStudents()} className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-200/40 bg-cyan-400/15 text-cyan-50 transition active:scale-95" aria-label="دعوة الطلاب" title="دعوة الطلاب"><Share2 className="h-4 w-4"/></button>}
            <button onClick={() => void toggleMic()} className={`grid h-9 w-9 place-items-center rounded-xl border ${micOn ? "border-emerald-300 bg-emerald-400 text-slate-950" : "border-white/15 bg-white/5 text-slate-200"}`} aria-label={micOn ? "إغلاق الميكروفون" : "تشغيل الميكروفون"}>{micOn ? <Mic className="h-4 w-4"/> : <MicOff className="h-4 w-4"/>}</button>
            <button onClick={() => setRoomSoundOn((enabled) => !enabled)} className={`grid h-9 w-9 place-items-center rounded-xl border ${roomSoundOn ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-100" : "border-white/15 bg-white/5 text-slate-400"}`} aria-label={roomSoundOn ? "كتم سماعة الغرفة" : "تشغيل سماعة الغرفة"}>{roomSoundOn ? <Volume2 className="h-4 w-4"/> : <VolumeX className="h-4 w-4"/>}</button>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-auto" dir="ltr">
          <div className={`relative grid min-h-full min-w-0 grid-cols-1 content-start gap-1.5 p-1.5 sm:gap-2 sm:p-2 min-[600px]:h-full min-[600px]:min-h-[360px] ${bookletPanelVisible ? "min-[600px]:grid-cols-[clamp(105px,15vw,145px)_minmax(215px,1fr)_clamp(220px,29vw,290px)]" : "min-[600px]:grid-cols-[clamp(105px,15vw,145px)_minmax(280px,1fr)]"}`}>
            {!bookletPanelVisible && <button onClick={() => setBookletPanelVisible(true)} className="absolute right-3 top-3 z-30 grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/40 bg-[#e9e2cf] text-emerald-800 shadow-lg" aria-label="إظهار الملزمة" title="إظهار الملزمة"><Eye className="h-4 w-4"/></button>}
            <aside className="max-h-36 min-h-0 overflow-y-auto rounded-2xl border border-white/10 bg-[#102832] p-2 min-[600px]:max-h-none" dir="rtl">
              <b className="mb-2 block text-center text-[10px] text-emerald-200">الطلاب وإنجازهم</b>
              <div className="space-y-2">
                {state?.players.filter((player) => player.connected || offlineBooklet).map((player, index) => {
                  const progress = player.mission?.progress || 0;
                  const target = Math.max(1, player.mission?.target || 1);
                  const ratio = Math.round((progress / target) * 100);
                  const shieldTier = Math.min(4, Math.floor((index + 1) / 2));
                  return <div key={player.id} className="rounded-xl border border-white/10 bg-white/5 p-2 text-center">
                    <div className="flex items-center gap-1.5 text-right">
                      <img src={player.avatar || `${import.meta.env.BASE_URL}avatars/avatar-owl-scholar.jpg`} alt={player.name || "طالب"} className="h-8 w-8 rounded-xl border border-emerald-300/40 object-cover"/>
                      <div className="min-w-0 flex-1"><b className="block truncate text-[10px]">{player.name || "طالب"}</b><span className="text-[8px] text-slate-300">المستوى {index + 1}</span></div>
                      <img src={`${import.meta.env.BASE_URL}assets/shields/shield-${shieldTier}.png`} alt="درع الطالب" className="h-7 w-7 object-contain"/>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-emerald-400" style={{width: `${ratio}%`}}/></div>
                    <span className="mt-1 block text-[8px] text-emerald-200">إنجاز الدرس {progress}/{target}</span>
                  </div>;
                })}
              </div>
            </aside>

            <main className="flex min-h-[55dvh] flex-col overflow-hidden rounded-2xl border-4 border-[#815536] bg-[#fffdf7] p-2 shadow-inner min-[600px]:min-h-0" dir="rtl">
              {studyWorkspace === "plants" ? <div className="mx-auto grid h-full w-full max-w-xl grid-cols-2 gap-2 overflow-y-auto content-start">
                {[...(state?.players || [])].filter((player) => player.connected || offlineBooklet).sort((a, b) => ((b.mission?.progress || 0) / Math.max(1, b.mission?.target || 1)) - ((a.mission?.progress || 0) / Math.max(1, a.mission?.target || 1))).map((player, index) => {
                  const progress = player.mission?.progress || 0;
                  const target = Math.max(1, player.mission?.target || 1);
                  const points = Math.round((progress / target) * 100);
                  const ageStage = Math.floor(Math.max(0, Date.now() - Number(player.joinedAt || Date.now())) / 30000);
                  const personalStage = Math.min(12, 1 + ageStage + Math.floor((progress / target) * 3));
                  const shareCount = (classroom?.bookletShares || []).filter((share) => share.from === player.id).length;
                  const unreadShareCount = Math.max(0, shareCount - (seenShareCounts[player.id] || 0));
                  return <div key={player.id} className={`relative flex min-h-24 flex-col items-center justify-center rounded-2xl border p-1.5 ${index === 0 ? "border-amber-300 bg-amber-50 shadow-[0_0_18px_rgba(245,158,11,.18)]" : "border-emerald-200 bg-emerald-50/60"}`}>
                    {index === 0 && <span className="absolute right-2 top-2 rounded-full bg-amber-400 px-2 py-0.5 text-[8px] font-black text-amber-950">الأول</span>}
                    <PlantStageVideo stage={personalStage} compact sound={player.id === me} className="drop-shadow-md" />
                    <b className="mt-1 text-[10px] text-emerald-950">{player.name || "طالب"}</b>
                    <span className="text-[9px] font-black text-amber-700">{points} نقطة</span>
                    <small className="mt-1 max-w-full truncate text-[8px] font-bold text-emerald-700">{player.activity || (player.mission?.completed ? "أنجز مهمته" : "يدرس الآن")}</small>
                    {shareCount > 0 && <button onClick={() => openPlayerShares(player.id)} className="absolute bottom-2 left-2 flex h-8 min-w-8 items-center justify-center rounded-full border border-emerald-300 bg-gradient-to-br from-cyan-50 to-emerald-100 px-1 text-emerald-700 shadow-md" aria-label={`${unreadShareCount} مشاركات جديدة من ${player.name || "طالب"}`}><Share2 className="h-4 w-4"/>{unreadShareCount > 0 && <b className="-mr-1 rounded-full bg-rose-500 px-1 text-[8px] text-white">{unreadShareCount}</b>}</button>}
                  </div>;
                })}
              </div> : (() => {
                const workspace = <div ref={studyWorkspaceRef} className={`${workspaceExpanded ? "fixed inset-0 z-[130] min-h-0 rounded-none border-0" : "relative min-h-44 flex-1 rounded-2xl border border-emerald-200"} overflow-hidden bg-white shadow-inner`}>
                {studyWorkspace === "board" ? <BlankStudyBoard
                  strokes={classroom?.strokes || []}
                  drawingVersion={classroom?.drawingVersion || 0}
                  canDraw={canDraw}
                  onShare={(strokes) => send({ type: "classroom_board_share", strokes })}
                /> : <div className="flex h-full min-h-44 flex-col bg-gradient-to-b from-slate-50 to-emerald-50/60">
                  <div className="shrink-0 overflow-x-auto border-b border-slate-200 bg-white/95 p-2" dir="rtl">
                    <div className="flex min-w-max items-start gap-3">
                      {teachersLoading ? <p className="px-8 py-5 text-xs text-slate-500">جارٍ تحميل المدرسين…</p> : lessonTeachers.length ? lessonTeachers.map((story) => <button key={story.id} onClick={() => setSelectedTeacherVideo(story)} className="w-20 shrink-0 text-center">
                        <span className={`mx-auto block h-14 w-14 overflow-hidden rounded-full border-2 bg-slate-100 shadow-md transition ${selectedTeacherVideo?.id === story.id ? "border-cyan-400 ring-2 ring-cyan-200" : "border-white"}`}><img src={story.storyImage || `https://img.youtube.com/vi/${story.youtubeId}/hqdefault.jpg`} alt={story.teacherName} className="h-full w-full object-cover"/></span>
                        <b className="mt-1 block truncate text-[9px] text-slate-900">{story.teacherName || "مدرس المادة"}</b>
                        <small className="block truncate text-[8px] text-slate-500">{story.channelName || story.teacherName}</small>
                      </button>) : <p className="px-5 py-4 text-xs text-slate-500">لا توجد فيديوهات مدرسين مرتبطة بهذا الدرس حاليًا.</p>}
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 bg-slate-950">
                    {selectedTeacherVideo?.youtubeId ? <iframe
                      key={`${me || "local"}-${selectedTeacherVideo.youtubeId}`}
                      className="h-full w-full border-0 bg-black"
                      src={`https://www.youtube.com/embed/${selectedTeacherVideo.youtubeId}?autoplay=0&rel=0&playsinline=1`}
                      title={`شرح ${selectedTeacherVideo.teacherName}`}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    /> : <div className="grid h-full place-items-center p-4 text-center text-slate-300"><div><GraduationCap className="mx-auto mb-2 h-8 w-8 text-cyan-300"/><b className="block text-xs">اختر مدرسًا من الشريط لعرض الفيديو</b><small className="text-[9px] text-slate-500">لن يبدأ أي فيديو تلقائيًا</small></div></div>}
                  </div>
                </div>}
                <button onClick={openStudyFullscreen} className="absolute bottom-2 left-2 z-20 grid h-9 w-9 place-items-center rounded-full border border-violet-200 bg-violet-600 text-white shadow-lg transition hover:scale-105" aria-label={workspaceExpanded ? "تصغير منطقة العرض" : "تكبير منطقة العرض"} title={workspaceExpanded ? "العودة إلى الغرفة" : "تكبير إلى ملء الشاشة"}>{workspaceExpanded ? <Minimize2 className="h-4 w-4"/> : <Maximize2 className="h-4 w-4"/>}</button>
              </div>;
                return workspaceExpanded ? createPortal(workspace, document.body) : workspace;
              })()}
            </main>

            {bookletPanelVisible && <aside className="grid min-h-[65dvh] grid-rows-[41px_minmax(0,1fr)_58px] overflow-hidden rounded-2xl border border-[#d7c9a4] bg-[#f4f0e4] text-[#24332e] shadow-xl min-[600px]:min-h-0" dir="rtl">
              <div className="flex items-center justify-between border-b border-[#d7c9a4] bg-[#e9e2cf] px-3 py-2">
                {classroom?.studyMode === "together" ? <button onClick={shareCurrentQuestion} disabled={!bookletQuestion} className="flex items-center gap-1 rounded-lg border border-emerald-700/20 bg-gradient-to-br from-white to-emerald-50 px-2 py-1 text-[8px] font-black text-emerald-800 shadow-sm disabled:opacity-40" aria-label="مشاركة السؤال مع الأعضاء"><Share2 className="h-4 w-4 text-cyan-600"/>مشاركة</button> : <span className="flex-1" aria-hidden="true" />}
                <span className="text-[9px] text-slate-500">{bookletQuestions.length ? `${Math.min(bookletItemIndex + 1, bookletQuestions.length)}/${bookletQuestions.length}` : "—"}</span>
                <button onClick={() => setBookletPanelVisible(false)} className="grid h-7 w-7 place-items-center rounded-lg border border-emerald-700/20 bg-white/70 text-emerald-800" aria-label="إخفاء الملزمة" title="إخفاء الملزمة"><EyeOff className="h-3.5 w-3.5"/></button>
              </div>
              <div className="min-h-0 overflow-y-auto overscroll-contain p-4">
                {bookletLoading ? <p className="text-center text-xs text-slate-500">جارٍ تحميل السؤال…</p> : bookletQuestion ? <>
                  <div className="mb-3 flex items-center gap-2">
                    <button onClick={() => navigateBooklet(bookletItemIndex, !bookletAnswerVisible)} className="rounded-lg bg-emerald-800 px-3 py-1.5 text-[9px] font-black text-white">{bookletAnswerVisible ? "إخفاء الجواب" : "إظهار الجواب"}</button>
                  </div>
                  <span className="mb-2 text-[9px] font-black text-emerald-700">السؤال {bookletItemIndex + 1}</span>
                  <p className="text-sm font-black leading-7">{bookletQuestion.question}</p>
                  {bookletAnswerVisible && <div className="mt-3 rounded-xl border border-emerald-700/15 bg-white/70 p-3 text-xs font-bold leading-6 text-emerald-950">{bookletQuestion.answer}</div>}
                </> : <p className="text-center text-xs leading-6 text-slate-500">لا توجد أسئلة مفردة في ملزمة هذا الدرس.</p>}
              </div>
              <div className="z-10 grid h-[58px] grid-cols-2 gap-2 border-t border-[#d7c9a4] bg-[#f4f0e4] p-2 shadow-[0_-8px_18px_rgba(36,51,46,.08)]">
                <button disabled={bookletItemIndex <= 0 || (classroom?.studyMode === "teacher" && !isTeacher)} onClick={() => navigateBooklet(bookletItemIndex - 1)} className="flex items-center justify-center gap-1 rounded-xl bg-white/70 py-2 text-[10px] font-black disabled:opacity-35"><ChevronRight className="h-4 w-4"/>السابق</button>
                <button disabled={bookletItemIndex >= bookletQuestions.length - 1 || (classroom?.studyMode === "teacher" && !isTeacher)} onClick={() => navigateBooklet(bookletItemIndex + 1)} className="flex items-center justify-center gap-1 rounded-xl bg-emerald-700 py-2 text-[10px] font-black text-white disabled:opacity-35">التالي<ChevronLeft className="h-4 w-4"/></button>
              </div>
            </aside>}
          </div>
        </div>
        {openSharedBy && <div className="absolute inset-0 z-50 grid place-items-center bg-slate-950/45 p-6" onClick={() => setOpenSharedBy(null)} role="presentation"><section onClick={(event) => event.stopPropagation()} className="max-h-[72vh] w-full max-w-md overflow-y-auto rounded-3xl border border-emerald-200 bg-[#fffdf7] p-5 text-right text-[#24332e] shadow-2xl" dir="rtl"><div className="mb-3 flex items-center justify-between"><b className="text-sm">الأسئلة المشاركة</b><button onClick={() => setOpenSharedBy(null)} className="rounded-full bg-slate-100 p-1" aria-label="إغلاق"><X className="h-4 w-4"/></button></div><div className="space-y-3">{openShares.slice().reverse().map((share) => <article key={share.id} className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-3"><small className="font-black text-emerald-700">السؤال {share.index + 1}</small><p className="mt-1 text-sm font-black leading-7">{share.question}</p><div className="mt-2 rounded-xl bg-white p-3 text-xs font-bold leading-6">{share.answer || "لا توجد إجابة مسجلة."}</div></article>)}</div></section></div>}
      </div>
    );

  return (
    <div
      className="live-classroom-root fixed inset-0 z-[100] flex h-[100dvh] flex-col overflow-hidden bg-[#071126] font-cairo text-white"
      dir="rtl"
    >
      <header className={`flex shrink-0 items-center justify-between gap-2 bg-gradient-to-l from-[#091a36] to-[#10184a] px-2 py-2 shadow-lg sm:px-3 ${classroom?.contentMode === "board" ? "flex-nowrap" : "flex-wrap"}`}>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            onClick={closeClassroom}
            className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-fuchsia-500 to-rose-500 text-white shadow-[0_0_18px_rgba(244,63,94,.35)]"
          >
            <X />
          </button>
          <div className="min-w-0">
            <b className="block truncate text-sm">
              {currentContent.lessonTitle || lessonTitle}
            </b>
            <small className="text-cyan-300">
            {offlineBooklet ? "تجربة أوفلاين" : `رمز الفصل: ${room}`} ·{" "}
              {Math.max(0, (state?.players.length || 1) - 1)}/
              {classroom?.capacity || capacity} طالب
            </small>
          </div>
          {isTeacher && !offlineBooklet && <button onClick={() => void inviteStudents()} className={`flex h-9 items-center justify-center gap-1 rounded-xl border border-cyan-200/40 bg-cyan-400/15 text-[11px] font-black text-cyan-50 transition active:scale-95 ${classroom?.contentMode === "board" ? "w-9 shrink-0" : "px-2"}`} aria-label="دعوة الطلاب" title={inviteCopied ? "تم نسخ الدعوة" : "دعوة الطلاب"}><Share2 className="h-4 w-4"/>{classroom?.contentMode !== "board" && (inviteCopied ? "تم النسخ" : "دعوة")}</button>}
          {offlineBooklet && <span className="hidden rounded-xl border border-amber-300/40 bg-amber-400/15 px-2 py-1 text-[10px] font-black text-amber-100 sm:inline">وضع المعاينة — لا يحتاج إنترنت للغرفة</span>}
        </div>
        {isTeacher && classroom?.contentMode === "board" && <div className="flex min-w-0 flex-1 items-center justify-center gap-1.5">
          <div className="relative" ref={exerciseMenuRef}>
            <button onClick={()=>setExerciseMenu(value=>!value)} className="flex h-9 items-center gap-1.5 rounded-xl border border-emerald-200/50 bg-gradient-to-br from-emerald-400/30 to-teal-700/60 px-3 text-xs font-black text-white shadow-lg" aria-label="عرض قائمة التمارين"><Grid2X2 className="h-4 w-4"/><span>التمارين {classroomExercises.length?activeExercisePosition+1:0}/{classroomExercises.length}</span></button>
            {exerciseMenu&&<div className="absolute left-1/2 top-11 z-[140] grid max-h-[60dvh] w-48 -translate-x-1/2 grid-cols-4 gap-1.5 overflow-y-auto rounded-2xl border border-emerald-300/35 bg-slate-950/95 p-2 shadow-2xl backdrop-blur">{classroomExercises.map((item,index)=><button key={`${item.file}-${item.questionIndex}`} onClick={()=>selectClassroomExercise(item)} className={`rounded-xl px-2 py-2 text-xs font-black ${index===activeExercisePosition?"bg-emerald-400 text-slate-950":"bg-white/10 text-white hover:bg-emerald-600"}`}>{index+1}</button>)}</div>}
          </div>
          <button onClick={()=>setSpeakerMenu(value=>!value)} className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-300/35 bg-gradient-to-br from-cyan-400 to-indigo-600" aria-label="أدوات الفصل"><Radio className="h-4 w-4"/></button>
          <button onClick={()=>send({type:"classroom_control",action:"answers_locked",value:!classroom?.answersLocked})} className={`grid h-9 w-9 place-items-center rounded-xl border ${classroom?.answersLocked?"border-sky-200 bg-sky-500":"border-violet-200/50 bg-violet-600"}`} aria-label={classroom?.answersLocked?"فتح الإجابات":"تجميد الإجابات"}>{classroom?.answersLocked?<UnlockKeyhole className="h-4 w-4"/>:<LockKeyhole className="h-4 w-4"/>}</button>
          <span className="flex h-9 items-center gap-1 rounded-xl border border-emerald-300/30 bg-emerald-400/15 px-2 text-[11px] font-black text-emerald-100"><Apple className="h-4 w-4 fill-emerald-300"/>{classroomApples}</span>
        </div>}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 font-mono text-cyan-100 shadow-inner">
            <Clock3 className="h-4 w-4" />
            {timerText}
          </span>
          {!isTeacher && <button onClick={() => void toggleMic()} disabled={!self?.micAllowed} className={`rounded-full p-2.5 ${micOn ? "bg-emerald-400 text-slate-950" : "bg-white/10"} disabled:opacity-35`}>{micOn ? <Mic /> : <MicOff />}</button>}
        </div>
      </header>
      {classroom?.contentMode === "booklet" && <div className="border-b border-amber-200/20 bg-gradient-to-l from-amber-950/95 via-[#17304a] to-emerald-950/95 px-3 py-2">
        <div className="mx-auto flex max-w-6xl items-center gap-2">
          <Target className="h-5 w-5 shrink-0 text-amber-300" />
          {isTeacher ? <div className="flex min-w-0 flex-1 gap-2"><input value={sharedMissionDraft || classroom.sharedMission || ""} onChange={(event) => setSharedMissionDraft(event.target.value)} placeholder="اكتب المهمة المشتركة للغرفة" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white"/><button onClick={() => send({ type: "classroom_control", action: "shared_mission", value: sharedMissionDraft })} className="rounded-xl bg-amber-400 px-3 text-xs font-black text-slate-950">اعتماد</button></div> : <p className="min-w-0 flex-1 truncate text-xs font-bold text-amber-50">{classroom.sharedMission || "حدّد مهمتك وابدأ الدراسة مع زملائك"}</p>}
          <span className="hidden rounded-full bg-white/10 px-3 py-1 text-[10px] text-emerald-200 sm:inline">{classroom.studyMode === "together" ? "ندرس معًا" : "مع مدرس"}</span>
        </div>
      </div>}
      {isTeacher && classroom?.contentMode === "board" && speakerMenu && <div className="fixed inset-x-2 top-14 z-[150] max-h-[72dvh] overflow-y-auto rounded-3xl border border-cyan-300/25 bg-slate-950/95 p-3 shadow-2xl backdrop-blur" dir="rtl">
        <div className="mb-3 flex items-center justify-between"><div><b className="block text-cyan-200">أدوات الفصل</b><small className="text-slate-400">التحكم بالتحدث والإجابات والشرح</small></div><button onClick={()=>setSpeakerMenu(false)} className="rounded-full bg-white/10 p-2"><X className="h-4 w-4"/></button></div>
        {classroom?.presenterId && classroom.presenterId !== me && <button onClick={()=>send({type:"classroom_control",action:"restore_presenter"})} className="mb-3 w-full rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 p-3 font-black text-slate-950">استعادة الكتابة والشرح للمعلم</button>}
        <div className="space-y-2">{state?.players.filter(player=>player.id!==me).map(player=><div key={player.id} className={`rounded-2xl border p-3 ${player.handRaised?"border-amber-300 bg-amber-400/10":"border-white/10 bg-white/5"}`}><div className="flex items-center justify-between gap-2"><div className="min-w-0"><b className="block truncate">{player.handRaised?"✋ ":""}{player.name||"طالب"}</b><small className="text-slate-400">{player.connected?"متصل":"غير متصل"}</small></div></div>{player.lastAnswer&&<div className="mt-2 rounded-xl bg-slate-900 p-2 text-[11px] text-cyan-100">آخر إجابة: {player.lastAnswer}</div>}<div className="mt-2 grid grid-cols-3 gap-1.5"><button onClick={()=>send({type:"classroom_control",action:"select_speaker",targetId:player.id})} className="rounded-xl bg-white/10 p-2 text-[10px] font-black"><Mic className="mx-auto mb-1 h-4 w-4"/>تحدث</button><button onClick={()=>send({type:"classroom_control",action:"answer_permission",targetId:player.id,value:player.answerFrozen})} className="rounded-xl bg-white/10 p-2 text-[10px] font-black"><Snowflake className="mx-auto mb-1 h-4 w-4"/>{player.answerFrozen?"فتح":"تجميد"}</button><button onClick={()=>send({type:"classroom_control",action:"select_presenter",targetId:player.id})} className="rounded-xl bg-white/10 p-2 text-[10px] font-black"><PenLine className="mx-auto mb-1 h-4 w-4"/>شرح</button></div></div>)}</div>
      </div>}
      {isTeacher && classroom?.contentMode === "booklet" && (
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
      <main className={`relative min-h-0 flex-1 overflow-y-auto overscroll-contain text-slate-900 ${classroom?.contentMode === "booklet" ? "bg-[#102739]" : "bg-slate-100"}`}>
        <div className={`relative mx-auto min-h-0 w-full ${classroom?.contentMode === "booklet" ? "grid h-auto max-w-[1600px] grid-cols-1 gap-3 p-2 sm:p-3 lg:h-full lg:grid-cols-[220px_minmax(0,1fr)_190px]" : "h-full"}`}>
          {classroom?.contentMode === "booklet" ? (
            <>
              <aside className="order-2 flex gap-2 overflow-x-auto rounded-3xl border border-white/10 bg-[#0a1a27]/90 p-2 lg:order-1 lg:flex-col lg:overflow-y-auto">
                <div className="hidden items-center justify-between px-1 text-white lg:flex"><b className="text-xs">رفاق الدراسة</b><span className="text-[10px] text-emerald-300">{state?.players.filter((player) => player.connected).length || 0} متصل</span></div>
                {state?.players.map((player) => {
                  const ratio = player.mission ? Math.round((player.mission.progress / Math.max(1, player.mission.target)) * 100) : 0;
                  return <div key={player.id} className={`relative w-44 shrink-0 overflow-hidden rounded-2xl border p-2 text-white lg:w-full ${player.id === me ? "border-cyan-300/70 bg-cyan-500/15" : player.mission?.completed ? "border-emerald-300/60 bg-emerald-500/15" : "border-white/10 bg-white/5"}`}>
                    <div className="flex items-center gap-2">
                      <div className="relative"><img src={player.avatar || `${import.meta.env.BASE_URL}avatars/avatar-owl-scholar.jpg`} alt={player.name || "طالب"} className={`h-11 w-11 rounded-2xl border-2 object-cover ${player.mission?.completed ? "border-emerald-300" : "border-white/20"}`}/><span className={`absolute -bottom-1 -left-1 h-3 w-3 rounded-full border-2 border-[#0a1a27] ${player.connected ? "bg-emerald-400" : "bg-slate-500"}`}/></div>
                      <div className="min-w-0 flex-1"><b className="block truncate text-xs">{player.id === me ? `${player.name || "طالب"} (أنت)` : player.name || "طالب"}</b><span className="flex items-center gap-1 text-[9px] text-slate-300">{player.micAllowed ? <Mic className="h-3 w-3 text-emerald-300"/> : <MicOff className="h-3 w-3"/>}{player.handRaised ? "رفع يده" : player.mission?.completed ? "أنجز مهمته" : "يدرس الآن"}</span></div>
                    </div>
                    <div className="mt-2 min-h-8 rounded-xl bg-black/20 px-2 py-1 text-[10px] text-slate-200">{player.mission?.text || "لم يحدد مهمة بعد"}</div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full rounded-full ${player.mission?.completed ? "bg-emerald-400" : "bg-cyan-400"}`} style={{ width: `${ratio}%` }}/></div>
                    <div className="mt-1 flex justify-between text-[9px] text-slate-400"><span>{player.mission ? `${player.mission.progress}/${player.mission.target}` : "بانتظار المهمة"}</span><span>{ratio}%</span></div>
                  </div>;
                })}
              </aside>
              <section className="order-1 relative min-h-[70dvh] overflow-visible rounded-[1.5rem] border-4 border-[#7c4a2d] bg-[#f8f1dc] shadow-[0_18px_50px_rgba(0,0,0,.35)] sm:rounded-[2rem] sm:border-[6px] lg:order-2 lg:min-h-0 lg:overflow-auto">
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-amber-900/10 bg-[#fffaf0]/95 px-4 py-2 backdrop-blur"><span className="flex items-center gap-2 text-xs font-black text-amber-950"><BookOpen className="h-4 w-4"/>الملزمة المشتركة</span><span className="text-[10px] text-amber-800">{currentContent.lessonTitle || lessonTitle}</span></div>
                <div className="p-3"><LessonBookletView bookletData={booklet} isLoading={bookletLoading} error={bookletError || undefined} lessonTitle={currentContent.lessonTitle || lessonTitle}/></div>
                <canvas
                  ref={canvasRef}
                  className={`pointer-events-none absolute inset-0 z-20 h-full w-full touch-auto lg:touch-none ${canDraw ? "lg:pointer-events-auto lg:cursor-crosshair" : ""}`}
                  onPointerDown={(event) => {
                    if (canDraw) {
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setDraft([point(event)]);
                    }
                  }}
                  onPointerMove={(event) => {
                    if (canDraw && draft.length) setDraft((value) => [...value, point(event)]);
                  }}
                  onPointerUp={(event) => {
                    if (draft.length > 1) send({ type: "classroom_stroke", stroke: { id: crypto.randomUUID(), color, size, points: [...draft, point(event)] } });
                    setDraft([]);
                  }}
                />
              </section>
              <aside className="order-3 hidden flex-col items-center justify-between overflow-hidden rounded-3xl border border-emerald-200/15 bg-gradient-to-b from-[#102d35] to-[#071b21] p-3 text-center text-white lg:flex">
                <div><TreePine className="mx-auto h-5 w-5 text-emerald-300"/><b className="mt-1 block text-xs">شجرة التركيز</b><small className="text-[9px] text-slate-400">تنمو بإنجاز مهام المجموعة</small></div>
                <img src={`${import.meta.env.BASE_URL}assets/tree-stages/stage-${String(treeStage).padStart(2, "0")}.png`} alt="شجرة تقدم المجموعة" className="my-3 max-h-48 w-full object-contain drop-shadow-[0_12px_18px_rgba(16,185,129,.25)]"/>
                <div className="w-full rounded-2xl bg-white/5 p-2"><b className="block text-lg text-emerald-300">{completedMissions}</b><small className="text-[9px] text-slate-300">مهمة مكتملة</small></div>
              </aside>
            </>
          ) : (
            <iframe
              key={`${currentContent.exerciseFile || "first"}:${Number(currentContent.exerciseIndex || 0)}`}
              ref={boardFrameRef}
              src={boardUrl}
              onLoad={() => {
                if (!isBoardPresenter && classroom?.presenterState) boardFrameRef.current?.contentWindow?.postMessage(
                  { type: "classroom_apply_presenter_state", state: classroom.presenterState },
                  window.location.origin,
                );
              }}
              title="الصبورة المباشرة"
              className="h-full min-h-0 w-full border-0 bg-white"
              allow="fullscreen; clipboard-write"
            />
          )}
          {!isTeacher && classroom?.answersLocked && (
            <div className="pointer-events-none fixed inset-x-4 bottom-24 z-30 mx-auto max-w-sm rounded-3xl border border-cyan-200/70 bg-cyan-100/90 p-4 text-center text-cyan-950 shadow-[0_0_35px_rgba(125,211,252,.8)] backdrop-blur">
              <Snowflake className="mx-auto mb-1 animate-pulse" />
              <b>الإجابات مجمّدة حتى يسمح المدرس</b>
            </div>
          )}
        </div>
      </main>
      {missionOpen && <div className="fixed inset-0 z-[180] grid place-items-center bg-slate-950/75 p-4 backdrop-blur-sm" onClick={() => setMissionOpen(false)}><div className="w-full max-w-sm rounded-3xl border border-emerald-300/30 bg-[#0d2230] p-5 text-white shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between"><div><b className="flex items-center gap-2 text-emerald-200"><Target className="h-5 w-5"/>مهمتي في الجلسة</b><small className="text-slate-400">اختر هدفًا واضحًا يمكنك إنجازه</small></div><button onClick={() => setMissionOpen(false)} className="rounded-full bg-white/10 p-2"><X className="h-4 w-4"/></button></div><div className="mt-4 grid grid-cols-2 gap-2">{["قراءة صفحات", "حل أسئلة", "تلخيص الدرس", "حفظ تعريفات"].map((preset) => <button key={preset} onClick={() => setMissionText(preset)} className="rounded-xl border border-white/10 bg-white/5 p-2 text-xs hover:border-emerald-300">{preset}</button>)}</div><input value={missionText} maxLength={100} onChange={(event) => setMissionText(event.target.value)} placeholder="اكتب مهمتك" className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 p-3 text-sm"/><label className="mt-3 block text-xs font-bold">العدد المطلوب: <b className="text-emerald-300">{missionTarget}</b></label><input type="range" min="1" max="20" value={missionTarget} onChange={(event) => setMissionTarget(Number(event.target.value))} className="mt-2 w-full accent-emerald-400"/><button onClick={() => saveMission(0)} disabled={!missionText.trim()} className="mt-4 w-full rounded-2xl bg-gradient-to-l from-emerald-400 to-cyan-400 py-3 font-black text-slate-950 disabled:opacity-40">ابدأ المهمة</button></div></div>}
      <footer className="shrink-0 overflow-x-auto border-t border-white/10 bg-slate-950 p-2">
        <div className="flex min-w-max items-center gap-2">
          {classroom?.contentMode === "booklet" && <>
            <button onClick={() => { setMissionText(self?.mission?.text || ""); setMissionTarget(self?.mission?.target || 4); setMissionOpen(true); }} className="flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-slate-950"><Target className="h-4 w-4"/>{self?.mission ? "تعديل مهمتي" : "اختر مهمتك"}</button>
            {self?.mission && <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1"><button onClick={() => updateMissionProgress(self.mission!.progress - 1)} className="grid h-8 w-8 place-items-center rounded-lg bg-white/10">−</button><span className="min-w-12 text-center text-xs font-black text-white">{self.mission.progress}/{self.mission.target}</span><button onClick={() => updateMissionProgress(self.mission!.progress + 1)} className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-500 text-slate-950">+</button>{self.mission.completed && <CheckCircle2 className="mx-1 h-5 w-5 text-emerald-300"/>}</div>}
          </>}
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
