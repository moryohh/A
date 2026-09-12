export const GROWTH_CYCLE_POINTS = 100;
export const MAX_SHIELD_TIER = 7;

export interface GrowthSession {
  points: number;
  pendingPoints: number;
}

const key = (userId: string) => `nahnu_maak:growth-session:v1:${userId}`;
const safe = (value: unknown) => Math.max(0, Number(value) || 0);

export const getGrowthSession = (userId?: string): GrowthSession => {
  if (!userId || typeof window === 'undefined') return { points: 0, pendingPoints: 0 };
  try {
    const value = JSON.parse(window.sessionStorage.getItem(key(userId)) || '{}');
    return {
      points: Math.min(GROWTH_CYCLE_POINTS - 0.1, safe(value.points)),
      pendingPoints: safe(value.pendingPoints),
    };
  } catch {
    return { points: 0, pendingPoints: 0 };
  }
};

const save = (userId: string, value: GrowthSession) => {
  if (typeof window !== 'undefined') window.sessionStorage.setItem(key(userId), JSON.stringify(value));
};

export const queueGrowthPoints = (userId: string, points: number): GrowthSession => {
  const current = getGrowthSession(userId);
  const next = { ...current, pendingPoints: current.pendingPoints + safe(points) };
  save(userId, next);
  return next;
};

export const collectGrowthPoints = (userId: string, shieldTier = -1) => {
  const current = getGrowthSession(userId);
  const collected = current.pendingPoints;
  const combined = current.points + collected;
  const completedCycles = Math.floor(combined / GROWTH_CYCLE_POINTS);
  const next = { points: Number((combined % GROWTH_CYCLE_POINTS).toFixed(1)), pendingPoints: 0 };
  const firstShieldUnlocked = shieldTier < 0 && combined >= 20;
  const baseShieldTier = firstShieldUnlocked ? 0 : shieldTier;
  save(userId, next);
  return {
    ...next,
    collected,
    completedCycles,
    nextShieldTier: Math.min(MAX_SHIELD_TIER, Math.max(-1, baseShieldTier) + completedCycles),
  };
};

export const resetGrowthSession = (userId?: string) => {
  if (userId && typeof window !== 'undefined') window.sessionStorage.removeItem(key(userId));
};
