import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase';
import {
  EducationalLesson,
  SubjectChapter,
  SubjectChapterLesson,
  OpenLessonContext,
  LessonIndex,
  LessonIndexFile,
  SubjectChapterIndex,
  SubjectIndex,
  LessonSectionType,
  TeacherStory,
} from '../types';
import { cleanTeacherName } from '../utils/cleanTeacherName';
import { fetchCloudflareEducationalRecord } from './cloudflareContentService';

// In-Memory Cache Store for Lazy-Loaded Data
const subjectIndexCache = new Map<string, SubjectIndex>();
const lessonBundleCache = new Map<string, LessonContentBundle>();
const chaptersCache = new Map<string, SubjectChapter[]>();
const chapterLessonsCache = new Map<string, SubjectChapterLesson[]>();
const lessonJsonCache = new Map<string, EducationalLesson>();

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  isFallback: boolean;
}

export interface LessonContentBundle {
  cacheKey: string;
  subjectId: string;
  chapterNumber: number;
  lessonNumber: number;
  lessonId: string;
  lessonKey: string;
  loadedSections: string[];
  lesson: EducationalLesson;
  teacherStories: TeacherStory[];
  curriculumData?: any;
  mcqData?: any;
  trueFalseData?: any;
  phData?: any;
  dataSource?: 'cloudflare' | 'supabase' | 'fallback';
}

/**
 * Builds the canonical lesson key
 * Format: `${subjectId}:ch${chapterNumber}:les${lessonNumber}`
 */
export function buildLessonKey(
  subjectId: string,
  chapterNumber: number,
  lessonNumber: number
): string {
  const cleanSub = (subjectId || '').toLowerCase().trim();
  return `${cleanSub}:ch${chapterNumber}:les${lessonNumber}`;
}

/**
 * Builds the canonical cache key
 * Format: `${subjectId}:ch${chapterNumber}:les${lessonNumber}:${lessonId}`
 */
export function buildCacheKey(
  subjectId: string,
  chapterNumber: number,
  lessonNumber: number,
  lessonId: string
): string {
  const cleanSub = (subjectId || '').toLowerCase().trim();
  return `${cleanSub}:ch${chapterNumber}:les${lessonNumber}:${lessonId}`;
}

/**
 * Normalizes section ID from database.
 * If section_id = 'tf', normalizes to 'true_false' in app layer.
 */
export function normalizeSectionId(sectionId: string): LessonSectionType | null {
  const s = (sectionId || '').toLowerCase().trim();
  if (s === 'curriculum' || s === 'منهج') return 'curriculum';
  if (s === 'lessons' || s === 'دروس' || s === 'lesson') return 'lessons';
  if (s === 'mcq' || s === 'mcqs' || s === 'اختيارات' || s === 'اختيار_من_متعدد') return 'mcq';
  if (s === 'ph' || s === 'فلاش_كاردز' || s === 'بطاقات') return 'ph';
  if (s === 'true_false' || s === 'tf' || s === 'صح_خطأ' || s === 'صح_ام_خطا') return 'true_false';
  return null;
}

/**
 * Blacklist of known dummy, test, music, and entertainment YouTube video IDs
 * that must NEVER be shown in an educational curriculum platform.
 */
export const BLACKLISTED_DUMMY_YOUTUBE_IDS = new Set([
  'dQw4w9WgXcQ',
  '9bZkp7q19f0',
  'kJQP7kiw5Fk',
  '2ePf9rue1Ao',
  'Air0g9qgCgM',
  'jNQXAC9IVRw',
  'M7lc1UVf-VE',
  'y6120QOlsfU',
  'C0DPdy98e4c',
  'ZbZSe6N_BXs',
  'RgKAFK5djSk',
  'kXYiU_JCYtU',
  'JGwWNGJdvx8',
  'OPf0YbXqDm0',
  'fJ9rUzIMcZQ',
  'L_LUpnjgPso',
  '3JZ_D3ELwOQ',
  'e-ORhEE9VVg',
  'V-_O7nl0Ii0',
  'oHg5SJYRHA0',
  'DLzxrzFCyOs',
  'YQHsXMglC9A',
]);

/**
 * Checks if a video title or channel or content summary contains non-educational/entertainment markers.
 */
export function isNonEducationalVideo(title = '', channel = '', summary = ''): boolean {
  const combined = `${title} ${channel} ${summary}`.toLowerCase();
  const bannedKeywords = [
    'rick astley',
    'never gonna give you up',
    'ray william johnson',
    'equals three',
    'gangnam style',
    'psy',
    'official music video',
    'vevo',
    'lyric video',
    'official video',
    'remastered music video',
    'flexin\' on ya',
    'rickroll',
    'fireplace',
    'burning fireplace',
  ];

  return bannedKeywords.some((keyword) => combined.includes(keyword));
}

/**
 * Extracts a YouTube Video ID from various URL formats or raw ID strings.
 * Returns empty string if missing, invalid, or fake/dummy placeholder.
 * Strictly NEVER returns a random fallback video.
 */
export function extractYoutubeId(urlOrId?: string, title = '', channel = '', summary = ''): string {
  if (!urlOrId || typeof urlOrId !== 'string') return '';
  const trimmed = urlOrId.trim();
  if (
    !trimmed ||
    trimmed.toLowerCase() === 'null' ||
    trimmed.toLowerCase() === 'undefined' ||
    trimmed.toLowerCase() === 'none' ||
    trimmed.toLowerCase() === 'dummy' ||
    trimmed.toLowerCase() === 'test'
  ) {
    return '';
  }

  // Check if content metadata is obviously non-educational
  if (isNonEducationalVideo(title, channel, summary)) {
    return '';
  }

  let extractedId = '';

  // If already an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    extractedId = trimmed;
  } else {
    // Handle standard youtube links
    const match = trimmed.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/
    );
    if (match && match[1]) {
      extractedId = match[1];
    }
  }

  // Check against blacklisted dummy/entertainment video IDs
  if (!extractedId || BLACKLISTED_DUMMY_YOUTUBE_IDS.has(extractedId)) {
    return '';
  }

  return extractedId;
}

