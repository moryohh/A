import React, { useState, useRef, useEffect, useMemo } from 'react';
import spaceBiomeImg from '../assets/images/space_minimal_void_1786901269341.webp';
import deepSeaBiomeImg from '../assets/images/ocean_clean_biome_1786901297268.webp';
import biome1Img from '../assets/images/biome1_snow_mountain_1786898662715.webp';
import biome2Img from '../assets/images/biome2_green_farm_1786898677268.webp';
import biome3Img from '../assets/images/biome3_harbor_refinery_1786898690005.webp';
import biome4Img from '../assets/images/biome4_night_realm_1786898703967.webp';
import biologyChapterCardsImg from '../assets/images/biology-chapter-cards-v1.webp';
import { SubjectChapter, SubjectChapterLesson } from '../types';
import { useAppTheme } from '../services/themeService';
import { appSfx } from '../utils/appSfx';
import { formatArabicLessonTitle } from '../services/lessonsService';
import { ChapterExamIcons } from './ChapterExamIcons';
import { LaboratoryBalloon } from './LaboratoryBalloon';
import {
  Check,
  Lock,
  Play,
  Star,
  Sparkles,
  Gift,
  BookOpen,
  ClipboardCheck,
  ChevronDown,
  Layers,
  X,
  Loader2,
  ArrowRight,
} from 'lucide-react';

interface AdventureWorldMapProps {
  chapters: SubjectChapter[];
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  activeLesson: SubjectChapterLesson | null;
  onSelectLesson: (lesson: SubjectChapterLesson) => void;
  onOpenChest: (chestId: string) => void;
  openedChests: string[];
  selectedChapterNumber?: number;
  onSelectChapterNumber?: (chapterNumber: number) => void;
  selectedChapterIndex?: number;
  onSelectChapter?: (chapterIndex: number) => void;
  isLoadingLessons?: boolean;
  isLoadingChapters?: boolean;
  onBack?: () => void;
  onScoreUpdate?: (points: number) => void;
  onOpenLaboratory?: (chapterNumber: number) => void;
}

// Exactly 6 images preserved in their strict original sequence
const ALL_SIX_IMAGES = [
  { id: 'space', img: spaceBiomeImg, name: 'الفضاء الخارجي' },
  { id: 'ocean', img: deepSeaBiomeImg, name: 'أعماق البحار والمحيط' },
  { id: 'mountain', img: biome1Img, name: 'جبال الثلج والقلعة' },
  { id: 'farm', img: biome2Img, name: 'الجزيرة والمزرعة الخضراء' },
  { id: 'harbor', img: biome3Img, name: 'الميناء ومصفاة النفط' },
  { id: 'night', img: biome4Img, name: 'عالم الليل والبلورات' },
];

