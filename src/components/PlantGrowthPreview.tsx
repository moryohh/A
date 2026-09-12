import React, { useId, useMemo, useState } from 'react';
import { FlaskConical, Sparkles, X } from 'lucide-react';
import { gameAudio } from '../utils/gameAudio';

const growthStages = [
  { points: 0, label: 'بذرة', color: '#9a5b22' },
  { points: 2, label: 'جذر صغير', color: '#b8792d' },
  { points: 5, label: 'ساق صغيرة', color: '#8fcf3f' },
  { points: 10, label: 'نبتة بورقتين', color: '#34c96a' },
  { points: 15, label: 'نبتة بأربع أوراق', color: '#20a85a' },
  { points: 20, label: 'زهرة', color: '#e04893' },
  { points: 25, label: 'أوراق جانبية', color: '#11a675' },
  { points: 30, label: 'شجيرة', color: '#16884a' },
  { points: 40, label: 'شجرة مزهرة', color: '#0f8c77' },
  { points: 50, label: 'ثمار قليلة', color: '#f27a24' },
  { points: 60, label: 'شجرة مثمرة', color: '#1aa05f' },
  { points: 70, label: 'شجرة عملاقة', color: '#146c3d' },
  { points: 80, label: 'شجرة تتحرك', color: '#0f8f5f' },
  { points: 90, label: 'كرة نار', color: '#f15a24' },
  { points: 100, label: 'ولادة بذرة جديدة', color: '#c8862c' },
];

const shieldRanks = [
  { label: 'درع خشبي', fill: '#8b5a2b', shine: '#c08457' },
  { label: 'درع نحاسي', fill: '#b45309', shine: '#f59e0b' },
  { label: 'درع فضي', fill: '#94a3b8', shine: '#e2e8f0' },
  { label: 'درع ذهبي', fill: '#ca8a04', shine: '#fde047' },
  { label: 'درع ماسي', fill: '#0891b2', shine: '#a5f3fc' },
  { label: 'درع يورانيوم', fill: '#28734a', shine: '#c9ff7c' },
];

const getStageIndex = (cyclePoints: number) => {
  return growthStages.reduce((current, stage, index) => (cyclePoints >= stage.points ? index : current), 0);
};

