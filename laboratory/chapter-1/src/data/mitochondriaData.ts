import { DiagramPart, QuizQuestion } from '../types';

export const MITOCHONDRIA_PARTS: DiagramPart[] = [
  {
    id: 'outer-membrane',
    nameAr: 'الطبقة الخارجية (الغشاء الخارجي)',
    nameEn: 'Outer Mitochondrial Membrane',
    category: 'envelope',
    color: '#38bdf8',
    summary: 'الطبقة الخارجية الملساء المحيطة بعضية المايتوكوندريا بالكامل.',
    functionAr: 'حماية الميتوكوندريا وتأمين التبادل الأيوني والمستقلبات الأولية مع السيتوبلازم عبر قنوات البورين.',
    compositionAr: 'طبقة فوسفوليبيد ثنائية ناعمة وملساء تمنح الميتوكوندريا شكلها البيضاوي العصوي الانسيابي.',
    permeabilityAr: 'نفاذة للجزيئات والماء والأيونات بوزن يقل عن 5000 دالتون.',
    examNoteAr: 'في الرسم المنهجي: يشار إليها بالسهم العلوي كـ "الطبقة الخارجية" وهي غشاء أملس غير منثنٍ.',
    pointer: {
      targetX: 330,
      targetY: 145,
      labelX: 140,
      labelY: 105,
      anchor: 'end'
    }
  },
  {
    id: 'inner-membrane',
    nameAr: 'الطبقة الداخلية (الغشاء الداخلي)',
    nameEn: 'Inner Mitochondrial Membrane',
    category: 'envelope',
    color: '#fb923c',
    summary: 'الطبقة الغشائية الداخلية التي تمتد منها انطواءات عميقة نحو الداخل تسمى الأعراف.',
    functionAr: 'عزل القالب، واحتواء سلاسل نقل الإلكترونات ومضخات البروتونات اللازمة للفسفرة التأكسدية.',
    compositionAr: 'غشاء دهني-بروتيني كثيف غني بدهن الكارديوليبين الذي يمنع تسرب أيونات الهيدروجين.',
    permeabilityAr: 'غير نفاذ تماماً للأيونات لمنع تشتت التدرج الكهروكيميائي للبروتونات.',
    examNoteAr: 'في الرسم المنهجي: يشار إليها مباشرة تحت الطبقة الخارجية بـ "الطبقة الداخلية".',
    pointer: {
      targetX: 345,
      targetY: 175,
      labelX: 140,
      labelY: 185,
      anchor: 'end'
    }
  },
  {
    id: 'cristae',
    nameAr: 'عُرف / الأعراف (Cristae)',
    nameEn: 'Mitochondrial Cristae',
    category: 'organelle',
    color: '#ec4899',
    summary: 'انثناءات وإصبعيات غشائية ممتدة من الطبقة الداخلية نحو القالب.',
    functionAr: 'زيادة مساحة السطح التفاعلي الداخلي لاستيعاب أكبر عدد ممكن من مجمعات الفسفرة وإنتاج ATP.',
    compositionAr: 'طيات مزدوجة من الغشاء الداخلي تبرز في القالب بشكل متقابل كما في الرسم المنهجي.',
    permeabilityAr: 'مدمج بها مجمعات إنزيمية متخصصة ومضخات للبروتون H+.',
    examNoteAr: 'في الرسم المنهجي: يشار إليها بالسهم الأوسط "عُرف"، وتتجه نحو الداخل أفقياً.',
    pointer: {
      targetX: 395,
      targetY: 265,
      labelX: 140,
      labelY: 275,
      anchor: 'end'
    }
  },
  {
    id: 'matrix',
    nameAr: 'القالب / المصفوفة (Matrix)',
    nameEn: 'Mitochondrial Matrix',
    category: 'fluid',
    color: '#10b981',
    summary: 'السائل الهلامي الداخلي المحاط بالطبقة الداخلية، وتحدث فيه تفاعلات دورة كربس.',
    functionAr: 'احتواء الإنزيمات المحللة لحمض البيروفيك وأنزيمات دورة حمض الستريك ومركبات تخزين الطاقة.',
    compositionAr: 'محلول كثيف يحوي إنزيمات، حمض نووي حلقي mtDNA، ريبوسومات، وحبيبات القالب الكلسية.',
    permeabilityAr: 'وسط منظم ذاتياً بدرجة حموضة ملائمة لعمل إنزيمات الأكسدة التنفسية.',
    examNoteAr: 'في الرسم المنهجي: يشار إليها بـ "القالب"، وهو التجويف الداخلي المحيط بالأعراف.',
    pointer: {
      targetX: 310,
      targetY: 375,
      labelX: 140,
      labelY: 385,
      anchor: 'end'
    }
  },
  {
    id: 'atp-synthase',
    nameAr: 'إنزيمات التنفس وبناء ATP (على العرف)',
    nameEn: 'Respiratory Particles / ATP Synthase',
    category: 'protein',
    color: '#c084fc',
    summary: 'حبيبات كروية مصفوفة بانتظام على جانبي العرف المركزي لإنتاج الطاقة الحيوية.',
    functionAr: 'استغلال الطاقة الحركية لتدفق البروتونات العائدة للقالب وتكوين جزيئات ATP من ADP والفوسفات.',
    compositionAr: 'مجمعات جزيئية رأسية وقاعدية (F0-F1 ATP Synthase) مصفوفة على الغشاء كحبيبات تنفسية.',
    permeabilityAr: 'تمثل القنوات المنظمة الحصرية لعودة أيونات H+ إلى القالب.',
    examNoteAr: 'ميزة بارزة جداً في الرسم المنهجي: يظهر أحد الأعراف منقطاً بحبيبات كروية دقيقة على جانبيه!',
    pointer: {
      targetX: 470,
      targetY: 300,
      labelX: 860,
      labelY: 260,
      anchor: 'start'
    }
  },
  {
    id: 'mtdna-ribosomes',
    nameAr: 'حبيبات القالب و DNA الحلقي',
    nameEn: 'Matrix Granules & mtDNA Rings',
    category: 'genetic',
    color: '#facc15',
    summary: 'دوائر وحبيبات منتشرة داخل القالب الميتوكوندري (ريبوسومات وحبيبات ملحية وDNA).',
    functionAr: 'تخليق بعض البروتينات التنفسية ذاتياً والمحافظة على التوازن الأيوني داخل القالب.',
    compositionAr: 'حبيبات دائرية صغيرة من فوسفات الكالسيوم وحلقات دائرية من الحمض النووي المزدوج.',
    permeabilityAr: 'تسبح بحرية داخل القالب المائي.',
    examNoteAr: 'تظهر في الرسم المنهجي كدوائر صغيرة وحبيبات مبعثرة بانتظام في تجويف القالب.',
    pointer: {
      targetX: 620,
      targetY: 320,
      labelX: 860,
      labelY: 370,
      anchor: 'start'
    }
  }
];

