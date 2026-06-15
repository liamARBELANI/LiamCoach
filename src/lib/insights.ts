import type { Client, Sex, ActivityLevel, PrimaryGoal } from '@/types';

// ── Public result types ──────────────────────────────────────────────────
export type BmiCategory = 'תת-משקל' | 'תקין' | 'עודף' | 'השמנה';
export interface Bmi {
  value: number;
  category: BmiCategory;
}

export interface Energy {
  bmr: number;
  tdee: number;
  targetCalories: number;
  macros: { proteinG: number; carbG: number; fatG: number };
}

export type FlagId = 'not-medically-fit' | 'injuries' | 'allergies' | 'medication';
export type FlagSeverity = 'high' | 'medium' | 'info';
export interface Flag {
  id: FlagId;
  severity: FlagSeverity;
  label: string;
  detail?: string;
}

export interface ComputedInsights {
  bmi: Bmi | null;
  energy: Energy | null;
  flags: Flag[];
  needsAttention: boolean;
  missing: string[];
}

// ── Free-text helper ──────────────────────────────────────────────────────
const NEGATIONS = new Set([
  'אין', 'לא', 'אין לי', 'ללא', '-', '—', 'none', 'no', 'na', 'n/a',
]);

/** True only when free text carries real content (not blank / a negation). */
export function isMeaningfulText(value: string | undefined | null): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return !NEGATIONS.has(trimmed.toLowerCase());
}

// ── BMI ────────────────────────────────────────────────────────────────────
function bmiCategory(value: number): BmiCategory {
  if (value < 18.5) return 'תת-משקל';
  if (value < 25) return 'תקין';
  if (value < 30) return 'עודף';
  return 'השמנה';
}

/** BMI from weight (kg) and height (cm). Returns null if either is missing/zero. */
export function computeBmi(weight: number, height: number): Bmi | null {
  if (!weight || !height) return null;
  const m = height / 100;
  const value = Math.round((weight / (m * m)) * 10) / 10;
  return { value, category: bmiCategory(value) };
}

// ── Energy ─────────────────────────────────────────────────────────────────
const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  'ישיבה רוב היום': 1.2,
  'קל': 1.375,
  'בינוני': 1.55,
  'גבוה': 1.725,
  'אתלטי': 1.9,
};

const GOAL_ADJUSTMENT: Record<PrimaryGoal, number> = {
  'ירידה במשקל': -0.15,
  'חיטוב': -0.1,
  'מסה': 0.15,
  'עלייה במשקל': 0.15,
  'כוח': 0.05,
  'אחר': 0,
};

const PROTEIN_G_PER_KG = 2.0;
const FAT_CALORIE_SHARE = 0.25;

interface EnergyInput {
  age: number;
  height: number;
  weight: number;
  sex: Sex | undefined;
  activityLevel: ActivityLevel | undefined;
  primaryGoal: PrimaryGoal;
}

/** Mifflin-St Jeor BMR → TDEE → goal-adjusted target + macro split.
 *  Returns null when sex/activityLevel/weight are missing (can't compute). */
export function computeEnergy(input: EnergyInput): Energy | null {
  const { age, height, weight, sex, activityLevel, primaryGoal } = input;
  if (!sex || !activityLevel || !weight || !height || !age) return null;

  const bmrRaw =
    10 * weight + 6.25 * height - 5 * age + (sex === 'זכר' ? 5 : -161);
  const tdeeRaw = bmrRaw * ACTIVITY_MULTIPLIER[activityLevel];
  const targetRaw = tdeeRaw * (1 + GOAL_ADJUSTMENT[primaryGoal]);

  const proteinG = Math.round(PROTEIN_G_PER_KG * weight);
  const fatG = Math.round((targetRaw * FAT_CALORIE_SHARE) / 9);
  // Carbs fill the remainder, derived from raw (unrounded) values.
  const carbG = Math.round(
    (targetRaw - proteinG * 4 - targetRaw * FAT_CALORIE_SHARE) / 4,
  );

  return {
    bmr: Math.round(bmrRaw),
    tdee: Math.round(tdeeRaw),
    targetCalories: Math.round(targetRaw),
    macros: { proteinG, carbG, fatG },
  };
}
