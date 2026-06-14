import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

interface GoalImageUploadProps {
  onChange: (file: File | null) => void;
}

export function GoalImageUpload({ onChange }: GoalImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setError(null);

    if (!file) {
      setPreviewUrl(null);
      onChange(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('סוג קובץ לא נתמך. יש לבחור תמונה (JPEG, PNG, WEBP, GIF)');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('הקובץ גדול מדי. גודל מקסימלי: 5MB');
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onChange(file);
  }

  function handleRemove() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onChange(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-foreground">
        תמונת מטרה / השראה (אופציונלי)
      </p>
      <p className="mb-3 text-xs text-muted-foreground">
        תמונה שמייצגת את המטרה שלך — עד 5MB
      </p>

      {previewUrl ? (
        <div className="relative w-fit">
          <img
            src={previewUrl}
            alt="תצוגה מקדימה"
            className="h-40 w-40 rounded-md border border-border object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className={cn(
              'absolute -end-2 -top-2 flex h-5 w-5 items-center justify-center',
              'rounded-full bg-destructive text-xs text-destructive-foreground',
              'hover:bg-destructive/80',
            )}
            aria-label="הסר תמונה"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex h-28 w-full cursor-pointer flex-col items-center justify-center gap-2',
            'rounded-md border border-dashed border-border bg-muted/40',
            'text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/70',
          )}
        >
          <span className="text-2xl leading-none">+</span>
          <span>לחץ להעלאת תמונה</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
