import React, { useEffect, useState } from 'react';
import { Award, CalendarDays, Camera, CheckCircle2, ChevronLeft, DoorOpen, FileText, GraduationCap, ImageIcon, Loader2, Sparkles, X } from 'lucide-react';
import { CurriculumExamIndexRecord, CurriculumExamRecord, fetchChapterExamBank, fetchExamById } from '../services/examBankService';
import { supabase } from '../lib/supabase';
import { getMinistryExamReward, getMonthlyExamReward } from '../services/pointsService';
import { releaseFailedExamAttempt, reserveExamAttempt } from '../services/examQuotaService';
import { NotificationExamResult } from '../types';
import { ExamResultDetailsModal } from './ExamResultDetailsModal';

interface ChapterExamIconsProps {
  subjectId: string;
  subjectName: string;
  chapterNumber: number;
  className?: string;
  onScoreUpdate?: (points: number) => void;
  openPickerRequest?: number;
}

type QuestionEntry = { title: string; text: string; answer?: string };
type ExamQuestion = { title: string; parts: QuestionEntry[] };
type SubmissionEntry = {
  question: string;
  part: string;
  prompt: string;
  answer: string;
  image: string;
  hasImage?: boolean;
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
  examResult: NotificationExamResult;
};

const ANSWER_KEY_PATTERN = /answer|model_answer|solution|جواب|اجابة|إجابة|حل/i;
const QUESTION_KEY_PATTERN = /question|prompt|content|body|^q\d*$|^س\d*$/i;
const IGNORED_KEY_PATTERN = /raw_text|raw|json|metadata|lesson_ids|question_type|type|exam_type|source|id|title|section|instructions|marks?|date|year|round|dawr|chapter|subject/i;
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
  const questionMatch = clean.match(/^question\s*(\d+)$/i);
  if (questionMatch) return `س${questionMatch[1]}`;
  const branchMatch = clean.match(/^branch\s*(.*)$/i);
  if (branchMatch) return `الفرع ${branchMatch[1] || ''}`.trim();
  const partMatch = clean.match(/^part\s*(.*)$/i);
  if (partMatch) return `الفرع ${partMatch[1] || ''}`.trim();
  return clean || 'سؤال';
}

function displayPartTitle(value: string, fallback: string) {
  const raw = titleFromKey(value || fallback).replace(/^س[٠-٩0-9]+$/, 'المطلوب');
  const marker = raw.replace(/^الفرع\s*/i, '').trim();
  const arabicMarkers: Record<string, string> = {
    a: 'أ',
    b: 'ب',
    c: 'ج',
    d: 'د',
  };
  return arabicMarkers[marker.toLowerCase()] || marker || 'المطلوب';
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
    // Some imported text files contain one valid JSON value followed by source
    // notes. Recover only the first balanced JSON object/array.
    const opening = text[0];
    const closing = opening === '{' ? '}' : ']';
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === '"') inString = false;
        continue;
      }
      if (char === '"') {
        inString = true;
        continue;
      }
      if (char === opening) depth += 1;
      else if (char === closing) {
        depth -= 1;
        if (depth === 0) {
          try {
            return JSON.parse(text.slice(0, index + 1));
          } catch {
            return value;
          }
        }
      }
    }
    return value;
  }
}

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function firstText(obj: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const text = cleanText(obj[key]);
    if (text) return text;
  }
  return '';
}

function formatQuestionItem(item: unknown, index: number) {
  if (typeof item === 'string') return `${index + 1}. ${item.trim()}`;
  if (!item || typeof item !== 'object' || Array.isArray(item)) return '';
  const obj = item as Record<string, unknown>;
  const label = cleanText(obj.label) || cleanText(obj.number) || cleanText(obj.id) || `${index + 1}`;
  const question = firstText(obj, ['question', 'question_text', 'question_body', 'question_part', 'title', 'text', 'prompt', 'content', 'body', 'instruction']);
  return question ? `${label}. ${question}` : '';
}

function formatQuestionPoint(item: unknown, index: number) {
  if (typeof item === 'string') return `${index + 1}. ${item.trim()}`;
  if (!item || typeof item !== 'object' || Array.isArray(item)) return '';
  const obj = item as Record<string, unknown>;
  const label = cleanText(obj.point_number) || cleanText(obj.label) || cleanText(obj.number) || `${index + 1}`;
  const question = firstText(obj, ['question', 'question_text', 'question_body', 'text', 'prompt', 'content', 'body', 'instruction']);
  return question ? `${label}. ${question}` : '';
}

function readBranch(value: unknown, fallbackTitle: string): QuestionEntry | null {
  if (typeof value === 'string') {
    const parsed = parseJsonString(value);
    if (parsed !== value) return readBranch(parsed, fallbackTitle);
    const branchText = value.trim();
    return branchText.length >= 4
      ? { title: displayPartTitle('', fallbackTitle), text: branchText }
      : null;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return readQuestion(value, fallbackTitle);
  const obj = value as Record<string, unknown>;
  const rawPoints = Array.isArray(obj.points) ? obj.points : [];
  const points = rawPoints.map(formatQuestionPoint).filter(Boolean);
  const title = displayPartTitle(firstText(obj, ['branch_label', 'branch', 'part', 'label', 'title']), fallbackTitle);
  const heading = firstText(obj, ['question', 'question_text', 'question_body', 'question_part', 'text', 'prompt', 'content', 'body', 'instruction', 'title']);
  // Some imported exams store the model answer as a plain string list in
  // `points`. It must feed correction, never appear inside the student's prompt.
  const plainTextPoints = rawPoints.length > 0 && rawPoints.every((point) => typeof point === 'string');
  const pointsArePrompts = plainTextPoints && (
    rawPoints.some((point) => /^\s*[٠-٩0-9]+[.)-]/.test(String(point)))
    || /(?:استخرج|علل|صوّب|صوب|أنشئ|اختر|مثّل|مثل|أعرب|حوّل|حول|النصوص الآتية|العبارات الآتية|ما يأتي)/i.test(heading)
  );
  if (pointsArePrompts) {
    return { title, text: [heading, ...rawPoints.map(formatQuestionPoint)].filter(Boolean).join('\n\n') };
  }
  if (plainTextPoints) {
    return {
      title,
      text: heading,
      answer: rawPoints.map((point, index) => `${index + 1}. ${String(point).trim()}`).join('\n'),
    };
  }
  if (points.length > 0) return { title, text: [heading, ...points].filter(Boolean).join('\n\n') };
  return readQuestion(value, fallbackTitle);
}

