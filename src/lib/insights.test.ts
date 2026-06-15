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