const ShieldBadge: React.FC<{ rank: number; pulse: boolean }> = ({ rank, pulse }) => {
  const safeRank = Math.min(Math.max(rank, 0), shieldRanks.length - 1);
  const visualRank = Math.min(safeRank, 4);
  const uranium = safeRank === 5;
  const gold = safeRank === 3;
  const diamond = safeRank === 4;
  return <div className="relative flex items-center gap-2 rounded-2xl border border-white/60 bg-white/75 px-3 py-2 shadow-sm">
    <div className="relative h-14 w-12 shrink-0">
      <img src={`${import.meta.env.BASE_URL}assets/shields/shield-${visualRank}.png`} alt={shieldRanks[safeRank].label} className="h-full w-full object-contain drop-shadow-md" style={{ animation: pulse ? 'rankPulse 900ms ease-out both' : undefined, filter: uranium ? 'hue-rotate(105deg) saturate(1.4) contrast(1.08)' : undefined }} />
      {(gold || diamond || uranium) && <span className="pointer-events-none absolute inset-0 rounded-[45%] animate-pulse" style={{ background: gold ? 'radial-gradient(circle, rgba(255,223,91,.2), transparent 64%)' : diamond ? 'radial-gradient(circle, rgba(88,224,255,.3), transparent 64%)' : 'radial-gradient(circle, rgba(201,255,124,.3), rgba(231,199,95,.16) 36%, transparent 66%)' }} />
    </div>
    <div><p className="text-[10px] font-black text-slate-500">رتبة الطالب</p><p className="text-sm font-black text-slate-950">{shieldRanks[safeRank].label}</p></div>
  </div>;
};

const FantasyTree: React.FC<{ cyclePoints: number; burst: boolean; compact?: boolean }> = ({ cyclePoints, burst, compact = false }) => {
  const uniqueId = useId().replace(/:/g, '');
  const stageIndex = getStageIndex(cyclePoints);
  const stage = growthStages[stageIndex];
  const isSeedReborn = stageIndex >= 14;
  const showFire = stageIndex >= 13;
  const showAncientMotion = stageIndex >= 12;
  const showTree = stageIndex >= 7 && !isSeedReborn;
  const showStem = stageIndex >= 2 && !showTree && !isSeedReborn;
  const showRoot = stageIndex >= 1 || isSeedReborn;
  const showTwoLeaves = stageIndex >= 3 && !showTree && !isSeedReborn;
  const showFourLeaves = stageIndex >= 4 && !showTree && !isSeedReborn;
  const showFlower = stageIndex >= 5 && !showTree && !isSeedReborn;
  const showSideLeaves = stageIndex >= 6 && !showTree && !isSeedReborn;
  const visualStages = [0, 1, 2, 3, 4, 5, 12, 6, 7, 8, 9, 9, 9, 10, 11];
  const assetIndex = visualStages[stageIndex] ?? 0;
  const useGeneratedAsset = stageIndex >= 6;
  const flowerCount = stageIndex >= 8 && !showFire ? 9 : showFlower ? 1 : 0;
  const fruitCount = stageIndex >= 10 && !showFire ? 10 : stageIndex >= 9 && !showFire ? 4 : 0;
  const treeScale = stageIndex >= 12 ? 1.22 : stageIndex >= 11 ? 1.12 : stageIndex >= 10 ? 1.02 : stageIndex >= 8 ? 0.95 : 0.82;

  const leaves = useMemo(() => {
    return [
      [94, 37, 31, 24],
      [63, 52, 29, 23],
      [126, 52, 30, 23],
      [47, 79, 27, 22],
      [143, 80, 27, 22],
      [73, 82, 32, 25],
      [116, 82, 32, 25],
      [94, 94, 35, 27],
    ];
  }, []);

  return (
    <div
      className={`relative mx-auto w-full overflow-hidden border border-white/55 bg-[#def9ff] shadow-[inset_0_-18px_48px_rgba(21,128,61,.16)] ${compact ? 'h-32 rounded-2xl' : 'h-[19rem] rounded-[2rem]'}`}
    >
      <style>{`
        @keyframes stagePop { 0% { transform: translateY(18px) scale(.72); opacity:.4; } 58% { transform: translateY(-6px) scale(1.08); opacity:1; } 100% { transform: translateY(0) scale(1); opacity:1; } }
        @keyframes livingTree { 0%, 100% { transform: rotate(-1.15deg) translateY(0); } 50% { transform: rotate(1.15deg) translateY(-1px); } }
        @keyframes crownGlow { 0%, 100% { filter: drop-shadow(0 5px 4px rgba(5,150,105,.16)); } 50% { filter: drop-shadow(0 6px 10px rgba(250,204,21,.45)); } }
        @keyframes magicDot { 0% { transform: translate(90px, 96px) scale(.35); opacity:0; } 22% { opacity:1; } 100% { transform: translate(-58px, -106px) scale(1.35); opacity:0; } }
        @keyframes emberOrbit { 0% { transform: rotate(0deg) translateX(64px) rotate(0deg); opacity:.45; } 50% { opacity:1; } 100% { transform: rotate(360deg) translateX(64px) rotate(-360deg); opacity:.45; } }
        @keyframes flamePulse { 0%, 100% { transform: scale(.94); opacity:.72; filter: blur(.2px); } 50% { transform: scale(1.08); opacity:1; filter: blur(0); } }
        @keyframes rebornSeed { 0% { transform: scale(.55) translateY(-24px); opacity:0; } 70% { transform: scale(1.12) translateY(3px); opacity:1; } 100% { transform: scale(1) translateY(0); opacity:1; } }
        @keyframes rankPulse { 0% { transform: scale(.82) rotate(-8deg); filter: drop-shadow(0 0 0 rgba(250,204,21,0)); } 70% { transform: scale(1.13) rotate(4deg); filter: drop-shadow(0 0 16px rgba(250,204,21,.75)); } 100% { transform: scale(1) rotate(0); } }
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_20%,rgba(255,255,255,.95),transparent_26%),radial-gradient(circle_at_74%_36%,rgba(255,255,255,.65),transparent_20%)]" />
      <div className={`${compact ? 'right-4 top-4 h-9 w-9' : 'right-7 top-7 h-16 w-16'} absolute rounded-full bg-amber-200 shadow-[0_0_46px_rgba(251,191,36,.55)]`} />
      <div className={`${compact ? 'h-10' : 'h-20'} absolute bottom-0 w-[120%] -translate-x-8 rounded-t-[50%] bg-gradient-to-b from-lime-200 via-emerald-300 to-emerald-500`} />
      <div className={`${compact ? 'bottom-6 h-5 w-24' : 'bottom-12 h-9 w-52'} absolute left-1/2 -translate-x-1/2 rounded-full bg-emerald-950/20 blur-md`} />

      {burst && Array.from({ length: 18 }).map((_, index) => (
        <span
          key={index}
          className="absolute z-30 h-2.5 w-2.5 rounded-full shadow-sm"
          style={{
            right: `${24 + (index % 6) * 8}%`,
            bottom: `${18 + (index % 5) * 7}%`,
            backgroundColor: index % 3 === 0 ? '#fde047' : index % 3 === 1 ? '#34d399' : '#f472b6',
            animation: `magicDot ${880 + index * 28}ms ease-out ${index * 34}ms both`,
          }}
        />
      ))}

      {showFire && !isSeedReborn && (
        <div className="absolute left-1/2 top-[44%] z-20 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500/30 blur-xl" />
      )}

      {useGeneratedAsset && <img
          src={`${import.meta.env.BASE_URL}assets/tree-stages/stage-${String(assetIndex).padStart(2, '0')}.png`}
          alt={stage.label}
          className={`${compact ? 'bottom-2 h-[88%] w-[88%]' : 'bottom-5 h-[88%] w-[88%]'} absolute left-1/2 z-10 -translate-x-1/2 object-contain drop-shadow-[0_12px_10px_rgba(6,78,59,.18)]`}
          style={{
            animation: burst ? 'stagePop 950ms cubic-bezier(.18,1.25,.28,1) both' : 'livingTree 4.8s ease-in-out infinite',
          }}
        />}

      <svg
        viewBox="0 0 190 190"
        className={`${compact ? 'bottom-4 h-28 w-28' : 'bottom-10 h-60 w-60'} absolute left-1/2 z-10 -translate-x-1/2`}
        style={{
          display: useGeneratedAsset ? 'none' : undefined,
          transformOrigin: '95px 158px',
          animation: burst
            ? 'stagePop 950ms cubic-bezier(.18,1.25,.28,1) both, livingTree 2.6s ease-in-out 950ms infinite'
            : showAncientMotion
            ? 'livingTree 2.8s ease-in-out infinite'
            : 'livingTree 4.8s ease-in-out infinite',
        }}
        role="img"
        aria-label={stage.label}
      >
        <defs>
          <linearGradient id={`${uniqueId}-seed`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#f0b35e" />
            <stop offset="52%" stopColor="#a7652a" />
            <stop offset="100%" stopColor="#6b3f18" />
          </linearGradient>
          <linearGradient id={`${uniqueId}-trunk`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#b8793a" />
            <stop offset="52%" stopColor="#7c4a1d" />
            <stop offset="100%" stopColor="#4a2a12" />
          </linearGradient>
          <radialGradient id={`${uniqueId}-leaf`} cx="42%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#bbf7d0" />
            <stop offset="45%" stopColor="#35d66f" />
            <stop offset="100%" stopColor="#0f7f45" />
          </radialGradient>
          <linearGradient id={`${uniqueId}-stem`} x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#9af082" />
            <stop offset="100%" stopColor="#15803d" />
          </linearGradient>
          <radialGradient id={`${uniqueId}-fire`} cx="50%" cy="70%" r="65%">
            <stop offset="0%" stopColor="#fff7a8" />
            <stop offset="42%" stopColor="#fbbf24" />
            <stop offset="76%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#7c2d12" />
          </radialGradient>
        </defs>
        <ellipse cx="95" cy="160" rx="62" ry="13" fill="#064e3b" opacity=".18" />

        {(!showStem || isSeedReborn) && (
          <g style={{ animation: isSeedReborn ? 'rebornSeed 950ms ease-out both' : undefined }}>
            {isSeedReborn && <><circle cx="95" cy="136" r="38" fill="#fef3c7" opacity=".38" /><circle cx="95" cy="136" r="30" fill="none" stroke="#fbbf24" strokeWidth="2" opacity=".62" strokeDasharray="4 5" /></>}
            <ellipse cx="95" cy="139" rx="20" ry="27" fill={`url(#${uniqueId}-seed)`} />
            <ellipse cx="88" cy="126" rx="7" ry="10" fill="#facc15" opacity=".35" />
            {isSeedReborn && <path d="M96 121 C101 111 111 107 116 110 C113 119 106 125 96 127 Z" fill="#4ade80" />}
          </g>
        )}

        {showRoot && (
          <g fill="none" stroke="#7c4a1d" strokeWidth="5" strokeLinecap="round" opacity={isSeedReborn ? '.5' : '1'}>
            <path d="M95 143 C76 154 57 158 39 162" />
            <path d="M95 144 C112 154 132 158 152 162" />
            <path d="M95 145 C92 154 91 160 89 167" />
          </g>
        )}

        {showStem && (
          <path d="M95 148 C90 117 91 89 98 63" fill="none" stroke={`url(#${uniqueId}-stem)`} strokeWidth="11" strokeLinecap="round" />
        )}

        {!showTree && showTwoLeaves && (
          <g>
            <ellipse cx="76" cy="82" rx="22" ry="11" fill={`url(#${uniqueId}-leaf)`} transform="rotate(-28 76 82)" />
            <ellipse cx="115" cy="82" rx="22" ry="11" fill={`url(#${uniqueId}-leaf)`} transform="rotate(28 115 82)" />
            {showFourLeaves && (
              <>
                <ellipse cx="73" cy="108" rx="19" ry="10" fill={`url(#${uniqueId}-leaf)`} transform="rotate(-18 73 108)" />
                <ellipse cx="118" cy="108" rx="19" ry="10" fill={`url(#${uniqueId}-leaf)`} transform="rotate(18 118 108)" />
              </>
            )}
            {showSideLeaves && (
              <>
                <ellipse cx="58" cy="96" rx="18" ry="9" fill={`url(#${uniqueId}-leaf)`} transform="rotate(-45 58 96)" />
                <ellipse cx="133" cy="96" rx="18" ry="9" fill={`url(#${uniqueId}-leaf)`} transform="rotate(45 133 96)" />
              </>
            )}
          </g>
        )}

        {showTree && (
          <g transform={`translate(95 156) scale(${treeScale}) translate(-95 -156)`} style={{ animation: stageIndex >= 8 ? 'crownGlow 3.5s ease-in-out infinite' : undefined }}>
            <path d="M80 160 C83 127 86 88 95 51 C105 91 111 127 115 160 Z" fill={`url(#${uniqueId}-trunk)`} />
            <path d="M93 83 C72 68 58 49 51 31 M100 80 C121 65 135 47 141 27 M90 110 C70 105 53 94 41 78 M103 108 C125 104 141 94 154 76" fill="none" stroke={`url(#${uniqueId}-trunk)`} strokeWidth="8" strokeLinecap="round" />
            {leaves.map(([cx, cy, rx, ry], index) => (
              <g key={index} transform={`translate(${cx} ${cy})`}>
                <ellipse rx={rx} ry={ry} fill={`url(#${uniqueId}-leaf)`} opacity={showFire ? '.58' : '.98'} />
                <ellipse cx="-5" cy="-6" rx={rx * .4} ry={ry * .32} fill="#dcfce7" opacity=".25" />
              </g>
            ))}
            <path d="M88 153 C93 125 94 92 95 63" fill="none" stroke="#fff8" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {Array.from({ length: flowerCount }).map((_, index) => {
          const spots = [[95, 54], [65, 61], [124, 61], [51, 85], [140, 85], [95, 88], [73, 96], [118, 97], [80, 35]];
          const [cx, cy] = spots[index];
          return (
            <g key={index} transform={`translate(${cx} ${cy}) scale(${index === 0 ? 1 : .7})`}>
              <circle r="4.3" fill="#facc15" stroke="#fff8" strokeWidth="1" />
              <circle cx="0" cy="-7" r="5.2" fill="#f472b6" />
              <circle cx="6.5" cy="0" r="5.2" fill="#fb7185" />
              <circle cx="0" cy="7" r="5.2" fill="#f472b6" />
              <circle cx="-6.5" cy="0" r="5.2" fill="#fb7185" />
            </g>
          );
        })}

        {Array.from({ length: fruitCount }).map((_, index) => {
          const fruits = [[72, 76], [118, 76], [96, 67], [136, 94], [54, 95], [95, 110], [77, 45], [122, 46], [47, 75], [145, 72]];
          const [cx, cy] = fruits[index];
          return <g key={index}><circle cx={cx} cy={cy} r={stageIndex >= 11 ? 6.3 : 5} fill={index % 2 ? '#ef4444' : '#fb923c'} stroke="#fff9" strokeWidth="1.4" /><path d={`M${cx} ${cy - 5} q3 -5 6 -4`} fill="none" stroke="#166534" strokeWidth="1.7" strokeLinecap="round" /></g>;
        })}

        {showFire && !isSeedReborn && (
          <g style={{ animation: 'flamePulse 900ms ease-in-out infinite' }}>
            <path d="M95 23 C126 59 143 93 121 123 C110 138 80 138 67 119 C49 92 70 63 95 23 Z" fill={`url(#${uniqueId}-fire)`} opacity=".98" />
            <path d="M96 49 C116 75 119 97 105 115 C93 129 76 118 80 98 C83 82 91 67 96 49 Z" fill="#fff3a3" opacity=".92" />
            <path d="M94 125 C88 110 89 86 95 65 C102 91 104 111 100 126 Z" fill="#7c2d12" opacity=".62" />
          </g>
        )}
      </svg>

      {showFire && !isSeedReborn && !compact && Array.from({ length: 9 }).map((_, index) => (
        <span
          key={index}
          className="absolute left-1/2 top-[41%] z-20 h-3 w-3 rounded-full bg-orange-300"
          style={{ animation: `emberOrbit ${1.7 + index * .13}s linear infinite`, animationDelay: `${index * -140}ms` }}
        />
      ))}

      {!compact && <div className="absolute bottom-4 left-4 right-4 z-30 rounded-2xl border border-white/60 bg-white/80 px-3 py-2 text-center shadow-sm">
        <p className="text-[10px] font-black text-slate-500">مرحلة النمو</p>
        <p className="text-sm font-black" style={{ color: stage.color }}>{stage.label}</p>
      </div>}
    </div>
  );
};

export const PlantGrowthPreview: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [points, setPoints] = useState(0);
  const [burst, setBurst] = useState(false);
  const rank = Math.min(Math.floor(points / 100), shieldRanks.length - 1);
  const cyclePoints = points > 0 && points % 100 === 0 ? 100 : points % 100;
  const stageIndex = getStageIndex(cyclePoints);
  const stage = growthStages[stageIndex];
  const nextStage = growthStages.find((item) => item.points > cyclePoints);
  const progress = nextStage
    ? Math.round(((cyclePoints - stage.points) / Math.max(1, nextStage.points - stage.points)) * 100)
    : 100;

  const collectPoints = () => {
    gameAudio.playClick();
    setBurst(true);
    setPoints((current) => Math.min(500, current + 10));
    window.setTimeout(() => setBurst(false), 1250);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 left-4 z-[65] flex h-14 w-14 items-center justify-center rounded-full border border-emerald-300/50 bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-2xl shadow-emerald-900/30 transition-transform active:scale-95"
        aria-label="فتح معاينة نمو الشجرة"
        title="معاينة نمو الشجرة"
      >
        <FlaskConical className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-slate-950/75 p-3 font-cairo backdrop-blur-sm sm:items-center" dir="rtl">
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-[1.85rem] border border-white/70 bg-gradient-to-b from-white to-emerald-50 p-4 text-right shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-3 border-b border-emerald-100 pb-3">
              <div>
                <p className="text-[11px] font-black text-emerald-600">معاينة مؤقتة معزولة</p>
                <h2 className="text-lg font-black text-slate-950">التقييم الدوري وتطور الشجرة</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-600 shadow-sm transition-colors active:bg-slate-100"
                aria-label="إغلاق المعاينة"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-3">
              <ShieldBadge rank={rank} pulse={cyclePoints === 0 && points > 0 && burst} />
            </div>

            <section className="mb-3 rounded-3xl border border-amber-100 bg-amber-50/70 p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-black text-amber-900">مختبر الدروع</h3>
                <span className="text-[10px] font-bold text-amber-700">اضغط للمعاينة</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {shieldRanks.map((shield, index) => (
                  <button
                    key={shield.label}
                    type="button"
                    onClick={() => { gameAudio.playClick(); setPoints(index * 100); setBurst(false); }}
                    className={`rounded-2xl border bg-white p-2 text-center shadow-sm transition active:scale-95 ${rank === index ? 'ring-2 ring-amber-400' : 'border-amber-100'}`}
                  >
                    <ShieldBadge rank={index} pulse={rank === index} />
                    <span className="mt-1 block text-[9px] font-black text-slate-700">{shield.label.replace('درع ', '')}</span>
                  </button>
                ))}
              </div>
            </section>

            <FantasyTree cyclePoints={cyclePoints} burst={burst} />

            <div className="mt-4 rounded-3xl border border-emerald-100 bg-white/80 p-3 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[11px] font-black text-slate-500">النقاط داخل الدورة</p>
                  <p className="text-base font-black" style={{ color: stage.color }}>{cyclePoints} / 100</p>
                </div>
                <div className="rounded-2xl px-3 py-2 text-center text-white shadow-sm" style={{ backgroundColor: stage.color }}>
                  <p className="text-[10px] font-black opacity-80">المجموع</p>
                  <p className="text-lg font-black">{points}</p>
                </div>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${stage.color}80, ${stage.color})` }}
                />
              </div>
              <p className="mt-2 text-[11px] font-bold text-slate-500">
                {nextStage ? `التالي عند ${nextStage.points} نقطة: ${nextStage.label}` : 'عند 100 نقطة تعود بذرة وتترقى رتبة الدرع'}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={collectPoints}
                className="rounded-2xl bg-gradient-to-r from-emerald-600 to-cyan-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition-transform active:scale-95"
              >
                جمع النقاط
              </button>
              <button
                type="button"
                onClick={() => {
                  gameAudio.playClick();
                  setPoints(0);
                  setBurst(false);
                }}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition-transform active:scale-95"
              >
                إعادة التجربة
              </button>
            </div>

            <div className="mt-4 rounded-3xl border border-emerald-100 bg-white/70 p-2.5 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <p className="text-xs font-black text-slate-800">مختبر كل حالات النبتة</p>
                <p className="text-[10px] font-bold text-slate-500">اضغط أي بطاقة للمعاينة</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {growthStages.map((item) => (
                  <button
                    key={item.points}
                    type="button"
                    onClick={() => {
                      gameAudio.playClick();
                      setPoints(rank * 100 + item.points);
                      setBurst(false);
                    }}
                    className={`overflow-hidden rounded-2xl border bg-white p-1.5 text-right shadow-sm transition-transform active:scale-95 ${cyclePoints === item.points ? 'ring-2 ring-offset-1' : ''}`}
                    style={{
                      borderColor: `${item.color}45`,
                      ['--tw-ring-color' as string]: item.color,
                    }}
                  >
                    <FantasyTree cyclePoints={item.points} burst={false} compact />
                    <div className="mt-1 flex items-center justify-between gap-1 px-1">
                      <span className="text-[10px] font-black text-slate-900">{item.points}</span>
                      <span className="truncate text-[9px] font-bold" style={{ color: item.color }}>{item.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-6 gap-1.5">
              {[0, 100, 200, 300, 400, 500].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    gameAudio.playClick();
                    setPoints(value);
                    setBurst(false);
                  }}
                  className="rounded-2xl border border-emerald-100 bg-white px-1.5 py-2 text-[10px] font-black text-slate-600 transition-transform active:scale-95"
                >
                  {value}
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-amber-50 px-3 py-2 text-[11px] font-bold leading-5 text-amber-800">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>كل 100 نقطة تبدأ دورة نمو جديدة، ويتطور الدرع من خشبي إلى نحاسي ثم فضي ثم ذهبي ثم ماسي.</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
