import React, { useEffect, useState } from 'react';
import { ArrowRight, BookOpen, ChevronLeft, Clock, Loader2, Play, RefreshCw, Users } from 'lucide-react';
import { useAppTheme } from '../services/themeService';
import { fetchMathematicsTopics, fetchMathematicsLectures, MATH_CHAPTER_TITLES, MathTopicIndex, MathLecture } from '../services/mathematicsCoursesService';

export function MathematicsCoursesView({ onBack }: { onBack: () => void }) {
  const { theme } = useAppTheme();
  const [topics, setTopics] = useState<MathTopicIndex[]>([]);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [chapter, setChapter] = useState<number | null>(null);
  const [topic, setTopic] = useState<MathTopicIndex | null>(null);
  const [lectures, setLectures] = useState<MathLecture[]>([]);
  const [lecture, setLecture] = useState<MathLecture | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingLectures, setLoadingLectures] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    fetchMathematicsTopics().then((data) => { if (active) setTopics(data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [retry]);

  useEffect(() => {
    let active = true;
    setLectures([]); setLecture(null); setError('');
    if (!topic) { setLoadingLectures(false); return; }
    setLoadingLectures(true);
    fetchMathematicsLectures(topic.recordId).then((data) => { if (active) setLectures(data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoadingLectures(false); });
    return () => { active = false; };
  }, [topic?.recordId, retry]);

  const goBack = () => {
    if (lecture) setLecture(null);
    else if (topic) setTopic(null);
    else if (chapter !== null) setChapter(null);
    else if (teacherId) setTeacherId(null);
    else onBack();
  };

  // Use the application's existing Android Back guard for each course level.
  useEffect(() => {
    const handleBack = (event: Event) => {
      if (teacherId || chapter !== null || topic || lecture) { event.preventDefault(); goBack(); }
    };
    window.addEventListener('duha-mathematics-back', handleBack);
    return () => window.removeEventListener('duha-mathematics-back', handleBack);
  }, [teacherId, chapter, topic, lecture]);

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'auto' }); }, [teacherId, chapter, topic?.topicId, lecture?.id]);

  const teachers = Array.from(new Map(topics.map((item) => [item.teacherId, item.teacherName])).entries());
  const teacherTopics = topics.filter((item) => item.teacherId === teacherId);
  const teacherName = teacherTopics[0]?.teacherName || '';
  const chapters = Array.from(new Set<number>(teacherTopics.map((item: MathTopicIndex) => item.chapterNumber))).sort((a, b) => a - b);
  const chapterTopics = teacherTopics.filter((item) => item.chapterNumber === chapter);
  const cardClass = `w-full text-right rounded-2xl border ${theme.classes.cardBorder} ${theme.classes.cardBg} p-4 flex items-center gap-3 transition active:scale-[0.98]`;
  const duration = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
  const stageTitle = lecture ? 'مشاهدة المحاضرة' : topic ? topic.title : chapter ? MATH_CHAPTER_TITLES[chapter] : teacherId ? teacherName : 'اختر مدرس الرياضيات';

  return <section dir="rtl" className="relative p-3 space-y-4 pb-8">
    <div className="flex items-center gap-3">
      <button type="button" onClick={goBack} aria-label="رجوع" className={`rounded-xl border p-2 ${theme.classes.cardBorder}`}><ArrowRight size={22} /></button>
      <div className="min-w-0"><p className={`text-xs ${theme.classes.textMuted}`}>الرياضيات • السادس العلمي</p><h1 className="font-black text-lg leading-relaxed">{stageTitle}</h1></div>
    </div>
    <nav aria-label="مسار الرياضيات" className={`flex flex-wrap items-center gap-1 text-xs leading-6 ${theme.classes.textMuted}`}>
      <button onClick={() => { setTeacherId(null); setChapter(null); setTopic(null); setLecture(null); }}>المدرسون</button>
      {teacherId && <><ChevronLeft size={13} /><button onClick={() => { setChapter(null); setTopic(null); setLecture(null); }}>{teacherName}</button></>}
      {chapter !== null && <><ChevronLeft size={13} /><button onClick={() => { setTopic(null); setLecture(null); }}>الفصل {chapter}</button></>}
      {topic && <><ChevronLeft size={13} /><button onClick={() => setLecture(null)}>{topic.title}</button></>}
    </nav>

    {(loading || loadingLectures) && <div role="status" className="flex justify-center items-center gap-2 py-12"><Loader2 className="animate-spin" size={24} />جارٍ تحميل {loadingLectures ? 'المحاضرات' : 'المدرسين'}…</div>}
    {error && <div role="alert" className={`${theme.classes.cardBg} rounded-2xl border p-5 text-center space-y-3`}><p>{error}</p><button onClick={() => setRetry((value) => value + 1)} className="inline-flex gap-2 items-center"><RefreshCw size={16} />إعادة المحاولة</button></div>}
    {!loading && !loadingLectures && !error && <>
      {!teacherId && <div className="space-y-3">{teachers.map(([id, name]) => {
        const items = topics.filter((item) => item.teacherId === id);
        return <button key={id} onClick={() => setTeacherId(id)} className={cardClass}>
          <div className="rounded-2xl p-3" style={{ background: `${theme.colors.primary}15`, color: theme.colors.primary }}><Users size={26} /></div>
          <div className="flex-1"><h2 className="font-bold">{name}</h2><p className={`text-xs mt-1 ${theme.classes.textMuted}`}>{new Set(items.map((item) => item.chapterNumber)).size} فصول • {items.reduce((sum, item) => sum + item.videoCount, 0)} محاضرة</p></div><ChevronLeft size={18} />
        </button>;
      })}{teachers.length === 0 && <p className="text-center py-8">لا توجد شروحات رياضيات متاحة حالياً.</p>}</div>}
      {teacherId && chapter === null && <div className="space-y-3">{chapters.map((number) => <button key={number} onClick={() => setChapter(number)} className={cardClass}>
        <BookOpen size={24} style={{ color: theme.colors.primary }} /><div className="flex-1"><h2 className="font-bold">الفصل {number} — {MATH_CHAPTER_TITLES[number]}</h2><p className={`text-xs mt-1 ${theme.classes.textMuted}`}>{teacherTopics.filter((item) => item.chapterNumber === number).length} موضوع</p></div><ChevronLeft size={18} />
      </button>)}</div>}
      {chapter !== null && !topic && <div className="space-y-3">{chapterTopics.map((item) => <button key={item.topicId} onClick={() => setTopic(item)} className={cardClass}>
        <BookOpen size={22} style={{ color: theme.colors.primary }} /><div className="flex-1 min-w-0"><h2 className="font-bold text-sm leading-relaxed">{item.title}</h2><p className={`text-xs mt-1 ${theme.classes.textMuted}`}>{item.videoCount} محاضرة</p></div><ChevronLeft size={18} />
      </button>)}</div>}
      {topic && <div className="space-y-3">
        {lecture && <div className={`rounded-2xl overflow-hidden border ${theme.classes.cardBorder} ${theme.classes.cardBg}`}>
          <iframe key={lecture.id} className="aspect-video w-full bg-black" src={`https://www.youtube.com/embed/${lecture.youtubeId}?autoplay=1&rel=0&playsinline=1`} title={lecture.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
          <div className="p-4 space-y-2"><h2 className="font-bold leading-relaxed">{lecture.title}</h2><p className={`text-xs ${theme.classes.textMuted}`}>{teacherName} • {duration(lecture.durationSeconds)}</p><a href={lecture.url} target="_blank" rel="noopener noreferrer" className="inline-block text-xs underline" style={{ color: theme.colors.primary }}>فتح في يوتيوب</a></div>
        </div>}
        <h2 className="font-bold text-sm">محاضرات الموضوع بالترتيب</h2>
        {lectures.map((item) => <button key={item.id} onClick={() => setLecture(item)} aria-pressed={lecture?.id === item.id} className={cardClass} style={lecture?.id === item.id ? { borderColor: theme.colors.primary } : undefined}>
          <img src={item.thumbnailUrl} alt="" loading="lazy" className="w-24 aspect-video object-cover rounded-lg shrink-0" />
          <div className="flex-1 min-w-0"><p className="font-bold text-xs leading-relaxed">{item.title}</p><p className={`text-xs mt-2 flex gap-1 items-center ${theme.classes.textMuted}`}><Clock size={12} />{duration(item.durationSeconds)}</p></div><Play size={17} style={{ color: theme.colors.primary }} />
        </button>)}
        {lectures.length === 0 && <p className="text-center py-8">لا توجد محاضرات متاحة لهذا الموضوع.</p>}
      </div>}
    </>}
  </section>;
}
