import { useEffect } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Ruler,
  Sun,
  UtensilsCrossed,
  Leaf,
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
  NumberField,
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
    id: 'lifestyle',
    Icon: Sun,
    headline: '?איך נראה היום שלך',
    subtitle: 'כדי לבנות תפריט שיתאים לחיים שלך — לא להפך',
    validationFields: [
      'occupationStatus',
      'sleepHours',
      'hobbies',
      'dailyActivityLevel',
      'sleepWakeTimes',
    ],
  },
  {
    id: 'meals',
    Icon: UtensilsCrossed,
    headline: '!נדבר על אוכל',
    subtitle: 'כמה ארוחות, מה קורה בין הארוחות, וכמה שותים ביום',
    validationFields: ['mealsPerDay', 'whenHungry', 'waterPerDay'],
  },
  {
    id: 'preferences',
    Icon: Leaf,
    headline: '?מה אתה אוהב לאכול',
    subtitle: 'העדפות שלך הן הבסיס לתפריט שנבנה יחד',
    validationFields: ['dietType', 'keepsKosher', 'enjoyedFoods', 'dislikedFoods', 'allergies'],
  },
  {
    id: 'goal',
    Icon: TrendingUp,
    headline: '?מה המטרה התזונתית שלך',
    subtitle: 'ביחד נגיע לשם — פשוט תגיד לי לאן',
    validationFields: ['primaryGoal', 'primaryGoalOther'],
  },
  {
    id: 'equipment',
    Icon: Home,
    headline: '?מה יש לך בבית',
    subtitle: 'ציוד הוא יתרון — בואו נראה מה יש לנו לעבוד איתו',
    validationFields: ['hasBodyScale', 'hasFoodScale', 'hasBlender'],
  },
  {
    id: 'habits',
    Icon: Clock,
    headline: 'הרגלי האכילה שלך',
    subtitle: 'גם הרגלים שנראים "לא טובים" — חשוב שאדע',
    validationFields: [
      'dailyNutritionRoutine',
      'foodsWontEat',
      'mustHaveFoods',
      'eatingOut',
      'snacking',
    ],
  },
  {
    id: 'supplements',
    Icon: Sparkles,
    headline: '!כמעט הגמרנו',
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
  const dietType = useWatch({ control: methods.control, name: 'dietType' }) as string | undefined;
  const primaryGoal = useWatch({ control: methods.control, name: 'primaryGoal' }) as string | undefined;

  const card = STEP2_CARDS[cardIdx];
  const isLastCard = cardIdx === STEP2_CARDS.length - 1;

  function onFormSubmit(data: FormState) {
    onSubmit(data as unknown as NutritionValues);
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
          <div className="grid grid-cols-3 gap-4">
            <NumberField<FormState>
              name="age"
              label="גיל"
              placeholder="25"
              required
              unit="שנים"
            />
            <NumberField<FormState>
              name="height"
              label="גובה"
              placeholder="175"
              required
              unit='ס"מ'
            />
            <NumberField<FormState>
              name="weight"
              label="משקל"
              placeholder="75"
              required
              unit='ק"ג'
            />
          </div>
        );

      case 1:
        return (
          <>
            <TextareaField<FormState>
              name="hobbies"
              label="תחביבים ופעילויות פנאי"
              placeholder="טיולים, ציור, מוזיקה..."
            />
            <PillRadioField<FormState>
              name="occupationStatus"
              label="סטטוס תעסוקתי"
              options={OCCUPATION_STATUSES}
              required
            />
            {isStudying(occupationStatus) && (
              <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">לימודים</p>
                <TextField<FormState>
                  name="studyField"
                  label="תחום לימודים"
                  placeholder="הנדסת תוכנה, ביולוגיה..."
                />
                <TextField<FormState>
                  name="studyYear"
                  label="שנת לימודים"
                  placeholder="שנה א׳, שנה ג׳..."
                />
              </div>
            )}
            {isWorking(occupationStatus) && (
              <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">עבודה</p>
                <TextField<FormState>
                  name="workField"
                  label="תחום עבודה"
                  placeholder="מחשבים, בנייה, חינוך..."
                />
                <PillRadioField<FormState>
                  name="workNature"
                  label="אופי העבודה"
                  options={WORK_NATURES}
                />
                <PillRadioField<FormState>
                  name="eatingAtWork"
                  label="איפה אתה אוכל בעבודה?"
                  options={EATING_AT_WORK}
                />
                <div className="grid grid-cols-2 gap-4">
                  <PillYesNoField<FormState> name="microwaveAtWork" label="מיקרוגל בעבודה?" />
                  <PillYesNoField<FormState> name="fridgeAtWork" label="מקרר בעבודה?" />
                </div>
              </div>
            )}
            <TextField<FormState>
              name="dailyActivityLevel"
              label="רמת פעילות יומית (מחוץ לאימונים)"
              placeholder="יושב רוב היום, הולך הרבה, פעיל מאוד..."
            />
            <TextField<FormState>
              name="sleepWakeTimes"
              label="שעות שינה והשכמה"
              placeholder="הולך לישון בחצות, קם בשבע..."
            />
            <NumberField<FormState>
              name="sleepHours"
              label="שעות שינה בממוצע"
              placeholder="7"
              required
              unit="שעות"
            />
          </>
        );

      case 2:
        return (
          <>
            <NumberField<FormState>
              name="mealsPerDay"
              label="כמה ארוחות אתה אוכל ביום?"
              placeholder="4"
              required
              unit="ארוחות"
            />
            <TextareaField<FormState>
              name="whenHungry"
              label="מה אתה עושה כשאתה רעב בין הארוחות?"
              placeholder="אוכל פרי, שותה מים, מחכה לארוחה הבאה..."
            />
            <TextField<FormState>
              name="waterPerDay"
              label="כמה מים אתה שותה ביום?"
              placeholder="1.5 ליטר, 2 בקבוקים..."
            />
          </>
        );

      case 3:
        return (
          <>
            <PillYesNoField<FormState> name="keepsKosher" label="האם אתה שומר כשרות?" />
            <PillRadioField<FormState>
              name="dietType"
              label="סוג תזונה"
              options={DIET_TYPES}
              required
            />
            {dietType && dietType !== 'לא' && (
              <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
                <TextareaField<FormState>
                  name="enjoyedFoods"
                  label="מאכלים שאתה אוהב"
                  placeholder="ירקות, קטניות, דגנים..."
                />
                <TextareaField<FormState>
                  name="dislikedFoods"
                  label="מאכלים שאינך אוהב"
                  placeholder="פטריות, כרוב..."
                />
              </div>
            )}
            <TextareaField<FormState>
              name="allergies"
              label="אלרגיות ורגישויות מזון"
              placeholder="אגוזים, גלוטן, חלב... אם אין — השאר ריק"
            />
          </>
        );

      case 4:
        return (
          <>
            <PillRadioField<FormState>
              name="primaryGoal"
              label="מה המטרה הראשית שלך?"
              options={PRIMARY_GOALS}
              required
            />
            {primaryGoal === 'אחר' && (
              <TextareaField<FormState>
                name="primaryGoalOther"
                label="פרט את המטרה"
                placeholder="תאר את המטרה שלך..."
                required
              />
            )}
          </>
        );

      case 5:
        return (
          <div className="grid grid-cols-3 gap-4">
            <PillYesNoField<FormState> name="hasBodyScale" label="משקל גוף?" />
            <PillYesNoField<FormState> name="hasFoodScale" label="משקל מזון?" />
            <PillYesNoField<FormState> name="hasBlender" label="בלנדר?" />
          </div>
        );

      case 6:
        return (
          <>
            <TextareaField<FormState>
              name="dailyNutritionRoutine"
              label="תאר יום אכילה טיפוסי"
              placeholder="ארוחת בוקר, צהריים, ערב ועוד..."
              rows={4}
            />
            <TextareaField<FormState>
              name="foodsWontEat"
              label="מאכלים שאינך מוכן לאכול"
              placeholder="גם אם הם בריאים — מה לגמרי לא?"
            />
            <TextareaField<FormState>
              name="mustHaveFoods"
              label="מאכלים שחייבים להיות בתפריט"
              placeholder="מה לא תוכל לוותר עליו?"
            />
            <TextareaField<FormState>
              name="eatingOut"
              label="כמה פעמים בשבוע אתה אוכל בחוץ?"
              placeholder="פעם בשבוע, כמעט כל יום..."
            />
            <TextareaField<FormState>
              name="snacking"
              label="האם אתה נשנש? מה?"
              placeholder="ביסלי בלילה, פרי בין הארוחות..."
            />
          </>
        );

      case 7:
        return (
          <TextareaField<FormState>
            name="supplements"
            label="תוספים שאתה לוקח כעת"
            placeholder="חלבון, ויטמין D, אומגה 3... אם אין — השאר ריק"
          />
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
              disabled={isLastCard && isSubmitting}
            >
              {isLastCard && isSubmitting ? 'שולח...' : isLastCard ? 'שליחה' : 'המשך'}
            </Button>
          </motion.div>
        </CardShell>
      </form>
    </FormProvider>
  );
}
