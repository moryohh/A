import { supabase } from '../lib/supabase';
import { buildLessonKey, fileNameMatchesLesson, getDbSubjectIds, getLessonContentBundle, normalizeSectionId } from './lessonsService';
import { MillionaireGameConfig, MillionaireQuestion, OpenLessonContext } from '../types';
import { TrueFalseGameConfig, TrueFalseQuestion, getTrueFalseGameForLesson } from '../data/mockTrueFalse';
import { GibhaSahGameConfig, GibhaSahQuestion, GibhaSahCard, getGibhaSahGameForLesson } from '../data/mockGibhaSah';
import { getMillionaireGameForLesson } from '../data/mockMillionaire';
import { extractChapterAndSegment } from './curriculumService';
import { fetchCloudflareExactSection } from './cloudflareContentService';

export interface LessonGamesBundle {
  mcqConfig: MillionaireGameConfig;
  trueFalseConfig: TrueFalseGameConfig;
  gibhaSahConfig: GibhaSahGameConfig;
  dailyExamAvailable: boolean;
  source: 'database' | 'fallback';
  loadedAt: number;
  dataSource?: 'cloudflare' | 'supabase' | 'fallback';
}

// In-memory cache for game bundles by key (subject_lessonId)
const gamesCache: Record<string, LessonGamesBundle> = {};

function getSubjectNormalizedKey(subjectId: string): string {
  const s = subjectId.toLowerCase().trim();
  if (s.includes('chem') || s.includes('كيمياء')) return 'chemistry';
  if (s.includes('bio') || s.includes('أحياء') || s.includes('احياء')) return 'biology';
  if (s.includes('phys') || s.includes('فيزياء')) return 'physics';
  if (s.includes('math') || s.includes('رياضيات')) return 'mathematics';
  if (s.includes('islam') || s.includes('اسلامية') || s.includes('إسلامية')) return 'islamic';
  if (s.includes('arab') || s.includes('عربي')) {
    if (s.includes('2') || s.includes('part2') || s.includes('ج2')) return 'arabic_part2';
    return 'arabic_part1';
  }
  return subjectId;
}

/**
 * Fetch one section only when the filename proves the exact chapter + lesson.
 * A broad chapter/lesson OR query is intentionally not used because it can
 * return an arbitrary neighboring file and silently generalize its questions.
 */
async function fetchExactSectionContent(
  sectionId: 'mcq' | 'true_false' | 'ph',
  dbSubjects: string[],
  chapterNumber: number | undefined,
  lessonNumber: number | undefined,
  lessonId: string
): Promise<any | null> {
  if (chapterNumber === undefined || lessonNumber === undefined) return null;

  const sectionAliases = sectionId === 'true_false'
    ? ['true_false', 'tf', 'صح_خطأ', 'صح_ام_خطا']
    : sectionId === 'ph'
      ? ['ph', 'فلاش_كاردز', 'بطاقات']
      : ['mcq', 'MCQ', 'mcqs', 'اختيارات', 'اختيار_من_متعدد'];
  const baseQuery = () =>
    supabase
      .from('educational_data')
      .select('id, file_name, subject_id, section_id, content')
      .in('subject_id', dbSubjects)
      .in('section_id', sectionAliases);

  // Cloudflare trial path. The helper only returns a record when its immutable
  // source ID, subject, section, chapter and lesson all match exactly.
  try {
    const cloudContent = await fetchCloudflareExactSection(
      dbSubjects,
      sectionAliases,
      chapterNumber,
      lessonNumber,
      () => true,
    );
    if (cloudContent) return cloudContent;
  } catch (error) {
    console.warn('[gamesService] Cloudflare exact lookup failed; using Supabase fallback:', error);
  }

  // Prefer the exact content-index relation; file names may use legacy conventions.
  try {
    const { data: indexedRows } = await supabase
      .from('educational_content_index')
      .select('record_id, subject_id, section_id, file_name, lesson_id, chapter_number, lesson_number, has_content')
      .in('subject_id', dbSubjects)
      .eq('chapter_number', chapterNumber)
      .eq('lesson_number', lessonNumber)
      .limit(100);
    const indexedRecordIds = (indexedRows || [])
      .filter((row) => row.record_id && row.has_content !== false && normalizeSectionId(row.section_id) === sectionId)
      .map((row) => row.record_id);
    if (indexedRecordIds.length > 0) {
      const { data: indexedContent } = await supabase
        .from('educational_data')
        .select('content')
        .in('id', indexedRecordIds)
        .limit(20);
      const indexedMatch = indexedContent?.find((row) => row.content);
      if (indexedMatch?.content) return indexedMatch.content;
    }
  } catch (error) {
    console.warn('[gamesService] Exact content-index lookup failed:', error);
  }

  // An exact lesson id is safer than a chapter-only search when the database has it.
  const cleanLessonId = lessonId.replace(/\.json$/i, '').trim();
  if (cleanLessonId.length > 3) {
    const { data: directRows } = await baseQuery()
      .ilike('file_name', `%${cleanLessonId}%`)
      .limit(20);
    const directMatch = directRows?.find(
      (row) => fileNameMatchesLesson(row.file_name, chapterNumber, lessonNumber) && row.content
    );
    if (directMatch) return directMatch.content;
  }

  const { data: chapterRows } = await baseQuery()
    .or(
      `file_name.ilike.%ch${chapterNumber}%,file_name.ilike.%chapter${chapterNumber}%,file_name.ilike.%فصل%${chapterNumber}%`
    )
    .limit(100);

  const exactMatch = chapterRows?.find(
    (row) => fileNameMatchesLesson(row.file_name, chapterNumber, lessonNumber) && row.content
  );
  return exactMatch?.content || null;
}

