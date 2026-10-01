import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  HelpCircle,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  SendHorizontal,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import { useAppTheme } from '../services/themeService';
import {
  signInWithGoogle,
  signInWithEmailPassword,
  signUpWithEmailPassword,
  validateStudentEmail,
  resendConfirmationEmail,
} from '../services/authService';
import { UserProfile } from '../types';
import { createGuestSession, guestToUserProfile, isGuestPreviewEnabled } from '../services/guestPreviewService';

interface LoginPageProps {
  onLoginSuccess: (user: UserProfile) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { theme } = useAppTheme();

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showGoogleSetupGuide, setShowGoogleSetupGuide] = useState(false);
  const [hasCopiedUrl, setHasCopiedUrl] = useState(false);

  // Email confirmation state after registration
  const [registeredEmailForConfirmation, setRegisteredEmailForConfirmation] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Supabase Callback URL for this specific project
  const callbackUrl = 'https://qlfleszoyujelygwzdgu.supabase.co/auth/v1/callback';

  const copyCallbackUrl = () => {
    navigator.clipboard.writeText(callbackUrl);
    setHasCopiedUrl(true);
    setTimeout(() => setHasCopiedUrl(false), 2500);
  };

  // 1. Google OAuth Sign-in
  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsGoogleLoading(true);

    try {
      const res = await signInWithGoogle();
      if (res.error) {
        if (
          res.error.toLowerCase().includes('provider is not enabled') ||
          res.error.toLowerCase().includes('validation_failed')
        ) {
          setErrorMessage(
            'مزود Google غير مفعل حالياً في لوحة تحكم Supabase. يمكنك تفعيله بسهولة من لوحة التحكم أو استخدام بريد Gmail وكلمة المرور أدناه.'
          );
          setShowGoogleSetupGuide(true);
        } else {
          setErrorMessage(res.error);
        }
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ أثناء الاتصال بمزود Google');
      setIsGoogleLoading(false);
    }
  };

  // 2. Email & Password Form Submit
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const emailCheck = validateStudentEmail(email);
    if (!emailCheck.isValid) {
      setErrorMessage(emailCheck.error || 'البريد الإلكتروني غير صالح');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('كلمة المرور يجب أن تتكون من 6 خانات على الأقل');
      return;
    }

    setIsLoading(true);

    try {
      if (authMode === 'login') {
        const res = await signInWithEmailPassword(email.trim(), password.trim());
        if (res.error) {
          // If email unconfirmed error is returned
          if (res.error.toLowerCase().includes('email not confirmed')) {
            setRegisteredEmailForConfirmation(email.trim());
          } else {
            setErrorMessage(res.error);
          }
        } else if (res.user) {
          onLoginSuccess(res.user);
        }
      } else {
        if (!fullName.trim() || fullName.trim().length < 3) {
          setErrorMessage('يرجى إدخال اسم الطالب الثلاثي بشكل صحيح');
          setIsLoading(false);
          return;
        }
        const res = await signUpWithEmailPassword(email.trim(), password.trim(), fullName.trim());
        if (res.error) {
          setErrorMessage(res.error);
        } else {
          if (res.user) {
            onLoginSuccess(res.user);
          } else {
            // Confirmation is required
            setRegisteredEmailForConfirmation(email.trim());
          }
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Resending Confirmation Email
  const handleResendConfirmation = async () => {
    if (!registeredEmailForConfirmation) return;
    setIsResending(true);
    setResendStatus(null);
    const res = await resendConfirmationEmail(registeredEmailForConfirmation);
    setIsResending(false);
    if (res.success) {
      setResendStatus('تمت إعادة إرسال رسالة التأكيد بنجاح! تفقد بريدك الآن 📬');
    } else {
      setResendStatus(res.error || 'تعذر إعادة الإرسال حالياً، يرجى المحاولة بعد قليل.');
    }
  };

  // 4. Open Gmail directly in a new tab
  const handleOpenGmail = () => {
    window.open('https://mail.google.com', '_blank', 'noopener,noreferrer');
  };

  const handleGuestPreview = () => {
    setErrorMessage(null);
    onLoginSuccess(guestToUserProfile(createGuestSession()));
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-3 sm:p-4 text-right select-none animate-in fade-in duration-300">
      <div
        className={`w-full max-w-md rounded-3xl p-5 sm:p-6 shadow-2xl border relative overflow-hidden transition-all duration-300 ${theme.classes.cardBg} ${theme.classes.cardBorder}`}
        style={{
          boxShadow: `0 12px 40px ${theme.colors.glow}`,
        }}
      >
        {/* Top Decorative Glow Line */}
        <div
          className="absolute top-0 inset-x-0 h-1.5 transition-colors"
          style={{
            background: `linear-gradient(to right, ${theme.colors.primary}, ${theme.colors.secondary}, ${theme.colors.accent})`,
          }}
        />

        {/* ======================================================== */}
        {/* DEDICATED EMAIL CONFIRMATION STATE */}
        {/* ======================================================== */}
        {registeredEmailForConfirmation ? (
          <div className="space-y-4 pt-2 animate-in fade-in zoom-in-95 duration-300">
            {/* Top Mail Icon & Glowing Badge */}
            <div className="text-center flex flex-col items-center gap-2">
              <div
                className="w-16 h-16 rounded-3xl flex items-center justify-center relative shadow-lg"
                style={{
                  backgroundColor: `${theme.colors.primary}20`,
                  border: `2px solid ${theme.colors.primary}`,
                }}
              >
                <Mail className="w-8 h-8 animate-bounce" style={{ color: theme.colors.primary }} />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900" />
              </div>

              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تم إنشاء الحساب بنجاح!</span>
              </div>

              <h2 className="text-xl font-black text-white">تأكيد البريد الإلكتروني مطلوب ✉️</h2>
              <p className="text-xs text-gray-300 leading-relaxed px-2">
                أرسلنا رابط التفعيل الرسمي إلى بريدك الإلكتروني:
              </p>
              <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/10 font-mono text-xs font-bold text-amber-400 max-w-full truncate">
                {registeredEmailForConfirmation}
              </div>
            </div>

            {/* ======================================================== */}
            {/* PROMINENT GMAIL CTA BUTTON */}
            {/* ======================================================== */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleOpenGmail}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-red-500/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                {/* Authentic Gmail Icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
                </svg>
                <span>فتح بريد Gmail لتأكيد الحساب 🚀</span>
                <ExternalLink className="w-4 h-4 opacity-80" />
              </button>
            </div>

            {/* Clear Step-by-Step Arabic Guidance */}
            <div className="bg-[#12121c] p-4 rounded-2xl border border-white/10 space-y-2.5 text-xs text-right">
              <h4 className="font-black text-amber-400 flex items-center gap-1.5 text-[13px]">
                <Inbox className="w-4 h-4" />
                <span>خطوات تفعيل الحساب البسيطة:</span>
              </h4>
              <ul className="space-y-2 text-gray-300 text-[11px] leading-relaxed pr-1">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 text-white font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                    1
                  </span>
                  <span>
                    افتح صندوق الوارد في بريد <b>Gmail</b> (أو تفقد مجلد <b>الرسائل غير المرغوب فيها Spam</b>).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 text-white font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                    2
                  </span>
                  <span>
                    ابحث عن رسالة الترحيب واضغط على زر أو رابط <b>"تأكيد بريدك الإلكتروني" (Confirm Email)</b>.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-white/10 text-white font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                    3
                  </span>
                  <span>
                    بمجرد الضغط على الرابط، عُد إلى هذه الصفحة واضغط على <b>تسجيل الدخول</b> للدخول فوراً!
                  </span>
                </li>
              </ul>
            </div>

            {/* Resend Status feedback */}
            {resendStatus && (
              <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{resendStatus}</span>
              </div>
            )}

            {/* Actions: Return to login & Resend */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setRegisteredEmailForConfirmation(null);
                  setAuthMode('login');
                  setSuccessMessage('قم بتسجيل الدخول بكلمة المرور بعد النقر على رابط التأكيد.');
                }}
                className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <span>العودة وتسجيل الدخول الآن</span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </button>

              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={isResending}
                className="text-[11px] text-gray-400 hover:text-white flex items-center justify-center gap-1.5 py-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
                <span>لم تصلك الرسالة؟ إعادة إرسال رابط التأكيد</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Standard Login & Sign Up View */}
            {/* Brand Header */}
            <div className="text-center space-y-2 pt-2 mb-6">
              <div className="inline-flex items-center justify-center gap-1.5 mb-1">
                <span
                  className="text-xl font-black filter"
                  style={{
                    color: theme.colors.secondary,
                    filter: `drop-shadow(0 0 10px ${theme.colors.secondary})`,
                  }}
                >
                  ✦
                </span>
                <h1 className="text-2xl font-black tracking-wide leading-none flex items-center gap-1.5">
                  <span className={theme.classes.textMain}>منصة</span>
                  <span
                    style={{
                      color: theme.colors.secondary,
                      filter: `drop-shadow(0 0 12px ${theme.colors.glow})`,
                    }}
                  >
                    نحن معك
                  </span>
                </h1>
              </div>

              <p className={`text-xs ${theme.classes.textMuted} font-medium`}>
                {authMode === 'login'
                  ? 'سجل الدخول للمتابعة إلى المحتوى التعليمي والدروس'
                  : 'أنشئ حسابك كطالب في منصة نحن معك التعليمية'}
              </p>
            </div>

            {/* Feedback Messages */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-500 text-xs flex items-start gap-2 animate-in fade-in leading-relaxed">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{errorMessage}</span>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-xs flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* ======================================================== */}
            {/* 1. GOOGLE OAUTH ONE-CLICK LOGIN BUTTON */}
            {/* ======================================================== */}
            <div className="space-y-3 mb-5">
              {isGuestPreviewEnabled() && (
                <button
                  type="button"
                  onClick={handleGuestPreview}
                  className="w-full rounded-2xl border border-amber-300/50 bg-amber-400/15 px-4 py-3.5 text-xs font-black text-amber-200 shadow-md transition-all hover:bg-amber-400/25 active:scale-[0.98]"
                >
                  دخول كضيف لتجربة اللعب الجماعي
                </button>
              )}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading || isLoading}
                className={`w-full py-3.5 px-4 rounded-2xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] shadow-md cursor-pointer ${
                  theme.isLight
                    ? 'bg-white hover:bg-slate-50 border-slate-300 text-slate-800'
                    : 'bg-slate-900/90 hover:bg-slate-800 border-white/20 text-white'
                }`}
                style={{
                  boxShadow: `0 4px 20px ${theme.colors.glow}`,
                }}
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: theme.colors.primary }} />
                    <span>جاري الاتصال بـ Google...</span>
                  </>
                ) : (
                  <>
                    {/* Official Google Multi-color SVG */}
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span className="font-black">التسجيل باستخدام Google</span>
                  </>
                )}
              </button>

              {/* Quick info button to open Google Setup Guide */}
              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={() => setShowGoogleSetupGuide(!showGoogleSetupGuide)}
                  className="text-[11px] font-bold text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>كيفية تفعيل تسجيل Google في لوحة Supabase؟</span>
                </button>
              </div>

              {/* Collapsible Google Setup Guide */}
              {showGoogleSetupGuide && (
                <div
                  className={`p-3.5 rounded-2xl border text-xs space-y-2.5 animate-in fade-in transition-all ${
                    theme.isLight ? 'bg-sky-50/80 border-sky-200 text-sky-900' : 'bg-sky-950/40 border-sky-500/30 text-sky-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-black text-[12px] text-sky-400">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" />
                      خطوات تفعيل تسجيل Google (تستغرق دقيقة واحدة):
                    </span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed opacity-90">
                    <li>
                      ادخل إلى مشروعك في{' '}
                      <a
                        href="https://supabase.com/dashboard/project/qlfleszoyujelygwzdgu/auth/providers"
                        target="_blank"
                        rel="noreferrer"
                        className="underline font-bold text-amber-400 inline-flex items-center gap-0.5"
                      >
                        Supabase Providers <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </li>
                    <li>اضغط على <b>Google</b> وقم بتفعيل خيار <b>Enable Google provider</b>.</li>
                    <li>
                      ضع رابط الـ Callback التالي في Google Cloud Console:
                      <div className="mt-1 flex items-center gap-1 bg-black/40 p-1.5 rounded-lg border border-white/10 font-mono text-[10px] break-all">
                        <span className="flex-1 select-all">{callbackUrl}</span>
                        <button
                          type="button"
                          onClick={copyCallbackUrl}
                          className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded text-[9px] font-bold flex items-center gap-1 shrink-0"
                        >
                          {hasCopiedUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          <span>{hasCopiedUrl ? 'تم النسخ' : 'نسخ'}</span>
                        </button>
                      </div>
                    </li>
                    <li>ألصق الـ <b>Client ID</b> و <b>Client Secret</b> ثم اضغط <b>Save</b>.</li>
                  </ol>
                </div>
              )}

              {/* Divider */}
              <div className="flex items-center gap-3 my-4">
                <div className={`flex-1 h-px ${theme.classes.cardBorder} bg-current opacity-20`} />
                <span className={`text-[11px] font-bold ${theme.classes.textMuted}`}>
                  أو التسجيل بحساب Gmail معتمد
                </span>
                <div className={`flex-1 h-px ${theme.classes.cardBorder} bg-current opacity-20`} />
              </div>
            </div>

            {/* ======================================================== */}
            {/* 2. TAB TOGGLE (LOGIN / SIGNUP) */}
            {/* ======================================================== */}
            <div
              className={`grid grid-cols-2 p-1 rounded-2xl border mb-4 ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder}`}
            >
              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'text-white shadow-md'
                    : `${theme.classes.textMuted} hover:${theme.classes.textMain}`
                }`}
                style={
                  authMode === 'login'
                    ? {
                        backgroundColor: theme.colors.primary,
                        boxShadow: `0 2px 10px ${theme.colors.glow}`,
                      }
                    : {}
                }
              >
                تسجيل الدخول
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setErrorMessage(null);
                  setSuccessMessage(null);
                }}
                className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  authMode === 'signup'
                    ? 'text-white shadow-md'
                    : `${theme.classes.textMuted} hover:${theme.classes.textMain}`
                }`}
                style={
                  authMode === 'signup'
                    ? {
                        backgroundColor: theme.colors.primary,
                        boxShadow: `0 2px 10px ${theme.colors.glow}`,
                      }
                    : {}
                }
              >
                تسجيل لأول مرة (حساب جديد)
              </button>
            </div>

            {/* ======================================================== */}
            {/* 3. EMAIL & PASSWORD FORM */}
            {/* ======================================================== */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              {authMode === 'signup' && (
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold block ${theme.classes.textMain}`}>
                    اسم الطالب الثلاثي
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="مثال: علي حيدر عبد الله"
                      className={`w-full pl-3 pr-9 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder} ${theme.classes.textMain}`}
                      style={{ borderColor: theme.colors.primary }}
                    />
                    <User
                      className="w-4 h-4 absolute right-3 top-3"
                      style={{ color: theme.colors.primary }}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className={`text-[11px] font-bold block ${theme.classes.textMain}`}>
                    بريد Gmail الرسمي
                  </label>
                  <span className="text-[10px] text-emerald-400 font-bold">@gmail.com حصراً</span>
                </div>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@gmail.com"
                    className={`w-full pl-3 pr-9 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder} ${theme.classes.textMain}`}
                    style={{ borderColor: theme.colors.primary }}
                  />
                  <Mail
                    className="w-4 h-4 absolute right-3 top-3"
                    style={{ color: theme.colors.primary }}
                  />
                </div>
                <p className={`text-[10px] ${theme.classes.textMuted}`}>
                  سيتم إرسال رابط تأكيد التفعيل الرسمي إلى هذا البريد.
                </p>
              </div>

              <div className="space-y-1">
                <label className={`text-[11px] font-bold block ${theme.classes.textMain}`}>
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="•••••••• (6 أحرف أو أرقام على الأقل)"
                    className={`w-full pl-3 pr-9 py-2.5 rounded-xl border text-xs focus:outline-none transition-all ${theme.classes.cardSubtleBg} ${theme.classes.cardBorder} ${theme.classes.textMain}`}
                    style={{ borderColor: theme.colors.primary }}
                  />
                  <Lock
                    className="w-4 h-4 absolute right-3 top-3"
                    style={{ color: theme.colors.primary }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full py-3 rounded-2xl text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer mt-2 disabled:opacity-50"
                style={{
                  backgroundColor: theme.colors.primary,
                  boxShadow: `0 4px 15px ${theme.colors.glow}`,
                }}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{authMode === 'login' ? 'دخول للمنصة' : 'إنشاء الحساب وبدء الدراسة'}</span>
                  </>
                )}
              </button>
            </form>

          </>
        )}
      </div>
    </div>
  );
};
