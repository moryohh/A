import { CommunityMember } from '../types';

export interface DemoCommunityAccount extends CommunityMember {
  id: string;
  level: number;
  points: number;
  progress: number;
  isDemoAccount: true;
  bio: string;
}

const buildBotAvatar = (index: number): string => {
  const hue = (index * 137.508) % 360;
  const eyeOffset = 8 + (index % 5);
  const mouthCurve = 3 + (index % 7);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="hsl(${hue} 78% 62%)"/><stop offset="1" stop-color="hsl(${(hue + 48) % 360} 72% 38%)"/></linearGradient></defs><rect width="96" height="96" rx="28" fill="url(#g)"/><circle cx="48" cy="42" r="28" fill="#fff" fill-opacity=".92"/><circle cx="${37 - eyeOffset / 5}" cy="39" r="4" fill="#172033"/><circle cx="${59 + eyeOffset / 5}" cy="39" r="4" fill="#172033"/><path d="M35 53 Q48 ${53 + mouthCurve} 61 53" fill="none" stroke="#172033" stroke-width="4" stroke-linecap="round"/><circle cx="27" cy="49" r="4" fill="#fb7185" fill-opacity=".65"/><circle cx="69" cy="49" r="4" fill="#fb7185" fill-opacity=".65"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

const profiles = Array.from({ length: 200 }, (_, index): DemoCommunityAccount => {
  const level = 20 + (index % 51);
  const progress = 12 + ((index * 17) % 84);
  return {
    id: `demo-community-${String(index + 1).padStart(3, '0')}`,
    name: `عضو المجتمع ${index + 1}`,
    avatarUrl: buildBotAvatar(index),
    level,
    points: level * 120 + progress * 3,
    progress,
    isDemoAccount: true,
    bio: 'طالب نشط في المجتمع ويشارك محتوى تعليمياً باستمرار.',
  };
});

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Selects a stable avatar/profile from the platform catalog for each external record. */
export function getDemoCommunityAccount(seed: string): DemoCommunityAccount {
  return profiles[stableHash(seed || 'community') % profiles.length];
}

/** Keeps one stable bot identity per external author while preserving the API author's name. */
export function getCommunityBotAccount(seed: string, authorName?: string): DemoCommunityAccount {
  const account = getDemoCommunityAccount(seed);
  return {
    ...account,
    name: authorName?.trim() || account.name,
  };
}