function examDisplayName(title: string, examKind: 'monthly' | 'ministry') {
  const normalized = title.replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
  const numericMatches = [...normalized.matchAll(/([0-9]+)/g)];
  const match = normalized.match(/set[_\s-]*([0-9]+)/i)
    || normalized.match(/(?:نموذج|امتحان)[^0-9]*([0-9]+)/i)
    || numericMatches[numericMatches.length - 1];
  const kindLabel = examKind === 'monthly' ? 'الامتحان الشهري' : 'الامتحان الوزاري';
  return match ? `${kindLabel} ${match[1]}` : kindLabel;
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
  const question = firstText(obj, ['question', 'question_text', 'question_body', 'question_part', 'instructions', 'text', 'prompt', 'content', 'body', 'instruction', 'heading']);
  const itemValues = Array.isArray(obj.items)
    ? obj.items
    : obj.items && typeof obj.items === 'object'
      ? Object.values(obj.items as Record<string, unknown>)
      : [];
  const items = itemValues.map(formatQuestionItem).filter(Boolean);
  const itemAnswers = itemValues.flatMap((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return [];
    const itemObj = item as Record<string, unknown>;
    const itemAnswer = firstText(itemObj, ['answer', 'model_answer', 'solution', 'correct_answer']);
    return itemAnswer ? [`${index + 1}. ${itemAnswer}`] : [];
  });
  const answer = obj.answer || obj.model_answer || (itemAnswers.length > 0 ? itemAnswers.join('\n') : undefined);
  if (!question && items.length === 0) return null;
  const text = [question, ...items].join('\n\n');
  const entryTitle = displayPartTitle(firstText(obj, ['branch_label', 'branch', 'part', 'label']), title);
  return { title: entryTitle, text, answer: typeof answer === 'string' ? answer : undefined };
}

function readQuestionParts(value: unknown, fallbackTitle: string): QuestionEntry[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const obj = value as Record<string, unknown>;
  const branches = readPartCollection(obj.branches);
  if (branches.length > 0) return branches;
  const nestedParts = readPartCollection(obj.parts);
  if (nestedParts.length > 0) return nestedParts;
  const nestedSubQuestions = readPartCollection(obj.sub_questions);
  if (nestedSubQuestions.length > 0) return nestedSubQuestions;
  const nestedQuestions = readPartCollection(obj.questions);
  if (nestedQuestions.length > 0) return nestedQuestions;
  const entry = readQuestion(value, fallbackTitle);
  if (entry) return [entry];
  const keyedBranches = Object.entries(obj)
    .filter(([key, branchValue]) =>
      !IGNORED_KEY_PATTERN.test(key)
      && !isAnswerKey(key)
      && Boolean(branchValue)
      && (typeof branchValue === 'object' || typeof branchValue === 'string')
    )
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
  const groupedByNumber: ExamQuestion[] = [];
  entries.forEach((entry) => {
    const number = questionNumber(entry.title);
    const previous = groupedByNumber[groupedByNumber.length - 1];
    if (number !== null && previous && questionNumber(previous.title) === number) {
      previous.parts.push(...entry.parts);
    } else {
      groupedByNumber.push({ title: entry.title, parts: [...entry.parts] });
    }
  });
  if (groupedByNumber.length < entries.length) return groupedByNumber;
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
        const rawTitle = cleanText(itemObj?.question_number);
        const title = rawTitle ? (/^\d+$/.test(rawTitle) ? `س${rawTitle}` : titleFromKey(rawTitle)) : `س${index + 1}`;
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

function dataUrlToFile(dataUrl: string, fileName: string) {
  const [header, base64] = dataUrl.split(',');
  const mimeType = header.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
  const binary = window.atob(base64 || dataUrl);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new File([bytes], fileName, { type: mimeType });
}

function loadImageFromDataUrl(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('تعذر قراءة الصورة.'));
    image.src = dataUrl;
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('تعذر تحويل الصورة.'));
    };
    reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة.'));
    reader.readAsDataURL(file);
  });
}

async function compressAnswerImage(file: File) {
  const originalDataUrl = await readFileAsDataUrl(file);
  const image = await loadImageFromDataUrl(originalDataUrl);
  const maxSide = 1600;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return originalDataUrl;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.86);
}

