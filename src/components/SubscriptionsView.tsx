import React, { useState } from 'react';
import {
  ArrowRight,
  BadgePercent,
  BellRing,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Layers,
  MapPin,
  MonitorCheck,
  UsersRound,
} from 'lucide-react';
import { useAppTheme } from '../services/themeService';
import { registerCourseReminder } from '../services/communityService';
import {
  COURSE_STATUS_LABELS,
  CourseStatus,
  MOCK_COURSES,
  MockCourse,
} from '../data/mockCourses';
import { CompetitionSnapshot, EducationalLesson } from '../types';

interface SubscriptionsViewProps {
  onSelectLesson: (lesson: EducationalLesson) => void;
  onBack?: () => void;
  competitionSnapshot?: CompetitionSnapshot | null;
}

const STATUS_STYLES: Record<CourseStatus, { text: string; background: string; border: string }> = {
  full: {
    text: '#fbbf24',
    background: 'rgba(245,158,11,0.13)',
    border: 'rgba(245,158,11,0.35)',
  },
  upcoming: {
    text: '#86efac',
    background: 'rgba(34,197,94,0.13)',
    border: 'rgba(34,197,94,0.35)',
  },
  open: {
    text: '#7dd3fc',
    background: 'rgba(14,165,233,0.13)',
    border: 'rgba(14,165,233,0.35)',
  },
  closed: {
    text: '#cbd5e1',
    background: 'rgba(148,163,184,0.13)',
    border: 'rgba(148,163,184,0.35)',
  },
};

const formatPrice = (price?: number) => (price === undefined ? '' : `${price.toLocaleString('en-US')} د.ع`);

const getPriceBoxStyle = (course: MockCourse): React.CSSProperties => {
  if (course.isFree) {
    return {
      color: '#f0fdf4',
      backgroundColor: '#166534',
      borderColor: '#fbbf24',
    };
  }
  if (course.status === 'upcoming') {
    return {
      color: '#eff6ff',
      backgroundColor: '#075985',
      borderColor: '#fbbf24',
    };
  }
  if (course.status === 'full') {
    return {
      color: '#fff7ed',
      backgroundColor: '#c2410c',
      borderColor: '#fbbf24',
    };
  }
  return {
    color: '#0f172a',
    backgroundColor: 'rgba(15,23,42,0.06)',
    borderColor: 'rgba(15,23,42,0.2)',
  };
};

const getStatusMessage = (course: MockCourse) => {
  if (course.status === 'upcoming') {
    return {
      title: 'التقديم يبدأ في الشهر الحادي عشر',
      description: 'سيبدأ التقديم على هذه الدورة في الشهر الحادي عشر.',
    };
  }

  if (course.status === 'full') {
    return {
      title: 'المقاعد ممتلئة',
      description: 'اكتملت المقاعد المتاحة لهذه الدورة حاليًا.',
    };
  }

  if (course.status === 'open') {
    if (course.isFree) {
      return {
        title: 'دورة مجانية — ابدأ الآن',
        description: 'تبدأ هذه الدورة في 1/12، ويمكنك التقديم الآن بعد استيفاء شروط المستوى والتقييم.',
      };
    }

    return {
      title: 'التسجيل متاح',
      description: 'يمكنك الاطلاع على تفاصيل التسجيل عند تفعيل الدورة رسميًا.',
    };
  }

  return {
    title: 'التسجيل مغلق',
    description: 'التسجيل غير متاح لهذه الدورة حاليًا.',
  };
};

