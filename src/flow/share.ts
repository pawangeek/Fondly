import type { CardDraft, OccasionId, RecipientId, StockId } from './types';

// Compact, URL-safe encoding of the text card so a shared link reopens the
// same 3D reveal. Photos/voice are local blobs and cannot ride in a URL —
// sharing those to a real recipient would need server-side storage.
interface SharePayload {
  o?: OccasionId;
  r?: RecipientId;
  n: string;
  m: string;
  f?: string;
  s?: StockId;
}

function b64urlEncode(s: string): string {
  return btoa(unescape(encodeURIComponent(s)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(s: string): string {
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return decodeURIComponent(escape(atob(b64)));
}

export function encodeShareUrl(draft: CardDraft): string {
  const payload: SharePayload = {
    o: draft.occasion,
    r: draft.recipient,
    n: draft.name,
    m: draft.message,
    f: draft.from || undefined,
    s: draft.stock !== 'midnight' ? draft.stock : undefined,
  };
  const token = b64urlEncode(JSON.stringify(payload));
  return `${window.location.origin}${window.location.pathname}#card=${token}`;
}

export function decodeShare(): CardDraft | null {
  const hash = window.location.hash;
  const match = hash.match(/card=([^&]+)/);
  if (!match) return null;
  try {
    const payload = JSON.parse(b64urlDecode(match[1])) as SharePayload;
    if (!payload.n && !payload.m) return null;
    return {
      occasion: payload.o,
      recipient: payload.r,
      name: payload.n || '',
      message: payload.m || '',
      from: payload.f || '',
      stock: payload.s || 'midnight',
      photos: [],
    };
  } catch {
    return null;
  }
}