/**
 * Finds the nearest usable section file in the same subject and chapter.
 * The content index carries the lesson numbers even when file_name uses a legacy format.
 */
async function fetchNearestSectionContent(
  sectionId: 'mcq' | 'ph',
  dbSubjects: string[],
  chapterNumber: number | undefined,
  lessonNumber: number | undefined,
  isUsable: (content: any) => boolean
): Promise<{ content: any; lessonNumber: number } | null> {
  if (chapterNumber === undefined || lessonNumber === undefined) return null;

  const sectionAliases = sectionId === 'ph'
    ? ['ph', 'فلاش_كاردز', 'بطاقات']
    : [sectionId];

  try {
    const { data: indexRows, error: indexError } = await supabase
      .from('educational_content_index')
      .select('record_id, subject_id, section_id, file_name, lesson_id, chapter_number, lesson_number, has_content')
      .in('subject_id', dbSubjects)
      .in('section_id', sectionAliases)
      .eq('chapter_number', chapterNumber)
      .order('lesson_number', { ascending: true })
      .limit(300);

    if (!indexError && indexRows?.length) {
      const candidates = indexRows
        .filter((row) => row.record_id && row.has_content !== false && Number(row.lesson_number) !== lessonNumber)
        .sort((a, b) => {
          const aLesson = Number(a.lesson_number);
          const bLesson = Number(b.lesson_number);
          const distance = Math.abs(aLesson - lessonNumber) - Math.abs(bLesson - lessonNumber);
          if (distance !== 0) return distance;
          // Prefer the previous lesson when two files are equally near.
          const aIsPrevious = aLesson < lessonNumber ? 0 : 1;
          const bIsPrevious = bLesson < lessonNumber ? 0 : 1;
          return aIsPrevious - bIsPrevious;
        });

      for (const candidate of candidates) {
        const { data: rows, error } = await supabase
          .from('educational_data')
          .select('content')
          .eq('id', candidate.record_id)
          .limit(1);
        if (!error && rows?.[0]?.content && isUsable(rows[0].content)) {
          return { content: rows[0].content, lessonNumber: Number(candidate.lesson_number) };
        }
      }
    }
  } catch (error) {
    console.warn('[gamesService] Nearest section lookup failed:', error);
  }

  return null;
}

