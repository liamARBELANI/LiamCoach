import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SignOutButton } from '@/components/admin/SignOutButton';
import { useClients } from '@/hooks/clients';
import { formatDate } from '@/lib/format';
import { formatILMobile } from '@/lib/phone';
import type { Client, PrimaryGoal } from '@/types';
import { PRIMARY_GOALS } from '@/types';

type SortKey = 'date-desc' | 'date-asc' | 'name-asc';

function statusLabel(s: Client['status']) {
  return s === 'completed' ? 'הושלם' : 'ממתין';
}

// ── Stats strip ───────────────────────────────────────────────────────────
function StatsCards({ clients }: { clients: Client[] }) {
  const total = clients.length;
  const completed = clients.filter((c) => c.status === 'completed').length;
  const pending = clients.filter((c) => c.status === 'pending').length;

  const stats = [
    { label: 'סה"כ מתאמנים', value: total },
    { label: 'הושלמו', value: completed },
    { label: 'ממתינים', value: pending },
  ];

  return (
    <div className="mb-6 grid grid-cols-3 gap-3">
      {stats.map(({ label, value }) => (
        <Card key={label}>
          <CardContent className="py-4 text-center">
            <p className="text-2xl font-bold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Client card (shared between mobile + desktop) ─────────────────────────
function ClientCard({ client }: { client: Client }) {
  return (
    <Link
      to={`/admin/clients/${client.id}`}
      className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate font-semibold">{client.intake?.fullName ?? 'ללא שם'}</p>
          <p dir="ltr" className="text-start text-sm text-muted-foreground">
            {client.intake?.phone ? formatILMobile(client.intake.phone) : 'ללא טלפון'}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge variant={client.status === 'completed' ? 'success' : 'pending'}>
            {statusLabel(client.status)}
          </Badge>
          <span className="text-xs text-muted-foreground">{formatDate(client.createdAt)}</span>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        מטרה: {client.nutrition?.primaryGoal ?? 'לא צוין'}
      </p>
    </Link>
  );
}

export default function AdminDashboard() {
  const { data: clients = [], isLoading, isError, error } = useClients();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'' | 'completed' | 'pending'>('');
  const [filterGoal, setFilterGoal] = useState<'' | PrimaryGoal>('');
  const [sort, setSort] = useState<SortKey>('date-desc');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return clients
      .filter((c) => {
        if (q) {
          const inName = c.intake?.fullName?.toLowerCase()?.includes(q) ?? false;
          const inPhone = String(c.intake?.phone || '')
            .replace(/\D/g, '')
            .includes(q.replace(/\D/g, ''));
          if (!inName && !inPhone) return false;
        }
        if (filterStatus && c.status !== filterStatus) return false;
        if (filterGoal && c.nutrition?.primaryGoal !== filterGoal) return false;
        return true;
      })
      .sort((a, b) => {
        if (sort === 'date-asc') return (a.createdAt ?? 0) - (b.createdAt ?? 0);
        if (sort === 'name-asc') {
          const nameA = a.intake?.fullName ?? '';
          const nameB = b.intake?.fullName ?? '';
          return nameA.localeCompare(nameB, 'he');
        }
        return (b.createdAt ?? 0) - (a.createdAt ?? 0); // date-desc default
      });
  }, [clients, search, filterStatus, filterGoal, sort]);

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
              {import.meta.env.DEV && error instanceof Error && (
                <pre
                  dir="ltr"
                  className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-start text-xs"
                >
                  {error.message}
                </pre>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {clients.length > 0 && <StatsCards clients={clients} />}

            {/* Filters */}
            <div className="mb-4 flex flex-wrap gap-3">
              <Input
                placeholder="חיפוש לפי שם או טלפון..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64"
              />
              <Select
                value={filterStatus}
                onChange={(e) =>
                  setFilterStatus(e.target.value as '' | 'completed' | 'pending')
                }
                className="w-full sm:w-auto"
              >
                <option value="">כל הסטטוסים</option>
                <option value="completed">הושלם</option>
                <option value="pending">ממתין</option>
              </Select>
              <Select
                value={filterGoal}
                onChange={(e) => setFilterGoal(e.target.value as '' | PrimaryGoal)}
                className="w-full sm:w-auto"
              >
                <option value="">כל המטרות</option>
                {PRIMARY_GOALS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
              <Select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="w-full sm:w-auto"
              >
                <option value="date-desc">תאריך — חדש לישן</option>
                <option value="date-asc">תאריך — ישן לחדש</option>
                <option value="name-asc">שם — א׳ ל׳ת</option>
              </Select>
            </div>

            {/* List */}
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {clients.length === 0 ? 'אין מתאמנים עדיין' : 'לא נמצאו תוצאות'}
                </CardContent>
              </Card>
            ) : (
              <ul className="space-y-3">
                {filtered.map((c) => (
                  <li key={c.id}>
                    <ClientCard client={c} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}
