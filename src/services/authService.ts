import { getSupabaseClient } from '../lib/supabase';
import { UserProfile } from '../types';
import { FALLBACK_DEFAULT_AVATAR } from '../data/cartoonAvatars';

/**
 * Strict email validation:
 * 1. Must be a valid standard RFC email format without weird chars.
 * 2. Checks domain and ensures no disposable or fake mail providers.
 * 3. Rejects invalid email structures.
 */
export function validateStudentEmail(email: string): { isValid: boolean; error?: string } {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    return { isValid: false, error: 'يرجى إدخال البريد الإلكتروني' };
  }

  // Check strict email format
  const emailRegex = /^[a-zA-Z0-9]+([._%+-][a-zA-Z0-9]+)*@[a-zA-Z0-9]+([.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'صيغة البريد الإلكتروني غير صحيحة' };
  }

  // Reject consecutive dots or dot at start/end of username
  if (trimmed.includes('..') || trimmed.startsWith('.') || trimmed.includes('.@') || trimmed.includes('@.')) {
    return { isValid: false, error: 'البريد يحتوي على نقاط غير صالحة' };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { isValid: false, error: 'صيغة البريد غير صحيحة' };
  }

  const [userPart, domain] = parts;

  if (userPart.length < 3) {
    return { isValid: false, error: 'اسم الحساب في البريد قصير جداً (3 أحرف على الأقل)' };
  }

  // Disallow known disposable/fake email services
  const disposableDomains = [
    'mailinator.com',
    'tempmail.com',
    '10minutemail.com',
    'guerrillamail.com',
    'throwawaymail.com',
    'sharklasers.com',
    'yopmail.com',
    'fakemail.com',
    'example.com',
    'test.com',
    'fake.com',
    'temp-mail.org',
    'dispostable.com',
  ];

  if (disposableDomains.includes(domain)) {
    return { isValid: false, error: 'غير مسموح باستخدام بريد مؤقت أو وهمي' };
  }

  return { isValid: true };
}

/**
 * Synchronize or upsert student profile data into Supabase 'profiles' table.
 * Derives user metadata safely from authentic Supabase User session.
 */
export async function syncUserProfile(supabaseUser: any): Promise<UserProfile> {
  const client = getSupabaseClient();
  const userId = supabaseUser.id;
  const email = supabaseUser.email || '';
  const meta = supabaseUser.user_metadata || {};

  const name =
    meta.full_name ||
    meta.name ||
    meta.user_name ||
    email.split('@')[0] ||
    'طالب المنصة';

  const avatarUrl =
    meta.avatar_url ||
    meta.picture ||
    FALLBACK_DEFAULT_AVATAR;

  const baseProfile: UserProfile = {
    id: userId,
    email,
    name,
    avatarUrl,
    grade: meta.grade || 'السادس الإعدادي',
    branch: meta.branch || 'الفرع العلمي',
    level: 1,
    points: 0,
    studyHours: 0,
    streakDays: 0,
    themeId: meta.theme_id,
  };

  if (!client) {
    return baseProfile;
  }

  try {
    // 1. Try to fetch existing profile from 'profiles' table
    const { data: existingProfile, error: fetchErr } = await client
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile && !fetchErr) {
      return {
        id: userId,
        email: existingProfile.email || email,
        name: existingProfile.full_name || existingProfile.name || name,
        avatarUrl: existingProfile.avatar_url || avatarUrl,
        grade: existingProfile.grade || 'السادس الإعدادي',
        branch: existingProfile.branch || 'الفرع العلمي',
        level: existingProfile.level ?? 1,
        points: existingProfile.points ?? 0,
        studyHours: existingProfile.study_hours ?? 0,
        streakDays: existingProfile.streak_days ?? 0,
        themeId: existingProfile.theme_id,
        growthShieldTier: existingProfile.growth_shield_tier ?? 0,
      };
    }

    // 2. Insert or update student profile in Supabase table
    const profilePayload = {
      id: userId,
      email,
      full_name: name,
      avatar_url: avatarUrl,
      grade: 'السادس الإعدادي',
      branch: 'الفرع العلمي',
      updated_at: new Date().toISOString(),
    };

    await client
      .from('profiles')
      .upsert(profilePayload, { onConflict: 'id' });

    return baseProfile;
  } catch (err) {
    console.warn('Profile sync fallback gracefully used:', err);
    return baseProfile;
  }
}

/**
 * 1. Sign In With Google OAuth via Supabase
 */
export async function signInWithGoogle(): Promise<{ error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { error: 'خدمة Supabase غير مهيأة حالياً. يرجى التحقق من المتغيرات البيئية.' };
  }

  try {
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return {};
  } catch (err: any) {
    return { error: err.message || 'حدث خطأ أثناء الاتصال بمزود Google' };
  }
}

/**
 * 2. Sign In With Email & Password (with strict verification)
 */