function stripImagesForStorage(submission: ChapterSubmission): ChapterSubmission {
  return {
    ...submission,
    entries: submission.entries.map((entry) => ({
      ...entry,
      image: '',
      hasImage: Boolean(entry.image || entry.hasImage),
    })),
  };
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

function textFromCorrectionResult(value: unknown): string {
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return '';
  const obj = value as Record<string, unknown>;
  const direct = [
    obj.feedback,
    obj.explanation,
    obj.correction,
    obj.mistakes,
    obj.errors,
    obj.output,
    obj.text,
    obj.extractedText,
    obj.message,
  ].filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).join(' ');
  if (direct) return direct;
  for (const child of Object.values(obj)) {
    const nested = textFromCorrectionResult(child);
    if (nested) return nested;
  }
  return '';
}

function inferScoreFromCorrectionText(text: string): number | null {
  const normalized = text.trim();
  if (!normalized) return null;
  if (/غير صحيحة|غير صحيح|لا تحتوي|لم يتم تقديم|لا توجد إجابة|ليست إجابة|خاطئة|مختلف(?:ة|ين)|لا ترتبط|لا يتعلق|غير متعلق|لا علاقة/i.test(normalized)) return 0;
  if (/جزئي|جزئياً|جزئيا|ناقص/i.test(normalized)) return 50;
  if (/صحيحة|صحيح|دقيقة|ممتاز/i.test(normalized)) return 100;
  return null;
}

function normalizeCorrectionResult(result: unknown): unknown {
  if (!result || typeof result !== 'object' || Array.isArray(result)) return result;
  const obj = result as Record<string, unknown>;
  const nested = obj.result && typeof obj.result === 'object' && !Array.isArray(obj.result)
    ? obj.result as Record<string, unknown>
    : null;
  const target = nested || obj;
  const currentScore = findNumericValue(target, ['score', 'grade', 'points', 'درجة', 'الدرجة']);
  if (currentScore !== null) return result;
  const inferredScore = inferScoreFromCorrectionText(textFromCorrectionResult(target));
  if (inferredScore === null) return result;
  if (nested) {
    return { ...obj, result: { ...nested, score: inferredScore, inferred_score: true } };
  }
  return { ...obj, score: inferredScore, inferred_score: true };
}

