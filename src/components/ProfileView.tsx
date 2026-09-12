import React, { useEffect, useState, useRef } from 'react';
import {
  Flame,
  ShieldCheck,
  ArrowRight,
  Zap,
  Target,
  LogOut,
  User,
  Sparkles,
  Camera,
  Upload,
  Check,
  Edit3,
  MessageSquare,
  ThumbsUp,
  Trash2,
  Share2,
  Calendar,
  LockKeyhole,
  UserX,
} from 'lucide-react';
import { useAppTheme, AppThemeId } from '../services/themeService';
import { gameAudio } from '../utils/gameAudio';
import { UserProfile, CommunityPost, CompetitionSnapshot } from '../types';
import { DEFAULT_CARTOON_AVATARS, CartoonAvatarOption } from '../data/cartoonAvatars';
import { updateUserProfileData } from '../services/communityService';
import { getLevelSnapshot } from '../services/pointsService';

interface ProfileViewProps {
  user?: UserProfile | null;
  userPosts?: CommunityPost[];
  onUpdateUser?: (updated: UserProfile) => void;
  onDeletePost?: (postId: string) => void;
  onOpenComments?: (post: CommunityPost) => void;
  onSignOut?: () => void;
  competitionSnapshot?: CompetitionSnapshot | null;
}

const treeMilestones = [
  { points: 0, label: 'بذرة', tone: '#a16207' },
  { points: 2, label: 'جذر صغير', tone: '#b7791f' },
  { points: 5, label: 'ساق صغيرة', tone: '#84cc16' },
  { points: 10, label: 'نبتة بورقتين', tone: '#22c55e' },
  { points: 15, label: 'نبتة بأربع أوراق', tone: '#16a34a' },
  { points: 20, label: 'زهرة', tone: '#db2777' },
  { points: 25, label: 'نبتة بأوراق جانبية', tone: '#059669' },
  { points: 30, label: 'شجيرة', tone: '#15803d' },
  { points: 40, label: 'شجرة مزهرة', tone: '#0f766e' },
  { points: 50, label: 'بداية الثمار', tone: '#ea580c' },
  { points: 60, label: 'شجرة مثمرة', tone: '#16a34a' },
  { points: 70, label: 'شجرة عملاقة', tone: '#166534' },
];

const getTreeStage = (points: number) => {
  return treeMilestones.reduce((current, milestone) => (
    points >= milestone.points ? milestone : current
  ), treeMilestones[0]);
};

const LevelShield: React.FC<{ level: number }> = ({ level }) => {
  const safeLevel = Math.min(Math.max(level, 0), 4);

  return (
    <div className="flex w-auto shrink-0 flex-col items-center justify-center gap-1" aria-label={`درع مستوى ${safeLevel + 1}`}>
      <img src={`${import.meta.env.BASE_URL}assets/shields/shield-${safeLevel}.png`} alt="" className="h-48 w-48 object-contain drop-shadow-xl" />
      <span className="text-sm font-black leading-none text-slate-700">مستوى {safeLevel + 1}</span>
    </div>
  );
};

