import React, { useEffect, useState } from 'react';
import { EducationalLesson } from '../types';
import { GRADE_6_SUBJECTS } from '../data/mockSubjects';
import { SubjectNeonIcon } from './SubjectNeonIcon';
import { appSfx } from '../utils/appSfx';
import { getSubjectIndex } from '../services/lessonsService';
import { useAppTheme } from '../services/themeService';

interface MainHomeViewProps {
  onSelectSubject: (subject: (typeof GRADE_6_SUBJECTS)[0]) => void;
  onSelectLesson?: (lesson: EducationalLesson) => void;
  onOpenGames?: () => void;
}

export const MainHomeView: React.FC<MainHomeViewProps> = ({
  onSelectSubject,
  onSelectLesson,
}) => {
  const { theme } = useAppTheme();
  const [lessonCounts, setLessonCounts] = useState<Record<string, number | null>>({});

  useEffect(() => {
    let active = true;
    Promise.all(GRADE_6_SUBJECTS.map(async (subject) => {
      try {
        const index = await getSubjectIndex(subject.id, subject.name);
        return [subject.id, index.totalLessons] as const;
      } catch (_) {
        return [subject.id, null] as const;
      }
    })).then((entries) => {
      if (active) setLessonCounts(Object.fromEntries(entries));
    });
    return () => { active = false; };
  }, []);

  return (
    <div className="min-h-full px-3 py-3 pb-24 text-right animate-in fade-in duration-300 select-none" onClickCapture={() => appSfx.tap()}>
      {/* 2-Column Grid of 8 Subjects matching the image exactly */}
      <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
        {GRADE_6_SUBJECTS.map((subject) => {
          return (
            <button
              key={subject.id}
              onClick={() => onSelectSubject(subject)}
              className="relative flex min-h-[168px] cursor-pointer flex-col items-center justify-between rounded-2xl border p-3.5 pb-3 pt-4 text-center shadow-lg backdrop-blur-xl transition-all duration-200 active:scale-[0.96] hover:scale-[1.02] sm:min-h-[185px] group"
              style={{
                background: `linear-gradient(155deg, color-mix(in srgb, ${theme.colors.bgCard} 92%, ${subject.color}), color-mix(in srgb, ${theme.colors.bgCardSubtle} 96%, ${subject.color}))`,
                borderColor: `color-mix(in srgb, ${theme.colors.border} 55%, ${subject.color})`,
                boxShadow: `0 8px 24px -8px ${theme.colors.glow}, 0 0 16px -12px ${subject.glowColor}, inset 0 1px 0 rgba(255,255,255,.2)`,
              }}
            >
              {/* Top Title */}
              <h3 className="text-sm font-black tracking-wide sm:text-base" style={{ color: theme.colors.textPrimary }}>
                {subject.name}
              </h3>

              {/* Center Glowing Neon Vector Illustration */}
              <div className="my-auto py-1 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <SubjectNeonIcon
                  type={subject.iconType}
                  className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-md"
                />
              </div>

              {/* Bottom Glowing Pill: Number of Lessons */}
              <div
                className="mt-1.5 rounded-full border px-3 py-0.5 text-[11px] font-bold tracking-tight shadow-sm transition-all duration-200 sm:text-xs"
                style={{
                  color: subject.color,
                  borderColor: `color-mix(in srgb, ${subject.color} 58%, ${theme.colors.border})`,
                  backgroundColor: `color-mix(in srgb, ${theme.colors.bgCard} 84%, ${subject.color})`,
                  boxShadow: `0 0 12px ${subject.glowColor}`,
                }}
              >
                <span>{lessonCounts[subject.id] == null ? 'جارٍ التحقق…' : `${lessonCounts[subject.id]} درسًا`}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
