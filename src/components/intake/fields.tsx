import { useFormContext, type FieldPath, type FieldValues } from 'react-hook-form';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// ── Error message ──────────────────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <motion.p
      role="alert"
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-1 text-xs text-destructive"
    >
      {message}
    </motion.p>
  );
}

// ── Section heading ────────────────────────────────────────────────────────
export function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 border-b border-border pb-2 text-base font-semibold text-foreground">
      {children}
    </h2>
  );
}

// ── Text field ─────────────────────────────────────────────────────────────
interface TextFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  label: string;
  required?: boolean;
  type?: React.HTMLInputTypeAttribute;
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
  dir?: 'ltr' | 'rtl' | 'auto';
}
export function TextField<T extends FieldValues>({
  name,
  label,
  required,
  type = 'text',
  inputMode,
  dir,
}: TextFieldProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();
  const error = errors[name]?.message as string | undefined;
  return (
    <div>
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      <Input
        id={name}
        type={type}
        inputMode={inputMode}
        dir={dir}
        aria-invalid={!!error}
        className="mt-1.5 text-center"
        {...register(name)}
      />
      <FieldError message={error} />
    </div>
  );
}

// ── Textarea field ─────────────────────────────────────────────────────────
interface TextareaFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  rows?: number;
}
export function TextareaField<T extends FieldValues>({
  name,
  label,
  required,
  rows,
}: TextareaFieldProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();
  const error = errors[name]?.message as string | undefined;
  return (
    <div>
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      <Textarea
        id={name}
        rows={rows}
        aria-invalid={!!error}
        className="mt-1.5 text-center"
        {...register(name)}
      />
      <FieldError message={error} />
    </div>
  );
}

// ── Number field — LTR digits, unit badge on LEFT (start) in RTL layout ───
// The input itself is dir=ltr so the number types naturally left-to-right.
// In RTL, "end" (pe) is on the LEFT side of the element — the unit sits there.
interface NumberFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  required?: boolean;
  unit?: string;
}
export function NumberField<T extends FieldValues>({
  name,
  label,
  required,
  unit,
}: NumberFieldProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();
  const error = errors[name]?.message as string | undefined;
  return (
    <div>
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      <div className="relative mt-1.5" dir="rtl">
        {unit && (
          <span
            className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-sm font-medium text-muted-foreground"
            aria-hidden="true"
          >
            {unit}
          </span>
        )}
        <Input
          id={name}
          type="number"
          dir="ltr"
          inputMode="numeric"
          aria-invalid={!!error}
          className={cn(
            'text-center',
            unit && 'ps-12',
          )}
          {...register(name)}
        />
      </div>
      <FieldError message={error} />
    </div>
  );
}

// ── YesNo field (כן / לא radio pair) ──────────────────────────────────────
interface YesNoFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  label: string;
  required?: boolean;
}
export function YesNoField<T extends FieldValues>({
  name,
  label,
  required,
}: YesNoFieldProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();
  const error = errors[name]?.message as string | undefined;
  return (
    <div>
      <Label required={required}>{label}</Label>
      <div className="mt-2 flex justify-center gap-6" role="radiogroup" aria-label={label}>
        {(['כן', 'לא'] as const).map((val) => (
          <label key={val} className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              value={val}
              className="accent-primary"
              {...register(name)}
            />
            <span className="text-sm">{val}</span>
          </label>
        ))}
      </div>
      <FieldError message={error} />
    </div>
  );
}

// ── Radio group field (enum array) ─────────────────────────────────────────
interface RadioGroupFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  label: string;
  options: readonly string[];
  required?: boolean;
  inline?: boolean;
}
export function RadioGroupField<T extends FieldValues>({
  name,
  label,
  options,
  required,
  inline,
}: RadioGroupFieldProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();
  const error = errors[name]?.message as string | undefined;
  return (
    <div>
      <Label required={required}>{label}</Label>
      <div
        role="radiogroup"
        aria-label={label}
        className={cn('mt-2 gap-3', inline ? 'flex flex-wrap justify-center' : 'flex flex-col items-center')}
      >
        {options.map((opt) => (
          <label key={opt} className="flex cursor-pointer items-center gap-2">
            <input
              type="radio"
              value={opt}
              className="accent-primary"
              {...register(name)}
            />
            <span className="text-sm">{opt}</span>
          </label>
        ))}
      </div>
      <FieldError message={error} />
    </div>
  );
}

