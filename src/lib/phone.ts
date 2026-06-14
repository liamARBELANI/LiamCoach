/** Strip everything except digits. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/** Israeli mobile: 10 digits starting with 05X (e.g. 050, 052, 053, 054, 058...). */
export function isValidILMobile(value: string): boolean {
  return /^05\d{8}$/.test(digitsOnly(value));
}

/** Format to 05X-XXXXXXX for display. Falls back to the raw input if not 10 digits. */
export function formatILMobile(value: string): string {
  const d = digitsOnly(value);
  if (d.length !== 10) return value;
  return `${d.slice(0, 3)}-${d.slice(3)}`;
}

/** Normalised key (digits only) for de-duplication / lookups. */
export function phoneKey(value: string): string {
  return digitsOnly(value);
}
