import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSignOut } from '@/hooks/auth';

export function SignOutButton() {
  const navigate = useNavigate();
  const signOut = useSignOut();

  async function handleSignOut() {
    await signOut.mutateAsync();
    navigate('/login', { replace: true });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleSignOut}
      disabled={signOut.isPending}
    >
      {signOut.isPending ? '...' : 'יציאה'}
    </Button>
  );
}
