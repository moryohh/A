import React, { useEffect, useState } from 'react';
import { Award, BookOpenCheck, Camera, ChevronLeft, ImageIcon, Loader2, Shuffle, X } from 'lucide-react';
import { chooseRandomExam, CurriculumExamRecord, fetchChapterExamBank } from '../services/examBankService';
import { supabase } from '../lib/supabase';

interface ChapterExamIconsProps {
  subjectId: string;
  subjectName: string;
  chapterNumber: number;
  className?: string;
}

type QuestionEntry = { title: string; text: string; answer?: string };
type ExamQuestion = { title: string; parts: QuestionEntry[] };
type SubmissionEntry = {
  question: string;
  part: string;
  prompt: string;
  answer: string;
  image: string;
  modelAnswer?: string;
};
type ChapterSubmission = {
  id: string;
  exam_id: string;
  exam_title: string;
  subject_id: string;
  subject_name: string;
  chapter_number: number;
  submitted_at: string;
  entries: SubmissionEntry[];
  correction_status?: 'completed' | 'partial' | 'failed' | 'skipped';
  correction_endpoint?: string;
  correction_result?: unknown;
  correction_error?: string;
};
type ChapterExamNotificationDetail = {
  id: string;
  title: string;
  message: string;
  submittedAt: string;
};

const ANSWER_KEY_PATTERN = /answer|model_answer|solution|جواب|اجابة|إجابة|حل/i;
const QUESTION_KEY_PATTERN = /question|prompt|content|body|^q\d*$|^س\d*$/i;
const IGNORED_KEY_PATTERN = /raw_text|raw|json|metadata|lesson_ids|question_type|type|exam_type|source|id|title|date|year|round|dawr|chapter|subject/i;
const CHAPTER_EXAM_CORRECTION_ENDPOINTS = [
  'https://hhh-two-black.vercel.app/api/ocr',
  'https://hhh-main-wheat.vercel.app/api/ocr',
  'https://superb-centaur-deea8c.netlify.app/api/friend-ocr',
  'https://starlit-duckanoo-496fde.netlify.app/api/mmm-friend-ocr',
];

function isAnswerKey(key: string) {
  return ANSWER_KEY_PATTERN.test(key);
}

function titleFromKey(key: string) {
  const clean = key.replace(/[_-]+/g, ' ').trim();
  return clean || 'سؤال';
}

function questionTitleFromKey(key: string, index: number) {
  const match = key.match(/(?:question|س)[_-]?(\d+)/i);
  return match ? `س${match[1]}` : titleFromKey(key) || `س${index + 1}`;
}

function parseJsonString(value: string): unknown {
  const text = value.trim();
  if (!text.startsWith('{') && !text.startsWith('[')) return value;
  try {
    return JSON.parse(text);
  } catch {
    return value;
  }
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function formatQuestionItem(item: unknown, index: number) {
  if (typeof item === 'string') return `${index + 1}. ${item.trim()}`;
  if (!item || typeof item !== 'object' || Array.isArray(item)) return '';
  const obj = item as Record<string, unknown>;
  const label = cleanText(obj.label) || cleanText(obj.number) || cleanText(obj.id) || `${index + 1}`;
  const question = cleanText(obj.question) || cleanText(obj.text) || cleanText(obj.prompt) || cleanText(obj.content) || cleanText(obj.body);
  return question ? `${label}. ${question}` : '';
}

function formatQuestionPoint(item: unknown, index: number) {
  if (typeof item === 'string') return `${index + 1}. ${item.trim()}`;
  if (!item || typeof item !== 'object' || Array.isArray(item)) return '';
  const obj = item as Record<string, unknown>;
  const label = cleanText(obj.point_number) || cleanText(obj.label) || cleanText(obj.number) || `${index + 1}`;
  const question = cleanText(obj.question) || cleanText(obj.text) || cleanText(obj.prompt) || cleanText(obj.content) || cleanText(obj.body);
  return question ? `${label}. ${question}` : '';
}

function readBranch(value: unknown, fallbackTitle: string): QuestionEntry | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return readQuestion(value, fallbackTitle);
  const obj = value as Record<string, unknown>;
  const points = Array.isArray(obj.points) ? obj.points.map(formatQuestionPoint).filter(Boolean) : [];
  const title = cleanText(obj.branch_label) || cleanText(obj.title) || titleFromKey(fallbackTitle);
  const heading = cleanText(obj.title);
  if (points.length > 0) return { title, text: [heading, ...points].filter(Boolean).join('\n\n') };
  return readQuestion(value, fallbackTitle);
}

