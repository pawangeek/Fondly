import { useRef, useState } from 'react';
import { Close, AddPhotoAlternate } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { useFlow } from '../flow/FlowContext';
import { MAX_PHOTOS, MAX_PHOTO_MB } from '../flow/data';
import type { PhotoItem } from '../flow/types';
import { processImage } from '../lib/image';

const ACCEPT = 'image/jpeg,image/png,image/webp';

export default function PhotoUpload() {
  const { draft, setPhotos } = useFlow();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [warn, setWarn] = useState('');

  const add = async (files: FileList | null) => {
    if (!files) return;
    setWarn('');
    const room = MAX_PHOTOS - draft.photos.length;
    const accepted = Array.from(files).slice(0, room);
    const tooBig = Array.from(files).some((f) => f.size > MAX_PHOTO_MB * 1024 * 1024 * 2);
    setBusy(true);
    try {
      const next: PhotoItem[] = [];
      for (const f of accepted) {
        // Originals over ~10 MB are likely not real photos / will be slow — skip.
        if (f.size > MAX_PHOTO_MB * 1024 * 1024 * 2) continue;
        const { url } = await processImage(f);
        next.push({ id: `${f.name}-${f.size}-${f.lastModified}`, url, name: f.name });
      }
      setPhotos([...draft.photos, ...next]);
      if (tooBig) setWarn(`Some photos were too large (over ${MAX_PHOTO_MB * 2} MB) and were skipped.`);
    } catch {
      setWarn('Couldn’t process that image — try a different one.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (id: string) => {
    const target = draft.photos.find((p) => p.id === id);
    if (target) URL.revokeObjectURL(target.url);
    setPhotos(draft.photos.filter((p) => p.id !== id));
  };

  const full = draft.photos.length >= MAX_PHOTOS;

  return (
    <div className="rounded-2xl border border-line bg-surface/60 p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold flex items-center gap-2">📸 Add photos <span className="text-muted text-sm font-normal">(up to {MAX_PHOTOS})</span></p>
        <span className="text-xs text-muted">{draft.photos.length}/{MAX_PHOTOS} · Optional</span>
      </div>

      <div className="mt-3 flex gap-2.5">
        {draft.photos.map((p) => (
          <div key={p.id} className="relative h-20 w-20 rounded-xl overflow-hidden border border-line">
            <img src={p.url} alt={p.name} className="h-full w-full object-cover" />
            <button
              onClick={() => remove(p.id)}
              className="absolute top-1 right-1 grid place-items-center h-5 w-5 rounded-full bg-black/70 text-white"
              aria-label="Remove photo"
            >
              <Close sx={{ fontSize: 13 }} />
            </button>
          </div>
        ))}

        {!full && (
          <button
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="h-20 w-20 rounded-xl border border-dashed border-line grid place-items-center text-muted hover:text-white hover:border-gold/60 transition-colors disabled:opacity-50"
            aria-label="Add photo"
          >
            {busy ? <CircularProgress size={20} sx={{ color: 'hsl(45 95% 58%)' }} /> : <AddPhotoAlternate />}
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-muted">
        {busy ? 'Optimising…' : `Up to ${MAX_PHOTOS} photos · JPEG · PNG · WebP · auto-compressed`}
      </p>
      {warn && <p className="mt-1 text-xs text-primary">{warn}</p>}

      <input ref={inputRef} type="file" accept={ACCEPT} multiple hidden onChange={(e) => add(e.target.files)} />
    </div>
  );
}
