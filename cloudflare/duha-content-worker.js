function allowedOrigin(origin) {
  if (origin === "https://a-1q1.pages.dev") return origin;
  if (/^https:\/\/[a-z0-9-]+\.duha-challenge-preview\.pages\.dev$/.test(origin)) return origin;
  return "https://a-1q1.pages.dev";
}

function corsHeaders(origin) {
  const allowed = allowedOrigin(origin);
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(origin),
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders(origin) });
    if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405, origin);

    const url = new URL(request.url);
    if (url.pathname === "/health") {
      return json({ ok: true, service: "duha-content-index", storage: "d1" }, 200, origin);
    }
    if (url.pathname !== "/content") {
      return json({ error: "not_found" }, 404, origin);
    }

    const subject = url.searchParams.get("subject") || null;
    const section = url.searchParams.get("section") || null;
    const q = url.searchParams.get("q") || null;
    const requestedLimit = Number(url.searchParams.get("limit") || "20");
    const limit = Math.max(1, Math.min(Number.isFinite(requestedLimit) ? requestedLimit : 20, 2000));

    const predicates = [];
    const params = [];
    if (subject) { predicates.push("subject_id = ?"); params.push(subject); }
    if (section) { predicates.push("section_id = ?"); params.push(section); }
    if (q) { predicates.push("(title LIKE ? OR file_name LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }
    const where = predicates.length ? `WHERE ${predicates.join(" AND ")}` : "";

    const result = await env.CONTENT_DB.prepare(
      `SELECT source_table, source_id, subject_id, section_id, title, file_name,
              lesson_id, chapter_number, lesson_number, has_content,
              content_path, updated_at
       FROM educational_content_index_v2 ${where}
       ORDER BY chapter_number, lesson_number, updated_at DESC LIMIT ?`
    ).bind(...params, limit).all();

    return json({ items: result.results || [], count: result.results?.length || 0, read_only: true }, 200, origin);
  },
};
