import { supabase } from '../lib/supabase';
import { LessonBookletData, BookletItem } from '../data/lessonBooklet';
import { getDbSubjectIds, formatArabicLessonTitle, getLessonContentBundle, getSubjectIndex } from './lessonsService';
import { OpenLessonContext } from '../types';

// In-memory cache for curriculum files
const curriculumCache: Record<string, LessonBookletData> = {};

/**
 * Normalizes subject ID to standard key
 */
function getSubjectNormalizedKey(subjectId: string): string {
  const s = (subjectId || '').toLowerCase().trim();
  if (s.includes('chem') || s.includes('كيمياء')) return 'chemistry';
  if (s.includes('bio') || s.includes('أحياء') || s.includes('احياء') || s.includes('بيولوجيا')) return 'biology';
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
 * The chemistry/physics booklet is for memorisation content only. Numerical
 * exercises belong to "Solve with me", so remove them before any booklet JSON
 * reaches the UI. Other subjects are intentionally left untouched.
 */
export function filterBookletForMemorization(
  data: LessonBookletData,
  subjectId: string
): LessonBookletData {
  const subject = getSubjectNormalizedKey(subjectId || data?.lesson_info?.subject || '');
  if (subject !== 'chemistry' && subject !== 'physics') return data;

  const explicitCalculationType = /(solve|exercise|calculation|numeric|numerical|math(?:ematical)?|problem|مس[أا]لة|حل|تمرين|حساب|تطبيق\s*حسابي)/i;
  const explicitMemorizationType = /(define|explain|compare|mention|enumerate|critical_thinking|true_false|mcq|fill_blank|تعريف|علل|تعليل|قارن|مقارنة|اذكر|عدد|صح|خطأ|اختر|أكمل)/i;
  const calculationPrompt = /^\s*(?:احسب|جد|أوجد|اوجد|حل|استخرج\s+قيمة|عين\s+قيمة|ما\s+قيمة)(?=\s|[:：؟?]|$)/u;

  const isCalculationItem = (item: any): boolean => {
    const itemType = String(item?.type || '');
    const questionType = String(item?.question_type || '');
    if (explicitMemorizationType.test(questionType)) return false;
    if (explicitCalculationType.test(itemType) || explicitCalculationType.test(questionType)) return true;
    const prompt = String(item?.question || item?.prompt || item?.content || '');
    return calculationPrompt.test(prompt);
  };

  return {
    ...data,
    pages: (data.pages || []).map((page) => {
      const items = (page.items || []).filter((item) => !isCalculationItem(item));
      return { ...page, items, item_count: items.length };
    }).filter((page) => page.items.length > 0),
  };
}

/**
 * Extracts chapter and segment/lesson numbers from lesson identifiers or strings
 */
export function extractChapterAndSegment(input: string): { chapter?: number; segment?: number } {
  if (!input) return {};
  const chMatch = input.match(/ch(?:apter)?[\s_-]*(\d+|[٠-٩]+)/i) || input.match(/فصل\s*(\d+|[٠-٩]+)/i);
  const segMatch =
    input.match(/(?:segment|lesson|les)[\s_-]*(\d+|[٠-٩]+)/i) ||
    input.match(/(?:ال)?سجمنت[\s_-]*(\d+|[٠-٩]+)/i) ||
    input.match(/الدرس[\s_-]*(\d+|[٠-٩]+)/i) ||
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
 * Comprehensive Iraqi Curriculum knowledge base for Biology chapters and lessons
 */
const IRAQ_BIOLOGY_CURRICULUM_DATA: Record<number, Record<number, { title: string; items: BookletItem[] }>> = {
  // Chapter 1: الخلية
  1: {
    1: {
      title: 'مفهوم الخلية ونظريتها وتطورها',
      items: [
        {
          item_id: 101,
          item_index: 1,
          type: 'title',
          content: 'الفصل الأول: الخلية - مفهوم الخلية وتطور الاكتشافات العلمية',
        },
        {
          item_id: 102,
          item_index: 2,
          type: 'paragraph',
          content: 'تعد الخلية الوحدة التركيبية والوظيفية الأساسية لجميع الكائنات الحية. تباينت مراحل تطور دراسة الخلية بدءاً من العالم أنطوني فان ليفنهوك الذي اخترع المجهر البسيط وشاهد الأحياء الدقيقة، وروبرت هوك الذي أطلق مصطلح (خلية Cell)، ثم روبرت براون الذي اكتشف النواة، وصولاً إلى ماثياس شلايدن وثيودور شوان اللذين صاغا النظرية الخلوية.',
        },
        {
          item_id: 103,
          item_index: 3,
          type: 'question',
          question_type: 'تعريف',
          question: 'ما هي النظرية الخلوية (Cell Theory) وما أسسها؟',
          answer: 'النظرية الخلوية تستند إلى أعمال شلايدن وشوان، وتنص على: 1. جميع الكائنات الحية تتكون من خلايا. 2. الخلايا هي الوحدات الأساسية التركيبية والوظيفية للكائنات الحية. 3. الخلايا تنشأ من خلايا أخرى سابقة لها من خلال انقسامها.',
        },
        {
          item_id: 104,
          item_index: 4,
          type: 'question',
          question_type: 'تعليل',
          question: 'علل: تمتلك الخلايا حجوم مختلفة وما الغاية من التباين في الحجم؟',
          answer: 'تتباين الخلايا في حجومها مثل بيضة الضفدع (1 ملم) التي تُرى بالعين المجردة، وبيضة الإنسان (لا تتجاوز 100 مايكرومتر)، وتمتلك الخلايا تخصصات معينة لزيادة الكفاءة في أداء الوظائف الحيوية المختلفة.',
        },
      ],
    },
    2: {
      title: 'الخلية بدائية النواة وحقيقية النواة والعضيات الخلوية',
      items: [
        {
          item_id: 105,
          item_index: 1,
          type: 'title',
          content: 'مقارنة بين الخلية بدائية النواة والخلية حقيقية النواة والعضيات الحية',
        },
        {
          item_id: 106,
          item_index: 2,
          type: 'question',
          question_type: 'مقارنة',
          question: 'قارن بين الغشاء البلازمي وجدار الخلية من حيث الموقع والتركيب الكيميائي والنفاذية؟',
          answer: '1. جدار الخلية: خارجي سميك يحيط بالخلية النباتية، يتركب كيميائياً من السليلوز في الخلايا الفتية ويتثخن بالخشبين (اللكنين) في الخلايا المتقدمة، تام النفوذية.\n2. الغشاء البلازمي: غشاء خلوي نصف ناضح يحيط بالسيتوبلازم في البدائية وحقيقية النواة، يتركب كيميائياً من طبقتين رقيقتين من جزيئات الدهون المفسفرة تتخللها جزيئات بروتينية تسمح بمرور المواد.',
        },
        {
          item_id: 107,
          item_index: 3,
          type: 'question',
          question_type: 'وظيفة وموقع',
          question: 'ما موقع ووظيفة الأعراف (Cristae) في الميتوكوندريا؟',
          answer: 'الموقع: الغشاء الداخلي للميتوكوندريا وتمتد في القالب.\nالوظيفة: تزيد من المساحة السطحية للطبقة الداخلية للميتوكوندريا لتوليد الطاقة (ATP).',
        },
      ],
    },
    3: {
      title: 'الأنشطة الخلوية وعبور المواد عبر الأغشية',
      items: [
        {
          item_id: 108,
          item_index: 1,
          type: 'title',
          content: 'الأنشطة الخلوية: آليات عبور المواد عبر الأغشية الحيوية',
        },
        {
          item_id: 109,
          item_index: 2,
          type: 'question',
          question_type: 'تعريف',
          question: 'ما هو النقل الفعال (النشط) وما شروطه الحيوية؟',
          answer: 'النقل الفعال: امتصاص الخلايا لبعض المواد من محيطها الخارجي على الرغم من أن تراكيز تلك المواد داخل الخلايا أعلى منها في الخارج. ويتطلب وجود مواد حاملة في الغشاء البلازمي وصرف طاقة مستمدة من ATP.',
        },
        {
          item_id: 110,
          item_index: 3,
          type: 'question',
          question_type: 'تعليل',
          question: 'علل: تنكمش الخلية الحيوانية عند وضعها في محلول عالي التركيز؟',
          answer: 'بسبب خروج الماء من السيتوبلازم إلى المحلول الخارجي عن طريق الخاصية التناضحية (Osmosis) لكون تركيز الماء داخل الخلية أعلى منه في المحلول عالي التركيز.',
        },
      ],
    },
    4: {
      title: 'الانقسام الخلوي (الخيطي والاختزالي)',
      items: [
        {
          item_id: 111,
          item_index: 1,
          type: 'title',
          content: 'الانقسام الخيطي (غير المباشر) والانقسام الاختزالي الأول والثاني',
        },
        {
          item_id: 112,
          item_index: 2,
          type: 'question',
          question_type: 'أطوار الانقسام',
          question: 'في أي طور أو دور تحدث الظواهر الآتية: (التعابر، تضاعف DNA، تكوين خيوط المغزل، الإيثاق والتصالبات)؟',
          answer: '1. تضاعف DNA: الطور البيني.\n2. تكوين خيوط المغزل: الطور التمهيدي.\n3. الإيثاق (التشابك) والرباعيات: الدور الازدواجي (الطور التمهيدي الأول).\n4. التعابر الوراثي وتبادل قطع الكروماتيدات: الدور التغلظي.\n5. التصالبات: الدور الانفراجي.',
        },
      ],
    },
  },

  // Chapter 2: الأنسجة
  2: {
    1: {
      title: 'الأنسجة النباتية وتصنيفاتها',
      items: [
        {
          item_id: 201,
          item_index: 1,
          type: 'title',
          content: 'الفصل الثاني: الأنسجة - الأنسجة النباتية وتوزيعها الوظيفي',
        },
        {
          item_id: 202,
          item_index: 2,
          type: 'paragraph',
          content: 'النسيج النباتي هو مجموعة من الخلايا المتباينة في المظهر ولكنها تؤدي وظيفة مشتركة. تنقسم الأنسجة النباتية إلى: 1. النسيج المرستيمي (الإنشائي). 2. نسيج الأساس (البرنكيمي، الكولنكيمي، السكلرنكيمي). 3. نسيج البشرة. 4. النسيج الوعائي (الخشب واللحاء).',
        },
        {
          item_id: 203,
          item_index: 3,
          type: 'question',
          question_type: 'مقارنة',
          question: 'قارن بين النسيج البرنكيمي والنسيج الكولنكيمي والنسيج السكلرنكيمي؟',
          answer: '1. البرنكيمي: خلايا حية كروية أو مضلعة، رقيقة الجدران، توجد مسافات بينية، تحتوي فجوة عصيرية.\n2. الكولنكيمي: خلايا حية متطاولة، جدرانها متغلظة بشكل غير منتظم، تدعم وتقوي الأعضاء النباتية النامية.\n3. السكلرنكيمي: خلايا ميتة ذات جدران مغلظة بمادة اللكنين (الخشبين)، تنقسم إلى ألياف وخلايا صخرية.',
        },
        {
          item_id: 204,
          item_index: 4,
          type: 'question',
          question_type: 'وظيفة',
          question: 'ما هي عناصر نسيج اللحاء ووظيفة كل منها في النبات؟',
          answer: 'يتكون اللحاء من: الأنابيب المنخلية (نقل الجزيئات العضوية داخل جسم النبات)، الخلايا المرافقة (تنظيم نقل المواد الغذائية)، ألياف اللحاء (الإسناد والتقوية)، وبرنكيما اللحاء (خزن المواد).',
        },
      ],
    },
    2: {
      title: 'الأنسجة الحيوانية والنسيج الظهاري (الطلائي)',
      items: [
        {
          item_id: 205,
          item_index: 1,
          type: 'title',
          content: 'الأنسجة الظهارية (الطلائية) البسيطة والمطبقة',
        },
        {
          item_id: 206,
          item_index: 2,
          type: 'question',
          question_type: 'موقع ونوع النسيج',
          question: 'ما نوع النسيج في كل من: (بطانة الأوعية الدموية، بطانة الرغامي، بطانة المثانة البولية، الغدد العرقية)؟',
          answer: '1. بطانة الأوعية الدموية والحويصلات الرئوية: نسيج ظهاري حرشفي بسيط.\n2. بطانة الرغامي والقنوات التنفسية: نسيج ظهاري مطبق كاذب مهدب.\n3. بطانة المثانة البولية وحوض الكلية: نسيج ظهاري متحول.\n4. قنوات الغدد العرقية: نسيج ظهاري مطبق مكعبي.',
        },
      ],
    },
    3: {
      title: 'الأنسجة الضامة (الرابطة) وخلاياها والغضروف والعظم والدم',
      items: [
        {
          item_id: 207,
          item_index: 1,
          type: 'title',
          content: 'الأنسجة الضامة: الخلايا، الألياف، المادة البينية، والغضروف والعظم والدم',
        },
        {
          item_id: 208,
          item_index: 2,
          type: 'question',
          question_type: 'وظيفة ومنشأ',
          question: 'ما وظيفة وأهمية: 1. الأرومة الليفية. 2. البلعم الكبير. 3. الخلية البدينة؟',
          answer: '1. الأرومة الليفية: المسؤولة عن تكوين جميع أنواع الألياف في النسيج الضام.\n2. البلعم الكبير: التهام الجزيئات الغريبة وحماية الجسم (دفاعية).\n3. الخلية البدينة: إفراز الهستامين (تقلص العضلات الملساء وتوسيع الشعيرات الدموية) وإفراز الهيبارين (منع تخثر الدم).',
        },
        {
          item_id: 209,
          item_index: 3,
          type: 'question',
          question_type: 'تعليل',
          question: 'علل: يعتبر الدم نسيجاً ضاماً خاصاً (متخصصاً)؟',
          answer: 'لأنه ينشأ من الخلايا المتوسطة الجنينية، ويتكون من خلايا ومادة بينية (البلازما) ومواد بروتينية تتحول إلى ألياف عند التخثر.',
        },
      ],
    },
  },

  // Chapter 3: التكاثر
  3: {
    1: {
      title: 'التكاثر في الرواشح (الفيروسات) والبكتيريا',
      items: [
        {
          item_id: 301,
          item_index: 1,
          type: 'title',
          content: 'الفصل الثالث: التكاثر - التكاثر في الفيروسات والبكتيريا',
        },
        {
          item_id: 302,
          item_index: 2,
          type: 'paragraph',
          content: 'تتكاثر الفيروسات (آكل البكتيريا Bacteriophage) من خلال دورتين متداخلتين: دورة التحلل (Lytic cycle) ودورة التحلل والإنتاج (Lysogenic cycle) وتتضمن مراحل: الاتصال، الاختراق، التخليق، الإنضاج، والتحرر. وتتكاثر البكتيريا لاجنسياً بالانشطار الثنائي وجنسياً بالاقتران البكتيري.',
        },
        {
          item_id: 303,
          item_index: 3,
          type: 'question',
          question_type: 'تعريف وشرح',
          question: 'ما هو عامل الخصوبة (بلازميد F) وجسر الاقتران في بكتيريا القولون؟',
          answer: 'عامل الخصوبة: قطعة دائرية من DNA توجد في سيتوبلازم الخلية المعطية وتحتوي على هلب الاقتران (الأهلاب الجنسية). عند الاقتران يتكون جسر الاقتران وينتقل شريط من عامل الخصوبة إلى الخلية المستلمة دون نقصان في مادتها الوراثية.',
        },
      ],
    },
    2: {
      title: 'التكاثر في النباتات الزهرية وتكوين البذور والثمار',
      items: [
        {
          item_id: 304,
          item_index: 1,
          type: 'title',
          content: 'التكاثر في النباتات الزهرية: المتك، المبيض، والتلقيح والإخصاب المزدوج',
        },
        {
          item_id: 305,
          item_index: 2,
          type: 'question',
          question_type: 'تعريف وزاري',
          question: 'ما هو الإخصاب المزدوج (Double Fertilization) في النباتات الزهرية؟',
          answer: 'الإخصاب المزدوج: هو اتحاد إحدى الخليتين النطفتين مع الخلية البيضية لتكوين الزيجة (2س)، واتحاد الخلية النطفية الثانية مع النواتين القطبيتين لتكوين نواة السويداء (3س). وهي صفة مميزة للنباتات الزهرية.',
        },
      ],
    },
    3: {
      title: 'التكاثر في الكائنات الحية والضفدع والإنسان',
      items: [
        {
          item_id: 306,
          item_index: 1,
          type: 'title',
          content: 'التكاثر في البرمائيات (الضفدع) والأجهزة التناسلية في الإنسان',
        },
        {
          item_id: 307,
          item_index: 2,
          type: 'question',
          question_type: 'موقع ووظيفة',
          question: 'ما موقع ووظيفة الأجسام الدهنية في الضفدع؟',
          answer: 'الموقع: عند النهاية الأمامية للمناسل (الخصى والمبايض) في الضفدع.\nالوظيفة: تمثل مراكز خزن الغذاء يستخدمها الحيوان لإنماء المناسل خلال فترة السبات الشتوي.',
        },
      ],
    },
  },

  // Chapter 4: التكوين الجنيني
  4: {
    1: {
      title: 'مراحل التكوين الجنيني وتمايز الأجنة',
      items: [
        {
          item_id: 401,
          item_index: 1,
          type: 'title',
          content: 'الفصل الرابع: التكوين الجنيني - مراحل التفلج والأريمة والمعيدة',
        },
        {
          item_id: 402,
          item_index: 2,
          type: 'paragraph',
          content: 'يبدأ التكوين الجنيني بالإخصاب وتكوين الزيجة، ثم سلسلة من الانقسامات الخيطية تسمى التفلج (Cleavage) لتكوين الأريمة (Blastula) ذات التجويف الأريمي، يليها مرحلة تكوين المعيدة (Gastrula) التي تتشكل منها الطبقات الجرثومية الثلاث: الأديم الظاهر، الأديم المتوسط، والأديم الباطن.',
        },
        {
          item_id: 403,
          item_index: 3,
          type: 'question',
          question_type: 'منشأ',
          question: 'ما منشأ كل من: (الجهاز العصبي، القناة الهضمية، الجهاز الدوري والعضلي) في الجنين؟',
          answer: '1. الجهاز العصبي وبشرة الجلد: ينشأ من الأديم الظاهر (Ectoderm).\n2. بطانة القناة الهضمية والغدد الملحقة بها: تنشأ من الأديم الباطن (Endoderm).\n3. العضلات، الهيكل العظمي، والقلب والأوعية الدموية: تنشأ من الأديم المتوسط (Mesoderm).',
        },
      ],
    },
  },

  // Chapter 5: الوراثة
  5: {
    1: {
      title: 'علم الوراثة وقوانين مندل وتطبيقات التهجين',
      items: [
        {
          item_id: 501,
          item_index: 1,
          type: 'title',
          content: 'الفصل الخامس: الوراثة - الوراثة المندلية وقانون الانعزال والتوزيع الحر',
        },
        {
          item_id: 502,
          item_index: 2,
          type: 'paragraph',
          content: 'تأسس علم الوراثة على يد العالم غريغور مندل من خلال تجاربه على نبات البازلاء. صاغ مندل قانون الانعزال (قانون مندل الأول) وقانون التوزيع الحر (قانون مندل الثاني). تمثل العوامل الوراثية (الأليلات) الصفات الوراثية السائدة والمتنحية.',
        },
        {
          item_id: 503,
          item_index: 3,
          type: 'question',
          question_type: 'تعريف ومسألة',
          question: 'ما هو التضريب الاختباري (Test Cross) وما الهدف منه؟',
          answer: 'التضريب الاختباري: هو تضريب يجري لفرد يحمل صفة سائدة مجهولة النقاوة (هل هي نقية AA أم هجينة Aa) مع فرد يحمل الصفة المتنحية دائماً (aa). والهدف منه معرفة الطراز الوراثي والنقاوة للفرد السائد.',
        },
        {
          item_id: 504,
          item_index: 4,
          type: 'question',
          question_type: 'وراثة لامندلية',
          question: 'ما نوع الوراثة في فصائل الدم ABO ونظام العامل الريسي Rh؟',
          answer: 'فصائل الدم ABO تخضع للأليلات المتعددة والسيادة المشاركة (المواكبة بين الأليلين IA و IB). أما نظام عامل الريسوس Rh فيخضع لأليلات متعددة ويحدد وجود مستضد Rh على كريات الدم الحمر.',
        },
      ],
    },
  },
};

/**
 * Generates an adaptive Iraqi Curriculum booklet fallback tailored to exact subject, chapter, and lesson
 */
function getFallbackCurriculum(
  normKey: string,
  targetChapter = 1,
  targetSegment = 1,
  lessonTitle = 'الدرس'
): LessonBookletData {
  const cleanTitle = formatArabicLessonTitle(lessonTitle);

  if (normKey === 'biology') {
    // Check specific chapter and lesson in biology curriculum
    const chData = IRAQ_BIOLOGY_CURRICULUM_DATA[targetChapter];
    const lesData = chData?.[targetSegment] || chData?.[1];

    if (lesData) {
      return {
        lesson_info: {
          lesson_id: `bio_ch${targetChapter}_les${targetSegment}`,
          country: 'العراق',
          subject: 'الأحياء - السادس العلمي',
          grade: 'السادس الإعدادي',
        },
        pages: [
          {
            page_id: `p_bio_${targetChapter}_${targetSegment}`,
            page_number: 1,
            item_count: lesData.items.length,
            items: lesData.items,
          },
        ],
      };
    }
  }

  // Generic rich fallback for other subjects
  return {
    lesson_info: {
      lesson_id: `${normKey}_ch${targetChapter}_les${targetSegment}`,
      country: 'العراق',
      subject: normKey,
      grade: 'السادس الإعدادي',
    },
    pages: [
      {
        page_id: `p1_${normKey}_ch${targetChapter}_les${targetSegment}`,
        page_number: 1,
        item_count: 3,
        items: [
          {
            item_id: 1,
            item_index: 1,
            type: 'title',
            content: `مفردات المنهج المعتمد: ${cleanTitle}`,
          },
          {
            item_id: 2,
            item_index: 2,
            type: 'paragraph',
            content: `تتضمن هذه المحاضرة شرح المفاهيم الأساسية والتطبيقات الوزارية المعتمدة في منهج السادس الإعدادي لجمهورية العراق، مع حل التعاليل والمسائل النموذجية المعتمدة في الامتحانات العامة للفصل ${targetChapter}.`,
          },
          {
            item_id: 3,
            item_index: 3,
            type: 'question',
            question_type: 'تعريف وتطبيق',
            question: `ما هي أهم المفاهيم والقوانين الوزارية الواردة في ${cleanTitle}؟`,
            answer: `التركيز على فهم المصطلحات العلمية والقوانين والرسومات المعتمدة في كتاب وزارة التربية وحل التمارين والأسئلة الوزارية المكررة للأعوام السابقة.`,
          },
        ],
      },
    ],
  };
}

/**
 * Fetches the official curriculum booklet JSON for a specific lesson from Supabase.
 * Accepts either OpenLessonContext or legacy (subjectId, lessonId, chapterNumber, lessonNumber).
 */
export async function fetchLessonCurriculum(
  contextOrSubjectId: OpenLessonContext | string,
  lessonId?: string,
  chapterNumber?: number,
  lessonNumber?: number
): Promise<{ data: LessonBookletData | null; error?: string }> {
  try {
    let subjectId: string;
    let actualLessonId: string;
    let actualChapterNumber: number;
    let actualLessonNumber: number;
    let title: string;

    if (typeof contextOrSubjectId === 'object' && contextOrSubjectId !== null) {
      const ctx = contextOrSubjectId as OpenLessonContext;
      subjectId = ctx.subjectId;
      actualLessonId = ctx.lessonId;
      actualChapterNumber = ctx.chapterNumber;
      actualLessonNumber = ctx.lessonNumber;
      title = ctx.title || ctx.lessonTitle || `الدرس ${ctx.lessonNumber}`;

      // Try bundle first
      try {
        const bundle = await getLessonContentBundle(ctx);
        if (bundle?.curriculumData?.pages && bundle.curriculumData.pages.length > 0) {
          return { data: filterBookletForMemorization(bundle.curriculumData as LessonBookletData, subjectId) };
        }
      } catch (e) {
        // ignore and fallback to direct
      }
    } else {
      subjectId = String(contextOrSubjectId);
      actualLessonId = lessonId || 'les-1';
      actualChapterNumber = chapterNumber !== undefined && chapterNumber > 0 ? chapterNumber : 1;
      actualLessonNumber = lessonNumber !== undefined && lessonNumber > 0 ? lessonNumber : 1;
      title = formatArabicLessonTitle(actualLessonId);
    }

    const normKey = getSubjectNormalizedKey(subjectId);
    const cacheKey = `${normKey}_ch${actualChapterNumber}_les${actualLessonNumber}_${actualLessonId}`;
    if (curriculumCache[cacheKey]) {
      return { data: curriculumCache[cacheKey] };
    }

    const dbSubjects = getDbSubjectIds(normKey);
    const curriculumSections = ['curriculum', 'منهج', 'manhaj', 'منهاج', 'booklet', 'مفردات_منهجية'];

    // 1. Direct query by specific chapter and segment across curriculum sections
    const { data: matchedRows } = await supabase
      .from('educational_data')
      .select('id, file_name, subject_id, section_id, content')
      .in('subject_id', dbSubjects)
      .in('section_id', curriculumSections)
      .or(
        `file_name.ilike.%ch${actualChapterNumber}%segment${actualLessonNumber}%,file_name.ilike.%ch${actualChapterNumber}%les${actualLessonNumber}%,file_name.ilike.%ch${actualChapterNumber}%lesson${actualLessonNumber}%,file_name.ilike.%فصل%${actualChapterNumber}%درس%${actualLessonNumber}%`
      )
      .limit(2);

    if (matchedRows && matchedRows.length > 0) {
      const validRow = matchedRows.find((r) => r.content?.pages && r.content.pages.length > 0);
      if (validRow) {
        const result = filterBookletForMemorization(validRow.content as LessonBookletData, subjectId);
        curriculumCache[cacheKey] = result;
        return { data: result };
      }
    }

    // 2. Direct query by clean lessonId
    if (actualLessonId && actualLessonId.length > 3) {
      const cleanId = actualLessonId.replace(/\.json$/i, '');
      const { data: directRows } = await supabase
        .from('educational_data')
        .select('id, file_name, subject_id, section_id, content')
        .in('subject_id', dbSubjects)
        .in('section_id', curriculumSections)
        .ilike('file_name', `%${cleanId}%`)
        .limit(1);

      if (directRows && directRows.length > 0 && directRows[0].content?.pages) {
        const result = filterBookletForMemorization(directRows[0].content as LessonBookletData, subjectId);
        curriculumCache[cacheKey] = result;
        return { data: result };
      }
    }

    // لا ننشئ منهجًا تجريبيًا لدرس لا يملك ملفًا فعليًا؛ يجب أن يظهر للمستخدم أنه غير متوفر.
    return {
      data: null,
      error: `لا يوجد ملف منهج متاح للمادة ${subjectId}، الفصل ${actualChapterNumber}، الدرس ${actualLessonNumber}.`,
    };
  } catch (err: any) {
    console.error('Error fetching curriculum:', err);
    return {
      data: null,
      error: 'تعذر جلب ملف المنهج لهذا الدرس.',
    };
  }
}