export const SubscriptionsView: React.FC<SubscriptionsViewProps> = ({ onBack, competitionSnapshot }) => {
  const { theme } = useAppTheme();
  const [selectedCourse, setSelectedCourse] = useState<MockCourse | null>(null);
  const [reminderState, setReminderState] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [reminderMessage, setReminderMessage] = useState('');
  const [applicationState, setApplicationState] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  const [applicationMessage, setApplicationMessage] = useState('');

  const openCourseDialog = (course: MockCourse) => {
    setSelectedCourse(course);
    setReminderState('idle');
    setReminderMessage('');
    setApplicationState('idle');
    setApplicationMessage('');
  };

  const closeCourseDialog = () => {
    setSelectedCourse(null);
    setReminderState('idle');
    setReminderMessage('');
    setApplicationState('idle');
    setApplicationMessage('');
  };

  const handleApplyForFreeCourse = () => {
    if (!selectedCourse?.isFree) return;
    setApplicationState('checking');
    setApplicationMessage('');

    const requiredLevel = selectedCourse.requiredLevel ?? 80;
    const currentLevel = competitionSnapshot?.level ?? 0;
    const hasRequiredRating = competitionSnapshot?.ratingTier === selectedCourse.requiredRating;
    const hasRequiredLevel = currentLevel >= requiredLevel;

    if (!hasRequiredRating || !hasRequiredLevel) {
      const reasons = [
        !hasRequiredRating ? 'تقييمك الحالي ليس ذهبيًا.' : '',
        !hasRequiredLevel ? `مستواك الحالي ${currentLevel}، ويجب أن يصل إلى ${requiredLevel}.` : '',
      ].filter(Boolean);
      setApplicationState('error');
      setApplicationMessage(`لم تستوفِ الشروط بعد. ${reasons.join(' ')} آخر موعد لاستيفاء الشروط هو ${selectedCourse.applicationDeadline || '25 نوفمبر'}.`);
      return;
    }

    setApplicationState('success');
    setApplicationMessage('تم استيفاء شروط التقديم مبدئيًا. تبدأ الدورة في 1/12.');
  };

  const handleRegisterReminder = async () => {
    if (!selectedCourse || selectedCourse.status !== 'upcoming') return;
    setReminderState('saving');
    setReminderMessage('');
    try {
      const response = await registerCourseReminder(selectedCourse.id);
      setReminderState('success');
      setReminderMessage(response.message || 'تم تسجيل تذكيرك بنجاح');
    } catch (error: any) {
      setReminderState('error');
      setReminderMessage(error?.message || 'تعذر تسجيل التذكير حاليًا');
    }
  };

  return (
    <div className="space-y-4 p-3 pb-[calc(7rem+env(safe-area-inset-bottom))] text-right select-none sm:p-4 animate-in fade-in duration-200">
      <section
        className={`relative overflow-hidden rounded-3xl border p-4 shadow-xl ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
        style={{ boxShadow: `0 8px 28px ${theme.colors.glow}` }}
      >
        <div
          className="pointer-events-none absolute -left-12 -top-12 h-32 w-32 rounded-full blur-3xl"
          style={{ backgroundColor: `${theme.colors.primary}30` }}
        />
        <div className="relative flex items-start justify-end gap-3">
          <div className="min-w-0">
            <h1 className={`text-xl font-black tracking-tight sm:text-2xl ${theme.classes.textMain}`}>الدورات التعليمية</h1>
            <p className={`mt-1 text-xs leading-6 sm:text-sm ${theme.classes.textMuted}`}>
              اختر الدورة المناسبة لك وابدأ رحلتك نحو التفوق
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-3">
        {MOCK_COURSES.map((course) => {
          const statusStyle = STATUS_STYLES[course.status];

          return (
            <button
              key={course.id}
              type="button"
              onClick={() => openCourseDialog(course)}
              className={`group relative w-full overflow-hidden rounded-3xl border p-4 text-right shadow-lg transition-[transform,box-shadow,border-color] duration-200 active:scale-[0.99] hover:-translate-y-0.5 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
              style={{
                boxShadow: course.featured ? `0 10px 32px ${theme.colors.glow}` : undefined,
                borderColor: course.featured ? `${theme.colors.primary}70` : undefined,
              }}
            >
              {course.featured && (
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-1"
                  style={{ background: `linear-gradient(90deg, ${theme.colors.secondary}, ${theme.colors.primary}, ${theme.colors.accent})` }}
                />
              )}

              <div className="flex items-start justify-between gap-3">
                <span
                  className="flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-black"
                  style={{
                    color: statusStyle.text,
                    backgroundColor: statusStyle.background,
                    borderColor: statusStyle.border,
                  }}
                >
                  {course.status === 'full' ? <UsersRound className="h-3.5 w-3.5" /> : <CalendarDays className="h-3.5 w-3.5" />}
                  {course.statusLabel || COURSE_STATUS_LABELS[course.status]}
                </span>

                <div className="min-w-0">
                  <div className="mb-1 flex items-center justify-end gap-1.5">
                    {course.featured && <BadgePercent className="h-4 w-4" style={{ color: theme.colors.secondary }} />}
                    <h2 className={`text-base font-black leading-7 sm:text-lg ${theme.classes.textMain}`}>{course.title}</h2>
                  </div>
                </div>
              </div>


              <div className={`mt-4 flex items-end justify-between gap-3 border-t pt-3 ${theme.classes.cardBorder}`}>
                <span
                  className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-[10px] font-black transition-transform group-hover:translate-x-0.5"
                  style={{ color: theme.colors.primary, backgroundColor: `${theme.colors.primary}14` }}
                >
                  <span>عرض التفاصيل</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>

                <div className="rounded-2xl border px-3 py-2 text-left" style={getPriceBoxStyle(course)}>
                  {course.oldPrice !== undefined && (
                    <div className="text-sm font-black line-through" style={{ color: 'rgba(255,255,255,0.96)' }}>{formatPrice(course.oldPrice)}</div>
                  )}
                  {course.isFree ? (
                    <div className="flex items-center justify-end gap-1.5 text-2xl font-black">
                      <span>مجانية</span>
                      <CheckCircle2 className="h-5 w-5" style={{ color: '#fbbf24' }} />
                    </div>
                  ) : course.currentPrice !== undefined ? (
                    <div className="flex items-baseline justify-end gap-1.5">
                      <span className="text-xs font-black">د.ع</span>
                      <span className="text-3xl font-black tracking-tight">{course.currentPrice.toLocaleString('en-US')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs font-black">
                      <Clock3 className="h-3.5 w-3.5" />
                      بدون سعر حالي
                    </div>
                  )}
                  {course.badge && (
                    <div className="mt-0.5 flex items-center justify-end gap-1 text-[10px] font-black">
                      <BadgePercent className="h-3.5 w-3.5" style={{ color: '#fbbf24' }} />
                      {course.badge}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[10px] font-bold">
                <span className="flex items-center gap-1" style={{ color: theme.colors.primary }}>
                  <MonitorCheck className="h-3.5 w-3.5" />
                  امتحان إلكتروني
                </span>
                {course.includesInPersonExam && (
                  <span className="flex items-center gap-1" style={{ color: theme.colors.secondary }}>
                    <MapPin className="h-3.5 w-3.5" />
                    امتحان حضوري
                  </span>
                )}
                {course.registrationMonth && (
                  <span className="flex items-center gap-1" style={{ color: statusStyle.text }}>
                    <CalendarDays className="h-3.5 w-3.5" />
                    يبدأ في {course.registrationMonth}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {selectedCourse && (
        <div
          className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/70 p-4 pb-[calc(7rem+env(safe-area-inset-bottom))] backdrop-blur-sm animate-in fade-in duration-150 sm:items-center"
          role="presentation"
          onClick={closeCourseDialog}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="course-status-title"
            className={`my-auto max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto overscroll-contain rounded-3xl border p-5 text-right shadow-2xl animate-in zoom-in-95 duration-150 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex shrink-0 items-center">
                <button
                  type="button"
                  onClick={closeCourseDialog}
                  className={`flex items-center gap-1 rounded-xl border px-2.5 py-2 text-[10px] font-black transition-transform active:scale-95 ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`}
                  style={{ color: theme.colors.primary }}
                  aria-label="الرجوع إلى قائمة الدورات"
                >
                  <ArrowRight className="h-4 w-4" />
                  <span>رجوع</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border"
                  style={{
                    color: STATUS_STYLES[selectedCourse.status].text,
                    backgroundColor: STATUS_STYLES[selectedCourse.status].background,
                    borderColor: STATUS_STYLES[selectedCourse.status].border,
                  }}
                >
                  {selectedCourse.status === 'upcoming' ? <Clock3 className="h-5 w-5" /> : <UsersRound className="h-5 w-5" />}
                </span>
                <div>
                  <h3 id="course-status-title" className={`text-base font-black ${theme.classes.textMain}`}>
                    {getStatusMessage(selectedCourse).title}
                  </h3>
                  <p className={`mt-0.5 text-[10px] ${theme.classes.textMuted}`}>{selectedCourse.title}</p>
                </div>
              </div>
            </div>

            <p className={`mt-5 rounded-2xl border p-3 text-xs leading-6 ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder} ${theme.classes.textMuted}`}>
              {getStatusMessage(selectedCourse).description}
            </p>

            <div className={`mt-3 rounded-2xl border p-3 ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`}>
              <div className={`mb-2 text-xs font-black ${theme.classes.textMain}`}>المواد التي تغطيها</div>
              <div className="flex flex-wrap justify-end gap-1.5">
                {selectedCourse.subjects.map((subject) => (
                  <span key={subject} className="rounded-full px-2 py-1 text-[10px] font-bold" style={{ color: theme.colors.primary, backgroundColor: `${theme.colors.primary}18` }}>
                    {subject}
                  </span>
                ))}
              </div>
            </div>

            <div className={`mt-3 space-y-2 rounded-2xl border p-3 text-xs ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`}>
              <div className="flex items-center justify-end gap-2" style={{ color: theme.colors.primary }}>
                <span>تشمل جدول المواد التي تغطيها</span>
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="flex items-center justify-end gap-2" style={{ color: theme.colors.primary }}>
                <span>تشمل الامتحان الإلكتروني</span>
                <MonitorCheck className="h-4 w-4" />
              </div>
              {selectedCourse.includesInPersonExam && (
                <div className="flex items-center justify-end gap-2" style={{ color: theme.colors.secondary }}>
                  <span>تشمل الامتحان الحضوري</span>
                  <MapPin className="h-4 w-4" />
                </div>
              )}
              {!selectedCourse.includesInPersonExam && (
                <div className={`text-[10px] ${theme.classes.textMuted}`}>لا تشمل الامتحان الحضوري</div>
              )}
            </div>

            {(selectedCourse.status === 'upcoming' || selectedCourse.isFree) && selectedCourse.registrationMonth && (
              <div className="mt-3 flex items-center justify-end gap-1.5 text-xs font-black" style={{ color: theme.colors.secondary }}>
                <CalendarDays className="h-4 w-4" />
                تبدأ الدورة في {selectedCourse.registrationMonth}
              </div>
            )}

            {selectedCourse.isFree && (
              <>
                <div className={`mt-3 space-y-2 rounded-2xl border p-3 text-xs leading-6 ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`}>
                  <div className="font-black" style={{ color: theme.colors.secondary }}>تفاصيل المقاعد</div>
                  <div className={theme.classes.textMuted}>السعة: {selectedCourse.seatsPerGovernorate || 400} مقعد لكل محافظة.</div>
                  <div className={theme.classes.textMuted}>تبدأ الدورة في 1/12، ويفتح الدخول مع بدء الدورة.</div>
                </div>
                {selectedCourse.sponsorNote && (
                  <div className={`mt-3 rounded-2xl border p-3 text-xs leading-6 ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`}>
                    <div className="flex items-center justify-end gap-3">
                      {selectedCourse.sponsorLogo && (
                        <img
                          src={selectedCourse.sponsorLogo}
                          alt="شعار Thompson"
                          loading="lazy"
                          className="h-14 w-14 rounded-xl bg-white object-contain p-1"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-black" style={{ color: theme.colors.secondary }}>الداعم الرسمي</div>
                        <div className={theme.classes.textMuted}>{selectedCourse.sponsorNote}</div>
                      </div>
                    </div>
                  </div>
                )}
                <div className={`mt-3 space-y-2 rounded-2xl border p-3 text-xs leading-6 ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`}>
                  <div className="font-black" style={{ color: theme.colors.secondary }}>شروط التقديم للدورة المجانية</div>
                  <div className={theme.classes.textMuted}>يجب أن يكون مستواك 80 أو أكثر، وأن يكون تقييمك ذهبيًا.</div>
                  <div className={theme.classes.textMuted}>آخر موعد للوصول إلى الشروط: {selectedCourse.applicationDeadline || '25 نوفمبر'}.</div>
                </div>
              </>
            )}

            {applicationMessage && (
              <div
                className={`mt-3 rounded-xl border px-3 py-2 text-center text-[10px] font-bold leading-6 ${applicationState === 'error' ? 'border-red-400/30 text-red-300' : 'border-emerald-400/30 text-emerald-300'}`}
              >
                {applicationMessage}
              </div>
            )}

            {reminderMessage && (
              <div
                className={`mt-3 rounded-xl border px-3 py-2 text-center text-[10px] font-bold ${reminderState === 'error' ? 'border-red-400/30 text-red-300' : 'border-emerald-400/30 text-emerald-300'}`}
              >
                {reminderMessage}
              </div>
            )}

            <div className={`mt-5 grid gap-2 ${selectedCourse.status === 'upcoming' ? 'grid-cols-2' : selectedCourse.isFree ? 'grid-cols-1' : 'grid-cols-1'}`}>
              {selectedCourse.isFree && (
                <button
                  type="button"
                  onClick={handleApplyForFreeCourse}
                  disabled={applicationState === 'checking' || applicationState === 'success'}
                  className="flex items-center justify-center gap-1.5 rounded-2xl px-3 py-3 text-xs font-black text-slate-950 transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.primary})` }}
                >
                  <UsersRound className="h-4 w-4" />
                  {applicationState === 'checking' ? 'جارٍ التحقق...' : applicationState === 'success' ? 'تم التحقق من الشروط' : 'حجز المقعد الآن'}
                </button>
              )}
              {selectedCourse.status === 'upcoming' && (
                <button
                  type="button"
                  onClick={handleRegisterReminder}
                  disabled={reminderState === 'saving' || reminderState === 'success'}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border px-3 py-3 text-[10px] font-black transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  style={{
                    color: theme.colors.secondary,
                    borderColor: `${theme.colors.secondary}55`,
                    backgroundColor: `${theme.colors.secondary}14`,
                  }}
                >
                  <BellRing className="h-4 w-4" />
                  {reminderState === 'saving' ? 'جارٍ الحفظ...' : reminderState === 'success' ? 'تم تذكيري' : 'ذكرني عند فتح الدورة'}
                </button>
              )}
              <button
                type="button"
                onClick={closeCourseDialog}
                className="rounded-2xl px-4 py-3 text-xs font-black text-white transition-transform active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})` }}
              >
                حسنًا
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
