import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  PenTool,
  Camera,
  Trash2,
  Loader2,
  FileCheck2,
  ImageIcon,
} from 'lucide-react';
import { DailyExamConfig, fetchDailyExamForLesson } from '../services/dailyExamService';
import { gameAudio } from '../utils/gameAudio';
import {
  submitSolutionImageForEvaluation,
  ImageEvaluationResult,
} from '../services/imageEvaluationService';
import { OpenLessonContext } from '../types';
import { getDailyExamReward } from '../services/pointsService';

interface DailyExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  lessonTitle: string;
  category?: string;
  customExam?: DailyExamConfig;
  openLessonContext?: OpenLessonContext | null;
  onScoreUpdate?: (points: number) => void;
  onAssessmentResult?: (correctPoints: number, totalPoints: number) => void;
  onDailyExamCompleted?: (result: {
    score: number;
    totalScore: number;
    percentage: number;
    subject: string;
    lessonTitle: string;
    completedAt: string;
  }) => void;
}

export const DailyExamModal: React.FC<DailyExamModalProps> = ({
  isOpen,
  onClose,
  lessonId,
  lessonTitle,
  category = 'المادة التعليمية',
  customExam,
  openLessonContext,
  onScoreUpdate,
  onAssessmentResult,
  onDailyExamCompleted,
}) => {
  const [exam, setExam] = useState<DailyExamConfig | null>(customExam || null);
  const [isLoading, setIsLoading] = useState(false);
  const [examRound, setExamRound] = useState(0);
  const [currentQuestionPage, setCurrentQuestionPage] = useState<1 | 2>(1);

  // Student Drafts (textual notes per branch)
  const [studentDrafts, setStudentDrafts] = useState<Record<string, string>>({});

  // Question-Level Image Attachments & Evaluation (One image for Q1 covering both definitions, One for Q2)
  const [questionImages, setQuestionImages] = useState<
    Record<'q1' | 'q2', { file: File; previewUrl: string } | null>
  >({
    q1: null,
    q2: null,
  });
  const [evaluatedQuestions, setEvaluatedQuestions] = useState<
    Record<'q1' | 'q2', ImageEvaluationResult | null>
  >({
    q1: null,
    q2: null,
  });
  const [questionErrors, setQuestionErrors] = useState<Record<'q1' | 'q2', string>>({
    q1: '',
    q2: '',
  });

  // Hidden camera/file input refs
  const q1FileInputRef = useRef<HTMLInputElement | null>(null);
  const q2FileInputRef = useRef<HTMLInputElement | null>(null);

  // Timer State (10 min default = 600 sec)
  const [timeLeft, setTimeLeft] = useState(600);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitState, setSubmitState] = useState<'idle' | 'confirming' | 'processing' | 'completed'>('idle');
  const [processingPhase, setProcessingPhase] = useState(0);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const submissionLockRef = useRef(false);
  const rewardIssuedRef = useRef(false);
  const assessmentReportedRef = useRef(false);
  const submissionIdRef = useRef<string | null>(null);

  // Load exam data on mount / open
  useEffect(() => {
    if (!isOpen) return;

    // Each opening starts a clean submission state. This prevents a result
    // from a previous round from being attached to an empty question.
    submissionLockRef.current = false;
    rewardIssuedRef.current = false;
    assessmentReportedRef.current = false;
    submissionIdRef.current = null;
    setEvaluatedQuestions({ q1: null, q2: null });
    setQuestionErrors({ q1: '', q2: '' });
    setQuestionImages({ q1: null, q2: null });
    setStudentDrafts({});
    setIsSubmitted(false);
    setSubmitState('idle');
    setCompletedAt(null);
    setTimeLeft(600);
    setCurrentQuestionPage(1);
    setIsTimerRunning(true);
    setProcessingPhase(0);

    if (customExam) {
      setExam(customExam);
      setIsLoading(false);
      return;
    }

    setExam(null);
      setIsLoading(true);
      if (openLessonContext) {
        fetchDailyExamForLesson(openLessonContext)
          .then((res) => {
            setExam(res);
            setIsLoading(false);
          })
          .catch(() => {
            setIsLoading(false);
          });
      } else {
        const subjectId = category;
        fetchDailyExamForLesson(
          subjectId,
          lessonId,
          lessonTitle,
          subjectId
        )
          .then((res) => {
            setExam(res);
            setIsLoading(false);
          })
          .catch(() => {
            setIsLoading(false);
          });
      }
  }, [isOpen, customExam, examRound, category, lessonId, lessonTitle, openLessonContext?.subjectId, openLessonContext?.chapterNumber, openLessonContext?.lessonNumber, openLessonContext?.lessonId]);

  useEffect(() => {
    if (submitState !== 'processing') return;
    setProcessingPhase(0);
    const phaseTimer = setInterval(() => {
      setProcessingPhase((previous) => (previous + 1) % 3);
    }, 1400);
    return () => clearInterval(phaseTimer);
  }, [submitState]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || !isTimerRunning || isSubmitted || !exam?.isAvailable) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
            if (prev <= 1) {
          clearInterval(timer);
          setIsTimerRunning(false);
          setSubmitState('confirming');
          gameAudio.playClick();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isTimerRunning, isSubmitted]);

  if (!isOpen) return null;

  const handleDraftChange = (branchId: string, value: string) => {
    setStudentDrafts((prev) => ({
      ...prev,
      [branchId]: value,
    }));
  };

  const handleImageSelected = (qKey: 'q1' | 'q2', file: File) => {
    if (submitState !== 'idle' || isSubmitted) return;
    if (!file.type.startsWith('image/')) {
      setQuestionErrors((prev) => ({
        ...prev,
        [qKey]: 'يُسمح فقط بملفات الصور (PNG, JPEG, WEBP).',
      }));
      return;
    }

    setQuestionErrors((prev) => ({ ...prev, [qKey]: '' }));
    setEvaluatedQuestions((prev) => ({ ...prev, [qKey]: null }));
    const objectUrl = URL.createObjectURL(file);
    setQuestionImages((prev) => ({
      ...prev,
      [qKey]: { file, previewUrl: objectUrl },
    }));
    gameAudio.playClick();
  };

  const handleRemoveImage = (qKey: 'q1' | 'q2') => {
    if (submitState !== 'idle') return;
    gameAudio.playClick();
    setQuestionImages((prev) => ({
      ...prev,
      [qKey]: null,
    }));
    setEvaluatedQuestions((prev) => ({
      ...prev,
      [qKey]: null,
    }));
    setQuestionErrors((prev) => ({ ...prev, [qKey]: '' }));
  };

  const evaluateUploadedImage = async (qKey: 'q1' | 'q2', submissionId: string): Promise<ImageEvaluationResult | null> => {
    if (!exam || !questionImages[qKey]) return null;

    if (qKey === 'q1') {
      const q1TotalPoints = exam.question1.branches.reduce((acc, b) => acc + b.points, 0);
      const combinedPrompt = exam.question1.branches
        .map((b, idx) => `الفرع ${idx + 1} (${b.label}): ${b.prompt}`)
        .join('\n');
      const combinedModelAnswer = exam.question1.branches
        .map((b, idx) => `جواب الفرع ${idx + 1} (${b.label}):\n${b.modelAnswer}`)
        .join('\n\n');

      return submitSolutionImageForEvaluation({
        imageFile: questionImages.q1.file,
        branchId: 'q1_unified',
        source: 'daily_exam',
        questionPrompt: combinedPrompt,
        modelAnswer: combinedModelAnswer,
        branchPoints: q1TotalPoints,
        subject: exam.subject,
        lessonTitle: exam.lessonTitle,
        submissionId,
        questionId: 'q1',
      });
    }

    const branch = exam.question2.branches[0];
    if (!branch) return null;

    return submitSolutionImageForEvaluation({
      imageFile: questionImages.q2.file,
      branchId: branch.id,
      source: 'daily_exam',
      questionPrompt: branch.prompt,
      modelAnswer: branch.modelAnswer,
      branchPoints: branch.points,
      subject: exam.subject,
      lessonTitle: exam.lessonTitle,
      submissionId,
      questionId: 'q2',
    });
  };

  const handleSubmitExam = () => {
    if (submissionLockRef.current || submitState !== 'idle' || isSubmitted) return;
    setSubmitState('confirming');
  };

  const getResultsTotal = (results: Record<'q1' | 'q2', ImageEvaluationResult | null>) =>
    ([results.q1, results.q2].filter((result): result is ImageEvaluationResult => Boolean(result?.success)))
      .reduce((sum, result) => sum + (result.score || 0), 0);

  const confirmSubmitExam = async () => {
    if (submissionLockRef.current || submitState !== 'confirming' || !exam) return;

    submissionLockRef.current = true;
    const submissionId = `submission_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    submissionIdRef.current = submissionId;
    setProcessingPhase(0);
    setSubmitState('processing');
    setQuestionErrors({ q1: '', q2: '' });
    setIsTimerRunning(false);

    const nextEvaluations: Record<'q1' | 'q2', ImageEvaluationResult | null> = {
      // Never carry a previous evaluation into a submission where that image
      // is absent. Text-only or unanswered branches remain ungraded.
      q1: questionImages.q1 ? evaluatedQuestions.q1 : null,
      q2: questionImages.q2 ? evaluatedQuestions.q2 : null,
    };

    try {
      for (const qKey of ['q1', 'q2'] as const) {
        if (questionImages[qKey] && !nextEvaluations[qKey]) {
          const result = await evaluateUploadedImage(qKey, submissionId);
          if (!result?.success) {
            setQuestionErrors((prev) => ({
              ...prev,
              [qKey]: result?.error || result?.feedback || 'تعذر تصحيح الصورة. ستُسجل الإجابة دون درجة لهذا السؤال.',
            }));
            nextEvaluations[qKey] = result;
            continue;
          }
          nextEvaluations[qKey] = result;
        }
      }

      setEvaluatedQuestions(nextEvaluations);
      const score = getResultsTotal(nextEvaluations);
      const totalScore = Number(exam.totalPoints) || 1;
      const finishedAt = new Date().toISOString();
      setCompletedAt(finishedAt);
      setIsSubmitted(true);
      setSubmitState('completed');
      onDailyExamCompleted?.({
        score,
        totalScore,
        percentage: Math.round((score / totalScore) * 100),
        subject: exam.subject,
        lessonTitle: exam.lessonTitle,
        completedAt: finishedAt,
      });
      if (!rewardIssuedRef.current && [nextEvaluations.q1, nextEvaluations.q2].every((result) => result?.success)) {
        rewardIssuedRef.current = true;
        onScoreUpdate?.(getDailyExamReward(score));
        if (!assessmentReportedRef.current) {
          assessmentReportedRef.current = true;
          onAssessmentResult?.(score, totalScore);
        }
      }
      gameAudio.playVictoryFanfare();
    } catch {
      submissionLockRef.current = false;
      setSubmitState('idle');
      setIsTimerRunning(true);
      setQuestionErrors({
        q1: questionImages.q1 ? 'تعذر إكمال معالجة صورة السؤال الأول.' : '',
        q2: questionImages.q2 ? 'تعذر إكمال معالجة صورة السؤال الثاني.' : '',
      });
    }
  };

  const handleRestartExam = () => {
    gameAudio.playClick();
    submissionLockRef.current = false;
    rewardIssuedRef.current = false;
    assessmentReportedRef.current = false;
    submissionIdRef.current = null;
    setTimeLeft(600);
    setCurrentQuestionPage(1);
    setIsTimerRunning(true);
    setIsSubmitted(false);
    setSubmitState('idle');
    setCompletedAt(null);
    setExamRound((prev) => prev + 1);
    setStudentDrafts({});
    setQuestionImages({ q1: null, q2: null });
    setEvaluatedQuestions({ q1: null, q2: null });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Evaluated summary
  const validEvaluations = [evaluatedQuestions.q1, evaluatedQuestions.q2].filter(
    (ev): ev is ImageEvaluationResult => ev !== null
  );
  const totalEarnedPoints = validEvaluations.reduce((sum, res) => sum + (res.score || 0), 0);
  const totalEvaluatedCount = validEvaluations.length;

  return (
    <div className="fixed inset-0 z-50 bg-[#302f3f] font-cairo" dir="rtl">
      <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-[#f8f7f1] text-[#29282b]">
        <div
          className="pointer-events-none absolute inset-y-0 right-[11%] z-0 w-px bg-[#d87878]/45"
          aria-hidden="true"
        />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col">
          <header className="shrink-0 border-b border-[#dedbd0] bg-[#f8f7f1]/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] shadow-sm backdrop-blur">
            <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitState === 'processing'}
                aria-label="إغلاق الاختبار"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#cfcac0] bg-[#efede4] text-[#403d42] transition hover:bg-[#e4e1d7] active:scale-95 disabled:pointer-events-none disabled:opacity-40"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="min-w-0 flex-1 text-center">
                <p className="text-[11px] font-bold text-[#766f68]">اختبار يومي</p>
                <h1 className="truncate text-base font-black text-[#2f2d31] sm:text-lg">
                  {lessonTitle || 'الاختبار اليومي'}
                </h1>
              </div>

              <div className="flex h-10 min-w-[76px] items-center justify-center gap-1 rounded-full border border-[#cfc7bd] bg-[#efede4] px-2 text-sm font-black text-[#3d3940]">
                <Clock className="h-4 w-4 text-[#6c4b88]" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>
          </header>

          {submitState === 'confirming' && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#302f3f]/60 p-4 backdrop-blur-sm">
              <div className="w-full max-w-sm border border-[#d8d2c7] bg-[#fbfaf4] p-6 text-center shadow-2xl">
                <FileCheck2 className="mx-auto mb-3 h-9 w-9 text-[#6c4b88]" />
                <h2 className="text-lg font-black text-[#302d34]">تأكيد تسليم الامتحان</h2>
                <p className="mt-2 text-sm leading-7 text-[#6f6963]">
                  بعد التأكيد ستبدأ معالجة الصور ولن تستطيع إرسال الامتحان مرة أخرى أثناء المعالجة.
                </p>
                <p className="mt-2 text-xs font-bold text-[#6c4b88]">
                  الصور المرفوعة: {[questionImages.q1, questionImages.q2].filter(Boolean).length}
                </p>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitState('idle');
                      setIsTimerRunning(true);
                    }}
                    className="border border-[#cfcac0] bg-[#efede4] px-3 py-3 text-xs font-black text-[#4b474b] transition hover:bg-[#e4e1d7]"
                  >
                    مراجعة الإجابات
                  </button>
                  <button
                    type="button"
                    onClick={confirmSubmitExam}
                    className="bg-[#6c4b88] px-3 py-3 text-xs font-black text-white transition hover:bg-[#5b3d76] active:scale-[0.98]"
                  >
                    تأكيد وإرسال
                  </button>
                </div>
              </div>
            </div>
          )}

          {submitState === 'processing' && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#302f3f]/65 p-4 backdrop-blur-sm">
              <div className="w-full max-w-sm border border-[#d8d2c7] bg-[#fbfaf4] p-7 text-center shadow-2xl">
                <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-[#6c4b88]" />
                <h2 className="text-xl font-black text-[#302d34]">
                  {['جارٍ جلب النتيجة', 'جارٍ التدقيق في الصور', 'جارٍ التصحيح وحساب الدرجة'][processingPhase]}
                </h2>
                <p className="mt-2 text-sm leading-7 text-[#6f6963]">
                  تم استلام إجابتك. يرجى الانتظار حتى تكتمل المعالجة.
                </p>
                <div className="mt-5 space-y-2 text-right">
                  {['جلب النتيجة', 'التدقيق في الصور', 'التصحيح وحساب الدرجة'].map((phase, index) => (
                    <div
                      key={phase}
                      className={`flex items-center gap-2 border px-3 py-2 text-xs font-bold ${
                        index === processingPhase
                          ? 'border-[#bda8cd] bg-[#eee7f2] text-[#5b3d76]'
                          : index < processingPhase
                            ? 'border-[#b7d5bd] bg-[#edf6ee] text-[#377348]'
                            : 'border-[#e3e0d8] bg-[#f0eee8] text-[#8c8780]'
                      }`}
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-current/10 text-[10px]">
                        {index < processingPhase ? '✓' : index + 1}
                      </span>
                      {index === processingPhase ? `جارٍ ${phase}` : index < processingPhase ? `اكتمل ${phase}` : phase}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {submitState === 'completed' && exam && (
            <div className="absolute inset-0 z-50 flex min-h-0 flex-col bg-[#302f3f] text-right text-white">
              {(() => {
                const q1Evaluation = questionImages.q1 ? evaluatedQuestions.q1 : null;
                const q2Evaluation = questionImages.q2 ? evaluatedQuestions.q2 : null;
                const finalScore = getResultsTotal({ q1: q1Evaluation, q2: q2Evaluation });
                const finalTotal = Number(exam.totalPoints) || 1;
                const finalPercentage = Math.round((finalScore / finalTotal) * 100);
                const q1Max = exam.question1.branches.reduce((acc, branch) => acc + branch.points, 0);
                const q2Max = exam.question2.branches.reduce((acc, branch) => acc + branch.points, 0);
                const percentageFor = (evaluation: ImageEvaluationResult | null, max: number) => {
                  if (!evaluation) return 0;
                  if (Number.isFinite(evaluation.percentage)) return Math.max(0, Math.min(100, Math.round(evaluation.percentage)));
                  return Math.max(0, Math.min(100, Math.round(((evaluation.score || 0) / Math.max(1, max)) * 100)));
                };
                const toneFor = (percentage: number) => {
                  if (percentage < 50) return { border: '#c95c68', bg: '#512f38', text: '#ffd7dc', label: 'يحتاج مراجعة' };
                  if (percentage <= 75) return { border: '#c59c36', bg: '#534528', text: '#ffeeb0', label: 'متوسط' };
                  return { border: '#58a66b', bg: '#284934', text: '#d6f6dc', label: 'جيد' };
                };
                const answerFor = (branchId: string, evaluation: ImageEvaluationResult | null) => {
                  const draft = studentDrafts[branchId]?.trim();
                  if (draft) return draft;
                  if (evaluation?.identifiedTextOrSteps?.length) return evaluation.identifiedTextOrSteps.join(' ');
                  if (evaluation?.extractedText?.trim()) return evaluation.extractedText.trim();
                  if (evaluation && !evaluation.success) return 'تم رفع الصورة، لكن لم يُستخرج منها نص قابل للتقييم.';
                  return 'لم تُرفع صورة أو إجابة لهذا السؤال.';
                };
                const renderResultCard = (
                  label: string,
                  title: string,
                  branches: DailyExamConfig['question1']['branches'],
                  evaluation: ImageEvaluationResult | null,
                  max: number,
                ) => {
                  const tone = toneFor(percentageFor(evaluation, max));
                  return (
                    <section className="border p-4" style={{ borderColor: tone.border, backgroundColor: tone.bg }}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-bold" style={{ color: tone.text }}>{label}</p>
                          <h3 className="mt-1 text-base font-black text-white">{title}</h3>
                        </div>
                        <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full border-2" style={{ borderColor: tone.border, color: tone.text }}>
                          <span className="text-base font-black">{evaluation?.success ? evaluation.score : 0}</span>
                          <span className="text-[9px]">/{max}</span>
                        </div>
                      </div>
                      <div className="mt-3 space-y-2">
                        {branches.map((branch) => (
                          <div key={branch.id} className="border border-white/10 bg-black/15 p-3">
                            <p className="text-xs font-black" style={{ color: tone.text }}>السؤال: {branch.prompt}</p>
                            <p className="mt-2 text-xs leading-6 text-white/85">جواب الطالب: {answerFor(branch.id, evaluation)}</p>
                          </div>
                        ))}
                      </div>
                      <p className="mt-3 text-[11px] leading-6" style={{ color: tone.text }}>
                        الحالة: {tone.label}{evaluation?.feedback ? ` — ${evaluation.feedback}` : ''}
                      </p>
                    </section>
                  );
                };
                const finalTone = toneFor(finalPercentage);
                return (
                  <>
                    <div className="shrink-0 border-b border-white/10 px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
                      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={onClose}
                          className="flex items-center gap-1.5 border border-white/20 bg-white/10 px-3 py-2 text-xs font-black text-white transition hover:bg-white/15"
                        >
                          <ArrowRight className="h-4 w-4" />
                          العودة
                        </button>
                        <div className="text-center">
                          <p className="text-xs font-bold text-white/65">نتيجة الاختبار اليومي</p>
                          <p className="mt-1 text-sm font-black">{exam.subject} — {exam.lessonTitle}</p>
                        </div>
                        <div className="flex h-16 w-16 flex-col items-center justify-center rounded-full border-2" style={{ borderColor: finalTone.border, backgroundColor: finalTone.bg, color: finalTone.text }}>
                          <span className="text-lg font-black">{finalPercentage}</span>
                          <span className="text-[9px]">من 100</span>
                        </div>
                      </div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                      <div className="mx-auto max-w-2xl space-y-3">
                        <div className="border border-white/10 bg-white/10 p-3 text-center">
                          <p className="text-xs font-bold text-white/65">درجتك في هذا الامتحان</p>
                          <p className="mt-1 text-2xl font-black">{finalScore} / {finalTotal}</p>
                        </div>
                        {renderResultCard('السؤال الأول', exam.question1.title, exam.question1.branches, q1Evaluation, q1Max)}
                        {renderResultCard('السؤال الثاني', exam.question2.title, exam.question2.branches, q2Evaluation, q2Max)}
                        <p className="pb-4 text-center text-xs font-bold text-emerald-200">تم تسجيل النتيجة في إشعارات الحساب.</p>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto">
            {isLoading || !exam ? (
              <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
                <Loader2 className="h-9 w-9 animate-spin text-[#6c4b88]" />
                <p className="text-sm font-bold text-[#6f6963]">جاري إعداد الاختبار اليومي...</p>
              </div>
            ) : !exam.isAvailable ? (
              <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
                <FileCheck2 className="h-10 w-10 text-[#6c4b88]" />
                <h2 className="text-lg font-black text-[#302d34]">الاختبار اليومي غير متوفر</h2>
                <p className="max-w-sm text-sm leading-7 text-[#6f6963]">
                  لا يوجد ملف منهج أو أسئلة اختبارية لهذا الدرس حاليًا.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-[#6c4b88] px-6 py-3 text-xs font-black text-white transition hover:bg-[#5b3d76]"
                >
                  حسنًا
                </button>
              </div>
            ) : (
              <>
                <main className="min-h-full px-3 pb-28 pt-3 sm:px-5">
                  {currentQuestionPage === 1 ? (
                    <section
                      className="relative mx-auto min-h-[calc(100dvh-11.5rem)] max-w-2xl overflow-hidden border border-[#ddd9ce] bg-[#fbfaf4] shadow-[0_8px_24px_rgba(63,52,38,0.12)]"
                      style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 33px, rgba(181,191,194,0.42) 34px)' }}
                    >
                      <div className="pointer-events-none absolute inset-y-0 right-[11%] w-px bg-[#d87878]/45" aria-hidden="true" />
                      <input
                        type="file"
                        ref={q1FileInputRef}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(event) => {
                          if (event.target.files?.[0]) handleImageSelected('q1', event.target.files[0]);
                        }}
                      />
                      <div className="relative z-10 px-6 pb-6 pt-8 sm:px-10">
                        <p className="text-right text-xl font-black leading-9 text-[#2f2d31]">
                          س1: {exam.question1.title}
                        </p>
                        <p className="mt-2 text-right text-base font-bold text-[#514b47]">الإجابة:</p>
                        <div className="mt-3 space-y-1">
                          {exam.question1.branches.slice(0, 2).map((branch, index) => (
                            <div key={branch.id}>
                              <p className="text-right text-base font-black leading-8 text-[#37343a]">
                                {branch.label || `${index === 0 ? 'أ' : 'ب'}`}: {branch.prompt}
                              </p>
                              <textarea
                                value={studentDrafts[branch.id] || ''}
                                onChange={(event) => handleDraftChange(branch.id, event.target.value)}
                                aria-label={`إجابة الفرع ${branch.label || (index === 0 ? 'أ' : 'ب')}`}
                                rows={4}
                                disabled={submitState !== 'idle' || isSubmitted}
                                className="mt-1 w-full resize-none bg-transparent text-base font-semibold leading-[34px] text-[#343238] outline-none placeholder:text-transparent disabled:opacity-70"
                              />
                            </div>
                          ))}
                        </div>
                        {questionErrors.q1 && <p className="mt-3 border border-[#e3a1a8] bg-[#fff0f1] p-2 text-xs font-bold text-[#a33846]">{questionErrors.q1}</p>}
                        {questionImages.q1 && (
                          <div className="mt-4 border border-[#d4ccb9] bg-white/80 p-3">
                            <div className="flex items-center justify-between gap-2 text-xs font-black text-[#514a42]">
                              <span>تم حفظ صورة الحل</span>
                              <button type="button" onClick={() => handleRemoveImage('q1')} className="text-[#a33846] disabled:opacity-40" disabled={submitState !== 'idle'}>
                                حذف
                              </button>
                            </div>
                            <img src={questionImages.q1.previewUrl} alt="صورة حل السؤال الأول" className="mt-2 max-h-40 w-full object-contain" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => q1FileInputRef.current?.click()}
                          disabled={submitState !== 'idle' || isSubmitted}
                          className="mt-5 flex w-full items-center justify-center gap-2 bg-[#6c4b88] px-4 py-3 text-base font-black text-white transition hover:bg-[#5b3d76] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45"
                        >
                          <Camera className="h-5 w-5" />
                          {questionImages.q1 ? 'تغيير صورة الحل' : 'تصوير ورقة الحل'}
                        </button>
                      </div>
                    </section>
                  ) : (
                    <section
                      className="relative mx-auto min-h-[calc(100dvh-11.5rem)] max-w-2xl overflow-hidden border border-[#ddd9ce] bg-[#fbfaf4] shadow-[0_8px_24px_rgba(63,52,38,0.12)]"
                      style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 33px, rgba(181,191,194,0.42) 34px)' }}
                    >
                      <div className="pointer-events-none absolute inset-y-0 right-[11%] w-px bg-[#d87878]/45" aria-hidden="true" />
                      <input
                        type="file"
                        ref={q2FileInputRef}
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(event) => {
                          if (event.target.files?.[0]) handleImageSelected('q2', event.target.files[0]);
                        }}
                      />
                      <div className="relative z-10 px-6 pb-6 pt-8 sm:px-10">
                        <p className="text-right text-xl font-black leading-9 text-[#2f2d31]">
                          س2: {exam.question2.title}
                        </p>
                        <p className="mt-2 text-right text-base font-bold text-[#514b47]">الإجابة:</p>
                        {exam.question2.branches.slice(0, 1).map((branch) => (
                          <div key={branch.id} className="mt-3">
                            <p className="text-right text-base font-black leading-8 text-[#37343a]">
                              {branch.label ? `${branch.label}: ` : ''}{branch.prompt}
                            </p>
                            <textarea
                              value={studentDrafts[branch.id] || ''}
                              onChange={(event) => handleDraftChange(branch.id, event.target.value)}
                              aria-label="إجابة السؤال الثاني"
                              rows={10}
                              disabled={submitState !== 'idle' || isSubmitted}
                              className="mt-1 w-full resize-none bg-transparent text-base font-semibold leading-[34px] text-[#343238] outline-none placeholder:text-transparent disabled:opacity-70"
                            />
                          </div>
                        ))}
                        {questionErrors.q2 && <p className="mt-3 border border-[#e3a1a8] bg-[#fff0f1] p-2 text-xs font-bold text-[#a33846]">{questionErrors.q2}</p>}
                        {questionImages.q2 && (
                          <div className="mt-4 border border-[#d4ccb9] bg-white/80 p-3">
                            <div className="flex items-center justify-between gap-2 text-xs font-black text-[#514a42]">
                              <span>تم حفظ صورة الحل</span>
                              <button type="button" onClick={() => handleRemoveImage('q2')} className="text-[#a33846] disabled:opacity-40" disabled={submitState !== 'idle'}>
                                حذف
                              </button>
                            </div>
                            <img src={questionImages.q2.previewUrl} alt="صورة حل السؤال الثاني" className="mt-2 max-h-40 w-full object-contain" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => q2FileInputRef.current?.click()}
                          disabled={submitState !== 'idle' || isSubmitted}
                          className="mt-5 flex w-full items-center justify-center gap-2 bg-[#6c4b88] px-4 py-3 text-base font-black text-white transition hover:bg-[#5b3d76] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45"
                        >
                          <Camera className="h-5 w-5" />
                          {questionImages.q2 ? 'تغيير صورة الحل' : 'تصوير ورقة الحل'}
                        </button>
                      </div>
                    </section>
                  )}
                </main>

                <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#d7d3ca] bg-[#f8f7f1]/95 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-6px_18px_rgba(63,52,38,0.10)] backdrop-blur">
                  <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4">
                    <button
                      type="button"
                      onClick={() => setCurrentQuestionPage((page) => (page === 2 ? 1 : 2))}
                      disabled={submitState !== 'idle' || isSubmitted}
                      aria-label={currentQuestionPage === 1 ? 'الانتقال إلى السؤال الثاني' : 'العودة إلى السؤال الأول'}
                      className="flex h-12 w-12 shrink-0 items-center justify-center border border-[#cfcac0] bg-[#efede4] text-[#514b47] transition hover:bg-[#e4e1d7] active:scale-95 disabled:pointer-events-none disabled:opacity-45"
                    >
                      {currentQuestionPage === 1 ? <ChevronLeft className="h-6 w-6" /> : <ChevronRight className="h-6 w-6" />}
                    </button>
                    <div className="flex min-w-[76px] flex-col items-center justify-center text-[#5d5650]">
                      <span className="text-[10px] font-bold">الوقت</span>
                      <span className={`text-xl font-black ${timeLeft < 120 ? 'text-[#b14450]' : 'text-[#6c4b88]'}`}>{formatTime(timeLeft)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSubmitExam}
                      disabled={submitState !== 'idle' || isSubmitted}
                      className="flex flex-1 items-center justify-center gap-2 bg-[#6c4b88] px-4 py-3.5 text-base font-black text-white transition hover:bg-[#5b3d76] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-45"
                    >
                      تسليم الامتحان
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