export const MITOCHONDRIA_QUIZ: QuizQuestion[] = [
  {
    id: 1,
    prompt: 'أين تقع الأعراف (Cristae) التي تزيد من مساحة سطح التفاعلات التنفسية؟',
    targetPartId: 'cristae',
    hint: 'انقر على الانثناءات الغشائية الممتدة داخل الميتوكوندريا.',
    explanation: 'أحسنت! طيات الغشاء الداخلي (الأعراف) تضاعف مساحة السطح اللازمة لمجمعات سلاسل نقل الإلكترون.'
  },
  {
    id: 2,
    prompt: 'حدد الحشوة الميتوكوندرية (Matrix) التي تحدث فيها دورة كربس.',
    targetPartId: 'matrix',
    hint: 'انقر على السائل الداخلي المركزي الحاضن للإنزيمات والمادة الوراثية.',
    explanation: 'ممتاز! الحشوة السائلة تحتوي على جميع إنزيمات أكسدة البيروفات ودورة حمض الستريك.'
  },
  {
    id: 3,
    prompt: 'انقر على إنزيم بناء الطاقة (ATP Synthase) الذي يستغل تدفق البروتونات.',
    targetPartId: 'atp-synthase',
    hint: 'ابحث عن المجمع الإنزيمي البنفسجي البارز من الأعراف نحو الحشوة.',
    explanation: 'صحيح! هذا المحرك النانوي يحول الطاقة الكهروكيميائية إلى طاقة كيميائية مخزنة في روابط ATP.'
  }
];
