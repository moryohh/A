import React from 'react';
import { EducationalLesson } from '../types';
import { GRADE_6_SUBJECTS } from '../data/mockSubjects';
import { SubjectNeonIcon } from './SubjectNeonIcon';
import { gameAudio } from '../utils/gameAudio';

interface MainHomeViewProps {
  onSelectSubject: (subject: (typeof GRADE_6_SUBJECTS)[0]) => void;
  onSelectLesson?: (lesson: EducationalLesson) => void;
  onOpenGames?: () => void;
}

export const MainHomeView: React.FC<MainHomeViewProps> = ({
  onSelectSubject,
  onSelectLesson,
}) => {
  return (
    <div className="min-h-full px-3 py-3 pb-24 text-right animate-in fade-in duration-300 select-none" onClickCapture={() => gameAudio.playPrimaryNavigation()}>
      {/* 2-Column Grid of 8 Subjects matching the image exactly */}
      <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto">
        {GRADE_6_SUBJECTS.map((subject) => {
          return (
            <button
              key={subject.id}
              onClick={() => onSelectSubject(subject)}
              className={`relative flex flex-col items-center justify-between p-3.5 pt-4 pb-3 rounded-2xl bg-gradient-to-b ${subject.bgGradient} border ${subject.borderColor} backdrop-blur-xl shadow-lg transition-all duration-200 active:scale-[0.96] hover:scale-[1.02] group text-center cursor-pointer min-h-[168px] sm:min-h-[185px]`}
              style={{
                boxShadow: `0 8px 24px -6px ${subject.glowColor}, inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)`,
              }}
            >
              {/* Top Title */}
              <h3 className="text-sm sm:text-base font-black text-white tracking-wide drop-shadow-sm">
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
                className={`mt-1.5 px-3 py-0.5 rounded-full border text-[11px] sm:text-xs font-bold tracking-tight shadow-sm transition-all duration-200 ${subject.badgeColor}`}
                style={{
                  boxShadow: `0 0 12px ${subject.glowColor}`,
                }}
              >
                <span>{subject.lessonCountText}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