async function getNearestMcqConfig(
  context: OpenLessonContext,
  currentConfig: MillionaireGameConfig
): Promise<MillionaireGameConfig> {
  if (currentConfig.questions.length > 0) return currentConfig;

  const dbSubjects = getDbSubjectIds(getSubjectNormalizedKey(context.subjectId));
  const nearest = await fetchNearestSectionContent(
    'mcq',
    dbSubjects,
    context.chapterNumber,
    context.lessonNumber,
    (content) => parseMcqToMillionaire(content, context.lessonId, context.title || context.lessonTitle || `الدرس ${context.lessonNumber}`, context.subjectId).questions.length > 0
  );
  if (!nearest) return currentConfig;

  const nearestConfig = parseMcqToMillionaire(
    nearest.content,
    context.lessonId,
    context.title || context.lessonTitle || `الدرس ${context.lessonNumber}`,
    context.subjectId
  );
  return {
    ...nearestConfig,
    lessonId: context.lessonId,
    title: `من سيربح المليون - ${context.title || context.lessonTitle || `الدرس ${context.lessonNumber}`}`,
    subtitle: `أسئلة ملف قريب داخل الفصل نفسه (الدرس ${nearest.lessonNumber})`,
  };
}

async function getNearestLessonGibhaSahConfig(
  context: OpenLessonContext,
  currentConfig: GibhaSahGameConfig
): Promise<GibhaSahGameConfig> {
  if (currentConfig.questions.length > 0) return currentConfig;

  const dbSubjects = getDbSubjectIds(getSubjectNormalizedKey(context.subjectId));
  const nearest = await fetchNearestSectionContent(
    'ph',
    dbSubjects,
    context.chapterNumber,
    context.lessonNumber,
    (content) => parsePhToGibhaSah(content, context.lessonId, context.title || context.lessonTitle || `الدرس ${context.lessonNumber}`, context.subjectId).questions.length > 0
  );
  if (!nearest) return currentConfig;

  const nearestConfig = parsePhToGibhaSah(
    nearest.content,
    context.lessonId,
    context.title || context.lessonTitle || `الدرس ${context.lessonNumber}`,
    context.subjectId
  );
  return {
    ...nearestConfig,
    lessonId: context.lessonId,
    title: `لعبة جِيبْهَا صَح 🎯 - ${context.title || context.lessonTitle || `الدرس ${context.lessonNumber}`}`,
    subtitle: `أسئلة ملف PH قريب داخل الفصل نفسه (الدرس ${nearest.lessonNumber})`,
  };
}

/**
 * Parses raw Supabase MCQ JSON into MillionaireGameConfig
 */
