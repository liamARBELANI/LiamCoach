import { Header } from '@/components/common/Header';
import { Card, CardContent } from '@/components/ui/card';

export default function LoginPage() {
  return (
    <div className="min-h-dvh">
      <Header subtitle="כניסת מאמן" />
      <main className="container flex max-w-md flex-col py-12">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            מסך הכניסה ייבנה בשלב מאוחר יותר.
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
