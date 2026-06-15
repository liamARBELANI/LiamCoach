import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  User,
  Heart,
  Zap,
  Target,
  Dumbbell,
  Star,
  CheckCircle2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { intakeSchema } from '@/schemas/intake';
import type { IntakeValues } from '@/schemas/intake';
import { TRAINING_LOCATIONS } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import {
  TextField,
  TextareaField,
  SelectNumberField,
  PillRadioField,
  PillYesNoField,
} from './fields';
import { GoalImageUpload } from './GoalImageUpload';
import { CardShell } from './CardShell';
import type { StepHandle } from './StickyActionBar';

type FormState = Record<string, unknown>;

interface CardMeta {
  id: string;
  Icon: LucideIcon;
  headline: string;
  subtitle: string;
  validationFields: string[];
  /**
   * Conditional-required checks that Zod's `.superRefine` can't enforce during a
   * partial `trigger([...])`. Returns a map of field → error message for any that
   * fail, or null when the card is valid. Keyed off form values, never card index.
   */
  validate?: (data: FormState) => Record<string, string> | null;
}

export const STEP1_CARDS: CardMeta[] = [
  {
    id: 'intro',
    Icon: User,
    headline: 'ברוכ/ה הבא/ה!',
    subtitle: 'בוא נכיר אחד את השני — קצת פרטים בסיסיים כדי להתחיל',
    validationFields: ['fullName', 'phone'],
  },
  {
    id: 'medical_1',
    Icon: Heart,
    headline: 'קודם — בריאות',
    subtitle: 'כמה שאלות בסיסיות כדי שהתוכנית תתאים לך בדיוק',
    validationFields: ['medicallyFit', 'injuriesLimitations'],
  },
  {
    id: 'medical_2',
    Icon: Heart,
    headline: 'עוד קצת על בריאות',
    subtitle: 'האם יש תרופות קבועות שחשוב שאדע עליהן?',
    validationFields: ['takesMedication', 'medicationDetails'],
    validate: (data) =>
      data.takesMedication === 'כן' && !String(data.medicationDetails || '').trim()
        ? { medicationDetails: 'יש לפרט אילו תרופות' }
        : null,
  },
  {
    id: 'sports',
    Icon: Zap,
    headline: 'ספר לי על הספורט שלך',
    subtitle: 'לא משנה מה הרקע שלך — כל נקודת התחלה מושלמת',
    validationFields: ['athleticBackground', 'sportLastYear'],
  },
  {
    id: 'goals_1',
    Icon: Target,
    headline: 'מה המטרה שלך?',
    subtitle: 'כדי לעזור לך להגיע לשם — אני צריך להבין לאן אתה רוצה להגיע',
    validationFields: ['whyChangeNow', 'goal'],
  },
  {
    id: 'goals_2',
    Icon: Target,
    headline: 'תמונה שווה אלף מילים',
    subtitle: 'יש לך תמונת מטרה? נשמח לראות לאן אנחנו מכוונים',
    validationFields: ['goalImageUrl'],
  },
  {
    id: 'training_1',
    Icon: Dumbbell,
    headline: 'בוא נבנה לך תוכנית!',
    subtitle: 'איך אתה מדמיין את עצמך מתאמן?',
    validationFields: ['daysPerWeek', 'trainingLocation', 'homeEquipmentDetails'],
    validate: (data) =>
      data.trainingLocation === 'בית' && !String(data.homeEquipmentDetails || '').trim()
        ? { homeEquipmentDetails: 'יש לפרט את הציוד הקיים בבית' }
        : null,
  },
  {
    id: 'training_2',
    Icon: Dumbbell,
    headline: 'העדפות אימון',
    subtitle: 'דברים שחשוב לי לדעת כדי לבנות את האימון המושלם עבורך',
    validationFields: ['cardioPreference', 'specialNotes'],
  },
  {
    id: 'referral',
    Icon: Star,
    headline: 'איך הגעת אלי?',
    subtitle: 'סיפור ההכרות שלנו — חשוב לי לדעת',
    validationFields: ['referralSource', 'whyMe', 'followDuration'],
  },
  {
    id: 'terms',
    Icon: CheckCircle2,
    headline: 'כמעט סיימנו!',
    subtitle: 'שני אישורים קטנים ואנחנו מתקדמים לשלב הבא',
    validationFields: ['termsAccepted', 'nutritionDisclaimerAccepted'],
  },
];

