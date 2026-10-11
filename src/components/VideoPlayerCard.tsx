import React, { useState, useRef, useEffect } from 'react';
import { EducationalLesson, OpenLessonContext } from '../types';
import {
  Play,
  Maximize2,
  SlidersHorizontal,
  Check,
  ArrowRight,
  Gamepad2,
  MapPin,
  Sparkles,
  Clock,
  VideoOff,
  BookOpen,
  Presentation,
  GraduationCap,
  Files,
} from 'lucide-react';
import { LessonBookletView } from './LessonBookletView';
import { LessonBookletData } from '../data/lessonBooklet';
import { fetchLessonCurriculum } from '../services/curriculumService';
import { cleanTeacherName } from '../utils/cleanTeacherName';
import { extractYoutubeId, formatArabicLessonTitle } from '../services/lessonsService';
import { useAppTheme } from '../services/themeService';

function collectLessonTopics(value: unknown, output = new Set<string>()): Set<string> {
  if (!value || typeof value !== 'object') return output;
  if (Array.isArray(value)) {
    value.forEach((item) => collectLessonTopics(item, output));
    return output;
  }
  Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
    if (/^lesson[_-]?topic$/i.test(key)) {
      const entries = Array.isArray(child) ? child : [child];
      entries.forEach((entry) => {
        if (typeof entry === 'string' && entry.trim()) output.add(entry.trim());
      });
    }
    if (child && typeof child === 'object') collectLessonTopics(child, output);
  });
  return output;
}

function inferTopicFromBooklet(data: LessonBookletData | null): string | undefined {
  for (const page of data?.pages || []) {
    for (const item of page.items || []) {
      if (item.type === 'title' && typeof item.content === 'string' && item.content.trim()) {
        return item.content.trim();
      }
    }
  }
  return undefined;
}

interface VideoPlayerCardProps {
  lesson: EducationalLesson;
  openLessonContext?: OpenLessonContext | null;
  onOpenTeacherInfo?: () => void;
  isPaused?: boolean;
  onBackToMap?: () => void;
  onOpenGames?: () => void;
}