const GrowthTree: React.FC<{ points: number; animate: boolean; progress: number }> = ({ points, animate, progress }) => {
  const stageIndex = treeMilestones.findIndex((stage) => stage.points === getTreeStage(points).points);
  const stage = treeMilestones[Math.max(0, stageIndex)];
  const showRoot = stageIndex >= 1;
  const showStem = stageIndex >= 2;
  const leafCount = stageIndex >= 4 ? 4 : stageIndex >= 3 ? 2 : 0;
  const showFlower = stageIndex >= 5;
  const showSideLeaves = stageIndex >= 6;
  const treeSize = stageIndex >= 11 ? 1.24 : stageIndex >= 10 ? 1.12 : stageIndex >= 8 ? 1 : stageIndex >= 7 ? 0.8 : 0.58;
  const showWood = stageIndex >= 7;
  const flowerCount = stageIndex >= 8 ? 7 : showFlower ? 1 : 0;
  const fruitCount = stageIndex >= 10 ? 10 : stageIndex >= 9 ? 4 : 0;

  return (
    <div className="relative flex h-40 w-40 shrink-0 items-center justify-center rounded-full p-1 shadow-lg" style={{ background: `conic-gradient(${stage.tone} ${progress}%, rgba(148,163,184,.22) ${progress}% 100%)` }}>
      <div className="relative flex h-full w-full items-center justify-center rounded-full bg-white/75 p-2">
      <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border bg-gradient-to-b from-sky-100 via-emerald-50 to-lime-100 shadow-inner" style={{ borderColor: `${stage.tone}55` }}>
      <style>{`
        @keyframes treeGrowPop { 0% { transform: translateY(8px) scale(.86); opacity:.72; } 58% { transform: translateY(-4px) scale(1.08); opacity:1; } 100% { transform: translateY(0) scale(1); opacity:1; } }
        @keyframes treeSwaySoft { 0%, 100% { transform: rotate(-1.2deg); } 50% { transform: rotate(1.2deg); } }
        @keyframes pointFly { 0% { transform: translate(42px, 42px) scale(.55); opacity:0; } 25% { opacity:1; } 100% { transform: translate(-18px, -42px) scale(1); opacity:0; } }
        @keyframes rewardToTree { 0% { transform: translate(0, 0) scale(.75); opacity:0; } 18% { opacity:1; } 100% { transform: translate(-105px, 38px) scale(1.15); opacity:0; } }
        @keyframes leafPulse { 0%, 100% { filter: drop-shadow(0 0 0 rgba(34,197,94,0)); } 50% { filter: drop-shadow(0 0 10px rgba(34,197,94,.55)); } }
      `}</style>
      <div className="absolute left-3 top-3 h-9 w-9 rounded-full bg-amber-200/80 blur-[1px]" />
      <div className="absolute bottom-3 h-4 w-24 rounded-full bg-emerald-900/15 blur-sm" />
      {animate && [0, 1, 2, 3, 4].map((item) => (
        <span
          key={item}
          className="absolute h-2.5 w-2.5 rounded-full bg-amber-300 shadow-sm"
          style={{
            left: `${58 + item * 5}%`,
            top: `${58 - item * 4}%`,
            animation: `pointFly ${850 + item * 90}ms ease-out ${item * 55}ms both`,
          }}
        />
      ))}
      <svg
        viewBox="0 0 140 140"
        className="relative z-10 h-[116px] w-[116px]"
        style={{
          transformOrigin: '70px 112px',
          animation: animate ? 'treeGrowPop 900ms cubic-bezier(.18,1.25,.28,1) both, treeSwaySoft 2.8s ease-in-out 900ms infinite' : 'treeSwaySoft 4.2s ease-in-out infinite',
        }}
        role="img"
        aria-label={stage.label}
      >
        <path d="M20 116 C44 105 96 105 120 116" fill="#7c4a1d" opacity=".2" />
        <ellipse cx="70" cy="114" rx="39" ry="9" fill="#6b3f18" opacity=".18" />

        {!showStem && (
          <g style={{ animation: animate ? 'treeGrowPop 700ms ease-out both' : undefined }}>
            <ellipse cx="70" cy="96" rx="15" ry="20" fill="#b8752b" />
            <ellipse cx="65" cy="88" rx="5" ry="8" fill="#facc15" opacity=".38" />
          </g>
        )}

        {showRoot && (
          <g fill="none" stroke="#7c4a1d" strokeWidth="4" strokeLinecap="round">
            <path d="M70 100 C60 106 52 109 42 112" />
            <path d="M70 101 C78 108 89 110 101 113" />
            <path d="M70 102 C68 109 67 113 66 118" />
          </g>
        )}

        {showStem && !showWood && (
          <path d="M70 104 C67 84 68 69 72 54" fill="none" stroke="#2f9e44" strokeWidth="8" strokeLinecap="round" />
        )}

        {showWood && (
          <g transform={`translate(70 110) scale(${treeSize}) translate(-70 -110)`}>
            <path d="M61 113 C62 91 64 70 69 48 C74 70 78 92 80 113 Z" fill="#8b5a2b" />
            <path d="M68 61 C52 54 45 45 39 33" fill="none" stroke="#8b5a2b" strokeWidth="7" strokeLinecap="round" />
            <path d="M73 58 C91 51 99 42 105 29" fill="none" stroke="#8b5a2b" strokeWidth="7" strokeLinecap="round" />
            <path d="M70 75 C57 73 48 68 39 60" fill="none" stroke="#8b5a2b" strokeWidth="5" strokeLinecap="round" />
            <path d="M73 76 C88 75 98 68 108 59" fill="none" stroke="#8b5a2b" strokeWidth="5" strokeLinecap="round" />
            <circle cx="50" cy="42" r="22" fill="#22c55e" opacity=".95" />
            <circle cx="87" cy="40" r="25" fill="#16a34a" opacity=".96" />
            <circle cx="70" cy="30" r="27" fill="#4ade80" opacity=".96" />
            <circle cx="37" cy="62" r="18" fill="#15803d" opacity=".9" />
            <circle cx="103" cy="64" r="20" fill="#22c55e" opacity=".92" />
            <circle cx="70" cy="61" r="28" fill="#16a34a" opacity=".97" />
          </g>
        )}

        {!showWood && leafCount > 0 && (
          <g style={{ animation: animate ? 'leafPulse 950ms ease-in-out both' : undefined }}>
            <ellipse cx="58" cy="62" rx="15" ry="8" fill="#22c55e" transform="rotate(-28 58 62)" />
            <ellipse cx="82" cy="62" rx="15" ry="8" fill="#16a34a" transform="rotate(28 82 62)" />
            {leafCount >= 4 && (
              <>
                <ellipse cx="55" cy="80" rx="14" ry="7" fill="#65a30d" transform="rotate(-18 55 80)" />
                <ellipse cx="85" cy="80" rx="14" ry="7" fill="#4d7c0f" transform="rotate(18 85 80)" />
              </>
            )}
          </g>
        )}

        {showSideLeaves && !showWood && (
          <g>
            <ellipse cx="48" cy="73" rx="13" ry="7" fill="#10b981" transform="rotate(-45 48 73)" />
            <ellipse cx="92" cy="73" rx="13" ry="7" fill="#10b981" transform="rotate(45 92 73)" />
          </g>
        )}

        {Array.from({ length: flowerCount }).map((_, index) => {
          const spots = [[70, 48], [52, 45], [91, 42], [39, 62], [101, 62], [70, 24], [82, 69]];
          const [cx, cy] = spots[index] || spots[0];
          return (
            <g key={`flower-${index}`} transform={`translate(${cx} ${cy}) scale(${index === 0 ? 1 : .72})`}>
              <circle r="4" fill="#facc15" />
              <circle cx="0" cy="-7" r="5" fill="#f472b6" />
              <circle cx="7" cy="0" r="5" fill="#fb7185" />
              <circle cx="0" cy="7" r="5" fill="#f472b6" />
              <circle cx="-7" cy="0" r="5" fill="#fb7185" />
            </g>
          );
        })}

        {Array.from({ length: fruitCount }).map((_, index) => {
          const fruits = [[54, 54], [84, 55], [70, 39], [98, 69], [43, 68], [72, 73], [60, 25], [91, 31], [34, 56], [108, 49]];
          const [cx, cy] = fruits[index] || fruits[0];
          return <circle key={`fruit-${index}`} cx={cx} cy={cy} r={stageIndex >= 11 ? 5 : 4} fill={index % 2 ? '#ef4444' : '#f97316'} stroke="#fff7" strokeWidth="1" />;
        })}
      </svg>
      </div>
      </div>
      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full border border-white bg-white px-2 py-0.5 text-[9px] font-black shadow-sm" style={{ color: stage.tone }}>
        {progress}%
      </span>
    </div>
  );
};

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  userPosts = [],
  onUpdateUser,
  onDeletePost,
  onOpenComments,
  onSignOut,
  competitionSnapshot,
}) => {
  const { theme, currentThemeId, setThemeId } = useAppTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const themePickerRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<'posts' | 'achievements' | 'details'>('posts');
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBlockedUsersOpen, setIsBlockedUsersOpen] = useState(false);
  const [avatarLoadIndex, setAvatarLoadIndex] = useState(0);

  const userName = user?.name || 'طالب منصة نحن معك';
  const userGrade = user?.grade || 'السادس الإعدادي';
  const userBranch = user?.branch || 'الفرع العلمي';
  const avatarStorageKey = user?.id ? `nahnu_maak_avatar_${user.id}` : null;
  const storedAvatar = avatarStorageKey ? localStorage.getItem(avatarStorageKey) : null;
  const userAvatar = storedAvatar || user?.avatarUrl || DEFAULT_CARTOON_AVATARS[0].url;
  const streakDays = user?.streakDays ?? 0;
  const totalPoints = user?.points ?? 0;
  const levelSnapshot = getLevelSnapshot(totalPoints);
  const userLevel = levelSnapshot.level;
  const treeStage = getTreeStage(totalPoints);
  const nextTreeStage = treeMilestones.find((stage) => stage.points > totalPoints);
  const treeProgress = nextTreeStage
    ? Math.round(((totalPoints - treeStage.points) / Math.max(1, nextTreeStage.points - treeStage.points)) * 100)
    : 100;
  const [isCollectingPoints, setIsCollectingPoints] = useState(false);
  const [lastCollectedPoints, setLastCollectedPoints] = useState<number | null>(null);
  const profileThemeOptions: { id: AppThemeId; label: string; colors: string[] }[] = [
    { id: 'solar_light', label: 'شمسي', colors: ['#FFFFFF', '#0284C7'] },
    { id: 'golden_navy', label: 'ذهبي', colors: ['#FFFDF5', '#D97706'] },
    { id: 'amber_work', label: 'كهربائي مزرق', colors: ['#FACC15', '#2563EB', '#0F172A'] },
    { id: 'sky_cyan', label: 'سماوي', colors: ['#F0FAFF', '#0891B2'] },
    { id: 'emerald_nature', label: 'زمردي', colors: ['#F0FDF4', '#059669'] },
    { id: 'night', label: 'ليلي أسود وأخضر', colors: ['#020403', '#22C55E', '#06100A'] },
  ];

  useEffect(() => {
    if (!isSettingsOpen) return;

    const handleOutsidePointer = (event: PointerEvent) => {
      if (!themePickerRef.current?.contains(event.target as Node)) {
        setIsSettingsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleOutsidePointer);
    return () => document.removeEventListener('pointerdown', handleOutsidePointer);
  }, [isSettingsOpen]);

  // Filter posts created by this user
  const authoredPosts = userPosts.filter(
    (p) => p.isOwnPost || (user?.id && p.userId === user.id) || p.userName === userName
  );

  // Handle choosing one of the free avatars, respecting the user's current level.
  const handleSelectCartoonAvatar = async (avatarOption: CartoonAvatarOption) => {
    if (!user) return;
    if (userLevel < avatarOption.unlockLevel) {
      showTempMsg(`تُفتح هذه الشخصية عند الوصول إلى المستوى ${avatarOption.unlockLevel}`);
      return;
    }
    const updated: UserProfile = {
      ...user,
      avatarUrl: avatarOption.url,
    };
    if (avatarStorageKey) localStorage.setItem(avatarStorageKey, avatarOption.url);
    onUpdateUser?.(updated);
    setShowAvatarPicker(false);
    showTempMsg(`تم اختيار الشخصية الكرتونية: ${avatarOption.name}`);

    if (user.id) {
      const savedUser = await updateUserProfileData(user.id, { avatarUrl: avatarOption.url });
      if (savedUser) onUpdateUser?.(savedUser);
    }
  };

  // Handle custom photo upload
  const handleCustomPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result) {
        const photoUrl = event.target.result as string;
        const updated: UserProfile = {
          ...user,
          avatarUrl: photoUrl,
        };
        if (avatarStorageKey) localStorage.setItem(avatarStorageKey, photoUrl);
        onUpdateUser?.(updated);
        setShowAvatarPicker(false);
        showTempMsg('تم تحديث صورتك الشخصية بنجاح 📸');

        if (user.id) {
          const savedUser = await updateUserProfileData(user.id, { avatarUrl: photoUrl });
          if (savedUser) onUpdateUser?.(savedUser);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const showTempMsg = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3000);
  };

  const handleCollectPoints = () => {
    gameAudio.playClick();
    setIsCollectingPoints(true);
    setLastCollectedPoints(10);
    window.setTimeout(() => setIsCollectingPoints(false), 1250);
    window.setTimeout(() => setLastCollectedPoints(null), 1250);
  };

  return (
    <div className="p-3 space-y-4 text-right select-none animate-in fade-in duration-200">
      {/* Hidden File Input for Custom Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleCustomPhotoUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Profile Header Card */}
      <div
        className={`border rounded-3xl p-5 shadow-2xl text-center relative overflow-visible transition-all duration-300 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
        style={{
          boxShadow: `0 8px 30px ${theme.colors.glow}`,
        }}
      >
        {/* Banner with Top Actions */}
        <div
          className="absolute top-0 inset-x-0 h-16 flex justify-between items-start p-3 transition-colors"
          style={{
            background: `linear-gradient(to right, ${theme.colors.primary}30, ${theme.colors.secondary}20, ${theme.colors.primary}30)`,
          }}
        >
          <div className="w-10" aria-hidden="true" />

          <div ref={themePickerRef} className="relative z-20">
            <button
              type="button"
              onClick={() => setIsSettingsOpen((previous) => !previous)}
              className="flex flex-col items-center gap-0.5 cursor-pointer transition-transform active:scale-95"
              aria-expanded={isSettingsOpen}
              aria-haspopup="menu"
              aria-label="تغيير اللون"
              title="تغيير اللون"
            >
              <span
                className={`relative flex h-11 w-11 items-center justify-center rounded-full border border-white/50 p-0.5 shadow-lg transition-transform duration-200 ${isSettingsOpen ? 'rotate-12 scale-105' : 'hover:scale-105'}`}
                style={{
                  background: 'linear-gradient(145deg, rgba(255,255,255,.8), rgba(255,255,255,.12))',
                  boxShadow: `0 0 0 2px ${theme.colors.primary}55, 0 0 18px ${theme.colors.glow}`,
                }}
              >
                <span
                  className="relative block h-full w-full rounded-full border border-white/35"
                  style={{
                    background: 'conic-gradient(from 210deg, #0f3b82 0deg 48deg, #2f80ed 48deg 98deg, #16c7d9 98deg 150deg, #facc15 150deg 205deg, #fb923c 205deg 255deg, #ef476f 255deg 310deg, #7c3aed 310deg 360deg)',
                  }}
                >
                  <span className="absolute left-1.5 top-1 h-2.5 w-4 rounded-full bg-white/55 blur-[1px]" />
                  <span className="absolute inset-1 rounded-full border border-white/20" />
                </span>
              </span>
              <span className={`text-[9px] font-black ${theme.classes.textMain}`}>تغيير اللون</span>
            </button>

            {isSettingsOpen && (
              <div
                role="menu"
                aria-label="ألوان التطبيق المتاحة"
                className={`fixed left-1/2 top-1/2 z-[60] w-[calc(100vw-1.5rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-2.5 text-right shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
              >
                <div className="flex items-center justify-between gap-2 px-1 pb-2 mb-2 border-b border-white/10">
                  <span className={`text-[11px] font-black ${theme.classes.textMain}`}>ألوان التطبيق</span>
                  <span className={`text-[9px] ${theme.classes.textMuted}`}>اختر لونًا</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {profileThemeOptions.map((option) => {
                    const selected = currentThemeId === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          gameAudio.playClick();
                          setThemeId(option.id);
                          setIsSettingsOpen(false);
                        }}
                        className={`flex items-center gap-2 rounded-xl border p-2 text-right transition-all active:scale-95 ${selected ? 'ring-2 ring-offset-1' : 'hover:-translate-y-0.5'}`}
                        style={{
                          borderColor: selected ? theme.colors.primary : `${theme.colors.primary}35`,
                          backgroundColor: selected ? `${theme.colors.primary}18` : `${theme.colors.primary}08`,
                          ['--tw-ring-color' as string]: theme.colors.primary,
                        }}
                      >
                        <span
                          className="h-7 w-7 shrink-0 rounded-full border shadow-sm"
                          style={{ background: `linear-gradient(135deg, ${option.colors[0]}, ${option.colors[1]})` }}
                        />
                        <span className={`text-[10px] font-black ${theme.classes.textMain}`}>{option.label}</span>
                        {selected && <Check className="ml-auto h-3.5 w-3.5 text-emerald-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="relative pt-4">
          {/* Avatar with Interactive Edit Badge */}
          <div className="relative inline-block mx-auto group">
            <div
              className="w-24 h-24 rounded-full border-3 p-1 shadow-2xl relative overflow-hidden transition-all"
              style={{
                borderColor: theme.colors.primary,
                backgroundColor: theme.colors.bgCardSubtle,
                boxShadow: `0 0 20px ${theme.colors.glow}`,
              }}
            >
              <img
                src={userAvatar}
                alt={userName}
                width={96}
                height={96}
                decoding="async"
                className={`w-full h-full object-cover rounded-full bg-slate-800 ${userAvatar.includes('/avatars/') ? 'scale-[1.18]' : ''}`}
              />
            </div>

            {/* Quick Change Avatar Button */}
            <button
              type="button"
              onClick={() => setShowAvatarPicker(true)}
              className="absolute bottom-0 right-0 p-2 rounded-full text-white shadow-lg transition-all active:scale-95 cursor-pointer ring-2 ring-slate-900"
              style={{ backgroundColor: theme.colors.primary }}
              title="تغيير الصورة أو اختيار شخصية كرتونية"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <h2 className={`text-lg font-black mt-2.5 ${theme.classes.textMain}`}>{userName}</h2>
          <p className="text-xs font-bold mt-0.5" style={{ color: theme.colors.primary }}>
            {userGrade} • {userBranch}
          </p>

          {user?.email && (
            <p className={`text-[11px] mt-0.5 ${theme.classes.textMuted}`}>{user.email}</p>
          )}

          {/* Quick Avatar Picker CTA */}
          <div className="mt-2.5 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setShowAvatarPicker(true)}
              className={`px-3.5 py-1.5 rounded-full border text-[11px] font-black flex items-center gap-1.5 transition-all cursor-pointer ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder} hover:border-sky-400`}
              style={{ color: theme.colors.primary }}
            >
              <Sparkles className="w-3 h-3" />
              <span>تغيير الأفاتار (شخصيات كرتونية أو صورتك)</span>
            </button>
          </div>

          {/* Success toast feedback inside profile */}
          {saveSuccessMsg && (
            <div className="mt-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <div className="mt-3 rounded-2xl border p-3 text-right" style={{ borderColor: `${theme.colors.primary}30`, backgroundColor: `${theme.colors.primary}08` }}>
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center justify-between gap-2 text-[11px] font-black">
                  <span className={theme.classes.textMain}>المستوى {userLevel + 1}</span>
                  <span style={{ color: theme.colors.primary }}>{levelSnapshot.progressPercent}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full border border-white/10 bg-black/10">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${levelSnapshot.progressPercent}%`, backgroundColor: theme.colors.primary }} />
                </div>
              </div>
              <LevelShield level={userLevel} />
            </div>
          </div>

          <section
            className="mt-3 overflow-hidden rounded-[1.4rem] border p-3.5 text-right shadow-lg"
            style={{
              borderColor: `${treeStage.tone}45`,
              background: `radial-gradient(circle at 18% 20%, ${treeStage.tone}24, transparent 34%), linear-gradient(145deg, ${treeStage.tone}12, ${theme.colors.bgCardSubtle})`,
              boxShadow: `0 16px 36px ${treeStage.tone}12`,
            }}
            aria-label="التقييم الدوري"
          >
            <div className="relative flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={handleCollectPoints}
                    className="shrink-0 rounded-2xl px-4 py-3 text-[11px] font-black text-white shadow-lg transition-transform active:scale-95"
                    style={{
                      background: `linear-gradient(135deg, ${treeStage.tone}, ${theme.colors.primary})`,
                      boxShadow: `0 10px 22px ${treeStage.tone}35`,
                    }}
                    aria-label="جمع النقاط"
                  >
                    جمع النقاط {lastCollectedPoints ? `+${lastCollectedPoints}` : ''}
                  </button>
                  <div className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-amber-200/60 bg-amber-50/75 px-2.5 py-1.5 text-[10px] font-black text-amber-700">
                    <Flame className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                    {streakDays} يوم تفاعل
                  </div>
                </div>
              {lastCollectedPoints && <span className="pointer-events-none absolute right-28 top-7 z-30 text-lg font-black text-amber-500" style={{ animation: 'rewardToTree 1250ms cubic-bezier(.2,.8,.2,1) both' }}>+{lastCollectedPoints}</span>}
              <GrowthTree points={totalPoints} animate={isCollectingPoints} progress={treeProgress} />
            </div>
          </section>
        </div>
      </div>


      {/* ======================================================== */}
      {/* AVATAR SELECTOR MODAL / SHEET */}
      {/* ======================================================== */}
      {showAvatarPicker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in">
          <div
            className={`w-full max-w-md rounded-3xl p-5 border shadow-2xl text-right space-y-4 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-white/10">
              <h3 className={`text-base font-black ${theme.classes.textMain} flex items-center gap-2`}>
                <Sparkles className="w-4 h-4" style={{ color: theme.colors.primary }} />
                <span>اختر صورتك الرمزية أو ارفع صورة</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAvatarPicker(false)}
                className="p-1.5 rounded-full bg-white/10 text-gray-300 hover:text-white"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Custom Image Upload Button */}
            <div className="space-y-2">
              <label className={`text-xs font-black block ${theme.classes.textMain}`}>
                1. رفع صورة مخصصة من جهازك:
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-full py-3 px-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  theme.isLight
                    ? 'border-sky-300 bg-sky-50 text-sky-700 hover:bg-sky-100'
                    : 'border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>اختر صورة من الاستوديو أو التقط صورة</span>
              </button>
            </div>

            {/* 4 Default Cartoon Avatars (Duolingo-style fruits & mascots) */}
            <div className="space-y-2.5 pt-2">
              <label className={`text-xs font-black block ${theme.classes.textMain}`}>
                2. اختر شخصية مجانية من مكتبة الأفاتارات:
              </label>
              <div className="flex items-center justify-between gap-2 rounded-xl border border-sky-500/20 bg-sky-500/5 px-3 py-2 text-[10px]">
                <span className={theme.classes.textMuted}>مستواك الحالي: <strong className="text-sky-400">{userLevel}</strong></span>
                <span className="text-emerald-400 font-bold">الفواكه من المستوى 1</span>
                <span className="text-amber-400 font-bold">رفاق الدراسة من المستوى 3</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {DEFAULT_CARTOON_AVATARS.map((avatar, index) => {
                  const isSelected = userAvatar === avatar.url;
                  const isUnlocked = userLevel >= avatar.unlockLevel;
                  return (
                    <button
                      key={avatar.id}
                      type="button"
                      onClick={() => handleSelectCartoonAvatar(avatar)}
                      disabled={!isUnlocked}
                      aria-label={isUnlocked ? `اختيار ${avatar.name}` : `${avatar.name} مقفلة حتى المستوى ${avatar.unlockLevel}`}
                      className={`p-3 rounded-2xl border text-right transition-all flex flex-col items-center gap-2 relative overflow-hidden ${
                        isSelected
                          ? 'border-sky-400 bg-sky-500/20 shadow-lg shadow-sky-500/15'
                          : isUnlocked
                          ? `${theme.classes.cardSubtleBg} ${theme.classes.cardBorder} hover:border-sky-400/70 hover:-translate-y-0.5 cursor-pointer`
                          : 'border-white/5 bg-black/10 opacity-55 cursor-not-allowed'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px] z-10">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                      {!isUnlocked && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-900/80 text-amber-300 flex items-center justify-center text-[10px] z-10" title={`يفتح في المستوى ${avatar.unlockLevel}`}>
                          <LockKeyhole className="w-3 h-3" />
                        </span>
                      )}

                      <div
                        className="w-16 h-16 rounded-2xl p-1 shadow-md border transition-transform duration-200 overflow-hidden"
                        style={{
                          backgroundColor: avatar.bgColor,
                          borderColor: avatar.borderColor,
                        }}
                      >
                        {index <= avatarLoadIndex ? (
                          <img
                            src={avatar.url}
                            alt={avatar.name}
                            className="w-full h-full object-cover scale-[1.12]"
                            loading={index === 0 ? 'eager' : 'lazy'}
                            decoding="async"
                            onLoad={() => setAvatarLoadIndex((previous) => Math.max(previous, index + 1))}
                            onError={() => setAvatarLoadIndex((previous) => Math.max(previous, index + 1))}
                          />
                        ) : (
                          <div className="w-full h-full rounded-xl animate-pulse bg-white/20" aria-label="جارٍ تحميل الصورة" />
                        )}
                      </div>

                      <div className="text-center w-full">
                        <div className={`text-xs font-black ${theme.classes.textMain}`}>{avatar.name}</div>
                        <div className={`text-[10px] mt-0.5 line-clamp-1 ${isUnlocked ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {isUnlocked ? `متاح مجاناً • المستوى ${avatar.unlockLevel}` : `يفتح في المستوى ${avatar.unlockLevel}`}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAvatarPicker(false)}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs text-center"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PROFILE TABS: MY POSTS / ACHIEVEMENTS / DETAILS */}
      {/* ======================================================== */}
      <div
        className={`grid grid-cols-3 p-1 rounded-2xl border ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`}
      >
        <button
          type="button"
          onClick={() => setActiveTab('posts')}
          className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'posts'
              ? 'text-white shadow-md'
              : `${theme.classes.textMuted} hover:${theme.classes.textMain}`
          }`}
          style={
            activeTab === 'posts'
              ? {
                  backgroundColor: theme.colors.primary,
                  boxShadow: `0 2px 10px ${theme.colors.glow}`,
                }
              : {}
          }
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>منشوراتي ({authoredPosts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('achievements')}
          className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'achievements'
              ? 'text-white shadow-md'
              : `${theme.classes.textMuted} hover:${theme.classes.textMain}`
          }`}
          style={
            activeTab === 'achievements'
              ? {
                  backgroundColor: theme.colors.primary,
                  boxShadow: `0 2px 10px ${theme.colors.glow}`,
                }
              : {}
          }
        >
          <Target className="w-3.5 h-3.5" />
          <span>الإنجازات</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'details'
              ? 'text-white shadow-md'
              : `${theme.classes.textMuted} hover:${theme.classes.textMain}`
          }`}
          style={
            activeTab === 'details'
              ? {
                  backgroundColor: theme.colors.primary,
                  boxShadow: `0 2px 10px ${theme.colors.glow}`,
                }
              : {}
          }
        >
          <User className="w-3.5 h-3.5" />
          <span>البيانات</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB CONTENT 1: MY POSTS */}
      {/* ======================================================== */}
      {activeTab === 'posts' && (
        <div className="space-y-3">
          {authoredPosts.length === 0 ? (
            <div
              className={`p-8 rounded-3xl border text-center space-y-2 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
            >
              <MessageSquare className="w-8 h-8 mx-auto text-gray-500" />
              <h4 className={`text-xs font-bold ${theme.classes.textMain}`}>لم تنشر أي مشاركة بعد</h4>
              <p className={`text-[11px] ${theme.classes.textMuted}`}>
                انتقل إلى المجتمع الطلابي واطرح سؤالاً أو شارك ملخصاً مع زملائك!
              </p>
            </div>
          ) : (
            authoredPosts.map((post) => (
              <div
                key={post.id}
                className={`p-4 rounded-3xl border space-y-3 shadow-md relative transition-all ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={post.userAvatar || userAvatar}
                      alt={post.userName}
                      width={32}
                      height={32}
                      decoding="async"
                      loading="lazy"
                      className={`w-8 h-8 rounded-full object-cover border ${(post.userAvatar || userAvatar).includes('/avatars/') ? 'scale-[1.12]' : ''}`}
                      style={{ borderColor: theme.colors.primary }}
                    />
                    <div>
                      <h4 className={`text-xs font-black ${theme.classes.textMain}`}>{post.userName}</h4>
                      <span className={`text-[10px] ${theme.classes.textMuted}`}>{post.timeAgo}</span>
                    </div>
                  </div>

                  {onDeletePost && (
                    <button
                      type="button"
                      onClick={() => onDeletePost(post.id)}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="حذف هذا المنشور"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className={`text-xs leading-relaxed ${theme.classes.textMain}`}>{post.content}</p>

                {/* Images Preview in Post */}
                {post.images && post.images.length > 0 && (
                  <div
                    className={`grid gap-1.5 rounded-2xl overflow-hidden ${
                      post.images.length === 1
                        ? 'grid-cols-1'
                        : post.images.length === 2
                        ? 'grid-cols-2'
                        : 'grid-cols-2'
                    }`}
                  >
                    {post.images.slice(0, 4).map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt={`صورة ${i + 1}`}
                        className="w-full h-28 object-cover rounded-xl border border-white/10"
                      />
                    ))}
                  </div>
                )}

                {/* Footer counters */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-gray-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-sky-400 font-bold">
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{post.likesCount} إعجاب</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenComments?.(post)}
                      className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{post.commentsCount} تعليق</span>
                    </button>
                  </div>

                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10">
                    منشور نشط
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT 2: ACHIEVEMENTS */}
      {/* ======================================================== */}
      {activeTab === 'achievements' && (
        <div
          className={`border rounded-3xl p-4 shadow-xl space-y-3 text-xs transition-all duration-300 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
        >
          <h3 className={`font-black border-b pb-2 flex items-center gap-1.5 ${theme.classes.textMain} ${theme.classes.cardBorder}`}>
            <Target className="w-4 h-4" style={{ color: theme.colors.primary }} />
            الإنجازات والتقدم الدراسي
          </h3>

          <div className="space-y-2">
            <div
              className={`p-3 rounded-2xl border flex items-center justify-between ${
                theme.isLight ? 'bg-slate-50 border-slate-200' : `${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl border flex items-center justify-center"
                  style={{
                    backgroundColor: `${theme.colors.primary}20`,
                    borderColor: `${theme.colors.primary}40`,
                    color: theme.colors.primary,
                  }}
                >
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className={`font-bold ${theme.classes.textMain}`}>المستوى الأكاديمي {userLevel}</div>
                  <div className={`text-[10px] ${theme.classes.textMuted}`}>{totalPoints} نقطة • التقدم {getLevelSnapshot(totalPoints).progressPercent}% نحو المستوى التالي</div>
                </div>
              </div>
              <span
                className="text-[10px] font-black px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${theme.colors.primary}20`,
                  borderColor: `${theme.colors.primary}40`,
                  color: theme.colors.primary,
                }}
              >
                المستوى {userLevel}
              </span>
            </div>

            <div
              className={`p-3 rounded-2xl border flex items-center justify-between ${
                theme.isLight ? 'bg-slate-50 border-slate-200' : `${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl border border-amber-500/30 bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <div className={`font-bold ${theme.classes.textMain}`}>سلسلة المذاكرة المتواصلة</div>
                  <div className={`text-[10px] ${theme.classes.textMuted}`}>التزام يومي لمدة {streakDays} يوماً</div>
                </div>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400">
                مشتعل 🔥
              </span>
            </div>

            <div
              className={`p-3 rounded-2xl border flex items-center justify-between ${
                theme.isLight ? 'bg-slate-50 border-slate-200' : `${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className={`font-bold ${theme.classes.textMain}`}>طالب متميز في الوزاريات</div>
                  <div className={`text-[10px] ${theme.classes.textMuted}`}>حل أكثر من 150 سؤال وزاري</div>
                </div>
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                معتمد ✓
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB CONTENT 3: DETAILS */}
      {/* ======================================================== */}
      {activeTab === 'details' && (
        <div
          className={`border rounded-3xl p-4 shadow-xl space-y-3 text-xs ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
        >
          <h3 className={`font-black border-b pb-2 flex items-center gap-1.5 ${theme.classes.textMain} ${theme.classes.cardBorder}`}>
            <User className="w-4 h-4" style={{ color: theme.colors.primary }} />
            المعلومات الدراسية والحساب
          </h3>

          <div className="space-y-2.5">
            <div>
              <span className={`text-[10px] block ${theme.classes.textMuted}`}>الاسم الكامل:</span>
              <span className={`font-bold text-xs ${theme.classes.textMain}`}>{userName}</span>
            </div>

            <div>
              <span className={`text-[10px] block ${theme.classes.textMuted}`}>البريد الإلكتروني المعتمد:</span>
              <span className="font-mono text-xs font-bold text-sky-400">{user?.email || 'طالب المنصة'}</span>
            </div>

            <div>
              <span className={`text-[10px] block ${theme.classes.textMuted}`}>المرحلة والفرع:</span>
              <span className={`font-bold text-xs ${theme.classes.textMain}`}>{userGrade} - {userBranch}</span>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowAvatarPicker(true)}
                className="w-full py-2.5 rounded-xl border border-sky-500/40 bg-sky-500/10 text-sky-400 text-xs font-black flex items-center justify-center gap-1.5"
              >
                <Camera className="w-4 h-4" />
                <span>تعديل الصورة الرمزية والأفاتار</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <section className={`rounded-3xl border p-3 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}>
        <button
          type="button"
          onClick={() => setIsBlockedUsersOpen((previous) => !previous)}
          className="w-full flex items-center justify-between text-right"
        >
          <span className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-400 border border-rose-500/20"><UserX className="w-4 h-4" /></span>
            <span>
              <span className={`block text-xs font-black ${theme.classes.textMain}`}>الأشخاص المحظورون</span>
              <span className={`block text-[10px] mt-0.5 ${theme.classes.textMuted}`}>إدارة الحسابات التي لن تظهر لك</span>
            </span>
          </span>
          <span className={`text-[10px] font-bold ${theme.classes.textMuted}`}>{isBlockedUsersOpen ? 'إخفاء' : 'عرض'}</span>
        </button>
        {isBlockedUsersOpen && (
          <div className={`mt-3 rounded-2xl border p-3 text-center text-[11px] ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder} ${theme.classes.textMuted}`}>
            لا توجد حسابات محظورة حالياً.
          </div>
        )}
      </section>

      {onSignOut && (
        <button
          type="button"
          onClick={onSignOut}
          className={`w-full rounded-2xl border px-4 py-3 text-xs font-black flex items-center justify-center gap-2 text-rose-500 transition-all active:scale-[0.98] hover:bg-rose-500/10 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
          title="تسجيل خروج من الحساب"
          aria-label="تسجيل خروج من الحساب"
        >
          <LogOut className="h-4 w-4" />
          <span>تسجيل خروج من الحساب</span>
        </button>
      )}

    </div>
  );
};
