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

const profiles = Array.from({ length: 50 }, (_, index): DemoCommunityAccount => {
  const level = 1 + (index % 12);
  const progress = 12 + ((index * 17) % 84);
  return {
    id: `demo-community-${String(index + 1).padStart(2, '0')}`,
    name: `عضو المجتمع ${index + 1}`,
    avatarUrl: DEFAULT_CARTOON_AVATARS[(index * 7 + 3) % DEFAULT_CARTOON_AVATARS.length].url,
    level,
    points: level * 120 + progress * 3,
    progress,
    isDemoAccount: true,
    bio: 'بيانات تقدم تجريبية داخل المجتمع الطلابي.',
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
