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
    const mk = (activityLevel: typeof base.activityLevel) =>
      computeEnergy({ ...base, activityLevel, primaryGoal: 'אחר' })!;
    expect(mk('ישיבה רוב היום').tdee).toBe(Math.round(1740 * 1.2));
    expect(mk('קל').tdee).toBe(Math.round(1740 * 1.375));
    expect(mk('בינוני').tdee).toBe(Math.round(1740 * 1.55));
    expect(mk('גבוה').tdee).toBe(Math.round(1740 * 1.725));
    expect(mk('אתלטי').tdee).toBe(Math.round(1740 * 1.9));
  });
});
