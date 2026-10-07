import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw, X } from 'lucide-react';
import { FlashCard } from '../services/gamesService';
import { ScientificText } from './ScientificText';

interface FlashCardGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: FlashCard[];
  lessonTitle: string;
}

export const FlashCardGameModal: React.FC<FlashCardGameModalProps> = ({ isOpen, onClose, cards, lessonTitle }) => {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIndex(0);
      setFlipped(false);
    }
  }, [isOpen, cards]);

  if (!isOpen) return null;
  const card = cards[index];
  if (!card) return null;

  const next = () => {
    setFlipped(false);
    setIndex((value) => (value + 1) % cards.length);
  };
  const previous = () => {
    setFlipped(false);
    setIndex((value) => (value - 1 + cards.length) % cards.length);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/85 p-3 backdrop-blur-md sm:items-center" dir="rtl">
      <div className="w-full max-w-lg rounded-3xl border border-cyan-300/40 bg-slate-950 p-4 text-white shadow-2xl shadow-cyan-950/50 sm:p-6">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h2 className="text-xl font-black text-cyan-200">فلاش كارد</h2>
            <p className="mt-1 text-xs text-slate-400">بطاقات من ملف منهج: {lessonTitle}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-white/10 p-2 text-slate-300 transition hover:bg-white/20" aria-label="إغلاق">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-3 text-center text-xs font-bold text-cyan-300">البطاقة {index + 1} من {cards.length}</p>
        <button
          type="button"
          onClick={() => setFlipped((value) => !value)}
          className="group relative block h-72 w-full [perspective:1200px] focus:outline-none"
          aria-label={flipped ? 'إظهار السؤال' : 'إظهار الجواب'}
        >
          <span
            className="absolute inset-0 block transition-transform duration-500 [transform-style:preserve-3d]"
            style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)' }}
          >
            <span className="absolute inset-0 flex [backface-visibility:hidden] flex-col items-center justify-center rounded-3xl border-2 border-cyan-300/50 bg-gradient-to-br from-cyan-950 via-slate-900 to-blue-950 p-6 text-center shadow-xl shadow-cyan-950/40">
              <span className="mb-4 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-1 text-xs font-black text-cyan-200">السؤال</span>
              <span className="text-lg font-black leading-loose text-white"><ScientificText value={card.question} /></span>
              <span className="mt-6 text-xs text-cyan-300/80">اضغط على البطاقة لقلبها</span>
            </span>
            <span className="absolute inset-0 flex [backface-visibility:hidden] flex-col items-center justify-center rounded-3xl border-2 border-emerald-300/50 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 p-6 text-center shadow-xl shadow-emerald-950/40 [transform:rotateY(180deg)]">
              <span className="mb-4 rounded-full border border-emerald-300/30 bg-emerald-300/10 px-4 py-1 text-xs font-black text-emerald-200">الجواب</span>
              <span className="max-h-48 overflow-y-auto text-base font-bold leading-loose text-white"><ScientificText value={card.answer} /></span>
              <span className="mt-6 flex items-center gap-1 text-xs text-emerald-300/80"><RotateCcw className="h-3.5 w-3.5" /> اضغط للعودة إلى السؤال</span>
            </span>
          </span>
        </button>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button type="button" onClick={previous} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-3 text-sm font-black transition hover:bg-white/20"><ArrowRight className="h-4 w-4" /> السابقة</button>
          <button type="button" onClick={() => setFlipped((value) => !value)} className="flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-300"><RotateCcw className="h-4 w-4" /> قلب البطاقة</button>
          <button type="button" onClick={next} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-3 text-sm font-black transition hover:bg-white/20">التالية <ArrowLeft className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
};
