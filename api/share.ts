import type { IncomingMessage, ServerResponse } from 'node:http';
import { SUPABASE_URL, PUBLISHABLE, CARDS_REST, escapeHtml, SLUG_RE } from './_lib.js';

interface CardRow {
  data?: { name?: string; from?: string; occasion?: string };
  photos?: string[];
}

const OCCASION_LABEL: Record<string, string> = {
  feelgood: 'A little something',
  sorry: 'An apology',
  birthday: 'A birthday card',
  congrats: 'A congratulations',
  thankyou: 'A thank-you',
};

async function fetchCard(slug: string): Promise<CardRow | null> {
  if (!SUPABASE_URL || !PUBLISHABLE || !SLUG_RE.test(slug)) return null;
  try {
    const r = await fetch(`${CARDS_REST}?slug=eq.${slug}&select=data,photos`, {
      headers: { apikey: PUBLISHABLE, Authorization: `Bearer ${PUBLISHABLE}` },
    });
    if (!r.ok) return null;
    const rows = (await r.json()) as CardRow[];
    return rows?.[0] ?? null;
  } catch {
    return null;
  }
}

function inject(html: string, fields: Record<string, string>): string {
  let out = html;
  const setMeta = (attr: 'property' | 'name', key: string, value: string) => {
    const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`, 'i');
    if (re.test(out)) out = out.replace(re, `$1${escapeHtml(value)}$2`);
    else out = out.replace(/<\/head>/i, `  <meta ${attr}="${key}" content="${escapeHtml(value)}" />\n</head>`);
  };
  out = out.replace(/<title>[^<]*<\/title>/i, `<title>${escapeHtml(fields.title)}</title>`);
  setMeta('name', 'description', fields.description);
  setMeta('property', 'og:title', fields.title);
  setMeta('property', 'og:description', fields.description);
  setMeta('property', 'og:url', fields.url);
  setMeta('property', 'og:type', 'website');
  if (fields.image) {
    setMeta('property', 'og:image', fields.image);
    setMeta('name', 'twitter:image', fields.image);
  }
  setMeta('name', 'twitter:card', fields.image ? 'summary_large_image' : 'summary');
  setMeta('name', 'twitter:title', fields.title);
  setMeta('name', 'twitter:description', fields.description);
  return out;
}

export default async function handler(
  req: IncomingMessage & { method?: string; url?: string },
  res: ServerResponse,
): Promise<void> {
  const host = (req.headers.host as string) ?? '';
  const proto = (req.headers['x-forwarded-proto'] as string) ?? 'https';
  const origin = `${proto}://${host}`;
  const reqUrl = new URL(req.url ?? '/', origin);
  const slug = reqUrl.searchParams.get('slug') ?? '';

  let shell = '';
  try {
    shell = await (await fetch(`${origin}/index.html`)).text();
  } catch {
    res.statusCode = 302;
    res.setHeader('Location', '/');
    res.end();
    return;
  }

  const card = await fetchCard(slug);
  res.setHeader('Content-Type', 'text/html; charset=utf-8');

  // Unknown / expired slug → serve the plain shell; the SPA shows the friendly
  // "this card link looks broken" state.
  if (!card) {
    res.statusCode = 200;
    res.end(shell);
    return;
  }

  const name = card.data?.name?.trim() || 'you';
  const occasion = card.data?.occasion ?? '';
  const label = OCCASION_LABEL[occasion] ?? 'A card';
  const from = card.data?.from?.trim();
  const image = card.photos?.[0];

  const html = inject(shell, {
    title: `💌 ${name}, you've got a card`,
    description: from ? `${label} for ${name}, from ${from}. Tap to open it.` : `${label} for ${name}. Tap to open it.`,
    url: `${origin}/c/${slug}`,
    image: image ?? '',
  });

  res.statusCode = 200;
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
  res.end(html);
}
