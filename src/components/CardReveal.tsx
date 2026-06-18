import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Snackbar } from '@mui/material';
import { Share, Replay, VolumeUp, FavoriteBorder, AutoAwesome, Download } from '@mui/icons-material';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { toPng } from 'html-to-image';
import { useFlow } from '../flow/FlowContext';
import { OCCASIONS, RECIPIENTS } from '../flow/data';
import { OCCASION_THEMES, getStock, signOff, type OccasionTheme } from '../flow/themes';
import { encodeShareUrl } from '../flow/share';
import { hasBackend, publishCard } from '../lib/api';

const DEFAULT_THEME = OCCASION_THEMES.feelgood;

// Ambient emoji floaters — set + density come from the occasion theme.
function Particles({ emojis, count, slow }: { emojis: string[]; count: number; slow?: boolean }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: (i * 67) % 100,
        top: (i * 23) % 92,
        delay: (i % 7) * 0.4,
        size: 12 + ((i * 13) % 18),
        e: emojis[i % emojis.length],
      })),
    [emojis, count],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden">
      {bits.map((b, i) => (
        <span
          key={i}
          className="absolute animate-floaty opacity-70"
          style={{
            left: `${b.left}%`,
            top: `${b.top}%`,
            fontSize: b.size,
            animationDelay: `${b.delay}s`,
            animationDuration: slow ? '7.5s' : '4s',
          }}
        >
          {b.e}
        </span>
      ))}
    </div>
  );
}

// Birthday: a one-shot confetti burst when the card opens.
const CONFETTI_COLORS = ['#ff4fa3', '#ffd54a', '#41d8e6', '#a06bff', '#ff8a3d'];
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        left: (i * 37) % 100,
        delay: (i % 10) * 0.07,
        dur: 1.8 + ((i * 7) % 12) / 10,
        rot: ((i * 53) % 720) - 360,
        size: 6 + ((i * 5) % 7),
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        round: i % 3 === 0,
      })),
    [],
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          initial={{ y: -30, opacity: 0, rotate: 0 }}
          animate={{ y: 560, opacity: [0, 1, 1, 0.9, 0], rotate: p.rot }}
          transition={{ duration: p.dur, delay: p.delay, ease: 'easeIn' }}
          className="absolute top-0"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.5,
            background: p.color,
            borderRadius: p.round ? '50%' : 2,
          }}
        />
      ))}
    </div>
  );
}

// Congrats: a gilded light bar that sweeps across the card.
function ShineSweep() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 motion-reduce:hidden"
      initial={{ x: '-130%' }}
      animate={{ x: '130%' }}
      transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.4, ease: 'easeInOut' }}
      style={{
        background:
          'linear-gradient(105deg, transparent 35%, hsl(45 95% 75% / 0.35) 50%, transparent 65%)',
        mixBlendMode: 'screen',
      }}
    />
  );
}

