import { Moon, Sun, MonitorSmartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/providers/ThemeProvider';

const order = ['light', 'dark', 'system'] as const;
const labels: Record<(typeof order)[number], string> = {
  light: 'מצב בהיר',
  dark: 'מצב כהה',
  system: 'לפי המערכת',
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const next = () => {
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  };

  const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : MonitorSmartphone;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={next}
      aria-label={`שינוי ערכת נושא — כעת: ${labels[theme]}`}
      title={labels[theme]}
    >
      <Icon className="size-5" />
    </Button>
  );
}
