import React from 'react';
import { GRADE_6_SUBJECTS } from '../data/mockSubjects';
import { SubjectNeonIcon } from './SubjectNeonIcon';

type Subject = (typeof GRADE_6_SUBJECTS)[0];

interface SubjectBookTransitionProps {
  subject: Subject;
  direction: 'open' | 'close';
}

export const SubjectBookTransition: React.FC<SubjectBookTransitionProps> = ({ subject, direction }) => (
  <div
    className={`subject-book-transition subject-book-transition--${direction}`}
    role="status"
    aria-live="polite"
    aria-label={direction === 'open' ? `فتح كتاب ${subject.name}` : `إغلاق كتاب ${subject.name}`}
    style={{ '--subject-book-color': subject.color, '--subject-book-glow': subject.glowColor } as React.CSSProperties}
  >
    <div className="subject-book-aura" />
    <div className="subject-book-stage">
      <div className="subject-book-pages" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="subject-book-inside">
        <span className="subject-book-inside-icon"><SubjectNeonIcon type={subject.iconType} className="h-16 w-16" /></span>
        <strong>{subject.name}</strong>
        <small>{direction === 'open' ? 'يفتح محتوى المادة…' : 'العودة إلى المواد…'}</small>
      </div>
      <div className="subject-book-cover">
        <span className="subject-book-cover-shine" />
        <SubjectNeonIcon type={subject.iconType} className="h-20 w-20 drop-shadow-lg" />
        <strong>{subject.name}</strong>
        <small>الصف السادس</small>
      </div>
      <div className="subject-book-spine" aria-hidden="true" />
    </div>
  </div>
);
