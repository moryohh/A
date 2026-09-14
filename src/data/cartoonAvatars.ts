export interface CartoonAvatarOption {
  id: string;
  name: string;
  category: string;
  description: string;
  url: string;
  emoji: string;
  bgColor: string;
  borderColor: string;
  unlockLevel: number;
  isFree: boolean;
}

const avatarUrl = (fileName: string) => `${import.meta.env.BASE_URL}avatars/${fileName}.jpg`;
const defaultFaceSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="48" fill="#84cc16"/><circle cx="50" cy="50" r="38" fill="#fffdf2"/><circle cx="36" cy="43" r="5" fill="#263447"/><circle cx="64" cy="43" r="5" fill="#263447"/><circle cx="27" cy="58" r="6" fill="#f9a8d4" opacity=".8"/><circle cx="73" cy="58" r="6" fill="#f9a8d4" opacity=".8"/><path d="M34 60c8 11 24 11 32 0" fill="none" stroke="#263447" stroke-width="5" stroke-linecap="round"/></svg>`;
export const DEFAULT_FACE_AVATAR = `data:image/svg+xml,${encodeURIComponent(defaultFaceSvg)}`;

/**
 * Local avatar catalogue. Level 1 contains the fruit mascots, while level 3
 * unlocks the study mascots. Future avatars can be added with a new unlockLevel.
 */
export const DEFAULT_CARTOON_AVATARS: CartoonAvatarOption[] = [
  {
    id: 'avatar-default-face',
    name: 'الوجه المبتسم الافتراضي',
    category: 'الصور الافتراضية',
    description: 'يظهر تلقائيًا عند ضعف الإنترنت أو تعذر تحميل صورة أخرى',
    emoji: '☺️',
    bgColor: '#ECFCCB',
    borderColor: '#84CC16',
    url: DEFAULT_FACE_AVATAR,
    unlockLevel: 1,
    isFree: true,
  },
  {
    id: 'avatar-strawberry',
    name: 'الفراولة المرحة',
    category: 'شخصيات الفواكه',
    description: 'ابتسامة وطاقة جميلة لبداية الرحلة التعليمية',
    emoji: '🍓',
    bgColor: '#FEE2E2',
    borderColor: '#F43F5E',
    url: avatarUrl('avatar-strawberry'),
    unlockLevel: 1,
    isFree: true,
  },
  {
    id: 'avatar-apple',
    name: 'التفاحة النشيطة',
    category: 'شخصيات الفواكه',
    description: 'رفيقة صغيرة تحب المراجعة وحل الأسئلة',
    emoji: '🍎',
    bgColor: '#FEE2E2',
    borderColor: '#EF4444',
    url: avatarUrl('avatar-apple'),
    unlockLevel: 1,
    isFree: true,
  },
  {
    id: 'avatar-orange',
    name: 'البرتقالة المتفائلة',
    category: 'شخصيات الفواكه',
    description: 'حماس دافئ لكل درس وتحدٍّ جديد',
    emoji: '🍊',
    bgColor: '#FFEDD5',
    borderColor: '#F97316',
    url: avatarUrl('avatar-orange'),
    unlockLevel: 1,
    isFree: true,
  },
  {
    id: 'avatar-banana',
    name: 'الموزة المستكشفة',
    category: 'شخصيات الفواكه',
    description: 'حقيبة صغيرة وروح تحب اكتشاف المفاهيم',
    emoji: '🍌',
    bgColor: '#FEF3C7',
    borderColor: '#EAB308',
    url: avatarUrl('avatar-banana'),
    unlockLevel: 1,
    isFree: true,
  },
  {
    id: 'avatar-watermelon',
    name: 'شريحة البطيخ المرحة',
    category: 'شخصيات الفواكه',
    description: 'فاكهة صيفية لطيفة لبداية مليئة بالحيوية',
    emoji: '🍉',
    bgColor: '#FCE7F3',
    borderColor: '#16A34A',
    url: avatarUrl('avatar-watermelon'),
    unlockLevel: 1,
    isFree: true,
  },
  {
    id: 'avatar-owl-scholar',
    name: 'البومة الباحثة',
    category: 'رفاق الدراسة',
    description: 'رفيقة كتب تساعدك على التركيز في الرحلة',
    emoji: '🦉',
    bgColor: '#CCFBF1',
    borderColor: '#14B8A6',
    url: avatarUrl('avatar-owl-scholar'),
    unlockLevel: 3,
    isFree: true,
  },
  {
    id: 'avatar-fox-explorer',
    name: 'الثعلب المستكشف',
    category: 'رفاق الدراسة',
    description: 'فضول وشجاعة في كل موضوع جديد',
    emoji: '🦊',
    bgColor: '#FFEDD5',
    borderColor: '#F97316',
    url: avatarUrl('avatar-fox-explorer'),
    unlockLevel: 3,
    isFree: true,
  },
  {
    id: 'avatar-panda-reader',
    name: 'الباندا القارئة',
    category: 'رفاق الدراسة',
    description: 'تحب الدفاتر والملخصات والملاحظات',
    emoji: '🐼',
    bgColor: '#CCFBF1',
    borderColor: '#0D9488',
    url: avatarUrl('avatar-panda-reader'),
    unlockLevel: 3,
    isFree: true,
  },
  {
    id: 'avatar-cat-scientist',
    name: 'القطة العالمة',
    category: 'رفاق الدراسة',
    description: 'تجارب وأسئلة علمية بروح مرحة',
    emoji: '🐱',
    bgColor: '#F3E8FF',
    borderColor: '#A855F7',
    url: avatarUrl('avatar-cat-scientist'),
    unlockLevel: 3,
    isFree: true,
  },
  {
    id: 'avatar-lion-captain',
    name: 'الأسد القائد',
    category: 'رفاق الدراسة',
    description: 'قائد شجاع يواصل حتى أصعب سؤال',
    emoji: '🦁',
    bgColor: '#FEF3C7',
    borderColor: '#F59E0B',
    url: avatarUrl('avatar-lion-captain'),
    unlockLevel: 3,
    isFree: true,
  },
];

export const FALLBACK_DEFAULT_AVATAR = DEFAULT_FACE_AVATAR;
