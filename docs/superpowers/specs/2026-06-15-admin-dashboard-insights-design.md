# Admin Dashboard + Computed Insights — Design

**Date:** 2026-06-15
**Status:** Approved (design), pending implementation plan
**Scope:** Redesigned, scalable admin dashboard + a deterministic per-trainee insights layer. AI summaries are explicitly *out of scope* here but designed-in as a clean fast-follow.

---

## 1. Goal & Motivation

The current admin dashboard ([src/routes/AdminDashboard.tsx](../../../src/routes/AdminDashboard.tsx)) lists trainees with a 3-stat strip, search/filter/sort, and clickable cards. It works but is plain, shows little of the rich questionnaire data at a glance, and the per-trainee detail page ([src/routes/ClientDetailPage.tsx](../../../src/routes/ClientDetailPage.tsx)) is still a stub.

This project delivers:

1. A better-looking, scalable dashboard that stays usable at 50+ trainees.
2. A **deterministic insights layer** that computes and surfaces the parameters a coach actually needs per trainee — no AI, no backend, instant and free.
3. A built-out detail page where the full per-trainee analysis lives.
4. A clean seam where an AI summary layer plugs in later (separate spec).

---

## 2. Architecture

### 2.1 Insights engine — `src/lib/insights.ts` (new)

All computed insights live in one **pure-function module**: no React, no Firebase. Signature:

```ts
computeInsights(client: Client): ComputedInsights
```

```ts
interface ComputedInsights {
  bmi: { value: number; category: 'תת-משקל' | 'תקין' | 'עודף' | 'השמנה' } | null;
  energy: {
    bmr: number;
    tdee: number;
    targetCalories: number;
    macros: { proteinG: number; carbG: number; fatG: number };
  } | null;                                  // null when sex/activity/weight missing
  flags: Flag[];                             // sorted high → info
  needsAttention: boolean;                   // flags.length > 0
  missing: string[];                         // field keys that blocked a computation
}

type FlagSeverity = 'high' | 'medium' | 'info';
interface Flag {
  id: 'not-medically-fit' | 'injuries' | 'allergies' | 'medication';
  severity: FlagSeverity;
  label: string;                             // Hebrew label for UI
  detail?: string;                           // source text (injury / allergy / medication details)
}
```

Rationale: trivially unit-testable, reused by dashboard + detail page (and later the AI prompt builder), and keeps all math out of the UI.

### 2.2 Consumers

- **Dashboard** ([AdminDashboard.tsx](../../../src/routes/AdminDashboard.tsx)) — calls `computeInsights` per client (memoized) to render BMI chip, flags, days/week, and to build the "needs attention" strip + stat tile.
- **Detail page** ([ClientDetailPage.tsx](../../../src/routes/ClientDetailPage.tsx)) — full insights panel + flag callouts.

---

## 3. Data Model Changes

Two new fields unlock the energy math. Existing records lacking them degrade gracefully (insight shows "—" + quiet "missing data" note; never crashes).

### 3.1 `sex` — added to `IntakeForm`

```ts
sex: 'זכר' | 'נקבה';
```

Added to the intake wizard ([Step1Intake.tsx](../../../src/components/intake/Step1Intake.tsx)) alongside personal basics, with validation, mirroring the existing field pattern. Schema updated in [src/schemas/intake.ts](../../../src/schemas/intake.ts).

### 3.2 `activityLevel` — added to `NutritionForm`

```ts
export const ACTIVITY_LEVELS = [
  'ישיבה רוב היום', 'קל', 'בינוני', 'גבוה', 'אתלטי',
] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

activityLevel: ActivityLevel;
```

Added to the nutrition wizard ([Step2Nutrition.tsx](../../../src/components/intake/Step2Nutrition.tsx)) as a structured picker. The existing free-text `dailyActivityLevel` stays for the coach's qualitative notes; the new enum drives the TDEE multiplier. Schema updated in [src/schemas/nutrition.ts](../../../src/schemas/nutrition.ts).

Type definitions updated in [src/types/index.ts](../../../src/types/index.ts).

---

## 4. Computed Insights — Formulas

All outputs are a **starting recommendation**, labeled as such in the UI (consistent with the existing nutrition disclaimer).

### 4.1 BMI

`bmi = weight / (height_m)^2`, rounded to 1 decimal.

| BMI | Category |
|-----|----------|
| < 18.5 | תת-משקל |
| 18.5 – 24.9 | תקין |
| 25.0 – 29.9 | עודף |
| ≥ 30.0 | השמנה |

Rendered as a color-coded chip. BMI extremes (השמנה / תת-משקל) are **not** an attention flag — they show as a colored chip only, to avoid alarm fatigue.

### 4.2 Energy — Mifflin-St Jeor

- BMR (men): `10·kg + 6.25·cm − 5·age + 5`
- BMR (women): `10·kg + 6.25·cm − 5·age − 161`
- `tdee = bmr × activityMultiplier`

| Activity level | Multiplier |
|----------------|-----------|
| ישיבה רוב היום | 1.2 |
| קל | 1.375 |
| בינוני | 1.55 |
| גבוה | 1.725 |
| אתלטי | 1.9 |

### 4.3 Target calories by `primaryGoal`

| Goal | Adjustment |
|------|-----------|
| ירידה במשקל | −15% |
| חיטוב | −10% |
| מסה | +15% |
| עלייה במשקל | +15% |
| כוח | +5% |
| אחר | maintenance (0%) |

### 4.4 Macros (from target calories)

- **Protein:** `2.0 g × bodyweight(kg)` → ×4 kcal
- **Fat:** `25% of targetCalories` ÷ 9
- **Carbs:** remaining calories ÷ 4

