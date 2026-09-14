import { CommunityMember } from '../types';
import { DEFAULT_CARTOON_AVATARS } from './cartoonAvatars';

export interface DemoCommunityAccount extends CommunityMember {
  id: string;
  level: number;
  points: number;
  progress: number;
  isDemoAccount: true;
  bio: string;
}

const buildBotAvatar = (index: number): string => {
  // The first catalogue entry is the universal fallback; bots use the
  // remaining local avatars so real users can keep their selected images.
  const botAvatars = DEFAULT_CARTOON_AVATARS.slice(1);
  return botAvatars[index % botAvatars.length]?.url || DEFAULT_CARTOON_AVATARS[0].url;
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
