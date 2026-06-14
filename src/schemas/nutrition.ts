import { z } from 'zod';
import {
  DIET_TYPES,
  EATING_AT_WORK,
  OCCUPATION_STATUSES,
  PRIMARY_GOALS,
  WORK_NATURES,
} from '@/types';
import { zNumber, zOptionalText } from './helpers';

const optionalYesNo = z.enum(['כן', 'לא']).optional();

/** Conditional-visibility predicates shared with the wizard UI. */
export const isStudying = (s: string | undefined) =>
  s === 'לומד' || s === 'גם עובד וגם לומד';
export const isWorking = (s: string | undefined) =>
  s === 'עובד' || s === 'גם עובד וגם לומד';

export const nutritionSchema = z
  .object({
    // פרטים אישיים
    age: zNumber({
      required: 'יש להזין גיל',
      min: [1, 'גיל לא תקין'],
      max: [120, 'גיל לא תקין'],
      int: true,
    }),
    height: zNumber({
      required: 'יש להזין גובה',
      min: [80, 'גובה לא תקין (בס״מ)'],
      max: [250, 'גובה לא תקין (בס״מ)'],
    }),
    weight: zNumber({
      required: 'יש להזין משקל',
      min: [20, 'משקל לא תקין (בק״ג)'],
      max: [400, 'משקל לא תקין (בק״ג)'],
    }),

    // אורח חיים
    hobbies: zOptionalText,
    occupationStatus: z.enum(OCCUPATION_STATUSES, {
      required_error: 'יש לבחור תשובה',
      invalid_type_error: 'יש לבחור תשובה',
    }),

    // לימודים (מותנה)
    studyField: zOptionalText,
    studyYear: zOptionalText,

    // עבודה (מותנה)
    workField: zOptionalText,
    workNature: z.enum(WORK_NATURES).optional(),
    eatingAtWork: z.enum(EATING_AT_WORK).optional(),
    microwaveAtWork: optionalYesNo,
    fridgeAtWork: optionalYesNo,

    // אורח חיים (המשך)
    dailyActivityLevel: zOptionalText,
    sleepWakeTimes: zOptionalText,
    sleepHours: zNumber({
      required: 'יש להזין שעות שינה',
      min: [1, 'ערך לא תקין'],
      max: [24, 'ערך לא תקין'],
    }),

    // תכנון תפריט
    mealsPerDay: zNumber({
      required: 'יש להזין מספר ארוחות',
      min: [1, 'לפחות ארוחה אחת'],
      max: [12, 'ערך לא תקין'],
      int: true,
    }),
    whenHungry: zOptionalText,
    waterPerDay: zOptionalText,

    // העדפות תזונה
    keepsKosher: optionalYesNo,
    dietType: z.enum(DIET_TYPES, {
      required_error: 'יש לבחור תשובה',
      invalid_type_error: 'יש לבחור תשובה',
    }),
    enjoyedFoods: zOptionalText,
    dislikedFoods: zOptionalText,

    // בריאות
    allergies: zOptionalText,

    // מטרה
    primaryGoal: z.enum(PRIMARY_GOALS, {
      required_error: 'יש לבחור מטרה',
      invalid_type_error: 'יש לבחור מטרה',
    }),
    primaryGoalOther: zOptionalText,

    // ציוד בבית
    hasBodyScale: optionalYesNo,
    hasFoodScale: optionalYesNo,
    hasBlender: optionalYesNo,

    // הרגלי אכילה
    dailyNutritionRoutine: zOptionalText,
    foodsWontEat: zOptionalText,
    mustHaveFoods: zOptionalText,
    eatingOut: zOptionalText,
    snacking: zOptionalText,

    // תוספי תזונה
    supplements: zOptionalText,
  })
  .superRefine((data, ctx) => {
    if (data.primaryGoal === 'אחר' && !data.primaryGoalOther?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['primaryGoalOther'],
        message: 'יש לפרט את המטרה',
      });
    }
    // Studies / work fields are revealed conditionally (see isStudying / isWorking)
    // but remain optional per spec §10/§16.
  });

export type NutritionInput = z.input<typeof nutritionSchema>;
export type NutritionValues = z.output<typeof nutritionSchema>;
