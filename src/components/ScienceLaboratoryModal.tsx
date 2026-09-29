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
  const [selectedDiagram, setSelectedDiagram] = useState('bacteria');
  const [imageFailed, setImageFailed] = useState(false);
  const referenceImages: Record<string, string> = {
    'plasma-membrane': 'https://xutqrhwqrodzmbdlgqsg.supabase.co/storage/v1/object/public/biology-chapter-1-reference/plasma-membrane.jpg',
    'mitochondria': 'https://xutqrhwqrodzmbdlgqsg.supabase.co/storage/v1/object/public/biology-chapter-1-reference/mitochondria.jpg',
    'chloroplast': 'https://xutqrhwqrodzmbdlgqsg.supabase.co/storage/v1/object/public/biology-chapter-1-reference/chloroplast.jpg',
    'lysosome': 'https://xutqrhwqrodzmbdlgqsg.supabase.co/storage/v1/object/public/biology-chapter-1-reference/lysosome.jpg',
    'chromosome': 'https://xutqrhwqrodzmbdlgqsg.supabase.co/storage/v1/object/public/biology-chapter-1-reference/chromosome.jpg',
    'plant-animal-cell': 'https://xutqrhwqrodzmbdlgqsg.supabase.co/storage/v1/object/public/biology-chapter-1-reference/plant-animal-cell.jpg',
    'diffusion-exp': 'https://xutqrhwqrodzmbdlgqsg.supabase.co/storage/v1/object/public/biology-chapter-1-reference/diffusion-exp.jpg',
    'osmosis-exp': 'https://xutqrhwqrodzmbdlgqsg.supabase.co/storage/v1/object/public/biology-chapter-1-reference/osmosis-exp.jpg',
    'osmosis-cells': 'https://xutqrhwqrodzmbdlgqsg.supabase.co/storage/v1/object/public/biology-chapter-1-reference/osmosis-cells.jpg',
    'active-transport': 'https://xutqrhwqrodzmbdlgqsg.supabase.co/storage/v1/object/public/biology-chapter-1-reference/active-transport.jpg',
    'phagocytosis': 'https://xutqrhwqrodzmbdlgqsg.supabase.co/storage/v1/object/public/biology-chapter-1-reference/phagocytosis.jpg',
    'pinocytosis': 'https://xutqrhwqrodzmbdlgqsg.supabase.co/storage/v1/object/public/biology-chapter-1-reference/pinocytosis.jpg',
    'exocytosis': 'https://xutqrhwqrodzmbdlgqsg.supabase.co/storage/v1/object/public/biology-chapter-1-reference/exocytosis.jpg',
    'glycolysis': 'https://xutqrhwqrodzmbdlgqsg.supabase.co/storage/v1/object/public/biology-chapter-1-reference/glycolysis.jpg',
    'krebs-cycle': 'https://xutqrhwqrodzmbdlgqsg.supabase.co/storage/v1/object/public/biology-chapter-1-reference/krebs-cycle.jpg',
    'mitosis': 'https://xutqrhwqrodzmbdlgqsg.supabase.co/storage/v1/object/public/biology-chapter-1-reference/mitosis.jpg',
    'meiosis': 'https://xutqrhwqrodzmbdlgqsg.supabase.co/storage/v1/object/public/biology-chapter-1-reference/meiosis.jpg',
    'bacteria': 'https://xutqrhwqrodzmbdlgqsg.supabase.co/storage/v1/object/public/biology-chapter-1-reference/bacteria.jpg',
  };
  const available = subjectId === 'biology' && [1, 2, 3].includes(chapterNumber);
  const chapterName = ['الأول', 'الثاني', 'الثالث'][chapterNumber - 1] || String(chapterNumber);
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
        <div className="relative flex-1 min-h-0 overflow-y-auto">
          {isFrameLoading && <p className="absolute inset-0 flex items-center justify-center text-sky-200">جاري فتح رسومات الفصل {chapterName}…</p>}
          {chapterNumber === 1 && referenceImages[selectedDiagram] && (
            <div className="border-b border-sky-500/30 bg-white text-slate-900 text-center">
              <p className="py-1 text-xs font-bold">الرسم الأصلي</p>
              {imageFailed ? <p className="p-4">تعذر تحميل الصورة الأصلية. المجسم التفاعلي متاح بالأسفل.</p> : <img key={selectedDiagram} src={referenceImages[selectedDiagram]} onError={() => setImageFailed(true)} alt={`الرسم الأصلي: ${selectedDiagram}`} className="mx-auto block h-auto w-full max-w-3xl" />}
            </div>
          )}
          <iframe
            key={chapterNumber}
            title={`رسومات الأحياء التفاعلية للفصل ${chapterName}`}
            src={`${import.meta.env.BASE_URL}laboratory/biology/chapter-${chapterNumber}/index.html`}
            onLoad={(event) => {
              setIsFrameLoading(false);
              if (chapterNumber !== 1) return;
              const document = event.currentTarget.contentDocument;
              const select = document?.querySelector<HTMLSelectElement>('select[aria-label="اختر الرسمة العلمية"]');
              if (!select) return;
              setSelectedDiagram(select.value);
              select.addEventListener('change', () => { setImageFailed(false); setSelectedDiagram(select.value); });
            }}
            className="h-[70vh] min-h-[500px] w-full border-0 bg-slate-950"
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
