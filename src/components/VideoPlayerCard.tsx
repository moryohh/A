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
} from 'lucide-react';
import { LessonBookletView } from './LessonBookletView';
import { LessonBookletData } from '../data/lessonBooklet';
import { fetchLessonCurriculum } from '../services/curriculumService';
import { cleanTeacherName } from '../utils/cleanTeacherName';
import { extractYoutubeId, formatArabicLessonTitle } from '../services/lessonsService';
import { useAppTheme } from '../services/themeService';

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

      {/* Lesson Title & Info Block with Clean Teacher Name */}
      <div
        className={`rounded-2xl p-3.5 sm:p-4 text-right shadow-lg space-y-1 border transition-all duration-300 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
        style={{
          boxShadow: `0 4px 20px ${theme.colors.glow}`,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <span
            className="inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-md border transition-colors"
            style={{
              backgroundColor: `${theme.colors.primary}20`,
              borderColor: `${theme.colors.primary}40`,
              color: theme.colors.primary,
            }}
          >
            {formatArabicLessonTitle(lesson.subtitle || 'السادس الإعدادي - العراق')}
          </span>
          <span className={`text-xs font-semibold ${theme.classes.textMuted}`}>
            {cleanedTeacherName}
          </span>
        </div>
        <h2 className={`text-base sm:text-lg font-bold leading-snug ${theme.classes.textMain}`}>
          {formatArabicLessonTitle(lesson.title)}
        </h2>
        {lesson.description && (
          <p className={`text-xs pt-0.5 leading-relaxed ${theme.classes.textMuted}`}>
            {formatArabicLessonTitle(lesson.description)}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3" dir="ltr" role="tablist" aria-label="أدوات الدراسة">
        <button role="tab" id="booklet-tab" aria-selected={studyView === 'booklet'} aria-controls="study-panel" onClick={() => setStudyView('booklet')} className={`flex items-center justify-center gap-2 rounded-2xl border p-3 font-bold ${studyView === 'booklet' ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'border-white/15 text-gray-400'}`}><BookOpen size={22} /> الملزمة</button>
        <button role="tab" id="board-tab" aria-selected={studyView === 'board'} aria-controls="study-panel" onClick={() => setStudyView('board')} className={`flex items-center justify-center gap-2 rounded-2xl border p-3 font-bold ${studyView === 'board' ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'border-white/15 text-gray-400'}`}><Presentation size={22} /> الصبورة — حل معي</button>
      </div>
      <div id="study-panel" role="tabpanel" aria-labelledby={studyView === 'board' ? 'board-tab' : 'booklet-tab'}>
      {studyView === 'board' && <iframe
        key={`${lesson.id}-board`}
        src={`${import.meta.env.BASE_URL}solve-with-me/index.html?subject=${encodeURIComponent(openLessonContext?.subjectId || lesson.category || '')}&chapter=${openLessonContext?.chapterNumber || ''}&lesson=${openLessonContext?.lessonNumber || ''}`}
        title="صبورة حل معي: السؤال والشرح وخطوات الحل"
        className="w-full rounded-2xl border border-emerald-500/30 bg-slate-900"
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