function readPartCollection(value: unknown): QuestionEntry[] {
  if (!value) return [];
  const collection = Array.isArray(value)
    ? value.map((partValue, index) => [`${index + 1}`, partValue] as const)
    : typeof value === 'object'
      ? Object.entries(value as Record<string, unknown>)
      : [];
  return collection
    .map(([partTitle, partValue]) => readBranch(partValue, partTitle))
    .filter(Boolean) as QuestionEntry[];
}

function readQuestion(value: unknown, title = ''): QuestionEntry | null {
  if (isAnswerKey(title) || IGNORED_KEY_PATTERN.test(title)) return null;
  if (typeof value === 'string') {
    const parsed = parseJsonString(value);
    if (parsed !== value) return readQuestion(parsed, title);
    const text = value.trim();
    if (!text || text.length < 4 || !QUESTION_KEY_PATTERN.test(title)) return null;
    return { title: titleFromKey(title), text };
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const obj = value as Record<string, unknown>;
  const question = obj.question || obj.text || obj.prompt || obj.content || obj.body;
  const itemValues = Array.isArray(obj.items)
    ? obj.items
    : obj.items && typeof obj.items === 'object'
      ? Object.values(obj.items as Record<string, unknown>)
      : [];
  const items = itemValues.map(formatQuestionItem).filter(Boolean);
  const answer = obj.answer || obj.model_answer;
  if (typeof question !== 'string' || !question.trim()) return null;
  const text = [question.trim(), ...items].join('\n\n');
  const entryTitle = cleanText(obj.question_number) || cleanText(obj.label) || titleFromKey(title);
  return { title: entryTitle, text, answer: typeof answer === 'string' ? answer : undefined };
}

function readQuestionParts(value: unknown, fallbackTitle: string): QuestionEntry[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const obj = value as Record<string, unknown>;
  const branches = readPartCollection(obj.branches);
  if (branches.length > 0) return branches;
  const nestedParts = readPartCollection(obj.parts);
  if (nestedParts.length > 0) return nestedParts;
  const nestedItems = readPartCollection(obj.items);
  if (nestedItems.length > 0) return nestedItems;
  const entry = readQuestion(value, fallbackTitle);
  if (entry) return [entry];
  const keyedBranches = Object.entries(obj)
    .filter(([key, branchValue]) => !IGNORED_KEY_PATTERN.test(key) && !isAnswerKey(key) && branchValue && typeof branchValue === 'object')
    .map(([key, branchValue]) => readBranch(branchValue, key))
    .filter(Boolean) as QuestionEntry[];
  if (keyedBranches.length > 0) return keyedBranches;
  return [];
}

function questionNumber(title: string) {
  const match = title.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function groupResettingQuestionSeries(entries: ExamQuestion[]): ExamQuestion[] {
  if (entries.length < 4) return entries;
  const numbers = entries.map((entry) => questionNumber(entry.title));
  if (numbers.some((number) => number === null)) return entries;

  const groups: ExamQuestion[][] = [];
  let current: ExamQuestion[] = [];
  entries.forEach((entry, index) => {
    const currentNumber = numbers[index] || 0;
    const previousNumber = index > 0 ? numbers[index - 1] || 0 : 0;
    if (index > 0 && currentNumber <= previousNumber) {
      groups.push(current);
      current = [];
    }
    current.push(entry);
  });
  if (current.length > 0) groups.push(current);

  if (groups.length < 2 || groups.some((group) => group.length < 2)) return entries;
  return groups.map((group, index) => ({
    title: `س${index + 1}`,
    parts: group.flatMap((question) => question.parts),
  }));
}

export function examQuestions(payload: Record<string, unknown>): ExamQuestion[] {
  const rawText = typeof payload.raw_text === 'string' ? parseJsonString(payload.raw_text) : null;
  if (rawText && rawText !== payload.raw_text && typeof rawText === 'object') {
    const parsedEntries = examQuestions(rawText as Record<string, unknown>);
    if (parsedEntries.length > 0) return parsedEntries;
  }

  const standaloneParts = readPartCollection(payload.branches || payload.parts || payload.items);
  if (standaloneParts.length > 0) {
    return [{ title: cleanText(payload.question_number) || 'س1', parts: standaloneParts }];
  }

  const examPaper = payload.exam_paper && typeof payload.exam_paper === 'object' && !Array.isArray(payload.exam_paper)
    ? payload.exam_paper as Record<string, unknown>
    : null;
  const source = examPaper?.questions || payload.questions || payload.exam_paper || payload.exam;
  if (Array.isArray(source)) {
    const direct = source
      .map((item, index) => {
        const itemObj = item && typeof item === 'object' && !Array.isArray(item) ? item as Record<string, unknown> : null;
        const title = cleanText(itemObj?.question_number) || `س${index + 1}`;
        const parts = readQuestionParts(item, title);
        return parts.length > 0 ? { title, parts } : null;
      })
      .filter(Boolean) as ExamQuestion[];
    if (direct.length > 0) return groupResettingQuestionSeries(direct);
  }
  if (source && typeof source === 'object') {
    const entries = Object.entries(source as Record<string, unknown>);
    const direct = entries
      .map(([key, value], index) => {
        const parts = readQuestionParts(value, key);
        return parts.length > 0 ? { title: questionTitleFromKey(key, index), parts } : null;
      })
      .filter(Boolean) as ExamQuestion[];
    if (direct.length > 0) return direct;
  }
  const fallback: ExamQuestion[] = [];
  const walk = (value: unknown, key = '') => {
    const parts = readQuestionParts(value, key);
    if (parts.length > 0) {
      const title = /^س\d+$/i.test(key) ? key : `س${fallback.length + 1}`;
      if (!fallback.some((item) => item.parts.map((part) => part.text).join('\n') === parts.map((part) => part.text).join('\n'))) {
        fallback.push({ title, parts });
      }
      return;
    }
    if (Array.isArray(value)) value.forEach((item, index) => walk(item, `س${index + 1}`));
    else if (typeof value === 'string') {
      const parsed = parseJsonString(value);
      if (parsed !== value) walk(parsed, key);
    } else if (value && typeof value === 'object') Object.entries(value as Record<string, unknown>).forEach(([childKey, childValue]) => {
      if (!isAnswerKey(childKey) && !IGNORED_KEY_PATTERN.test(childKey)) walk(childValue, childKey);
    });
  };
  walk(payload);
  return fallback;
}

export function questionEntries(payload: Record<string, unknown>): QuestionEntry[] {
  return examQuestions(payload).map((question) => ({
    title: question.title,
    text: question.parts.map((part) => `${part.title}\n${part.text}`).join('\n\n'),
  }));
}

function playPageFlipSound() {
  try {
    const audio = new Audio(`${import.meta.env.BASE_URL}audio/book-page-flip.mp3`);
    audio.volume = 0.8;
    audio.currentTime = 0;
    void audio.play();
  } catch {}
}

function examSubmissionKey(examId: string) {
  return `chapter-exam-submission:${examId}`;
}

function dataUrlToBase64(dataUrl: string) {
  const [, base64] = dataUrl.split(',');
  return base64 || dataUrl;
}

async function readCorrectionResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { text };
  }
}