function parseMcqToMillionaire(
  rawContent: any,
  lessonId: string,
  lessonTitle: string,
  category: string
): MillionaireGameConfig {
  const items: any[] = Array.isArray(rawContent?.pages)
    ? rawContent.pages.flatMap((p: any) => p.items || p.questions || p.rounds || [])
    : Array.isArray(rawContent?.items)
      ? rawContent.items
      : Array.isArray(rawContent?.questions)
        ? rawContent.questions
        : Array.isArray(rawContent?.data)
          ? rawContent.data
          : [];
  const validQuestions = Array.from(
    new Map(
      items
        .filter((it: any) => it && it.question && Array.isArray(it.options) && it.options.length >= 2)
        .map((item: any) => [String(item.question).trim(), item])
    ).values()
  );

  if (validQuestions.length < 5) {
    return {
      gameId: `game-mcq-${lessonId}`,
      gameType: 'millionaire',
      lessonId,
      subject: category,
      grade: 'السادس الإعدادي',
      title: `من سيربح المليون - ${lessonTitle}`,
      subtitle: 'لا تتوفر أسئلة MCQ كافية لهذا الدرس حاليًا',
      questions: [],
    };
  }

  const ladderPoints = [
    5000, 10000, 25000, 50000, 100000, 150000, 250000, 400000, 500000, 650000, 800000,
  ];
  const targetQuestionCount = 11;
  const shuffle = <T,>(values: T[]): T[] => {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const normalizeQuestion = (item: any, idx: number): MillionaireQuestion => {
    const rawOpts = item.options.map((opt: string) => opt.replace(/^[A-D]\)\s*/i, '').trim());
    while (rawOpts.length < 4) rawOpts.push(`خيار إضافي ${rawOpts.length + 1}`);
    const cleanOpts = rawOpts.slice(0, 4) as [string, string, string, string];
    let correctIdx = 0;
    if (item.correct_option) {
      const optLetter = String(item.correct_option).toUpperCase().trim();
      if (optLetter === 'A' || optLetter === 'أ') correctIdx = 0;
      else if (optLetter === 'B' || optLetter === 'ب') correctIdx = 1;
      else if (optLetter === 'C' || optLetter === 'ج') correctIdx = 2;
      else if (optLetter === 'D' || optLetter === 'د') correctIdx = 3;
    } else if (item.answer) {
      const cleanAns = String(item.answer).trim();
      const matchIdx = cleanOpts.findIndex((o) => o === cleanAns || cleanAns.includes(o) || o.includes(cleanAns));
      if (matchIdx !== -1) correctIdx = matchIdx;
    }
    return {
      id: String(item.item_id || `mcq-${idx + 1}`),
      difficulty: idx < 4 ? 'easy' : idx < 9 ? 'medium' : 'hard',
      points: ladderPoints[Math.min(idx, ladderPoints.length - 1)] || 1000000,
      question: item.question,
      options: cleanOpts,
      correctAnswer: correctIdx,
      explanation: typeof item.answer === 'string' ? item.answer : `الإجابة النموذجية هي: ${cleanOpts[correctIdx]}`,
      hint: 'فكر في محور الدرس المنهجي المرتبط بالسؤال',
    };
  };

  // Keep every valid question from the exact lesson file as the source pool.
  const questionPool = validQuestions.map(normalizeQuestion);
  const selectedPool = questionPool.length > targetQuestionCount
    ? shuffle(questionPool).slice(0, targetQuestionCount)
    : Array.from({ length: targetQuestionCount }, (_, idx) => questionPool[idx % questionPool.length]);
  const parsedQuestions = selectedPool.map((question, idx) => ({
    ...question,
    id: `${question.id}-round-${idx + 1}`,
    points: ladderPoints[idx] || 1000000,
    difficulty: idx < 4 ? 'easy' as const : idx < 9 ? 'medium' as const : 'hard' as const,
  }));

  return {
    gameId: `game-mcq-${lessonId}`,
    gameType: 'millionaire',
    lessonId,
    subject: rawContent.lesson_info?.subject || category,
    grade: rawContent.lesson_info?.grade || 'السادس الإعدادي المنهج الوزاري',
    title: `من سيربح المليون - ${lessonTitle}`,
    subtitle: rawContent.lesson_info?.grade || 'أسئلة من ملف الدرس المستهدف فقط',
    questions: parsedQuestions,
    questionPool,
  };
}

/**
 * Parses raw Supabase True/False JSON into TrueFalseGameConfig
 */
