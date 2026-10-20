const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qlfleszoyujelygwzdgu.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsZmxlc3pveXVqZWx5Z3d6ZGd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NjA0NDMsImV4cCI6MjEwMjAzNjQ0M30.2jZ1vh8O1VW_PzS6NlKAW1QDNHBW99IoHDwa2A7QVOI';
const SYNC_URL = process.env.CONTENT_SYNC_URL;
const SYNC_TOKEN = process.env.CONTENT_SYNC_TOKEN;
if (!SUPABASE_ANON_KEY || !SYNC_URL || !SYNC_TOKEN) throw new Error('Missing sync environment variables');

const headers = { apikey: SUPABASE_ANON_KEY, authorization: `Bearer ${SUPABASE_ANON_KEY}` };
async function table(name, select = '*', orderColumn = 'id') {
  const output = [];
  for (let from = 0; ; from += 500) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${name}?select=${encodeURIComponent(select)}&order=${encodeURIComponent(orderColumn)}.asc`, {
      headers: { ...headers, Range: `${from}-${from + 499}`, Prefer: 'count=exact' },
    });
    if (!response.ok) throw new Error(`${name}: ${response.status} ${await response.text()}`);
    const rows = await response.json();
    output.push(...rows);
    if (rows.length < 500) return output;
  }
}
async function post(path, payload) {
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    const response = await fetch(`${SYNC_URL}${path}`, {
      method: 'POST', headers: { authorization: `Bearer ${SYNC_TOKEN}`, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.ok) return response.json();
    const message = await response.text();
    if (![404, 429].includes(response.status) && response.status < 500) {
      throw new Error(`${path}: ${response.status} ${message}`);
    }
    if (attempt === 12) throw new Error(`${path}: ${response.status} ${message}`);
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}
async function batches(path, rows, size = 20) {
  for (let index = 0; index < rows.length; index += size) {
    await post(path, { rows: rows.slice(index, index + size) });
    if (index % 200 === 0) console.log(`${path}: ${Math.min(index + size, rows.length)}/${rows.length}`);
  }
}
function meta(row) {
  const value = row.content_metadata && typeof row.content_metadata === 'object' ? row.content_metadata : {};
  return value;
}
function number(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

await post('/setup', {});
const [educational, canonicalIndex, exams] = await Promise.all([
  table('educational_data'), table('educational_content_index', '*', 'record_id'), table('curriculum_exam_bank'),
]);
await batches('/educational', educational);
await batches('/exams', exams);

const indexById = new Map(canonicalIndex.map((row) => [String(row.record_id), row]));
for (const row of educational) {
  if (indexById.has(String(row.id))) continue;
  const metadata = meta(row);
  indexById.set(String(row.id), {
    record_id: row.id, subject_id: row.subject_id, section_id: row.section_id,
    file_name: row.file_name || metadata.file_name || `${row.id}.json`,
    lesson_id: row.lesson_id || metadata.lesson_id || null,
    chapter_number: row.chapter_number ?? metadata.chapter_number ?? metadata.chapter ?? null,
    lesson_number: row.lesson_number ?? metadata.lesson_number ?? metadata.lesson ?? null,
    title: row.title || metadata.title || null, has_content: row.content != null,
    updated_at: row.updated_at || row.created_at || null,
  });
}
const indexRows = [...indexById.values()].map((row) => ({
  source_table: 'educational_data', source_id: String(row.record_id),
  subject_id: String(row.subject_id || ''), section_id: String(row.section_id || ''),
  title: row.title || null, file_name: row.file_name || `${row.record_id}.json`,
  lesson_id: row.lesson_id || null, chapter_number: number(row.chapter_number),
  lesson_number: number(row.lesson_number), has_content: row.has_content !== false,
  content_path: `supabase/educational_data/${row.record_id}.json`, updated_at: row.updated_at || null,
})).filter((row) => row.subject_id && row.section_id);
await batches('/index', indexRows, 50);
const result = await post('/manifests', {
  educational_count: educational.length, educational_ids: educational.map((row) => row.id),
  exam_count: exams.length, exam_ids: exams.map((row) => row.id),
});
console.log(JSON.stringify({ ...result, canonical_index_count: canonicalIndex.length }, null, 2));
if (result.educational_count !== educational.length || result.index_count !== indexRows.length) throw new Error('Cloudflare verification count mismatch');
