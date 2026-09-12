export type PointSource =
  | 'millionaire'
  | 'true_false'
  | 'image_choice'
  | 'daily_exam'
  | 'monthly_exam'
  | 'semester_exam'
  | 'annual_exam'
  | 'experiment';

export interface LevelSnapshot {
  level: number;
  totalPoints: number;
  pointsIntoLevel: number;
  pointsForNextLevel: number;
  progressPercent: number;
}

export interface PlayerLevelProgress {
  currentLevel: number;
  pointsInCurrentLevel: number;
  pointsNeededForNextLevel: number;
  progressPercentage: number;
}

export interface RewardInput {
  source: PointSource;
  score?: number;
  attempt?: number;
  completionPercentage?: number;
}

/** Level 1 needs 20 points. Each later level needs 9% more than the previous one. */
export const BASE_POINTS = 20;
export const GROWTH_FACTOR = 1.09;
export const LEVEL_ONE_TARGET = BASE_POINTS;
export const LEVEL_GROWTH_RATE = 0.09;

const toOneDecimal = (value: number): number =>
  Number.parseFloat((Number.isFinite(value) ? value : 0).toFixed(1));

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, Number.isFinite(value) ? value : 0));

/** Points needed to pass from the supplied level to the next level. */
export const getRequiredPointsForNextLevel = (currentLevel: number): number => {
  if (currentLevel < 1) return BASE_POINTS;
  return toOneDecimal(BASE_POINTS * Math.pow(GROWTH_FACTOR, Math.floor(currentLevel) - 1));
};

/** Total accumulated points required from level 1 to reach targetLevel. */
export const getTotalPointsRequiredForLevel = (targetLevel: number): number => {
  if (targetLevel <= 1) return 0;
  return toOneDecimal(
    (BASE_POINTS * (Math.pow(GROWTH_FACTOR, Math.floor(targetLevel) - 1) - 1)) /
      (GROWTH_FACTOR - 1)
  );
};

/** Calculates the player's current level and progress inside that level. */
export const getPlayerLevelProgress = (totalPoints: number): PlayerLevelProgress => {
  const safeTotal = Math.max(0, Number(totalPoints) || 0);
  let level = 1;
  let remainingPoints = safeTotal;

  while (level < 10000) {
    const requiredForNext = getRequiredPointsForNextLevel(level);
    if (remainingPoints < requiredForNext) break;
    remainingPoints = toOneDecimal(remainingPoints - requiredForNext);
    level += 1;
  }

  const pointsNeededForNextLevel = getRequiredPointsForNextLevel(level);
  const progressPercentage = Math.min(
    toOneDecimal((remainingPoints / pointsNeededForNextLevel) * 100),
    100
  );

  return {
    currentLevel: level,
    pointsInCurrentLevel: toOneDecimal(remainingPoints),
    pointsNeededForNextLevel,
    progressPercentage,
  };
};

/** Backward-compatible names used by existing profile and competition UI. */
export const getLevelRequirement = getRequiredPointsForNextLevel;

export const getLevelSnapshot = (totalPoints: number): LevelSnapshot => {
  const progress = getPlayerLevelProgress(totalPoints);
  return {
    level: progress.currentLevel,
    totalPoints: toOneDecimal(Math.max(0, Number(totalPoints) || 0)),
    pointsIntoLevel: progress.pointsInCurrentLevel,
    pointsForNextLevel: progress.pointsNeededForNextLevel,
    progressPercent: progress.progressPercentage,
  };
};

const repeatDivisorForAnnualExam = (attempt: number): number => {
  const safeAttempt = Math.max(1, Math.floor(attempt || 1));
  return safeAttempt === 1 ? 1 : Math.min(safeAttempt, 4);
};

const repeatDivisorForStandardActivity = (attempt: number): number =>
  Math.max(1, Math.floor(attempt || 1)) > 1 ? 4 : 1;

/**
 * The only reward calculator used by exams and interactive activities.
 * Scores are points out of 100 for annual/monthly, out of 10 for daily,
 * and a completion percentage for games and activities.
 */
export const calculateProgressReward = ({
  source,
  score = 0,
  attempt = 1,
  completionPercentage,
}: RewardInput): number => {
  const safeScore = Math.max(0, Number(score) || 0);

  if (source === 'annual_exam') {
    const earned = clamp(safeScore, 0, 100) >= 50 ? clamp(safeScore, 0, 100) : 0;
    return toOneDecimal(earned / repeatDivisorForAnnualExam(attempt));
  }

  if (source === 'monthly_exam' || source === 'semester_exam') {
    const percentage = clamp(safeScore, 0, 100);
    const earned = percentage >= 90 ? 60 : percentage >= 80 ? 50 : percentage >= 70 ? 40 : percentage >= 50 ? 30 : 0;
    return toOneDecimal(earned / repeatDivisorForStandardActivity(attempt));
  }

  if (source === 'daily_exam') {
    const earned = clamp(safeScore, 0, 10);
    return toOneDecimal(earned / repeatDivisorForStandardActivity(attempt));
  }

  const completion = clamp(completionPercentage ?? safeScore, 0, 100);
  const earned = completion >= 100 ? 5 : completion >= 50 ? 3 : 0;
  return toOneDecimal(earned / repeatDivisorForStandardActivity(attempt));
};

export const getAnnualExamReward = (score: number, attempt = 1): number =>
  calculateProgressReward({ source: 'annual_exam', score, attempt });

export const getMonthlyExamReward = (score: number, attempt = 1): number =>
  calculateProgressReward({ source: 'monthly_exam', score, attempt });

export const getSemesterExamReward = getMonthlyExamReward;

export const getDailyExamReward = (score: number, attempt = 1): number =>
  calculateProgressReward({ source: 'daily_exam', score, attempt });

export const getMillionaireReward = (
  reachedQuestionCount: number,
  totalQuestions: number,
  _completed = false,
  attempt = 1
): number => {
  const total = Math.max(1, Number(totalQuestions) || 1);
  return calculateProgressReward({
    source: 'millionaire',
    completionPercentage: (Math.max(0, Number(reachedQuestionCount) || 0) / total) * 100,
    attempt,
  });
};

export const getTrueFalseReward = (
  correctAnswers: number,
  totalQuestions: number,
  attempt = 1
): number => {
  const total = Math.max(1, Number(totalQuestions) || 1);
  return calculateProgressReward({
    source: 'true_false',
    completionPercentage: (Math.max(0, Number(correctAnswers) || 0) / total) * 100,
    attempt,
  });
};

export const getImageChoiceReward = (
  correctAnswers: number,
  totalQuestions: number,
  attempt = 1
): number => {
  const total = Math.max(1, Number(totalQuestions) || 1);
  return calculateProgressReward({
    source: 'image_choice',
    completionPercentage: (Math.max(0, Number(correctAnswers) || 0) / total) * 100,
    attempt,
  });
};

export const getExperimentReward = (completionPercentage: number, attempt = 1): number =>
  calculateProgressReward({ source: 'experiment', completionPercentage, attempt });
