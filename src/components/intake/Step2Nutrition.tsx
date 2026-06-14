import { useEffect } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { nutritionSchema } from '@/schemas/nutrition';
import type { NutritionValues } from '@/schemas/nutrition';
import { isStudying, isWorking } from '@/schemas/nutrition';
import { OCCUPATION_STATUSES, DIET_TYPES, PRIMARY_GOALS, WORK_NATURES, EATING_AT_WORK } from '@/types';
import { Button } from '@/components/ui/button';
import {
  SectionHeading,
  TextField,
  TextareaField,
  NumberField,
  YesNoField,
  RadioGroupField,
} from './fields';

type FormState = Record<string, unknown>;

interface Step2NutritionProps {
  defaultValues: Partial<NutritionValues>;
  onChange: (values: Partial<NutritionValues>) => void;
  onSubmit: (values: NutritionValues) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function Step2Nutrition({
  defaultValues,
  onChange,
  onSubmit,
  onBack,
  isSubmitting,
}: Step2NutritionProps) {
  const methods = useForm<FormState>({
    resolver: zodResolver(nutritionSchema),
    defaultValues: defaultValues as FormState,
    mode: 'onBlur',
  });

  const { handleSubmit, watch } = methods;

  const values = watch();
  useEffect(() => {
    onChange(values as Partial<NutritionValues>);
  }, [values, onChange]);

  const occupationStatus = useWatch({ control: methods.control, name: 'occupationStatus' }) as string | undefined;
  const dietType = useWatch({ control: methods.control, name: 'dietType' }) as string | undefined;
  const primaryGoal = useWatch({ control: methods.control, name: 'primaryGoal' }) as string | undefined;

  function onFormSubmit(data: FormState) {
    onSubmit(data as unknown as NutritionValues);
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onFormSubmit)} noValidate className="space-y-8">

        {/* פרטים אישיים */}
        <section>
          <SectionHeading>פרטים אישיים</SectionHeading>
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
              label='גובה'
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
        </section>

        {/* אורח חיים */}
        <section>
          <SectionHeading>אורח חיים</SectionHeading>
          <div className="space-y-4">
            <TextareaField<FormState>
              name="hobbies"
              label="תחביבים ופעילויות פנאי"
              placeholder="טיולים, ציור, מוזיקה..."
            />

            <RadioGroupField<FormState>
              name="occupationStatus"
              label="סטטוס תעסוקתי"
              options={OCCUPATION_STATUSES}
              required
            />

            {/* לימודים — מותנה */}
            {isStudying(occupationStatus) && (
              <div className="space-y-4 rounded-md border border-border bg-muted/20 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  לימודים
                </p>
                <TextField<FormState>
                  name="studyField"
                  label="תחום לימודים"
                  placeholder="הנדסת תוכנה, ביולוגיה..."
                />
                <TextField<FormState>
                  name="studyYear"
                  label="שנת לימודים"
                  placeholder='שנה א׳, שנה ג׳...'
                />
              </div>
            )}

            {/* עבודה — מותנה */}
            {isWorking(occupationStatus) && (
              <div className="space-y-4 rounded-md border border-border bg-muted/20 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  עבודה
                </p>
                <TextField<FormState>
                  name="workField"
                  label="תחום עבודה"
                  placeholder="מחשבים, בנייה, חינוך..."
                />
                <RadioGroupField<FormState>
                  name="workNature"
                  label="אופי העבודה"
                  options={WORK_NATURES}
                  inline
                />
                <RadioGroupField<FormState>
                  name="eatingAtWork"
                  label="איפה אתה אוכל בעבודה?"
                  options={EATING_AT_WORK}
                  inline
                />
                <div className="grid grid-cols-2 gap-4">
                  <YesNoField<FormState>
                    name="microwaveAtWork"
                    label='מיקרוגל בעבודה?'
                  />
                  <YesNoField<FormState>
                    name="fridgeAtWork"
                    label='מקרר בעבודה?'
                  />
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
          </div>
        </section>

        {/* תכנון תפריט */}
        <section>
          <SectionHeading>תכנון תפריט</SectionHeading>
          <div className="space-y-4">
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
          </div>
        </section>

        {/* העדפות תזונה */}
        <section>
          <SectionHeading>העדפות תזונה</SectionHeading>
          <div className="space-y-4">
            <YesNoField<FormState>
              name="keepsKosher"
              label="האם אתה שומר כשרות?"
            />
            <RadioGroupField<FormState>
              name="dietType"
              label="סוג תזונה"
              options={DIET_TYPES}
              required
              inline
            />
            {dietType && dietType !== 'לא' && (
              <div className="space-y-4 rounded-md border border-border bg-muted/20 p-4">
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
          </div>
        </section>

        {/* מטרה */}
        <section>
          <SectionHeading>מטרה תזונתית</SectionHeading>
          <div className="space-y-4">
            <RadioGroupField<FormState>
              name="primaryGoal"
              label="מה המטרה הראשית שלך?"
              options={PRIMARY_GOALS}
              required
              inline
            />
            {primaryGoal === 'אחר' && (
              <TextareaField<FormState>
                name="primaryGoalOther"
                label="פרט את המטרה"
                placeholder="תאר את המטרה שלך..."
                required
              />
            )}
          </div>
        </section>

        {/* ציוד בבית */}
        <section>
          <SectionHeading>ציוד בבית</SectionHeading>
          <div className="grid grid-cols-3 gap-4">
            <YesNoField<FormState> name="hasBodyScale" label="משקל גוף?" />
            <YesNoField<FormState> name="hasFoodScale" label='משקל מזון?' />
            <YesNoField<FormState> name="hasBlender" label="בלנדר?" />
          </div>
        </section>

        {/* הרגלי אכילה */}
        <section>
          <SectionHeading>הרגלי אכילה</SectionHeading>
          <div className="space-y-4">
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
              label='מאכלים שחייבים להיות בתפריט שלך'
              placeholder="מה לא תוכל לוותר עליו?"
            />
            <TextareaField<FormState>
              name="eatingOut"
              label="כמה פעמים בשבוע אתה אוכל בחוץ?"
              placeholder="פעם בשבוע, כמעט כל יום, לא אוכל בחוץ..."
            />
            <TextareaField<FormState>
              name="snacking"
              label="האם אתה נשנש? מה?"
              placeholder="ביסלי בלילה, פרי בין הארוחות..."
            />
          </div>
        </section>

        {/* תוספי תזונה */}
        <section>
          <SectionHeading>תוספי תזונה</SectionHeading>
          <TextareaField<FormState>
            name="supplements"
            label="תוספים שאתה לוקח כעת"
            placeholder="חלבון, ויטמין D, אומגה 3... אם אין — השאר ריק"
          />
        </section>

        {/* כפתורי ניווט */}
        <div className="flex flex-col gap-3 sm:flex-row-reverse">
          <Button type="submit" className="flex-1" size="lg" disabled={isSubmitting}>
            {isSubmitting ? 'שולח...' : 'שליחה'}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            size="lg"
            onClick={onBack}
            disabled={isSubmitting}
          >
            חזרה
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