/**
 * Maps subject IDs/keys to database subject_id values in educational_data table
 */
export function getDbSubjectIds(subjectKey: string): string[] {
  const s = (subjectKey || '').toLowerCase().trim();
  const map: Record<string, string[]> = {
    biology: [
      'biology',
      'biology_6',
      'bio',
      'bio_6',
      'biology-6',
      'bio-6',
      'biology_part1',
      'biology_part2',
      'احياء',
      'أحياء',
      'الاحياء',
      'الأحياء',
      'علم الأحياء',
      'علم_الاحياء',
      'al-ahyaa',
      'alahyaa',
      'al_ahyaa',
      'ahyaa',
      'ahya',
      'al-ahya',
      'biologie',
      'biology_curriculum',
    ],
    physics: [
      'physics',
      'physics_6',
      'phys',
      'phys_6',
      'physics-6',
      'فيزياء',
      'الفيزياء',
      'علم الفيزياء',
      'al-fizyaa',
      'alfizyaa',
      'fizyaa',
    ],
    chemistry: [
      'chemistry',
      'chemistry_6',
      'chem',
      'chem_6',
      'chemistry-6',
      'كيمياء',
      'الكيمياء',
      'علم الكيمياء',
      'al-keemyaa',
      'alkeemyaa',
      'keemyaa',
    ],
    mathematics: [
      'mathematics',
      'math',
      'maths',
      'mathematics_6',
      'math_6',
      'رياضيات',
      'الرياضيات',
      'al-reyadhyat',
      'reyadhyat',
    ],
    'arabic-1': [
      'arabic_part1',
      'arabic-1',
      'arabic1',
      'arabic_1',
      'arabic',
      'قواعد',
      'قواعد اللغة العربية',
      'عربي1',
      'عربي_1',
      'اللغة العربية ج1',
      'اللغة العربية 1',
    ],
    'arabic-2': [
      'arabic_part2',
      'arabic-2',
      'arabic2',
      'arabic_2',
      'arabic',
      'ادب',
      'أدب',
      'الأدب والنصوص',
      'عربي2',
      'عربي_2',
      'اللغة العربية ج2',
      'اللغة العربية 2',
    ],
    arabic: [
      'arabic_part1',
      'arabic_part2',
      'arabic',
      'عربي',
      'اللغة العربية',
      'قواعد',
      'أدب',
      'ادب',
    ],
    islamic: [
      'islamic',
      'islamic_studies',
      'islam',
      'إسلامية',
      'اسلامية',
      'التربية الإسلامية',
      'الاسلامية',
      'الإسلامية',
    ],
    english: [
      'english',
      'english_6',
      'eng',
      'eng_6',
      'انكليزي',
      'إنكليزي',
      'انجليزي',
      'إنجليزي',
      'اللغة الإنجليزية',
      'اللغة الإنكليزية',
    ],
  };

  const list = map[s] || [s];
  const allVariants = new Set<string>();
  list.forEach((id) => {
    allVariants.add(id);
    allVariants.add(id.toLowerCase());
    allVariants.add(id.toUpperCase());
    allVariants.add(id.charAt(0).toUpperCase() + id.slice(1).toLowerCase());
  });
  return Array.from(allVariants);
}

/**
 * Extracts chapter and segment/lesson numbers from strings or filenames
 */
export function fileNameMatchesLesson(fileName: string | undefined, chapterNumber?: number, lessonNumber?: number): boolean {
  if (!fileName || chapterNumber === undefined || lessonNumber === undefined) return false;

  const arabicToLatin = (value: string) => value.replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
  const normalized = arabicToLatin(String(fileName).toLowerCase()).replace(/[\s_.\/\\-]+/g, '');
  const hasToken = (token: string) => new RegExp(`${token}(?!\\d)`, 'i').test(normalized);

  const chapterMatches = [
    `ch${chapterNumber}`,
    `chapter${chapterNumber}`,
    `فصل${chapterNumber}`,
  ].some(hasToken);
  const lessonMatches = [
    `les${lessonNumber}`,
    `lesson${lessonNumber}`,
    `segment${lessonNumber}`,
    `سجمنت${lessonNumber}`,
    `درس${lessonNumber}`,
  ].some(hasToken);

  return chapterMatches && lessonMatches;
}