async function correctChapterExamSubmission(submission: ChapterSubmission) {
  const answeredEntries = submission.entries.filter((entry) => entry.answer.trim() || entry.image);
  if (answeredEntries.length === 0) {
    return {
      status: 'skipped' as const,
      endpoint: '',
      result: { message: 'لا توجد إجابات مرسلة للتصحيح.' },
    };
  }

  const results = [];
  for (const [index, entry] of answeredEntries.entries()) {
    const answerPayload = {
      question_id: `${entry.question}-${entry.part}-${index + 1}`,
      question: entry.prompt,
      questionTitle: entry.question,
      part: entry.part,
      questionText: entry.prompt,
      studentAnswer: entry.answer,
      student_answer: entry.answer,
      answerText: entry.answer,
      textAnswer: entry.answer,
      imageBase64: entry.image ? dataUrlToBase64(entry.image) : undefined,
      imageDataUrl: entry.image || undefined,
      imageAnswer: entry.image || undefined,
      modelAnswer: entry.modelAnswer || '',
      model_answer: entry.modelAnswer || '',
      correctAnswer: entry.modelAnswer || '',
      referenceAnswer: entry.modelAnswer || '',
    };
    const payload = {
      request_id: `${submission.id}-${index + 1}`,
      submission_id: submission.id,
      source: 'chapter_exam',
      exam_id: submission.exam_id,
      exam_title: submission.exam_title,
      subject_id: submission.subject_id,
      subject_name: submission.subject_name,
      chapter_number: submission.chapter_number,
      submitted_at: submission.submitted_at,
      language: 'ara',
      question_id: answerPayload.question_id,
      question: answerPayload.question,
      questionTitle: answerPayload.questionTitle,
      questionText: answerPayload.questionText,
      studentAnswer: answerPayload.studentAnswer,
      student_answer: answerPayload.student_answer,
      answerText: answerPayload.answerText,
      textAnswer: answerPayload.textAnswer,
      imageBase64: answerPayload.imageBase64,
      imageDataUrl: answerPayload.imageDataUrl,
      imageAnswer: answerPayload.imageAnswer,
      modelAnswer: answerPayload.modelAnswer,
      model_answer: answerPayload.model_answer,
      correctAnswer: answerPayload.correctAnswer,
      referenceAnswer: answerPayload.referenceAnswer,
      answer: answerPayload,
      answers: [answerPayload],
    };

    let lastError = '';
    let handled = false;
    for (let attempt = 0; attempt < CHAPTER_EXAM_CORRECTION_ENDPOINTS.length; attempt += 1) {
      const endpointIndex = (index + attempt) % CHAPTER_EXAM_CORRECTION_ENDPOINTS.length;
      const endpoint = CHAPTER_EXAM_CORRECTION_ENDPOINTS[endpointIndex];
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 25000);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        const result = await readCorrectionResponse(response);
        if (!response.ok) {
          lastError = `${endpoint} رفض الطلب برمز ${response.status}`;
          continue;
        }
        results.push({ status: 'completed', endpoint, question: entry.question, part: entry.part, result });
        handled = true;
        break;
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'تعذر الاتصال بمسار التصحيح.';
      } finally {
        window.clearTimeout(timeout);
      }
    }
    if (!handled) results.push({ status: 'failed', endpoint: '', question: entry.question, part: entry.part, error: lastError });
  }

  const completedCount = results.filter((result) => result.status === 'completed').length;
  if (completedCount === answeredEntries.length) return { status: 'completed' as const, endpoint: 'distributed', result: { results } };
  if (completedCount > 0) return { status: 'partial' as const, endpoint: 'distributed', result: { results }, error: 'تم تصحيح بعض الإجابات فقط.' };
  return { status: 'failed' as const, endpoint: '', result: { results }, error: 'تعذر تصحيح كل الإجابات عبر مسارات API.' };
}

