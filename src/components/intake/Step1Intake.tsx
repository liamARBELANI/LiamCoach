import { useState, useEffect } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
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
  NumberField,
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
    headline: '!ברוכ/ה הבא/ה',
    subtitle: 'בוא נכיר אחד את השני — קצת פרטים בסיסיים כדי להתחיל',
    validationFields: ['fullName', 'phone'],
  },
  {
    id: 'medical',
    Icon: Heart,
    headline: 'קודם — בריאות',
    subtitle: 'כמה שאלות בסיסיות כדי שהתוכנית תתאים לך בדיוק',
    validationFields: ['medicallyFit', 'takesMedication', 'medicationDetails', 'injuriesLimitations'],
  },
  {
    id: 'sports',
    Icon: Zap,
    headline: 'ספר לי על הספורט שלך',
    subtitle: 'לא משנה מה הרקע שלך — כל נקודת התחלה מושלמת',
    validationFields: ['athleticBackground', 'sportLastYear'],
  },
  {
    id: 'goals',
    Icon: Target,
    headline: '?מה אתה שם לעצמך',
    subtitle: 'כדי לעזור לך להגיע לשם — אני צריך להבין לאן אתה רוצה להגיע',
    validationFields: ['whyChangeNow', 'goal'],
  },
  {
    id: 'training',
    Icon: Dumbbell,
    headline: '!בוא נבנה לך תוכנית',
    subtitle: 'איך אתה מדמיין את עצמך מתאמן?',
    validationFields: ['daysPerWeek', 'trainingLocation', 'homeEquipmentDetails'],
  },
  {
    id: 'referral',
    Icon: Star,
    headline: '?איך הגעת אלי',
    subtitle: 'סיפור ההכרות שלנו — חשוב לי לדעת',
    validationFields: ['referralSource', 'whyMe', 'followDuration'],
  },
  {
    id: 'terms',
    Icon: CheckCircle2,
    headline: '!כמעט שם',
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
    const valid = await trigger(card.validationFields);
    if (!valid) return;

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

      case 3:
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
            <GoalImageUpload onChange={setGoalImageFile} />
          </>
        );

      case 4:
        return (
          <>
            <NumberField<FormState>
              name="daysPerWeek"
              label="כמה ימים בשבוע תרצה להתאמן?"
              placeholder="3"
              required
              unit="ימים"
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

      case 5:
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

      case 6:
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
      <form noValidate>
        <CardShell Icon={card.Icon} headline={card.headline} subtitle={card.subtitle}>
          {renderFields()}
          <motion.div whileTap={{ scale: 0.97 }} className="pt-2">
            <Button
              type="button"
              onClick={handleContinue}
              className="w-full"
              size="lg"
            >
              {isLastCard ? 'המשך לשלב 2' : 'המשך'}
            </Button>
          </motion.div>
        </CardShell>
      </form>
    </FormProvider>
  );
}
