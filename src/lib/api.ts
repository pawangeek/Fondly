import { upload } from '@vercel/blob/client';
import type { CardDraft, PhotoItem } from '../flow/types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const PUBLISHABLE = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

// Backend is optional: with no Supabase env we fall back to the offline #card= link.
export const hasBackend = (): boolean => !!SUPABASE_URL && !!PUBLISHABLE;

const SLUG_RE = /^[A-Za-z0-9]{4,16}$/;

export function getSlugFromPath(): string | null {
  if (typeof window === 'undefined') return null;
  const m = window.location.pathname.match(/^\/c\/([A-Za-z0-9]+)\/?$/);
  return m && SLUG_RE.test(m[1]) ? m[1] : null;
}

function extFor(type: string): string {
  if (type.includes('webp')) return 'webp';
  if (type.includes('png')) return 'png';
  if (type.includes('jpeg') || type.includes('jpg')) return 'jpg';
  if (type.includes('webm')) return 'webm';
  if (type.includes('mp4')) return 'm4a';
  if (type.includes('ogg')) return 'ogg';
  return 'bin';
}

// Turn a local object URL into a real Blob, then stream it to Vercel Blob.
async function uploadObjectUrl(objectUrl: string, baseName: string): Promise<string> {
  const blob = await (await fetch(objectUrl)).blob();
  const ext = extFor(blob.type);
  const result = await upload(`fondly/${baseName}-${Date.now()}.${ext}`, blob, {
    access: 'public',
    handleUploadUrl: '/api/blob-token',
    contentType: blob.type || undefined,
  });
  return result.url;
}

export interface PublishResult {
  slug: string;
  url: string;
}

// Upload media to Blob, persist the card row, and return its /c/:slug link.
export async function publishCard(draft: CardDraft): Promise<PublishResult> {
  const photoUrls: string[] = [];
  for (let i = 0; i < draft.photos.length; i++) {
    photoUrls.push(await uploadObjectUrl(draft.photos[i].url, `photo-${i + 1}`));
  }

  let voiceUrl: string | undefined;
  if (draft.voiceUrl) voiceUrl = await uploadObjectUrl(draft.voiceUrl, 'voice');

  const body = {
    data: {
      occasion: draft.occasion,
      recipient: draft.recipient,
      name: draft.name,
      message: draft.message,
      from: draft.from,
      stock: draft.stock,
      voiceDuration: draft.voiceDuration,
    },
    photos: photoUrls,
    voice_url: voiceUrl,
  };

  const r = await fetch('/api/publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`publish failed: ${r.status}`);
  const { slug } = (await r.json()) as { slug: string };
  return { slug, url: `${window.location.origin}/c/${slug}` };
}

interface CardRow {
  data: Partial<CardDraft> & { voiceDuration?: number };
  photos: string[];
  voice_url: string | null;
}

// Read a published card by slug, mapping it back into a CardDraft.
export async function fetchCard(slug: string): Promise<CardDraft | null> {
  if (!hasBackend() || !SLUG_RE.test(slug)) return null;
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/cards?slug=eq.${slug}&select=data,photos,voice_url`, {
      headers: { apikey: PUBLISHABLE as string, Authorization: `Bearer ${PUBLISHABLE}` },
    });
    if (!r.ok) return null;
    const rows = (await r.json()) as CardRow[];
    const row = rows?.[0];
    if (!row?.data) return null;

    const photos: PhotoItem[] = (row.photos ?? []).map((url, i) => ({
      id: `remote-${i}`,
      url,
      name: `photo-${i + 1}`,
    }));

    return {
      occasion: row.data.occasion,
      recipient: row.data.recipient,
      name: row.data.name ?? '',
      message: row.data.message ?? '',
      from: row.data.from ?? '',
      stock: row.data.stock ?? 'midnight',
      photos,
      voiceUrl: row.voice_url ?? undefined,
      voiceDuration: row.data.voiceDuration,
    };
  } catch {
    return null;
  }
}
