import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CoachUser } from '@/types';
import { authAdapter } from '@/lib/dataSource';

export function useAuth() {
  const [user, setUser] = useState<CoachUser | null>(() => authAdapter.current());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = authAdapter.onChange((u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  return { user, loading, isAuthenticated: !!user };
}

export function useSignIn() {
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authAdapter.signIn(email, password),
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authAdapter.signOut(),
    onSuccess: () => qc.clear(),
  });
}
