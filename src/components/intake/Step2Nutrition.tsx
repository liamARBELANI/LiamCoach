import { useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Ruler,
  Sun,
  Moon,
  UtensilsCrossed,
  Leaf,
  Heart,
  TrendingUp,
  Home,
  Clock,
  Sparkles,
  Briefcase,
  GraduationCap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { nutritionSchema } from '@/schemas/nutrition';
import type { NutritionValues } from '@/schemas/nutrition';
import { isStudying, isWorking } from '@/schemas/nutrition';
import {
  ACTIVITY_LEVELS,
  OCCUPATION_STATUSES,
  DIET_TYPES,
  PRIMARY_GOALS,
  WORK_NATURES,
  EATING_AT_WORK,
} from '@/types';
import {
  TextField,
  TextareaField,
  SelectNumberField,
  PillRadioField,
  PillYesNoField,
  TimePickerField,
} from './fields';
import { CardShell } from './CardShell';
import type { StepHandle } from './StickyActionBar';

type FormState = Record<string, unknown>;

/**
 * A conditional sub-form that smoothly expands into view. Used when an answer
 * (e.g. "I work") unlocks follow-up questions — it slides + fades open instead
 * of snapping in, and carries a soft branded frame so it reads as "extra,
 * related" rather than a wall of cramped inputs.
 */
function RevealPanel({
  show,
  panelKey,
  Icon,
  title,
  children,
}: {
  show: boolean;
  panelKey: string;
  Icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence initial={false} mode="wait">
      {show && (
        <motion.div
          key={panelKey}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden"
        >
          <div className="space-y-5 rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/[0.06] to-transparent p-5 shadow-[0_1px_0_0_hsl(var(--primary)/0.08)_inset]">
            <div className="flex items-center justify-center gap-2 text-primary">
              <Icon className="h-4 w-4" strokeWidth={2} />
              <span className="text-sm font-semibold tracking-wide">{title}</span>
            </div>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

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

export const STEP2_CARDS: CardMeta[] = [
  {
    id: 'metrics',
    Icon: Ruler,
    headline: 'המספרים שלך',
    subtitle: 'גיל, גובה, משקל — הבסיס לכל חישוב תזונתי',
    validationFields: ['age', 'height', 'weight'],
  },
  {
    id: 'lifestyle_1',
    Icon: Sun,
    headline: 'איך נראה היום שלך?',
    subtitle: 'בוא נבין את השגרה שלך כדי להתאים את התפריט',
    validationFields: [
      'occupationStatus',
      'studyField',
      'studyYear',
      'workField',
      'workNature',
      'eatingAtWork',
      'microwaveAtWork',
      'fridgeAtWork',
    ],
  },
  {
    id: 'lifestyle_2',
    Icon: Sun,
    headline: 'עוד קצת על השגרה',
    subtitle: 'תחביבים ופעילות כללית',
    validationFields: ['hobbies', 'dailyActivityLevel', 'activityLevel'],
  },
  {
    id: 'lifestyle_3',
    Icon: Moon,
    headline: 'זמן מנוחה',
    subtitle: 'שינה טובה היא מפתח להצלחה',
    validationFields: ['sleepTime', 'wakeUpTime', 'sleepHours'],
    validate: (data) =>
      !data.wakeUpTime || !data.sleepTime
        ? { sleepTime: 'יש לבחור שעת שינה ושעת השכמה' }
        : null,
  },
  {
    id: 'meals',
    Icon: UtensilsCrossed,
    headline: 'נדבר על אוכל!',
    subtitle: 'כמה ארוחות, מתי רעבים, וכמה שותים',
    validationFields: ['mealsPerDay', 'whenHungry', 'waterPerDay'],
  },
  {
    id: 'preferences_1',
    Icon: Leaf,
    headline: 'העדפות תזונה',
    subtitle: 'סוג תזונה, כשרות ואלרגיות',
    validationFields: ['dietType', 'keepsKosher', 'allergies'],
  },
  {
    id: 'preferences_2',
    Icon: Heart,
    headline: 'מה טעים לך?',
    subtitle: 'התפריט צריך להיות גם טעים וגם עובד',
    validationFields: ['enjoyedFoods', 'dislikedFoods'],
  },
  {
    id: 'goal',
    Icon: TrendingUp,
    headline: 'מה המטרה התזונתית שלך?',
    subtitle: 'ביחד נגיע לשם — פשוט תגיד לי לאן',
    validationFields: ['primaryGoal', 'primaryGoalOther'],
    validate: (data) =>
      data.primaryGoal === 'אחר' && !String(data.primaryGoalOther || '').trim()
        ? { primaryGoalOther: 'יש לפרט את המטרה' }
        : null,
  },
  {
    id: 'equipment',
    Icon: Home,
    headline: 'מה יש לך בבית?',
    subtitle: 'ציוד הוא יתרון — בואו נראה מה יש לנו לעבוד איתו',
    validationFields: ['hasBodyScale', 'hasFoodScale', 'hasBlender'],
  },
  {
    id: 'habits_1',
    Icon: Clock,
    headline: 'שגרת התזונה שלך',
    subtitle: 'ספר לי קצת על ההרגלים הנוכחיים',
    validationFields: ['dailyNutritionRoutine', 'foodsWontEat'],
  },
  {
    id: 'habits_2',
    Icon: UtensilsCrossed,
    headline: 'הרגלים נוספים',
    subtitle: 'אכילה בחוץ, נשנושים ודברים שחייבים בתפריט',
    validationFields: ['mustHaveFoods', 'eatingOut', 'snacking'],
  },
  {
    id: 'supplements',
    Icon: Sparkles,
    headline: 'כמעט סיימנו!',
    subtitle: 'שאלה אחרונה ואנחנו שולחים — מבטיח!',
    validationFields: ['supplements'],
  },
];

interface Step2NutritionProps {
  defaultValues: Partial<NutritionValues>;
  onChange: (values: Partial<NutritionValues>) => void;
  cardIdx: number;
  onNextCard: () => void;
  onSubmit: (values: NutritionValues) => void;
  /** Reports whether the current card's required fields are satisfied. */
  onValidityChange?: (valid: boolean) => void;
}

export const Step2Nutrition = forwardRef<StepHandle, Step2NutritionProps>(function Step2Nutrition(
  { defaultValues, onChange, cardIdx, onNextCard, onSubmit, onValidityChange },
  ref,
) {
  const methods = useForm<FormState>({
    resolver: zodResolver(nutritionSchema),
    defaultValues: defaultValues as FormState,
    mode: 'onBlur',
  });

  const { handleSubmit, trigger, watch } = methods;

  const values = watch();
  useEffect(() => {
    onChange(values as Partial<NutritionValues>);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const occupationStatus = useWatch({ control: methods.control, name: 'occupationStatus' }) as string | undefined;
  const primaryGoal = useWatch({ control: methods.control, name: 'primaryGoal' }) as string | undefined;
  const wakeUpTime = useWatch({ control: methods.control, name: 'wakeUpTime' }) as string | undefined;
  const sleepTime = useWatch({ control: methods.control, name: 'sleepTime' }) as string | undefined;

  useEffect(() => {
    if (!wakeUpTime || !sleepTime) return;
    const [wh, wm] = wakeUpTime.split(':').map(Number);
    const [sh, sm] = sleepTime.split(':').map(Number);
    const diff = ((wh * 60 + wm) - (sh * 60 + sm) + 1440) % 1440;
    const hours = Math.round((diff / 60) * 10) / 10;
    methods.setValue('sleepHours', hours, { shouldValidate: true });
    methods.setValue('sleepWakeTimes', `${sleepTime} - ${wakeUpTime}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wakeUpTime, sleepTime]);

  const card = STEP2_CARDS[cardIdx];
  const isLastCard = cardIdx === STEP2_CARDS.length - 1;

  // Reactively gate the "Continue" button: it stays disabled until this card's
  // required fields are satisfied, so a required field can never be skipped and
  // surface only at final submit. Validity is derived from the Zod schema (the
  // single source of truth) plus the card's conditional rule.
  const isCardValid = useMemo(() => {
    const result = nutritionSchema.safeParse(values);
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
    onSubmit(data as unknown as NutritionValues);
  }

  async function handleContinue() {
    // On the last card, validate the ENTIRE form (no args) so required
    // fields from earlier cards can't be silently skipped.
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
          <div className="grid grid-cols-3 gap-4">
            <SelectNumberField<FormState> name="age" label="גיל" required unit="שנים" min={14} max={100} />
            <SelectNumberField<FormState> name="height" label="גובה" required unit='ס"מ' min={120} max={250} />
            <SelectNumberField<FormState> name="weight" label="משקל" required unit='ק"ג' min={30} max={200} />
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <PillRadioField<FormState>
              name="occupationStatus"
              label="סטטוס תעסוקתי"
              options={OCCUPATION_STATUSES}
              required
            />
            <RevealPanel
              show={isStudying(occupationStatus)}
              panelKey="study"
              Icon={GraduationCap}
              title="קצת על הלימודים"
            >
              <TextField<FormState> name="studyField" label="תחום לימודים" />
              <TextField<FormState> name="studyYear" label="שנת לימודים" />
            </RevealPanel>
            <RevealPanel
              show={isWorking(occupationStatus)}
              panelKey="work"
              Icon={Briefcase}
              title="קצת על העבודה"
            >
              <TextField<FormState> name="workField" label="תחום עבודה" />
              <PillRadioField<FormState> name="workNature" label="אופי העבודה" options={WORK_NATURES} />
              <PillRadioField<FormState> name="eatingAtWork" label="איפה אתה אוכל בעבודה?" options={EATING_AT_WORK} />
              <div className="grid grid-cols-2 gap-4">
                <PillYesNoField<FormState> name="microwaveAtWork" label="מיקרוגל בעבודה?" />
                <PillYesNoField<FormState> name="fridgeAtWork" label="מקרר בעבודה?" />
              </div>
            </RevealPanel>
          </div>
        );

      case 2:
        return (
          <>
            <TextareaField<FormState> name="hobbies" label="תחביבים ופעילויות פנאי" />
            <TextField<FormState> name="dailyActivityLevel" label="רמת פעילות יומית (מחוץ לאימונים)" />
            <PillRadioField<FormState>
              name="activityLevel"
              label="איך היית מדרג/ת את רמת הפעילות הכללית שלך?"
              options={ACTIVITY_LEVELS}
              required
            />
          </>
        );

      case 3: {
        const computedHours = (() => {
          if (!wakeUpTime || !sleepTime) return null;
          const [wh, wm] = wakeUpTime.split(':').map(Number);
          const [sh, sm] = sleepTime.split(':').map(Number);
          const diff = ((wh * 60 + wm) - (sh * 60 + sm) + 1440) % 1440;
          return Math.round((diff / 60) * 10) / 10;
        })();
        return (
          <div className="space-y-5">
            <TimePickerField<FormState> name="sleepTime" label="שעת שינה" required />
            <TimePickerField<FormState> name="wakeUpTime" label="שעת השכמה" required />
            {computedHours !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl border border-primary/20 bg-primary/5 py-5 text-center"
              >
                <p className="text-4xl font-bold text-primary">{computedHours}</p>
                <p className="mt-1 text-sm text-muted-foreground">שעות שינה סה״כ</p>
              </motion.div>
            )}
          </div>
        );
      }

      case 4:
        return (
          <div className="space-y-5">
            <SelectNumberField<FormState> name="mealsPerDay" label="כמה ארוחות אתה אוכל ביום?" required unit="ארוחות" min={1} max={12} />
            <TextareaField<FormState> name="whenHungry" label="באילו שעות אתה רעב במיוחד?" />
            <TextField<FormState> name="waterPerDay" label="כמה מים אתה שותה ביום בערך?" />
          </div>
        );

      case 5:
        return (
          <>
            <PillRadioField<FormState> name="dietType" label="סוג תזונה" options={DIET_TYPES} required />
            <PillYesNoField<FormState> name="keepsKosher" label="האם אתה שומר כשרות?" />
            <TextareaField<FormState> name="allergies" label="אלרגיות / רגישויות למזון" />
          </>
        );

      case 6:
        return (
          <>
            <TextareaField<FormState> name="enjoyedFoods" label="מאכלים שאתה אוהב במיוחד" />
            <TextareaField<FormState> name="dislikedFoods" label="מאכלים שאתה לא מוכן לאכול" />
          </>
        );

      case 7:
        return (
          <>
            <PillRadioField<FormState> name="primaryGoal" label="מה המטרה התזונתית שלך?" options={PRIMARY_GOALS} required />
            {primaryGoal === 'אחר' && (
              <TextareaField<FormState> name="primaryGoalOther" label="פרט את המטרה שלך" required />
            )}
          </>
        );

      case 8:
        return (
          <>
            <div className="grid grid-cols-2 gap-4">
              <PillYesNoField<FormState> name="hasBodyScale" label="משקל גוף?" />
              <PillYesNoField<FormState> name="hasFoodScale" label="משקל מזון?" />
            </div>
            <PillYesNoField<FormState> name="hasBlender" label="בלנדר / שייקר?" />
          </>
        );

      case 9:
        return (
          <>
            <TextareaField<FormState> name="dailyNutritionRoutine" label="איך נראית התזונה שלך ביום רגיל?" rows={4} />
            <TextareaField<FormState> name="foodsWontEat" label="מאכלים שלעולם לא תאכל" />
          </>
        );

      case 10:
        return (
          <>
            <TextareaField<FormState> name="mustHaveFoods" label="מאכלים שחייבים להיות בתפריט שלך" />
            <TextareaField<FormState> name="eatingOut" label="תדירות אכילה בחוץ" />
            <TextareaField<FormState> name="snacking" label="נשנושים" />
          </>
        );

      case 11:
        return (
          <TextareaField<FormState> name="supplements" label="תוספים שאתה לוקח כעת" />
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
