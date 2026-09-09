import { LessonBookletData, BookletItem } from '../data/lessonBooklet';
import { fetchLessonCurriculum } from './curriculumService';
import { OpenLessonContext } from '../types';

export interface ExamBranch {
  id: string;
  label: string; // e.g. "1", "2", "أ", "ب"
  prompt: string;
  modelAnswer: string;
  points: number;
}

export interface ExamMainQuestion {
  id: string;
  title: string; // "السؤال الأول (10 درجات)"
  instruction: string; // "عرّف ما يأتي بدقة منهجية:"
  branches: ExamBranch[];
}

export interface DailyExamConfig {
  id: string;
  lessonTitle: string;
  subject: string;
  grade: string;
  durationMinutes: number;
  totalPoints: number;
  question1: ExamMainQuestion;
  question2: ExamMainQuestion;
  source: 'curriculum_json' | 'fallback';
  isAvailable: boolean;
}

/**
 * Safely converts any JSON value (string, array of strings, object, number, null) into a clean string
 */
function toCleanString(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val.trim();
  if (Array.isArray(val)) {
    return val
      .map((item) => toCleanString(item))
      .filter((s) => s.length > 0)
      .join('\n• ');
  }
  if (typeof val === 'object') {
    try {
      if (val.text || val.content || val.answer || val.description) {
        return toCleanString(val.text || val.content || val.answer || val.description);
      }
      return JSON.stringify(val);
    } catch {
      return '';
    }
  }
  return String(val).trim();
}

function shuffleExamItems<T>(values: T[]): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function selectExamItems<T>(pool: T[], target: number): T[] {
  if (pool.length === 0) return [];
  const selected = pool.length > target
    ? shuffleExamItems(pool).slice(0, target)
    : Array.from({ length: target }, (_, idx) => pool[idx % pool.length]);
  return selected;
}

function uniqueExamItems<T extends { q: string }>(pool: T[]): T[] {
  return Array.from(new Map(pool.map((item) => [item.q.trim(), item])).values());
}

function createUnavailableDailyExam(lessonTitle: string, subject: string): DailyExamConfig {
  return {
    id: `exam-unavailable-${lessonTitle}`,
    lessonTitle,
    subject,
    grade: 'السادس الإعدادي - الفرع العلمي',
    durationMinutes: 0,
    totalPoints: 0,
    question1: {
      id: 'q1',
      title: 'الاختبار غير متوفر',
      instruction: 'لا توجد أسئلة اختبارية متاحة لهذا الدرس حاليًا.',
      branches: [],
    },
    question2: {
      id: 'q2',
      title: 'الاختبار غير متوفر',
      instruction: 'يرجى رفع ملف المنهج الخاص بهذا الدرس أولًا.',
      branches: [],
    },
    source: 'fallback',
    isAvailable: false,
  };
}

/**
 * Extracts 2 structured multi-part exam questions directly from Curriculum JSON
 */
