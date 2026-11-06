import React from 'react';
import { GRADE_6_SUBJECTS } from '../data/mockSubjects';
import { SubjectNeonIcon } from './SubjectNeonIcon';
import type { SubjectCardOrigin } from './MainHomeView';

type Subject = (typeof GRADE_6_SUBJECTS)[0];

interface SubjectBookTransitionProps {
  subject: Subject;
  direction: 'open' | 'close';
  origin: SubjectCardOrigin;
}

export const SubjectBookTransition: React.FC<SubjectBookTransitionProps> = ({ subject, direction, origin }) => (
  <div
    className={`subject-book-transition subject-book-transition--${direction}`}
    role="status"
    aria-live="polite"
    aria-label={direction === 'open' ? `فتح كتاب ${subject.name}` : `إغلاق كتاب ${subject.name}`}
    style={{
      '--subject-book-color': subject.color,
      '--subject-book-glow': subject.glowColor,
      '--subject-origin-top': `${origin.top}px`,
      '--subject-origin-left': `${origin.left}px`,
      '--subject-origin-width': `${origin.width}px`,
      '--subject-origin-height': `${origin.height}px`,
    } as React.CSSProperties}
  >
    <div className="subject-book-aura" />
    <div className="subject-book-stage">
      <div className="subject-book-pages" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="subject-book-inside">
        <div className="subject-book-page subject-book-page--left" />
        <div className="subject-book-page subject-book-page--right">
          <span className="subject-book-inside-icon"><SubjectNeonIcon type={subject.iconType} className="h-14 w-14" /></span>
          <strong>{subject.name}</strong>
          <small>خارطة التقدم</small>
        </div>
        <span className="subject-book-gutter" aria-hidden="true" />
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
