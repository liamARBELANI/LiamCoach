import { z } from 'zod';
import { TRAINING_LOCATIONS } from '@/types';
import { isValidILMobile } from '@/lib/phone';
import { zNumber, zOptionalText, zRequiredText } from './helpers';

const yesNo = (required: string) =>
  z.enum(['כן', 'לא'], {
    required_error: required,
    invalid_type_error: required,
  });

export const intakeSchema = z
  .object({
    // פרטים אישיים
    fullName: zRequiredText('יש להזין שם מלא', 2),
    phone: zRequiredText('יש להזין מספר פלאפון').refine(isValidILMobile, {
      message: 'מספר פלאפון לא תקין (למשל 050-1234567)',
    }),

    // רקע רפואי
    medicallyFit: yesNo('יש לבחור תשובה'),
    takesMedication: yesNo('יש לבחור תשובה'),
    medicationDetails: zOptionalText,
    injuriesLimitations: zOptionalText,

    // רקע ספורטיבי
    athleticBackground: zOptionalText,
    sportLastYear: zOptionalText,

    // מטרות
    whyChangeNow: zOptionalText,
    goal: zOptionalText,
    goalImageUrl: z.string().optional(),

    // אימונים
    daysPerWeek: zNumber({
      required: 'יש לבחור מספר ימים',
      min: [1, 'לפחות יום אחד בשבוע'],
      max: [7, 'עד 7 ימים בשבוע'],
      int: true,
    }),
    trainingLocation: z.enum(TRAINING_LOCATIONS, {
      required_error: 'יש לבחור מיקום אימון',
      invalid_type_error: 'יש לבחור מיקום אימון',
    }),
    homeEquipmentDetails: zOptionalText,

    // העדפות
    cardioPreference: zOptionalText,
    specialNotes: zOptionalText,

    // שיווק
    referralSource: zOptionalText,
    whyMe: zOptionalText,
    followDuration: zOptionalText,

    // תקנון
    termsAccepted: z.boolean().refine((v) => v === true, {
      message: 'יש לאשר את התקנון כדי להמשיך',
    }),
    nutritionDisclaimerAccepted: z.boolean().refine((v) => v === true, {
      message: 'יש לאשר את ההצהרה כדי להמשיך',
    }),
  })
  .superRefine((data, ctx) => {
    if (data.takesMedication === 'כן' && !data.medicationDetails?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['medicationDetails'],
        message: 'יש לפרט אילו תרופות',
      });
    }
    if (data.trainingLocation === 'בית' && !data.homeEquipmentDetails?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['homeEquipmentDetails'],
        message: 'יש לפרט את הציוד הקיים בבית',
      });
    }
  });

export type IntakeInput = z.input<typeof intakeSchema>;
export type IntakeValues = z.output<typeof intakeSchema>;