export async function signInWithEmailPassword(
  email: string,
  pass: string
): Promise<{ user?: UserProfile; error?: string }> {
  const validation = validateStudentEmail(email);
  if (!validation.isValid) {
    return { error: validation.error };
  }

  if (!pass || pass.length < 6) {
    return { error: 'كلمة المرور يجب ألا تقل عن 6 خانات' };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { error: 'خدمة Supabase غير متوفرة.' };
  }

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password: pass,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' };
      }
      if (error.message.includes('Email not confirmed')) {
        return { error: 'يرجى تأكيد بريدك الإلكتروني أولاً من خلال الرابط المرسل إلى بريدك' };
      }
      return { error: error.message };
    }

    if (data?.user) {
      const profile = await syncUserProfile(data.user);
      return { user: profile };
    }

    return { error: 'لم يتم العثور على بيانات المستخدم' };
  } catch (err: any) {
    return { error: err.message || 'فشل تسجيل الدخول' };
  }
}

/**
 * 3. Sign Up With Email & Password (with strict duplicate check)
 */
export async function signUpWithEmailPassword(
  email: string,
  pass: string,
  fullName: string
): Promise<{ user?: UserProfile; error?: string; message?: string }> {
  const validation = validateStudentEmail(email);
  if (!validation.isValid) {
    return { error: validation.error };
  }

  if (!fullName || fullName.trim().length < 3) {
    return { error: 'يرجى إدخال اسم الطالب الثلاثي بشكل واضح' };
  }

  if (!pass || pass.length < 6) {
    return { error: 'كلمة المرور يجب ألا تقل عن 6 أحرف أو أرقام' };
  }

  const client = getSupabaseClient();
  if (!client) {
    return { error: 'خدمة Supabase غير متوفرة.' };
  }

  try {
    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await client.auth.signUp({
      email: cleanEmail,
      password: pass,
      options: {
        data: {
          full_name: fullName.trim(),
          name: fullName.trim(),
        },
      },
    });

    if (error) {
      if (
        error.message.includes('User already registered') ||
        error.message.includes('already exists') ||
        error.message.includes('unique')
      ) {
        return { error: 'هذا البريد مسجل مسبقاً في المنصة! يرجى التبديل لتبويب تسجيل الدخول.' };
      }
      return { error: error.message };
    }

    // Supabase Security Behavior:
    // If "Confirm email" is enabled or identities array is empty, Supabase returns a fake/empty user or user with identities: []
    // to prevent email enumeration. If identities is empty, the user already exists!
    if (data?.user) {
      const identities = data.user.identities;
      if (Array.isArray(identities) && identities.length === 0) {
        return {
          error: 'هذا البريد مسجل مسبقاً بالفعل في قاعدة البيانات! يرجى التبديل إلى "تسجيل الدخول".',
        };
      }

      // If user requires email confirmation (session is null)
      if (!data.session) {
        return {
          message: 'تم إنشاء الحساب بنجاح! تم إرسال رابط تأكيد الحساب إلى بريدك الإلكتروني، يرجى تفعيله ثم تسجيل الدخول.',
        };
      }

      const profile = await syncUserProfile(data.user);
      return {
        user: profile,
        message: 'تم إنشاء الحساب وتسجيل الدخول بنجاح!',
      };
    }

    return { message: 'تم إرسال رابط تأكيد الحساب إلى بريدك الإلكتروني.' };
  } catch (err: any) {
    return { error: err.message || 'فشل إنشاء الحساب' };
  }
}

/**
 * 3.1 Resend Email Confirmation Link
 */
export async function resendConfirmationEmail(email: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, error: 'خدمة Supabase غير متوفرة.' };
  }

  try {
    const { error } = await client.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل إعادة إرسال رابط التأكيد' };
  }
}

/**
 * 4. Sign Out from Supabase
 */
export async function signOutUser(): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    try {
      await client.auth.signOut();
    } catch (err) {
      console.warn('Error signing out from Supabase:', err);
    }
  }
}

/**
 * 5. Get Current Auth State strictly from Supabase session
 */
export async function getInitialAuthState(): Promise<UserProfile | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  try {
    const { data, error } = await client.auth.getSession();
    if (error || !data?.session?.user) {
      return null;
    }
    return await syncUserProfile(data.session.user);
  } catch (err) {
    console.debug('No active supabase session:', err);
    return null;
  }
}

/**
 * 6. Listen strictly to Supabase Auth State Changes
 */
export async function getSupabaseAccessToken(): Promise<string | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  // Mobile browsers can finish the sign-in callback a moment after the
  // profile is rendered. Give Supabase a few short opportunities to expose
  // the persisted session, but never create or bypass a token.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const { data, error } = await client.auth.getSession();
      if (!error && data.session?.access_token) {
        return data.session.access_token;
      }

      const { data: refreshed, error: refreshError } = await client.auth.refreshSession();
      if (!refreshError && refreshed.session?.access_token) {
        return refreshed.session.access_token;
      }
    } catch (err) {
      console.debug('Could not read or refresh Supabase access token:', err);
    }

    if (attempt < 2) {
      await new Promise((resolve) => window.setTimeout(resolve, 250));
    }
  }

  return null;
}

export function onAuthStateChange(callback: (user: UserProfile | null) => void) {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const { data } = client.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const profile = await syncUserProfile(session.user);
      callback(profile);
    } else {
      callback(null);
    }
  });

  return () => {
    data.subscription.unsubscribe();
  };
}