function parseTrueFalseConfig(
  rawContent: any,
  lessonId: string,
  lessonTitle: string,
  category: string
): TrueFalseGameConfig {
  const items: any[] = Array.isArray(rawContent?.pages)
    ? rawContent.pages.flatMap((p: any) => p.items || p.questions || [])
    : Array.isArray(rawContent?.items)
      ? rawContent.items
      : Array.isArray(rawContent?.questions)
        ? rawContent.questions
        : [];
  const validQuestions = Array.from(
    new Map(
      items
        .filter((it: any) => it && it.question && (it.type === 'question' || it.question_type || it.correct_option !== undefined || it.answer !== undefined))
        .map((item: any) => [String(item.question).trim(), item])
    ).values()
  );

  if (validQuestions.length < 4) {
    return {
      lessonId,
      subject: category,
      title: `تحدي صح أم خطأ - ${lessonTitle}`,
      subtitle: 'لا تتوفر أسئلة صح وخطأ كافية لهذا الدرس حاليًا',
      totalQuestions: 0,
      totalPoints: 0,
      questions: [],
    };
  }

  const targetQuestionCount = 12;
  const shuffle = <T,>(values: T[]): T[] => {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  const questionPool: TrueFalseQuestion[] = validQuestions.map((item, idx) => {
    let isCorrectVal = true;
    if (item.correct_option !== undefined) {
      const opt = String(item.correct_option).toLowerCase().trim();
      isCorrectVal = opt === 'true' || opt === 'صح' || opt === 'صحيح' || opt === 'نعم';
    } else if (item.answer) {
      const ansStr = String(item.answer).trim();
      if (ansStr.startsWith('خطأ') || ansStr.startsWith('كلا') || ansStr.startsWith('لا') || ansStr.includes('غير صحيح')) isCorrectVal = false;
    }
    return {
      id: String(item.item_id || `tf-pool-${idx + 1}`),
      question: item.question,
      isCorrect: isCorrectVal,
      difficulty: idx < 4 ? 'سهل' : idx < 8 ? 'متوسط' : 'متقدم',
      points: 100,
      explanation: typeof item.answer === 'string' ? item.answer : (isCorrectVal ? 'العبارة صحيحة منهجياً وفق الكتاب الوزاري.' : 'العبارة خاطئة منهجياً.'),
      category: rawContent.lesson_info?.subject || category,
    };
  });
  const selectedPool = questionPool.length > targetQuestionCount
    ? shuffle(questionPool).slice(0, targetQuestionCount)
    : Array.from({ length: targetQuestionCount }, (_, idx) => questionPool[idx % questionPool.length]);
  const parsedQuestions: TrueFalseQuestion[] = selectedPool.map((question, idx) => ({
    ...question,
    id: `${question.id}-round-${idx + 1}`,
    difficulty: idx < 4 ? 'سهل' : idx < 8 ? 'متوسط' : 'متقدم',
  }));

  return {
    lessonId,
    subject: rawContent.lesson_info?.subject || category,
    title: `تحدي صح أم خطأ - ${lessonTitle}`,
    subtitle: 'أسئلة عشوائية من بنك الدرس المستهدف',
    totalQuestions: parsedQuestions.length,
    totalPoints: parsedQuestions.length * 100,
    questions: parsedQuestions,
    questionPool,
  };
}

/**
 * Parses raw Supabase PH JSON into GibhaSahGameConfig (12 cards)
 */
function parsePhToGibhaSah(
  rawContent: any,
  lessonId: string,
  lessonTitle: string,
  category: string
): GibhaSahGameConfig {
  let rawRounds: any[] = [];
  if (Array.isArray(rawContent?.pages)) {
    for (const page of rawContent.pages) {
      if (Array.isArray(page.rounds)) {
        rawRounds.push(...page.rounds);
      } else if (Array.isArray(page.items)) {
        rawRounds.push(...page.items);
      } else if (Array.isArray(page.questions)) {
        rawRounds.push(...page.questions);
      }
    }
  } else if (Array.isArray(rawContent?.rounds)) {
    rawRounds = rawContent.rounds;
  } else if (Array.isArray(rawContent?.items)) {
    rawRounds = rawContent.items;
  } else if (Array.isArray(rawContent?.questions)) {
    rawRounds = rawContent.questions;
  }


  const getRoundAnswer = (round: any): string => String(round?.correct_answer ?? round?.answer ?? '').trim();
  const validRounds = Array.from(
    new Map(
      rawRounds
        .filter((round: any) => round && typeof round.question === 'string' && round.question.trim() && getRoundAnswer(round))
        .map((round: any) => [round.question.trim(), round])
    ).values()
  );
  // Fewer than five valid questions means this lesson cannot form a valid game.
  if (validRounds.length < 5) {
    return {
      lessonId,
      subject: category,
      title: `لعبة جِيبْهَا صَح 🎯 - ${lessonTitle}`,
      subtitle: 'لا تتوفر بطاقات PH كافية لهذا الدرس حاليًا',
      mode: 'cards_10',
      cards: [],
      questions: [],
    };
  }

  const cardsCount = 10;
  const shuffle = <T,>(values: T[]): T[] => {
    const result = [...values];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };
  const questionPool: GibhaSahQuestion[] = validRounds.map((round, idx) => ({
    id: `gs-pool-${idx + 1}`,
    questionNumber: idx + 1,
    question: round.question,
    correctCardNumber: 0,
    explanation: '',
    points: 100,
    answerLabel: getRoundAnswer(round),
  }));
  const selectedPool = questionPool.length > cardsCount
    ? shuffle(questionPool).slice(0, cardsCount)
    : Array.from({ length: cardsCount }, (_, idx) => questionPool[idx % questionPool.length]);
  const cards: GibhaSahCard[] = selectedPool.map((question, idx) => ({
    id: idx + 1,
    number: idx + 1,
    label: question.answerLabel || '',
    sublabel: `المصطلح رقم ${idx + 1}`,
    badge: 'بطاقة علمية',
  }));

  const questions: GibhaSahQuestion[] = selectedPool.map((question, idx) => ({
    ...question,
    id: `gs-round-${idx + 1}`,
    questionNumber: idx + 1,
    correctCardNumber: idx + 1,
    explanation: `الإجابة الصحيحة هي بطاقة (${idx + 1}): ${cards[idx]?.label || question.answerLabel || ''}`,
  }));

  return {
    lessonId,
    subject: rawContent.lesson_info?.subject || category,
    title: `لعبة جِيبْهَا صَح 🎯 - ${lessonTitle}`,
    subtitle: 'شبكة 10 بطاقات من بنك الدرس المستهدف فقط',
    mode: 'cards_10',
    cards,
    questions,
    questionPool,
  };
}

/**
 * Main On-Demand Loader for Interactive Games
 * ONLY downloads data when the user opens the games modal.
 * Accepts either OpenLessonContext or legacy parameters.
 */
export async function fetchLessonGamesData(
  contextOrSubjectId: OpenLessonContext | string,
  lessonId?: string,
  lessonTitle: string = 'الدرس التعليمي',
  category: string = 'المادة التعليمية',
  chapterNumber?: number,
  lessonNumber?: number
): Promise<LessonGamesBundle> {
  let subjectId: string;
  let actualLessonId: string;
  let actualLessonTitle: string;
  let actualCategory: string;
  let actualChapterNumber: number | undefined;
  let actualLessonNumber: number | undefined;

  if (typeof contextOrSubjectId === 'object' && contextOrSubjectId !== null) {
    const ctx = contextOrSubjectId as OpenLessonContext;
    subjectId = ctx.subjectId;
    actualLessonId = ctx.lessonId;
    actualLessonTitle = ctx.title || ctx.lessonTitle || `الدرس ${ctx.lessonNumber}`;
    actualCategory = ctx.subjectId;
    actualChapterNumber = ctx.chapterNumber;
    actualLessonNumber = ctx.lessonNumber;

    // Check if we can get data directly from bundle
    try {
      const bundle = await getLessonContentBundle(ctx);
      if (bundle && (bundle.curriculumData || bundle.mcqData || bundle.trueFalseData || bundle.phData)) {
        const exactDbSubjects = getDbSubjectIds(getSubjectNormalizedKey(ctx.subjectId));
        const [exactMcqData, exactTrueFalseData, exactPhData] = await Promise.all([
          bundle.mcqData || fetchExactSectionContent('mcq', exactDbSubjects, ctx.chapterNumber, ctx.lessonNumber, ctx.lessonId),
          bundle.trueFalseData || fetchExactSectionContent('true_false', exactDbSubjects, ctx.chapterNumber, ctx.lessonNumber, ctx.lessonId),
          bundle.phData || fetchExactSectionContent('ph', exactDbSubjects, ctx.chapterNumber, ctx.lessonNumber, ctx.lessonId),
        ]);

        const currentMcqConfig = exactMcqData
          ? parseMcqToMillionaire(exactMcqData, actualLessonId, actualLessonTitle, actualCategory)
          : getMillionaireGameForLesson(actualLessonId, actualLessonTitle, actualCategory);
        // Never substitute a neighbouring lesson's questions. If the exact
        // R2 record is absent, fetchExactSectionContent already falls back to
        // the exact Supabase record; otherwise leave this game's questions
        // empty rather than mixing lessons.
        const mcqConfig = currentMcqConfig;

        const trueFalseConfig = exactTrueFalseData
          ? parseTrueFalseConfig(exactTrueFalseData, actualLessonId, actualLessonTitle, actualCategory)
          : getTrueFalseGameForLesson(actualLessonId, actualLessonTitle, actualCategory);

        const currentGibhaSahConfig = exactPhData
          ? parsePhToGibhaSah(exactPhData, actualLessonId, actualLessonTitle, actualCategory)
          : getGibhaSahGameForLesson(actualLessonId, actualLessonTitle, actualCategory);
        const gibhaSahConfig = currentGibhaSahConfig;

        return {
          mcqConfig,
          trueFalseConfig,
          gibhaSahConfig,
          dailyExamAvailable: Boolean(bundle.curriculumData?.pages?.length),
          source: 'database',
          dataSource: bundle.dataSource || 'supabase',
          loadedAt: Date.now(),
        };
      }
    } catch (e) {
      // fallback to standard querying
    }
  } else {
    subjectId = String(contextOrSubjectId);
    actualLessonId = lessonId || 'les-1';
    actualLessonTitle = lessonTitle;
    actualCategory = category;
    actualChapterNumber = chapterNumber;
    actualLessonNumber = lessonNumber;
  }

  const normKey = getSubjectNormalizedKey(subjectId || actualCategory);
  const { chapter: extractedCh, segment: extractedSeg } = extractChapterAndSegment(actualLessonId);
  const targetChapter = actualChapterNumber !== undefined && actualChapterNumber > 0 ? actualChapterNumber : extractedCh;
  const targetSegment = actualLessonNumber !== undefined && actualLessonNumber > 0 ? actualLessonNumber : extractedSeg;

  const cacheKey = `${normKey}_ch${targetChapter || 'all'}_les${targetSegment || 'all'}_${actualLessonId}`;

  // Return cached result if already fetched
  if (gamesCache[cacheKey]) {
    return gamesCache[cacheKey];
  }

  const dbSubjects = getDbSubjectIds(normKey);

  try {
    // Concurrently fetch MCQ, True/False, and PH from Supabase educational_data
    const [mcqRes, tfRes, phRes] = await Promise.all([
      // 1. Fetch MCQ from the exact lesson file only.
      fetchExactSectionContent('mcq', dbSubjects, targetChapter, targetSegment, actualLessonId),

      // 2. Fetch True/False from the exact lesson file only.
      fetchExactSectionContent('true_false', dbSubjects, targetChapter, targetSegment, actualLessonId),

      // 3. Fetch PH/Gibha Sah from the exact lesson file only.
      fetchExactSectionContent('ph', dbSubjects, targetChapter, targetSegment, actualLessonId),
    ]);

    // Parse configs
    const currentMcqConfig = mcqRes
      ? parseMcqToMillionaire(mcqRes, actualLessonId, actualLessonTitle, actualCategory)
      : getMillionaireGameForLesson(actualLessonId, actualLessonTitle, actualCategory);

    const trueFalseConfig = tfRes
      ? parseTrueFalseConfig(tfRes, actualLessonId, actualLessonTitle, actualCategory)
      : getTrueFalseGameForLesson(actualLessonId, actualLessonTitle, actualCategory);

    const currentGibhaSahConfig = phRes
      ? parsePhToGibhaSah(phRes, actualLessonId, actualLessonTitle, actualCategory)
      : getGibhaSahGameForLesson(actualLessonId, actualLessonTitle, actualCategory);
    const standardContext: OpenLessonContext | null =
      targetChapter !== undefined && targetSegment !== undefined
        ? {
            subjectId,
            chapterNumber: targetChapter,
            lessonNumber: targetSegment,
            lessonId: actualLessonId,
            lessonKey: buildLessonKey(subjectId, targetChapter, targetSegment),
            title: actualLessonTitle,
            lessonTitle: actualLessonTitle,
          }
        : null;
    // Exact section lookup already tries Cloudflare then the exact Supabase
    // record. Do not use a nearest lesson as a substitute for missing data.
    const mcqConfig = currentMcqConfig;
    const gibhaSahConfig = currentGibhaSahConfig;

    const bundle: LessonGamesBundle = {
      mcqConfig,
      trueFalseConfig,
      gibhaSahConfig,
      dailyExamAvailable: false,
      source: mcqRes || tfRes || phRes ? 'database' : 'fallback',
      dataSource: mcqRes || tfRes || phRes ? 'cloudflare' : 'fallback',
      loadedAt: Date.now(),
    };

    gamesCache[cacheKey] = bundle;
    return bundle;
  } catch (err) {
    console.error('Error fetching games bundle on-demand:', err);
    const fallbackBundle: LessonGamesBundle = {
      mcqConfig: getMillionaireGameForLesson(actualLessonId, actualLessonTitle, actualCategory),
      trueFalseConfig: getTrueFalseGameForLesson(actualLessonId, actualLessonTitle, actualCategory),
      gibhaSahConfig: getGibhaSahGameForLesson(actualLessonId, actualLessonTitle, actualCategory),
      dailyExamAvailable: false,
      source: 'fallback',
      dataSource: 'fallback',
      loadedAt: Date.now(),
    };
    gamesCache[cacheKey] = fallbackBundle;
    return fallbackBundle;
  }
}
