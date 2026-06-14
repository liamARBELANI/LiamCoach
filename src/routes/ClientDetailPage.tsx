import { useParams } from 'react-router-dom';
import { Header } from '@/components/common/Header';
import { Card, CardContent } from '@/components/ui/card';

export default function ClientDetailPage() {
  const { id } = useParams();
  return (
    <div className="min-h-dvh">
      <Header subtitle="כרטיס מתאמן" />
      <main className="container py-8">
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            כרטיס המתאמן ({id}) ייבנה בשלב מאוחר יותר.
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
