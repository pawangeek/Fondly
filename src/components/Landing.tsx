import { Button } from '@mui/material';
import { useFlow } from '../flow/FlowContext';

const STEPS = [
  { n: '01', title: 'Pick who it’s for', body: 'Partner, friend, spouse or a date. Tell us the relationship.' },
  { n: '02', title: 'Choose an occasion', body: 'Birthday, sorry, thank you — or just because.' },
  { n: '03', title: 'Your card is ready', body: 'We craft a heartfelt message, add your photos & a voice note.' },
];

export default function Landing() {
  const { go, linkError, clearLinkError } = useFlow();

  return (
    <div className="app-bg min-h-full">
      {/* Top brand bar */}
      <div className="flex items-center gap-2 px-5 pt-5">
        <span className="text-xl">💌</span>
        <span className="font-semibold tracking-tight">Fondly</span>
      </div>

      {linkError && (
        <div className="mx-5 mt-4 flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-3 animate-pop">
          <span className="text-lg">💔</span>
          <div className="flex-1">
            <p className="text-sm font-semibold">This card link looks broken</p>
            <p className="text-xs text-muted mt-0.5">
              It may be incomplete or from an older version. Why not make a fresh one?
            </p>
          </div>
          <button onClick={clearLinkError} className="text-muted hover:text-white text-sm" aria-label="Dismiss">
            ✕
          </button>
        </div>
      )}

      {/* Hero */}
      <div className="px-5 pt-16 text-center">
        <span className="text-5xl animate-floaty inline-block">💌</span>
        <h1 className="mt-6 text-[2.7rem] leading-[1.05] font-extrabold tracking-tight">
          Send love
          <br />
          <span className="gradient-text">in a card.</span>
        </h1>
        <p className="mt-3 text-muted text-sm">
          Pick who it’s for · We write it · You share
        </p>
      </div>

      {/* CTA */}
      <div className="px-5 mt-10">
        <Button
          fullWidth
          onClick={() => go('occasion')}
          className="!cta-gradient !text-white !py-3.5 !text-base !font-bold !rounded-2xl !shadow-glow-pink animate-shimmer"
          sx={{ background: 'none' }}
        >
          Send a card free 💌
        </Button>
      </div>

      {/* How it works */}
      <div className="px-5 mt-12">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-muted mb-5">How it works</p>
        <div className="space-y-3">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="flex items-start gap-4 rounded-2xl border border-line bg-surface/60 p-4"
            >
              <span className="text-2xl font-black gradient-text leading-none">{s.n}</span>
              <div>
                <p className="font-semibold">{s.title}</p>
                <p className="text-sm text-muted mt-0.5">{s.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mt-12 mb-10 text-center">
        <Button
          onClick={() => go('occasion')}
          variant="outlined"
          className="!rounded-2xl !border-line !text-white !py-3 !px-8"
        >
          Make your card →
        </Button>
      </div>
    </div>
  );
}
