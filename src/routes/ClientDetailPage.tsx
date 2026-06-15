import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Header } from '@/components/common/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FlagChip } from '@/components/admin/FlagChip';
import { InsightsPanel } from '@/components/admin/InsightsPanel';
import { useClient, useUpdateClient } from '@/hooks/clients';
import { computeInsights } from '@/lib/insights';
import { formatDate } from '@/lib/format';
import { formatILMobile } from '@/lib/phone';
import type { Client } from '@/types';

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
    ['פעילות יומית (חופשי)', n.dailyActivityLevel], ['שעות שינה/השכמה', n.sleepWakeTimes],
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

export default function ClientDetailPage() {
  const { id } = useParams();
  const { data: client, isLoading, isError } = useClient(id);
  const updateNotes = useUpdateClient();
  const updateStatus = useUpdateClient();

  const [notes, setNotes] = useState('');
  const notesDirty = useRef(false);
  useEffect(() => {
    if (client && !notesDirty.current) setNotes(client.coachNotes ?? '');
  }, [client]);

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
    updateNotes.mutate(
      { id: client.id, patch: { coachNotes: notes } },
      { onSuccess: () => { notesDirty.current = false; toast.success('ההערות נשמרו'); }, onError: () => toast.error('שמירת ההערות נכשלה') },
    );
  }

  function toggleStatus() {
    if (!client) return;
    const next = client.status === 'completed' ? 'pending' : 'completed';
    updateStatus.mutate(
      { id: client.id, patch: { status: next } },
      { onError: () => toast.error('עדכון הסטטוס נכשל') },
    );
  }

  return (
    <div className="min-h-dvh">
      <Header subtitle="כרטיס מתאמן" />
      <main className="container space-y-4 py-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link to="/admin" className="text-sm text-primary">← חזרה לרשימה</Link>
            <h1 className="mt-1 text-2xl font-bold">{client.intake?.fullName ?? 'ללא שם'}</h1>
            <p dir="ltr" className="text-start text-sm text-muted-foreground">
              {client.intake?.phone ? formatILMobile(client.intake.phone) : 'ללא טלפון'} · {formatDate(client.createdAt)}
            </p>
          </div>
          <button type="button" onClick={toggleStatus} aria-label="החלף סטטוס">
            <Badge variant={client.status === 'completed' ? 'success' : 'pending'}>
              {client.status === 'completed' ? 'הושלם' : 'ממתין'}
            </Badge>
          </button>
        </div>

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

        <DataSection title="שאלון קליטה ואימונים" rows={intakeRows(client)} />
        <DataSection title="שאלון תזונה" rows={nutritionRows(client)} />

        <Card>
          <CardContent className="py-5">
            <h2 className="mb-3 text-base font-semibold">הערות מאמן</h2>
            <Textarea value={notes} onChange={(e) => { notesDirty.current = true; setNotes(e.target.value); }} rows={5} />
            <div className="mt-3 flex justify-end">
              <Button onClick={saveNotes} disabled={updateNotes.isPending}>
                {updateNotes.isPending ? 'שומר…' : 'שמירת הערות'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI insight slot — reserved for a future AI summary (separate spec). */}
        <Card>
          <CardContent className="py-5">
            <h2 className="mb-2 text-base font-semibold">סיכום חכם (בקרוב)</h2>
            <p className="text-sm text-muted-foreground">
              סיכום אוטומטי של המתאמן יתווסף כאן בהמשך.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
