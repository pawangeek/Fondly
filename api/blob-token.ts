import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { readBody, send } from './_lib.js';

// Issues short-lived client-upload tokens so the browser can stream photos and
// the voice note straight to Vercel Blob (avoids the 4.5 MB function body cap).
export default async function handler(
  req: IncomingMessage & { method?: string; url?: string },
  res: ServerResponse,
): Promise<void> {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST only' });
  if (!process.env.BLOB_READ_WRITE_TOKEN) return send(res, 500, { error: 'blob not configured' });

  let body: HandleUploadBody;
  try {
    body = JSON.parse(await readBody(req)) as HandleUploadBody;
  } catch {
    return send(res, 400, { error: 'invalid json' });
  }

  try {
    const json = await handleUpload({
      body,
      request: req as unknown as Request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'audio/webm', 'audio/mp4', 'audio/ogg'],
        maximumSizeInBytes: 8 * 1024 * 1024,
        addRandomSuffix: true,
        validUntil: Date.now() + 60_000,
      }),
      onUploadCompleted: async () => {
        /* nothing to persist here — the publish step records the URLs */
      },
    });
    return send(res, 200, json);
  } catch (err) {
    return send(res, 400, { error: (err as Error).message });
  }
}