export default function CardReveal() {
  const { draft, reset, sharedView } = useFlow();
  const [opened, setOpened] = useState(false);
  const [toast, setToast] = useState('');
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const occasion = OCCASIONS.find((o) => o.id === draft.occasion);
  const recipient = RECIPIENTS.find((r) => r.id === draft.recipient);
  const theme: OccasionTheme = draft.occasion ? OCCASION_THEMES[draft.occasion] : DEFAULT_THEME;
  const stock = getStock(draft.stock);
  const gradText = {
    background: theme.cta,
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    color: 'transparent',
  } as const;

  // --- 3D tilt: pointer + device orientation drive rotation, springed ---
  const rx = useSpring(useMotionValue(0), { stiffness: 120, damping: 14 });
  const ry = useSpring(useMotionValue(0), { stiffness: 120, damping: 14 });
  const glareX = useTransform(ry, [-14, 14], ['85%', '15%']);
  const glareY = useTransform(rx, [-14, 14], ['15%', '85%']);
  const glareBg = useTransform(
    [glareX, glareY],
    ([x, y]) => `radial-gradient(120px 120px at ${x} ${y}, rgba(255,255,255,0.20), transparent 70%)`,
  );

  const onPointer = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 22);
    rx.set(-py * 18);
  };
  const resetTilt = () => {
    rx.set(0);
    ry.set(0);
  };

  useEffect(() => {
    if (!opened) return;
    const onOrient = (ev: DeviceOrientationEvent) => {
      if (ev.gamma == null || ev.beta == null) return;
      ry.set(Math.max(-18, Math.min(18, ev.gamma)) * 0.8);
      rx.set(Math.max(-18, Math.min(18, ev.beta - 45)) * 0.4);
    };
    window.addEventListener('deviceorientation', onOrient);
    return () => window.removeEventListener('deviceorientation', onOrient);
  }, [opened, rx, ry]);

  const saveImage = async () => {
    if (!cardRef.current) return;
    setSaving(true);
    resetTilt(); // flatten the card so the export isn't skewed
    await new Promise((r) => setTimeout(r, 220));
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: undefined,
      });
      const a = document.createElement('a');
      a.download = `fondly-card-${(draft.name || 'card').toLowerCase().replace(/\s+/g, '-')}.png`;
      a.href = dataUrl;
      a.click();
      setToast('Saved! Find it in your downloads 🖼️');
    } catch {
      setToast('Couldn’t save the image — try again.');
    } finally {
      setSaving(false);
    }
  };

  const deliver = async (url: string) => {
    const text = `A card for ${draft.name} 💌`;
    try {
      if (navigator.share) await navigator.share({ title: 'A Fondly card', text, url });
      else {
        await navigator.clipboard.writeText(url);
        setToast('Card link copied — paste it anywhere 💌');
      }
    } catch {
      /* share sheet dismissed */
    }
  };

  const share = async () => {
    // Prefer a real published /c/:slug link (carries photos + voice). Fall back
    // to the offline #card= link when there's no backend or publishing fails.
    if (hasBackend()) {
      setPublishing(true);
      try {
        const { url } = await publishCard(draft);
        await deliver(url);
        return;
      } catch {
        setToast('Couldn’t reach the server — sharing an offline link instead.');
      } finally {
        setPublishing(false);
      }
    }
    await deliver(encodeShareUrl(draft));
  };

  return (
    <div className="app-bg min-h-full relative flex flex-col">
      <Particles emojis={theme.particles.emojis} count={theme.particles.count} slow={theme.effect === 'soft'} />
      {opened && theme.effect === 'confetti' && <Confetti />}

      <div className="relative z-10 px-5 pt-10 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          {occasion?.title}
          {recipient ? ` · for your ${recipient.title.toLowerCase()}` : ''}
        </p>
        <h2 className="mt-2 text-3xl font-extrabold">
          {opened ? 'Your card 💌' : sharedView ? 'You’ve got a card' : 'A surprise for'}
        </h2>
        {!opened && (
          <p className="text-4xl font-extrabold mt-1" style={gradText}>
            {draft.name} 💕
          </p>
        )}
      </div>

      {/* 3D stage */}
      <div className="relative z-10 px-5 mt-8 flex-1 flex items-start justify-center" style={{ perspective: 1100 }}>
        {!opened ? (
          // ---- Sealed envelope ----
          <motion.button
            onClick={() => setOpened(true)}
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="relative w-full max-w-[330px] aspect-[4/3] mt-6"
            style={{ transformStyle: 'preserve-3d' }}
            aria-label="Open your card"
          >
            <div className="absolute inset-0 rounded-2xl blur-2xl opacity-40" style={{ background: theme.cta }} />
            <div
              className="absolute inset-0 rounded-2xl bg-surface border border-white/10 overflow-hidden"
              style={{ boxShadow: `0 0 30px ${theme.glow}` }}
            >
              <div className="absolute inset-0 opacity-20" style={{ background: theme.cta }} />
              <div
                className="absolute left-0 top-0 w-full"
                style={{
                  height: '60%',
                  background: 'linear-gradient(180deg, hsl(280 40% 12%), hsl(280 40% 9%))',
                  clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}
              />
              <div
                className="absolute left-1/2 top-[46%] -translate-x-1/2 -translate-y-1/2 grid place-items-center h-14 w-14 rounded-full"
                style={{ background: theme.seal, boxShadow: `0 0 24px ${theme.glow}` }}
              >
                <span className="text-2xl">{occasion?.emoji ?? '💗'}</span>
              </div>
            </div>
            <span className="absolute -bottom-9 left-1/2 -translate-x-1/2 text-sm text-muted whitespace-nowrap">
              Tap to open 💌
            </span>
          </motion.button>
        ) : (
          // ---- The opened card ----
          <motion.div
            onPointerMove={onPointer}
            onPointerLeave={resetTilt}
            initial={{ rotateY: -120, opacity: 0, y: 30 }}
            animate={{ rotateY: 0, opacity: 1, y: 0 }}
            transition={{ type: 'spring', ...theme.spring }}
            className="relative w-full max-w-[360px]"
            style={{ transformStyle: 'preserve-3d', rotateX: rx, rotateY: ry }}
          >
            <div
              ref={cardRef}
              className="relative rounded-[1.8rem] backdrop-blur p-5 overflow-hidden"
              style={{
                background: stock.surface,
                border: `1px solid ${stock.border}`,
                boxShadow: `0 0 30px ${theme.glow}`,
                color: stock.body,
              }}
            >
              <motion.div className="pointer-events-none absolute inset-0 mix-blend-screen" style={{ background: glareBg }} />
              {theme.effect === 'shine' && <ShineSweep />}

              <div className="relative" style={{ transform: 'translateZ(40px)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{occasion?.emoji}</span>
                  <span className="text-xs" style={{ color: stock.muted }}>
                    {occasion?.title}
                  </span>
                </div>

                {draft.photos.length > 0 && (
                  <div className={`mt-4 grid gap-2 ${draft.photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {draft.photos.map((p, i) => (
                      <img
                        key={p.id}
                        src={p.url}
                        alt=""
                        className={`w-full rounded-xl object-cover ${
                          draft.photos.length === 3 && i === 0 ? 'col-span-2 h-40' : 'h-32'
                        }`}
                      />
                    ))}
                  </div>
                )}

                <p className="mt-4 text-lg font-bold" style={gradText}>
                  Dear {draft.name},
                </p>
                <p className="mt-2 leading-relaxed whitespace-pre-wrap">{draft.message}</p>

                {draft.from && (
                  <div className="mt-4">
                    <p className="text-sm italic" style={{ color: stock.muted }}>
                      {signOff(draft.occasion, draft.recipient)}
                    </p>
                    <p className="text-lg font-bold" style={gradText}>
                      {draft.from}
                    </p>
                  </div>
                )}

                {draft.voiceUrl && (
                  <div
                    className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2.5"
                    style={{ border: `1px solid ${stock.border}`, background: 'rgba(127,127,127,0.08)' }}
                  >
                    <VolumeUp sx={{ fontSize: 20, color: stock.muted }} />
                    <span className="text-sm" style={{ color: stock.muted }}>
                      Voice note
                    </span>
                    <audio src={draft.voiceUrl} controls className="ml-auto h-8 max-w-[150px]" />
                  </div>
                )}

                <div className="mt-5 flex items-center justify-center gap-1.5 text-xs" style={{ color: stock.muted }}>
                  <FavoriteBorder sx={{ fontSize: 14 }} /> made with Fondly
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Actions — only once the card is open */}
      <div className="relative z-10 px-5 mt-12 mb-10 space-y-3">
        {opened && (
          <>
            {!sharedView && (
              <Button
                fullWidth
                onClick={share}
                disabled={publishing}
                startIcon={<Share />}
                className="!text-white !py-3.5 !font-bold !rounded-2xl"
                style={{ background: theme.cta, boxShadow: `0 0 24px ${theme.glow}` }}
              >
                {publishing ? 'Preparing your link…' : 'Share this card'}
              </Button>
            )}

            <Button
              fullWidth
              onClick={saveImage}
              disabled={saving}
              startIcon={<Download />}
              variant={sharedView ? 'contained' : 'outlined'}
              className={sharedView ? '!text-white !py-3.5 !font-bold !rounded-2xl' : '!rounded-2xl !border-line !text-white !py-3'}
              style={sharedView ? { background: theme.cta, boxShadow: `0 0 24px ${theme.glow}` } : undefined}
            >
              {saving ? 'Saving…' : 'Save as image'}
            </Button>

            <Button
              fullWidth
              onClick={reset}
              startIcon={sharedView ? <AutoAwesome /> : <Replay />}
              variant="outlined"
              className="!rounded-2xl !border-line !text-white !py-3"
            >
              {sharedView ? 'Create your own card free' : 'Make another'}
            </Button>
          </>
        )}
      </div>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast('')}
        message={toast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </div>
  );
}
