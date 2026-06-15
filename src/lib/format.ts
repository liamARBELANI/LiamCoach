const dateFmt = new Intl.DateTimeFormat('he-IL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/** Anything we might get for a timestamp: epoch ms, ISO string, Date, or a Firestore Timestamp. */
type DateLike =
  | number
  | string
  | Date
  | { toMillis: () => number }
  | { seconds: number }
  | null
  | undefined;

/** Normalise a value to epoch milliseconds, or null if it isn't a usable date. */
function toEpochMs(value: DateLike): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  // Firestore Timestamp shapes.
  if (typeof value === 'object') {
    if ('toMillis' in value && typeof value.toMillis === 'function') return value.toMillis();
    if ('seconds' in value && typeof value.seconds === 'number') return value.seconds * 1000;
  }
  return null;
}

export function formatDate(value?: DateLike): string {
  const ms = toEpochMs(value);
  if (ms == null) return 'תאריך לא ידוע';
  const date = new Date(ms);
  if (Number.isNaN(date.getTime())) return 'תאריך לא ידוע';
  return dateFmt.format(date);
}
