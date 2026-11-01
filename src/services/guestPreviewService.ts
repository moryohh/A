import { UserProfile } from '../types';

const STORAGE_KEY = 'duha_preview_guest_v1';

export const isGuestPreviewEnabled = (): boolean =>
  import.meta.env.VITE_ENABLE_GUEST_PREVIEW === 'true';

export interface GuestSession {
  id: string;
  name: string;
  createdAt: string;
}

function isValidGuest(value: unknown): value is GuestSession {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as GuestSession;
  return typeof candidate.id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate.id) &&
    typeof candidate.name === 'string' && candidate.name.length > 0;
}

export function loadGuestSession(): GuestSession | null {
  if (!isGuestPreviewEnabled() || typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isValidGuest(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function createGuestSession(): GuestSession {
  if (typeof window === 'undefined') throw new Error('Guest preview requires a browser.');
  const guestId = typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
        const random = crypto.getRandomValues(new Uint8Array(1))[0] % 16;
        const value = character === 'x' ? random : (random & 0x3) | 0x8;
        return value.toString(16);
      });
  const session: GuestSession = {
    id: guestId,
    name: `ضيف ${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString(),
  };
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function clearGuestSession(): void {
  if (typeof window !== 'undefined') window.sessionStorage.removeItem(STORAGE_KEY);
}

export function guestToUserProfile(session: GuestSession): UserProfile {
  return {
    id: session.id,
    email: '',
    name: session.name,
    avatarUrl: '',
    grade: 'تجربة التحدّي',
    branch: 'معاينة',
    level: 1,
    points: 0,
    studyHours: 0,
    streakDays: 0,
    themeId: undefined,
    isGuest: true,
  };
}

export function isGuestProfile(user: UserProfile | null | undefined): boolean {
  return user?.isGuest === true;
}
