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

function examBankSubjectId(subjectId: string) {
  // The application routes use arabic-1/arabic-2 while the imported bank uses
  // arabic_1/arabic_2. Other subject identifiers already match exactly.
  return subjectId === 'arabic-1' || subjectId === 'arabic-2'
    ? subjectId.replace('-', '_')
    : subjectId;
}

export async function fetchChapterExamBank(
  subjectId: string,
  chapterNumber: number,
): Promise<{ monthly: CurriculumExamIndexRecord[]; ministry: CurriculumExamIndexRecord[] }> {
  const bankSubjectId = examBankSubjectId(subjectId);
  const [monthlyResult, ministryResult] = await Promise.all([
    supabase
      .from('curriculum_exam_bank')
      .select('id,subject_id,exam_type,chapter_number,lesson_ids,title,source_file,parse_status')
      .eq('subject_id', bankSubjectId)
      .eq('exam_type', 'monthly')
      // Rows marked raw_text failed ingestion and can expose truncated or
      // corrupted questions. Keep them quarantined until their source is restored.
      .neq('parse_status', 'raw_text')
      .eq('chapter_number', chapterNumber)
      .order('title')
      .limit(200),
    supabase
      .from('curriculum_exam_bank')
      .select('id,subject_id,exam_type,chapter_number,lesson_ids,title,source_file,parse_status')
      .eq('subject_id', bankSubjectId)
      .eq('exam_type', 'ministry')
      .neq('parse_status', 'raw_text')
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