// ── Pill radio group — spring pop on selection ─────────────────────────────
export function PillRadioField<T extends FieldValues>({
  name,
  label,
  options,
  required,
}: RadioGroupFieldProps<T>) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext<T>();
  const currentValue = watch(name) as string | undefined;
  const error = errors[name]?.message as string | undefined;
  return (
    <div>
      <Label required={required}>{label}</Label>
      <div className="mt-3 flex flex-wrap justify-center gap-2" role="radiogroup" aria-label={label}>
        {options.map((opt) => {
          const isActive = currentValue === opt;
          return (
            <motion.label
              key={opt}
              whileTap={{ scale: 0.93 }}
              animate={
                isActive
                  ? { scale: 1.04, transition: { type: 'spring', stiffness: 500, damping: 20 } }
                  : { scale: 1 }
              }
              className={cn(
                'pill-option flex cursor-pointer select-none items-center rounded-xl border px-4 py-2.5 text-sm font-medium',
                isActive
                  ? 'pill-option-active border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5',
              )}
            >
              <input type="radio" value={opt} className="sr-only" {...register(name)} />
              {opt}
            </motion.label>
          );
        })}
      </div>
      <FieldError message={error} />
    </div>
  );
}

const YES_NO = ['כן', 'לא'] as const;

// ── Pill yes/no ────────────────────────────────────────────────────────────
export function PillYesNoField<T extends FieldValues>({ name, label, required }: YesNoFieldProps<T>) {
  return (
    <PillRadioField<T>
      name={name}
      label={label}
      options={YES_NO as unknown as readonly string[]}
      required={required}
    />
  );
}

// ── Select field ───────────────────────────────────────────────────────────
interface SelectFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  label: string;
  options: readonly string[];
  placeholder?: string;
  required?: boolean;
}
export function SelectField<T extends FieldValues>({
  name,
  label,
  options,
  required,
}: SelectFieldProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();
  const error = errors[name]?.message as string | undefined;
  return (
    <div>
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      <Select id={name} aria-invalid={!!error} className="mt-1.5 text-center" {...register(name)}>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </Select>
      <FieldError message={error} />
    </div>
  );
}

// ── Time picker field ──────────────────────────────────────────────────────
export function TimePickerField<T extends FieldValues>({
  name,
  label,
  required,
}: {
  name: FieldPath<T>;
  label: string;
  required?: boolean;
}) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();
  const error = errors[name]?.message as string | undefined;
  return (
    <div>
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      <Input
        id={name}
        type="time"
        aria-invalid={!!error}
        className="mt-1.5 text-center"
        {...register(name)}
      />
      <FieldError message={error} />
    </div>
  );
}

// ── Select Number field (Native Picker on iOS) ─────────────────────────────
export interface SelectNumberFieldProps<T extends FieldValues> {
  name: FieldPath<T>;
  label: string;
  min: number;
  max: number;
  step?: number;
  required?: boolean;
  unit?: string;
  placeholder?: string;
}

export function SelectNumberField<T extends FieldValues>({
  name,
  label,
  min,
  max,
  step = 1,
  required,
  unit,
}: SelectNumberFieldProps<T>) {
  const {
    register,
    formState: { errors },
  } = useFormContext<T>();
  const error = errors[name]?.message as string | undefined;

  const options = [];
  for (let i = min; i <= max; i += step) {
    options.push(i);
  }

  return (
    <div>
      <Label htmlFor={name} required={required}>
        {label}
      </Label>
      <Select id={name} aria-invalid={!!error} className="mt-1.5 text-center" dir="ltr" defaultValue="" {...register(name)}>
        <option value="" disabled>
          בחר/י
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt} {unit || ''}
          </option>
        ))}
      </Select>
      <FieldError message={error} />
    </div>
  );
}
