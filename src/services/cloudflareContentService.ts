const CONTENT_INDEX_API = (import.meta.env.VITE_CLOUDFLARE_CONTENT_INDEX_API_URL || 'https://duha-content-index.rafos72171.workers.dev').replace(/\/$/, '');
const CONTENT_R2_API = (import.meta.env.VITE_CLOUDFLARE_CONTENT_R2_API_URL || 'https://duha-content-r2.rafos72171.workers.dev').replace(/\/$/, '');

export interface CloudflareContentIndexItem {
  source_table: string;
  source_id: string;
  subject_id: string;
  section_id: string;
  title?: string | null;
  file_name: string;
  content_path: string;
  updated_at?: string | null;
}

export function isCloudflareContentConfigured(): boolean {
  return Boolean(CONTENT_INDEX_API && CONTENT_R2_API);
}

export async function fetchCloudflareContentIndex(subjectId: string): Promise<CloudflareContentIndexItem[]> {
  const response = await fetch(`${CONTENT_INDEX_API}/content?subject=${encodeURIComponent(subjectId)}&limit=2000`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Cloudflare index HTTP ${response.status}`);
  const payload = await response.json();
  return Array.isArray(payload?.items) ? payload.items : [];
}

export async function fetchCloudflareEducationalRecord(recordId: string): Promise<any> {
  const response = await fetch(`${CONTENT_R2_API}/educational/${encodeURIComponent(recordId)}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`Cloudflare content HTTP ${response.status}`);
  return response.json();
}

export async function fetchCloudflareExactSection(
  subjectIds: string[],
  sectionIds: string[],
  chapterNumber: number,
  lessonNumber: number,
  isUsable: (content: any) => boolean,
): Promise<any | null> {
  const candidates = (await Promise.all(
    subjectIds.map((subject) => fetchCloudflareContentIndex(subject))
  )).flat().filter((row) => sectionIds.includes(row.section_id));

  // Fetch only records whose filename proves the requested chapter and lesson.
  // No neighboring lesson is substituted here.
  for (const row of candidates) {
    const chapter = row.file_name.match(/(?:^|[_-])(?:ch|chapter|فصل)[_-]?(\d+)/i)?.[1];
    const lesson = row.file_name.match(/(?:^|[_-])(?:lesson|les|segment|درس)[_-]?(\d+)/i)?.[1];
    if (Number(chapter) !== chapterNumber || Number(lesson) !== lessonNumber) continue;
    const content = await fetchCloudflareEducationalRecord(row.source_id);
    if (isUsable(content)) return content;
  }
  return null;
}

export function getCloudflareContentEndpoints() {
  return { index: CONTENT_INDEX_API, r2: CONTENT_R2_API };
}
