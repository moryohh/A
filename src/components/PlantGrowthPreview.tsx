import React, { useState } from 'react';
import { FlaskConical, X, Sparkles } from 'lucide-react';
import { gameAudio } from '../utils/gameAudio';

const plantStages = [
  { points: 0, label: 'بذرة', color: '#a16207' },
  { points: 2, label: 'بذرة بجذر صغير', color: '#b7791f' },
  { points: 5, label: 'ساق صغيرة', color: '#84cc16' },
  { points: 10, label: 'نبتة بورقتين', color: '#22c55e' },
  { points: 15, label: 'نبتة بأربع أوراق', color: '#16a34a' },
  { points: 20, label: 'زهرة', color: '#db2777' },
  { points: 25, label: 'أوراق جانبية', color: '#059669' },
  { points: 30, label: 'شجيرة', color: '#15803d' },
  { points: 40, label: 'شجرة مزهرة', color: '#0f766e' },
  { points: 50, label: 'ثمار قليلة', color: '#ea580c' },
  { points: 60, label: 'شجرة مثمرة', color: '#16a34a' },
  { points: 70, label: 'شجرة عملاقة', color: '#166534' },
];

const getStageIndex = (points: number) => {
  return plantStages.reduce((current, stage, index) => (points >= stage.points ? index : current), 0);
};

