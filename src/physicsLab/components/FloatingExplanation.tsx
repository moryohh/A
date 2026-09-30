import React from 'react';
import { DiagramPart } from '../types';

interface FloatingExplanationProps {
  part: DiagramPart | null;
  onClear: () => void;
}

export const FloatingExplanation: React.FC<FloatingExplanationProps> = ({ part, onClear }) => {
  if (!part) {
    return (
      <div className="py-2.5 px-4 text-center text-xs text-slate-400 select-none">
        مرّر الفأرة أو انقر على أي جزء أو خط تأشير لعرض التوضيح والوظيفة العلمية
      </div>
    );
  }

  return (
    <div
      id="scientific-annotation"
      className="relative px-5 py-3.5 border-t border-slate-200/80 bg-slate-50/70 text-slate-800 transition-all duration-200"
    >
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        {/* Title & English designation */}
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-slate-900 leading-none">
              {part.name}
            </h4>
            {part.englishName && (
              <span className="text-[11px] font-mono text-slate-500">
                {part.englishName}
              </span>
            )}
          </div>
        </div>

        {/* Concise scientific facts without bulky website cards */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-600 leading-relaxed border-t sm:border-t-0 sm:border-r border-slate-200/60 pt-2 sm:pt-0 sm:pr-4">
          <div>
            <span className="font-bold text-slate-800">الوصف: </span>
            {part.explanation}
          </div>
          <div>
            <span className="font-bold text-sky-700">الوظيفة: </span>
            {part.functionText}
          </div>
          {part.locationText && (
            <div className="sm:col-span-2 text-slate-500">
              <span className="font-semibold text-slate-700">الموقع / الملاحظة: </span>
              {part.locationText}
            </div>
          )}
        </div>

        {/* Clear selection button */}
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded transition-colors self-end md:self-center"
          title="إغلاق التوضيح"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
