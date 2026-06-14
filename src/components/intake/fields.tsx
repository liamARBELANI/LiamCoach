import { useFormContext, type FieldPath, type FieldValues } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

// ── Error message ──────────────────────────────────────────────────────────
function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1 text-xs text-destructive">
      {message}
    </p>
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
  placeholder?: string;
  required?: boolean;
}
export function TextField<T extends FieldValues>({
  name,
  label,
  placeholder,
  required,
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
        placeholder={placeholder}
        aria-invalid={!!error}
        className="mt-1"
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
  placeholder,
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
        placeholder={placeholder}
        rows={rows}
        aria-invalid={!!error}
        className="mt-1"
        {...register(name)}
      />
      <FieldError message={error} />
    </div>
  );
}

// ── Number field (LTR input, right-aligned) ────────────────────────────────
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
  placeholder,
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
      <div className="relative mt-1">
        <Input
          id={name}
          type="number"
          dir="ltr"
          inputMode="numeric"
          placeholder={placeholder}
          aria-invalid={!!error}
          className={cn('text-start', unit && 'pe-12')}
          {...register(name)}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center text-sm text-muted-foreground">
            {unit}
          </span>
        )}
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
      <div className="mt-2 flex gap-6" role="radiogroup" aria-label={label}>
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
        className={cn('mt-2 gap-3', inline ? 'flex flex-wrap' : 'flex flex-col')}
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

// ── Pill radio group (card-style toggle buttons) ───────────────────────────
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
      <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
        {options.map((opt) => (
          <label
            key={opt}
            className={cn(
              'flex cursor-pointer select-none items-center rounded-lg border px-4 py-2.5 text-sm transition-all duration-150',
              currentValue === opt
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-card text-foreground hover:border-primary/50',
            )}
          >
            <input type="radio" value={opt} className="sr-only" {...register(name)} />
            {opt}
          </label>
        ))}
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
  placeholder,
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
      <Select id={name} aria-invalid={!!error} className="mt-1" {...register(name)}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
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