export function extractChapterAndSegment(input: string): { chapter?: number; segment?: number } {
  if (!input) return {};
  const chMatch =
    input.match(/ch(?:apter)?[\s_-]*(\d+|[٠-٩]+)/i) ||
    input.match(/فصل[\s_-]*(\d+|[٠-٩]+)/i) ||
    input.match(/\/(\d+|[٠-٩]+)\//);
  const segMatch =
    input.match(/(?:segment|lesson|les)[\s_-]*(\d+|[٠-٩]+)/i) ||
    input.match(/(?:ال)?سجمنت[\s_-]*(\d+|[٠-٩]+)/i) ||
    input.match(/الدرس[\s_-]*(\d+|[٠-٩]+)/i) ||
    input.match(/_(\d+)\.json$/i) ||
    input.match(/(\d+)/);

  const parseNumber = (value: string): number | undefined => {
    const ascii = value.replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
    const parsed = Number(ascii);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
  };

  return {
    chapter: chMatch ? parseNumber(chMatch[1]) : undefined,
    segment: segMatch ? parseNumber(segMatch[1]) : undefined,
  };
}

/**
 * Formats any lesson title into clean Arabic, completely stripping "السجمنت" or "segment"
 */
export function formatArabicLessonTitle(title: string | undefined | null): string {
  if (!title) return 'الدرس';
  let t = String(title).trim();

  // Strip .json suffix if present
  t = t.replace(/\.json$/i, '');

  // Strip file path if present
  if (t.includes('/')) {
    const parts = t.split('/');
    t = parts[parts.length - 1];
  }

  // Replace "الدرس / السجمنت 31" or "الدرس / سجمنت 31" -> "الدرس 31"
  t = t.replace(/الدرس\s*[\/\-:]\s*(?:ال)?سجمنت\s*(\d+|[٠-٩]+)/gi, 'الدرس $1');
  t = t.replace(/الدرس\s*[\/\-:]\s*(?:ال)?سجمنت/gi, 'الدرس');

  // Replace "السجمنت 31" or "سجمنت 31" -> "الدرس 31"
  t = t.replace(/(?:ال)?سجمنت\s*(\d+|[٠-٩]+)/gi, 'الدرس $1');
  t = t.replace(/(?:ال)?سجمنت/gi, 'الدرس');

  // Replace "segment_31" or "segment 31" or "seg_31" -> "الدرس 31"
  t = t.replace(/(?:segment|seg)[\s_-]*(\d+)/gi, 'الدرس $1');

  // Replace "lesson_31" or "les_31" -> "الدرس 31"
  t = t.replace(/(?:lesson|les)[\s_-]*(\d+)/gi, 'الدرس $1');

  // Clean multiple spaces
  t = t.replace(/\s+/g, ' ').replace(/^[\/\-:]\s*/, '').trim();
  return t;
}

const ARABIC_ORDINALS = [
  'الأول',
  'الثاني',
  'الثالث',
  'الرابع',
  'الخامس',
  'السادس',
  'السابع',
  'الثامن',
  'التاسع',
  'العاشر',
];

export function getArabicChapterTitle(num: number, rawTitle?: string): string {
  if (rawTitle && rawTitle.includes('الفصل')) {
    return rawTitle;
  }
  const ordinal = ARABIC_ORDINALS[num - 1] || `${num}`;
  return `الفصل ${ordinal}`;
}

function flattenContentText(value: any): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(flattenContentText).join(' ');
  if (typeof value === 'object') return Object.values(value).map(flattenContentText).join(' ');
  return '';
}

