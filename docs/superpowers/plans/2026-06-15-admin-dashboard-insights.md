# Admin Dashboard + Computed Insights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a deterministic per-trainee insights layer (BMI, energy/macros, alert flags) and rebuild the admin dashboard + client detail page to surface it, on a responsive table/cards hybrid.

**Architecture:** All math lives in one pure module `src/lib/insights.ts` (`Client → ComputedInsights`), unit-tested with Vitest. The dashboard and the (currently-stub) detail page consume it. Two new questionnaire fields (`sex`, `activityLevel`) unlock the energy math; records lacking them degrade gracefully.

**Tech Stack:** React 18 + TypeScript, Vite, react-hook-form + Zod, @tanstack/react-query, Tailwind, framer-motion. Hebrew/RTL. Vitest (added in Task 1).

**Reference spec:** [docs/superpowers/specs/2026-06-15-admin-dashboard-insights-design.md](../specs/2026-06-15-admin-dashboard-insights-design.md)

---

## File Structure

**New files:**
- `vitest.config.ts` — Vitest config (jsdom not needed; pure unit tests).
- `src/lib/insights.ts` — pure insights engine.
- `src/lib/insights.test.ts` — unit tests.
- `src/components/admin/FlagChip.tsx` — quiet colored flag/BMI chips.
- `src/components/admin/InsightsPanel.tsx` — BMI + energy cards for the detail page.
- `src/components/admin/ClientTable.tsx` — desktop sortable table.

**Modified files:**
- `package.json` — add Vitest dev dep + `test` script.
- `src/types/index.ts` — add `sex`, `ACTIVITY_LEVELS`/`activityLevel`.
- `src/schemas/intake.ts` — `sex` validation.
- `src/schemas/nutrition.ts` — `activityLevel` validation.
- `src/components/intake/Step1Intake.tsx` — `sex` input.
- `src/components/intake/Step2Nutrition.tsx` — `activityLevel` input.
- `src/data/mockSeed.ts` — add `sex` + `activityLevel` to demo clients.
- `src/routes/AdminDashboard.tsx` — stats tile, attention strip, flag filter, BMI sort, responsive cards/table.
- `src/routes/ClientDetailPage.tsx` — full build-out.

---

## Task 1: Vitest setup

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/_sanity.test.ts` (temporary, deleted in Step 6)

- [ ] **Step 1: Install Vitest**

Run:
```bash
npm install -D vitest@^2.1.8
```
Expected: adds `vitest` to `devDependencies`, no errors.

- [ ] **Step 2: Add the `test` script**

In `package.json`, add to the `"scripts"` block (after the `"lint"` line):
```json
    "lint": "eslint .",
    "test": "vitest run"
