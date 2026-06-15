import type { Client } from '@/types';

/** Hebrew label for a client's completion status. */
export function statusLabel(status: Client['status']): string {
  return status === 'completed' ? 'הושלם' : 'ממתין';
}