function normalizeTopicText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[ًٌٍَُِّْـ]/g, '')
    .replace(/[إأآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');
}

function topicWords(value: string): Set<string> {
  const stopWords = new Set(['من', 'في', 'على', 'عن', 'الى', 'و', 'او', 'مع', 'هذا', 'هذه', 'ذلك', 'تلك', 'الفصل', 'الدرس']);
  return new Set(
    normalizeTopicText(value)
      .split(/[^\p{L}\p{N}]+/u)
      .filter((word) => word.length >= 3 && !stopWords.has(word))
  );
}

function chapterNumberFromText(value: string): number | undefined {
  const text = normalizeTopicText(value);
  const ordinal: Record<string, number> = {
    الاول: 1, الاولى: 1, الثاني: 2, الثانيه: 2, الثالث: 3, الثالثه: 3,
    الرابع: 4, الرابعه: 4, الخامس: 5, الخامسه: 5, السادس: 6, السادسه: 6,
  };
  const numeric = text.match(/(?:الفصل|chapter|ch)[\s_-]*(\d+)/i);
  if (numeric) return Number(numeric[1]);
  const named = text.match(/الفصل\s+(الاولى?|الثانيه?|الثالثه?|الرابعه?|الخامسه?|السادسه?)/i);
  return named ? ordinal[named[1]] : undefined;
}

function videoMatchesLesson(vid: any, context: OpenLessonContext, curriculumJson?: any): boolean {
  const title = String(vid?.title || '');
  const summary = String(vid?.content_summary || '');
  const detected = Array.isArray(vid?.detected_topics) ? vid.detected_topics.join(' ') : '';
  const matched = Array.isArray(vid?.matched_topics) ? vid.matched_topics.join(' ') : '';
  const metadata = `${title} ${summary} ${detected} ${matched}`;

  // A video explicitly labelled with another chapter must never leak into this lesson.
  const explicitChapter = chapterNumberFromText(metadata);
  if (explicitChapter !== undefined && explicitChapter !== context.chapterNumber) return false;

  // When the source includes curriculum metadata, require at least two meaningful
  // topic words in common. This removes contaminated recommendations while keeping
  // valid lecture/review videos that describe the same lesson in different wording.
  if (curriculumJson) {
    const curriculumWords = topicWords(flattenContentText(curriculumJson));
    const videoWords = topicWords(metadata);
    let overlap = 0;
    videoWords.forEach((word) => { if (curriculumWords.has(word)) overlap += 1; });
    // A curriculum-backed lesson must have topical evidence in the video
    // metadata; never accept a generic or unrelated video merely because it
    // belongs to the same teacher/chapter.
    if (curriculumWords.size > 0) return overlap >= 2;
  }
  return true;
}

function collectMetadataValues(value: any, keyName: string, output = new Set<string>()): Set<string> {
  if (!value || typeof value !== 'object') return output;
  if (Array.isArray(value)) {
    value.forEach((item) => collectMetadataValues(item, keyName, output));
    return output;
  }
  Object.entries(value).forEach(([key, child]) => {
    if (key.toLowerCase() === keyName && typeof child === 'string' && child.trim()) output.add(child.trim());
    if (child && typeof child === 'object') collectMetadataValues(child, keyName, output);
  });
  return output;
}

function contentBelongsToLesson(content: any, context: OpenLessonContext): boolean {
  const lessonIds = [...collectMetadataValues(content, 'lesson_id')];
  if (!lessonIds.length) return true;
  const expected = normalizeTopicText(context.lessonId);
  return lessonIds.some((value) => {
    const actual = normalizeTopicText(value);
    return actual === expected || actual.startsWith(`${expected}_`) || expected.startsWith(`${actual}_`);
  });
}

/**
 * ============================================================================
 * 1. getSubjectIndex (Stage 1: Subject Index & Metadata Only)
 * ============================================================================
 * Fetches lightweight metadata from `educational_content_index` view or RPC.
 * Does NOT request the heavy JSON `content` column.
 */
export async function getSubjectIndex(
  subjectId: string,
  subjectName = 'المادة'
): Promise<SubjectIndex> {
  const normKey = (subjectId || '').toLowerCase().trim();
  if (subjectIndexCache.has(normKey)) {
    return subjectIndexCache.get(normKey)!;
  }

  const startTime = Date.now();
  const supabase = getSupabaseClient();
  const dbSubjects = getDbSubjectIds(normKey);

  let rawRows: any[] = [];
  let fetchError: any = null;

  // The canonical lesson/chapter list must remain the lightweight Supabase
  // index. Cloudflare is used only after a lesson is selected, for the exact
  // record IDs supplied by this index. This prevents D1/R2 metadata from
  // inventing lessons or changing the ordering shown to students.
  if (supabase && isSupabaseConfigured()) {
    try {
      // 1. Try querying the dedicated View: `educational_content_index`
      const { data: viewData, error: viewError } = await supabase
        .from('educational_content_index')
        .select('record_id, subject_id, section_id, file_name, lesson_id, chapter_number, lesson_number, title, has_content')
        .in('subject_id', dbSubjects)
        .order('chapter_number', { ascending: true })
        .order('lesson_number', { ascending: true });

      if (!viewError && viewData && viewData.length > 0) {
        rawRows = viewData;
      } else {
        // 2. Try RPC: `get_subject_content_index`
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_subject_content_index', {
          p_subject_id: dbSubjects[0] || normKey,
        });

        if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
          rawRows = rpcData;
        } else {
          // Do not derive the lesson list from educational_data metadata. It
          // contains legacy/test files and is the source of phantom lessons.
          fetchError = viewError || rpcError;
        }
      }
    } catch (err) {
      console.warn('[getSubjectIndex] Database query error:', err);
      fetchError = err;
    }
  }

  // 4. Normalize and group raw index rows into LessonIndex by lessonKey
  const allLessonsMap: Record<string, LessonIndex> = {};
  const chapterGroups: Record<number, { chapterNumber: number; title: string; lessons: LessonIndex[] }> = {};

  if (rawRows.length > 0) {
    // Some mathematics index rows are topic records with a real lesson_id and
    // record_id but no numeric lesson_number. Give those records a deterministic
    // display ordinal within their chapter; the immutable IDs remain the source
    // of truth and are never replaced by a guessed filename/number.
    const topicOrdinals = new Map<string, number>();
    const topicCounters: Record<number, number> = {};
    rawRows
      .filter((row) => normalizeSectionId(row.section_id) === 'lessons' && row.lesson_number == null && row.chapter_number != null)
      .sort((a, b) => String(a.record_id || '').localeCompare(String(b.record_id || '')))
      .forEach((row) => {
        const chapter = Number(row.chapter_number);
        topicCounters[chapter] = (topicCounters[chapter] || 0) + 1;
        topicOrdinals.set(String(row.record_id), topicCounters[chapter]);
      });

    // The index view can return curriculum/game rows before the video's
    // lessons row. Process lessons first so those rows attach to an existing
    // canonical lesson instead of being silently discarded by the guard below.
    const orderedRows = [...rawRows].sort((a, b) => {
      const aIsLesson = normalizeSectionId(a.section_id || '') === 'lessons' ? 0 : 1;
      const bIsLesson = normalizeSectionId(b.section_id || '') === 'lessons' ? 0 : 1;
      return aIsLesson - bIsLesson;
    });

    orderedRows.forEach((row) => {
      if (row.file_name?.includes('organized_tree')) return;

      const rawFileName = row.file_name || '';
      const parsedPath = extractChapterAndSegment(rawFileName);
      const normalizedSection = normalizeSectionId(row.section_id || '');
      const isLessonRow = normalizedSection === 'lessons';
      // Only lesson-section rows are allowed to create an item in the lesson
      // list. MCQ/TF/PH/curriculum rows may attach files to an existing lesson,
      // but must never create a phantom lesson from a legacy filename counter.
      const chNum = row.chapter_number != null ? Number(row.chapter_number) : parsedPath.chapter || 0;
      const indexedTopicOrdinal = row.record_id ? topicOrdinals.get(String(row.record_id)) : undefined;
      const lesNum = row.lesson_number != null ? Number(row.lesson_number) : indexedTopicOrdinal || 0;
      // The canonical index contains a preparatory segment 0 and a few legacy
      // imported records with file counters (for example 2026/10525). Neither
      // is a real lesson number in the curriculum UI.
      if (!Number.isInteger(chNum) || chNum < 1 || !Number.isInteger(lesNum) || lesNum < 1 || lesNum > 999) {
        return;
      }

      const lessonKey = buildLessonKey(normKey, chNum, lesNum);
      const rawRecordId = row.record_id || row.id;
      const rawLessonId =
        row.lesson_id ||
        rawFileName.split('/').pop()?.replace('.json', '') ||
        `${normKey}-ch${chNum}-les${lesNum}`;

      if (!allLessonsMap[lessonKey] && !isLessonRow) return;

      if (!allLessonsMap[lessonKey]) {
        allLessonsMap[lessonKey] = {
          lessonKey,
          subjectId: normKey,
          chapterNumber: chNum,
          lessonNumber: lesNum,
          lessonId: rawLessonId,
          title: formatArabicLessonTitle(row.title || `الدرس ${lesNum}`),
          files: {},
        };
      }

      if (normalizedSection && rawRecordId) {
        const existing = allLessonsMap[lessonKey].files[normalizedSection];
        const candidatePriority = normalizedSection === 'lessons'
          ? (rawFileName.includes('cleaned_json_files') ? 0 : rawFileName.includes('segment') ? 1 : 2)
          : (rawFileName.includes(`_${normalizedSection}`) ? 0 : 1);
        const existingPriority = existing
          ? (normalizedSection === 'lessons'
            ? (existing.fileName.includes('cleaned_json_files') ? 0 : existing.fileName.includes('segment') ? 1 : 2)
            : (existing.fileName.includes(`_${normalizedSection}`) ? 0 : 1))
          : Infinity;
        if (!existing || candidatePriority < existingPriority) allLessonsMap[lessonKey].files[normalizedSection] = {
          recordId: String(rawRecordId),
          fileName: rawFileName,
        };
      }
    });

    // Group into chapters
    Object.values(allLessonsMap).forEach((lesson) => {
      const chNum = lesson.chapterNumber;
      if (!chapterGroups[chNum]) {
        chapterGroups[chNum] = {
          chapterNumber: chNum,
          title: getArabicChapterTitle(chNum),
          lessons: [],
        };
      }
      chapterGroups[chNum].lessons.push(lesson);
    });
  }

  // Sort chapters and lessons ascending
  const chapters: SubjectChapterIndex[] = Object.values(chapterGroups)
    .sort((a, b) => a.chapterNumber - b.chapterNumber)
    .map((cg) => ({
      ...cg,
      lessons: cg.lessons.sort((a, b) => a.lessonNumber - b.lessonNumber),
    }));

  const totalLessons = Object.keys(allLessonsMap).length;

  const result: SubjectIndex = {
    subjectId: normKey,
    subjectName,
    chapters,
    allLessons: allLessonsMap,
    totalLessons,
  };

  subjectIndexCache.set(normKey, result);

  const indexMs = Date.now() - startTime;
  console.debug('[content-timing] Index loaded:', {
    subjectId: normKey,
    indexMs,
    chaptersCount: chapters.length,
    totalLessons,
  });

  return result;
}