export const AdventureWorldMap: React.FC<AdventureWorldMapProps> = ({
  chapters,
  subjectId,
  subjectName,
  subjectColor,
  activeLesson,
  onSelectLesson,
  onOpenChest,
  openedChests,
  selectedChapterNumber: controlledChapterNumber,
  onSelectChapterNumber,
  selectedChapterIndex: controlledChapterIndex,
  onSelectChapter,
  isLoadingLessons = false,
  isLoadingChapters = false,
  onBack,
  onScoreUpdate,
  onOpenLaboratory,
}) => {
  const { theme } = useAppTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const activeNodeRef = useRef<HTMLDivElement>(null);
  const chapterSelectorRef = useRef<HTMLDivElement>(null);

  // Selected Chapter State & Dropdown
  const [internalChapterIndex, setInternalChapterIndex] = useState<number>(0);

  const selectedChapterIndex = useMemo(() => {
    if (controlledChapterNumber !== undefined) {
      const idx = chapters.findIndex((c) => c.number === controlledChapterNumber);
      if (idx !== -1) return idx;
    }
    if (controlledChapterIndex !== undefined) {
      return controlledChapterIndex;
    }
    return internalChapterIndex;
  }, [controlledChapterNumber, controlledChapterIndex, internalChapterIndex, chapters]);

  const [isChapterDropdownOpen, setIsChapterDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    if (!isChapterDropdownOpen) return;
    const closeOnOutsidePress = (event: PointerEvent) => {
      if (!chapterSelectorRef.current?.contains(event.target as Node)) {
        setIsChapterDropdownOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeOnOutsidePress, true);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePress, true);
  }, [isChapterDropdownOpen]);

  // Selected lesson modal
  const [previewLesson, setPreviewLesson] = useState<{
    lesson: SubjectChapterLesson;
    chapter: SubjectChapter;
  } | null>(null);
  const [examPickerRequest, setExamPickerRequest] = useState(0);

  const currentChapter = chapters[selectedChapterIndex] || chapters[0];

  // Dynamic lessons for the active chapter
  const currentChapterLessons = currentChapter?.lessons || [];
  const displayLessonsCount = Math.max(currentChapterLessons.length, currentChapter?.lessonsCount || 0, 1);

  // Flatten active chapter lessons
  const allLessons: { lesson: SubjectChapterLesson; chapter: SubjectChapter; index: number }[] = [];
  if (currentChapter) {
    currentChapterLessons.forEach((l, idx) => {
      allLessons.push({
        lesson: l,
        chapter: currentChapter,
        index: idx,
      });
    });
  }

  // Ensure total steps count matches the exact dynamic lessons count of the selected chapter
  const totalStepsCount = displayLessonsCount;

  const scrollActiveNodeWithinMap = (behavior: ScrollBehavior = 'smooth') => {
    const container = containerRef.current;
    const node = activeNodeRef.current;
    if (!container) return;

    if (!node) {
      container.scrollTo({ top: 0, behavior });
      return;
    }

    // Calculate the target from the map container itself so window/page scroll never moves.
    const nodeTop = node.offsetTop;
    const targetTop = Math.max(
      0,
      Math.min(
        container.scrollHeight - container.clientHeight,
        nodeTop - container.clientHeight / 2 + node.offsetHeight / 2
      )
    );
    container.scrollTo({ top: targetTop, behavior });
  };

  // Active 3 images based on the selected section (chapter)
  // Chapter 1, 3, 5... (even index 0, 2, 4): First 3 images (Set A: 0, 1, 2)
  // Chapter 2, 4, 6... (odd index 1, 3, 5): Next 3 images (Set B: 3, 4, 5)
  const activeImages = useMemo(() => {
    const isFirstSet = selectedChapterIndex % 2 === 0;
    return isFirstSet ? ALL_SIX_IMAGES.slice(0, 3) : ALL_SIX_IMAGES.slice(3, 6);
  }, [selectedChapterIndex]);

  // Completed lesson IDs state
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    const initialCompleted = allLessons
      .filter((l) => l.lesson.status === 'completed')
      .map((l) => l.lesson.id);
    if (initialCompleted.length === 0 && allLessons.length > 0) {
      return allLessons.slice(0, 3).map((l) => l.lesson.id);
    }
    return initialCompleted;
  });

  // Auto-scroll to active node or start of chapter on change
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollActiveNodeWithinMap('smooth');
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedChapterIndex, totalStepsCount]);

  const scrollToChapter = (chapter: SubjectChapter, chapterIndex: number) => {
    appSfx.chapterSelect();
    setInternalChapterIndex(chapterIndex);
    if (onSelectChapterNumber) {
      onSelectChapterNumber(chapter.number);
    }
    onSelectChapter?.(chapterIndex);
    setIsChapterDropdownOpen(false);
  };

  const scrollToActiveNode = () => {
    scrollActiveNodeWithinMap('smooth');
  };

  // Generate nodes distributed across all 3 images (Y: 250 at top to 5750 at bottom)
  // 3 images * 2000px = 6000px total height
  const MAP_BOTTOM = 5750;
  const MAP_TOP = 250;

  const nodes = Array.from({ length: totalStepsCount }, (_, i) => {
    let x = 500;
    let y = MAP_BOTTOM;

    if (totalStepsCount === 1) {
      x = 500;
      y = (MAP_BOTTOM + MAP_TOP) / 2;
    } else {
      const u = i / (totalStepsCount - 1); // 0 (bottom lesson 1) to 1 (top last lesson)
      y = MAP_BOTTOM - u * (MAP_BOTTOM - MAP_TOP);

      // Smooth S-curve spanning the 3 images
      const sCurve = Math.sin(u * Math.PI * (totalStepsCount > 5 ? 3.5 : 2.5)) * 260;
      const wave = Math.cos(u * Math.PI * 1.5) * 50;
      x = Math.max(190, Math.min(810, Math.round(500 + sCurve + wave)));
    }

    const lessonItem = allLessons[i] || null;
    const lessonId = lessonItem?.lesson.id || `ch-${selectedChapterIndex + 1}-lesson-${i + 1}`;
    const isCompleted = completedLessonIds.includes(lessonId);

    let status: 'completed' | 'in_progress' | 'available' | 'locked' = 'locked';
    if (isCompleted) {
      status = 'completed';
    } else if (lessonItem) {
      status = lessonItem.lesson.status === 'completed' ? 'completed' : lessonItem.lesson.status;
    } else {
      if (i === 0) status = 'in_progress';
      else status = 'available';
    }

    const isCurrentActive =
      status === 'in_progress' ||
      (activeLesson && lessonItem?.lesson.id === activeLesson.id) ||
      (!isCompleted && i === 0);

    const isCrown = i === totalStepsCount - 1 && totalStepsCount > 1;

    return {
      index: i + 1,
      x,
      y,
      lessonItem,
      lessonId,
      status: isCompleted ? 'completed' : status,
      isCompleted,
      isCurrentActive,
      isCrown,
    };
  });

  // Calculate path segments between consecutive nodes
  const pathSegments = nodes.slice(0, -1).map((curr, idx) => {
    const next = nodes[idx + 1];
    const midY = (curr.y + next.y) / 2;
    const tension = (next.x - curr.x) * 0.15;
    const d = `M ${curr.x} ${curr.y} C ${curr.x - tension} ${midY}, ${next.x + tension} ${midY}, ${next.x} ${next.y}`;
    const isSegmentDone = curr.isCompleted;
    return { d, isSegmentDone, index: idx };
  });

  const fullPathD = nodes.reduce((acc, curr, idx) => {
    if (idx === 0) return `M ${curr.x} ${curr.y}`;
    const prev = nodes[idx - 1];
    const midY = (prev.y + curr.y) / 2;
    const tension = (curr.x - prev.x) * 0.15;
    return `${acc} C ${prev.x + tension} ${midY}, ${curr.x - tension} ${midY}, ${curr.x} ${curr.y}`;
  }, '');

  // 3 treasure chests for the 3 active images
  const chapterChests = [
    { id: `chest-top-ch${selectedChapterIndex + 1}`, y: 1100, x: 260, label: 'كنز القمة' },
    { id: `chest-mid-ch${selectedChapterIndex + 1}`, y: 3100, x: 740, label: 'كنز المسار' },
    { id: `chest-bot-ch${selectedChapterIndex + 1}`, y: 5100, x: 260, label: 'كنز الانطلاق' },
  ];
  // Place the laboratory over the upper-left snowy mountain, away from lessons.
  // For alternate biome chapters, keep it in the corresponding third image, never in space.
  const balloonY = 4420;
  const balloonX = nodes.some((node) => Math.abs(node.y - balloonY) < 310 && node.x < 390) ? 825 : 200;

  return (
    <div className="relative w-full max-w-xl mx-auto flex flex-col items-center select-none font-cairo">
      {/* ========================================================= */}
      {/* 🧭 CHAPTER SELECTOR DROPDOWN (اختر الفصل / تحديد الفصل) */}
      {/* ========================================================= */}
      <div className="sticky top-1 z-40 w-full mb-1.5">
          <div
            className="flex flex-row-reverse items-center justify-between gap-2 rounded-2xl border p-1.5 text-white shadow-2xl backdrop-blur-md transition-all duration-300 sm:p-2"
          style={{
            backgroundColor: `${theme.colors.bgCard}F2`,
            borderColor: `${theme.colors.primary}60`,
            boxShadow: `0 8px 30px ${theme.colors.glow}`,
          }}
        >
          
          {/* Main Chapter Selector Button */}
          <div ref={chapterSelectorRef} className="relative min-w-0 flex-1">
            <button
              onClick={() => {
                if (isLoadingChapters) return;
                if (isChapterDropdownOpen) appSfx.panelClose();
                else appSfx.panelOpen();
                setIsChapterDropdownOpen(!isChapterDropdownOpen);
              }}
              disabled={isLoadingChapters}
              className={`group relative flex min-h-[58px] w-full cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-2xl border border-cyan-200/50 bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 px-3.5 py-2.5 text-white shadow-[0_10px_30px_rgba(37,99,235,.38)] transition-all duration-300 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98] disabled:cursor-wait ${isChapterDropdownOpen ? 'ring-2 ring-cyan-300/60 shadow-[0_14px_38px_rgba(99,102,241,.48)]' : ''}`}
              aria-expanded={isChapterDropdownOpen}
              aria-haspopup="listbox"
            >
              <span className="pointer-events-none absolute -right-5 -top-8 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
              <span className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />
              <div className="relative flex min-w-0 items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/35 bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,.45),0_7px_18px_rgba(0,0,0,.18)] transition-transform duration-300 group-hover:rotate-[-5deg] group-hover:scale-110">
                  {isLoadingChapters ? (
                    <Loader2 className="h-5 w-5 animate-spin text-amber-200" />
                  ) : (
                    <Layers className="h-5 w-5 drop-shadow" />
                  )}
                </div>
                <div className="text-right min-w-0">
                  <div className="text-sm font-black leading-5 drop-shadow sm:text-base">{isLoadingChapters ? 'جاري جلب الفصول...' : 'تغيير الفصل'}</div>
                  <div className="max-w-[180px] truncate text-[10px] font-bold text-cyan-50/85">{currentChapter?.title || `الفصل ${selectedChapterIndex + 1}`}</div>
                </div>
              </div>

              {!isLoadingChapters && <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/30 bg-black/10"><ChevronDown className={`h-5 w-5 transition-transform duration-300 ${isChapterDropdownOpen ? 'rotate-180' : 'motion-safe:animate-bounce'}`} /></span>}
            </button>

            {/* Chapters Dropdown Menu */}
            {isChapterDropdownOpen && !isLoadingChapters && (
                <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[64vh] space-y-2 overflow-y-auto rounded-[24px] border border-cyan-300/60 bg-gradient-to-b from-slate-900/98 via-[#0b1735]/98 to-[#14133a]/98 p-2.5 shadow-[0_24px_65px_rgba(2,8,23,.75),0_0_28px_rgba(56,189,248,.24)] backdrop-blur-2xl custom-scrollbar animate-in fade-in slide-in-from-top-2">
                  {chapters.map((chapter, idx) => {
                    const isSelected = idx === selectedChapterIndex;
                    const chapterCompletedCount = chapter.lessons.filter((l) =>
                      completedLessonIds.includes(l.id)
                    ).length;
                    const isFullyCompleted =
                      chapter.lessons.length > 0 &&
                      chapterCompletedCount === chapter.lessons.length;

                    return (
                      <button
                        key={chapter.id || `ch-${idx}`}
                        onClick={() => scrollToChapter(chapter, idx)}
                        className={`group/chapter relative flex min-h-[86px] w-full cursor-pointer items-center justify-between gap-2 overflow-hidden rounded-[22px] border p-3.5 text-right transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] ${
                          isSelected
                            ? 'border-cyan-100/80 bg-gradient-to-r from-cyan-500 via-blue-600 to-violet-600 text-white shadow-[0_12px_30px_rgba(37,99,235,.48)] ring-2 ring-cyan-300/35'
                            : idx % 3 === 0
                            ? 'border-cyan-300/15 bg-gradient-to-r from-slate-800/95 to-cyan-950/80 text-gray-100 hover:border-cyan-300/45'
                            : idx % 3 === 1
                            ? 'border-blue-300/15 bg-gradient-to-r from-slate-800/95 to-blue-950/80 text-gray-100 hover:border-blue-300/45'
                            : 'border-violet-300/15 bg-gradient-to-r from-slate-800/95 to-violet-950/80 text-gray-100 hover:border-violet-300/45'
                        }`}
                        style={subjectId === 'biology' ? {
                          backgroundImage: `linear-gradient(90deg, rgba(4,20,39,.92), rgba(7,47,64,.78), rgba(51,22,101,.72)), url(${biologyChapterCardsImg})`,
                          backgroundSize: 'cover',
                          backgroundPosition: `${Math.min(100, idx * 24)}% center`,
                        } : undefined}
                      >
                        <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(103,232,249,.22),transparent_38%)]" />
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border text-lg font-black shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_8px_18px_rgba(0,0,0,.25)] ${
                              isFullyCompleted
                                ? 'border-emerald-200 bg-emerald-400 text-emerald-950'
                                : isSelected
                                ? 'border-white/80 bg-white text-blue-900'
                                : 'border-white/20 bg-white/10 text-white backdrop-blur group-hover/chapter:bg-white/20'
                            }`}
                          >
                            {isFullyCompleted ? '✓' : idx + 1}
                          </div>
                          <div className="relative min-w-0">
                            <div className="truncate text-sm font-black drop-shadow">
                              {chapter.title}
                            </div>
                            <div className="mt-1 text-[10px] font-bold text-cyan-100/80">
                              {chapter.lessons.length || chapter.lessonsCount || 0} دروس ({chapterCompletedCount} مكتمل)
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="relative shrink-0 rounded-full border border-amber-100/70 bg-gradient-to-r from-amber-300 to-yellow-400 px-2.5 py-1 text-[9px] font-black text-slate-950 shadow-lg">
                            الفصل الحالي
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => { appSfx.navigation(); onBack?.(); }}
            className="flex shrink-0 items-center gap-1 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-3 py-2.5 text-[11px] font-black text-black shadow-[0_0_10px_rgba(251,191,36,0.6)] transition-transform active:scale-95 hover:brightness-110"
            title="العودة إلى الصفحة السابقة"
            aria-label="العودة إلى الصفحة السابقة"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            <span>رجوع</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* THE MAIN SCROLLABLE WORLD MAP CONTAINER (1000w x 6000h) */}
      {/* ========================================================= */}
      <div
        ref={containerRef}
        className="relative w-full overflow-y-auto overflow-x-hidden rounded-3xl border-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] custom-scrollbar bg-[#020617] transition-all duration-300"
        style={{
          height: '78vh',
          borderColor: `${theme.colors.primary}60`,
          boxShadow: `0 0 25px ${theme.colors.glow}`,
        }}
      >
        <div
          className="relative w-full overflow-hidden"
          style={{ width: '100%', aspectRatio: '1000 / 6000' }}
        >
          {/* SVG WORLD MAP WITH THE 3 DYNAMIC BIOMES (1000 x 2000 each = 6000px) */}
          <svg
            viewBox="0 0 1000 6000"
            className="absolute inset-0 w-full h-full block select-none pointer-events-none"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Semi-Glowing Green Filter for Completed Path */}
              <filter id="greenSemiGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#10b981" floodOpacity="0.65" />
              </filter>

              {/* Semi-Glowing Red Filter for Upcoming Path */}
              <filter id="redSemiGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#ef4444" floodOpacity="0.65" />
              </filter>

              <filter id="glowEffect" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* ========================================================= */}
            {/* 1. TOP BIOME IMAGE (Y: 0 - 2000px) */}
            {/* ========================================================= */}
            <image
              href={activeImages[0].img}
              x="0"
              y="0"
              width="1000"
              height="2000"
              preserveAspectRatio="none"
              id="biome-top-active"
            />

            {/* SEPARATION TOP -> MIDDLE (Y: 2000px) */}
            <g id="divider-door-top-mid" transform="translate(0, 2000)">
              <line x1="0" y1="0" x2="1000" y2="0" stroke="#042f2e" strokeWidth="8" />
              <line x1="0" y1="0" x2="1000" y2="0" stroke="#14b8a6" strokeWidth="2.5" strokeDasharray="12 6" opacity="0.85" />
              <g transform="translate(200, -18)">
                <rect x="-16" y="0" width="8" height="36" fill="#042f2e" stroke="#14b8a6" strokeWidth="1.5" rx="2" />
                <rect x="16" y="0" width="8" height="36" fill="#042f2e" stroke="#14b8a6" strokeWidth="1.5" rx="2" />
                <path d="M -16 0 Q 4 -14 24 0" fill="none" stroke="#14b8a6" strokeWidth="4" />
                <rect x="-8" y="2" width="24" height="32" fill="#0f766e" opacity="0.85" filter="url(#glowEffect)" rx="3" />
                <circle cx="4" cy="18" r="6" fill="#5eead4" />
              </g>
            </g>

            {/* ========================================================= */}
            {/* 2. MIDDLE BIOME IMAGE (Y: 2000 - 4000px) */}
            {/* ========================================================= */}
            <image
              href={activeImages[1].img}
              x="0"
              y="2000"
              width="1000"
              height="2000"
              preserveAspectRatio="none"
              id="biome-mid-active"
            />

            {/* SEPARATION MIDDLE -> BOTTOM (Y: 4000px) */}
            <g id="divider-door-mid-bot" transform="translate(0, 4000)">
              <line x1="0" y1="0" x2="1000" y2="0" stroke="#1e1b4b" strokeWidth="8" />
              <line x1="0" y1="0" x2="1000" y2="0" stroke="#818cf8" strokeWidth="2.5" strokeDasharray="12 6" opacity="0.8" />
              <g transform="translate(800, -18)">
                <rect x="-16" y="0" width="8" height="36" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.5" rx="2" />
                <rect x="16" y="0" width="8" height="36" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1.5" rx="2" />
                <path d="M -16 0 Q 4 -14 24 0" fill="none" stroke="#818cf8" strokeWidth="4" />
                <rect x="-8" y="2" width="24" height="32" fill="#4338ca" opacity="0.8" filter="url(#glowEffect)" rx="3" />
                <circle cx="4" cy="18" r="6" fill="#fef08a" />
              </g>
            </g>

            {/* ========================================================= */}
            {/* 3. BOTTOM BIOME IMAGE (Y: 4000 - 6000px) */}
            {/* ========================================================= */}
            <image
              href={activeImages[2].img}
              x="0"
              y="4000"
              width="1000"
              height="2000"
              preserveAspectRatio="none"
              id="biome-bot-active"
            />

            {/* ========================================================= */}
            {/* 🛤️ SEMI-GLOWING RED & GREEN DUAL ILLUMINATED TRAIL PATH */}
            {/* ========================================================= */}
            {/* 1. Underlying path backdrop shadow */}
            <path
              d={fullPathD}
              fill="none"
              stroke="#090d16"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />

            {/* 2. Individual illuminated segments (Green if completed, Red if uncompleted) */}
            {pathSegments.map((seg) => (
              <g key={`trail-segment-${seg.index}`}>
                {/* Glow layer */}
                <path
                  d={seg.d}
                  fill="none"
                  stroke={seg.isSegmentDone ? '#10b981' : '#dc2626'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={seg.isSegmentDone ? 'url(#greenSemiGlow)' : 'url(#redSemiGlow)'}
                  opacity={seg.isSegmentDone ? '0.85' : '0.7'}
                />
                {/* Core bright neon dashed trail */}
                <path
                  d={seg.d}
                  fill="none"
                  stroke={seg.isSegmentDone ? '#6ee7b7' : '#f87171'}
                  strokeWidth="3.5"
                  strokeDasharray="8 6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.95"
                />
              </g>
            ))}

            {/* Start Marker at Bottom (Y: 5800) */}
            <g transform="translate(500, 5820)">
              <circle r="18" fill="#10b981" stroke="#ffffff" strokeWidth="2.5" filter="url(#greenSemiGlow)" />
              <text x="0" y="4" fill="#ffffff" fontSize="9" fontWeight="900" textAnchor="middle">البداية</text>
            </g>

            {/* "X Marks the Spot" at Apex (Y: 200) */}
            <g transform="translate(500, 200)">
              <line x1="-15" y1="-15" x2="15" y2="15" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" filter="url(#redSemiGlow)" />
              <line x1="15" y1="-15" x2="-15" y2="15" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" filter="url(#redSemiGlow)" />
            </g>
          </svg>

          {currentChapter && (
            <ChapterExamIcons
              subjectId={subjectId}
              subjectName={subjectName}
              chapterNumber={currentChapter.number}
              className="absolute right-[10%] top-[9%]"
              onScoreUpdate={onScoreUpdate}
              openPickerRequest={examPickerRequest}
            />
          )}

          {/* ========================================================= */}
          {/* COMPACT INTERACTIVE TREASURE CHESTS (1 per Biome Image) */}
          {/* ========================================================= */}
          {onOpenLaboratory && currentChapter && (
            <div
              style={{ left: `${balloonX / 10}%`, top: `${balloonY / 60}%` }}
              className="absolute z-30 -translate-x-1/2 -translate-y-1/2"
            >
              <LaboratoryBalloon
                subjectName={subjectName}
                onClick={() => onOpenLaboratory(currentChapter.number)}
              />
            </div>
          )}
          {chapterChests.map((chest) => {
            const isOpened = openedChests.includes(chest.id);
            return (
              <div
                key={chest.id}
                style={{
                  left: `${(chest.x / 1000) * 100}%`,
                  top: `${(chest.y / 6000) * 100}%`,
                }}
                className="absolute z-25 -translate-x-1/2 -translate-y-1/2"
              >
                <button
                  onClick={() => onOpenChest(chest.id)}
                  className="group relative cursor-pointer active:scale-95 transition-transform"
                >
                  <div
                    className={`px-2.5 py-1 rounded-xl flex items-center gap-1.5 border shadow-xl transition-all ${
                      isOpened
                        ? 'bg-amber-950/90 border-amber-500/40 text-amber-400'
                        : 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 border-white text-black animate-bounce shadow-[0_0_15px_rgba(251,191,36,0.8)]'
                    }`}
                  >
                    <Gift className={`w-3.5 h-3.5 ${isOpened ? 'text-amber-400' : 'text-black'}`} />
                    <div className="text-right">
                      <div className="text-[10px] font-black leading-tight">
                        {isOpened ? 'مفتوح ✓' : 'افتح الكنز!'}
                      </div>
                      <div className="text-[8px] font-bold opacity-80">
                        {chest.label}
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            );
          })}

          {/* ========================================================= */}
          {/* 🔴/🟢 INTERACTIVE LESSON NODES (NO BLACK WRITING / SQUARES) */}
          {/* Only circular button with lesson number, red/green, & stars */}
          {/* ========================================================= */}
          {nodes.map((node) => {
            const pctX = (node.x / 1000) * 100;
            const pctY = (node.y / 6000) * 100;
            const isCompleted = node.isCompleted;
            const isInProgress = node.isCurrentActive && !isCompleted;
            const isLocked = node.status === 'locked' && !isCompleted;

            return (
              <div
                key={node.index}
                ref={isInProgress ? activeNodeRef : undefined}
                style={{ left: `${pctX}%`, top: `${pctY}%` }}
                className="absolute z-30 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
              >
                {/* COMPACT FLOATING ACTIVE AVATAR (أنت هنا) */}
                {isInProgress && (
                  <div className="absolute -top-10 flex flex-col items-center animate-bounce z-40 pointer-events-none">
                    <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500 text-black font-black text-[9px] shadow-xl border border-white whitespace-nowrap flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-black fill-black" />
                      <span>أنت هنا</span>
                    </div>
                    <div className="w-2 h-2 bg-amber-400 rotate-45 -mt-1 border-r border-b border-white" />
                  </div>
                )}

                {/* THE REFINED SEMI-GLOWING TACTILE NODE BUTTON WITH LESSON NUMBER */}
                <button
                  onClick={() => {
                    if (isLocked) appSfx.attention();
                    else appSfx.lessonSelect();
                    if (node.lessonItem) {
                      setPreviewLesson({
                        lesson: node.lessonItem.lesson,
                        chapter: node.lessonItem.chapter,
                      });
                    }
                  }}
                  className={`group relative flex items-center justify-center rounded-2xl transition-all duration-200 cursor-pointer select-none active:scale-90 ${
                    node.isCrown
                      ? isCompleted
                        ? 'w-13 h-13 sm:w-14 sm:h-14 bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 border-2 border-white shadow-[0_0_20px_rgba(16,185,129,0.7)]'
                        : 'w-13 h-13 sm:w-14 sm:h-14 bg-gradient-to-tr from-rose-600 via-red-500 to-rose-400 border-2 border-white shadow-[0_0_20px_rgba(225,29,72,0.6)] animate-pulse'
                      : isCompleted
                      ? 'w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-b from-emerald-500 via-emerald-600 to-teal-700 border-2 border-white shadow-[0_0_12px_rgba(16,185,129,0.6)] hover:brightness-110'
                      : isInProgress
                      ? 'w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-b from-rose-500 via-red-600 to-rose-700 border-2 border-white shadow-[0_0_15px_rgba(225,29,72,0.7)] ring-4 ring-rose-400/40 animate-pulse'
                      : 'w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-b from-rose-600 via-red-700 to-red-900 border border-white/40 opacity-95 shadow-[0_0_8px_rgba(220,38,38,0.5)] hover:opacity-100 hover:brightness-110'
                  }`}
                >
                  {/* Subtle 3D glossy highlight */}
                  <div className="absolute inset-x-1 top-0.5 h-1/2 bg-white/20 rounded-t-xl pointer-events-none" />

                  {/* Inner Content (Lesson Number with status badge) */}
                  <div className="flex flex-col items-center justify-center text-white relative z-10">
                    {node.isCrown ? (
                      <div className="flex flex-col items-center">
                        <span className="text-sm sm:text-base leading-none drop-shadow">👑</span>
                        <span className="text-[8px] font-black leading-none mt-0.5 text-white">{node.index}</span>
                      </div>
                    ) : isCompleted ? (
                      <div className="flex flex-col items-center">
                        <Check className="w-3.5 h-3.5 text-emerald-200 stroke-[3.5] drop-shadow" />
                        <span className="text-[10px] sm:text-[11px] font-black leading-none text-white mt-0.5 drop-shadow">
                          {node.index}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        {isLocked ? (
                          <Lock className="w-3 h-3 text-white/80 stroke-[2.5]" />
                        ) : (
                          <Play className="w-3 h-3 fill-white text-white translate-x-0.5" />
                        )}
                        <span className="text-[10px] sm:text-[11px] font-black leading-none text-white mt-0.5 drop-shadow">
                          {node.index}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Achievement Stars below completed nodes */}
                  {isCompleted && (
                    <div className="absolute -bottom-2.5 flex items-center justify-center gap-0.5 bg-black/80 px-1.5 py-0.5 rounded-full border border-emerald-400/60 shadow">
                      <Star className="w-2 h-2 text-yellow-400 fill-yellow-400" />
                      <Star className="w-2.5 h-2.5 text-yellow-300 fill-yellow-300 -mt-0.5" />
                      <Star className="w-2 h-2 text-yellow-400 fill-yellow-400" />
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 📋 LESSON DETAILS / START PREVIEW MODAL */}
      {/* ========================================================= */}
      {previewLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-sky-300/60 bg-[linear-gradient(145deg,#0b1d3d_0%,#071329_52%,#10183a_100%)] p-5 text-white shadow-[0_28px_80px_rgba(2,132,199,.32)] space-y-4">
            <span className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-cyan-400/15 blur-3xl" />
            <span className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-violet-500/15 blur-3xl" />
            
            {/* Modal Header */}
            <div className="relative flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400 flex items-center justify-center text-sky-300">
                  <Play className="w-4 h-4 fill-sky-400 text-sky-400" />
                </div>
                <div>
                  <span className="text-[10px] text-sky-300 font-bold block">تفاصيل الدرس</span>
                  <h3 className="text-sm sm:text-base font-black text-white">{formatArabicLessonTitle(previewLesson.lesson.title)}</h3>
                </div>
              </div>
              <button
                onClick={() => setPreviewLesson(null)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/10 text-gray-300 transition-colors hover:bg-white/20 hover:text-white"
                aria-label="إغلاق نافذة خيارات الدرس"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative rounded-2xl border border-white/10 bg-white/[.04] px-3 py-2.5 text-center">
              <p className="text-[11px] font-bold text-slate-300">اختر ما تريد البدء به في مادة <span className="text-cyan-300">{subjectName}</span></p>
            </div>

            {/* Both actions stay above the fold on mobile. Exams inherit the
                currently selected subject and chapter automatically. */}
            <div className="relative grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  const targetLesson = previewLesson.lesson;
                  setPreviewLesson(null);
                  onSelectLesson(targetLesson);
                }}
                className="group relative min-h-[126px] overflow-hidden rounded-3xl border border-cyan-200/50 bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-700 p-3.5 text-white shadow-[0_14px_34px_rgba(14,165,233,.34)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_42px_rgba(14,165,233,.44)] active:scale-95"
              >
                <span className="absolute -left-5 -top-6 h-20 w-20 rounded-full bg-white/25 blur-xl" />
                <span className="relative flex h-full flex-col items-center justify-center gap-2.5">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/40 bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,.35),0_8px_20px_rgba(0,0,0,.16)]"><BookOpen className="h-6 w-6" /></span>
                  <span className="text-sm font-black">بدء الدرس</span>
                  <span className="-mt-1 text-[9px] font-bold text-cyan-50/90">شرح ومحتوى تفاعلي</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewLesson(null);
                  setExamPickerRequest((request) => request + 1);
                }}
                className="group relative min-h-[126px] overflow-hidden rounded-3xl border border-amber-200/60 bg-gradient-to-br from-amber-300 via-orange-500 to-rose-600 p-3.5 text-white shadow-[0_14px_34px_rgba(249,115,22,.34)] transition-all hover:-translate-y-1 hover:shadow-[0_20px_42px_rgba(249,115,22,.44)] active:scale-95"
                aria-label={`فتح الامتحانات الشهرية والوزارية لمادة ${subjectName}`}
              >
                <span className="absolute -right-5 -top-6 h-20 w-20 rounded-full bg-yellow-100/35 blur-xl" />
                <span className="relative flex h-full flex-col items-center justify-center gap-2.5">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-white/45 bg-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,.4),0_8px_20px_rgba(0,0,0,.16)]"><ClipboardCheck className="h-6 w-6" /></span>
                  <span className="text-sm font-black">امتحانات المادة</span>
                  <span className="-mt-1 rounded-full border border-white/20 bg-black/10 px-2 py-0.5 text-[9px] font-bold text-amber-50">شهرية ووزارية</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
