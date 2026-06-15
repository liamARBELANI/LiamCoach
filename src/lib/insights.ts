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