/**
 * Helper to build TeacherStories from lessons[0].teachers[].videos[]
 * Supporting all keys: url, video_url, youtube_url, youtubeId, youtube_id, video_id, embed_url, link
 */
export function buildTeacherStoriesFromLessonJson(
  rawJson: any,
  context: OpenLessonContext,
  subjectName = 'المادة',
  curriculumJson?: any
): TeacherStory[] {
  let teachersList: any[] = [];

  if (rawJson && Array.isArray(rawJson.lessons) && rawJson.lessons.length > 0) {
    const l0 = rawJson.lessons[0];
    teachersList = Array.isArray(l0.teachers) ? l0.teachers : [];
  } else if (rawJson && Array.isArray(rawJson.teachers)) {
    teachersList = rawJson.teachers;
  }

  const stories: TeacherStory[] = [];

  teachersList.forEach((t: any, idx: number) => {
    const rawTName = t.teacher_name || t.name || `أستاذ ${idx + 1}`;
    const tName = cleanTeacherName(rawTName) || rawTName;
    const channelTitle = t.channel_title || t.channelTitle || t.channel_name || tName;

    const videos: any[] = Array.isArray(t.videos) ? t.videos : [];
    for (const vid of videos) {
      if (!vid) continue;
      if (!videoMatchesLesson(vid, context, curriculumJson)) continue;
      const rawVideoUrlOrId =
        vid.url ||
        vid.video_url ||
        vid.youtube_url ||
        vid.youtubeUrl ||
        vid.youtubeId ||
        vid.youtube_id ||
        vid.video_id ||
        vid.embed_url ||
        vid.link ||
        '';

      const validYtId = extractYoutubeId(
        rawVideoUrlOrId,
        vid.title || '',
        channelTitle,
        vid.content_summary || ''
      );

      if (validYtId) {
        const ytThumb = `https://img.youtube.com/vi/${validYtId}/hqdefault.jpg`;
        const vTitle = formatArabicLessonTitle(vid.title || context.title);

        const storyObj: TeacherStory = {
          id: `story-${context.lessonKey}-${idx}-${validYtId}`,
          teacherName: tName,
          channelName: channelTitle,
          subject: subjectName,
          title: vTitle,
          avatar: t.avatar && !t.avatar.includes('unsplash.com/photo-1573496359142') ? t.avatar : ytThumb,
          hasUnseen: true,
          youtubeId: validYtId,
          videoUrl: `https://www.youtube.com/watch?v=${validYtId}`,
          duration: vid.duration || '20:00',
          storyImage: ytThumb,
          textNotes: vid.content_summary || `شرح ${tName} لدرس ${vTitle}`,
          lessonContext: { ...context },
        };

        stories.push(storyObj);
        break; // One primary video story per teacher
      }
    }
  });

  return stories;
}

