import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Trash2, Archive, Plus, X } from 'lucide-react';
import { Header } from '@/components/common/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FlagChip } from '@/components/admin/FlagChip';
import { InsightsPanel } from '@/components/admin/InsightsPanel';
import { useClient, useUpdateClient, useDeleteClient } from '@/hooks/clients';
import { computeInsights } from '@/lib/insights';
import { formatDate } from '@/lib/format';
import { formatILMobile } from '@/lib/phone';
import type { Client, WeightEntry } from '@/types';

type Row = [label: string, value: unknown];

function DataSection({ title, rows }: { title: string; rows: Row[] }) {
  const visible = rows.filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '');
  if (visible.length === 0) return null;
  return (
    <Card>
      <CardContent className="py-5">
        <h2 className="mb-3 border-b border-border pb-2 text-base font-semibold">{title}</h2>
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
          {visible.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-start font-medium">{String(value)}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function intakeRows(c: Client): Row[] {
  const i = c.intake;
  if (!i) return [];
  return [
    ['מין', i.sex], ['מאושר רפואית', i.medicallyFit],
    ['נוטל תרופות', i.takesMedication], ['פירוט תרופות', i.medicationDetails],
    ['פציעות / מגבלות', i.injuriesLimitations], ['רקע ספורטיבי', i.athleticBackground],
    ['ספורט בשנה האחרונה', i.sportLastYear], ['למה עכשיו', i.whyChangeNow],
    ['מטרה', i.goal], ['ימים בשבוע', i.daysPerWeek], ['מיקום אימון', i.trainingLocation],
    ['ציוד בבית', i.homeEquipmentDetails], ['העדפת קרדיו', i.cardioPreference],
    ['הערות מיוחדות', i.specialNotes], ['איך הגיע', i.referralSource],
    ['למה אני', i.whyMe], ['משך מעקב', i.followDuration],
  ];
}

function nutritionRows(c: Client): Row[] {
  const n = c.nutrition;
  if (!n) return [];
  return [
    ['גיל', n.age], ['גובה (ס״מ)', n.height], ['משקל (ק״ג)', n.weight],
    ['רמת פעילות', n.activityLevel], ['תחביבים', n.hobbies],
    ['תעסוקה', n.occupationStatus], ['תחום לימודים', n.studyField], ['שנת לימוד', n.studyYear],
    ['תחום עבודה', n.workField], ['אופי עבודה', n.workNature], ['אכילה בעבודה', n.eatingAtWork],
    ['מיקרוגל', n.microwaveAtWork], ['מקרר', n.fridgeAtWork],
    ['פעילות יומית (חופשי)', n.dailyActivityLevel],
    ['שעת שינה', n.sleepTime], ['שעת השכמה', n.wakeUpTime],
    ['שעות שינה', n.sleepHours], ['ארוחות ביום', n.mealsPerDay], ['מתי רעב', n.whenHungry],
    ['מים ביום', n.waterPerDay], ['כשרות', n.keepsKosher], ['סוג תזונה', n.dietType],
    ['מאכלים אהובים', n.enjoyedFoods], ['מאכלים לא אהובים', n.dislikedFoods],
    ['אלרגיות', n.allergies], ['מטרה תזונתית', n.primaryGoal], ['פירוט מטרה', n.primaryGoalOther],
    ['משקל גוף', n.hasBodyScale], ['משקל מזון', n.hasFoodScale], ['בלנדר', n.hasBlender],
    ['שגרת תזונה', n.dailyNutritionRoutine], ['לא יאכל', n.foodsWontEat],
    ['חייב בתפריט', n.mustHaveFoods], ['אכילה בחוץ', n.eatingOut],
    ['נשנושים', n.snacking], ['תוספים', n.supplements],
  ];
}

// ── Weight colour logic ────────────────────────────────────────────────────
const LOSS_GOALS = new Set(['ירידה במשקל', 'חיטוב']);
const GAIN_GOALS = new Set(['מסה', 'עלייה במשקל']);

function weightChangeColor(change: number, goal: string | undefined): string {
  if (change === 0) return 'text-muted-foreground';
  const lost = change < 0;
  if (LOSS_GOALS.has(goal ?? '')) return lost ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400';
  if (GAIN_GOALS.has(goal ?? '')) return lost ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400';
  return 'text-muted-foreground';
}

function weightRowBg(change: number, goal: string | undefined): string {
  if (change === 0) return '';
  const lost = change < 0;
  if (LOSS_GOALS.has(goal ?? '')) return lost ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-red-50 dark:bg-red-950/30';
  if (GAIN_GOALS.has(goal ?? '')) return lost ? 'bg-red-50 dark:bg-red-950/30' : 'bg-emerald-50 dark:bg-emerald-950/30';
  return '';
}

function formatDisplayDate(isoDate: string): string {
  try {
    return new Date(isoDate + 'T12:00:00').toLocaleDateString('he-IL', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

// ── Weight table ───────────────────────────────────────────────────────────
function WeightLog({ client, onUpdate }: { client: Client; onUpdate: (log: WeightEntry[]) => void }) {
  const goal = client.nutrition?.primaryGoal;
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');

  const sortedAsc = [...(client.weightLog ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const sortedDesc = [...sortedAsc].reverse();

  function addEntry() {
    const w = parseFloat(weight.replace(',', '.'));
    if (!date || isNaN(w) || w <= 0) {
      toast.error('יש להזין תאריך ומשקל תקינים');
      return;
    }
    const entry: WeightEntry = {
      id: `w_${Date.now().toString(36)}`,
      date,
      weight: Math.round(w * 10) / 10,
      note: note.trim() || undefined,
    };
    onUpdate([...sortedAsc, entry]);
    setWeight('');
    setNote('');
    setDate(new Date().toISOString().split('T')[0]);
    toast.success('המשקל נוסף');
  }

  function removeEntry(id: string) {
    onUpdate(sortedAsc.filter((e) => e.id !== id));
  }

  return (
    <Card>
      <CardContent className="py-5">
        <h2 className="mb-4 border-b border-border pb-2 text-base font-semibold">מעקב משקל</h2>

        {/* Add-entry form */}
        <div className="mb-5 flex flex-wrap gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">תאריך</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9 w-36 text-sm"
              dir="ltr"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-muted-foreground">משקל (ק״ג)</label>
            <Input
              type="text"
              inputMode="decimal"
              placeholder="82.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="h-9 w-24 text-center text-sm"
              dir="ltr"
              onKeyDown={(e) => e.key === 'Enter' && addEntry()}
            />
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label className="text-xs text-muted-foreground">הערה (אופציונלי)</label>
            <Input
              type="text"
              placeholder="הערה חופשית..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-9 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && addEntry()}
            />
          </div>
          <div className="flex items-end">
            <Button size="sm" onClick={addEntry} className="h-9 gap-1">
              <Plus className="h-4 w-4" />
              הוסף
            </Button>
          </div>
        </div>

        {/* Table */}
        {sortedDesc.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-4">אין רשומות משקל עדיין</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-xs text-muted-foreground">
                <tr>
                  <th className="p-2.5 text-start font-medium">תאריך</th>
                  <th className="p-2.5 text-center font-medium">משקל (ק״ג)</th>
                  <th className="p-2.5 text-center font-medium">שינוי</th>
                  <th className="p-2.5 text-start font-medium">הערה</th>
                  <th className="p-2.5 w-8" />
                </tr>
              </thead>
              <tbody>
                {sortedDesc.map((entry, i) => {
                  const prev = sortedDesc[i + 1];
                  const change = prev ? entry.weight - prev.weight : null;
                  const bg = change !== null ? weightRowBg(change, goal) : '';
                  const changeColor = change !== null ? weightChangeColor(change, goal) : '';
                  const arrow = change === null ? '—' : change > 0 ? '▲' : change < 0 ? '▼' : '=';
                  const changeText = change === null ? '' : `${Math.abs(change).toFixed(1)}`;
                  return (
                    <tr key={entry.id} className={`border-t border-border transition-colors ${bg}`}>
                      <td className="p-2.5 text-muted-foreground">{formatDisplayDate(entry.date)}</td>
                      <td className="p-2.5 text-center font-semibold">{entry.weight}</td>
                      <td className={`p-2.5 text-center font-medium ${changeColor}`}>
                        {change !== null ? (
                          <span className="inline-flex items-center gap-0.5">
                            {arrow} {changeText}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="p-2.5 text-muted-foreground">{entry.note ?? '—'}</td>
                      <td className="p-2.5">
                        <button
                          type="button"
                          onClick={() => removeEntry(entry.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                          aria-label="מחק רשומה"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default function ClientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: client, isLoading, isError } = useClient(id);
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();

  const [notes, setNotes] = useState('');
  const notesDirty = useRef(false);
  useEffect(() => {
    if (client && !notesDirty.current) setNotes(client.coachNotes ?? '');
  }, [client]);

  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-dvh">
        <Header subtitle="כרטיס מתאמן" />
        <main className="container py-8">
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
        </main>
      </div>
    );
  }

  if (isError || !client) {
    return (
      <div className="min-h-dvh">
        <Header subtitle="כרטיס מתאמן" />
        <main className="container py-8">
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground">
              לא נמצא מתאמן. <Link to="/admin" className="text-primary">חזרה לרשימה</Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const insights = computeInsights(client);

  function saveNotes() {
    if (!client) return;
    updateClient.mutate(
      { id: client.id, patch: { coachNotes: notes } },
      {
        onSuccess: () => { notesDirty.current = false; toast.success('ההערות נשמרו'); },
        onError: () => toast.error('שמירת ההערות נכשלה'),
      },
    );
  }

  function toggleStatus() {
    if (!client) return;
    const next = client.status === 'completed' ? 'pending' : 'completed';
    updateClient.mutate(
      { id: client.id, patch: { status: next } },
      { onError: () => toast.error('עדכון הסטטוס נכשל') },
    );
  }

  function archiveClient() {
    if (!client) return;
    updateClient.mutate(
      { id: client.id, patch: { status: 'archived' } },
      {
        onSuccess: () => { toast.success('המתאמן הועבר לרשימת סיימו אימונים'); navigate('/admin'); },
        onError: () => toast.error('הפעולה נכשלה'),
      },
    );
  }

  function handleDelete() {
    if (!client) return;
    deleteClient.mutate(client.id, {
      onSuccess: () => { toast.success('המתאמן נמחק'); navigate('/admin'); },
      onError: () => { toast.error('המחיקה נכשלה'); setConfirmDelete(false); },
    });
  }

  function handleWeightUpdate(log: WeightEntry[]) {
    if (!client) return;
    updateClient.mutate({ id: client.id, patch: { weightLog: log } });
  }

  const isArchived = client.status === 'archived';

  return (
    <div className="min-h-dvh">
      <Header subtitle="כרטיס מתאמן" />
      <main className="container space-y-4 py-8">

        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link to="/admin" className="text-sm text-primary">← חזרה לרשימה</Link>
            <h1 className="mt-1 text-2xl font-bold">{client.intake?.fullName ?? 'ללא שם'}</h1>
            <p dir="ltr" className="text-start text-sm text-muted-foreground">
              {client.intake?.phone ? formatILMobile(client.intake.phone) : 'ללא טלפון'} · {formatDate(client.createdAt)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {isArchived ? (
              <Badge variant="muted">סיים אימונים</Badge>
            ) : (
              <button type="button" onClick={toggleStatus} aria-label="החלף סטטוס">
                <Badge variant={client.status === 'completed' ? 'success' : 'pending'}>
                  {client.status === 'completed' ? 'הושלם' : 'ממתין'}
                </Badge>
              </button>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <Card>
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-2">
              {!isArchived && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={archiveClient}
                  disabled={updateClient.isPending}
                  className="gap-1.5 border-amber-400/50 text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                >
                  <Archive className="h-4 w-4" />
                  סיים אימונים
                </Button>
              )}
              {isArchived && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateClient.mutate({ id: client.id, patch: { status: 'completed' } }, { onSuccess: () => toast.success('המתאמן הוחזר לרשימה') })}
                  disabled={updateClient.isPending}
                >
                  החזר לרשימה הפעילה
                </Button>
              )}
              {!confirmDelete ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(true)}
                  className="gap-1.5 border-destructive/40 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                  מחק מתאמן
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-destructive font-medium">בטוח למחוק?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteClient.isPending}
                  >
                    {deleteClient.isPending ? 'מוחק...' : 'כן, מחק'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmDelete(false)}
                  >
                    ביטול
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Flags */}
        {insights.flags.length > 0 && (
          <Card>
            <CardContent className="py-5">
              <h2 className="mb-3 text-base font-semibold">דורש תשומת לב</h2>
              <ul className="space-y-2">
                {insights.flags.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 text-sm">
                    <FlagChip flag={f} />
                    {f.detail && <span className="text-muted-foreground">{f.detail}</span>}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <InsightsPanel insights={insights} />

        {/* Weight tracking */}
        <WeightLog client={client} onUpdate={handleWeightUpdate} />

        <DataSection title="שאלון קליטה ואימונים" rows={intakeRows(client)} />
        <DataSection title="שאלון תזונה" rows={nutritionRows(client)} />

        {/* Coach notes */}
        <Card>
          <CardContent className="py-5">
            <h2 className="mb-3 text-base font-semibold">הערות מאמן</h2>
            <Textarea
              value={notes}
              onChange={(e) => { notesDirty.current = true; setNotes(e.target.value); }}
              rows={5}
            />
            <div className="mt-3 flex justify-end">
              <Button onClick={saveNotes} disabled={updateClient.isPending}>
                {updateClient.isPending ? 'שומר…' : 'שמירת הערות'}
              </Button>
            </div>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
