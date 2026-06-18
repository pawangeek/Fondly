import type { IncomingMessage, ServerResponse } from 'node:http';

export const SUPABASE_URL = process.env.VITE_SUPABASE_URL ?? '';
export const SECRET = process.env.SUPABASE_SECRET_KEY ?? '';
export const PUBLISHABLE = process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';
export const CARDS_REST = `${SUPABASE_URL}/rest/v1/cards`;

const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function randomSlug(len: number): string {
  let s = '';
  for (let i = 0; i < len; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
}

export function serviceHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: SECRET,
    Authorization: `Bearer ${SECRET}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

export async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8');
}

export function send(res: ServerResponse, status: number, body: unknown): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Slugs are our generated [A-Za-z0-9] tokens — reject anything else.
export const SLUG_RE = /^[A-Za-z0-9]{4,16}$/;