/**
 * ============================================================================
 * 2. getLessonContentBundle (Stage 3: Fetch 5 Section Files for This Lesson ONLY)
 * ============================================================================
 */
export async function getLessonContentBundle(
  context: OpenLessonContext,
  lessonIndex?: LessonIndex,
  signal?: AbortSignal
): Promise<LessonContentBundle> {
  const startTime = Date.now();
  context = {
    ...context,
    lessonId: context.lessonId || `${context.subjectId}-ch${context.chapterNumber}-les${context.lessonNumber}`,
    lessonKey:
      context.lessonKey || buildLessonKey(context.subjectId, context.chapterNumber, context.lessonNumber),
    title: context.title || context.lessonTitle || `الدرس ${context.lessonNumber}`,
    lessonTitle: context.lessonTitle || context.title || `الدرس ${context.lessonNumber}`,
  };

  const cacheKey = buildCacheKey(
    context.subjectId,
    context.chapterNumber,
    context.lessonNumber,
    context.lessonId
  );

  if (lessonBundleCache.has(cacheKey)) {
    return lessonBundleCache.get(cacheKey)!;
  }

  const supabase = getSupabaseClient();
  let indexData = lessonIndex;

  if (!indexData) {
    const subIdx = await getSubjectIndex(context.subjectId);
    indexData = subIdx.allLessons[context.lessonKey];
  }

  // 1. Gather recordIds for the 5 sections from index
  const recordIds = indexData?.files
    ? (Object.values(indexData.files)
        .map((f) => f?.recordId)
        .filter(Boolean) as string[])
    : [];

  let rawSectionRows: any[] = [];
  let dataSource: LessonContentBundle['dataSource'] = 'supabase';

  // Trial path: fetch the exact immutable records from R2 by source ID.
  if (recordIds.length > 0) {
    try {
      const cloudRecords = await Promise.all(
        recordIds.map(async (id) => {
          try {
            return { id, content: await fetchCloudflareEducationalRecord(id) };
          } catch {
            return null;
          }
        })
      );
      rawSectionRows = cloudRecords
        .filter((row): row is { id: string; content: any } => Boolean(row?.content))
        .map((row) => {
          const section = Object.entries(indexData?.files || {}).find(([, file]) => file.recordId === row.id)?.[0] || '';
          const fileName = Object.values(indexData?.files || {}).find((file) => file.recordId === row.id)?.fileName || '';
          return { id: row.id, subject_id: context.subjectId, section_id: section, file_name: fileName, content: row.content };
        })
        .filter((row) => {
          // The lessons/video record is already selected by the immutable
          // Supabase record_id. Its own lesson_id is the video-source mapping
          // and must not be compared with a UI-generated fallback ID.
          if (normalizeSectionId(row.section_id) === 'lessons') return true;
          const matches = contentBelongsToLesson(row.content, context);
          if (!matches) console.warn('[getLessonContentBundle] Ignoring non-video content with mismatched lesson_id:', row.id);
          return matches;
        });
      // A partial R2 bundle is not reported as Cloudflare: missing sections may
      // be filled by Supabase below, so claiming a single source would be false.
      if (recordIds.length > 0 && rawSectionRows.length === recordIds.length) dataSource = 'cloudflare';
    } catch (err) {
      console.warn('[getLessonContentBundle] Cloudflare R2 unavailable; using Supabase fallback:', err);
    }
  }

  if (supabase && isSupabaseConfigured()) {
    try {
      const loadedRecordIds = new Set(rawSectionRows.map((row) => String(row.id)));
      const missingRecordIds = recordIds.filter((id) => !loadedRecordIds.has(String(id)));
      if (missingRecordIds.length > 0) {
        const { data, error } = await supabase
          .from('educational_data')
          .select('id, subject_id, section_id, file_name, content')
          .in('id', missingRecordIds);

        if (!error && data) {
          // recordIds come from the exact lesson index entry. Trust this relation even
          // when file_name uses a legacy/path naming convention without ch/les tokens.
          rawSectionRows = [...rawSectionRows, ...data].filter((row) => {
            if (normalizeSectionId(row.section_id) === 'lessons') return true;
            const matches = contentBelongsToLesson(row.content, context);
            if (!matches) console.warn('[getLessonContentBundle] Ignoring non-video Supabase content with mismatched lesson_id:', row.id);
            return matches;
          });
        }
      }
    } catch (err) {
      console.warn('[getLessonContentBundle] Fetch error:', err);
    }
  }

  // 2. Separate into independent parsers
  let lessonsJson: any = null;
  let curriculumJson: any = null;
  let mcqJson: any = null;
  let tfJson: any = null;
  let phJson: any = null;

  rawSectionRows.forEach((row) => {
    const sec = normalizeSectionId(row.section_id);
    if (!sec) return;
    if (sec === 'lessons') lessonsJson = row.content;
    if (sec === 'curriculum') curriculumJson = row.content;
    if (sec === 'mcq') mcqJson = row.content;
    if (sec === 'true_false') tfJson = row.content;
    if (sec === 'ph') phJson = row.content;
  });

  // 3. Build teacher stories strictly for this lesson
  let teacherStories: TeacherStory[] = [];
  if (lessonsJson) {
    teacherStories = buildTeacherStoriesFromLessonJson(lessonsJson, context, 'المادة', curriculumJson);
  }

  // 4. Construct EducationalLesson object
  let mainLesson: EducationalLesson;

  if (lessonsJson && teacherStories.length > 0) {
    const firstStory = teacherStories[0];
    const rawLessonObj = lessonsJson.lessons?.[0] || lessonsJson;

    mainLesson = {
      id: context.lessonId,
      title: context.title || firstStory.title,
      subtitle: `الفصل ${context.chapterNumber} - ${context.subjectId}`,
      category: context.subjectId,
      teacherName: firstStory.teacherName,
      teacherAvatar: firstStory.avatar,
      teacherRole: firstStory.channelName || firstStory.teacherName,
      youtubeId: firstStory.youtubeId || '',
      duration: firstStory.duration || '20:00',
      currentTime: '00:00',
      progressPercentage: 0,
      description:
        firstStory.textNotes ||
        rawLessonObj.description ||
        `شرح ${firstStory.teacherName} لمفردات الدرس المنهجي.`,
      viewsCount: '18.5K',
      likesCount: 1420,
      isLiked: false,
      isBookmarked: false,
      attachments: {
        aids: {
          id: `aid-${context.lessonKey}`,
          title: 'ملف المعينات والملخصات المنهجية',
          type: 'pdf',
          size: '2.8 MB',
          downloadUrl: '#',
          description: 'ملخص شامل ومخططات الدرس.',
        },
        psh: {
          id: `psh-${context.lessonKey}`,
          title: 'حزمة الاختبارات والتمارين (PSH)',
          type: 'psh',
          size: '4.5 MB',
          downloadUrl: '#',
          description: 'نماذج تدريبية تطبيقية.',
        },
      },
      comments: [],
      teacherStories,
    };
  } else {
    // Empty state for lessons without video / unavailable sections (e.g. Mathematics or missing lesson files)
    const emptyNotice = `لا يوجد ملف دروس متاح للمادة (${context.subjectId})، الفصل [${context.chapterNumber}]، الدرس [${context.lessonNumber}].`;
    mainLesson = {
      id: context.lessonId,
      title: context.title || `الدرس ${context.lessonNumber}`,
      subtitle: `الفصل ${context.chapterNumber} - ${context.subjectId}`,
      category: context.subjectId,
      teacherName: '',
      teacherAvatar: '',
      teacherRole: '',
      youtubeId: '',
      duration: '00:00',
      currentTime: '00:00',
      progressPercentage: 0,
      description: emptyNotice,
      viewsCount: '0',
      likesCount: 0,
      isLiked: false,
      isBookmarked: false,
      attachments: {
        aids: {
          id: `aid-${context.lessonKey}`,
          title: 'الملخص المنهجي',
          type: 'pdf',
          size: '1.2 MB',
          downloadUrl: '#',
          description: 'الملخصات المتاحة للمنهج.',
        },
        psh: {
          id: `psh-${context.lessonKey}`,
          title: 'الواجبات اليومية',
          type: 'psh',
          size: '2.0 MB',
          downloadUrl: '#',
          description: 'الواجبات والتطبيقات.',
        },
      },
      comments: [],
      teacherStories: [],
    };
  }

  const loadedSecs: string[] = [];
  if (lessonsJson) loadedSecs.push('lessons');
  if (curriculumJson) loadedSecs.push('curriculum');
  if (mcqJson) loadedSecs.push('mcq');
  if (tfJson) loadedSecs.push('true_false');
  if (phJson) loadedSecs.push('ph');

  const bundle: LessonContentBundle = {
    cacheKey,
    subjectId: context.subjectId,
    chapterNumber: context.chapterNumber,
    lessonNumber: context.lessonNumber,
    lessonId: context.lessonId,
    lessonKey: context.lessonKey,
    loadedSections: loadedSecs,
    lesson: mainLesson,
    teacherStories,
    curriculumData: curriculumJson,
    mcqData: mcqJson,
    trueFalseData: tfJson,
    phData: phJson,
    dataSource,
  };

  lessonBundleCache.set(cacheKey, bundle);

  const lessonContentMs = Date.now() - startTime;
  console.debug('[content-timing] Lesson content bundle loaded:', {
    subjectId: context.subjectId,
    lessonKey: context.lessonKey,
    lessonContentMs,
    sectionsLoaded: loadedSecs,
    storiesCount: teacherStories.length,
  });

  return bundle;
}