export function extractDailyExamFromCurriculum(
  curriculum: LessonBookletData | null,
  lessonTitle: string,
  subject: string = 'المادة التعليمية'
): DailyExamConfig {
  if (!curriculum?.pages?.length) {
    return createUnavailableDailyExam(lessonTitle, subject);
  }

  const allItems: any[] = curriculum.pages.flatMap((p: any) => p.items || []);

  // Filter question items and lists
  const questionItems = allItems.filter(
    (item: any) => item && (item.type === 'question' || item.question || item.question_type)
  );

  const listItems = allItems.filter(
    (item: any) => item && item.type === 'list' && Array.isArray(item.items)
  );

  const comparisonItems = allItems.filter(
    (item: any) => item && item.type === 'comparison' && Array.isArray(item.items)
  );

  // Group into categories
  const definitions: { q: string; a: string }[] = [];
  const explanations: { q: string; a: string }[] = [];
  const blanks: { q: string; a: string }[] = [];
  const generalQuestions: { q: string; a: string }[] = [];
  const comprehensivePrompts: { type: 'count' | 'explain' | 'mention' | 'solve'; q: string; a: string }[] = [];

  for (const item of questionItems) {
    const qText = toCleanString(item.question || item.title || item.prompt);
    const aText = toCleanString(item.answer || item.content || item.model_answer);
    const qType = toCleanString(item.question_type).toLowerCase();

    if (!qText) continue;

    if (qType.includes('فراغ') || qText.includes('فراغ') || qText.includes('...')) {
      blanks.push({ q: qText, a: aText });
    } else if (qType.includes('تعريف') || qText.startsWith('عرّف') || qText.startsWith('عرف') || qText.includes('ما المقصود')) {
      definitions.push({ q: qText, a: aText });
    } else if (qType.includes('تعليل') || qText.startsWith('علل') || qText.startsWith('فسر') || qText.includes('لماذا') || qText.includes('ما سبب')) {
      explanations.push({ q: qText, a: aText });
    } else if (qText.startsWith('عدّد') || qText.startsWith('عدد') || qText.includes('ما هي أنواع') || qText.includes('ما هي أقسام')) {
      comprehensivePrompts.push({ type: 'count', q: qText, a: aText });
    } else if (qText.startsWith('اشرح') || qText.startsWith('وضّح') || qText.startsWith('وضح') || qText.includes('كيف تحدث')) {
      comprehensivePrompts.push({ type: 'explain', q: qText, a: aText });
    } else if (qText.startsWith('احسب') || qText.startsWith('حل') || qText.startsWith('جد') || qText.includes('مسألة')) {
      comprehensivePrompts.push({ type: 'solve', q: qText, a: aText });
    } else if (qText.startsWith('اذكر') || qText.includes('قارن')) {
      comprehensivePrompts.push({ type: 'mention', q: qText, a: aText });
    } else {
      generalQuestions.push({ q: qText, a: aText });
    }
  }

  // Check if lists or comparisons exist for comprehensive question 2
  for (const comp of comparisonItems) {
    const compNames = comp.items?.map((i: any) => toCleanString(i.name)).filter(Boolean) || [];
    const compPoints = comp.items?.map((i: any) => `${toCleanString(i.name)}: ${Array.isArray(i.points) ? i.points.join(' • ') : toCleanString(i.points)}`).join('\n') || '';
    if (compNames.length >= 2) {
      comprehensivePrompts.push({
        type: 'mention',
        q: `قارن بين كل من: (${compNames.join(' و ')}) من حيث الموقع، الوظيفة، والأهمية المنهجية.`,
        a: compPoints || 'المقارنة العلمية المعتمدة في مركز الفحص والتقويم.',
      });
    }
  }

  for (const lst of listItems) {
    const itemsText = lst.items?.map((i: any) => toCleanString(i)).filter(Boolean).join('\n• ') || '';
    const title = toCleanString(lst.title) || lessonTitle;
    comprehensivePrompts.push({
      type: 'count',
      q: `عدّد بالتفصيل أهم النقاط والشروط المقررة لـ: (${title}) مع الشرح.`,
      a: itemsText || 'النقاط المنهجية المقررة في الكتاب الوزاري.',
    });
  }

  // ==========================================
  // --- QUESTION 1: STRICTLY 2 SUB-ITEMS ---
  // (2 definitions OR 2 reasons OR 2 blanks OR 2 short questions)
  // ==========================================
  const q1Branches: ExamBranch[] = [];
  let q1Instruction = 'أجب عن الفرعين الآتيين بدقة علمية ومنهجية:';

  if (definitions.length >= 2) {
    q1Instruction = 'عرّف ما يأتي بدقة علمية ومنهجية (فرعان فقط):';
    const pair = selectExamItems(uniqueExamItems(definitions), 2);
    pair.forEach((item, idx) => {
      let promptClean = item.q
        .replace(/^(س\d*[:\-.]?\s*)/i, '')
        .replace(/^(عرّف|عرف|ما المقصود بـ|ما هو|ما هي)\s*/i, '')
        .trim();
      q1Branches.push({
        id: `q1-b${idx + 1}`,
        label: `${idx + 1}`,
        prompt: promptClean || item.q,
        modelAnswer: item.a || 'التعريف العلمي المعتمد وفق الكتاب الوزاري المقرّر.',
        points: 5,
      });
    });
  } else if (explanations.length >= 2) {
    q1Instruction = 'علل ما يأتي بدقة واختصار علمي (فرعان فقط):';
    const pair = selectExamItems(uniqueExamItems(explanations), 2);
    pair.forEach((item, idx) => {
      let promptClean = item.q.replace(/^(س\d*[:\-.]?\s*)/i, '').trim();
      q1Branches.push({
        id: `q1-b${idx + 1}`,
        label: `${idx + 1}`,
        prompt: promptClean || item.q,
        modelAnswer: item.a || 'التعليل العلمي الدقيق المعتمد في مركز الفحص والتقويم.',
        points: 5,
      });
    });
  } else if (blanks.length >= 2) {
    q1Instruction = 'امـلأ الفراغـين الآتيـين بما يناسبهما علمياً:';
    const pair = selectExamItems(uniqueExamItems(blanks), 2);
    pair.forEach((item, idx) => {
      q1Branches.push({
        id: `q1-b${idx + 1}`,
        label: `${idx + 1}`,
        prompt: item.q,
        modelAnswer: item.a || 'الكلمات والمصطلحات العلمية المكملة للفراغ بدقة.',
        points: 5,
      });
    });
  } else {
    // Mixed pool to guarantee exactly 2 items
    const pool = uniqueExamItems([...definitions, ...explanations, ...blanks, ...generalQuestions]);
    if (pool.length >= 1) {
      q1Instruction = 'أجب عن الفرعين الآتيين باختصار علمي ومنهجي:';
      const pair = selectExamItems(pool, 2);
      pair.forEach((item, idx) => {
        let promptClean = item.q.replace(/^(س\d*[:\-.]?\s*)/i, '').trim();
        q1Branches.push({
          id: `q1-b${idx + 1}`,
          label: `${idx + 1}`,
          prompt: promptClean || item.q,
          modelAnswer: item.a || 'الإجابة العلمية المعتمدة في المنهج الوزاري.',
          points: 5,
        });
      });
    } else {
      // Clean standard fallback with exactly 2 questions
      q1Instruction = 'عرّف ما يأتي بدقة منهجية:';
      q1Branches.push(
        {
          id: 'q1-b1',
          label: '1',
          prompt: `المفهوم العلمي والمصطلح الأساسي في (${lessonTitle})`,
          modelAnswer: `هو المصطلح العلمي الركيزي في درس ${lessonTitle} وله تطبيقات منهجية وزارية دقيقة.`,
          points: 5,
        },
        {
          id: 'q1-b2',
          label: '2',
          prompt: `التركيب الوظيفي والموقع الحيوي المرتبط بـ (${lessonTitle})`,
          modelAnswer: `يؤدي وظيفة حيوية أساسية تساهم في التوازن والخصائص المنهجية للدرس.`,
          points: 5,
        }
      );
    }
  }

  // ==========================================
  // --- QUESTION 2: STRICTLY 1 SINGLE COMPREHENSIVE QUESTION ---
  // (عدّد واحد OR اشرح واحد OR اذكر واحد OR حل مسألة واحدة)
  // ==========================================
  const q2Branches: ExamBranch[] = [];
  let q2Instruction = 'أجب عن السؤال التالي على السبورة الورقية بالتفصيل:';

  if (comprehensivePrompts.length > 0) {
    const comp = selectExamItems(uniqueExamItems(comprehensivePrompts), 1)[0];
    if (comp.type === 'count') {
      q2Instruction = 'عدّد واشرح بالتفصيل:';
    } else if (comp.type === 'explain') {
      q2Instruction = 'اشرح بالتفصيل والخطوات العلمية:';
    } else if (comp.type === 'solve') {
      q2Instruction = 'حل المسألة الآتية موضحاً القوانين والخطوات:';
    } else {
      q2Instruction = 'اذكر بالتفصيل المنهجي:';
    }

    q2Branches.push({
      id: 'q2-b1',
      label: 'أ',
      prompt: comp.q,
      modelAnswer: comp.a || 'الشرح والتفصيل النموذجي الكامل المعتمد في الامتحانات الوزارية.',
      points: 10,
    });
  } else {
    // Default single comprehensive question based on subject domain
    const isMathOrPhysics = subject.includes('رياضيات') || subject.includes('فيزياء') || subject.includes('كيمياء');
    if (isMathOrPhysics) {
      q2Instruction = 'حل المسألة / التطبيق الآتي بالتفصيل:';
      q2Branches.push({
        id: 'q2-b1',
        label: 'أ',
        prompt: `حل التطبيق النموذجي الخاص بموضوع (${lessonTitle}) مع كتابة القوانين، التعويض الدقيق، والناتج مع الوحدات القياسية.`,
        modelAnswer: `1. كتابة القانون الرياضي/الفيزيائي المعتمد.\n2. التعويض بالمعطيات بدقة.\n3. استخراج الناتج النهائي ومطابقته مع دليل التصحيح الوزاري.`,
        points: 10,
      });
    } else {
      q2Instruction = 'عدّد واشرح بالتفصيل المنهجي:';
      q2Branches.push({
        id: 'q2-b1',
        label: 'أ',
        prompt: `عدّد المراحل والخصائص الحيوية الرئيسية لموضوع (${lessonTitle})، مع شرح الآلية والوظيفة المنهجية بالتفصيل.`,
        modelAnswer: `المراحل والخطوات العلمية المفصلة وفق التسلسل المنهجي المعتمد في الكتاب الوزاري لجمهورية العراق.`,
        points: 10,
      });
    }
  }

  const q1Total = q1Branches.reduce((acc, b) => acc + b.points, 0);
  const q2Total = q2Branches.reduce((acc, b) => acc + b.points, 0);

  return {
    id: `exam-${curriculum?.lesson_info?.lesson_id || 'daily'}`,
    lessonTitle: (curriculum?.lesson_info as any)?.lesson_title || lessonTitle,
    subject: curriculum?.lesson_info?.subject || subject,
    grade: curriculum?.lesson_info?.grade || 'السادس الإعدادي - الفرع العلمي',
    durationMinutes: 10,
    totalPoints: q1Total + q2Total,
    question1: {
      id: 'q1',
      title: 'السؤال الأول',
      instruction: q1Instruction,
      branches: q1Branches,
    },
    question2: {
      id: 'q2',
      title: `السؤال الثاني (${q2Total} درجات)`,
      instruction: q2Instruction,
      branches: q2Branches,
    },
    source: 'curriculum_json',
    isAvailable: true,
  };
}

