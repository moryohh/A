import { supabase } from '../lib/supabase';
import { buildLessonKey, getDbSubjectIds, getLessonContentBundle, normalizeSectionId } from './lessonsService';
import { MillionaireGameConfig, MillionaireQuestion, OpenLessonContext } from '../types';
import { TrueFalseGameConfig, TrueFalseQuestion } from '../data/mockTrueFalse';
import { GibhaSahGameConfig, GibhaSahQuestion, GibhaSahCard } from '../data/mockGibhaSah';
import { extractChapterAndSegment } from './curriculumService';
import { fetchCloudflareEducationalRecord } from './cloudflareContentService';

export interface LessonGamesBundle {
  mcqConfig: MillionaireGameConfig;
  trueFalseConfig: TrueFalseGameConfig;
  gibhaSahConfig: GibhaSahGameConfig;
  flashCards: FlashCard[];
  dailyExamAvailable: boolean;
  source: 'database' | 'fallback';
  loadedAt: number;
  dataSource?: 'cloudflare' | 'supabase' | 'fallback';
}

export interface FlashCard {
  id: string;
  question: string;
  answer: string;
  pageId: string;
  itemId: number;
}

function parseCurriculumToFlashCards(rawContent: any, lessonId: string): FlashCard[] {
  const sourceLessonId = String(rawContent?.lesson_info?.lesson_id || '').trim();
  if (!sourceLessonId || sourceLessonId !== String(lessonId).trim()) return [];
  const cards: FlashCard[] = [];
  for (const page of Array.isArray(rawContent?.pages) ? rawContent.pages : []) {
    const pageId = String(page?.page_id || '').trim();
    if (!pageId || !Array.isArray(page?.items)) continue;
    for (const item of page.items) {
      const itemId = Number(item?.item_id);
      if (!Number.isFinite(itemId)) continue;
      if (item?.type === 'question' && String(item.question || '').trim() && String(item.answer || '').trim()) {
        cards.push({ id: `${pageId}-${itemId}`, question: String(item.question).trim(), answer: String(item.answer).trim(), pageId, itemId });
      } else if (item?.type === 'paragraph' && String(item.content || '').trim()) {
        cards.push({ id: `${pageId}-${itemId}`, question: 'ما الفكرة أو المعلومات الأساسية التي يوضحها هذا الجزء؟', answer: String(item.content).trim(), pageId, itemId });
      }
    }
  }
  return Array.from(new Map(cards.map((card) => [card.id, card])).values());
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
  // The Supabase index is authoritative. Resolve the exact record_id first;
  // neither filename parsing nor a neighboring lesson may select content.
  const { data: indexedRows, error: indexError } = await supabase
    .from('educational_content_index')
    .select('record_id, subject_id, section_id, has_content')
    .in('subject_id', dbSubjects)
    .in('section_id', sectionAliases)
    .eq('chapter_number', chapterNumber)
    .eq('lesson_number', lessonNumber)
    .limit(50);
  if (indexError) throw indexError;

  const recordIds = Array.from(new Set((indexedRows || [])
    .filter((row) => row.record_id && row.has_content !== false && normalizeSectionId(row.section_id) === sectionId)
    .map((row) => String(row.record_id))));
  if (recordIds.length === 0) return null;

  // R2 is attempted by the immutable record_id from the Supabase index.
  for (const recordId of recordIds) {
    try {
      const cloudContent = await fetchCloudflareEducationalRecord(recordId);
      if (cloudContent) return cloudContent;
    } catch (_) {
      // Exact Supabase record below is the only permitted fallback.
    }
  }

  const { data: exactRows, error: contentError } = await supabase
    .from('educational_data')
    .select('content')
    .in('id', recordIds)
    .limit(recordIds.length);
  if (contentError) throw contentError;
  return exactRows?.find((row) => row.content)?.content || null;
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

        const currentMcqConfig = parseMcqToMillionaire(exactMcqData, actualLessonId, actualLessonTitle, actualCategory);
        // Never substitute a neighbouring lesson's questions. If the exact
        // R2 record is absent, fetchExactSectionContent already falls back to
        // the exact Supabase record; otherwise leave this game's questions
        // empty rather than mixing lessons.
        const mcqConfig = currentMcqConfig;

        const trueFalseConfig = parseTrueFalseConfig(exactTrueFalseData, actualLessonId, actualLessonTitle, actualCategory);

        const currentGibhaSahConfig = parsePhToGibhaSah(exactPhData, actualLessonId, actualLessonTitle, actualCategory);
        const gibhaSahConfig = currentGibhaSahConfig;

        return {
          mcqConfig,
          trueFalseConfig,
          gibhaSahConfig,
          flashCards: parseCurriculumToFlashCards(bundle.curriculumData, actualLessonId),
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
    const currentMcqConfig = parseMcqToMillionaire(mcqRes, actualLessonId, actualLessonTitle, actualCategory);

    const trueFalseConfig = parseTrueFalseConfig(tfRes, actualLessonId, actualLessonTitle, actualCategory);

    const currentGibhaSahConfig = parsePhToGibhaSah(phRes, actualLessonId, actualLessonTitle, actualCategory);
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
      flashCards: [],
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
      mcqConfig: parseMcqToMillionaire(null, actualLessonId, actualLessonTitle, actualCategory),
      trueFalseConfig: parseTrueFalseConfig(null, actualLessonId, actualLessonTitle, actualCategory),
      gibhaSahConfig: parsePhToGibhaSah(null, actualLessonId, actualLessonTitle, actualCategory),
      flashCards: [],
      dailyExamAvailable: false,
      source: 'fallback',
      dataSource: 'fallback',
      loadedAt: Date.now(),
    };
    gamesCache[cacheKey] = fallbackBundle;
    return fallbackBundle;
  }
}

/** Loads Millionaire team questions lazily from the selected lesson first,
 * then neighbouring lessons in the same chapter only. */
export async function fetchMillionaireTeamQuestions(context: OpenLessonContext, minimum = 20): Promise<MillionaireQuestion[]> {
  const collected: MillionaireQuestion[] = [];
  const seen = new Set<string>();
  const offsets = [0, -1, 1, -2, 2, -3, 3, -4, 4, -5, 5, -6, 6, -7, 7, -8, 8];
  for (const offset of offsets) {
    const lessonNumber = context.lessonNumber + offset;
    if (lessonNumber < 1) continue;
    const lessonContext: OpenLessonContext = {
      ...context,
      lessonNumber,
      lessonId: offset === 0 ? context.lessonId : buildLessonKey(context.subjectId, context.chapterNumber, lessonNumber),
      lessonKey: buildLessonKey(context.subjectId, context.chapterNumber, lessonNumber),
      title: offset === 0 ? (context.title || context.lessonTitle) : `الدرس ${lessonNumber}`,
      lessonTitle: offset === 0 ? (context.lessonTitle || context.title) : `الدرس ${lessonNumber}`,
    };
    const bundle = await fetchLessonGamesData(lessonContext);
    if (bundle.source !== 'database') continue;
    const questions = bundle.mcqConfig.questionPool || bundle.mcqConfig.questions || [];
    for (const question of questions) {
      const key = `${question.question.trim()}|${question.options.join('|')}`;
      if (!seen.has(key)) { seen.add(key); collected.push(question); }
      if (collected.length >= minimum) return collected;
    }
  }
  if (!collected.length) return [];
  return Array.from({ length: minimum }, (_, index) => collected[index % collected.length]);
}
