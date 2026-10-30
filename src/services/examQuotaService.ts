import { supabase } from '../lib/supabase';

export type ExamQuotaKind = 'daily' | 'monthly' | 'ministry';

export interface ExamQuotaReservation {
  allowed: boolean;
  code?: string;
  message?: string;
  used?: number;
  limit?: number | null;
  remaining?: number | null;
}

export async function reserveExamAttempt(
  examKind: ExamQuotaKind,
  examKey: string,
  requestKey: string,
): Promise<ExamQuotaReservation> {
  if (!supabase) {
    return { allowed: false, code: 'SERVICE_UNAVAILABLE', message: 'خدمة الامتحانات غير متاحة حالياً.' };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session?.user) {
    return { allowed: false, code: 'AUTH_REQUIRED', message: 'يرجى تسجيل الدخول بحسابك قبل تسليم الامتحان.' };
  }

  const { data, error } = await supabase.rpc('reserve_exam_attempt', {
    p_exam_kind: examKind,
    p_exam_key: examKey,
    p_request_key: requestKey,
  });
  if (error) {
    console.error('Exam quota reservation failed:', error);
    return { allowed: false, code: 'QUOTA_CHECK_FAILED', message: 'تعذر التحقق من رصيد الامتحانات. حاول مرة أخرى.' };
  }
  return (data || { allowed: false, code: 'EMPTY_RESPONSE', message: 'تعذر التحقق من رصيد الامتحانات.' }) as ExamQuotaReservation;
}
