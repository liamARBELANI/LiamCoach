export default function SuccessPage() {
  return (
    <main className="container flex min-h-dvh max-w-lg flex-col items-center justify-center py-16 text-center">
      <div className="w-full border-t-2 border-primary pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          הטופס התקבל
        </p>
        <h1 className="mt-3 text-2xl font-bold">תודה! הפרטים נשלחו בהצלחה</h1>
        <p className="mt-3 text-muted-foreground">
          קיבלנו את הפרטים שלך. ניצור איתך קשר בהקדם כדי להתחיל את המסע.
        </p>
      </div>
    </main>
  );
}