/**
 * Legacy/compatibility adapters for SubjectChapters
 */
export async function getSubjectChapters(
  subjectKey: string,
  subjectName = 'المادة'
): Promise<ServiceResponse<SubjectChapter[]>> {
  const normKey = (subjectKey || '').toLowerCase().trim();
  const cacheKey = `chapters_${normKey}`;
  if (chaptersCache.has(cacheKey)) {
    return { data: chaptersCache.get(cacheKey)!, error: null, isFallback: false };
  }

  const subIndex = await getSubjectIndex(normKey, subjectName);

  const chapters: SubjectChapter[] = subIndex.chapters.map((ch) => {
    const lessons: SubjectChapterLesson[] = ch.lessons.map((l, lIdx) => ({
      id: l.lessonId,
      number: l.lessonNumber,
      title: l.title,
      duration: '20:00',
      status: l.lessonNumber === 1 && ch.chapterNumber === 1 ? 'in_progress' : 'available',
      progressPercentage: 0,
      lessonData: {
        id: l.lessonId,
        title: l.title,
        subtitle: `${subjectName} - الفصل ${ch.chapterNumber}`,
        category: subjectName,
        teacherName: '',
        teacherAvatar: '',
        teacherRole: '',
        youtubeId: '',
        duration: '20:00',
        currentTime: '00:00',
        progressPercentage: 0,
        description: `الدرس المنهجي رقم ${l.lessonNumber}`,
        viewsCount: '0',
        likesCount: 0,
        isLiked: false,
        isBookmarked: false,
        attachments: {
          aids: {
            id: `aid-${l.lessonKey}`,
            title: 'المعينات',
            type: 'pdf',
            size: '2MB',
            downloadUrl: '#',
            description: 'ملخص الدرس',
          },
          psh: {
            id: `psh-${l.lessonKey}`,
            title: 'الواجبات',
            type: 'psh',
            size: '3MB',
            downloadUrl: '#',
            description: 'تمارين',
          },
        },
        comments: [],
      },
    }));

    return {
      id: `ch-${normKey}-${ch.chapterNumber}`,
      number: ch.chapterNumber,
      title: ch.title,
      subtitle: `${subjectName} - السادس الإعدادي`,
      description: `الفصل الدراسي رقم ${ch.chapterNumber}`,
      lessonsCount: ch.lessons.length,
      completedLessonsCount: 0,
      lessons,
    };
  });

  chaptersCache.set(cacheKey, chapters);
  return { data: chapters, error: null, isFallback: false };
}

