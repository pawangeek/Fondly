import type { IncomingMessage, ServerResponse } from 'node:http';
import { del } from '@vercel/blob';
import { CARDS_REST, SUPABASE_URL, SECRET, serviceHeaders, send } from './_lib';

const RETENTION_DAYS = 7;
const BATCH = 100;

interface ExpiredRow {
  slug: string;
  photos: string[] | null;
  voice_url: string | null;
}

// Daily cron: delete the Blob objects for cards past their retention window,
// THEN remove the rows. Runs before the Postgres backstop so Blob never orphans.
export default async function handler(
  req: IncomingMessage & { method?: string; headers: Record<string, string | string[] | undefined> },
  res: ServerResponse,
): Promise<void> {
  // Vercel sends `Authorization: Bearer <CRON_SECRET>` to scheduled invocations.
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.authorization !== `Bearer ${secret}`) {
    return send(res, 401, { error: 'unauthorized' });
  }
  if (!SUPABASE_URL || !SECRET) return send(res, 500, { error: 'server not configured' });

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 3600 * 1000).toISOString();
  let cardsDeleted = 0;
  let blobsDeleted = 0;
  let blobErrors = 0;

  // Loop in batches until nothing expired remains (or we hit a safety cap).
  for (let pass = 0; pass < 50; pass++) {
    const q = `${CARDS_REST}?created_at=lt.${encodeURIComponent(cutoff)}&select=slug,photos,voice_url&limit=${BATCH}`;
    const r = await fetch(q, { headers: serviceHeaders() });
    if (!r.ok) return send(res, 502, { error: 'could not read expired cards' });
    const rows = (await r.json()) as ExpiredRow[];
    if (!rows.length) break;

    const urls = rows.flatMap((row) => [...(row.photos ?? []), ...(row.voice_url ? [row.voice_url] : [])]);
    if (urls.length) {
      try {
        await del(urls);
        blobsDeleted += urls.length;
      } catch {
        // Don't let a Blob hiccup wedge the purge — drop the rows anyway and
        // accept a rare orphaned object rather than retrying forever.
        blobErrors += urls.length;
      }
    }

    const slugs = rows.map((row) => row.slug).join(',');
    const delRes = await fetch(`${CARDS_REST}?slug=in.(${slugs})`, {
      method: 'DELETE',
      headers: serviceHeaders({ Prefer: 'return=minimal' }),
    });
    if (!delRes.ok) return send(res, 502, { error: 'could not delete expired cards' });
    cardsDeleted += rows.length;

    if (rows.length < BATCH) break;
  }

  return send(res, 200, { cardsDeleted, blobsDeleted, blobErrors });
}
