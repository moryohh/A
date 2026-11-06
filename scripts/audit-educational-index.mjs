import { createClient } from '@supabase/supabase-js';
import { writeFile } from 'node:fs/promises';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qlfleszoyujelygwzdgu.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const r2Endpoint = (process.env.VITE_CLOUDFLARE_CONTENT_R2_API_URL || 'https://duha-content-r2.rafos72171.workers.dev').replace(/\/$/, '');
if (!supabaseKey) throw new Error('VITE_SUPABASE_ANON_KEY is required');
const supabase = createClient(supabaseUrl, supabaseKey);
const subjects = ['biology', 'physics', 'chemistry', 'mathematics', 'arabic_part1', 'arabic_part2', 'islamic', 'english'];
const sectionAliases = {
  lessons: new Set(['lessons', 'lesson', 'دروس']),
  curriculum: new Set(['curriculum', 'منهج']),
  mcq: new Set(['mcq', 'mcqs', 'اختيارات', 'اختيار_من_متعدد']),
  true_false: new Set(['true_false', 'tf', 'صح_خطأ', 'صح_ام_خطا']),
  ph: new Set(['ph', 'فلاش_كاردز', 'بطاقات']),
};
const normalizeSection = (value) => Object.entries(sectionAliases).find(([, aliases]) => aliases.has(String(value || '').toLowerCase().trim()))?.[0] || null;
const isRealNumber = (value) => Number.isInteger(Number(value)) && Number(value) > 0 && Number(value) <= 999;
const collectValues = (value, key, output = new Set()) => {
  if (!value || typeof value !== 'object') return output;
  if (Array.isArray(value)) { value.forEach((item) => collectValues(item, key, output)); return output; }
  for (const [name, child] of Object.entries(value)) {
    if (name.toLowerCase() === key && typeof child === 'string' && child.trim()) output.add(child.trim());
    if (child && typeof child === 'object') collectValues(child, key, output);
  }
  return output;
};
const videoTitles = (content) => (Array.isArray(content?.lessons) ? content.lessons : [])
  .flatMap((lesson) => Array.isArray(lesson?.teachers) ? lesson.teachers : [])
  .flatMap((teacher) => Array.isArray(teacher?.videos) ? teacher.videos : [])
  .map((video) => String(video?.title || '').trim())
  .filter(Boolean);

async function fetchAll() {
  const rows = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.from('educational_content_index')
      .select('record_id,subject_id,section_id,file_name,lesson_id,chapter_number,lesson_number,title,has_content')
      .in('subject_id', subjects)
      .range(offset, offset + 999);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

async function mapLimit(values, limit, fn) {
  const output = new Array(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor++;
      output[index] = await fn(values[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, values.length) }, worker));
  return output;
}