async function correctSingleChapterExamEntry(submission: ChapterSubmission, entry: SubmissionEntry, index: number) {
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
    imageBase64: undefined,
    imageDataUrl: undefined,
    imageAnswer: undefined,
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
    prompt: answerPayload.question,
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

  const controllers: AbortController[] = [];
  const attempts = CHAPTER_EXAM_CORRECTION_ENDPOINTS.map(async (endpoint) => {
    const formData = new FormData();
    formData.append('payload', JSON.stringify(payload));
    if (entry.image) {
      const answerImageFile = dataUrlToFile(entry.image, `${answerPayload.question_id}.jpg`);
      formData.append(endpoint.includes('mmm-friend-ocr') ? 'image' : 'studentImage', answerImageFile);
    }
    const controller = new AbortController();
    controllers.push(controller);
    const timeout = window.setTimeout(() => controller.abort(), entry.image ? 90000 : 25000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      const result = await readCorrectionResponse(response);
      if (!response.ok) {
        throw new Error(`${endpoint} رفض الطلب برمز ${response.status}`);
      }
      return { status: 'completed', endpoint, question: entry.question, part: entry.part, result: normalizeCorrectionResult(result) };
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'تعذر الاتصال بمسار التصحيح.');
    } finally {
      window.clearTimeout(timeout);
    }
  });

  try {
    const result = await Promise.any(attempts);
    controllers.forEach((controller) => controller.abort());
    return result;
  } catch (error) {
    const lastError = error instanceof AggregateError
      ? error.errors.map((attemptError) => attemptError instanceof Error ? attemptError.message : String(attemptError)).join(' | ')
      : error instanceof Error ? error.message : 'تعذر الاتصال بمسارات التصحيح.';
    return { status: 'failed', endpoint: '', question: entry.question, part: entry.part, error: lastError };
  } finally {
    controllers.forEach((controller) => controller.abort());
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

  const results = await Promise.all(
    answeredEntries.map((entry, index) => correctSingleChapterExamEntry(submission, entry, index)),
  );

  const completedCount = results.filter((result) => result.status === 'completed').length;
  const percentages = results.flatMap((entryResult) => {
    if (entryResult.status !== 'completed' || !('result' in entryResult)) return [];
    const score = findNumericValue(entryResult.result, ['score', 'grade', 'points', 'درجة', 'الدرجة']);
    const total = findNumericValue(entryResult.result, ['totalScore', 'total_score', 'maxScore', 'max_score', 'المجموع']);
    if (score === null) return [];
    return [Math.max(0, Math.min(100, total && total > 0 ? Math.round((score / total) * 100) : Math.round(score)))];
  });
  const aggregate = percentages.length > 0
    ? { score: Math.round(percentages.reduce((sum, value) => sum + value, 0) / Math.max(1, submission.entries.length)), totalScore: 100, percentage: Math.round(percentages.reduce((sum, value) => sum + value, 0) / Math.max(1, submission.entries.length)) }
    : {};
  const result = { results, ...aggregate, correctedCount: completedCount, answeredCount: answeredEntries.length };
  if (completedCount === answeredEntries.length) return { status: 'completed' as const, endpoint: 'distributed', result };
  if (completedCount > 0) return { status: 'partial' as const, endpoint: 'distributed', result, error: 'تم تصحيح بعض الإجابات فقط.' };
  return { status: 'failed' as const, endpoint: '', result, error: 'تعذر تصحيح كل الإجابات عبر مسارات API.' };
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

function buildChapterExamResult(submission: ChapterSubmission): NotificationExamResult {
  const score = findNumericValue(submission.correction_result, ['score', 'grade', 'points', 'درجة', 'الدرجة']);
  const totalScore = findNumericValue(submission.correction_result, ['totalScore', 'total_score', 'maxScore', 'max_score', 'المجموع']);
  return {
    title: submission.exam_title,
    subject: submission.subject_name,
    completedAt: submission.submitted_at,
    score: score ?? undefined,
    totalScore: totalScore ?? undefined,
    percentage: score !== null && totalScore ? Math.round((score / totalScore) * 100) : undefined,
    summary: textFromCorrectionResult(submission.correction_result) || buildResultMessage(submission),
    answers: submission.entries.map((entry) => {
      const resultList = submission.correction_result && typeof submission.correction_result === 'object'
        ? (submission.correction_result as { results?: Array<{ question?: string; part?: string; result?: unknown }> }).results
        : undefined;
      const matchedResult = resultList?.find((item) => item.question === entry.question && item.part === entry.part)?.result;
      const entryScore = findNumericValue(matchedResult, ['score', 'grade', 'points', 'درجة', 'الدرجة']);
      const entryTotal = findNumericValue(matchedResult, ['totalScore', 'total_score', 'maxScore', 'max_score', 'المجموع']) || 100;
      const entryPercentage = entryScore === null ? null : Math.round((entryScore / Math.max(1, entryTotal)) * 100);
      return {
        label: [entry.question, entry.part].filter(Boolean).join(' — '),
        prompt: entry.prompt,
        userAnswer: entry.answer || (entry.hasImage ? 'إجابة بصورة مرفوعة' : 'لم تتم الإجابة'),
        modelAnswer: entry.modelAnswer,
        score: entryScore ?? undefined,
        maxScore: entryScore === null ? undefined : entryTotal,
        status: entryPercentage === null ? 'ungraded' as const : entryPercentage >= 90 ? 'correct' as const : entryPercentage <= 25 ? 'wrong' as const : 'partial' as const,
        feedback: textFromCorrectionResult(matchedResult) || undefined,
      };
    }),
  };
}

function notifyChapterExamResult(submission: ChapterSubmission, examResult = buildChapterExamResult(submission)) {
  const message = buildResultMessage(submission);
  const detail: ChapterExamNotificationDetail = {
    id: `chapter-exam-result-${submission.id}`,
    title: 'نتيجة الامتحان',
    message,
    submittedAt: submission.submitted_at,
    examResult,
  };
  window.dispatchEvent(new CustomEvent<ChapterExamNotificationDetail>('chapter-exam-result', { detail }));
}

const ExamPreview: React.FC<{ exam: CurriculumExamRecord; subjectName: string; examKind: 'monthly' | 'ministry'; onClose: () => void; onScoreUpdate?: (points: number) => void }> = ({ exam, subjectName, examKind, onClose, onScoreUpdate }) => {
  const questions = examQuestions(exam.payload);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [activePartIndex, setActivePartIndex] = useState(0);
  const [pageTurnDirection, setPageTurnDirection] = useState<1 | -1>(1);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const [submitState, setSubmitState] = useState<'idle' | 'confirming' | 'processing' | 'completed' | 'error'>('idle');
  const [processingPhase, setProcessingPhase] = useState(0);
  const [submitMessage, setSubmitMessage] = useState('');
  const [completedResult, setCompletedResult] = useState<NotificationExamResult | null>(null);
  const [isResultOpen, setIsResultOpen] = useState(false);
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
  const isPartAnswered = (questionIndex: number, partIndex: number) => {
    const key = questionIndex * 100 + partIndex;
    return Boolean(answers[key]?.trim() || images[key]);
  };
  const isQuestionAnswered = (questionIndex: number) => {
    const question = questions[questionIndex];
    return Boolean(question?.parts.length) && question.parts.every((_, partIndex) => isPartAnswered(questionIndex, partIndex));
  };
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

  const handleImageSelected = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const compressedImage = await compressAnswerImage(file);
      setImages((current) => ({
        ...current,
        [answerKey]: compressedImage,
      }));
    } catch {
      const fallbackImage = await readFileAsDataUrl(file);
      setImages((current) => ({
        ...current,
        [answerKey]: fallbackImage,
      }));
    }
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
      exam_title: examDisplayName(exam.title, examKind),
      subject_id: exam.subject_id,
      subject_name: subjectName,
      chapter_number: exam.chapter_number,
      submitted_at: submittedAt,
      entries,
    };

    const quota = await reserveExamAttempt(examKind, exam.id, submission.id);
    if (!quota.allowed) {
      setSubmitMessage(quota.message || 'لا يمكن بدء محاولة جديدة الآن.');
      setSubmitState('error');
      return;
    }

    setSubmitState('processing');
    setProcessingPhase(0);
    try {
      const pendingSubmission = stripImagesForStorage(submission);
      localStorage.setItem(examSubmissionKey(exam.id), JSON.stringify(pendingSubmission));
      localStorage.setItem('chapter-exam-submission:last', JSON.stringify(pendingSubmission));
      const correction = await correctChapterExamSubmission(submission);
      const storableSubmission = stripImagesForStorage(submission);
      const finalSubmission: ChapterSubmission = {
        ...storableSubmission,
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
      const score = findNumericValue(correction.result, ['score', 'grade', 'points', 'درجة', 'الدرجة']);
      if (score !== null && (correction.status === 'completed' || correction.status === 'partial')) {
        const attemptKey = `nahnu_maak:chapter-exam-attempt:v1:${exam.id}`;
        let attempt = 1;
        try {
          attempt = Math.max(1, Number.parseInt(localStorage.getItem(attemptKey) || '0', 10) + 1);
          localStorage.setItem(attemptKey, String(attempt));
        } catch {
          // The result still receives its first-attempt reward if browser storage is unavailable.
        }
        const reward = examKind === 'ministry'
          ? getMinistryExamReward(score, attempt)
          : getMonthlyExamReward(score, attempt);
        if (reward > 0) onScoreUpdate?.(reward);
      }
      const resultMessage = buildResultMessage(finalSubmission);
      if (error) {
        setSubmitMessage(`${resultMessage} تم عرض النتيجة هنا، لكن حفظ السحابة غير مفعّل حالياً.`);
      } else if (correction.status === 'completed') {
        setSubmitMessage(`${resultMessage} تم حفظ النتيجة في السحابة.`);
      } else if (correction.status === 'partial') {
        setSubmitMessage(resultMessage);
      } else if (correction.status === 'skipped') {
        setSubmitMessage('تم حفظ المحاولة، لكن لا توجد إجابات للتصحيح.');
      } else {
        setSubmitMessage('تم حفظ الإجابات، لكن تعذر استلام نتيجة التصحيح من مسارات API.');
      }
      const examResult = buildChapterExamResult(finalSubmission);
      setCompletedResult(examResult);
      notifyChapterExamResult(finalSubmission, examResult);
      setSubmitState('completed');
    } catch {
      await releaseFailedExamAttempt(submission.id);
      setSubmitMessage('تعذر إكمال الإرسال أو الحفظ. حاول مرة أخرى بصورة أوضح وأصغر.');
      setSubmitState('error');
    }
  };

  const answerStatus = questions.flatMap((question, questionIndex) => question.parts.map((part, partIndex) => {
    const key = questionIndex * 100 + partIndex;
    const hasText = Boolean(answers[key]?.trim());
    const hasImage = Boolean(images[key]);
    return {
      key,
      questionName: question.title || `السؤال ${questionIndex + 1}`,
      partName: part.title || `الفرع ${partIndex + 1}`,
      prompt: part.text,
      isAnswered: hasText || hasImage,
    };
  }));
  const submittedCount = answerStatus.filter((item) => item.isAnswered).length;
  const missingAnswers = answerStatus.filter((item) => !item.isAnswered);
  const processingMessages = ['جاري إرسال الإجابات', 'جاري استقبال الرد', 'جاري تصحيح الصور والنصوص', 'جاري حفظ النتيجة'];

  return (
    <div className="fixed inset-0 z-[80] flex items-stretch justify-center bg-black/65 p-0 backdrop-blur-sm sm:items-center sm:p-3" dir="rtl">
      <div className="relative flex h-[100dvh] w-full max-w-2xl flex-col overflow-hidden border border-slate-200 bg-stone-50 text-slate-950 shadow-2xl sm:h-[92vh] sm:rounded-2xl">
        <header className="border-b border-slate-200 bg-white px-4 py-3 text-[11px] font-bold text-slate-700">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 text-right">
              <p>جمهورية العراق - وزارة التربية</p>
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
          <nav className="border-b border-slate-200 bg-stone-100 px-3 py-2" aria-label="التنقل بين أسئلة وفروع الامتحان">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {questions.map((question, index) => {
                const isActive = index === activeQuestionIndex;
                const questionAnswered = isQuestionAnswered(index);
                return (
                  <div key={`exam-question-group-${index}`} className="shrink-0 rounded-2xl border border-violet-200 bg-violet-50/70 p-1.5">
                    <button
                      type="button"
                      onClick={() => openQuestion(index)}
                      className={`flex w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-1.5 text-[11px] font-black transition ${
                        questionAnswered
                          ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                          : isActive
                            ? 'border-slate-950 bg-slate-950 text-white'
                            : 'border-violet-300 bg-white text-violet-950 hover:border-violet-500'
                      }`}
                      aria-current={isActive ? 'step' : undefined}
                    >
                      {questionAnswered && <CheckCircle2 className="h-3.5 w-3.5" />}
                      {question.title || `س${index + 1}`}
                    </button>
                    {question.parts.length > 1 && (
                      <div className="mt-1 flex items-center justify-center gap-1">
                        {question.parts.map((part, partIndex) => {
                          const partAnswered = isPartAnswered(index, partIndex);
                          const partActive = isActive && partIndex === activePartIndex;
                          return (
                            <button
                              key={`exam-part-tab-${index}-${partIndex}`}
                              type="button"
                              onClick={() => {
                                setActiveQuestionIndex(index);
                                setActivePartIndex(partIndex);
                                setTouchDeltaX(0);
                              }}
                              className={`flex items-center gap-0.5 rounded-lg border px-2 py-1 text-[10px] font-black transition ${
                                partAnswered
                                  ? 'border-emerald-400 bg-emerald-100 text-emerald-700'
                                  : partActive
                                    ? 'border-violet-500 bg-violet-200 text-violet-950'
                                    : 'border-violet-200 bg-white text-violet-700 hover:border-violet-400'
                              }`}
                              aria-label={`${question.title || `السؤال ${index + 1}`} ${part.title || `الفرع ${partIndex + 1}`}`}
                            >
                              {partAnswered && <CheckCircle2 className="h-3 w-3" />}
                              {part.title || `فرع ${partIndex + 1}`}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
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
              className={`exam-page-turn exam-paper ${touchStartX !== null ? 'exam-page-dragging' : pageTurnDirection === 1 ? 'exam-page-turn-next' : 'exam-page-turn-prev'} flex min-h-full flex-col rounded-[1.35rem] border-2 p-5 text-right shadow-[0_10px_28px_rgba(111,86,42,.2)]`}
            >
              <div className="mb-3 flex items-center justify-between gap-3 border-b border-[#cbb98d]/70 pb-3">
                <h3 className="text-sm font-black text-[#594a2d]">
                  {activeQuestion.title}
                  {activeQuestion.parts.length > 1 ? ` - الفرع ${activePart.title}` : ''}
                </h3>
                {activeQuestion.parts.length > 1 && (
                  <button
                    type="button"
                    onClick={flipForward}
                    className="shrink-0 rounded-full border border-[#c8b57e] bg-[#fffaf0]/90 px-3 py-1 text-[10px] font-black text-[#66552f] shadow-sm transition hover:bg-[#66552f] hover:text-white"
                  >
                    صفحة {activePartIndex + 1} من {activeQuestion.parts.length}
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
                <p className="whitespace-pre-line rounded-xl border border-[#d8c99e]/80 bg-[#eee1bf]/70 p-4 text-sm leading-7 text-[#4d422c] shadow-inner">{activePart.text}</p>
              </div>
              <div
                className="mt-5 border-t border-[#cbb98d]/70 pt-4"
                onTouchStart={(event) => event.stopPropagation()}
                onTouchMove={(event) => event.stopPropagation()}
                onTouchEnd={(event) => event.stopPropagation()}
              >
                <label className="text-xs font-black text-[#66552f]" htmlFor={`exam-answer-${exam.id}-${answerKey}`}>
                  الجواب
                </label>
                <textarea
                  id={`exam-answer-${exam.id}-${answerKey}`}
                  value={answers[answerKey] || ''}
                  onChange={(event) => setAnswers((current) => ({ ...current, [answerKey]: event.target.value }))}
                  className="mt-2 min-h-32 w-full resize-y rounded-xl border border-[#d1c096] bg-[#fffaf0]/80 p-3 text-sm leading-7 text-[#403722] outline-none focus:border-[#a98b4f] focus:bg-white"
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
                      onChange={async (event) => {
                        const input = event.currentTarget;
                        const file = input.files?.[0];
                        if (file) await handleImageSelected(file);
                        input.value = '';
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
              {missingAnswers.length > 0 ? (
                <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-black text-amber-900">تنبيه: لم تجب عن {missingAnswers.length} من الأسئلة أو الفروع</p>
                  <p className="mt-1 text-[11px] leading-5 text-amber-800">يمكنك الإرسال رغم النقص، أو الرجوع لكتابة نص أو رفع صورة.</p>
                  <ul className="mt-2 max-h-44 space-y-1.5 overflow-y-auto pl-1">
                    {missingAnswers.map((item) => (
                      <li key={item.key} className="rounded-xl border border-amber-200/80 bg-white px-3 py-2">
                        <span className="block text-xs font-black text-slate-900">{item.questionName} — {item.partName}</span>
                        <span className="mt-0.5 block truncate text-[10px] text-slate-500">{item.prompt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">أجبت عن جميع الأسئلة والفروع.</div>
              )}
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
                  <p className="mt-2 text-sm leading-7 text-slate-600">تصحيح الصور قد يستغرق وقتا أطول. ابقَ في هذه الصفحة حتى تظهر النتيجة هنا.</p>
                  <button
                    type="button"
                    onClick={() => setProcessingPhase(2)}
                    className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-sm"
                  >
                    انتظار النتيجة وقت أطول
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-950 hover:text-white"
                  >
                    <DoorOpen className="h-4 w-4" />
                    خروج من الانتظار
                  </button>
                </>
              ) : (
                <>
                  <Award className="mx-auto h-10 w-10 text-emerald-600" />
                  <h3 className="mt-4 text-lg font-black text-slate-950">اكتمل تصحيح الامتحان</h3>
                  {completedResult?.score !== undefined && (
                    <div className="mt-4 rounded-2xl bg-gradient-to-l from-emerald-500 to-cyan-600 px-4 py-4 text-white shadow-lg">
                      <p className="text-xs font-bold text-white/80">النتيجة النهائية</p>
                      <p className="mt-1 text-3xl font-black" dir="ltr">{completedResult.score} / {completedResult.totalScore || 100}</p>
                      <p className="mt-1 text-sm font-black">%{completedResult.percentage ?? completedResult.score}</p>
                    </div>
                  )}
                  <p className="mt-2 text-sm leading-7 text-slate-600">{submitMessage || 'تم تسجيل نتيجة الامتحان.'}</p>
                  {completedResult && (
                    <button
                      type="button"
                      onClick={() => setIsResultOpen(true)}
                      className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-sm"
                    >
                      عرض النتيجة والتصحيح
                    </button>
                  )}
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
        <ExamResultDetailsModal result={isResultOpen ? completedResult : null} onClose={() => setIsResultOpen(false)} />
      </div>
    </div>
  );
};

const ExamSatellite = ({ loading }: { loading: boolean }) => (
  <span className="relative block h-24 w-28" aria-hidden="true">
    <span className="absolute inset-x-2 top-1/2 h-12 -translate-y-1/2 rounded-full bg-sky-400/20 blur-xl" />
    <span className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 items-center justify-center motion-safe:animate-[satelliteFloat_2.8s_ease-in-out_infinite]">
      <svg viewBox="0 0 150 82" className="h-16 w-28 drop-shadow-[0_8px_12px_rgba(56,189,248,.45)]">
        <rect x="58" y="27" width="34" height="28" rx="7" fill="#f8fafc" stroke="#38bdf8" strokeWidth="4" />
        <circle cx="75" cy="41" r="8" fill={loading ? '#fbbf24' : '#0ea5e9'} />
        <path d="M58 32 42 19M92 32l16-13" stroke="#e2e8f0" strokeWidth="4" />
        <path d="M8 20h36v42H8zM106 20h36v42h-36z" fill="#2563eb" stroke="#7dd3fc" strokeWidth="3" />
        <path d="M20 20v42M32 20v42M118 20v42M130 20v42M8 34h36M8 48h36M106 34h36M106 48h36" stroke="#bae6fd" strokeWidth="2" />
        <path d="M75 27V14" stroke="#f8fafc" strokeWidth="4" /><circle cx="75" cy="10" r="5" fill="#fbbf24" />
      </svg>
    </span>
    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-lg border border-amber-200 bg-amber-400 px-3 py-1 text-[11px] font-black text-slate-950 shadow-lg">امتحان</span>
  </span>
);

function ministryExamLabel(exam: CurriculumExamIndexRecord, index: number) {
  const source = `${exam.title || ''} ${exam.source_file || ''}`.replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
  const year = source.match(/(?:19|20)\d{2}/)?.[0];
  const roundMatch = source.match(/(?:الدور|دور|round)[\s_-]*(الأول|الثاني|الثالث|1|2|3)/i)?.[1];
  const round = roundMatch === '1' ? 'الأول' : roundMatch === '2' ? 'الثاني' : roundMatch === '3' ? 'الثالث' : roundMatch || 'الأول';
  return year ? `سنة ${year} — الدور ${round}` : `نموذج وزاري ${index + 1} — الدور ${round}`;
}

export const ChapterExamIcons: React.FC<ChapterExamIconsProps> = ({ subjectId, subjectName, chapterNumber, className, onScoreUpdate, openPickerRequest = 0 }) => {
  const [monthly, setMonthly] = useState<CurriculumExamIndexRecord[]>([]);
  const [ministry, setMinistry] = useState<CurriculumExamIndexRecord[]>([]);
  const [selected, setSelected] = useState<CurriculumExamRecord | null>(null);
  const [selectedKind, setSelectedKind] = useState<'monthly' | 'ministry'>('monthly');
  const [pickerCategory, setPickerCategory] = useState<'monthly' | 'ministry'>('monthly');
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

  useEffect(() => {
    if (openPickerRequest > 0) void openExamPicker();
    // The numeric request changes only when an external exam button is pressed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPickerRequest]);

  const openSelectedExam = async (exam: CurriculumExamIndexRecord) => {
    setIsLoading(true);
    setLoadError('');
    try {
      const fullExam = await fetchExamById(exam.id);
      if (questionEntries(fullExam.payload).length === 0) throw new Error('Unreadable exam');
      setSelectedKind(exam.exam_type);
      setSelected(fullExam);
      setIsPickerOpen(false);
    } catch {
      setLoadError('تعذر تحميل هذا الامتحان. حاول مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderExamList = (
    exams: CurriculumExamIndexRecord[],
    emptyMessage: string,
  ) => {
    const cardThemes = pickerCategory === 'monthly'
      ? [
          'from-sky-500/30 via-blue-600/20 to-indigo-500/30 border-sky-300/45 shadow-sky-500/15',
          'from-violet-500/30 via-fuchsia-600/15 to-purple-500/30 border-violet-300/45 shadow-violet-500/15',
          'from-cyan-500/30 via-teal-600/15 to-emerald-500/25 border-cyan-300/45 shadow-cyan-500/15',
          'from-rose-500/25 via-pink-600/15 to-orange-500/25 border-rose-300/40 shadow-rose-500/15',
        ]
      : [
          'from-amber-500/30 via-orange-600/20 to-yellow-500/25 border-amber-300/50 shadow-amber-500/15',
          'from-orange-500/30 via-red-600/15 to-amber-500/25 border-orange-300/45 shadow-orange-500/15',
          'from-yellow-500/25 via-amber-600/15 to-orange-500/25 border-yellow-300/45 shadow-yellow-500/15',
          'from-fuchsia-500/25 via-purple-600/15 to-amber-500/20 border-fuchsia-300/40 shadow-fuchsia-500/15',
        ];

    return (
      <section className="min-h-0 flex-1 overflow-hidden">
        <div className="h-full space-y-3 overflow-y-auto overscroll-contain px-1 pb-5 pt-1 custom-scrollbar">
        {isLoading ? (
          <div className="grid min-h-40 place-items-center rounded-3xl border border-white/10 bg-white/5"><Loader2 className="h-9 w-9 animate-spin text-cyan-300" /></div>
        ) : loadError ? (
          <p className="rounded-2xl border border-red-300/20 bg-red-500/10 p-4 text-center text-xs font-bold leading-6 text-red-100">{loadError}</p>
        ) : exams.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-xs font-bold leading-6 text-white/60">{emptyMessage}</p>
        ) : exams.map((exam, index) => {
          const displayName = exam.exam_type === 'monthly' ? `الامتحان ${index + 1}` : ministryExamLabel(exam, index);
          const theme = cardThemes[index % cardThemes.length];
          return (
            <button
              key={exam.id}
              type="button"
              onClick={() => openSelectedExam(exam)}
              disabled={isLoading}
              style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
              className={`exam-card-enter group relative flex min-h-[82px] w-full items-center gap-4 overflow-hidden rounded-[22px] border bg-gradient-to-l p-3.5 text-right shadow-lg transition duration-300 hover:-translate-y-0.5 hover:brightness-110 active:scale-[0.98] disabled:opacity-45 ${theme}`}
            >
              <span className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-white/90 via-cyan-300 to-transparent" />
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/25 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.2)] backdrop-blur-md transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-110">
                {exam.exam_type === 'monthly' ? <FileText className="h-6 w-6" /> : <GraduationCap className="h-7 w-7" />}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-black leading-7 text-white sm:text-base">{displayName}</span>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 bg-black/15 text-white/90 transition duration-300 group-hover:-translate-x-1 group-hover:bg-white/15">
                <ChevronLeft className="h-5 w-5" />
              </span>
              <span className="exam-card-shine pointer-events-none absolute inset-y-0 -right-1/3 w-1/3 skew-x-[-18deg] bg-gradient-to-l from-transparent via-white/15 to-transparent" />
            </button>
          );
        })}
        </div>
      </section>
    );
  };

  return (
    <>
      <div className={`${className || 'absolute left-3 top-3'} z-40`} dir="rtl">
        <style>{`@keyframes satelliteFloat{0%,100%{transform:translateY(-5px) rotate(-2deg)}50%{transform:translateY(7px) rotate(2deg)}}@keyframes examCardEnter{0%{opacity:0;transform:translateY(18px) scale(.96)}100%{opacity:1;transform:translateY(0) scale(1)}}@keyframes examCardShine{0%,65%{transform:translateX(0)}100%{transform:translateX(-440%)}}.exam-card-enter{animation:examCardEnter .48s cubic-bezier(.2,.8,.2,1) both}.exam-card-enter:hover .exam-card-shine{animation:examCardShine .8s ease-out}`}</style>
        <button type="button" onClick={openExamPicker} disabled={isLoading} className="group rounded-3xl transition hover:scale-105 disabled:opacity-60" aria-label={`فتح فهرس امتحانات الفصل ${chapterNumber}`}>
          <ExamSatellite loading={isLoading} />
        </button>
      </div>

      {isPickerOpen && !selected && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm" dir="rtl">
          <div className="relative flex h-[88vh] w-full max-w-xl flex-col overflow-hidden rounded-[30px] border border-cyan-300/25 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,.16),transparent_35%),linear-gradient(180deg,#07142f,#030817)] text-white shadow-[0_0_60px_rgba(14,165,233,.22)]">
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl" />
            <header className="relative flex items-center justify-between border-b border-white/10 px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-200 shadow-[0_0_22px_rgba(34,211,238,.18)]"><Sparkles className="h-6 w-6" /></span>
                <div>
                <p className="text-[10px] font-bold text-sky-300">{subjectName}</p>
                <h2 className="text-lg font-black">اختر نموذج الامتحان</h2>
                </div>
              </div>
              <button type="button" onClick={() => setIsPickerOpen(false)} className="rounded-2xl border border-white/10 bg-white/10 p-2.5 transition hover:rotate-90 hover:bg-white/15" aria-label="خروج">
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="relative flex min-h-0 flex-1 flex-col p-4">
              <div className="mb-4 grid grid-cols-2 gap-3" role="tablist" aria-label="نوع الامتحان">
                <button type="button" role="tab" aria-selected={pickerCategory === 'monthly'} onClick={() => setPickerCategory('monthly')} className={`group relative min-h-[88px] overflow-hidden rounded-[22px] border p-3 text-right transition duration-300 ${pickerCategory === 'monthly' ? 'scale-[1.02] border-violet-300/70 bg-gradient-to-l from-violet-600 to-indigo-600 shadow-[0_10px_30px_rgba(124,58,237,.35)]' : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10'}`}>
                  <CalendarDays className={`mb-2 h-7 w-7 transition group-hover:scale-110 ${pickerCategory === 'monthly' ? 'text-violet-100' : 'text-violet-300'}`} />
                  <span className="block text-base font-black">شهري</span>
                  {pickerCategory === 'monthly' && <span className="absolute bottom-0 right-4 h-1 w-12 rounded-t-full bg-white shadow-[0_0_12px_white]" />}
                </button>
                <button type="button" role="tab" aria-selected={pickerCategory === 'ministry'} onClick={() => setPickerCategory('ministry')} className={`group relative min-h-[88px] overflow-hidden rounded-[22px] border p-3 text-right transition duration-300 ${pickerCategory === 'ministry' ? 'scale-[1.02] border-amber-300/70 bg-gradient-to-l from-amber-500 to-orange-600 shadow-[0_10px_30px_rgba(245,158,11,.3)]' : 'border-white/10 bg-white/5 text-white/65 hover:bg-white/10'}`}>
                  <GraduationCap className={`mb-2 h-8 w-8 transition group-hover:-rotate-6 group-hover:scale-110 ${pickerCategory === 'ministry' ? 'text-amber-50' : 'text-amber-300'}`} />
                  <span className="block text-base font-black">وزاري</span>
                  {pickerCategory === 'ministry' && <span className="absolute bottom-0 right-4 h-1 w-12 rounded-t-full bg-white shadow-[0_0_12px_white]" />}
                </button>
              </div>
              {pickerCategory === 'monthly'
                ? renderExamList(monthly, 'لا توجد امتحانات شهرية لهذا الفصل حاليًا.')
                : renderExamList(ministry, 'لا توجد امتحانات وزارية لهذا الموضوع حاليًا.')}
            </div>
          </div>
        </div>
      )}
      {selected && <ExamPreview exam={selected} subjectName={subjectName} examKind={selectedKind} onScoreUpdate={onScoreUpdate} onClose={() => setSelected(null)} />}
    </>
  );
};
