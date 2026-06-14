import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="container flex min-h-dvh max-w-md flex-col items-center justify-center py-16 text-center">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        שגיאה 404
      </p>
      <h1 className="mt-3 text-xl font-semibold">הדף לא נמצא</h1>
      <p className="mt-2 text-muted-foreground">מצטערים, הדף שחיפשת אינו קיים.</p>
      <Button asChild variant="outline" className="mt-6">
        <Link to="/intake">חזרה לשאלון</Link>
      </Button>
    </main>
  );
}
