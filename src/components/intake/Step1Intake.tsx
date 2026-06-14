import { useState, useEffect } from 'react';
import { useForm, FormProvider, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { intakeSchema } from '@/schemas/intake';
import type { IntakeValues } from '@/schemas/intake';
import { TRAINING_LOCATIONS } from '@/types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  SectionHeading,
  TextField,
  TextareaField,
  NumberField,
  YesNoField,
  RadioGroupField,
} from './fields';
import { GoalImageUpload } from './GoalImageUpload';

// RHF internal form state uses strings for all inputs; Zod resolver outputs IntakeValues.
// We type the form as FieldValues internally and cast the validated output.
type FormState = Record<string, unknown>;

interface Step1IntakeProps {
  defaultValues: Partial<IntakeValues>;
  onChange: (values: Partial<IntakeValues>) => void;
  onNext: (values: IntakeValues, goalImageFile: File | null) => void;
}

export function Step1Intake({ defaultValues, onChange, onNext }: Step1IntakeProps) {
  const [goalImageFile, setGoalImageFile] = useState<File | null>(null);

  const methods = useForm<FormState>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      ...defaultValues,
      termsAccepted: defaultValues.termsAccepted ?? false,
    },
    mode: 'onBlur',
  });

  const { handleSubmit, watch, formState: { errors } } = methods;

  // Persist draft on every change
  const values = watch();
  useEffect(() => {
    onChange(values as Partial<IntakeValues>);
  }, [values, onChange]);

  const takesMedication = useWatch({ control: methods.control, name: 'takesMedication' });
  const trainingLocation = useWatch({ control: methods.control, name: 'trainingLocation' });

  function onSubmit(data: FormState) {
    onNext(data as unknown as IntakeValues, goalImageFile);
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">

        {/* פרטים אישיים */}
        <section>
          <SectionHeading>פרטים אישיים</SectionHeading>
          <div className="space-y-4">
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
          </div>
        </section>

        {/* רקע רפואי */}
        <section>
          <SectionHeading>רקע רפואי</SectionHeading>
          <div className="space-y-4">
            <YesNoField<FormState>
              name="medicallyFit"
              label="האם אתה מאושר רפואית לפעילות גופנית?"
              required
            />
            <YesNoField<FormState>
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
          </div>
        </section>

        {/* רקע ספורטיבי */}
        <section>
          <SectionHeading>רקע ספורטיבי</SectionHeading>
          <div className="space-y-4">
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
          </div>
        </section>

        {/* מטרות */}
        <section>
          <SectionHeading>מטרות</SectionHeading>
          <div className="space-y-4">
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
          </div>
        </section>

        {/* אימונים */}
        <section>
          <SectionHeading>אימונים</SectionHeading>
          <div className="space-y-4">
            <NumberField<FormState>
              name="daysPerWeek"
              label="כמה ימים בשבוע תרצה להתאמן?"
              placeholder="3"
              required
              unit="ימים"
            />
            <RadioGroupField<FormState>
              name="trainingLocation"
              label="היכן תרצה להתאמן?"
              options={TRAINING_LOCATIONS}
              required
              inline
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
          </div>
        </section>

        {/* שיווק */}
        <section>
          <SectionHeading>הכרות</SectionHeading>
          <div className="space-y-4">
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
          </div>
        </section>

        {/* תקנון */}
        <section>
          <div className="rounded-md border border-border bg-muted/30 p-4">
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
        </section>

        <Button type="submit" className="w-full" size="lg">
          המשך לשלב 2
        </Button>
      </form>
    </FormProvider>
  );
}
