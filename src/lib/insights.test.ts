import { describe, it, expect } from 'vitest';
import { isMeaningfulText, computeBmi, computeEnergy } from './insights';

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
    const mk = (activityLevel: ActivityLevel) =>
      computeEnergy({ ...base, activityLevel, primaryGoal: 'אחר' })!;
    expect(mk('ישיבה רוב היום').tdee).toBe(Math.round(1740 * 1.2));
    expect(mk('קל').tdee).toBe(Math.round(1740 * 1.375));
    expect(mk('בינוני').tdee).toBe(Math.round(1740 * 1.55));
    expect(mk('גבוה').tdee).toBe(Math.round(1740 * 1.725));
    expect(mk('אתלטי').tdee).toBe(Math.round(1740 * 1.9));
  });
});

import { computeFlags, computeInsights } from './insights';
import type { ActivityLevel, Client } from '@/types';

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

  it('does not throw on a partial client missing intake/nutrition', () => {
    const partial = { id: 'p1', status: 'pending', createdAt: 0, updatedAt: 0, coachNotes: '' } as unknown as Client;
    const ins = computeInsights(partial);
    expect(ins.bmi).toBeNull();
    expect(ins.energy).toBeNull();
    expect(ins.flags).toEqual([]);
    expect(ins.needsAttention).toBe(false);
    expect(ins.missing).toEqual(['sex', 'activityLevel']);
  });
});

describe('computeFlags', () => {
  it('returns [] for a partial client missing intake/nutrition', () => {
    const partial = { id: 'p1', status: 'pending', createdAt: 0, updatedAt: 0, coachNotes: '' } as unknown as Client;
    expect(computeFlags(partial)).toEqual([]);
  });
});
