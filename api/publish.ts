import type { IncomingMessage, ServerResponse } from 'node:http';
import { CARDS_REST, SUPABASE_URL, SECRET, randomSlug, serviceHeaders, readBody, send } from './_lib.js';

async function slugTaken(slug: string): Promise<boolean> {
  const r = await fetch(`${CARDS_REST}?slug=eq.${slug}&select=slug`, { headers: serviceHeaders() });
  if (!r.ok) return false;
  const rows = (await r.json()) as unknown[];
  return Array.isArray(rows) && rows.length > 0;
}

interface PublishPayload {
  data: Record<string, unknown>;
  photos?: string[];
  voice_url?: string;
}

const BLOB_HOST = /\.public\.blob\.vercel-storage\.com$/;

function validUrls(urls: unknown): string[] {
  if (!Array.isArray(urls)) return [];
  return urls
    .filter((u): u is string => typeof u === 'string')
    .filter((u) => {
      try {
        return BLOB_HOST.test(new URL(u).hostname);
      } catch {
        return false;
      }
    })
    .slice(0, 3);
}

export default async function handler(
  req: IncomingMessage & { method?: string },
  res: ServerResponse,
): Promise<void> {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  if (!SUPABASE_URL || !SECRET) return send(res, 500, { error: 'server not configured' });

  const raw = await readBody(req);
  if (raw.length > 100_000) return send(res, 413, { error: 'card too large' });

  let payload: PublishPayload;
  try {
    payload = JSON.parse(raw) as PublishPayload;
  } catch {
    return send(res, 400, { error: 'invalid json' });
  }

  const data = payload.data;
  if (!data || typeof data !== 'object' || typeof (data as { name?: unknown }).name !== 'string') {
    return send(res, 400, { error: 'invalid card' });
  }

  const photos = validUrls(payload.photos);
  let voice_url: string | null = null;
  if (typeof payload.voice_url === 'string') {
    try {
      if (BLOB_HOST.test(new URL(payload.voice_url).hostname)) voice_url = payload.voice_url;
    } catch {
      /* ignore malformed voice url */
    }
  }

  let slug = '';
  for (let i = 0; i < 5; i++) {
    const candidate = randomSlug(6);
    if (!(await slugTaken(candidate))) {
      slug = candidate;
      break;
    }
  }
  if (!slug) slug = randomSlug(8);

  const r = await fetch(CARDS_REST, {
    method: 'POST',
    headers: serviceHeaders({ Prefer: 'return=minimal' }),
    body: JSON.stringify({ slug, data, photos, voice_url }),
  });
  if (!r.ok) return send(res, 500, { error: 'could not save card' });

  return send(res, 200, { slug });
}
