import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Header } from '@/components/common/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth, useSignIn } from '@/hooks/auth';

const loginSchema = z.object({
  email: z.string().email('כתובת מייל לא תקינה'),
  password: z.string().min(1, 'יש להזין סיסמה'),
});
type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const signIn = useSignIn();

  // Already logged in — go straight to admin
  useEffect(() => {
    if (isAuthenticated) navigate('/admin', { replace: true });
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit({ email, password }: LoginValues) {
    try {
      await signIn.mutateAsync({ email, password });
      navigate('/admin', { replace: true });
    } catch {
      setError('root', { message: 'פרטי הכניסה שגויים. נסה שנית.' });
    }
  }

  return (
    <div className="min-h-dvh">
      <Header subtitle="כניסת מאמן" />
      <main className="container flex max-w-md flex-col items-center py-16">
        <Card className="w-full">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div>
                <Label htmlFor="email">כתובת מייל</Label>
                <Input
                  id="email"
                  type="email"
                  dir="ltr"
                  placeholder="liam@coach.app"
                  aria-invalid={!!errors.email}
                  className="mt-1"
                  {...register('email')}
                />
                {errors.email && (
                  <p role="alert" className="mt-1 text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">סיסמה</Label>
                <Input
                  id="password"
                  type="password"
                  dir="ltr"
                  placeholder="••••••••"
                  aria-invalid={!!errors.password}
                  className="mt-1"
                  {...register('password')}
                />
                {errors.password && (
                  <p role="alert" className="mt-1 text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              {errors.root && (
                <p role="alert" className="text-sm text-destructive">
                  {errors.root.message}
                </p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'מתחבר...' : 'כניסה'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
