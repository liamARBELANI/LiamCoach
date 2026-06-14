import type { ReactNode } from 'react';

/**
 * Auth guard for /admin routes.
 * TODO (M5): redirect unauthenticated users to /login using the auth hook.
 * For now it renders children so the admin shell is reachable during early milestones.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
