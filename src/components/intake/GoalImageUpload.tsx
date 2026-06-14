import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImagePlus, X, Camera } from 'lucide-react';
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
  const [isDragging, setIsDragging] = useState(false);

  function processFile(file: File | null) {
    setError(null);
    if (!file) {
      setPreviewUrl(null);
      onChange(null);
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('סוג קובץ לא נתמך. בחר תמונה (JPEG, PNG, WEBP, GIF)');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('הקובץ גדול מדי — מקסימום 5MB');
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onChange(file);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    processFile(e.target.files?.[0] ?? null);
  }

  function handleRemove() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onChange(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files?.[0] ?? null);
  }

  return (
    <div>
      <p className="mb-1 text-sm font-medium text-foreground">
        תמונת מטרה / השראה <span className="text-muted-foreground font-normal">(אופציונלי)</span>
      </p>
      <p className="mb-3 text-xs text-muted-foreground">
        תמונה שמייצגת את המטרה שלך — עד 5MB
      </p>

      <AnimatePresence mode="wait">
        {previewUrl ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="group relative w-full overflow-hidden rounded-xl border border-border"
            style={{ aspectRatio: '16/7' }}
          >
            <img
              src={previewUrl}
              alt="תצוגה מקדימה"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/0 transition-all duration-200 group-hover:bg-black/40">
              <motion.button
                type="button"
                onClick={() => inputRef.current?.click()}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-foreground opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100"
              >
                <Camera className="h-3.5 w-3.5" />
                שנה תמונה
              </motion.button>
              <motion.button
                type="button"
                onClick={handleRemove}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-1.5 rounded-lg bg-destructive/90 px-3 py-1.5 text-xs font-semibold text-destructive-foreground opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100"
                aria-label="הסר תמונה"
              >
                <X className="h-3.5 w-3.5" />
                הסר
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="upload"
            type="button"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              'flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 px-4',
              'transition-all duration-200',
              isDragging
                ? 'border-primary bg-primary/10 scale-[1.01]'
                : 'border-border bg-muted/30 hover:border-primary/50 hover:bg-primary/5',
            )}
          >
            <motion.div
              animate={isDragging ? { y: [-4, 0, -4] } : { y: 0 }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"
            >
              <ImagePlus className="h-6 w-6 text-primary" strokeWidth={1.5} />
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                {isDragging ? 'שחרר כאן' : 'לחץ להעלאה או גרור תמונה'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">JPEG, PNG, WEBP, GIF — עד 5MB</p>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="mt-2 text-xs text-destructive"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