const PreviewTree: React.FC<{ points: number; isAnimating: boolean }> = ({ points, isAnimating }) => {
  const stageIndex = getStageIndex(points);
  const stage = plantStages[stageIndex];
  const hasRoot = stageIndex >= 1;
  const hasStem = stageIndex >= 2;
  const hasTwoLeaves = stageIndex >= 3;
  const hasFourLeaves = stageIndex >= 4;
  const hasFlower = stageIndex >= 5;
  const hasSideLeaves = stageIndex >= 6;
  const hasTree = stageIndex >= 7;
  const hasManyFlowers = stageIndex >= 8;
  const fruitCount = stageIndex >= 10 ? 10 : stageIndex >= 9 ? 4 : 0;
  const treeScale = stageIndex >= 11 ? 1.24 : stageIndex >= 10 ? 1.12 : stageIndex >= 8 ? 1 : 0.82;

  return (
    <div
      className="relative mx-auto flex h-64 w-full max-w-[19rem] items-center justify-center overflow-hidden rounded-[1.75rem] border shadow-inner"
      style={{
        borderColor: `${stage.color}45`,
        background: `linear-gradient(180deg, #c8f3ff 0%, #effdf4 62%, ${stage.color}2a 100%)`,
      }}
    >
      <style>{`
        @keyframes previewGrowPop { 0% { transform: translateY(16px) scale(.76); opacity:.6; } 62% { transform: translateY(-6px) scale(1.08); opacity:1; } 100% { transform: translateY(0) scale(1); opacity:1; } }
        @keyframes previewSway { 0%, 100% { rotate: -1.3deg; } 50% { rotate: 1.3deg; } }
        @keyframes previewParticle { 0% { transform: translate(84px, 76px) scale(.45); opacity:0; } 24% { opacity:1; } 100% { transform: translate(-46px, -82px) scale(1.15); opacity:0; } }
        @keyframes previewGlow { 0%, 100% { filter: drop-shadow(0 0 0 rgba(34,197,94,0)); } 50% { filter: drop-shadow(0 0 16px rgba(34,197,94,.72)); } }
      `}</style>
      <div className="absolute right-7 top-6 h-14 w-14 rounded-full bg-amber-200/80 shadow-[0_0_38px_rgba(251,191,36,.5)]" />
      <div className="absolute left-8 top-12 h-5 w-20 rounded-full bg-white/70 blur-[1px]" />
      <div className="absolute bottom-0 h-16 w-[120%] rounded-t-[50%] bg-gradient-to-b from-lime-200 to-emerald-400" />
      <div className="absolute bottom-10 h-8 w-40 rounded-full bg-emerald-950/20 blur-md" />

      {isAnimating && Array.from({ length: 10 }).map((_, index) => (
        <span
          key={index}
          className="absolute z-20 h-2.5 w-2.5 rounded-full bg-amber-300 shadow"
          style={{
            right: `${32 + (index % 4) * 9}%`,
            bottom: `${22 + index * 2}%`,
            animation: `previewParticle ${820 + index * 70}ms ease-out ${index * 45}ms both`,
          }}
        />
      ))}

      <svg
        viewBox="0 0 180 180"
        className="relative z-10 h-52 w-52"
        style={{
          transformOrigin: '90px 146px',
          animation: isAnimating
            ? 'previewGrowPop 950ms cubic-bezier(.18,1.25,.28,1) both, previewSway 2.8s ease-in-out 900ms infinite'
            : 'previewSway 4.5s ease-in-out infinite',
        }}
        role="img"
        aria-label={stage.label}
      >
        <ellipse cx="90" cy="146" rx="55" ry="12" fill="#064e3b" opacity=".18" />

        {!hasStem && (
          <g>
            <ellipse cx="90" cy="130" rx="18" ry="24" fill="#b8752b" />
            <ellipse cx="84" cy="119" rx="6" ry="9" fill="#facc15" opacity=".38" />
          </g>
        )}

        {hasRoot && (
          <g fill="none" stroke="#7c4a1d" strokeWidth="5" strokeLinecap="round">
            <path d="M90 133 C74 143 58 147 42 151" />
            <path d="M90 134 C105 144 122 148 140 151" />
            <path d="M90 134 C88 145 87 151 86 158" />
          </g>
        )}

        {hasStem && !hasTree && (
          <path d="M90 136 C86 108 87 84 93 62" fill="none" stroke="#2f9e44" strokeWidth="10" strokeLinecap="round" />
        )}

        {!hasTree && hasTwoLeaves && (
          <g style={{ animation: isAnimating ? 'previewGlow 1s ease-in-out both' : undefined }}>
            <ellipse cx="72" cy="78" rx="20" ry="10" fill="#22c55e" transform="rotate(-28 72 78)" />
            <ellipse cx="108" cy="78" rx="20" ry="10" fill="#16a34a" transform="rotate(28 108 78)" />
            {hasFourLeaves && (
              <>
                <ellipse cx="69" cy="103" rx="18" ry="9" fill="#65a30d" transform="rotate(-17 69 103)" />
                <ellipse cx="111" cy="103" rx="18" ry="9" fill="#4d7c0f" transform="rotate(17 111 103)" />
              </>
            )}
            {hasSideLeaves && (
              <>
                <ellipse cx="54" cy="93" rx="17" ry="8" fill="#10b981" transform="rotate(-45 54 93)" />
                <ellipse cx="126" cy="93" rx="17" ry="8" fill="#10b981" transform="rotate(45 126 93)" />
              </>
            )}
          </g>
        )}

        {hasTree && (
          <g transform={`translate(90 145) scale(${treeScale}) translate(-90 -145)`}>
            <path d="M78 148 C80 119 82 88 89 57 C96 88 102 119 105 148 Z" fill="#8b5a2b" />
            <path d="M88 77 C66 69 55 56 47 40" fill="none" stroke="#8b5a2b" strokeWidth="8" strokeLinecap="round" />
            <path d="M96 74 C121 65 132 51 140 34" fill="none" stroke="#8b5a2b" strokeWidth="8" strokeLinecap="round" />
            <path d="M89 98 C69 96 55 89 44 79" fill="none" stroke="#8b5a2b" strokeWidth="6" strokeLinecap="round" />
            <path d="M96 98 C118 96 132 88 145 78" fill="none" stroke="#8b5a2b" strokeWidth="6" strokeLinecap="round" />
            <circle cx="64" cy="56" r="28" fill="#22c55e" />
            <circle cx="113" cy="54" r="31" fill="#16a34a" />
            <circle cx="90" cy="40" r="34" fill="#4ade80" />
            <circle cx="49" cy="82" r="23" fill="#15803d" />
            <circle cx="132" cy="83" r="25" fill="#22c55e" />
            <circle cx="90" cy="82" r="35" fill="#16a34a" />
          </g>
        )}

        {Array.from({ length: hasManyFlowers ? 8 : hasFlower ? 1 : 0 }).map((_, index) => {
          const spots = [[90, 68], [66, 57], [115, 58], [52, 84], [133, 83], [91, 38], [75, 96], [109, 96]];
          const [cx, cy] = spots[index];
          return (
            <g key={index} transform={`translate(${cx} ${cy}) scale(${index === 0 ? 1 : .72})`}>
              <circle r="4" fill="#facc15" />
              <circle cx="0" cy="-8" r="5.5" fill="#f472b6" />
              <circle cx="8" cy="0" r="5.5" fill="#fb7185" />
              <circle cx="0" cy="8" r="5.5" fill="#f472b6" />
              <circle cx="-8" cy="0" r="5.5" fill="#fb7185" />
            </g>
          );
        })}

        {Array.from({ length: fruitCount }).map((_, index) => {
          const fruits = [[69, 73], [110, 73], [90, 55], [128, 92], [53, 92], [90, 101], [78, 39], [117, 44], [43, 70], [139, 66]];
          const [cx, cy] = fruits[index];
          return <circle key={index} cx={cx} cy={cy} r={stageIndex >= 11 ? 6 : 4.7} fill={index % 2 ? '#ef4444' : '#f97316'} stroke="#fff9" strokeWidth="1.3" />;
        })}
      </svg>
    </div>
  );
};

