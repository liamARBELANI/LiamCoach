import { Link } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SignOutButton } from '@/components/admin/SignOutButton';
import { useClients } from '@/hooks/clients';
import { formatDate } from '@/lib/format';
import { formatILMobile } from '@/lib/phone';

export default function AdminDashboard() {
  const { data: clients, isLoading, isError } = useClients();

  return (
    <div className="min-h-dvh">
      <Header subtitle="לוח בקרה" actions={<SignOutButton />} />
      <main className="container py-8">
        <h1 className="mb-6 text-2xl font-bold">מתאמנים</h1>

        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-10 text-center text-destructive">
              אירעה שגיאה בטעינת הנתונים. נסה לרענן את הדף.
            </CardContent>
          </Card>
        ) : !clients || clients.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              אין מתאמנים עדיין
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-3">
            {clients.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/admin/clients/${c.id}`}
                  className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">{c.intake.fullName}</p>
                      <p dir="ltr" className="text-start text-sm text-muted-foreground">
                        {formatILMobile(c.intake.phone)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={c.status === 'completed' ? 'success' : 'pending'}>
                        {c.status === 'completed' ? 'הושלם' : 'ממתין'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(c.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    מטרה: {c.nutrition.primaryGoal}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
