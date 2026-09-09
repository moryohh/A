import { supabase } from '../lib/supabase';

export type CurriculumExamType = 'monthly' | 'ministry';

export interface CurriculumExamRecord {
  id: string;
  subject_id: string;
  exam_type: CurriculumExamType;
  chapter_number: number | null;
  lesson_ids: string[];
  title: string;
  source_file: string;
  parse_status: string;
  payload: Record<string, unknown>;
}

export async function fetchChapterExamBank(
  subjectId: string,
  chapterNumber: number,
): Promise<{ monthly: CurriculumExamRecord[]; ministry: CurriculumExamRecord[] }> {
  const [monthlyResult, ministryResult] = await Promise.all([
    supabase
      .from('curriculum_exam_bank')
      .select('id,subject_id,exam_type,chapter_number,lesson_ids,title,source_file,parse_status,payload')
      .eq('subject_id', subjectId)
      .eq('exam_type', 'monthly')
      .eq('chapter_number', chapterNumber)
      .order('title')
      .limit(200),
    supabase
      .from('curriculum_exam_bank')
      .select('id,subject_id,exam_type,chapter_number,lesson_ids,title,source_file,parse_status,payload')
      .eq('subject_id', subjectId)
      .eq('exam_type', 'ministry')
      .order('title')
      .limit(200),
  ]);

  if (monthlyResult.error) throw monthlyResult.error;
  if (ministryResult.error) throw ministryResult.error;

  return {
    monthly: (monthlyResult.data || []) as CurriculumExamRecord[],
    ministry: (ministryResult.data || []) as CurriculumExamRecord[],
  };
}

export function chooseRandomExam(exams: CurriculumExamRecord[]): CurriculumExamRecord | null {
  if (exams.length === 0) return null;
  return exams[Math.floor(Math.random() * exams.length)] || null;
}