All rounded to whole grams. Macro kcal sum back to target calories (within rounding). Rendered as grams + a ring/bar.

> Tunable judgment calls: protein 2.0 g/kg; weight-loss deficit 15%.

### 4.5 Flags & severity

| Condition | Trigger | Severity |
|-----------|---------|----------|
| Not medically fit | `intake.medicallyFit === 'לא'` | high |
| Has injuries / limitations | `intake.injuriesLimitations` is "meaningful" (see below) | medium |
| Has allergies | `nutrition.allergies` is "meaningful" | medium |
| Takes medication | `intake.takesMedication === 'כן'` | info |

**"Meaningful" free-text check.** `injuriesLimitations` and `allergies` are required free-text fields, so trainees usually answer "אין" / "לא" / "-" rather than leaving them blank. A shared `isMeaningfulText(value)` helper treats these as empty: trim, then return `false` if the result is empty or matches a negation set (`'אין'`, `'לא'`, `'אין לי'`, `'ללא'`, `'-'`, `'—'`, `'none'`, `'no'`, `'na'`, `'n/a'`). Only meaningful text raises the flag.

- `needsAttention = flags.length > 0`.
- Flags sort high → medium → info for display.
- Each flag carries `detail` (the source text) for the detail-page callout.

---

## 5. Dashboard UI (responsive hybrid)

**Desktop → data table; mobile → enriched cards.** Both carry the same data.

### 5.1 Stats strip

4 tiles: סה"כ מתאמנים · הושלמו · ממתינים · **דורשים תשומת לב** (count of clients with ≥1 flag). Clicking the attention tile applies the flag filter.

### 5.2 "Needs attention" strip

Collapsible section pinned above the list, listing flagged trainees compactly, sorted by max severity. Hidden when count is 0.

### 5.3 Controls

- Search by name / phone (existing).
- Filters: status, goal (existing) + **new: by flag presence**.
- Sort: date, name (existing) + **new: by BMI**.

### 5.4 List

- **Desktop table** columns: name · phone · goal · BMI (chip) · days/week · flags · status · created. Sortable headers, sticky header.
- **Mobile cards:** enriched version of the current card with insight chips + quiet flag markers.
- Row/card → `/admin/clients/:id`.
- Plain render (no virtualization — YAGNI until measured slow).

### 5.5 Visual language

Per project design taste ([memory: design-professional-not-aiish]): tight corners, no decorative icons/emoji, quiet accent. Flags render as quiet colored text/dots, not emoji. RTL throughout.

---

## 6. Detail Page (built from stub)

Route `/admin/clients/:id`, built out from the current placeholder.

- **Header:** back link, trainee name, status badge.
- **Needs-attention callout** (top, when flagged): each flag expanded with its source text (actual injury description, allergy, medication details).
- **Insights panel:** BMI card · energy card (BMR / TDEE / target calories + macro grams with a ring) · at-a-glance chips (goal, days/week, training location, diet type). Shows "—" + "missing data" note where `sex`/`activityLevel` absent.
- **Full questionnaire:** intake + nutrition rendered read-only in two labeled groups.
- **Coach notes:** editable textarea + status toggle (pending/completed), saved via the existing `ClientRepository.update()` adapter ([src/data/adapter.ts](../../../src/data/adapter.ts)).
- **AI insight slot:** a clearly-marked placeholder panel where a future AI summary renders. Not wired to any LLM in this spec.
- **Not-found:** `client === null` → friendly message.

---

## 7. Error & Edge Handling

- Reuse existing loading skeletons + error card on the dashboard.
- Missing `sex` / `activityLevel` / weight → energy block returns `null`; UI shows "—" with a quiet "missing data" note. No NaN, no crash.
- Empty optional text fields → no flag.
- Detail page handles unknown id gracefully.

---

## 8. Testing

No test framework exists today. Add **Vitest** (Vite-native, minimal config) as a dev dependency.

**Unit tests — `src/lib/insights.test.ts`:**
- BMI category boundaries (18.5, 25, 30).
- BMR for men and women (known reference values).
- TDEE across all 5 activity multipliers.
- Target calories for every `primaryGoal`.
- Macros sum back to target calories (within rounding).
- Each flag fires on its exact condition and not otherwise.
- Severity ordering of mixed flags.
- Missing-data inputs return `null`/"—" rather than NaN.

UI correctness relies on existing `npm run typecheck` + `npm run lint` and manual verification. No component test harness in this spec (can add later).

---

## 9. AI Fast-Follow (out of scope — seam only)

Designed-in, not built:

- `insights.ts` already emits a clean structured object.
- A later spec adds `buildTraineePrompt(client, insights)` and a **Firebase Cloud Function** that calls Claude server-side (API key stays off the client; per-call cost).
- The detail page's **AI insight slot** is the render target.

This spec leaves the seam clean and calls no LLM.

---

## 10. Files Touched

**New:**
- `src/lib/insights.ts`
- `src/lib/insights.test.ts`
- Vitest config + dev dependency

**Modified:**
- `src/types/index.ts` — add `sex`, `ActivityLevel`/`activityLevel`.
- `src/schemas/intake.ts`, `src/schemas/nutrition.ts` — validation for new fields.
- `src/components/intake/Step1Intake.tsx`, `Step2Nutrition.tsx` — new field inputs.
- `src/routes/AdminDashboard.tsx` — stats tile, attention strip, flag filter, BMI sort, responsive table/cards.
- `src/routes/ClientDetailPage.tsx` — full build-out.
- Possibly small shared UI (table primitive, chip/flag component) under `src/components/`.
