import React, { useEffect, useState } from 'react';
import { FlaskConical, X } from 'lucide-react';
import { SubjectChapter } from '../types';

interface ScienceLaboratoryModalProps {
  subjectId: string;
  subjectName: string;
  chapters: SubjectChapter[];
  initialChapterNumber: number;
  onClose: () => void;
}

export const ScienceLaboratoryModal: React.FC<ScienceLaboratoryModalProps> = ({
  subjectId,
  subjectName,
  chapters,
  initialChapterNumber,
  onClose,
}) => {
  const [chapterNumber, setChapterNumber] = useState(initialChapterNumber);
  const [isFrameLoading, setIsFrameLoading] = useState(true);
  const available = subjectId === 'biology' && chapterNumber === 1;
  const contentType = subjectId === 'biology' ? 'الرسومات' : 'التجارب';

  useEffect(() => {
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onEscape);
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.body.style.overflow = priorOverflow;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#071322] text-white" dir="rtl" role="dialog" aria-modal="true" aria-label={`مختبر ${subjectName}`}>
      <div className="flex items-center justify-between gap-3 border-b border-sky-500/30 bg-[#0d2035] px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <FlaskConical className="w-6 h-6 text-cyan-300 shrink-0" />
          <div className="min-w-0">
            <h2 className="font-black text-base truncate">مختبر {subjectName}</h2>
            <p className="text-xs text-sky-200">{contentType} بحسب الفصل</p>
          </div>
        </div>
        <button type="button" onClick={onClose} aria-label="إغلاق المختبر" className="rounded-xl border border-white/30 p-2 hover:bg-white/10"><X className="w-5 h-5" /></button>
      </div>
      <div className="border-b border-white/10 bg-[#0b192c] px-4 py-3">
        <label htmlFor="laboratory-chapter" className="block text-sm font-bold mb-1">اختر الفصل</label>
        <select
          id="laboratory-chapter"
          value={chapterNumber}
          onChange={(event) => { setChapterNumber(Number(event.target.value)); setIsFrameLoading(true); }}
          className="w-full rounded-xl border border-sky-500/50 bg-[#142943] px-3 py-2 text-white"
        >
          {chapters.map((chapter) => (
            <option key={chapter.id} value={chapter.number}>{chapter.title}</option>
          ))}
        </select>
      </div>
      {available ? (
        <div className="relative flex-1 min-h-0">
          {isFrameLoading && <p className="absolute inset-0 flex items-center justify-center text-sky-200">جاري فتح رسومات الفصل الأول…</p>}
          <iframe
            title="رسومات الأحياء التفاعلية للفصل الأول"
            src={`${import.meta.env.BASE_URL}laboratory/biology/chapter-1/index.html`}
            onLoad={() => setIsFrameLoading(false)}
            className="h-full w-full border-0 bg-slate-950"
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center text-sky-100">
          <FlaskConical className="w-14 h-14 text-sky-400" />
          <p className="text-lg font-black">لم يُرفع {contentType} لهذا الفصل بعد</p>
          <p className="text-sm text-sky-300">يمكنك اختيار فصل آخر. لن نعرض محتوى فصل مختلف هنا.</p>
        </div>
      )}
    </div>
  );
};
