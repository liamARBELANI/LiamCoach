import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/format';
import { formatILMobile } from '@/lib/phone';
import { FlagChip, BmiChip } from '@/components/admin/FlagChip';
import type { Client } from '@/types';
import type { ComputedInsights } from '@/lib/insights';

function statusLabel(s: Client['status']) {
  return s === 'completed' ? 'הושלם' : 'ממתין';
}

export function ClientTable({
  clients,
  insightsById,
}: {
  clients: Client[];
  insightsById: Map<string, ComputedInsights>;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-muted/50 text-xs text-muted-foreground">
          <tr>
            <th className="p-3 text-start font-medium">שם</th>
            <th className="p-3 text-start font-medium">טלפון</th>
            <th className="p-3 text-start font-medium">מטרה</th>
            <th className="p-3 text-start font-medium">BMI</th>
            <th className="p-3 text-start font-medium">ימים</th>
            <th className="p-3 text-start font-medium">התראות</th>
            <th className="p-3 text-start font-medium">סטטוס</th>
            <th className="p-3 text-start font-medium">נוצר</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => {
            const ins = insightsById.get(c.id);
            return (
              <tr key={c.id} className="border-t border-border transition-colors hover:bg-muted/30">
                <td className="p-3">
                  <Link to={`/admin/clients/${c.id}`} className="font-medium hover:text-primary">
                    {c.intake?.fullName ?? 'ללא שם'}
                  </Link>
                </td>
                <td className="p-3" dir="ltr">
                  {c.intake?.phone ? formatILMobile(c.intake.phone) : '—'}
                </td>
                <td className="p-3">{c.nutrition?.primaryGoal ?? '—'}</td>
                <td className="p-3">
                  {ins?.bmi ? <BmiChip value={ins.bmi.value} category={ins.bmi.category} /> : '—'}
                </td>
                <td className="p-3">{c.intake?.daysPerWeek ?? '—'}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {ins && ins.flags.length > 0 ? ins.flags.map((f) => <FlagChip key={f.id} flag={f} />) : '—'}
                  </div>
                </td>
                <td className="p-3">
                  <Badge variant={c.status === 'completed' ? 'success' : 'pending'}>{statusLabel(c.status)}</Badge>
                </td>
                <td className="p-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
