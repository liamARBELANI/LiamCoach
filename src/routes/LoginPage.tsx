import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, useSignIn } from '@/hooks/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const signIn = useSignIn();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Already logged in — go straight to admin
  useEffect(() => {
    if (isAuthenticated) navigate('/admin', { replace: true });
  }, [isAuthenticated, navigate]);

  async function handleLogin() {
    setErrorMsg(null);
    try {
      await signIn.mutateAsync();
      navigate('/admin', { replace: true });
    } catch (error: any) {
      if (error?.message === 'Unauthorized') {
        setErrorMsg('אין לך הרשאות גישה למערכת זו. אנא התחבר עם חשבון מורשה.');
      } else {
        // Only show error if it's not a user-cancellation
        if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
          setErrorMsg('אירעה שגיאה בהתחברות. נסה שוב.');
        }
      }
    }
  }

  return (
    <div className="intake-bg flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      {/* Brand hero */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="mb-10 flex flex-col items-center gap-4"
      >
        <div className="icon-glow flex h-16 w-16 items-center justify-center rounded-2xl">
          <Dumbbell className="h-8 w-8 text-primary" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-xl font-bold tracking-[0.15em] text-foreground">LIAM COACH</p>
          <p className="mt-1 text-sm text-muted-foreground">כניסת מנהל</p>
        </div>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        className="card-glass w-full max-w-sm rounded-2xl p-8"
      >
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-medium text-foreground">ברוך שובך</h2>
            <p className="text-sm text-muted-foreground mt-1">התחבר עם חשבון ה-Google המורשה שלך</p>
          </div>

          <motion.div whileTap={{ scale: 0.98 }} className="pt-2">
            <Button 
              type="button" 
              onClick={handleLogin} 
              className="w-full relative bg-white text-black hover:bg-gray-50 border border-gray-200 shadow-sm flex items-center justify-center gap-3" 
              size="lg" 
              disabled={signIn.isPending}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
                <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
                <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
                <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
              </svg>
              {signIn.isPending ? 'מתחבר...' : 'התחבר עם Google'}
            </Button>
          </motion.div>

          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {errorMsg}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