export const PlantGrowthPreview: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [points, setPoints] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const stageIndex = getStageIndex(points);
  const stage = plantStages[stageIndex];
  const nextStage = plantStages.find((item) => item.points > points);
  const progress = nextStage
    ? Math.round(((points - stage.points) / Math.max(1, nextStage.points - stage.points)) * 100)
    : 100;

  const collectPoints = () => {
    gameAudio.playClick();
    setIsAnimating(true);
    setPoints((current) => Math.min(70, current + 2));
    window.setTimeout(() => setIsAnimating(false), 1250);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 left-4 z-[65] flex h-14 w-14 items-center justify-center rounded-full border border-emerald-300/50 bg-emerald-500 text-white shadow-2xl shadow-emerald-900/30 transition-transform active:scale-95"
        aria-label="فتح معاينة نمو الشجرة"
        title="معاينة نمو الشجرة"
      >
        <FlaskConical className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/70 p-3 font-cairo backdrop-blur-sm sm:items-center" dir="rtl">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[1.75rem] border border-emerald-200/60 bg-white p-4 text-right shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <p className="text-[11px] font-black text-emerald-600">معاينة مؤقتة معزولة</p>
                <h2 className="text-lg font-black text-slate-950">التقييم الدوري وتطور الشجرة</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors active:bg-slate-200"
                aria-label="إغلاق المعاينة"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <PreviewTree points={points} isAnimating={isAnimating} />

            <div className="mt-4 rounded-3xl border border-emerald-100 bg-emerald-50/70 p-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-black text-slate-500">المرحلة الحالية</p>
                  <p className="text-base font-black" style={{ color: stage.color }}>{stage.label}</p>
                </div>
                <div className="rounded-2xl bg-white px-3 py-2 text-center shadow-sm">
                  <p className="text-[10px] font-black text-slate-500">النقاط</p>
                  <p className="text-lg font-black text-slate-950">{points}</p>
                </div>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${stage.color}88, ${stage.color})` }}
                />
              </div>
              <p className="mt-2 text-[11px] font-bold text-slate-500">
                {nextStage ? `المرحلة التالية عند ${nextStage.points} نقطة: ${nextStage.label}` : 'وصلت الشجرة إلى مرحلة العملاقة'}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={collectPoints}
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition-transform active:scale-95"
              >
                جمع النقاط
              </button>
              <button
                type="button"
                onClick={() => {
                  gameAudio.playClick();
                  setPoints(0);
                  setIsAnimating(false);
                }}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition-transform active:scale-95"
              >
                إعادة التجربة
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-1.5">
              {plantStages.map((item, index) => (
                <button
                  key={item.points}
                  type="button"
                  onClick={() => {
                    gameAudio.playClick();
                    setPoints(item.points);
                    setIsAnimating(false);
                  }}
                  className={`rounded-2xl border px-2 py-2 text-[10px] font-black transition-transform active:scale-95 ${index === stageIndex ? 'bg-slate-950 text-white' : 'bg-white text-slate-600'}`}
                  style={{ borderColor: `${item.color}55` }}
                >
                  {item.points} نقطة
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-[11px] font-bold leading-5 text-amber-800">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>هذه معاينة مؤقتة فقط، ولا تعدل نقاط الطالب أو التقييم الحقيقي.</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