function findNumericValue(value: unknown, keys: string[]): number | null {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  for (const key of keys) {
    const direct = obj[key];
    if (typeof direct === 'number') return direct;
    if (typeof direct === 'string' && direct.trim() && !Number.isNaN(Number(direct))) return Number(direct);
  }
  for (const child of Object.values(obj)) {
    if (child && typeof child === 'object') {
      const nested = findNumericValue(child, keys);
      if (nested !== null) return nested;
    }
  }
  return null;
}

function buildResultMessage(submission: ChapterSubmission) {
  if (submission.correction_status === 'completed') {
    const score = findNumericValue(submission.correction_result, ['score', 'grade', 'points', 'درجة', 'الدرجة']);
    const total = findNumericValue(submission.correction_result, ['totalScore', 'total_score', 'maxScore', 'max_score', 'المجموع']);
    if (score !== null && total !== null) return `نتيجتك ${score} من ${total} في ${submission.exam_title}.`;
    if (score !== null) return `تم استلام نتيجة التصحيح: ${score} في ${submission.exam_title}.`;
    return `تم إرسال إجاباتك واستلام رد التصحيح لامتحان ${submission.exam_title}.`;
  }
  if (submission.correction_status === 'partial') return `تم استلام تصحيح بعض إجابات ${submission.exam_title}، وبقيت إجابات لم يصل ردها.`;
  if (submission.correction_status === 'skipped') return `تم حفظ محاولة ${submission.exam_title} بدون إجابات للتصحيح.`;
  return `تم حفظ إجابات ${submission.exam_title}، لكن لم تصل نتيجة التصحيح بعد.`;
}

function notifyChapterExamResult(submission: ChapterSubmission) {
  const detail: ChapterExamNotificationDetail = {
    id: `chapter-exam-result-${submission.id}`,
    title: 'نتيجة الامتحان',
    message: buildResultMessage(submission),
    submittedAt: submission.submitted_at,
  };
  window.dispatchEvent(new CustomEvent<ChapterExamNotificationDetail>('chapter-exam-result', { detail }));
}

