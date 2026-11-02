import React, { useState } from 'react';
import {
  User,
  ChevronLeft,
  Check,
  Palette,
  Sparkles,
  ArrowRight,
  Sun,
  Moon,
  Crown,
  Leaf,
  Zap,
  SlidersHorizontal,
  X,
  ShieldCheck,
  Flame,
  LogOut,
  Database,
  RefreshCw,
  Play,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useAppTheme, AppThemeId } from '../services/themeService';
import { gameAudio } from '../utils/gameAudio';
import { getSupabaseClient } from '../lib/supabase';
import { UserProfile } from '../types';
import { FALLBACK_DEFAULT_AVATAR } from '../data/cartoonAvatars';
import { getLevelSnapshot } from '../services/pointsService';

interface SettingsViewProps {
  onOpenProfile?: () => void;
  onBack?: () => void;
  onSignOut?: () => void;
  user?: UserProfile | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onOpenProfile, onBack, onSignOut, user }) => {
  const { currentThemeId, theme, setThemeId } = useAppTheme();
  const userLevelSnapshot = getLevelSnapshot(user?.points ?? 0);
  const settingsAvatar = user?.avatarUrl || FALLBACK_DEFAULT_AVATAR;
  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [dbTestLoading, setDbTestLoading] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<any>(null);

  const themeList: {
    id: AppThemeId;
    title: string;
    description: string;
    badge: string;
    icon: React.ComponentType<{ className?: string }>;
    swatches: string[];
    gradient: string;
  }[] = [
    {
      id: 'solar_light',
      title: 'النظام الشمسي المشرق (الافتراضي)',
      description: 'واجهة نهارية بيضاء نقية عالية الوضوح مع تفاصيل شمسية زاهية',
      badge: 'الافتراضي (أبيض)',
      icon: Sun,
      swatches: ['#FFFFFF', '#0284C7', '#F59E0B', '#F1F5F9'],
      gradient: 'from-[#FFFFFF] via-[#F8FAFC] to-[#F1F5F9]',
    },
    {
      id: 'golden_navy',
      title: 'النمط الذهبي الملكي (فاتح)',
      description: 'أصفر ذهبي وعاجي مشرق بدون أي سواد متناسق وفاخر',
      badge: 'ذهبي فاتح',
      icon: Crown,
      swatches: ['#FFFDF5', '#D97706', '#F59E0B', '#FEF3C7'],
      gradient: 'from-[#FFFDF5] via-[#FEF9EE] to-[#FEF3C7]',
    },
    {
      id: 'amber_work',
      title: 'النمط الكهربائي المرجاني',
      description: 'مرجاني وفيروزي ورملي فوق خلفية فحمية داكنة بلا لون أبيض',
      badge: 'مرجاني داكن',
      icon: Zap,
      swatches: ['#F0AAA6', '#63C8BD', '#C8A86D', '#142629'],
      gradient: 'from-[#142629] via-[#294744] to-[#3C3430]',
    },
    {
      id: 'sky_cyan',
      title: 'النمط السماوي الساطع (فاتح)',
      description: 'أزرق سماوي كريستالي ناصع مع خلفية جليدية بيضاء منعشة',
      badge: 'سماوي فاتح',
      icon: Sparkles,
      swatches: ['#F0F9FF', '#0284C7', '#06B6D4', '#E0F2FE'],
      gradient: 'from-[#F0F9FF] via-[#E8F6FD] to-[#E0F2FE]',
    },
    {
      id: 'emerald_nature',
      title: 'النمط الطبيعي الزمردي (فاتح)',
      description: 'أخضر زمردي مهدئ بخلفية نعناعية بيضاء طبيعية تريح العينين',
      badge: 'زمردي فاتح',
      icon: Leaf,
      swatches: ['#F0FDF4', '#059669', '#10B981', '#D1FAE5'],
      gradient: 'from-[#F0FDF4] via-[#E6F9EE] to-[#D1FAE5]',
    },
    {
      id: 'night',
      title: 'النمط الليلي الأسود والأخضر',
      description: 'خلفية سوداء هادئة مع أضواء خضراء خفيفة ومريحة للعين',
      badge: 'أسود وأخضر',
      icon: Moon,
      swatches: ['#020403', '#22C55E', '#0B1510', '#4ADE80'],
      gradient: 'from-[#06100A] via-[#030804] to-[#010201]',
    },
  ];

  const handleSelectTheme = (tId: AppThemeId) => {
    gameAudio.playClick();
    setThemeId(tId);
  };

  const currentThemeObj = themeList.find((t) => t.id === currentThemeId) || themeList[0];
  const CurrentIcon = currentThemeObj.icon;

  return (
    <div className="space-y-4 px-2 sm:px-3 pt-2 pb-20 animate-in fade-in duration-200 select-none text-right">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl border flex items-center justify-center shadow-sm"
            style={{
              backgroundColor: `${theme.colors.primary}20`,
              borderColor: `${theme.colors.primary}40`,
              color: theme.colors.primary,
            }}
          >
            <Palette className="w-4 h-4" />
          </div>
          <div>
            <h1 className={`text-base font-black ${theme.classes.textMain}`}>الإعدادات</h1>
            <p className={`text-[10px] ${theme.classes.textMuted}`}>إدارة الحساب ومظهر العرض</p>
          </div>
        </div>

        {onBack && (
          <button
            onClick={onBack}
            className={`p-2 rounded-xl border flex items-center justify-center transition-all active:scale-95 cursor-pointer ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
            style={{ color: theme.colors.primary }}
          >
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ======================================================== */}
      {/* 1. PROFILE / ACCOUNT CARD (الصفحة الشخصية) */}
      {/* ======================================================== */}
      <div
        onClick={onOpenProfile}
        className={`p-4 rounded-3xl border transition-all duration-300 shadow-xl cursor-pointer group hover:scale-[1.01] active:scale-[0.99] ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
        style={{
          boxShadow: `0 8px 30px ${theme.colors.glow}`,
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div
                className="w-13 h-13 rounded-2xl p-0.5 border shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`,
                  borderColor: theme.colors.primary,
                }}
              >
                <img
                  src={settingsAvatar}
                  alt={user?.name || 'الصورة الشخصية'}
                  className={`w-full h-full object-cover rounded-[14px] ${settingsAvatar.includes('/avatars/') ? 'scale-[1.18]' : ''}`}
                />
              </div>
              <div className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center" />
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className={`text-sm font-black group-hover:opacity-80 transition-opacity ${theme.classes.textMain}`}>
                  {user?.name || 'الطالب'}
                </h3>
                <span
                  className="text-[9px] font-black px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: `${theme.colors.primary}20`,
                    borderColor: `${theme.colors.primary}40`,
                    color: theme.colors.primary,
                  }}
                >
                  {user?.grade || 'السادس الإعدادي'}
                </span>
              </div>
              <p className={`text-xs ${theme.classes.textMuted}`}>{user?.branch || 'الفرع العلمي'} • العراق</p>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3 fill-amber-500" />
                  مستوى {userLevelSnapshot.level}
                </span>
                <span className={`text-[10px] ${theme.classes.textMuted}`}>• {userLevelSnapshot.totalPoints.toLocaleString('ar-IQ')} نقطة</span>
              </div>
            </div>
          </div>

          <div
            className="w-8 h-8 rounded-xl border flex items-center justify-center group-hover:-translate-x-1 transition-transform"
            style={{
              backgroundColor: `${theme.colors.primary}15`,
              borderColor: `${theme.colors.primary}30`,
              color: theme.colors.primary,
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. SINGLE DEDICATED COLOR / DISPLAY THEME ACTION CARD */}
      {/* ======================================================== */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className={`text-xs font-black ${theme.classes.textMain}`}>مظهر وألوان العرض</span>
          <span className={`text-[10px] font-bold ${theme.classes.textMuted}`}>
            {themeList.length} سمات متوفرة
          </span>
        </div>

        {/* The Trigger Button for Theme Filter Drawer */}
        <div
          onClick={() => {
            gameAudio.playClick();
            setIsThemePickerOpen(true);
          }}
          className={`p-4 rounded-3xl border transition-all duration-300 shadow-xl cursor-pointer group hover:scale-[1.01] active:scale-[0.99] ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
          style={{
            boxShadow: `0 8px 30px ${theme.colors.glow}`,
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl border flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform"
                style={{
                  backgroundColor: `${theme.colors.primary}20`,
                  borderColor: theme.colors.primary,
                  color: theme.colors.primary,
                  boxShadow: `0 0 15px ${theme.colors.glow}`,
                }}
              >
                <CurrentIcon className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-black ${theme.classes.textMain}`}>
                    {currentThemeObj.title}
                  </h3>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm"
                    style={{
                      backgroundColor: `${theme.colors.primary}20`,
                      borderColor: `${theme.colors.primary}50`,
                      color: theme.colors.primary,
                    }}
                  >
                    السمة النشطة
                  </span>
                </div>
                <p className={`text-[11px] ${theme.classes.textMuted} line-clamp-1`}>
                  {currentThemeObj.description}
                </p>

                {/* Live Swatches Preview */}
                <div className="flex items-center gap-1.5 pt-0.5">
                  {currentThemeObj.swatches.map((color, idx) => (
                    <span
                      key={idx}
                      className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <span className="text-[10px] font-bold mr-1" style={{ color: theme.colors.primary }}>
                    تغيير اللون 🎨
                  </span>
                </div>
              </div>
            </div>

            <div
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-bold shrink-0 transition-colors"
              style={{
                backgroundColor: `${theme.colors.primary}15`,
                borderColor: `${theme.colors.primary}40`,
                color: theme.colors.primary,
              }}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>فلاتر الألوان</span>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. FILTER-STYLE MODAL / DRAWER FOR COLOR SELECTION */}
      {/* ======================================================== */}
      {isThemePickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-3xl p-4 sm:p-5 shadow-2xl text-right relative max-h-[90vh] flex flex-col border transition-all duration-300 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
            style={{
              boxShadow: `0 0 35px ${theme.colors.glow}`,
            }}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between pb-3 border-b ${theme.classes.cardBorder}`}>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl border flex items-center justify-center"
                  style={{
                    backgroundColor: `${theme.colors.primary}20`,
                    borderColor: theme.colors.primary,
                    color: theme.colors.primary,
                  }}
                >
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-sm font-black ${theme.classes.textMain}`}>
                    اختر السمة ولون الشاشة
                  </h3>
                  <p className={`text-[10px] ${theme.classes.textMuted}`}>
                    اللون الأبيض هو الافتراضي، وتم إزالة السواد من جميع الأنماط
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsThemePickerOpen(false)}
                className={`p-1.5 rounded-full border transition-colors cursor-pointer ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder} ${theme.classes.textMain}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Themes List with Filter Radio Selection */}
            <div className="overflow-y-auto space-y-2.5 py-3 custom-scrollbar flex-1 pr-1">
              {themeList.map((t) => {
                const IconComponent = t.icon;
                const isSelected = currentThemeId === t.id;

                return (
                  <div
                    key={t.id}
                    onClick={() => handleSelectTheme(t.id)}
                    className={`p-3 rounded-2xl border-2 transition-all duration-300 cursor-pointer relative overflow-hidden group ${
                      isSelected
                        ? 'scale-[1.01] shadow-lg'
                        : `${theme.classes.cardSubtleBg} opacity-90 hover:opacity-100 hover:scale-[1.005]`
                    }`}
                    style={{
                      borderColor: isSelected ? theme.colors.primary : 'rgba(0,0,0,0.08)',
                      backgroundColor: isSelected ? `${theme.colors.primary}15` : undefined,
                      boxShadow: isSelected ? `0 4px 20px ${theme.colors.glow}` : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        {/* Theme Icon Bubble */}
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                            isSelected ? 'shadow-md' : ''
                          }`}
                          style={{
                            backgroundColor: isSelected ? `${theme.colors.primary}25` : 'rgba(0,0,0,0.04)',
                            borderColor: isSelected ? theme.colors.primary : 'rgba(0,0,0,0.1)',
                            color: isSelected ? theme.colors.primary : undefined,
                          }}
                        >
                          <IconComponent className="w-5 h-5" />
                        </div>

                        {/* Title & Description */}
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4
                              className={`text-xs sm:text-sm font-black transition-colors ${
                                isSelected ? '' : theme.classes.textMain
                              }`}
                              style={isSelected ? { color: theme.colors.primary } : {}}
                            >
                              {t.title}
                            </h4>
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.2 rounded-full border"
                              style={{
                                backgroundColor: isSelected ? `${theme.colors.primary}25` : 'rgba(0,0,0,0.05)',
                                borderColor: isSelected ? theme.colors.primary : 'rgba(0,0,0,0.1)',
                                color: isSelected ? theme.colors.primary : undefined,
                              }}
                            >
                              {t.badge}
                            </span>
                          </div>
                          <p className={`text-[10px] ${theme.classes.textMuted} line-clamp-1`}>
                            {t.description}
                          </p>

                          {/* Color Palette Dots */}
                          <div className="flex items-center gap-1 pt-1">
                            {t.swatches.map((clr, cIdx) => (
                              <span
                                key={cIdx}
                                className="w-3 h-3 rounded-full border border-black/15 shadow-sm"
                                style={{ backgroundColor: clr }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Selection Check Circle */}
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? 'scale-110 shadow-md' : 'opacity-40'
                        }`}
                        style={{
                          backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                          borderColor: isSelected ? theme.colors.primary : 'rgba(0,0,0,0.3)',
                          color: '#FFFFFF',
                        }}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Close / Done Button */}
            <div className={`pt-2 border-t ${theme.classes.cardBorder}`}>
              <button
                onClick={() => setIsThemePickerOpen(false)}
                className="w-full py-2.5 rounded-2xl font-black text-xs sm:text-sm text-white shadow-lg transition-transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                style={{
                  backgroundColor: theme.colors.primary,
                  boxShadow: `0 4px 15px ${theme.colors.glow}`,
                }}
              >
                <span>حفظ واختيار السمة</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. SUPABASE LIVE DATABASE DIAGNOSTICS & TEST TOOL */}
      {/* ======================================================== */}
      <div
        className={`p-4 rounded-3xl border space-y-3 transition-all duration-300 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: `${theme.colors.primary}20`,
                borderColor: theme.colors.primary,
                color: theme.colors.primary,
              }}
            >
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h4 className={`text-xs font-black ${theme.classes.textMain}`}>فاحص اتصال قاعدة البيانات الحية</h4>
              <p className={`text-[10px] ${theme.classes.textMuted}`}>فحص الجداول وقراءة المحتوى التعليمي الفعلي من Supabase</p>
            </div>
          </div>
          <button
            onClick={async () => {
              setDbTestLoading(true);
              setDbTestResult(null);
              try {
                const client = getSupabaseClient();
                if (!client) {
                  setDbTestResult({ error: 'عميل Supabase غير مهيأ' });
                  return;
                }
                // Check multiple tables
                const { data: eduData, error: eduErr, count: eduCount } = await client
                  .from('educational_data')
                  .select('id, subject_id, section_id, file_name', { count: 'exact' })
                  .limit(10);

                const { data: wareData, error: wareErr, count: wareCount } = await client
                  .from('lessons_warehouse')
                  .select('id, subject, chapter, lesson_title, file_name, uploaded_at', { count: 'exact' })
                  .limit(10);

                const { data: profData, error: profErr, count: profCount } = await client
                  .from('profiles')
                  .select('id', { count: 'exact' })
                  .limit(5);

                setDbTestResult({
                  success: !eduErr && !wareErr && !profErr,
                  educational_data: {
                    count: eduCount ?? (eduData?.length || 0),
                    sample: eduData || [],
                    error: eduErr?.message || null,
                  },
                  lessons_warehouse: {
                    count: wareCount ?? (wareData?.length || 0),
                    sample: wareData || [],
                    error: wareErr?.message || null,
                  },
                  profiles: {
                    count: profCount ?? (profData?.length || 0),
                    error: profErr?.message || null,
                  },
                });
              } catch (e: any) {
                setDbTestResult({ error: e?.message || 'فشل الاتصال' });
              } finally {
                setDbTestLoading(false);
              }
            }}
            disabled={dbTestLoading}
            className="px-3 py-1.5 rounded-xl text-[11px] font-black text-white shadow transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            style={{ backgroundColor: theme.colors.primary }}
          >
            {dbTestLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            <span>{dbTestLoading ? 'جارِ الفحص...' : 'فحص الاتصال والبيانات'}</span>
          </button>
        </div>

        {dbTestResult && (
          <div className="p-3 rounded-2xl bg-black/20 border border-white/10 text-right space-y-2 text-[11px] font-mono">
            {dbTestResult.error ? (
              <div className="text-rose-400 font-sans font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>خطأ: {dbTestResult.error}</span>
              </div>
            ) : (
              <>
                <div className="text-emerald-400 font-sans font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{dbTestResult.success ? 'تم فحص جداول Supabase بنجاح:' : 'اكتمل الفحص مع وجود أخطاء في بعض الجداول:'}</span>
                </div>
                <div className="text-xs space-y-1 text-slate-300 font-sans">
                  <div>
                    📦 جدول <code className="text-amber-400 font-bold">educational_data</code>: يحتوي على{' '}
                    <b className="text-white">{dbTestResult.educational_data?.count ?? 0}</b> سجل.
                    {dbTestResult.educational_data?.error && (
                      <span className="text-rose-400 text-[10px] block">({dbTestResult.educational_data.error})</span>
                    )}
                  </div>
                  <div>
                    📚 جدول <code className="text-amber-400 font-bold">lessons_warehouse</code>: يحتوي على{' '}
                    <b className="text-white">{dbTestResult.lessons_warehouse?.count ?? 0}</b> سجل.
                    {dbTestResult.lessons_warehouse?.error && (
                      <span className="text-rose-400 text-[10px] block">({dbTestResult.lessons_warehouse.error})</span>
                    )}
                  </div>
                  <div>
                    👤 جدول <code className="text-amber-400 font-bold">profiles</code>: يحتوي على{' '}
                    <b className="text-white">{dbTestResult.profiles?.count ?? 0}</b> طالب مسجل.
                  </div>
                </div>
                {dbTestResult.educational_data?.sample?.length > 0 && (
                  <div className="pt-1 text-[10px] text-slate-400 border-t border-white/10">
                    <span className="font-bold text-slate-300">عينات من الملفات المقروءة: </span>
                    {dbTestResult.educational_data.sample.map((s: any) => s.file_name || s.id).slice(0, 3).join(', ')}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 5. PLATFORM BADGE & ACCREDITATION INFO */}
      {/* ======================================================== */}
      <div
        className={`p-3.5 rounded-3xl border text-center space-y-1.5 transition-all duration-300 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
      >
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold" style={{ color: theme.colors.primary }}>
          <ShieldCheck className="w-4 h-4" />
          <span>منصة نحن معك التعليمية • المنهج العراقي المعتمد</span>
        </div>
        <p className={`text-[10px] ${theme.classes.textMuted}`}>
          الإصدار التفاعلي 3.2.0 • تم التحديث ليتطابق مع الامتحانات الوزارية 2026
        </p>
      </div>

      {/* ======================================================== */}
      {/* 5. LOGOUT BUTTON */}
      {/* ======================================================== */}
      {onSignOut && (
        <button
          onClick={onSignOut}
          className="w-full py-3 px-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>تسجيل الخروج من الحساب</span>
        </button>
      )}
    </div>
  );
};
