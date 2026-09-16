import React, { useState } from 'react';
import { DiagramPart } from '../types';
import { 
  Check, 
  Copy, 
  Sparkles, 
  Atom, 
  Activity, 
  ShieldCheck, 
  BookOpen, 
  X, 
  ChevronRight, 
  ChevronLeft 
} from 'lucide-react';

interface PartInfoCardProps {
  part: DiagramPart | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
}

export const PartInfoCard: React.FC<PartInfoCardProps> = ({
  part,
  onClose,
  onNext,
  onPrev,
}) => {
  const [copied, setCopied] = useState(false);

  if (!part) {
    return (
      <div className="w-full bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center shadow-lg backdrop-blur-sm">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 text-sky-400 mb-3 animate-pulse">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-200 mb-1">
          انقر على أي جزء من الرسم العلمي أعلاه
        </h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          انقر مباشرة على العناصر أو التأشيرات لعرض الشرح العلمي المفصل، الوظيفة الحيوية، والتركيب الكيميائي بدقة.
        </p>
      </div>
    );
  }

  const categoryLabels: Record<string, string> = {
    lipid: 'ليبيدات ودهون غشائية',
    protein: 'بروتينات وزوائد حيوية',
    carbohydrate: 'كربوهيدرات وسكريات',
    fluid: 'سوائل ومحاليل سيتوبلازمية',
    cytoskeleton: 'هيكل خلوي ودعامات',
    organelle: 'عضيات وتراكيب خلوية',
    genetic: 'مادة وراثية وجينية',
    envelope: 'أغلفة وجدران خلوية حامية',
  };

  const handleCopy = () => {
    const text = `${part.nameAr} (${part.nameEn})\n\nالوظيفة: ${part.functionAr}\n\nالتركيب الكيميائي: ${part.compositionAr}\n\nالنفاذية: ${part.permeabilityAr}\n\nنصيحة للاختبار: ${part.examNoteAr}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-2xl backdrop-blur-md transition-all duration-300 relative overflow-hidden">
      {/* Accent glow bar at top */}
      <div
        className="absolute top-0 left-0 right-0 h-1.5 transition-colors duration-500"
        style={{ backgroundColor: part.color }}
      />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-10 rounded-full flex-shrink-0"
            style={{ backgroundColor: part.color }}
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl md:text-2xl font-black text-white">
                {part.nameAr}
              </h2>
              <span
                className="text-xs px-2.5 py-0.5 rounded-full font-medium border"
                style={{
                  color: part.color,
                  borderColor: `${part.color}40`,
                  backgroundColor: `${part.color}15`,
                }}
              >
                {categoryLabels[part.category] || 'تركيب علمي'}
              </span>
            </div>
            <p className="text-xs md:text-sm font-mono text-slate-400 mt-0.5">
              {part.nameEn}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-center">
          {onPrev && (
            <button
              onClick={onPrev}
              title="العنصر السابق"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              title="العنصر التالي"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleCopy}
            title="نسخ الشرح"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>نسخ</span>
              </>
            )}
          </button>
          <button
            onClick={onClose}
            title="إغلاق البطاقة"
            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary highlight */}
      <p className="mt-4 text-sm md:text-base text-slate-200 leading-relaxed bg-slate-800/40 p-3.5 rounded-xl border border-slate-700/50">
        {part.summary}
      </p>

      {/* Detailed 4-Grid scientific breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
        {/* Function */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 text-sky-400 mb-1.5 text-xs font-bold">
            <Activity className="w-4 h-4" />
            <span>الوظيفة الحيوية (Biological Function)</span>
          </div>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            {part.functionAr}
          </p>
        </div>

        {/* Composition */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 text-amber-400 mb-1.5 text-xs font-bold">
            <Atom className="w-4 h-4" />
            <span>التركيب الكيميائي (Chemical Composition)</span>
          </div>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            {part.compositionAr}
          </p>
        </div>

        {/* Permeability Role */}
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5 hover:border-slate-700 transition-colors">
          <div className="flex items-center gap-2 text-emerald-400 mb-1.5 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>النفاذية الانتقائية والتنظيم (Permeability)</span>
          </div>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            {part.permeabilityAr}
          </p>
        </div>

        {/* Exam Tip */}
        <div className="bg-slate-950/50 border border-amber-500/20 rounded-xl p-3.5 bg-amber-500/5 hover:border-amber-500/40 transition-colors">
          <div className="flex items-center gap-2 text-amber-300 mb-1.5 text-xs font-bold">
            <BookOpen className="w-4 h-4" />
            <span>معلومة هامة للاختبار (Exam High-Yield Fact)</span>
          </div>
          <p className="text-xs md:text-sm text-amber-100/90 leading-relaxed">
            {part.examNoteAr}
          </p>
        </div>
      </div>
    </div>
  );
};
