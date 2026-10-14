const SUPABASE_URL = (
  import.meta.env.VITE_SUPABASE_URL ||
  'https://qlfleszoyujelygwzdgu.supabase.co'
).replace(/\/+$/, '')

const SUPABASE_KEY = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsZmxlc3pveXVqZWx5Z3d6ZGd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY0NjA0NDMsImV4cCI6MjEwMjAzNjQ0M30.2jZ1vh8O1VW_PzS6NlKAW1QDNHBW99IoHDwa2A7QVOI'
).trim()

const BOARD_SECTION = 'solve_with_me'
const requestCache = new Map()

const databaseSubject = subjectId => subjectId === 'math' ? 'mathematics' : subjectId

async function fetchFromSupabase(subjectId, fileName) {
  const params = new URLSearchParams({
    select: 'content,file_name,content_sha256',
    subject_id: `eq.${databaseSubject(subjectId)}`,
    section_id: `eq.${BOARD_SECTION}`,
    file_name: `eq.${fileName}`,
    limit: '2',
  })
  const response = await fetch(`${SUPABASE_URL}/rest/v1/educational_data?${params}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Accept: 'application/json',
    },
  })
  if (!response.ok) throw new Error(`Supabase HTTP ${response.status}`)
  const rows = await response.json()
  if (!Array.isArray(rows) || rows.length !== 1 || !Array.isArray(rows[0]?.content)) {
    throw new Error(rows?.length > 1 ? 'duplicate_board_file' : 'board_file_not_found')
  }
  return rows[0].content
}

async function fetchLocalFallback(fileName) {
  const response = await fetch(`./data/${encodeURIComponent(fileName)}`)
  if (!response.ok) throw new Error(`Local fallback HTTP ${response.status}`)
  return response.json()
}

/** Load one exact whiteboard file. Never substitutes a neighboring lesson. */
export function loadBoardFile(subjectId, fileName) {
  const cacheKey = `${databaseSubject(subjectId)}:${fileName}`
  if (!requestCache.has(cacheKey)) {
    requestCache.set(cacheKey, fetchFromSupabase(subjectId, fileName).catch(error => {
      console.warn(`[solve-with-me] Supabase lookup failed for ${cacheKey}; using local fallback.`, error)
      return fetchLocalFallback(fileName)
    }))
  }
  return requestCache.get(cacheKey)
}

