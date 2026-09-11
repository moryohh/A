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

const names = [
  'نور الهدى', 'سارة المجتهدة', 'آدم الباحث', 'زينب القارئة', 'حسن المتفوق',
  'مريم اللامعة', 'علي الدارس', 'شهد الطموحة', 'محمد المنظم', 'رُبى المبدعة',
  'ليان المتفائلة', 'كرار النشيط', 'آية المثابرة', 'يوسف الذكي', 'فاطمة المجدة',
  'عمر المستكشف', 'بتول المتألقة', 'حيدر الطموح', 'رؤى المتفوقة', 'زين العابدين',
  'إسراء النابغة', 'سجاد المجتهد', 'تبارك القارئة', 'مصطفى المتميز', 'هدى الهادئة',
  'منتظر الباحث', 'أميرة المبدعة', 'قاسم المتفوق', 'كوثر الطموحة', 'سيف الدراسي',
  'نرجس المجدة', 'أحمد المنظم', 'رقية النشيطة', 'كاظم المثابر', 'دعاء اللامعة',
  'حوراء الباحثة', 'ياسين المتألق', 'صفا القارئة', 'عبدالله الذكي', 'زينب المتفوقة',
  'حسين الطموح', 'سجى المبدعة', 'باقر الدارس', 'نوران المجتهدة', 'أوس المستكشف',
  'طيبة المتفائلة', 'رضا الباحث', 'شهد المتألقة', 'رائد المثابر', 'لجين النابغة',
];

const bios = [
  'أراجع الدروس خطوة خطوة وأحب مشاركة الملخصات.',
  'أتعلم كل يوم شيئًا جديدًا وأساعد زملائي قدر الإمكان.',
  'أركز على الفهم قبل الحفظ، وأحب الأسئلة العلمية.',
  'رحلتي التعليمية مستمرة، والإنجاز الصغير يصنع فرقًا.',
];

export const DEMO_COMMUNITY_ACCOUNTS: DemoCommunityAccount[] = names.map((name, index) => {
  const level = 1 + (index % 12);
  const progress = 12 + ((index * 17) % 84);
  return {
    id: `demo-community-${String(index + 1).padStart(2, '0')}`,
    name,
    avatarUrl: DEFAULT_CARTOON_AVATARS[(index * 7 + 3) % DEFAULT_CARTOON_AVATARS.length].url,
    level,
    points: level * 120 + progress * 3,
    progress,
    isDemoAccount: true,
    bio: bios[index % bios.length],
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

/** Maps an external record to a stable fictional account without exposing its source identity. */
export function getDemoCommunityAccount(seed: string): DemoCommunityAccount {
  return DEMO_COMMUNITY_ACCOUNTS[stableHash(seed || 'community') % DEMO_COMMUNITY_ACCOUNTS.length];
}