export async function getChapterLessons(
  subjectKey: string,
  chapterFolderName: string,
  chapterNumber = 1,
  subjectName = 'المادة'
): Promise<ServiceResponse<SubjectChapterLesson[]>> {
  const normKey = (subjectKey || '').toLowerCase().trim();
  const subIndex = await getSubjectIndex(normKey, subjectName);
  const targetChapter = subIndex.chapters.find((c) => c.chapterNumber === chapterNumber);

  if (!targetChapter) {
    return {
      data: [],
      error: `لم يتم العثور على الفصل رقم ${chapterNumber} للمادة ${subjectName}`,
      isFallback: true,
    };
  }

  const lessons: SubjectChapterLesson[] = targetChapter.lessons.map((l) => ({
    id: l.lessonId,
    number: l.lessonNumber,
    title: l.title,
    duration: '20:00',
    status: l.lessonNumber === 1 ? 'in_progress' : 'available',
    progressPercentage: 0,
    lessonData: {
      id: l.lessonId,
      title: l.title,
      subtitle: `${subjectName} - الفصل ${targetChapter.chapterNumber}`,
      category: subjectName,
      teacherName: '',
      teacherAvatar: '',
      teacherRole: '',
      youtubeId: '',
      duration: '20:00',
      currentTime: '00:00',
      progressPercentage: 0,
      description: `شرح ${l.title}`,
      viewsCount: '0',
      likesCount: 0,
      isLiked: false,
      isBookmarked: false,
      attachments: {
        aids: {
          id: `aid-${l.lessonKey}`,
          title: 'المعينات',
          type: 'pdf',
          size: '2MB',
          downloadUrl: '#',
          description: 'ملخص الدرس',
        },
        psh: {
          id: `psh-${l.lessonKey}`,
          title: 'الواجبات',
          type: 'psh',
          size: '3MB',
          downloadUrl: '#',
          description: 'تمارين',
        },
      },
      comments: [],
    },
  }));

  return { data: lessons, error: null, isFallback: false };
}

export async function getLessonDetails(
  contextOrSubjectKey: OpenLessonContext | string,
  chapterFolderName?: string,
  lessonFolderName?: string,
  subjectName = 'المادة',
  chapterNumber = 1,
  lessonNumber = 1
): Promise<ServiceResponse<EducationalLesson>> {
  let context: OpenLessonContext;

  if (typeof contextOrSubjectKey === 'object' && contextOrSubjectKey !== null) {
    context = contextOrSubjectKey as OpenLessonContext;
  } else {
    const rawKey = typeof contextOrSubjectKey === 'string' ? contextOrSubjectKey : '';
    const normKey = rawKey.toLowerCase().trim();
    const lessonKey = buildLessonKey(normKey, chapterNumber, lessonNumber);
    context = {
      subjectId: normKey,
      chapterNumber,
      lessonNumber,
      lessonId: `${normKey}-ch${chapterNumber}-les${lessonNumber}`,
      lessonKey,
      title: formatArabicLessonTitle(lessonFolderName || `الدرس ${lessonNumber}`),
    };
  }

  try {
    const bundle = await getLessonContentBundle(context);
    return { data: bundle.lesson, error: null, isFallback: false };
  } catch (err: any) {
    return { data: null, error: err?.message || 'تعذر تحميل الدرس', isFallback: true };
  }
}

export function createTeacherStoryFromLesson(lesson: EducationalLesson): TeacherStory | null {
  const validYtId = extractYoutubeId(lesson.youtubeId);
  if (!validYtId) return null;

  const ytThumb = `https://img.youtube.com/vi/${validYtId}/hqdefault.jpg`;
  return {
    id: `story-${lesson.id}`,
    teacherName: cleanTeacherName(lesson.teacherName) || 'مدرس المادة',
    channelName: cleanTeacherName(lesson.teacherRole) || cleanTeacherName(lesson.teacherName) || 'القناة التعليمية',
    avatar: lesson.teacherAvatar && !lesson.teacherAvatar.includes('unsplash.com/photo-1573496359142') ? lesson.teacherAvatar : ytThumb,
    subject: lesson.category || lesson.subtitle || 'المنهاج',
    title: lesson.title,
    hasUnseen: true,
    youtubeId: validYtId,
    videoUrl: `https://www.youtube.com/watch?v=${validYtId}`,
    duration: lesson.duration || '15:00',
    storyImage: ytThumb,
    textNotes: lesson.description || `شرح ${lesson.title}`,
    lessonData: lesson,
  };
}

export function clearLessonsCache(): void {
  subjectIndexCache.clear();
  lessonBundleCache.clear();
  chaptersCache.clear();
  chapterLessonsCache.clear();
  lessonJsonCache.clear();
}
