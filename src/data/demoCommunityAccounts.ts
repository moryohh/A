import { CommunityMember } from '../types';

export interface DemoCommunityAccount extends CommunityMember {
  id: string;
  level: number;
  points: number;
  progress: number;
  isDemoAccount: true;
  bio: string;
}

const BOT_BACKGROUNDS = ['#38bdf8', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#fb7185', '#2dd4bf', '#60a5fa'];
const BOT_SHIRTS = ['#0f766e', '#1d4ed8', '#7c3aed', '#be123c', '#c2410c', '#047857', '#4338ca'];
const BOT_SKINS = ['#fff7ed', '#fde7d3', '#f6d0b1', '#dca47c', '#a96542', '#75402b'];
const BOT_HAIR = ['#172033', '#4a2c1b', '#7c2d12', '#d97706', '#f8fafc', '#334155'];

const buildBotAvatar = (index: number): string => {
  const background = BOT_BACKGROUNDS[index % BOT_BACKGROUNDS.length];
  const shirt = BOT_SHIRTS[Math.floor(index / BOT_BACKGROUNDS.length) % BOT_SHIRTS.length];
  const skin = BOT_SKINS[Math.floor(index / 5) % BOT_SKINS.length];
  const hair = BOT_HAIR[Math.floor(index / 3) % BOT_HAIR.length];
  const eyeStyle = index % 3;
  const accessoryStyle = Math.floor(index / 7) % 4;
  const eyes = eyeStyle === 0
    ? '<circle cx="39" cy="45" r="3.2" fill="#172033"/><circle cx="61" cy="45" r="3.2" fill="#172033"/>'
    : eyeStyle === 1
      ? '<path d="M35 45q4-5 8 0M57 45q4-5 8 0" fill="none" stroke="#172033" stroke-width="3" stroke-linecap="round"/>'
      : '<ellipse cx="39" cy="45" rx="3" ry="4.5" fill="#172033"/><ellipse cx="61" cy="45" rx="3" ry="4.5" fill="#172033"/>';
  const accessory = accessoryStyle === 0
    ? '<path d="M30 44h15m10 0h15M45 44h10" stroke="#0f172a" stroke-width="2.5"/><circle cx="39" cy="44" r="8" fill="none" stroke="#0f172a" stroke-width="2.5"/><circle cx="61" cy="44" r="8" fill="none" stroke="#0f172a" stroke-width="2.5"/>'
    : accessoryStyle === 1
      ? '<path d="M25 32q25-22 50 0" fill="none" stroke="#fff" stroke-width="4" opacity=".8"/>'
      : accessoryStyle === 2
        ? '<circle cx="75" cy="55" r="5" fill="#fde047"/><path d="M75 48v14M68 55h14" stroke="#fff" stroke-width="2"/>'
        : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" rx="50" fill="${background}"/>
    <circle cx="50" cy="48" r="31" fill="${skin}"/>
    <path d="M20 42q3-31 30-31t30 31q-12-12-30-12T20 42" fill="${hair}"/>
    ${eyes}
    <path d="M39 61q11 10 22 0" fill="none" stroke="#9f1239" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="31" cy="56" r="4" fill="#fb7185" opacity=".55"/><circle cx="69" cy="56" r="4" fill="#fb7185" opacity=".55"/>
    <path d="M16 100q4-27 34-27t34 27" fill="${shirt}"/>
    ${accessory}
    <text x="50" y="94" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" font-weight="700" fill="#fff" opacity=".9">AI ${String(index + 1).padStart(3, '0')}</text>
  </svg>`;
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
