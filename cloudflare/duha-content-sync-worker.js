function reply(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}

function authorized(request, env) {
  return request.headers.get("authorization") === `Bearer ${env.SYNC_TOKEN}`;
}

const schema = `
CREATE TABLE IF NOT EXISTS educational_content_index_v2 (
  source_table TEXT NOT NULL,
  source_id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  title TEXT,
  file_name TEXT NOT NULL,
  lesson_id TEXT,
  chapter_number INTEGER,
  lesson_number INTEGER,
  has_content INTEGER NOT NULL DEFAULT 1,
  content_path TEXT NOT NULL,
  updated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_eci_v2_subject_section ON educational_content_index_v2(subject_id, section_id);
CREATE INDEX IF NOT EXISTS idx_eci_v2_lesson ON educational_content_index_v2(subject_id, chapter_number, lesson_number);
`;

export default {
  async fetch(request, env) {
    if (!authorized(request, env)) return reply({ error: "unauthorized" }, 401);
    if (request.method !== "POST") return reply({ error: "method_not_allowed" }, 405);
    const url = new URL(request.url);
    const body = await request.json();

    if (url.pathname === "/setup") {
      for (const statement of schema.split(";").map((item) => item.trim()).filter(Boolean)) {
        await env.CONTENT_DB.prepare(statement).run();
      }
      await env.CONTENT_DB.prepare("DELETE FROM educational_content_index_v2").run();
      return reply({ ok: true });
    }

    if (url.pathname === "/educational") {
      const rows = Array.isArray(body.rows) ? body.rows : [];
      await Promise.all(rows.map((row) => env.CONTENT_R2.put(
        `supabase/educational_data/${row.id}.json`, JSON.stringify(row),
        { httpMetadata: { contentType: "application/json; charset=utf-8" } },
      )));
      return reply({ ok: true, written: rows.length });
    }

    if (url.pathname === "/index") {
      const rows = Array.isArray(body.rows) ? body.rows : [];
      if (rows.length) {
        await env.CONTENT_DB.batch(rows.map((row) => env.CONTENT_DB.prepare(`
          INSERT INTO educational_content_index_v2
          (source_table, source_id, subject_id, section_id, title, file_name, lesson_id,
           chapter_number, lesson_number, has_content, content_path, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(source_id) DO UPDATE SET
            subject_id=excluded.subject_id, section_id=excluded.section_id, title=excluded.title,
            file_name=excluded.file_name, lesson_id=excluded.lesson_id,
            chapter_number=excluded.chapter_number, lesson_number=excluded.lesson_number,
            has_content=excluded.has_content, content_path=excluded.content_path,
            updated_at=excluded.updated_at
        `).bind(
          row.source_table, row.source_id, row.subject_id, row.section_id, row.title,
          row.file_name, row.lesson_id, row.chapter_number, row.lesson_number,
          row.has_content ? 1 : 0, row.content_path, row.updated_at,
        )));
      }
      return reply({ ok: true, indexed: rows.length });
    }

    if (url.pathname === "/exams") {
      const rows = Array.isArray(body.rows) ? body.rows : [];
      await Promise.all(rows.map((row) => env.CONTENT_R2.put(
        `supabase/curriculum_exam_bank/${row.id}.json`, JSON.stringify(row),
        { httpMetadata: { contentType: "application/json; charset=utf-8" } },
      )));
      return reply({ ok: true, written: rows.length });
    }

    if (url.pathname === "/manifests") {
      const generatedAt = new Date().toISOString();
      await env.CONTENT_R2.put("supabase/educational_data/__educational_manifest__.json", JSON.stringify({ generated_at: generatedAt, count: body.educational_count, ids: body.educational_ids }));
      await env.CONTENT_R2.put("supabase/curriculum_exam_bank/__exam_manifest__.json", JSON.stringify({ generated_at: generatedAt, count: body.exam_count, ids: body.exam_ids }));
      const count = await env.CONTENT_DB.prepare("SELECT COUNT(*) AS count FROM educational_content_index_v2").first();
      return reply({ ok: true, educational_count: body.educational_count, exam_count: body.exam_count, index_count: count?.count || 0 });
    }
    return reply({ error: "not_found" }, 404);
  },
};
