import { Header } from '@/components/common/Header';
import { IntakeWizard } from '@/components/intake/IntakeWizard';

export default function IntakePage() {
  return (
    <div className="min-h-dvh">
      <Header subtitle="שאלון קליטת מתאמן" />
      <main className="container max-w-2xl py-8 pb-16">
        <IntakeWizard />
      </main>
    </div>
  );
}
