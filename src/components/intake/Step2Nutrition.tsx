import { useEffect } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { nutritionSchema } from '@/schemas/nutrition';
import type { NutritionValues } from '@/schemas/nutrition';
import { isStudying, isWorking } from '@/schemas/nutrition';
import {
  OCCUPATION_STATUSES,
  DIET_TYPES,
  PRIMARY_GOALS,
  WORK_NATURES,
  EATING_AT_WORK,
} from '@/types';
import { Button } from '@/components/ui/button';
import {
  TextField,
  TextareaField,
  SelectNumberField,
  PillRadioField,
  PillYesNoField,
} from './fields';
import { CardShell } from './CardShell';

type FormState = Record<string, unknown>;

interface CardMeta {
  id: string;
  Icon: LucideIcon;
  headline: string;
  subtitle: string;
  validationFields: string[];
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
    validationFields: ['hobbies', 'dailyActivityLevel'],
  },
  {
    id: 'lifestyle_3',
    Icon: Moon,
    headline: 'זמן מנוחה',
    subtitle: 'שינה טובה היא מפתח להצלחה',
    validationFields: ['sleepWakeTimes', 'sleepHours'],
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
  isSubmitting: boolean;
}

export function Step2Nutrition({
  defaultValues,
  onChange,
  cardIdx,
  onNextCard,
  onSubmit,
  isSubmitting,
}: Step2NutritionProps) {
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

  const card = STEP2_CARDS[cardIdx];
  const isLastCard = cardIdx === STEP2_CARDS.length - 1;

  function onFormSubmit(data: FormState) {
    onSubmit(data as unknown as NutritionValues);
  }

  async function handleContinue() {
    // On the last card, validate the ENTIRE form (no args) so required
    // fields from earlier cards can't be silently skipped.
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
          <div className="grid grid-cols-3 gap-4">
            <SelectNumberField<FormState> name="age" label="גיל" required unit="שנים" min={14} max={100} />
            <SelectNumberField<FormState> name="height" label="גובה" required unit='ס"מ' min={120} max={250} />
            <SelectNumberField<FormState> name="weight" label="משקל" required unit='ק"ג' min={30} max={200} />
          </div>
        );

      case 1:
        return (
          <>
            <PillRadioField<FormState>
              name="occupationStatus"
              label="סטטוס תעסוקתי"
              options={OCCUPATION_STATUSES}
              required
            />
            {isStudying(occupationStatus) && (
              <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-center">לימודים</p>
                <TextField<FormState> name="studyField" label="תחום לימודים" placeholder="הנדסת תוכנה, ביולוגיה..." />
                <TextField<FormState> name="studyYear" label="שנת לימודים" placeholder="שנה א׳, שנה ג׳..." />
              </div>
            )}
            {isWorking(occupationStatus) && (
              <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-center">עבודה</p>
                <TextField<FormState> name="workField" label="תחום עבודה" placeholder="מחשבים, בנייה, חינוך..." />
                <PillRadioField<FormState> name="workNature" label="אופי העבודה" options={WORK_NATURES} />
                <PillRadioField<FormState> name="eatingAtWork" label="איפה אתה אוכל בעבודה?" options={EATING_AT_WORK} />
                <div className="grid grid-cols-2 gap-4">
                  <PillYesNoField<FormState> name="microwaveAtWork" label="מיקרוגל בעבודה?" />
                  <PillYesNoField<FormState> name="fridgeAtWork" label="מקרר בעבודה?" />
                </div>
              </div>
            )}
          </>
        );

      case 2:
        return (
          <>
            <TextareaField<FormState> name="hobbies" label="תחביבים ופעילויות פנאי" placeholder="טיולים, ציור, מוזיקה..." />
            <TextField<FormState> name="dailyActivityLevel" label="רמת פעילות יומית (מחוץ לאימונים)" placeholder="יושב רוב היום, הולך הרבה, פעיל מאוד..." />
          </>
        );

      case 3:
        return (
          <div className="space-y-5">
            <TextField<FormState> name="sleepWakeTimes" label="שעות שינה והשכמה בדרך כלל" placeholder="23:30 - 07:00" />
            <SelectNumberField<FormState> name="sleepHours" label="כמה שעות אתה ישן בלילה?" required unit="שעות" min={1} max={24} />
          </div>
        );

      case 4:
        return (
          <div className="space-y-5">
            <SelectNumberField<FormState> name="mealsPerDay" label="כמה ארוחות אתה אוכל ביום?" required unit="ארוחות" min={1} max={12} />
            <TextareaField<FormState> name="whenHungry" label="באילו שעות אתה רעב במיוחד?" placeholder="אחר הצהריים, שעות הלילה..." />
            <TextField<FormState> name="waterPerDay" label="כמה מים אתה שותה ביום בערך?" placeholder="ליטר וחצי, 4 כוסות..." />
          </div>
        );

      case 5:
        return (
          <>
            <PillRadioField<FormState> name="dietType" label="סוג תזונה" options={DIET_TYPES} required />
            <PillYesNoField<FormState> name="keepsKosher" label="האם אתה שומר כשרות?" />
            <TextareaField<FormState> name="allergies" label="אלרגיות / רגישויות למזון" placeholder="לוקטוז, גלוטן, בוטנים..." />
          </>
        );

      case 6:
        return (
          <>
            <TextareaField<FormState> name="enjoyedFoods" label="מאכלים שאתה אוהב במיוחד" placeholder="פסטה, בשר, שוקולד..." />
            <TextareaField<FormState> name="dislikedFoods" label="מאכלים שאתה לא מוכן לאכול" placeholder="ברוקולי, טונה..." />
          </>
        );

      case 7:
        return (
          <>
            <PillRadioField<FormState> name="primaryGoal" label="מה המטרה התזונתית שלך?" options={PRIMARY_GOALS} required />
            {primaryGoal === 'אחר' && (
              <TextareaField<FormState> name="primaryGoalOther" label="פרט את המטרה שלך" placeholder="לעלות במשקל, להשתתף בתחרות..." required />
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
            <TextareaField<FormState> name="dailyNutritionRoutine" label="איך נראית התזונה שלך ביום רגיל?" placeholder="בוקר קפה ומאפה, צהריים בעבודה..." rows={4} />
            <TextareaField<FormState> name="foodsWontEat" label="מאכלים שלעולם לא תאכל" placeholder="דגים נאים, איברים פנימיים..." />
          </>
        );

      case 10:
        return (
          <>
            <TextareaField<FormState> name="mustHaveFoods" label="מאכלים שחייבים להיות בתפריט שלך" placeholder="לפחות קוביית שוקולד אחת ביום..." />
            <TextareaField<FormState> name="eatingOut" label="תדירות אכילה בחוץ" placeholder="פעם בשבוע, כל צהריים..." />
            <TextareaField<FormState> name="snacking" label="נשנושים" placeholder="בין ארוחות, מול הטלוויזיה..." />
          </>
        );

      case 11:
        return (
          <TextareaField<FormState> name="supplements" label="תוספים שאתה לוקח כעת" placeholder="חלבון, ויטמין D, אומגה 3... אם אין — השאר ריק" />
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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'שולח...' : isLastCard ? 'סיום מתאמן חדש' : 'המשך'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