const ExamPreview: React.FC<{ exam: CurriculumExamRecord; subjectName: string; onClose: () => void }> = ({ exam, subjectName, onClose }) => {
  const questions = examQuestions(exam.payload);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [pageTurnDirection, setPageTurnDirection] = useState<1 | -1>(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const [submitState, setSubmitState] = useState<'idle' | 'confirming' | 'processing' | 'completed' | 'error'>('idle');
  const [processingPhase, setProcessingPhase] = useState(0);
  const [submitMessage, setSubmitMessage] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [images, setImages] = useState<Record<number, string>>({});
  const activeQuestion = questions[activeQuestionIndex];
  const activePart = activeQuestion?.parts[activePartIndex];
  const examDate = typeof exam.payload.exam_date === 'string'
    ? exam.payload.exam_date
    : typeof exam.payload.date === 'string'
      ? exam.payload.date
      : typeof exam.payload.year === 'string'
        ? exam.payload.year
        : '';
  const examRound = typeof exam.payload.round === 'string'
    ? exam.payload.round
    : typeof exam.payload.dawr === 'string'
      ? exam.payload.dawr
      : '';
  const answerKey = activeQuestionIndex * 100 + activePartIndex;
  const partStyles = [
    { card: 'border-sky-300 bg-sky-50/35', question: 'bg-sky-50 text-sky-950' },
    { card: 'border-emerald-300 bg-emerald-50/35', question: 'bg-emerald-50 text-emerald-950' },
    { card: 'border-amber-300 bg-amber-50/35', question: 'bg-amber-50 text-amber-950' },
    { card: 'border-violet-300 bg-violet-50/35', question: 'bg-violet-50 text-violet-950' },
    { card: 'border-rose-300 bg-rose-50/35', question: 'bg-rose-50 text-rose-950' },
  ];
  const activePartStyle = partStyles[activePartIndex % partStyles.length];

  useEffect(() => {
    setActiveQuestionIndex(0);
    setActivePartIndex(0);
    setPageTurnDirection(1);
    setTouchStartX(null);
    setTouchDeltaX(0);
    setSubmitState('idle');
    setProcessingPhase(0);
    setSubmitMessage('');
    setAnswers({});
    setImages({});
  }, [exam.id]);

  useEffect(() => {
    if (submitState !== 'processing') return undefined;
    const timer = window.setInterval(() => {
      setProcessingPhase((current) => (current + 1) % 4);
    }, 1200);
    return () => window.clearInterval(timer);
  }, [submitState]);

  const handleImageSelected = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') return;
      setImages((current) => ({
        ...current,
        [answerKey]: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const openQuestion = (index: number) => {
    setActiveQuestionIndex(index);
    setActivePartIndex(0);
    setTouchDeltaX(0);
  };

  const turnPartPage = (direction: 1 | -1) => {
    if (!activeQuestion) return;
    const nextIndex = activePartIndex + direction;
    if (nextIndex < 0 || nextIndex >= activeQuestion.parts.length) return;
    setPageTurnDirection(direction);
    playPageFlipSound();
    setTouchDeltaX(0);
    setActivePartIndex(nextIndex);
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLElement>) => {
    if (touchStartX === null) return;
    const currentX = event.touches[0]?.clientX;
    if (typeof currentX !== 'number') return;
    const nextDelta = currentX - touchStartX;
    const canMoveForward = nextDelta < 0 && activePartIndex < (activeQuestion?.parts.length || 0) - 1;
    const canMoveBack = nextDelta > 0 && activePartIndex > 0;
    setTouchDeltaX(canMoveForward || canMoveBack ? Math.max(-120, Math.min(120, nextDelta)) : 0);
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    if (touchStartX === null) return;
    const endX = event.changedTouches[0]?.clientX;
    setTouchStartX(null);
    setTouchDeltaX(0);
    if (typeof endX !== 'number') return;
    const distance = touchStartX - endX;
    if (Math.abs(distance) < 45) return;
    turnPartPage(distance > 0 ? 1 : -1);
  };

  const flipForward = () => {
    if (!activeQuestion) return;
    const hasNextPart = activePartIndex < activeQuestion.parts.length - 1;
    if (hasNextPart) {
      turnPartPage(1);
      return;
    }
    if (activeQuestionIndex < questions.length - 1) {
      setPageTurnDirection(1);
      playPageFlipSound();
      setActiveQuestionIndex((current) => current + 1);
      setActivePartIndex(0);
    }
  };

  const requestSubmit = () => {
    if (submitState !== 'idle' && submitState !== 'error') return;
    setSubmitState('confirming');
    setSubmitMessage('');
  };

  const confirmSubmission = async () => {
    const submittedAt = new Date().toISOString();
    const entries = questions.flatMap((question, questionIndex) => question.parts.map((part, partIndex) => {
      const key = questionIndex * 100 + partIndex;
      return {
        question: question.title,
        part: part.title,
        prompt: part.text,
        answer: answers[key] || '',
        image: images[key] || '',
        modelAnswer: part.answer,
      };
    }));
    const submission: ChapterSubmission = {
      id: `submission_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
      exam_id: exam.id,
      exam_title: exam.title,
      subject_id: exam.subject_id,
      subject_name: subjectName,
      chapter_number: exam.chapter_number,
      submitted_at: submittedAt,
      entries,
    };

    setSubmitState('processing');
    setProcessingPhase(0);
    try {
      localStorage.setItem(examSubmissionKey(exam.id), JSON.stringify(submission));
      localStorage.setItem('chapter-exam-submission:last', JSON.stringify(submission));
      const correction = await correctChapterExamSubmission(submission);
      const finalSubmission: ChapterSubmission = {
        ...submission,
        correction_status: correction.status,
        correction_endpoint: correction.endpoint,
        correction_result: correction.result,
        correction_error: 'error' in correction ? correction.error : undefined,
      };
      localStorage.setItem(examSubmissionKey(exam.id), JSON.stringify(finalSubmission));
      localStorage.setItem('chapter-exam-submission:last', JSON.stringify(finalSubmission));
      const { error } = await supabase.from('curriculum_exam_submissions').insert({
        exam_id: exam.id,
        subject_id: exam.subject_id,
        chapter_number: exam.chapter_number,
        payload: finalSubmission,
        submitted_at: submittedAt,
      });
      if (error) {
        setSubmitMessage('تم إرسال الإجابات واستلام الرد، لكن حفظ السحابة غير مفعّل حالياً.');
      } else if (correction.status === 'completed') {
        setSubmitMessage('تم إرسال إجاباتك واستلام نتيجة التصحيح وحفظها.');
      } else if (correction.status === 'partial') {
        setSubmitMessage('تم إرسال الإجابات، ووصل تصحيح بعض الإجابات فقط.');
      } else if (correction.status === 'skipped') {
        setSubmitMessage('تم حفظ المحاولة، لكن لا توجد إجابات للتصحيح.');
      } else {
        setSubmitMessage('تم حفظ الإجابات، لكن تعذر استلام نتيجة التصحيح من مسارات API.');
      }
      notifyChapterExamResult(finalSubmission);
      setSubmitState('completed');
    } catch {
      setSubmitMessage('تم حفظ الإجابات على الجهاز، لكن تعذر الاتصال بالحفظ الخارجي.');
      setSubmitState('error');
    }
  };

  const submittedCount = Object.values(answers).filter((answer): answer is string => typeof answer === 'string' && answer.trim().length > 0).length + Object.keys(images).length;
  const processingMessages = ['جاري إرسال الإجابات', 'جاري استقبال الرد', 'جاري تصحيح الإجابات', 'جاري حفظ النتيجة'];

  return (
    <div className="fixed inset-0 z-[80] flex items-stretch justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-3" dir="rtl">
      <div className="relative flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden border border-slate-200 bg-stone-50 text-slate-950 shadow-2xl sm:h-[92vh] sm:rounded-2xl">
        <header className="border-b border-slate-200 bg-white px-4 py-3 text-[11px] font-bold text-slate-700">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 text-right">
              <p>جمهورية العراق - وزارة التربية</p>
              <p className="mt-1 text-slate-500">{subjectName}</p>
            </div>
            <div className="min-w-0 flex-1" aria-hidden="true" />
            <button type="button" onClick={onClose} className="shrink-0 rounded-full border border-slate-200 bg-slate-100 p-2 text-slate-700 shadow-sm" aria-label="خروج من الامتحان">
              <X className="h-4 w-4" />
            </button>
          </div>
          {(examDate || examRound) && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[10px] text-slate-500">
              {examDate && <span>التاريخ: {examDate}</span>}
              {examRound && <span>الدور: {examRound}</span>}
            </div>
          )}
        </header>

        {questions.length > 0 && (
          <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-stone-100 px-3 py-2" aria-label="التنقل بين أسئلة الامتحان">
            {questions.map((question, index) => {
              const isActive = index === activeQuestionIndex;
              return (
                <button
                  key={`exam-question-tab-${index}`}
                  type="button"
                  onClick={() => openQuestion(index)}
                  className={`shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-black transition ${
                    isActive
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'
                  }`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {question.title || `س${index + 1}`}
                </button>
              );
            })}
          </nav>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
          {questions.length === 0 ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-800">تم حفظ الملف، لكن صيغة الأسئلة تحتاج مراجعة قبل العرض التفاعلي.</p>
          ) : activeQuestion && activePart && (
            <article
              key={`${activeQuestionIndex}-${activePartIndex}`}
              style={{
                '--page-drag-x': `${touchDeltaX * 0.18}px`,
                '--page-drag-rotate': `${touchDeltaX * -0.16}deg`,
              } as React.CSSProperties}
              className={`exam-page-turn ${touchStartX !== null ? 'exam-page-dragging' : pageTurnDirection === 1 ? 'exam-page-turn-next' : 'exam-page-turn-prev'} flex min-h-full flex-col rounded-xl border-2 p-4 text-right shadow-sm ${activePartStyle.card}`}
            >
              <div className="mb-2 flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-slate-950">{activeQuestion.title} - الفرع {activePart.title}</h3>
                {activeQuestion.parts.length > 1 && (
                  <button
                    type="button"
                    onClick={flipForward}
                    className="shrink-0 rounded-full bg-white/90 px-3 py-1 text-[10px] font-black text-slate-700 shadow-sm transition hover:bg-slate-950 hover:text-white"
                  >
                    اقلب الصفحة
                  </button>
                )}
              </div>
              <div
                onTouchStart={(event) => {
                  setTouchStartX(event.touches[0]?.clientX ?? null);
                  setTouchDeltaX(0);
                }}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                className="exam-page-sheet rounded-xl"
              >
                <p className={`whitespace-pre-line rounded-xl p-3 text-sm leading-6 ${activePartStyle.question}`}>{activePart.text}</p>
              </div>
              <div
                className="mt-5 border-t border-slate-100 pt-4"
                onTouchStart={(event) => event.stopPropagation()}
                onTouchMove={(event) => event.stopPropagation()}
                onTouchEnd={(event) => event.stopPropagation()}
              >
                <label className="text-xs font-black text-slate-600" htmlFor={`exam-answer-${exam.id}-${answerKey}`}>
                  الجواب
                </label>
                <textarea
                  id={`exam-answer-${exam.id}-${answerKey}`}
                  value={answers[answerKey] || ''}
                  onChange={(event) => setAnswers((current) => ({ ...current, [answerKey]: event.target.value }))}
                  className="mt-2 min-h-32 w-full resize-y rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-7 outline-none focus:border-sky-400 focus:bg-white"
                  placeholder="اكتب جوابك بدون أن تظهر الإجابة النموذجية للطالب..."
                  onTouchStart={(event) => event.stopPropagation()}
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-slate-950 px-3 py-2 text-xs font-black text-white" onTouchStart={(event) => event.stopPropagation()}>
                    <Camera className="h-4 w-4" />
                    رفع صورة للإجابة
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) handleImageSelected(file);
                        event.target.value = '';
                      }}
                    />
                  </label>
                  {images[answerKey] && (
                    <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                      <ImageIcon className="h-4 w-4" />
                      تم رفع صورة
                    </span>
                  )}
                </div>
                {images[answerKey] && (
                  <img src={images[answerKey]} alt="معاينة إجابة الطالب" className="mt-3 max-h-48 w-full rounded-xl border border-slate-200 object-contain" />
                )}
                <button
                  type="button"
                  onClick={requestSubmit}
                  disabled={submitState === 'processing' || submitState === 'completed'}
                  className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700"
                >
                  {submitState === 'processing' ? 'جاري رفع الإجابات...' : 'رفع الإجابات'}
                </button>
                {(submitState === 'completed' || submitState === 'error') && submitMessage && (
                  <p className={`mt-2 rounded-xl px-3 py-2 text-xs font-black ${submitState === 'completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
                    {submitMessage}
                  </p>
                )}
              </div>
            </article>
          )}
        </div>
        {submitState === 'confirming' && (
          <div className="absolute inset-0 z-[90] flex items-center justify-center bg-black/45 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 text-right shadow-2xl">
              <h3 className="text-base font-black text-slate-950">تأكيد إرسال الإجابات</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                سيتم إرسال {submittedCount} إجابة. يمكنك الرجوع الآن وتعديل الإجابة قبل الإرسال النهائي.
              </p>
              <div className="mt-5 flex gap-2">
                <button type="button" onClick={() => setSubmitState('idle')} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700">
                  تعديل الإجابات
                </button>
                <button type="button" onClick={confirmSubmission} className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white">
                  تأكيد الإرسال
                </button>
              </div>
            </div>
          </div>
        )}
        {(submitState === 'processing' || submitState === 'completed') && (
          <div className="absolute inset-0 z-[90] flex items-center justify-center bg-white/95 p-5 text-center">
            <div className="w-full max-w-sm rounded-2xl border border-slate-100 bg-white p-6 shadow-xl">
              {submitState === 'processing' ? (
                <>
                  <Loader2 className="mx-auto h-9 w-9 animate-spin text-emerald-600" />
                  <h3 className="mt-4 text-lg font-black text-slate-950">{processingMessages[processingPhase]}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">ابقَ قليلا، ستظهر صفحة النتيجة بعد اكتمال الإرسال.</p>
                </>
              ) : (
                <>
                  <Award className="mx-auto h-10 w-10 text-emerald-600" />
                  <h3 className="mt-4 text-lg font-black text-slate-950">تم إرسال إجاباتك</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{submitMessage || 'تم تسجيل نتيجة الامتحان.'}</p>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-5 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white"
                  >
                    خروج
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ChapterExamIcons: React.FC<ChapterExamIconsProps> = ({ subjectId, subjectName, chapterNumber, className }) => {
  const [monthly, setMonthly] = useState<CurriculumExamRecord[]>([]);
  const [ministry, setMinistry] = useState<CurriculumExamRecord[]>([]);
  const [selected, setSelected] = useState<CurriculumExamRecord | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const loadBank = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const bank = await fetchChapterExamBank(subjectId, chapterNumber);
      setMonthly(bank.monthly);
      setMinistry(bank.ministry);
      return bank;
    } catch (error) {
      setLoadError('تعذر تحميل الامتحانات حالياً. حاول مرة أخرى.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const openExamPicker = async () => {
    setIsPickerOpen(true);
    if (!monthly.length && !ministry.length && !isLoading) {
      try {
        await loadBank();
      } catch {
        // The picker remains open and shows the friendly error message.
      }
    }
  };

  const readableExams = (exams: CurriculumExamRecord[]) => exams.filter((exam) => questionEntries(exam.payload).length > 0);

  const openRandomExam = (exams: CurriculumExamRecord[]) => {
    const randomExam = chooseRandomExam(readableExams(exams));
    if (randomExam) {
      setSelected(randomExam);
      setIsPickerOpen(false);
    }
  };

  const renderExamColumn = (
    title: string,
    description: string,
    exams: CurriculumExamRecord[],
    emptyMessage: string,
    accentClass: string,
  ) => (
    <section className="flex min-h-0 flex-1 flex-col">
      <div className="mb-3">
        <p className={`text-[11px] font-black ${accentClass}`}>{description}</p>
        <h3 className="text-lg font-black text-white">{title}</h3>
      </div>
      {readableExams(exams).length > 0 && (
        <button type="button" onClick={() => openRandomExam(exams)} className="mb-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 p-3 text-xs font-black text-slate-950 transition hover:bg-amber-300">
          <Shuffle className="h-4 w-4" />
          اختيار عشوائي
        </button>
      )}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain pr-1">
        {isLoading ? (
          <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-xs font-bold leading-6 text-white/60">جاري تحميل الامتحانات...</p>
        ) : loadError ? (
          <p className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-center text-xs font-bold leading-6 text-red-100">{loadError}</p>
        ) : exams.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-xs font-bold leading-6 text-white/60">{emptyMessage}</p>
        ) : exams.map((exam) => {
          const questionCount = questionEntries(exam.payload).length;
          const isReadable = questionCount > 0;
          return (
            <button
              key={exam.id}
              type="button"
              onClick={() => {
                if (!isReadable) return;
                setSelected(exam);
                setIsPickerOpen(false);
              }}
              disabled={!isReadable}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-right transition hover:bg-sky-500/15 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span className="min-w-0">
                <span className="block truncate text-xs font-black leading-6 text-white">{exam.title}</span>
                <span className="block text-[10px] font-bold text-white/55">
                  {isReadable ? `${questionCount} سؤال` : 'صيغة غير مقروءة'}
                </span>
              </span>
              <ChevronLeft className="h-4 w-4 shrink-0 text-sky-300" />
            </button>
          );
        })}
      </div>
    </section>
  );

  return (
    <>
      <div className={`${className || 'absolute left-3 top-3'} z-40 flex items-center gap-2`} dir="rtl">
        <button type="button" onClick={openExamPicker} disabled={isLoading} className="group flex items-center gap-2 rounded-2xl border border-amber-200/50 bg-amber-400 px-3 py-2 text-right text-[11px] font-black text-slate-950 shadow-xl transition hover:scale-[1.03] disabled:opacity-60" aria-label={`الامتحان الشهري للفصل ${chapterNumber}`}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpenCheck className="h-4 w-4" />}
          <span>الامتحان الشهري</span>
        </button>
        <button type="button" onClick={openExamPicker} disabled={isLoading} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-200/50 bg-sky-500 text-white shadow-xl transition hover:scale-[1.03] disabled:opacity-60" aria-label="الامتحانات الوزارية">
          <Award className="h-5 w-5" />
        </button>
      </div>

      {isPickerOpen && !selected && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm" dir="rtl">
          <div className="flex h-[86vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-slate-950 text-white shadow-2xl">
            <header className="flex items-center justify-between border-b border-white/10 p-4">
              <div>
                <p className="text-[10px] font-bold text-sky-300">{subjectName}</p>
                <h2 className="text-base font-black">اختر نموذج الامتحان</h2>
              </div>
              <button type="button" onClick={() => setIsPickerOpen(false)} className="rounded-full bg-white/10 p-2" aria-label="خروج">
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="grid min-h-0 flex-1 grid-cols-[1fr_auto_1fr] gap-3 p-4">
              {renderExamColumn(
                'شهري',
                'نماذج الفصل المتوفرة',
                monthly,
                'لا توجد امتحانات شهرية لهذا الفصل حاليًا.',
                'text-amber-300',
              )}
              <div className="w-px bg-white/10" aria-hidden="true" />
              {renderExamColumn(
                'وزاري',
                'أسئلة السنوات والأدوار',
                ministry,
                'لا توجد امتحانات وزارية لهذا الموضوع حاليًا.',
                'text-sky-300',
              )}
            </div>
          </div>
        </div>
      )}
      {selected && <ExamPreview exam={selected} subjectName={subjectName} onClose={() => setSelected(null)} />}
    </>
  );
};
