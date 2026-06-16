import type { Client } from '@/types';

/** Hebrew label for a client's completion status. */
export function statusLabel(status: Client['status']): string {
  if (status === 'completed') return 'הושלם';
  if (status === 'archived') return 'סיים אימונים';
  return 'ממתין';
}
