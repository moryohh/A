import React from 'react';
import { TransportType } from '../types';
import { 
  Play, 
  Pause, 
  Eye, 
  EyeOff, 
  Zap, 
  ArrowDownCircle, 
  Gauge, 
  RotateCcw 
} from 'lucide-react';

interface TransportControlsProps {
  transportMode: TransportType;
  onSetTransportMode: (mode: TransportType) => void;
  animationSpeed: number;
  onSetAnimationSpeed: (speed: number) => void;
  showLabels: boolean;
  onToggleLabels: () => void;
  onReset: () => void;
}

export const TransportControls: React.FC<TransportControlsProps> = ({
  transportMode,
  onSetTransportMode,
  animationSpeed,
  onSetAnimationSpeed,
  showLabels,
  onToggleLabels,
  onReset,
}) => {
  return (
    <div className="w-full bg-slate-900/80 border border-slate-800/90 rounded-2xl p-4 shadow-xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
      {/* Simulation Transport Mode Buttons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-bold text-slate-400 ml-1">
          محاكاة النقل الخلوي:
        </span>
        <button
          onClick={() => onSetTransportMode('idle')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            transportMode === 'idle'
              ? 'bg-slate-700 text-white shadow-sm border border-slate-600'
              : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          وضع الاستكشاف
        </button>
        <button
          onClick={() => onSetTransportMode('simple-diffusion')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            transportMode === 'simple-diffusion'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-emerald-300 hover:bg-slate-800'
          }`}
        >
          <ArrowDownCircle className="w-3.5 h-3.5" />
          <span>انتشار بسيط (O₂)</span>
        </button>
        <button
          onClick={() => onSetTransportMode('facilitated-diffusion')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            transportMode === 'facilitated-diffusion'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-purple-300 hover:bg-slate-800'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>انتشار ميسر (قناة Na⁺)</span>
        </button>
        <button
          onClick={() => onSetTransportMode('active-transport')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            transportMode === 'active-transport'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
              : 'bg-slate-800/60 text-slate-400 hover:text-pink-300 hover:bg-slate-800'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>نقل نشط بمضخة ATP</span>
        </button>
      </div>

      {/* Global Display & Animation Toggles */}
      <div className="flex items-center gap-2">
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

        {/* Play / Pause Speed toggle */}
        <button
          onClick={() => onSetAnimationSpeed(animationSpeed === 0 ? 1 : 0)}
          title={animationSpeed === 0 ? 'تشغيل الحركة' : 'إيقاف الحركة مؤقتاً'}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors"
        >
          {animationSpeed === 0 ? (
            <>
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              <span>تشغيل</span>
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5 text-amber-400" />
              <span>إيقاف</span>
            </>
          )}
        </button>

        {/* Reset Selection */}
        <button
          onClick={onReset}
          title="إعادة تعيين التحديد"
          className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