```
(Add the comma after the existing `"lint"` value.)

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 4: Write a sanity test**

Create `src/lib/_sanity.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('vitest setup', () => {
  it('runs and resolves the @ alias config', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: PASS — 1 test passed.

- [ ] **Step 6: Delete the sanity test and commit**

Delete `src/lib/_sanity.test.ts`, then:
```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest"
```

---

## Task 2: Type & enum additions

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add the `Sex` type and `ACTIVITY_LEVELS` enum**

In `src/types/index.ts`, after the `PrimaryGoal` block (the `export type PrimaryGoal = ...` line, ~line 26), add:
```ts
export const SEXES = ['זכר', 'נקבה'] as const;
export type Sex = (typeof SEXES)[number];

export const ACTIVITY_LEVELS = [
  'ישיבה רוב היום',
  'קל',
  'בינוני',
  'גבוה',
  'אתלטי',
] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
```

- [ ] **Step 2: Add `sex` to `IntakeForm`**

In the `IntakeForm` interface, add after `phone: string;`:
```ts
  sex: Sex;
```

- [ ] **Step 3: Add `activityLevel` to `NutritionForm`**

In the `NutritionForm` interface, add after `dailyActivityLevel: string;`:
```ts
  activityLevel: ActivityLevel;
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: FAILS — `mockSeed.ts` and form code now miss `sex`/`activityLevel`. That's expected; later tasks fix it. Do not commit yet (committed together with Task 3 fixtures is fine, but simplest: proceed — the build stays red until Task 8). 

> Note for executor: typecheck will remain red between Task 2 and Task 8. The insights engine (Tasks 3-5) is tested via `npm test`, which does not require a green typecheck. Commit each task; run the full `npm run typecheck` green-gate at Task 8.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add sex and activityLevel to client types"
```

---

## Task 3: Insights engine — types, `isMeaningfulText`, BMI

**Files:**
- Create: `src/lib/insights.ts`
- Create: `src/lib/insights.test.ts`

- [ ] **Step 1: Write failing tests for `isMeaningfulText` and `computeBmi`**

Create `src/lib/insights.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { isMeaningfulText, computeBmi } from './insights';

describe('isMeaningfulText', () => {
  it('returns false for empty / whitespace', () => {
    expect(isMeaningfulText('')).toBe(false);
    expect(isMeaningfulText('   ')).toBe(false);
    expect(isMeaningfulText(undefined)).toBe(false);
  });

  it('returns false for negations', () => {
    for (const v of ['אין', 'לא', 'אין לי', 'ללא', '-', '—', 'none', 'No', 'NA', 'n/a']) {
      expect(isMeaningfulText(v)).toBe(false);
    }
  });

  it('returns true for real content', () => {
    expect(isMeaningfulText('רגישות בברך')).toBe(true);
    expect(isMeaningfulText('אגוזי לוז')).toBe(true);
  });
});

describe('computeBmi', () => {
  it('returns null when height or weight missing', () => {
    expect(computeBmi(0, 170)).toBeNull();
    expect(computeBmi(70, 0)).toBeNull();
  });

  it('computes value (1 decimal) and category', () => {
    expect(computeBmi(63, 168)).toEqual({ value: 22.3, category: 'תקין' });
    expect(computeBmi(78, 180)).toEqual({ value: 24.1, category: 'תקין' });
  });

  it('maps each category band', () => {
    expect(computeBmi(40, 160)!.category).toBe('תת-משקל'); // 15.6
    expect(computeBmi(60, 160)!.category).toBe('תקין');     // 23.4
    expect(computeBmi(70, 160)!.category).toBe('עודף');      // 27.3
    expect(computeBmi(80, 160)!.category).toBe('השמנה');     // 31.3
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — `isMeaningfulText`/`computeBmi` not exported.

- [ ] **Step 3: Implement the types + `isMeaningfulText` + `computeBmi`**

Create `src/lib/insights.ts`:
```ts
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
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test`
Expected: PASS (after removing the placeholder boundary test per Step 1 note).

- [ ] **Step 5: Commit**

```bash
git add src/lib/insights.ts src/lib/insights.test.ts
git commit -m "feat: insights — BMI and meaningful-text helper"
```

---

## Task 4: Insights engine — energy (BMR / TDEE / target / macros)

**Files:**
- Modify: `src/lib/insights.ts`
- Modify: `src/lib/insights.test.ts`

- [ ] **Step 1: Write failing tests for `computeEnergy`**

Append to `src/lib/insights.test.ts`:
```ts
import { computeEnergy } from './insights';

describe('computeEnergy', () => {
  const base = {
    age: 34, height: 180, weight: 78,
    sex: 'זכר' as const,
    activityLevel: 'גבוה' as const,
    primaryGoal: 'מסה' as const,
  };

  it('returns null when sex missing', () => {
    expect(computeEnergy({ ...base, sex: undefined })).toBeNull();
  });
  it('returns null when activityLevel missing', () => {
    expect(computeEnergy({ ...base, activityLevel: undefined })).toBeNull();
  });

  it('computes male, גבוה, מסה', () => {
    const e = computeEnergy(base)!;
    expect(e.bmr).toBe(1740);
    expect(e.tdee).toBe(3002);
    expect(e.targetCalories).toBe(3452);
    expect(e.macros).toEqual({ proteinG: 156, fatG: 96, carbG: 491 });
  });

  it('computes female, בינוני, חיטוב', () => {
    const e = computeEnergy({
      age: 29, height: 168, weight: 63,
      sex: 'נקבה', activityLevel: 'בינוני', primaryGoal: 'חיטוב',
    })!;
    expect(e.bmr).toBe(1374);
    expect(e.tdee).toBe(2130);
    expect(e.targetCalories).toBe(1917);
    expect(e.macros).toEqual({ proteinG: 126, fatG: 53, carbG: 233 });
  });

  it('applies maintenance for אחר', () => {
    const e = computeEnergy({ ...base, primaryGoal: 'אחר' })!;
    expect(e.targetCalories).toBe(e.tdee);
  });

  it('honors every activity multiplier', () => {
    const mk = (activityLevel: typeof base.activityLevel) =>
      computeEnergy({ ...base, activityLevel, primaryGoal: 'אחר' })!;
    expect(mk('ישיבה רוב היום').tdee).toBe(Math.round(1740 * 1.2));
    expect(mk('קל').tdee).toBe(Math.round(1740 * 1.375));
    expect(mk('בינוני').tdee).toBe(Math.round(1740 * 1.55));
    expect(mk('גבוה').tdee).toBe(Math.round(1740 * 1.725));
    expect(mk('אתלטי').tdee).toBe(Math.round(1740 * 1.9));
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — `computeEnergy` not exported.

- [ ] **Step 3: Implement `computeEnergy`**

Append to `src/lib/insights.ts`:
```ts
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
```

> Note: `proteinG` is rounded before the carb calculation (protein grams are reported as integers, so carbs balance against the integer protein). Fat in the carb formula uses the raw share (`targetRaw * 0.25`) to match the spec's "carbs fill the remainder."

- [ ] **Step 4: Run to verify pass**

Run: `npm test`
Expected: PASS — all `computeEnergy` tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/insights.ts src/lib/insights.test.ts
git commit -m "feat: insights — energy (BMR/TDEE/target/macros)"
```

---

## Task 5: Insights engine — flags + `computeInsights` aggregate

**Files:**
- Modify: `src/lib/insights.ts`
- Modify: `src/lib/insights.test.ts`

- [ ] **Step 1: Write failing tests**

Append to `src/lib/insights.test.ts`:
```ts
import { computeFlags, computeInsights } from './insights';
import type { Client } from '@/types';

function makeClient(overrides: Partial<Client> = {}): Client {
  const base: Client = {
    id: 'c1',
    status: 'completed',
    createdAt: 0,
    updatedAt: 0,
    coachNotes: '',
    intake: {
      fullName: 'בדיקה', phone: '0500000000', sex: 'זכר',
      medicallyFit: 'כן', takesMedication: 'לא',
      injuriesLimitations: 'אין', athleticBackground: '', sportLastYear: '',
      whyChangeNow: '', goal: '', daysPerWeek: 3, trainingLocation: 'חדר כושר',
      cardioPreference: '', specialNotes: '', referralSource: '', whyMe: '',
      followDuration: '', termsAccepted: true, nutritionDisclaimerAccepted: true,
    },
    nutrition: {
      age: 30, height: 175, weight: 75, hobbies: '', occupationStatus: 'עובד',
      dailyActivityLevel: '', activityLevel: 'בינוני', sleepWakeTimes: '',
      sleepHours: 7, mealsPerDay: 3, whenHungry: '', waterPerDay: '',
      keepsKosher: 'לא', dietType: 'לא', allergies: 'אין', primaryGoal: 'חיטוב',
      hasBodyScale: 'לא', hasFoodScale: 'לא', hasBlender: 'לא',
      dailyNutritionRoutine: '', foodsWontEat: '', mustHaveFoods: '',
      eatingOut: '', snacking: '', supplements: '',
    },
  };
  return {
    ...base,
    ...overrides,
    intake: { ...base.intake, ...(overrides.intake ?? {}) },
    nutrition: { ...base.nutrition, ...(overrides.nutrition ?? {}) },
  };
}

describe('computeFlags', () => {
  it('no flags for a clean client', () => {
    expect(computeFlags(makeClient())).toEqual([]);
  });

  it('flags not-medically-fit (high)', () => {
    const f = computeFlags(makeClient({ intake: { medicallyFit: 'לא' } as never }));
    expect(f.map((x) => x.id)).toContain('not-medically-fit');
    expect(f[0].severity).toBe('high');
  });

  it('flags injuries / allergies / medication with detail', () => {
    const f = computeFlags(
      makeClient({
        intake: { takesMedication: 'כן', medicationDetails: 'ונטולין', injuriesLimitations: 'כתף' } as never,
        nutrition: { allergies: 'בוטנים' } as never,
      }),
    );
    const byId = Object.fromEntries(f.map((x) => [x.id, x]));
    expect(byId.injuries.detail).toBe('כתף');
    expect(byId.allergies.detail).toBe('בוטנים');
    expect(byId.medication.detail).toBe('ונטולין');
    expect(byId.medication.severity).toBe('info');
  });

  it('sorts high → medium → info', () => {
    const f = computeFlags(
      makeClient({
        intake: { medicallyFit: 'לא', takesMedication: 'כן', medicationDetails: 'x', injuriesLimitations: 'כתף' } as never,
      }),
    );
    expect(f.map((x) => x.severity)).toEqual(['high', 'medium', 'info']);
  });
});

describe('computeInsights', () => {
  it('aggregates bmi + energy + flags + needsAttention', () => {
    const ins = computeInsights(makeClient());
    expect(ins.bmi).not.toBeNull();
    expect(ins.energy).not.toBeNull();
    expect(ins.needsAttention).toBe(false);
    expect(ins.missing).toEqual([]);
  });

  it('reports missing fields and null energy', () => {
    const ins = computeInsights(
      makeClient({ intake: { sex: undefined } as never, nutrition: { activityLevel: undefined } as never }),
    );
    expect(ins.energy).toBeNull();
    expect(ins.missing).toEqual(['sex', 'activityLevel']);
  });

  it('needsAttention true with any flag', () => {
    const ins = computeInsights(makeClient({ intake: { takesMedication: 'כן', medicationDetails: 'x' } as never }));
    expect(ins.needsAttention).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — `computeFlags`/`computeInsights` not exported.

- [ ] **Step 3: Implement flags + aggregate**

Append to `src/lib/insights.ts`:
```ts
const SEVERITY_RANK: Record<FlagSeverity, number> = { high: 0, medium: 1, info: 2 };

/** Alert flags from the questionnaire, sorted high → medium → info. */
export function computeFlags(client: Client): Flag[] {
  const { intake, nutrition } = client;
  const flags: Flag[] = [];

  if (intake.medicallyFit === 'לא') {
    flags.push({ id: 'not-medically-fit', severity: 'high', label: 'לא מאושר רפואית' });
  }
  if (isMeaningfulText(intake.injuriesLimitations)) {
    flags.push({ id: 'injuries', severity: 'medium', label: 'פציעות / מגבלות', detail: intake.injuriesLimitations.trim() });
  }
  if (isMeaningfulText(nutrition.allergies)) {
    flags.push({ id: 'allergies', severity: 'medium', label: 'אלרגיות', detail: nutrition.allergies.trim() });
  }
  if (intake.takesMedication === 'כן') {
    flags.push({ id: 'medication', severity: 'info', label: 'נוטל תרופות', detail: intake.medicationDetails?.trim() || undefined });
  }

  return flags.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}

/** Full deterministic insight bundle for one client. */
export function computeInsights(client: Client): ComputedInsights {
  const { intake, nutrition } = client;
  const bmi = computeBmi(nutrition.weight, nutrition.height);
  const energy = computeEnergy({
    age: nutrition.age,
    height: nutrition.height,
    weight: nutrition.weight,
    sex: intake.sex,
    activityLevel: nutrition.activityLevel,
    primaryGoal: nutrition.primaryGoal,
  });
  const flags = computeFlags(client);

  const missing: string[] = [];
  if (!intake.sex) missing.push('sex');
  if (!nutrition.activityLevel) missing.push('activityLevel');

  return { bmi, energy, flags, needsAttention: flags.length > 0, missing };
}
```

- [ ] **Step 4: Run to verify pass**

Run: `npm test`
Expected: PASS — entire `insights.test.ts` green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/insights.ts src/lib/insights.test.ts
git commit -m "feat: insights — flags and computeInsights aggregate"
```

---

## Task 6: `sex` field — schema + intake wizard

**Files:**
- Modify: `src/schemas/intake.ts`
- Modify: `src/components/intake/Step1Intake.tsx`

- [ ] **Step 1: Add `sex` to the intake schema**

In `src/schemas/intake.ts`, add the import at the top:
```ts
import { SEXES, TRAINING_LOCATIONS } from '@/types';
```
(Replace the existing `import { TRAINING_LOCATIONS } from '@/types';` line.)

Then add the field inside `z.object({ ... })`, right after the `phone` field:
```ts
    sex: z.enum(SEXES, {
      required_error: 'יש לבחור מין',
      invalid_type_error: 'יש לבחור מין',
    }),
```

- [ ] **Step 2: Add `sex` to the intro card's validation fields**

In `src/components/intake/Step1Intake.tsx`, in `STEP1_CARDS`, update the `intro` card's `validationFields`:
```ts
    validationFields: ['fullName', 'phone', 'sex'],
```

- [ ] **Step 3: Render the `sex` picker**

In `Step1Intake.tsx`, add `SEXES` to the types import:
```ts
import { SEXES, TRAINING_LOCATIONS } from '@/types';
```
Add `PillRadioField` is already imported. In `renderFields()` `case 0`, add the field after the `phone` `TextField`:
```tsx
            <PillRadioField<FormState>
              name="sex"
              label="מין"
              options={SEXES}
              required
            />
```

- [ ] **Step 4: Verify in the dev server**

Run: `npm run dev`
Open the intake form. Expected: the first card shows a "מין" pill selector (זכר / נקבה); "Continue" stays disabled until it's chosen. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/schemas/intake.ts src/components/intake/Step1Intake.tsx
git commit -m "feat: collect sex in intake wizard"
```

---

## Task 7: `activityLevel` field — schema + nutrition wizard

**Files:**
- Modify: `src/schemas/nutrition.ts`
- Modify: `src/components/intake/Step2Nutrition.tsx`

- [ ] **Step 1: Add `activityLevel` to the nutrition schema**

In `src/schemas/nutrition.ts`, update the `@/types` import to include `ACTIVITY_LEVELS`:
```ts
import {
  ACTIVITY_LEVELS,
  DIET_TYPES,
  EATING_AT_WORK,
  OCCUPATION_STATUSES,
  PRIMARY_GOALS,
  WORK_NATURES,
} from '@/types';
```
Add the field right after `dailyActivityLevel: zOptionalText,`:
```ts
    activityLevel: z.enum(ACTIVITY_LEVELS, {
      required_error: 'יש לבחור רמת פעילות',
      invalid_type_error: 'יש לבחור רמת פעילות',
    }),
```

- [ ] **Step 2: Add `activityLevel` to the lifestyle_2 card validation**

In `src/components/intake/Step2Nutrition.tsx`, in `STEP2_CARDS`, update the `lifestyle_2` card:
```ts
    validationFields: ['hobbies', 'dailyActivityLevel', 'activityLevel'],
```

- [ ] **Step 3: Render the `activityLevel` picker**

In `Step2Nutrition.tsx`, add `ACTIVITY_LEVELS` to the `@/types` import:
```ts
import {
  ACTIVITY_LEVELS,
  OCCUPATION_STATUSES,
  DIET_TYPES,
  PRIMARY_GOALS,
  WORK_NATURES,
  EATING_AT_WORK,
} from '@/types';
```
In `renderFields()` `case 2`, add the field after the `dailyActivityLevel` `TextField`:
```tsx
            <PillRadioField<FormState>
              name="activityLevel"
              label="איך היית מדרג/ת את רמת הפעילות הכללית שלך?"
              options={ACTIVITY_LEVELS}
              required
            />
```

- [ ] **Step 4: Verify in the dev server**

Run: `npm run dev`
Open the nutrition step → the "עוד קצת על השגרה" card. Expected: an "רמת פעילות" pill selector with the 5 levels; "Continue" disabled until chosen. Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/schemas/nutrition.ts src/components/intake/Step2Nutrition.tsx
git commit -m "feat: collect structured activity level in nutrition wizard"
```

---

## Task 8: Update mock seed + green typecheck gate

**Files:**
- Modify: `src/data/mockSeed.ts`

- [ ] **Step 1: Add `sex` to both demo clients**

In `src/data/mockSeed.ts`, in `demo-noa`'s `intake`, add after `phone`:
```ts
        sex: 'נקבה',
```
In `demo-eitan`'s `intake`, add after `phone`:
```ts
        sex: 'זכר',
```

- [ ] **Step 2: Add `activityLevel` to both demo clients**

In `demo-noa`'s `nutrition`, add after `dailyActivityLevel: 'בינונית',`:
```ts
        activityLevel: 'בינוני',
```
In `demo-eitan`'s `nutrition`, add after `dailyActivityLevel: 'גבוהה',`:
```ts
        activityLevel: 'גבוה',
```

- [ ] **Step 3: Green-gate — typecheck, lint, tests**

Run: `npm run typecheck`
Expected: PASS (no missing-field errors).

Run: `npm run lint`
Expected: PASS.

Run: `npm test`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/data/mockSeed.ts
git commit -m "chore: seed sex + activityLevel; restore green typecheck"
```

---

## Task 9: Shared UI — `FlagChip` (flags + BMI)

**Files:**
- Create: `src/components/admin/FlagChip.tsx`

- [ ] **Step 1: Implement the chips**

Create `src/components/admin/FlagChip.tsx`:
```tsx
import { cn } from '@/lib/utils';
import type { Flag, FlagSeverity, BmiCategory } from '@/lib/insights';

const SEVERITY_CLASS: Record<FlagSeverity, string> = {
  high: 'bg-red-500/15 text-red-700 dark:text-red-400',
  medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  info: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
};

const chipBase = 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium whitespace-nowrap';

/** A single quiet, colored alert chip. */
export function FlagChip({ flag, className }: { flag: Flag; className?: string }) {
  return <span className={cn(chipBase, SEVERITY_CLASS[flag.severity], className)}>{flag.label}</span>;
}

const BMI_CLASS: Record<BmiCategory, string> = {
  'תת-משקל': 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  'תקין': 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  'עודף': 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  'השמנה': 'bg-red-500/15 text-red-700 dark:text-red-400',
};

/** BMI value + category, color-coded. */
export function BmiChip({ value, category, className }: { value: number; category: BmiCategory; className?: string }) {
  return (
    <span className={cn(chipBase, BMI_CLASS[category], className)} dir="ltr">
      BMI {value} · {category}
    </span>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/FlagChip.tsx
git commit -m "feat: FlagChip and BmiChip components"
```

---

## Task 10: Dashboard — insights, attention strip, filter, sort, enriched cards

**Files:**
- Modify: `src/routes/AdminDashboard.tsx`

- [ ] **Step 1: Compute per-client insights once, memoized**

In `src/routes/AdminDashboard.tsx`, add imports:
```ts
import { computeInsights } from '@/lib/insights';
import type { ComputedInsights } from '@/lib/insights';
import { FlagChip, BmiChip } from '@/components/admin/FlagChip';
```
After `const { data: clients = [], ... } = useClients();`, add a memoized map of insights:
```ts
  const insightsById = useMemo(() => {
    const map = new Map<string, ComputedInsights>();
    for (const c of clients) map.set(c.id, computeInsights(c));
    return map;
  }, [clients]);
```

- [ ] **Step 2: Add a 4th stat tile + flag filter state + BMI sort**

Replace the `SortKey` type:
```ts
type SortKey = 'date-desc' | 'date-asc' | 'name-asc' | 'bmi-desc' | 'bmi-asc';
```
Change `StatsCards` to accept the attention count and render a 4th tile. Replace the component:
```tsx
function StatsCards({ clients, attention }: { clients: Client[]; attention: number }) {
  const total = clients.length;
  const completed = clients.filter((c) => c.status === 'completed').length;
  const pending = clients.filter((c) => c.status === 'pending').length;

  const stats = [
    { label: 'סה"כ מתאמנים', value: total },
    { label: 'הושלמו', value: completed },
    { label: 'ממתינים', value: pending },
    { label: 'דורשים תשומת לב', value: attention },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map(({ label, value }) => (
        <Card key={label}>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```
Add filter state alongside the others:
```ts
  const [filterFlagged, setFilterFlagged] = useState(false);
```

- [ ] **Step 3: Apply flag filter + BMI sort in the `filtered` memo**

In the `filtered` `useMemo`, add `insightsById` and `filterFlagged` to the dependency array, and:

Inside `.filter(...)`, before `return true;`:
```ts
        if (filterFlagged && !insightsById.get(c.id)?.needsAttention) return false;
```
Inside `.sort(...)`, before the `date-desc` default return, add:
```ts
        if (sort === 'bmi-desc' || sort === 'bmi-asc') {
          const bmiA = insightsById.get(a.id)?.bmi?.value ?? -1;
          const bmiB = insightsById.get(b.id)?.bmi?.value ?? -1;
          return sort === 'bmi-asc' ? bmiA - bmiB : bmiB - bmiA;
        }
```
Update the dependency array:
```ts
  }, [clients, search, filterStatus, filterGoal, filterFlagged, sort, insightsById]);
```

- [ ] **Step 4: Enrich `ClientCard` with insight chips**

Replace the `ClientCard` component:
```tsx
function ClientCard({ client, insights }: { client: Client; insights?: ComputedInsights }) {
  return (
    <Link
      to={`/admin/clients/${client.id}`}
      className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">{client.intake?.fullName ?? 'ללא שם'}</p>
          <p dir="ltr" className="text-start text-sm text-muted-foreground">
            {client.intake?.phone ? formatILMobile(client.intake.phone) : 'ללא טלפון'}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge variant={client.status === 'completed' ? 'success' : 'pending'}>
            {statusLabel(client.status)}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatDate(client.createdAt)}</span>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {client.nutrition?.primaryGoal ?? 'ללא מטרה'}
        </span>
        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {client.intake?.daysPerWeek ?? '?'} ימים
        </span>
        {insights?.bmi && <BmiChip value={insights.bmi.value} category={insights.bmi.category} />}
        {insights?.flags.map((f) => <FlagChip key={f.id} flag={f} />)}
      </div>
    </Link>
  );
}
```

- [ ] **Step 5: Wire the attention strip, flag filter control, BMI sort options, and pass insights to cards**

In the JSX, replace `{clients.length > 0 && <StatsCards clients={clients} />}` with:
```tsx
{clients.length > 0 && (
  <StatsCards
    clients={clients}
    attention={clients.filter((c) => insightsById.get(c.id)?.needsAttention).length}
  />
)}
```
Add a flag-filter toggle button inside the filters `div` (after the sort `Select`):
```tsx
              <button
                type="button"
                onClick={() => setFilterFlagged((v) => !v)}
                className={
                  'rounded-md border px-3 py-2 text-sm transition-colors ' +
                  (filterFlagged
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/40')
                }
                aria-pressed={filterFlagged}
              >
                דורשים תשומת לב
              </button>
```
Add the BMI sort options inside the sort `Select`, after the `name-asc` option:
```tsx
                <option value="bmi-desc">BMI — גבוה לנמוך</option>
                <option value="bmi-asc">BMI — נמוך לגבוה</option>
```
Update the list rendering to pass insights:
```tsx
                  <ClientCard client={c} insights={insightsById.get(c.id)} />
```

- [ ] **Step 6: Verify**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

Run: `npm run dev` → open `/admin` (sign in if needed). Expected: 4 stat tiles incl. "דורשים תשומת לב"; cards show BMI + goal + days chips and red/amber/sky flag chips (Eitan shows "אלרגיות" + "נוטל תרופות"); the "דורשים תשומת לב" button filters to flagged clients; BMI sort options reorder. Stop the server.

- [ ] **Step 7: Commit**

```bash
git add src/routes/AdminDashboard.tsx
git commit -m "feat: dashboard insights — attention stat, flag chips, flag filter, BMI sort"
```

---

## Task 11: Dashboard — desktop sortable table (responsive hybrid)

**Files:**
- Create: `src/components/admin/ClientTable.tsx`
- Modify: `src/routes/AdminDashboard.tsx`

- [ ] **Step 1: Build the table component**

Create `src/components/admin/ClientTable.tsx`:
```tsx
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';
import { formatILMobile } from '@/lib/phone';
import { FlagChip, BmiChip } from '@/components/admin/FlagChip';
import type { Client } from '@/types';
import type { ComputedInsights } from '@/lib/insights';

function statusLabel(s: Client['status']) {
  return s === 'completed' ? 'הושלם' : 'ממתין';
}

export function ClientTable({
  clients,
  insightsById,
}: {
  clients: Client[];
  insightsById: Map<string, ComputedInsights>;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="p-3 text-start font-medium">שם</th>
            <th className="p-3 text-start font-medium">טלפון</th>
            <th className="p-3 text-start font-medium">מטרה</th>
            <th className="p-3 text-start font-medium">BMI</th>
            <th className="p-3 text-start font-medium">ימים</th>
            <th className="p-3 text-start font-medium">התראות</th>
            <th className="p-3 text-start font-medium">סטטוס</th>
            <th className="p-3 text-start font-medium">נוצר</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => {
            const ins = insightsById.get(c.id);
            return (
              <tr key={c.id} className="border-t border-border transition-colors hover:bg-muted/30">
                <td className="p-3">
                  <Link to={`/admin/clients/${c.id}`} className="font-medium hover:text-primary">
                    {c.intake?.fullName ?? 'ללא שם'}
                  </Link>
                </td>
                <td className="p-3" dir="ltr">
                  {c.intake?.phone ? formatILMobile(c.intake.phone) : '—'}
                </td>
                <td className="p-3">{c.nutrition?.primaryGoal ?? '—'}</td>
                <td className="p-3">
                  {ins?.bmi ? <BmiChip value={ins.bmi.value} category={ins.bmi.category} /> : '—'}
                </td>
                <td className="p-3">{c.intake?.daysPerWeek ?? '—'}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {ins && ins.flags.length > 0 ? ins.flags.map((f) => <FlagChip key={f.id} flag={f} />) : '—'}
                  </div>
                </td>
                <td className="p-3">
                  <Badge variant={c.status === 'completed' ? 'success' : 'pending'}>{statusLabel(c.status)}</Badge>
                </td>
                <td className="p-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Render table on desktop, cards on mobile**

In `src/routes/AdminDashboard.tsx`, add the import:
```ts
import { ClientTable } from '@/components/admin/ClientTable';
```
Replace the `<ul className="space-y-3"> ... </ul>` block with a responsive pair:
```tsx
              <>
                {/* Mobile: cards */}
                <ul className="space-y-3 md:hidden">
                  {filtered.map((c) => (
                    <li key={c.id}>
                      <ClientCard client={c} insights={insightsById.get(c.id)} />
                    </li>
                  ))}
                </ul>
                {/* Desktop: table */}
                <div className="hidden md:block">
                  <ClientTable clients={filtered} insightsById={insightsById} />
                </div>
              </>
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

Run: `npm run dev` → `/admin`. Expected: a wide window shows the sortable column table; narrowing to a phone width swaps to enriched cards. Both show BMI + flags. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/ClientTable.tsx src/routes/AdminDashboard.tsx
git commit -m "feat: responsive desktop table for the dashboard"
```

---

## Task 12: Client detail page — full build-out

**Files:**
- Create: `src/components/admin/InsightsPanel.tsx`
- Modify: `src/routes/ClientDetailPage.tsx`

- [ ] **Step 1: Build the insights panel**

Create `src/components/admin/InsightsPanel.tsx`:
```tsx
import { Card, CardContent } from '@/components/ui/card';
import { BmiChip } from '@/components/admin/FlagChip';
import type { ComputedInsights } from '@/lib/insights';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold" dir="ltr">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function InsightsPanel({ insights }: { insights: ComputedInsights }) {
  const { bmi, energy, missing } = insights;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardContent className="py-5">
          <p className="mb-3 text-sm font-semibold">מדד מסת גוף (BMI)</p>
          {bmi ? (
            <BmiChip value={bmi.value} category={bmi.category} />
          ) : (
            <p className="text-sm text-muted-foreground">— נתונים חסרים</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-5">
          <p className="mb-3 text-sm font-semibold">אנרגיה ומאקרו (המלצת פתיחה)</p>
          {energy ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Stat label="BMR" value={energy.bmr} />
                <Stat label="TDEE" value={energy.tdee} />
                <Stat label='יעד קק"ל' value={energy.targetCalories} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
                <Stat label="חלבון (ג׳)" value={energy.macros.proteinG} />
                <Stat label="פחמימה (ג׳)" value={energy.macros.carbG} />
                <Stat label="שומן (ג׳)" value={energy.macros.fatG} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              — נתונים חסרים ({missing.join(', ')})
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Build the detail page**

Replace the entire contents of `src/routes/ClientDetailPage.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '@/components/common/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FlagChip } from '@/components/admin/FlagChip';
import { InsightsPanel } from '@/components/admin/InsightsPanel';
import { useClient, useUpdateClient } from '@/hooks/clients';
import { computeInsights } from '@/lib/insights';
import { formatDate } from '@/lib/format';
import { formatILMobile } from '@/lib/phone';
import type { Client } from '@/types';

type Row = [label: string, value: unknown];

function DataSection({ title, rows }: { title: string; rows: Row[] }) {
  const visible = rows.filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '');
  if (visible.length === 0) return null;
  return (
    <Card>
      <CardContent className="py-5">
        <h2 className="mb-3 border-b border-border pb-2 text-base font-semibold">{title}</h2>
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {visible.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-start font-medium">{String(value)}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function intakeRows(c: Client): Row[] {
  const i = c.intake;
  return [
    ['מין', i.sex], ['מאושר רפואית', i.medicallyFit],
    ['נוטל תרופות', i.takesMedication], ['פירוט תרופות', i.medicationDetails],
    ['פציעות / מגבלות', i.injuriesLimitations], ['רקע ספורטיבי', i.athleticBackground],
    ['ספורט בשנה האחרונה', i.sportLastYear], ['למה עכשיו', i.whyChangeNow],
    ['מטרה', i.goal], ['ימים בשבוע', i.daysPerWeek], ['מיקום אימון', i.trainingLocation],
    ['ציוד בבית', i.homeEquipmentDetails], ['העדפת קרדיו', i.cardioPreference],
    ['הערות מיוחדות', i.specialNotes], ['איך הגיע', i.referralSource],
    ['למה אני', i.whyMe], ['משך מעקב', i.followDuration],
  ];
}

function nutritionRows(c: Client): Row[] {
  const n = c.nutrition;
  return [
    ['גיל', n.age], ['גובה (ס״מ)', n.height], ['משקל (ק״ג)', n.weight],
    ['רמת פעילות', n.activityLevel], ['תחביבים', n.hobbies],
    ['תעסוקה', n.occupationStatus], ['תחום לימודים', n.studyField], ['שנת לימוד', n.studyYear],
    ['תחום עבודה', n.workField], ['אופי עבודה', n.workNature], ['אכילה בעבודה', n.eatingAtWork],
    ['מיקרוגל', n.microwaveAtWork], ['מקרר', n.fridgeAtWork],
    ['פעילות יומית (חופשי)', n.dailyActivityLevel], ['שעות שינה/השכמה', n.sleepWakeTimes],
    ['שעות שינה', n.sleepHours], ['ארוחות ביום', n.mealsPerDay], ['מתי רעב', n.whenHungry],
    ['מים ביום', n.waterPerDay], ['כשרות', n.keepsKosher], ['סוג תזונה', n.dietType],
    ['מאכלים אהובים', n.enjoyedFoods], ['מאכלים לא אהובים', n.dislikedFoods],
    ['אלרגיות', n.allergies], ['מטרה תזונתית', n.primaryGoal], ['פירוט מטרה', n.primaryGoalOther],
    ['משקל גוף', n.hasBodyScale], ['משקל מזון', n.hasFoodScale], ['בלנדר', n.hasBlender],
    ['שגרת תזונה', n.dailyNutritionRoutine], ['לא יאכל', n.foodsWontEat],
    ['חייב בתפריט', n.mustHaveFoods], ['אכילה בחוץ', n.eatingOut],
    ['נשנושים', n.snacking], ['תוספים', n.supplements],
  ];
}

export default function ClientDetailPage() {
  const { id } = useParams();
  const { data: client, isLoading, isError } = useClient(id);
  const updateClient = useUpdateClient();

  const [notes, setNotes] = useState('');
  useEffect(() => {
    if (client) setNotes(client.coachNotes ?? '');
  }, [client]);

  if (isLoading) {
    return (
      <div className="min-h-dvh">
        <Header subtitle="כרטיס מתאמן" />
        <main className="container py-8">
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
        </main>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="min-h-dvh">
        <Header subtitle="כרטיס מתאמן" />
        <main className="container py-8">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              לא נמצא מתאמן. <Link to="/admin" className="text-primary">חזרה לרשימה</Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const insights = computeInsights(client);

  function saveNotes() {
    if (!client) return;
    updateClient.mutate(
      { id: client.id, patch: { coachNotes: notes } },
      { onSuccess: () => toast.success('ההערות נשמרו'), onError: () => toast.error('שמירת ההערות נכשלה') },
    );
  }

  function toggleStatus() {
    if (!client) return;
    const next = client.status === 'completed' ? 'pending' : 'completed';
    updateClient.mutate(
      { id: client.id, patch: { status: next } },
      { onError: () => toast.error('עדכון הסטטוס נכשל') },
    );
  }

  return (
    <div className="min-h-dvh">
      <Header subtitle="כרטיס מתאמן" />
      <main className="container space-y-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link to="/admin" className="text-sm text-primary">→ חזרה לרשימה</Link>
            <h1 className="mt-1 text-2xl font-bold">{client.intake.fullName}</h1>
            <p dir="ltr" className="text-start text-sm text-muted-foreground">
              {formatILMobile(client.intake.phone)} · {formatDate(client.createdAt)}
            </p>
          </div>
          <button type="button" onClick={toggleStatus} aria-label="החלף סטטוס">
            <Badge variant={client.status === 'completed' ? 'success' : 'pending'}>
              {client.status === 'completed' ? 'הושלם' : 'ממתין'}
            </Badge>
          </button>
        </div>

        {insights.flags.length > 0 && (
          <Card>
            <CardContent className="py-5">
              <h2 className="mb-3 text-base font-semibold">דורש תשומת לב</h2>
              <ul className="space-y-2">
                {insights.flags.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 text-sm">
                    <FlagChip flag={f} />
                    {f.detail && <span className="text-muted-foreground">{f.detail}</span>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <InsightsPanel insights={insights} />

        <DataSection title="שאלון קליטה ואימונים" rows={intakeRows(client)} />
        <DataSection title="שאלון תזונה" rows={nutritionRows(client)} />

        <Card>
          <CardContent className="py-5">
            <h2 className="mb-3 text-base font-semibold">הערות מאמן</h2>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={5} />
            <div className="mt-3 flex justify-end">
              <Button onClick={saveNotes} disabled={updateClient.isPending}>
                {updateClient.isPending ? 'שומר…' : 'שמירת הערות'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI insight slot — reserved for a future AI summary (separate spec). */}
        <Card>
          <CardContent className="py-5">
            <h2 className="mb-2 text-base font-semibold">סיכום חכם (בקרוב)</h2>
            <p className="text-sm text-muted-foreground">
              סיכום אוטומטי של המתאמן יתווסף כאן בהמשך.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint`
Expected: PASS.

Run: `npm test`
Expected: PASS.

Run: `npm run dev` → `/admin` → click a client (e.g. איתן). Expected: back link, name + status badge (clicking toggles הושלם/ממתין), a "דורש תשומת לב" callout listing אלרגיות (אגוזי לוז) + נוטל תרופות, the BMI + energy/macros panel, both full questionnaire sections, an editable coach-notes box that saves with a toast, and the "סיכום חכם (בקרוב)" placeholder. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/InsightsPanel.tsx src/routes/ClientDetailPage.tsx
git commit -m "feat: build out client detail page with insights, flags, notes"
```

---

## Self-Review Notes (resolved)

- **Spec coverage:** §2 engine → Tasks 3-5; §3 data model → Tasks 2,6,7,8; §4 formulas → Tasks 3-5 (with concrete fixtures); §5 dashboard → Tasks 10,11; §6 detail page → Task 12; §7 edge handling → null/"—" paths in Tasks 9,11,12; §8 testing → Task 1 + tests in 3-5; §9 AI seam → Task 12 placeholder panel.
- **Type consistency:** `ComputedInsights`, `Flag`, `Bmi`, `Energy`, `BmiCategory`, `FlagSeverity` defined in Task 3/4/5 and consumed unchanged in Tasks 9-12. `computeInsights`/`computeFlags`/`computeEnergy`/`computeBmi`/`isMeaningfulText` names are stable across tasks.
- **Known red window:** typecheck is intentionally red between Task 2 and Task 8 (new required fields); the green-gate runs at Task 8 Step 3. Insights tests (Tasks 3-5) run independently via `npm test`.
- **Placeholder test:** Task 3 Step 1 includes a self-flagged throwaway `it('categorizes boundaries')` with an instruction to delete it before running — replaced by the `maps each category band` test.