interface Step1IntakeProps {
  defaultValues: Partial<IntakeValues>;
  onChange: (values: Partial<IntakeValues>) => void;
  cardIdx: number;
  onNextCard: () => void;
  onFinish: (values: IntakeValues, goalImageFile: File | null) => void;
  /** Reports whether the current card's required fields are satisfied. */
  onValidityChange?: (valid: boolean) => void;
}

export const Step1Intake = forwardRef<StepHandle, Step1IntakeProps>(function Step1Intake(
  { defaultValues, onChange, cardIdx, onNextCard, onFinish, onValidityChange },
  ref,
) {
  const [goalImageFile, setGoalImageFile] = useState<File | null>(null);

  const methods = useForm<FormState>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      ...defaultValues,
      termsAccepted: defaultValues.termsAccepted ?? false,
      nutritionDisclaimerAccepted: defaultValues.nutritionDisclaimerAccepted ?? false,
    },
    mode: 'onBlur',
  });

  const { handleSubmit, trigger, watch, formState: { errors } } = methods;

  // Persist draft on every change
  const values = watch();
  useEffect(() => {
    onChange(values as Partial<IntakeValues>);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const takesMedication = useWatch({ control: methods.control, name: 'takesMedication' }) as string;
  const trainingLocation = useWatch({ control: methods.control, name: 'trainingLocation' }) as string;

  const card = STEP1_CARDS[cardIdx];
  const isLastCard = cardIdx === STEP1_CARDS.length - 1;

  // Reactively gate the "Continue" button: it stays disabled until this card's
  // required fields are satisfied, so a required field can never be skipped and
  // surface only at final submit. Validity is derived from the Zod schema (the
  // single source of truth) plus the card's conditional rule.
  const isCardValid = useMemo(() => {
    const result = intakeSchema.safeParse(values);
    let requiredOk: boolean;
    if (result.success) {
      requiredOk = true;
    } else if (isLastCard) {
      requiredOk = false;
    } else {
      const cardFields = new Set(card.validationFields);
      requiredOk = !result.error.issues.some((issue) => cardFields.has(String(issue.path[0])));
    }
    const conditionalOk = !card.validate?.(values as FormState);
    return requiredOk && conditionalOk;
  }, [values, card, isLastCard]);

  useEffect(() => {
    onValidityChange?.(isCardValid);
  }, [isCardValid, onValidityChange]);

  function onFormSubmit(data: FormState) {
    onFinish(data as unknown as IntakeValues, goalImageFile);
  }

  async function handleContinue() {
    let valid = isLastCard
      ? await trigger()
      : await trigger(card.validationFields);

    // Card-scoped conditional rules (data-driven, never tied to card index).
    const conditionalErrors = card.validate?.(methods.getValues());
    if (conditionalErrors) {
      for (const [field, message] of Object.entries(conditionalErrors)) {
        methods.setError(field, { type: 'manual', message });
      }
      valid = false;
    }

    if (!valid) {
      toast.error(
        isLastCard
          ? 'יש שדות חובה שלא מולאו — חזרו ובדקו את השלבים.'
          : 'יש למלא את שדות החובה בכרטיס זה.',
      );
      return;
    }

    if (!isLastCard) {
      onNextCard();
      return;
    }

    handleSubmit(onFormSubmit, () => {
      toast.error('יש שגיאות בטופס. אנא בדוק את כל השלבים.');
    })();
  }

  useImperativeHandle(ref, () => ({ submit: handleContinue }));

  function renderFields() {
    switch (cardIdx) {
      case 0:
        return (
          <>
            <TextField<FormState>
              name="fullName"
              label="שם מלא"

              required
            />
            <TextField<FormState>
              name="phone"
              label="טלפון נייד"
              required
              type="tel"
              inputMode="numeric"
              dir="ltr"
            />
          </>
        );

      case 1:
        return (
          <>
            <PillYesNoField<FormState>
              name="medicallyFit"
              label="האם אתה מאושר רפואית לפעילות גופנית?"
              required
            />
            <TextareaField<FormState>
              name="injuriesLimitations"
              label="פציעות או מגבלות רפואיות"

            />
          </>
        );

      case 2:
        return (
          <>
            <PillYesNoField<FormState>
              name="takesMedication"
              label="האם אתה נוטל תרופות?"
              required
            />
            {takesMedication === 'כן' && (
              <TextareaField<FormState>
                name="medicationDetails"
                label="פרט אילו תרופות"

                required
              />
            )}
          </>
        );

      case 3:
        return (
          <>
            <TextareaField<FormState>
              name="athleticBackground"
              label="רקע ספורטיבי"

            />
            <TextareaField<FormState>
              name="sportLastYear"
              label="ספורט שעשית בשנה האחרונה"

            />
          </>
        );

      case 4:
        return (
          <>
            <TextareaField<FormState>
              name="whyChangeNow"
              label="למה החלטת להתחיל עכשיו?"

            />
            <TextareaField<FormState>
              name="goal"
              label="מה המטרה שלך?"

            />
          </>
        );

      case 5:
        return (
          <>
            <GoalImageUpload onChange={setGoalImageFile} />
          </>
        );

      case 6:
        return (
          <div className="space-y-5">
            <SelectNumberField<FormState>
              name="daysPerWeek"
              label="כמה ימים בשבוע נרצה להתאמן?"
              min={1}
              max={7}
              unit="ימים"
              required
            />
            <PillRadioField<FormState>
              name="trainingLocation"
              label="היכן תרצה להתאמן?"
              options={TRAINING_LOCATIONS}
              required
            />
            {trainingLocation === 'בית' && (
              <TextareaField<FormState>
                name="homeEquipmentDetails"
                label="פרט את הציוד הקיים בבית"

                required
              />
            )}
          </div>
        );

      case 7:
        return (
          <>
            <TextareaField<FormState>
              name="cardioPreference"
              label="העדפות קרדיו"

            />
            <TextareaField<FormState>
              name="specialNotes"
              label="הערות מיוחדות לאימון"

            />
          </>
        );

      case 8:
        return (
          <>
            <TextField<FormState>
              name="referralSource"
              label="איך שמעת עלי?"

            />
            <TextareaField<FormState>
              name="whyMe"
              label="למה בחרת בי כמאמן?"

            />
            <TextField<FormState>
              name="followDuration"
              label="כמה זמן אתה עוקב אחרי?"

            />
          </>
        );

      case 9:
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/30 p-5">
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  {...methods.register('termsAccepted')}
                  className="mt-0.5"
                />
                <span className="text-sm leading-relaxed text-foreground">
                  אני מאשר/ת שהמידע שמסרתי מדויק ומלא. אני מבין/ה שהתכנית תיבנה על בסיס
                  פרטים אלה ואני מקבל/ת אחריות מלאה על עצמי.
                  <span className="text-destructive ms-1">*</span>
                </span>
              </label>
              {errors.termsAccepted && (
                <p role="alert" className="mt-2 text-xs text-destructive">
                  {String(errors.termsAccepted.message)}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-5">
              <label className="flex cursor-pointer items-start gap-3">
                <Checkbox
                  {...methods.register('nutritionDisclaimerAccepted')}
                  className="mt-0.5"
                />
                <span className="text-sm leading-relaxed text-foreground">
                  אני מאשר/ת שאני יודע/ת שתוכנית האימונים והתפריט הם המלצה בלבד, ושהמאמן
                  אינו יועץ תזונה מוסמך.
                  <span className="text-destructive ms-1">*</span>
                </span>
              </label>
              {errors.nutritionDisclaimerAccepted && (
                <p role="alert" className="mt-2 text-xs text-destructive">
                  {String(errors.nutritionDisclaimerAccepted.message)}
                </p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={(e) => e.preventDefault()}>
        <CardShell Icon={card.Icon} headline={card.headline} subtitle={card.subtitle}>
          {renderFields()}
        </CardShell>
      </form>
    </FormProvider>
  );
});
