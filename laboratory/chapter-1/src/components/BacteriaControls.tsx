import React from 'react';
import { 
  Play, 
  Pause, 
  Eye, 
  EyeOff, 
  RotateCcw, 
  Wind, 
  FlaskConical, 
  Gauge 
} from 'lucide-react';

interface BacteriaControlsProps {
  motilityActive: boolean;
  onToggleMotility: () => void;
  animationSpeed: number;
  onSetAnimationSpeed: (speed: number) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  gramType: 'gram-positive' | 'gram-negative';
  onSetGramType: (type: 'gram-positive' | 'gram-negative') => void;
  onReset: () => void;
}

export const BacteriaControls: React.FC<BacteriaControlsProps> = ({
  motilityActive,
  onToggleMotility,
  animationSpeed,
  onSetAnimationSpeed,
  showLabels,
  onToggleLabels,
  gramType,
  onSetGramType,
  onReset,
}) => {
  return (
    <div className="w-full bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
      {/* Motility & Gram Toggles */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-slate-400 ml-1">
          محاكاة بيولوجية:
        </span>

        {/* Motility Flagella Toggle */}
        <button
          onClick={onToggleMotility}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            motilityActive
              ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-md shadow-cyan-500/10'
              : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wind className={`w-3.5 h-3.5 ${motilityActive ? 'animate-spin text-cyan-400' : ''}`} />
          <span>{motilityActive ? 'حركة الأسواط نشطة' : 'إيقاف حركة السوط'}</span>
        </button>

        {/* Gram Stain Comparison */}
        <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
          <button
            onClick={() => onSetGramType('gram-positive')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              gramType === 'gram-positive'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="جدار ببتيدوجلايكان سميك (Gram-positive)"
          >
            <FlaskConical className="w-3 h-3" />
            <span>موجبة الجرام (Gram+)</span>
          </button>
          <button
            onClick={() => onSetGramType('gram-negative')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              gramType === 'gram-negative'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="طبقة ببتيدوجلايكان رقيقة وغشاء خارجي (Gram-negative)"
          >
            <FlaskConical className="w-3 h-3" />
            <span>سالبة الجرام (Gram-)</span>
          </button>
        </div>
      </div>

      {/* Animation Speed & View Toggles */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Speed Controls */}
        <div className="flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-xl border border-slate-800 text-xs">
          <Gauge className="w-3.5 h-3.5 text-slate-400 ml-1" />
          {[0.5, 1, 2].map((spd) => (
            <button
              key={spd}
              onClick={() => onSetAnimationSpeed(spd)}
              className={`px-2 py-0.5 rounded-md font-mono font-medium transition-all ${
                animationSpeed === spd
                  ? 'bg-sky-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Toggle Labels */}
        <button
          onClick={onToggleLabels}
          title={showLabels ? 'إخفاء التأشيرات' : 'إظهار التأشيرات'}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            showLabels
              ? 'bg-sky-500/20 border-sky-500/40 text-sky-300'
              : 'bg-slate-800 border-slate-700 text-slate-400'
          }`}
        >
          {showLabels ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>{showLabels ? 'التأشيرات معروضة' : 'التأشيرات مخفية'}</span>
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          title="إلغاء التحديد وإعادة الضبط"
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
