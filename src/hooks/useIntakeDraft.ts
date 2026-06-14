import { useCallback } from 'react';
import type { IntakeValues } from '@/schemas/intake';
import type { NutritionValues } from '@/schemas/nutrition';

const DRAFT_KEY = 'liam_intake_draft';

interface DraftData {
  step1?: Partial<IntakeValues>;
  step2?: Partial<NutritionValues>;
}

function loadDraft(): DraftData {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as DraftData) : {};
  } catch {
    return {};
  }
}

function saveDraft(data: DraftData) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  } catch {
    // storage full — silently ignore
  }
}

export function useIntakeDraft() {
  const getStep1 = useCallback((): Partial<IntakeValues> => loadDraft().step1 ?? {}, []);
  const getStep2 = useCallback((): Partial<NutritionValues> => loadDraft().step2 ?? {}, []);

  const saveStep1 = useCallback((values: Partial<IntakeValues>) => {
    saveDraft({ ...loadDraft(), step1: values });
  }, []);

  const saveStep2 = useCallback((values: Partial<NutritionValues>) => {
    saveDraft({ ...loadDraft(), step2: values });
  }, []);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
  }, []);

  return { getStep1, getStep2, saveStep1, saveStep2, clearDraft };
}