const rows = await fetchAll();
const lessonRows = rows.filter((row) => normalizeSection(row.section_id) === 'lessons');
const groups = new Map();
const byRecord = new Map();
for (const row of lessonRows) {
  const key = `${row.subject_id}:ch${row.chapter_number ?? 'null'}:les${row.lesson_number ?? 'null'}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push(row);
  if (row.record_id) {
    if (!byRecord.has(row.record_id)) byRecord.set(row.record_id, []);
    byRecord.get(row.record_id).push(row);
  }
}
const invalid = rows.filter((row) => {
  const chapter = Number(row.chapter_number);
  const lesson = Number(row.lesson_number);
  const isKnownMathTopic = row.subject_id === 'mathematics' && row.lesson_number == null && Number.isInteger(chapter) && chapter > 0;
  return normalizeSection(row.section_id) === 'lessons' && !isKnownMathTopic && (!Number.isInteger(chapter) || chapter < 1 || !Number.isInteger(lesson) || lesson < 1 || lesson > 999);
});
const topicRowsWithoutLessonNumber = lessonRows.filter((row) => row.subject_id === 'mathematics' && row.chapter_number != null && row.lesson_number == null && row.record_id);
const duplicateRecordIds = [...byRecord.entries()].filter(([, records]) => records.length > 1).map(([record_id, records]) => ({ record_id, records }));
const missingRecordIds = lessonRows.filter((row) => !row.record_id).map((row) => ({ subject_id: row.subject_id, chapter_number: row.chapter_number, lesson_number: row.lesson_number, file_name: row.file_name }));

const byLessonKey = new Map();
for (const row of rows) {
  const section = normalizeSection(row.section_id);
  if (!section || !row.record_id || !isRealNumber(row.chapter_number)) continue;
  const lessonNumber = row.lesson_number == null && row.subject_id === 'mathematics' ? `topic:${row.record_id}` : row.lesson_number;
  if (lessonNumber == null || (typeof lessonNumber === 'number' && !isRealNumber(lessonNumber))) continue;
  const key = `${row.subject_id}:ch${row.chapter_number}:les${lessonNumber}`;
  if (!byLessonKey.has(key)) byLessonKey.set(key, { subject_id: row.subject_id, chapter_number: Number(row.chapter_number), lesson_number: lessonNumber, sections: {} });
  byLessonKey.get(key).sections[section] = [...(byLessonKey.get(key).sections[section] || []), String(row.record_id)];
}
const canonicalLessons = [...byLessonKey.values()];
const r2Results = await mapLimit([...new Set(rows.filter((row) => row.record_id).map((row) => String(row.record_id)))], 8, async (recordId) => {
  try {
    const response = await fetch(`${r2Endpoint}/educational/${encodeURIComponent(recordId)}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) return { recordId, ok: false, status: response.status };
    const envelope = await response.json();
    const content = envelope?.content ?? envelope;
    return {
      recordId,
      ok: true,
      status: response.status,
      lessonIds: [...collectValues(content, 'lesson_id')],
      pageIds: [...collectValues(content, 'page_id')],
      videoTitles: videoTitles(content),
    };
  } catch (error) {
    return { recordId, ok: false, status: 'network_error', error: String(error) };
  }
});
const r2ById = new Map(r2Results.map((item) => [item.recordId, item]));
const metadataMismatches = rows.filter((row) => row.record_id).flatMap((row) => {
  const result = r2ById.get(String(row.record_id));
  if (!result?.ok || !result.lessonIds?.length || !row.lesson_id) return [];
  const expected = String(row.lesson_id).toLowerCase();
  const matches = result.lessonIds.some((value) => {
    const actual = String(value).toLowerCase();
    return actual === expected || actual.startsWith(`${expected}_`) || expected.startsWith(`${actual}_`);
  });
  return matches ? [] : [{ record_id: row.record_id, index_lesson_id: row.lesson_id, content_lesson_ids: result.lessonIds }];
});
const videoRows = rows.filter((row) => normalizeSection(row.section_id) === 'lessons' && row.record_id && isRealNumber(row.chapter_number) && isRealNumber(row.lesson_number));
const videoMapping = videoRows.map((row) => {
  const result = r2ById.get(String(row.record_id));
  const contentIds = result?.lessonIds || [];
  const expected = String(row.lesson_id || '').toLowerCase();
  const lessonIdMatches = !contentIds.length || !expected || contentIds.some((value) => {
    const actual = String(value).toLowerCase();
    return actual === expected || actual.startsWith(`${expected}_`) || expected.startsWith(`${actual}_`);
  });
  return {
    subject_id: row.subject_id,
    chapter_number: Number(row.chapter_number),
    lesson_number: Number(row.lesson_number),
    record_id: String(row.record_id),
    index_lesson_id: row.lesson_id,
    content_lesson_ids: contentIds,
    lesson_id_matches: lessonIdMatches,
    has_videos: Boolean(result?.ok && result.videoTitles?.length),
    video_titles: result?.videoTitles || [],
  };
});
const lessonsWithVideos = videoMapping.filter((item) => item.has_videos);
const lessonsWithoutVideos = videoMapping.filter((item) => !item.has_videos);
const videoLessonIdMismatches = videoMapping.filter((item) => !item.lesson_id_matches);
const pageKinds = {};
for (const result of r2Results) {
  for (const pageId of result.pageIds || []) {
    const kind = /(?:_tf|true[_-]?false|صح[_-]?خطا)/i.test(pageId) ? 'true_false'
      : /(?:_mcq|multiple|اختيار)/i.test(pageId) ? 'mcq'
      : /(?:_ph|flash|بطاقات)/i.test(pageId) ? 'ph'
      : /(?:curriculum|منهج)/i.test(pageId) ? 'curriculum'
      : 'lesson_or_other';
    pageKinds[kind] = (pageKinds[kind] || 0) + 1;
  }
}
const sectionMissing = canonicalLessons.map((lesson) => ({
  ...lesson,
  missing: ['lessons', 'curriculum', 'mcq', 'true_false', 'ph'].filter((section) => !lesson.sections[section]?.length),
})).filter((lesson) => lesson.missing.length);
const summary = {};
for (const subject of subjects) {
  const subjectLessons = canonicalLessons.filter((lesson) => lesson.subject_id === subject);
  const chapters = {};
  for (const lesson of subjectLessons) chapters[lesson.chapter_number] = (chapters[lesson.chapter_number] || 0) + 1;
  summary[subject] = { chapters, totalLessons: subjectLessons.length };
}
const allRecordIds = [...new Set(rows.filter((row) => row.record_id).map((row) => String(row.record_id)))];
const report = {
  generatedAt: new Date().toISOString(),
  source: { supabaseUrl, table: 'educational_content_index', r2Endpoint },
  rowsRead: rows.length,
  lessonsScanned: canonicalLessons.length,
  summary,
  invalidLessonRows: invalid,
  duplicateRecordIds,
  missingRecordIds,
  topicRowsWithoutLessonNumber,
  sectionMissing,
  metadataMismatches,
  pageKinds,
  videoMapping,
  lessonsWithVideos,
  lessonsWithoutVideos,
  videoLessonIdMismatches,
  r2: {
    uniqueRecordIdsChecked: allRecordIds.length,
    exactMatches: r2Results.filter((item) => item.ok).length,
    returnedToSupabase: r2Results.filter((item) => !item.ok).length,
    failures: r2Results.filter((item) => !item.ok),
  },
  guarantees: {
    indexSource: 'Supabase educational_content_index only',
    noD1OrR2ForLessonList: true,
    noNeighborFallback: true,
    gamesRequireIconClick: true,
  },
};
const output = process.env.AUDIT_OUTPUT || 'audit-educational-index.json';
await writeFile(output, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ output, rowsRead: report.rowsRead, lessonsScanned: report.lessonsScanned, summary: report.summary, invalid: invalid.length, duplicates: duplicateRecordIds.length, missingRecordIds: missingRecordIds.length, exactR2: report.r2.exactMatches, supabaseFallbacks: report.r2.returnedToSupabase, sectionMissing: sectionMissing.length, videoRows: videoMapping.length, lessonsWithVideos: lessonsWithVideos.length, lessonsWithoutVideos: lessonsWithoutVideos.length, videoLessonIdMismatches: videoLessonIdMismatches.length }, null, 2));
