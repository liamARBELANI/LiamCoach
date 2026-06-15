import { Card, CardContent } from '@/components/ui/card';
import { BmiChip } from '@/components/admin/FlagChip';
import type { ComputedInsights } from '@/lib/insights';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold" dir="ltr">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

export function InsightsPanel({ insights }: { insights: ComputedInsights }) {
  const { bmi, energy, missing } = insights;
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card>
        <CardContent className="py-5">
          <p className="mb-3 text-sm font-semibold">מדד מסת גוף (BMI)</p>
          {bmi ? (
            <BmiChip value={bmi.value} category={bmi.category} />
          ) : (
            <p className="text-sm text-muted-foreground">— נתונים חסרים</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="py-5">
          <p className="mb-3 text-sm font-semibold">אנרגיה ומאקרו (המלצת פתיחה)</p>
          {energy ? (
            <>
              <div className="grid grid-cols-3 gap-2">
                <Stat label="BMR" value={energy.bmr} />
                <Stat label="TDEE" value={energy.tdee} />
                <Stat label='יעד קק"ל' value={energy.targetCalories} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3">
                <Stat label="חלבון (ג׳)" value={energy.macros.proteinG} />
                <Stat label="פחמימה (ג׳)" value={energy.macros.carbG} />
                <Stat label="שומן (ג׳)" value={energy.macros.fatG} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              — נתונים חסרים ({missing.join(', ')})
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