export const VideoPlayerCard: React.FC<VideoPlayerCardProps> = ({
  lesson,
  openLessonContext,
  onOpenTeacherInfo,
  isPaused = false,
  onBackToMap,
  onOpenGames,
}) => {
  const { theme } = useAppTheme();
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0); // percentage
  const [selectedQuality, setSelectedQuality] = useState('1080p HD');
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [studyView, setStudyView] = useState<'booklet' | 'board'>('booklet');
  const [hasBoardContent, setHasBoardContent] = useState(false);

  // Curriculum State
  const [curriculumData, setCurriculumData] = useState<LessonBookletData | null>(null);
  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState(true);
  const [curriculumError, setCurriculumError] = useState<string | null>(null);

  // Clean teacher name
  const cleanedTeacherName = cleanTeacherName(lesson.teacherName) || 'مدرس المادة';

  // Check if a real, non-empty, educational video ID is present
  const validYoutubeId = extractYoutubeId(
    lesson.youtubeId,
    lesson.title,
    cleanedTeacherName,
    lesson.description
  );
  const hasValidVideo = Boolean(validYoutubeId);
  const lessonTopics = Array.from(new Set([
    openLessonContext?.lessonTopic,
    ...collectLessonTopics(curriculumData),
    inferTopicFromBooklet(curriculumData),
  ].filter((topic): topic is string => Boolean(topic?.trim()))));
  const displayedTopic = lessonTopics.length > 0
    ? lessonTopics.join(' • ')
    : formatArabicLessonTitle(openLessonContext?.lessonTitle || lesson.title);

  // Pause video if external isPaused prop is true
  useEffect(() => {
    if (isPaused) {
      if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', 'https://www.youtube.com');
      }
      setIsPlaying(false);
    }
  }, [isPaused]);

  // Auto-play and fetch curriculum when lesson changes
  useEffect(() => {
    setIsPlaying(true);
    setProgress(0);
    setCurriculumData(null);
    setStudyView('booklet');
    setHasBoardContent(false);

    let isMounted = true;
    setIsLoadingCurriculum(true);
    setCurriculumError(null);

    const curriculumPromise = openLessonContext
      ? fetchLessonCurriculum(openLessonContext)
      : fetchLessonCurriculum(
          lesson.category || 'chemistry',
          lesson.id,
          undefined,
          undefined
        );

    curriculumPromise
      .then((res) => {
        if (isMounted) {
          if (res.data) {
            setCurriculumData(res.data);
          } else {
            setCurriculumError(res.error || 'لا توجد مفردات منهجية محددة لهذا الدرس');
          }
          setIsLoadingCurriculum(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to load curriculum:', err);
          setCurriculumError('تعذر جلب بيانات المنهج');
          setIsLoadingCurriculum(false);
        }
      });

    // The board is a separate exercise bundle. Expose it only when the
    // current chapter/lesson has a real non-empty exercise file.
    const boardSubject = String(openLessonContext?.subjectId || lesson.category || '').toLowerCase();
    const boardChapter = openLessonContext?.chapterNumber;
    const boardLesson = openLessonContext?.lessonNumber;
    if ((boardSubject === 'chemistry' || boardSubject === 'physics') && boardChapter && boardLesson) {
      const base = `${import.meta.env.BASE_URL}solve-with-me/`;
      fetch(`${base}${boardSubject}-curriculum.json`)
        .then((response) => response.ok ? response.json() : Promise.reject(new Error('board index unavailable')))
        .then(async (chapters) => {
          const chapter = Array.isArray(chapters)
            ? chapters.find((candidate: any) => Number(String(candidate?.id || '').match(/ch(\d+)/)?.[1]) === boardChapter)
            : null;
          const files = (chapter?.topics || [])
            .flatMap((topic: any) => topic?.files || [])
            .map((entry: any) => typeof entry === 'string' ? entry : entry?.file)
            .filter((file: unknown): file is string => Boolean(file))
            .filter((file: string) => new RegExp(`(?:^|_)lesson${boardLesson}\.json$`, 'i').test(file));
          const results = await Promise.all(files.map(async (file: string) => {
            try {
              const response = await fetch(`${base}data/${encodeURIComponent(file)}`);
              if (!response.ok) return false;
              const data = await response.json();
              return Array.isArray(data) ? data.length > 0 : Boolean(data && Object.keys(data).length);
            } catch {
              return false;
            }
          }));
          if (isMounted) setHasBoardContent(results.some(Boolean));
        })
        .catch(() => {
          if (isMounted) setHasBoardContent(false);
        });
    }

    return () => {
      isMounted = false;
      // Stop playback on unmount
      if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', 'https://www.youtube.com');
      }
    };
  }, [lesson.id, validYoutubeId, lesson.category, openLessonContext?.subjectId, openLessonContext?.chapterNumber, openLessonContext?.lessonNumber, openLessonContext?.lessonId]);

  // Simulated progress timer when playing
  useEffect(() => {
    let interval: any;
    if (isPlaying && hasValidVideo) {
      interval = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, hasValidVideo]);

  const toggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
    if (iframeRef.current) {
      const targetSeconds = (newProgress / 100) * 920;
      iframeRef.current.contentWindow?.postMessage(
        `{"event":"command","func":"seekTo","args":[${targetSeconds}, true]}`,
        '*'
      );
    }
  };

  const handleNavigateToMap = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', 'https://www.youtube.com');
    }
    setIsPlaying(false);
    onBackToMap?.();
  };

  const handleNavigateToGames = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', 'https://www.youtube.com');
    }
    setIsPlaying(false);
    onOpenGames?.();
  };

  return (
    <div className="space-y-3 my-2 text-right">
      {/* 
        Video Player Section:
        Only displayed if a genuine, educational YouTube video exists.
        If missing, a clear and helpful educational notice is displayed.
      */}
      {hasValidVideo ? (
        <div className="-mx-3 bg-black border-y border-white/10 shadow-2xl overflow-hidden transition-all">
          <div
            ref={containerRef}
            className="relative w-full aspect-video bg-black group shadow-xl overflow-hidden"
          >
            {isPlaying ? (
              <div className="relative w-full h-full bg-black">
                {/* Standard Full-Size Video Iframe */}
                <iframe
                  ref={iframeRef}
                  className="w-full h-full border-0 pointer-events-auto"
                  src={`https://www.youtube.com/embed/${validYoutubeId}?autoplay=1&controls=1&modestbranding=1&rel=0&showinfo=0&playsinline=1&enablejsapi=1`}
                  title={lesson.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />

                {/* Minimalist Controls Overlay: Quality and Fullscreen */}
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-end p-3 transition-opacity duration-300 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 focus-within:opacity-100">
                  <div className="space-y-2 bg-black/85 backdrop-blur-md p-2.5 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
                    {/* Custom Progress Bar */}
                    <div className="flex items-center gap-2 text-[11px] font-mono text-gray-300">
                      <span className="text-[#00A3FF] font-bold">03:40</span>
                      <div className="relative flex-1 flex items-center">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={progress}
                          onChange={handleSeek}
                          className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#00A3FF] hover:h-2 transition-all"
                        />
                      </div>
                      <span>{lesson.duration || '15:20'}</span>
                    </div>

                    {/* Controls Action Row */}
                    <div className="flex items-center justify-between pt-0.5">
                      {/* Quality Selector */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowQualityMenu(!showQualityMenu);
                          }}
                          className="bg-white/10 hover:bg-white/20 text-gray-200 border border-white/10 px-2.5 py-1 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
                          title="جودة الفيديو"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-[#00A3FF]" />
                          <span>{selectedQuality}</span>
                        </button>

                        {showQualityMenu && (
                          <div className="absolute bottom-9 right-0 bg-[#1A1A24] border border-white/15 rounded-xl p-1 shadow-2xl z-50 min-w-[110px] space-y-1">
                            {['1080p HD', '720p HD', '480p'].map((q) => (
                              <button
                                key={q}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedQuality(q);
                                  setShowQualityMenu(false);
                                }}
                                className={`w-full text-right px-2 py-1 rounded-lg text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                                  selectedQuality === q
                                    ? 'bg-[#00A3FF]/20 text-[#00A3FF]'
                                    : 'text-gray-300 hover:bg-white/5'
                                }`}
                              >
                                <span>{q}</span>
                                {selectedQuality === q && <Check className="w-3.5 h-3.5 text-[#00A3FF]" />}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Fullscreen Button */}
                      <button
                        onClick={toggleFullscreen}
                        className="bg-white/10 hover:bg-white/20 text-gray-200 border border-white/10 p-1.5 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        title="عرض جانبى / ملء الشاشة"
                        aria-label="عرض ملء الشاشة"
                      >
                        <Maximize2 className="w-4 h-4 text-[#00A3FF]" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Custom Clean Video Thumbnail Before Playing */
              <div className="relative w-full h-full cursor-pointer" onClick={() => setIsPlaying(true)}>
                <img
                  src={`https://img.youtube.com/vi/${validYoutubeId}/hqdefault.jpg`}
                  alt={lesson.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                {/* Center Play Button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPlaying(true);
                    }}
                    className="w-16 h-16 bg-[#00A3FF] hover:bg-[#0092E6] text-white rounded-full flex items-center justify-center shadow-xl shadow-sky-500/40 transition-all hover:scale-110 active:scale-95 border-2 border-white/20 cursor-pointer"
                    aria-label="تشغيل الفيديو"
                  >
                    <Play className="w-7 h-7 fill-white translate-x-0.5" />
                  </button>
                </div>

                {/* Minimal Bottom Bar */}
                <div className="absolute bottom-3 inset-x-4 flex items-center justify-between pointer-events-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPlaying(true);
                    }}
                    className="bg-black/80 backdrop-blur-md hover:bg-black/90 text-gray-200 border border-white/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-md cursor-pointer"
                    title="جودة العرض HD"
                  >
                    <SlidersHorizontal className="w-4 h-4 text-[#00A3FF]" />
                    <span>1080p HD</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPlaying(true);
                    }}
                    className="bg-black/80 backdrop-blur-md hover:bg-black/90 text-gray-200 border border-white/20 p-2 rounded-xl flex items-center justify-center transition-all shadow-md cursor-pointer"
                    title="عرض جانبي / ملء الشاشة"
                  >
                    <Maximize2 className="w-4 h-4 text-[#00A3FF]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Clean and clear notice when video lecture is not yet available */
        <div className="bg-gradient-to-br from-[#1A1A28] via-[#141420] to-[#0D0D16] border border-sky-500/20 rounded-2xl p-5 shadow-xl text-center space-y-3 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="w-12 h-12 mx-auto rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-[#00A3FF] shadow-inner">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-sky-500/10 border border-sky-500/25 px-3 py-0.5 rounded-full text-xs font-bold text-[#00A3FF]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>الدرس قريباً • جاري تدقيق المحاضرة</span>
            </div>
            <h3 className="text-base font-bold text-white pt-1">
              رابط المحاضرة المرئية غير متوفر حالياً للأستاذ
            </h3>
            <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
              حرصاً على جودة المنهج المدرسي للسادس الإعدادي، يتم فقط اعتماد الروابط التعليمية الرسمية. يمكنك متابعة المفردات المنهجية، الملخصات، والاختبارات التفاعلية بالأسفل.
            </p>
          </div>
        </div>
      )}

      <section className="lesson-topic-panel relative overflow-hidden rounded-3xl border border-cyan-300/35 bg-gradient-to-l from-slate-950/95 via-sky-950/90 to-indigo-950/90 p-3.5 shadow-[0_12px_34px_rgba(14,165,233,0.18)]" aria-label="موضوع الدرس وإجراء الامتحان">
        <div className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full bg-cyan-400/20 blur-2xl" />
        <div className="relative flex items-stretch gap-3" dir="rtl">
          <div className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/[0.06] p-3 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.09]">
            <div className="mb-1.5 flex items-center gap-2 text-cyan-300">
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span className="text-[10px] font-black tracking-wide">موضوع الدرس</span>
              {openLessonContext?.filesCount ? (
                <span className="mr-auto inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[9px] text-slate-300">
                  <Files className="h-3 w-3" /> {openLessonContext.filesCount} ملفات
                </span>
              ) : null}
            </div>
            <p className="text-sm font-black leading-6 text-white">{displayedTopic}</p>
          </div>

          <button
            type="button"
            onClick={handleNavigateToGames}
            className="exam-launch-button group flex w-[108px] shrink-0 flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-amber-300/80 bg-gradient-to-br from-amber-300 via-orange-400 to-rose-500 px-2 py-3 text-center text-slate-950 shadow-[0_0_24px_rgba(251,191,36,0.34)] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] active:translate-y-0 active:scale-95"
            aria-label="إجراء امتحان لهذا الدرس"
          >
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950/90 text-amber-300 shadow-lg transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110">
              <GraduationCap className="h-6 w-6" />
            </span>
            <strong className="text-[11px] font-black leading-4">إجراء امتحان</strong>
          </button>
        </div>
      </section>

      <div className={`grid ${hasBoardContent ? 'grid-cols-2' : 'grid-cols-1'} gap-3`} dir="rtl" role="tablist" aria-label="أدوات الدراسة">
        <button role="tab" id="booklet-tab" aria-selected={studyView === 'booklet'} aria-controls="study-panel" onClick={() => setStudyView('booklet')} className={`group flex min-h-[76px] items-center justify-center gap-3 rounded-2xl border px-4 py-3 text-right font-black transition-all duration-300 active:scale-[0.98] ${studyView === 'booklet' ? 'border-emerald-300 bg-gradient-to-l from-emerald-500/25 to-cyan-500/15 text-emerald-200 shadow-[0_8px_26px_rgba(52,211,153,0.18)]' : 'border-white/15 bg-white/[0.03] text-gray-400 hover:border-emerald-300/50'}`}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-300/30"><BookOpen size={24} /></span><span><strong className="block text-sm">الملزمة</strong><small className="mt-0.5 block text-[10px] font-medium opacity-75">مفردات الدرس</small></span></button>
        {hasBoardContent && <button role="tab" id="board-tab" aria-selected={studyView === 'board'} aria-controls="study-panel" onClick={() => setStudyView('board')} className={`group flex min-h-[76px] items-center justify-center gap-3 rounded-2xl border px-4 py-3 text-right font-black transition-all duration-300 active:scale-[0.98] ${studyView === 'board' ? 'border-cyan-300 bg-gradient-to-l from-cyan-500/25 to-indigo-500/15 text-cyan-200 shadow-[0_8px_26px_rgba(34,211,238,0.18)]' : 'border-white/15 bg-white/[0.03] text-gray-400 hover:border-cyan-300/50'}`}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-300/30"><Presentation size={24} /></span><span><strong className="block text-sm">الصبورة</strong><small className="mt-0.5 block text-[10px] font-medium opacity-75">حل معي</small></span></button>}
      </div>
      <div id="study-panel" role="tabpanel" aria-labelledby={studyView === 'board' ? 'board-tab' : 'booklet-tab'}>
      {studyView === 'board' && hasBoardContent && <iframe
        key={`${lesson.id}-board`}
        src={`${import.meta.env.BASE_URL}solve-with-me/index.html?embedded=1&subject=${encodeURIComponent(openLessonContext?.subjectId || lesson.category || '')}&chapter=${openLessonContext?.chapterNumber || ''}&lesson=${openLessonContext?.lessonNumber || ''}&lessonId=${encodeURIComponent(openLessonContext?.lessonId || lesson.id || '')}`}
        title="صبورة حل معي: السؤال والشرح وخطوات الحل"
        className="w-full rounded-2xl border border-emerald-500/30 bg-slate-900 animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-500 shadow-[0_12px_36px_rgba(16,185,129,0.12)]"
        style={{ height: 'min(850px, 80dvh)', minHeight: 480 }}
        allow="fullscreen; clipboard-write; web-share"
        allowFullScreen
      />}
      <div hidden={studyView !== 'booklet'}>
      {/* Educational Booklet / Real Curriculum View */}
      <LessonBookletView
        bookletData={curriculumData}
        isLoading={isLoadingCurriculum}
        error={curriculumError}
        lessonTitle={formatArabicLessonTitle(lesson.title)}
      />

      </div>
      </div>

      {/* ========================================================= */}
      {/* 🧭 END OF LESSON ACTIONS: Back to Map or Enter Tests */}
      {/* Video automatically stops when clicking any of these */}
      {/* ========================================================= */}
      <div className="pt-3 pb-6 space-y-2.5 border-t border-white/10">
        <div className="text-center">
          <span className="text-[11px] font-bold text-gray-400">
            أكملت دراسة هذا الدرس؟ اختر خطوتك القادمة:
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Action 1: Enter Tests & Quizzes (Stops video) */}
          <button
            onClick={handleNavigateToGames}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-yellow-500/20 border-2 border-amber-400/50 hover:border-amber-400 text-white transition-all shadow-lg active:scale-[0.98] cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black group-hover:scale-110 transition-transform shadow-md">
                <Gamepad2 className="w-5 h-5 fill-black" />
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-amber-300">اختبر نفسك الآن</div>
                <div className="text-[10px] text-gray-300">امتحان يومي ومسابقات تفاعلية</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-400 rotate-180 group-hover:-translate-x-1 transition-transform" />
          </button>

          {/* Action 2: Back to Progression Map (Stops video) */}
          <button
            onClick={handleNavigateToMap}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/20 via-blue-500/20 to-indigo-500/10 hover:from-sky-500/30 hover:to-indigo-500/20 border-2 border-sky-400/50 hover:border-sky-400 text-white transition-all shadow-lg active:scale-[0.98] cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-400 text-black flex items-center justify-center font-black group-hover:scale-110 transition-transform shadow-md">
                <MapPin className="w-5 h-5" />
              </div>
              <div className="text-right">
                <div className="text-xs font-black text-sky-300">خارطة التقدم والمسار</div>
                <div className="text-[10px] text-gray-300">العودة لخريطة الدروس والفصول</div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-sky-400 rotate-180 group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
