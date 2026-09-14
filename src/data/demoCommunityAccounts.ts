import { CommunityMember } from '../types';

export interface DemoCommunityAccount extends CommunityMember {
  id: string;
  level: number;
  points: number;
  progress: number;
  isDemoAccount: true;
  bio: string;
}

const BOT_AVATAR_POOL = [
  'avatar-strawberry', 'avatar-strawberry',
  'avatar-banana', 'avatar-banana', 'avatar-banana', 'avatar-banana',
  'avatar-apple', 'avatar-apple', 'avatar-apple',
  'avatar-orange', 'avatar-orange', 'avatar-orange',
  'avatar-watermelon', 'avatar-watermelon', 'avatar-watermelon',
  'avatar-owl-scholar', 'avatar-owl-scholar',
  'avatar-fox-explorer', 'avatar-fox-explorer',
  'avatar-panda-reader', 'avatar-panda-reader',
  'avatar-cat-scientist', 'avatar-cat-scientist',
  'avatar-lion-captain', 'avatar-lion-captain',
] as const;

const buildBotAvatar = (index: number): string => {
  // A coprime step distributes the weighted catalogue across all 200 accounts.
  // The assignment is random-looking but stable, so one bot keeps one avatar.
  const poolIndex = (index * 17 + 7) % BOT_AVATAR_POOL.length;
  return `${import.meta.env.BASE_URL}avatars/${BOT_AVATAR_POOL[poolIndex]}.jpg`;
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
