const PRIMARY_ORIGIN = "https://a-1q1.pages.dev";

function allowedOrigin(origin) {
  try {
    const url = new URL(origin);
    const host = url.hostname;
    const isOfficialPagesDomain =
      host === "a-1q1.pages.dev" ||
      host === "a-bjc.pages.dev" ||
      host.endsWith(".a-bjc.pages.dev") ||
      host === "duha-challenge-preview.pages.dev" ||
      host.endsWith(".duha-challenge-preview.pages.dev");
    return url.protocol === "https:" && isOfficialPagesDomain ? origin : PRIMARY_ORIGIN;
  } catch {
    return PRIMARY_ORIGIN;
  }
}

function headers(origin) {
  return {
    "Access-Control-Allow-Origin": allowedOrigin(origin),
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), { status, headers: headers(origin) });
}

addEventListener("fetch", (event) => {
  event.respondWith((async () => {
    const request = event.request;
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") return new Response(null, { headers: headers(origin) });
    if (request.method !== "GET") return json({ error: "method_not_allowed" }, 405, origin);
    if (url.pathname === "/health") {
      return json({ ok: true, service: "duha-content-r2", read_only: true, storage: "r2" }, 200, origin);
    }
    if (url.pathname === "/manifest") {
      const object = await CONTENT_R2.get("manifests/json_files_manifest.json");
      if (!object) return json({ error: "manifest_not_found" }, 404, origin);
      return new Response(await object.text(), { headers: headers(origin) });
    }
    if (url.pathname === "/manifest-educational") {
      const object = await CONTENT_R2.get("supabase/educational_data/__educational_manifest__.json");
      if (!object) return json({ error: "manifest_not_found" }, 404, origin);
      return new Response(await object.text(), { headers: headers(origin) });
    }
    const educationalMatch = url.pathname.match(/^\/educational\/([0-9a-f-]+)$/);
    if (educationalMatch) {
      const object = await CONTENT_R2.get(`supabase/educational_data/${educationalMatch[1]}.json`);
      if (!object) return json({ error: "not_found" }, 404, origin);
      return new Response(await object.text(), { headers: headers(origin) });
    }
    const match = url.pathname.match(/^\/json\/([0-9a-f-]+)\.json$/);
    if (match) {
      const object = await CONTENT_R2.get(`json/${match[1]}.json`);
      if (!object) return json({ error: "not_found" }, 404, origin);
      return new Response(await object.text(), { headers: headers(origin) });
    }
    return json({ error: "not_found" }, 404, origin);
  })());
});
