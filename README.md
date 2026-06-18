# Fondly 💌

Send love in a card. Pick the occasion and who it's for, and Fondly drafts a
heartfelt message you can personalise — then add photos and a voice note, choose
the card stock, sign it, and share a link that opens into an animated 3D card.

Built with **React + Vite + TypeScript + Tailwind + MUI**, with a **Supabase +
Vercel Blob** backend for shareable `/c/:slug` links.

---

## The flow

1. **Occasion** — Feel Good, Sorry, Birthday, Congrats, Thank You. Each has its
   own palette, motion mood, and reveal effect (confetti, gilded shine, soft, …).
2. **Recipient** — Friend, Partner, Spouse, Date. Drives the message + sign-off.
3. **Details** — name, an auto-drafted (editable) message, up to 3 photos
   (auto-compressed, EXIF-corrected), a 60s voice note, a card stock, and a
   signature.
4. **Reveal** — a sealed envelope that opens into a tilt/parallax 3D card.
   Share it, save it as an image, or make another.

No payment step, no sign-up.

## How sharing works

- **Share** uploads photos + voice to **Vercel Blob**, writes the card to
  **Supabase**, and produces a short `/c/:slug` link.
- Opening `/c/:slug` server-renders OG/Twitter preview tags (`api/share.ts`) and
  the SPA fetches the card and plays the reveal.
- If no backend is configured (e.g. plain `vite dev`), Share **falls back** to a
  self-contained `#card=` link that carries the text card only (no media).
- Shared cards auto-expire after **7 days**.

## Architecture

```
src/                    React app (flow state, screens, theming)
  flow/                 FlowContext state machine, occasion/recipient data, themes
  components/           Landing, Occasion, Recipient, Details, CardReveal, …
  lib/api.ts            Blob upload + publish/fetch by slug
  lib/image.ts          client-side resize / compress / EXIF
api/                    Vercel serverless functions (bare Node handlers)
  publish.ts            POST: service-key insert + slug generation
  share.ts              GET:  anon read + OG meta injection
  blob-token.ts         POST: issues Vercel Blob client-upload tokens
  cron-cleanup.ts       GET (cron): delete expired Blob media, then rows
  _lib.ts               shared helpers (Supabase REST, slug, body, escaping)
db/cards.sql            Supabase schema + RLS + 14-day backstop purge
vercel.json             /c/:slug rewrite, SPA fallback, daily cron
```

### Data retention

- **Primary**: `/api/cron-cleanup` runs daily (`23 3 * * *`). It deletes the
  Blob objects for cards older than 7 days, then deletes the rows.
- **Backstop**: a Postgres `pg_cron` job purges rows older than 14 days in case
  the function was down — giving it a week of retries before a row (and its
  Blob) could orphan.

## Local development

```bash
npm install
npm run dev          # Vite only — api/ functions are NOT served; Share uses the offline #card= link
```

To exercise the real backend locally you need the Vercel CLI (runs the `api/`
functions and pulls env vars):

```bash
npm i -g vercel
vercel link
vercel env pull .env.local
vercel dev           # serves the app + api/ functions
```

## Setup / provisioning

### 1. Supabase

1. Create (or pick) a project.
2. SQL Editor → run [`db/cards.sql`](db/cards.sql).
3. Project Settings → API → copy the **Project URL**, the **publishable/anon**
   key, and the **service/secret** key.

### 2. Vercel

1. Link the repo to a Vercel project.
2. Storage → create a **Blob** store and connect it. This auto-adds
   `BLOB_READ_WRITE_TOKEN`, `BLOB_STORE_ID`, and `BLOB_WEBHOOK_PUBLIC_KEY`.
3. Add the remaining env vars (see [`.env.example`](.env.example)):

| Variable | Scope | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | client | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client | anon key (RLS read-only) |
| `SUPABASE_SECRET_KEY` | server | service key for `/api/publish` |
| `BLOB_READ_WRITE_TOKEN` | server | Blob put/del/upload (auto-added) |
| `CRON_SECRET` | server | auth for `/api/cron-cleanup` |

> `VITE_`-prefixed vars are exposed to the browser — only the anon key (which is
> read-only under RLS) carries that prefix. The service key never does.

## Scripts

| Command | What |
|---|---|
| `npm run dev` | Vite dev server (offline share) |
| `npm run build` | Type-check + production build |
| `npm run preview` | Preview the production build |

## License

See [LICENSE](LICENSE).
