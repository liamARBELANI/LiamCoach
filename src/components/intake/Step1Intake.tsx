import { useState, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
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

type FormState = Record<string, unknown>;

interface CardMeta {
  id: string;
  Icon: LucideIcon;
  headline: string;
  subtitle: string;
  validationFields: string[];
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
    subtitle: 'אישור אחד קטן ואנחנו מתקדמים לשלב הבא',
    validationFields: ['termsAccepted'],
  },
];

interface Step1IntakeProps {
  defaultValues: Partial<IntakeValues>;
  onChange: (values: Partial<IntakeValues>) => void;
  cardIdx: number;
  onNextCard: () => void;
  onFinish: (values: IntakeValues, goalImageFile: File | null) => void;
}

export function Step1Intake({
  defaultValues,
  onChange,
  cardIdx,
  onNextCard,
  onFinish,
}: Step1IntakeProps) {
  const [goalImageFile, setGoalImageFile] = useState<File | null>(null);

  const methods = useForm<FormState>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      ...defaultValues,
      termsAccepted: defaultValues.termsAccepted ?? false,
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

  function onFormSubmit(data: FormState) {
    onFinish(data as unknown as IntakeValues, goalImageFile);
  }

  async function handleContinue() {
    const valid = isLastCard
      ? await trigger()
      : await trigger(card.validationFields);
    
    if (!valid) {
      if (isLastCard) {
        const errorKeys = Object.keys(methods.formState.errors)
          .map(k => `[${k}]`)
          .join(', ');
        toast.error(`יש שדות חובה שלא מולאו ${errorKeys}. חזור ובדוק את כל השלבים.`);
      }
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

  function renderFields() {
    switch (cardIdx) {
      case 0:
        return (
          <>
            <TextField<FormState>
              name="fullName"
              label="שם מלא"
              placeholder="ישראל ישראלי"
              required
            />
            <TextField<FormState>
              name="phone"
              label="מספר פלאפון"
              placeholder="050-0000000"
              required
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
              placeholder="אם אין — השאר ריק"
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
                placeholder="שם התרופה, מינון, מתי נוטל..."
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
              placeholder="ספורט שעשית בעבר, כמה שנים, רמה..."
            />
            <TextareaField<FormState>
              name="sportLastYear"
              label="ספורט שעשית בשנה האחרונה"
              placeholder="תדירות, סוג פעילות..."
            />
          </>
        );

      case 4:
        return (
          <>
            <TextareaField<FormState>
              name="whyChangeNow"
              label="למה החלטת להתחיל עכשיו?"
              placeholder="מה גרם לך לפנות אלי דווקא עכשיו?"
            />
            <TextareaField<FormState>
              name="goal"
              label="מה המטרה שלך?"
              placeholder="תאר את המטרה הפיזית / בריאותית שלך..."
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
                placeholder="משקולות, גומיות, מתח, מזרן..."
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
              placeholder="ריצה, אופניים, שחייה, אין העדפה..."
            />
            <TextareaField<FormState>
              name="specialNotes"
              label="הערות מיוחדות לאימון"
              placeholder="כל מה שחשוב שאדע..."
            />
          </>
        );

      case 8:
        return (
          <>
            <TextField<FormState>
              name="referralSource"
              label="איך שמעת עלי?"
              placeholder="חבר, אינסטגרם, גוגל..."
            />
            <TextareaField<FormState>
              name="whyMe"
              label="למה בחרת בי כמאמן?"
              placeholder="מה משך אותך אלי דווקא?"
            />
            <TextField<FormState>
              name="followDuration"
              label="כמה זמן אתה עוקב אחרי?"
              placeholder="שבוע, חודשיים, שנה..."
            />
          </>
        );

      case 9:
        return (
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
        );

      default:
        return null;
    }
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={(e) => e.preventDefault()} className="flex min-h-[calc(100dvh-5rem)] flex-col">
        <div className="flex-1">
          <CardShell Icon={card.Icon} headline={card.headline} subtitle={card.subtitle}>
            {renderFields()}
          </CardShell>
        </div>
        <div className="mt-auto px-6 pb-8 pt-4">
          <Button
            onClick={handleContinue}
            className="h-14 w-full rounded-2xl text-lg font-medium shadow-lg shadow-primary/25"
          >
            {isLastCard ? 'המשך לשלב 2' : 'המשך'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
