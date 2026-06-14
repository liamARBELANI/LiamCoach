import { z } from 'zod';

interface NumberOpts {
  required: string;
  min?: [number, string];
  max?: [number, string];
  int?: boolean;
}

/**
 * A numeric form field that accepts the string a DOM input produces, yet validates and
 * outputs a real `number`. Empty / non-numeric input surfaces the `required` message.
 * Input type is `unknown` (string from the field); output type is `number`.
 */
export function zNumber(opts: NumberOpts) {
  let base = z.number({
    required_error: opts.required,
    invalid_type_error: opts.required,
  });
  if (opts.int) base = base.int(opts.required);
  if (opts.min) base = base.min(opts.min[0], opts.min[1]);
  if (opts.max) base = base.max(opts.max[0], opts.max[1]);

  return z.preprocess((value) => {
    if (value === '' || value === null || value === undefined) return undefined;
    if (typeof value === 'string') {
      const n = Number(value.replace(',', '.').trim());
      return Number.isNaN(n) ? undefined : n;
    }
    return value;
  }, base);
}

/** Required free-text field with a Hebrew message and optional minimum length. */
export function zRequiredText(message: string, min = 1) {
  return z
    .string({ required_error: message })
    .trim()
    .min(min, message);
}

/** Optional free-text field that normalises missing/empty to `''`. */
export const zOptionalText = z.string().trim().default('');

/**
 * Creates an optional enum schema that handles `null` values gracefully.
 * React Hook Form passes `null` for unselected radio inputs, which causes
 * standard `z.enum().optional()` to throw an invalid_type_error.
 */
export function zOptionalEnum<U extends string, T extends Readonly<[U, ...U[]]>>(values: T) {
  return z.preprocess((val) => (val === null ? undefined : val), z.enum(values).optional());
}

/** Preconfigured optional Yes/No enum */
export const optionalYesNo = zOptionalEnum(['כן', 'לא']);
