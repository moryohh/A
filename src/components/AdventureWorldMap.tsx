import React, { useState, useRef, useEffect, useMemo } from 'react';
import spaceBiomeImg from '../assets/images/space_minimal_void_1786901269341.webp';
import deepSeaBiomeImg from '../assets/images/ocean_clean_biome_1786901297268.webp';
import biome1Img from '../assets/images/biome1_snow_mountain_1786898662715.webp';
import biome2Img from '../assets/images/biome2_green_farm_1786898677268.webp';
import biome3Img from '../assets/images/biome3_harbor_refinery_1786898690005.webp';
import biome4Img from '../assets/images/biome4_night_realm_1786898703967.webp';
import { SubjectChapter, SubjectChapterLesson } from '../types';
import { useAppTheme } from '../services/themeService';
import { formatArabicLessonTitle } from '../services/lessonsService';
import { ChapterExamIcons } from './ChapterExamIcons';
import {
  Check,
  Lock,
  Play,
  Star,
  Sparkles,
  Gift,
  BookOpen,
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
}) => {
  const { theme } = useAppTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const activeNodeRef = useRef<HTMLDivElement>(null);

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

  // Selected lesson modal
  const [previewLesson, setPreviewLesson] = useState<{
    lesson: SubjectChapterLesson;
    chapter: SubjectChapter;
  } | null>(null);

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

  return (
    <div className="relative w-full max-w-xl mx-auto flex flex-col items-center select-none font-cairo">
      {/* ========================================================= */}
      {/* 🧭 CHAPTER SELECTOR DROPDOWN (اختر الفصل / تحديد الفصل) */}
      {/* ========================================================= */}
      <div className="sticky top-1 z-40 w-full mb-1.5">
          <div
            className="flex flex-row-reverse items-center justify-between gap-2 p-1.5 sm:p-2 rounded-2xl backdrop-blur-md border-2 shadow-2xl text-white transition-all duration-300"
          style={{
            backgroundColor: `${theme.colors.bgCard}F2`,
            borderColor: `${theme.colors.primary}60`,
            boxShadow: `0 8px 30px ${theme.colors.glow}`,
          }}
        >
          
          {/* Main Chapter Selector Button */}
          <div className="relative flex-1 min-w-0">
            <button
              onClick={() => !isLoadingChapters && setIsChapterDropdownOpen(!isChapterDropdownOpen)}
              disabled={isLoadingChapters}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl border shadow-lg transition-all active:scale-[0.98] cursor-pointer group disabled:cursor-wait"
              style={{
                backgroundColor: `${theme.colors.primary}20`,
                borderColor: `${theme.colors.primary}50`,
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: `${theme.colors.primary}30`,
                    borderColor: theme.colors.primary,
                    color: theme.colors.primary,
                  }}
                >
                  {isLoadingChapters ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  ) : (
                    <BookOpen className="w-4 h-4" />
                  )}
                </div>
                <div className="text-right min-w-0">
                  <div className="text-[10px] font-bold leading-none mb-0.5" style={{ color: theme.colors.secondary }}>
                    {isLoadingChapters
                      ? 'يرجى الانتظار'
                      : 'تغيير الفصل من هنا'}
                  </div>
                  <div className="text-xs sm:text-sm font-black text-white truncate">
                    {isLoadingChapters
                      ? 'جاري جلب الفصول...'
                      : currentChapter
                      ? currentChapter.title
                      : `الفصل ${selectedChapterIndex + 1}`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md font-bold border"
                  style={{
                    backgroundColor: `${theme.colors.primary}35`,
                    borderColor: `${theme.colors.primary}60`,
                    color: theme.colors.textPrimary,
                  }}
                >
                  {isLoadingChapters ? 'جاري التحميل...' : 'تبديل الفصل'}
                  {!isLoadingChapters && <ChevronDown className="w-3 h-3" />}
                </span>
                {!isLoadingChapters && (
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      isChapterDropdownOpen ? 'rotate-180 text-yellow-300' : ''
                    }`}
                    style={{ color: theme.colors.primary }}
                  />
                )}
              </div>
            </button>

            {/* Chapters Dropdown Menu */}
            {isChapterDropdownOpen && !isLoadingChapters && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsChapterDropdownOpen(false)}
                />
                <div className="absolute top-full mt-1.5 right-0 left-0 z-50 p-2 rounded-2xl bg-slate-900/98 backdrop-blur-xl border-2 border-sky-400 shadow-2xl space-y-1.5 max-h-[60vh] overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between px-2 py-1 border-b border-white/10 text-xs font-black text-sky-300">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      فصول المادة ({chapters.length} فصول متاحة)
                    </span>
                    <span className="text-[10px] text-gray-400 font-normal">اضغط للانتقال إلى الفصل</span>
                  </div>

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
                        className={`w-full flex items-center justify-between gap-2 p-2.5 rounded-xl text-right transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white border border-white/40 shadow-lg'
                            : 'bg-slate-800/80 hover:bg-slate-700/80 text-gray-200 border border-white/5 hover:border-sky-500/30'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                              isFullyCompleted
                                ? 'bg-emerald-500 text-black font-black'
                                : isSelected
                                ? 'bg-white text-blue-900 font-black'
                                : 'bg-slate-700 text-gray-300'
                            }`}
                          >
                            {isFullyCompleted ? '✓' : idx + 1}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-black truncate">
                              {chapter.title}
                            </div>
                            <div className="text-[10px] text-sky-200/80 font-medium">
                              {chapter.lessons.length || chapter.lessonsCount || 0} دروس ({chapterCompletedCount} مكتمل)
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="px-2 py-0.5 rounded-full bg-yellow-400 text-black text-[10px] font-black shrink-0 shadow">
                            الفصل الحالي
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={onBack}
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
            />
          )}

          {/* ========================================================= */}
          {/* COMPACT INTERACTIVE TREASURE CHESTS (1 per Biome Image) */}
          {/* ========================================================= */}
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
          <div className="relative w-full max-w-md bg-[#09152b] border-2 border-sky-400 rounded-3xl p-5 text-white shadow-2xl space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
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
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-2.5 text-xs text-gray-300">
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-white/5 flex items-center justify-between">
                <span className="text-gray-400">الفصل:</span>
                <span className="font-bold text-white">{previewLesson.chapter.title}</span>
              </div>
              <div className="bg-slate-800/80 p-3 rounded-2xl border border-white/5 flex items-center justify-between">
                <span className="text-gray-400">حالة الدرس:</span>
                <span className={`font-bold ${
                  completedLessonIds.includes(previewLesson.lesson.id)
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}>
                  {completedLessonIds.includes(previewLesson.lesson.id) ? 'مكتمل ✓' : 'متاح للبدء'}
                </span>
              </div>
              {previewLesson.lesson.duration && (
                <div className="bg-slate-800/80 p-3 rounded-2xl border border-white/5 flex items-center justify-between">
                  <span className="text-gray-400">مدة الدرس:</span>
                  <span className="font-bold text-white">{previewLesson.lesson.duration}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  const targetLesson = previewLesson.lesson;
                  setPreviewLesson(null);
                  onSelectLesson(targetLesson);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-black rounded-2xl text-xs sm:text-sm shadow-lg shadow-sky-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>دخول الدرس الآن</span>
              </button>
              
              <button
                onClick={() => {
                  const lessonId = previewLesson.lesson.id;
                  setCompletedLessonIds((prev) =>
                    prev.includes(lessonId)
                      ? prev.filter((id) => id !== lessonId)
                      : [...prev, lessonId]
                  );
                }}
                className="px-3.5 py-3 bg-slate-800 hover:bg-slate-700 text-gray-200 font-bold rounded-2xl text-xs border border-white/10 transition-colors"
                title="تبديل حالة الإكمال"
              >
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
