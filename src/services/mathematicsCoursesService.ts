import { getSupabaseClient } from '../lib/supabase';

export interface MathTopicIndex {
  recordId: string;
  topicId: string;
  title: string;
  teacherId: string;
  teacherName: string;
  chapterNumber: number;
  sortOrder: number;
  videoCount: number;
}

export interface MathLecture {
  id: string;
  youtubeId: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  lectureNumber: number | null;
  sortOrder: number;
  sourceIndex: number;
  durationSeconds: number;
}

export const MATH_CHAPTER_TITLES: Record<number, string> = {
  1: 'الأعداد المركبة', 2: 'القطوع المخروطية', 3: 'تطبيقات التفاضل',
  4: 'التكامل', 5: 'المعادلات التفاضلية', 6: 'الهندسة الفضائية',
};

/** Read the topic index only; fetch video payloads when a topic is opened. */
export async function fetchMathematicsTopics(): Promise<MathTopicIndex[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error('تعذر الاتصال بمكتبة الرياضيات');
  const rows: any[] = [];
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await client.from('json_files')
      .select('id,title,metadata')
      .eq('subject_id', 'mathematics').eq('section_code', 'lessons')
      .not('metadata->>topic_id', 'is', null)
      .order('id').range(offset, offset + 499);
    if (error) throw new Error('تعذر تحميل مواضيع الرياضيات، حاول مرة أخرى');
    rows.push(...(data || []));
    if (!data || data.length < 500) break;
  }
  return rows.filter((row) => row.metadata?.teacher_id && row.metadata?.chapter_number)
    .map((row) => ({
      recordId: row.id, topicId: row.metadata.topic_id,
      title: row.title.split(' • ').slice(2).join(' • ') || row.title,
      teacherId: row.metadata.teacher_id, teacherName: row.metadata.teacher_name,
      chapterNumber: Number(row.metadata.chapter_number),
      sortOrder: Number(row.metadata.sort_order) || 0,
      videoCount: Number(row.metadata.video_count) || 0,
    })).sort((a, b) => a.chapterNumber - b.chapterNumber || a.sortOrder - b.sortOrder || a.topicId.localeCompare(b.topicId));
}

export function parseMathematicsLectures(content: any): MathLecture[] {
  const teachers = content?.lessons?.[0]?.teachers || [];
  return teachers.flatMap((teacher: any) => (teacher.videos || []).map((video: any) => ({
    id: video.lecture_id, youtubeId: video.video_id, title: video.title, url: video.url,
    thumbnailUrl: video.thumbnail_url || `https://i.ytimg.com/vi/${video.video_id}/hqdefault.jpg`,
    lectureNumber: video.lecture_number ?? null,
    sortOrder: Number(video.sort_order) || 0, sourceIndex: Number(video.source_index) || 0,
    durationSeconds: Number(video.duration_seconds) || 0,
  }))).filter((video: MathLecture) => /^[A-Za-z0-9_-]{11}$/.test(video.youtubeId))
    .sort((a: MathLecture, b: MathLecture) => a.sortOrder - b.sortOrder || a.sourceIndex - b.sourceIndex);
}

export async function fetchMathematicsLectures(recordId: string): Promise<MathLecture[]> {
  const client = getSupabaseClient();
  if (!client) throw new Error('تعذر الاتصال بمكتبة الرياضيات');
  const { data, error } = await client.from('json_files').select('content')
    .eq('id', recordId).eq('subject_id', 'mathematics').eq('section_code', 'lessons').single();
  if (error) throw new Error('تعذر تحميل المحاضرات، حاول مرة أخرى');
  return parseMathematicsLectures(data.content);
}