/**
 * Loads the Daily Exam asynchronously on demand using the Curriculum JSON
 * Accepts either OpenLessonContext or legacy arguments.
 */
export async function fetchDailyExamForLesson(
  contextOrSubjectId: OpenLessonContext | string,
  lessonId?: string,
  lessonTitle: string = 'الدرس التعليمي',
  category: string = 'المادة التعليمية',
  chapterNumber?: number,
  lessonNumber?: number
): Promise<DailyExamConfig> {
  try {
    let resolvedTitle = lessonTitle;
    let resolvedCategory = category;

    if (typeof contextOrSubjectId === 'object' && contextOrSubjectId !== null) {
      const ctx = contextOrSubjectId as OpenLessonContext;
      resolvedTitle = ctx.title || ctx.lessonTitle || `الدرس ${ctx.lessonNumber}`;
      resolvedCategory = ctx.subjectId;
      const res = await fetchLessonCurriculum(ctx);
      return extractDailyExamFromCurriculum(res.data, resolvedTitle, resolvedCategory);
    }

    const res = await fetchLessonCurriculum(contextOrSubjectId, lessonId, chapterNumber, lessonNumber);
    return extractDailyExamFromCurriculum(res.data, resolvedTitle, resolvedCategory);
  } catch (err) {
    console.error('Failed to load daily exam from curriculum:', err);
    return extractDailyExamFromCurriculum(null, lessonTitle, category);
  }
}
