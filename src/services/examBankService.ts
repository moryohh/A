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

export type CurriculumExamIndexRecord = Omit<CurriculumExamRecord, 'payload'>;

export async function fetchChapterExamBank(
  subjectId: string,
  chapterNumber: number,
): Promise<{ monthly: CurriculumExamIndexRecord[]; ministry: CurriculumExamIndexRecord[] }> {
  const [monthlyResult, ministryResult] = await Promise.all([
    supabase
      .from('curriculum_exam_bank')
      .select('id,subject_id,exam_type,chapter_number,lesson_ids,title,source_file,parse_status')
      .eq('subject_id', subjectId)
      .eq('exam_type', 'monthly')
      .eq('chapter_number', chapterNumber)
      .order('title')
      .limit(200),
    supabase
      .from('curriculum_exam_bank')
      .select('id,subject_id,exam_type,chapter_number,lesson_ids,title,source_file,parse_status')
      .eq('subject_id', subjectId)
      .eq('exam_type', 'ministry')
      .order('title')
      .limit(200),
  ]);

  if (monthlyResult.error) throw monthlyResult.error;
  if (ministryResult.error) throw ministryResult.error;

  return {
    monthly: (monthlyResult.data || []) as CurriculumExamIndexRecord[],
    ministry: (ministryResult.data || []) as CurriculumExamIndexRecord[],
  };
}

export async function fetchExamById(examId: string): Promise<CurriculumExamRecord> {
  const { data, error } = await supabase
    .from('curriculum_exam_bank')
    .select('id,subject_id,exam_type,chapter_number,lesson_ids,title,source_file,parse_status,payload')
    .eq('id', examId)
    .single();
  if (error) throw error;
  return data as CurriculumExamRecord;
}
