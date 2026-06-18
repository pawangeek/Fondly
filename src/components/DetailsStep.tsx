import { Button, TextField } from '@mui/material';
import StepHeader from './StepHeader';
import PhotoUpload from './PhotoUpload';
import VoiceRecorder from './VoiceRecorder';
import { useFlow } from '../flow/FlowContext';
import { MAX_MESSAGE } from '../flow/data';
import { CARD_STOCKS } from '../flow/themes';

export default function DetailsStep() {
  const { draft, setName, setMessage, setFrom, setStock, go } = useFlow();
  const canGenerate = draft.name.trim().length > 0;

  return (
    <div className="app-bg min-h-full pb-28">
      <StepHeader progress={3} />
      <div className="px-5 pt-6">
        <h2 className="text-3xl font-extrabold text-center">Who’s it for?</h2>
        <p className="text-muted text-center mt-2">We’ll make it feel personal to them ✨</p>

        {/* Name */}
        <div className="mt-7">
          <label className="text-sm font-semibold text-gold flex items-center gap-2">
            👋 Start here — their name
          </label>
          <TextField
            value={draft.name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Rahul, Priya, Aditya…"
            fullWidth
            autoFocus
            sx={{ mt: 1 }}
            inputProps={{ maxLength: 40 }}
          />
        </div>

        {/* Message */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold">
              Message <span className="text-muted font-normal">(optional — edit to personalise)</span>
            </label>
            <span className={`text-xs ${draft.message.length > MAX_MESSAGE ? 'text-primary' : 'text-muted'}`}>
              {draft.message.length}/{MAX_MESSAGE}
            </span>
          </div>
          <TextField
            value={draft.message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
            placeholder="Pick an occasion and we’ll draft something — or write your own."
            fullWidth
            multiline
            minRows={4}
            sx={{ mt: 1 }}
          />
        </div>

        {/* Signature */}
        <div className="mt-5">
          <label className="text-sm font-semibold flex items-center gap-2">
            ✍️ Sign it <span className="text-muted font-normal">— your name (optional)</span>
          </label>
          <TextField
            value={draft.from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="e.g. Aman"
            fullWidth
            sx={{ mt: 1 }}
            inputProps={{ maxLength: 40 }}
          />
        </div>

        {/* Card stock */}
        <div className="mt-5">
          <label className="text-sm font-semibold flex items-center gap-2">
            🎨 Card stock <span className="text-muted font-normal">— pick the paper</span>
          </label>
          <div className="mt-2 grid grid-cols-4 gap-2.5">
            {CARD_STOCKS.map((s) => {
              const on = draft.stock === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setStock(s.id)}
                  className={`rounded-xl p-1 transition-all ${on ? 'ring-2 ring-gold scale-[0.97]' : 'ring-1 ring-line'}`}
                  aria-label={`Card stock ${s.label}`}
                  aria-pressed={on}
                >
                  <span className="block h-12 w-full rounded-lg border border-white/10" style={{ background: s.swatch }} />
                  <span className={`block mt-1 text-[10px] ${on ? 'text-gold' : 'text-muted'}`}>{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Photos */}
        <div className="mt-5">
          <PhotoUpload />
        </div>

        {/* Voice */}
        <div className="mt-4">
          <VoiceRecorder />
        </div>
      </div>

      {/* Sticky generate bar */}
      <div className="fixed sm:absolute bottom-0 inset-x-0 px-5 pt-4 pb-6 bg-gradient-to-t from-ink via-ink/95 to-transparent">
        <div className="mx-auto max-w-[430px]">
          <Button
            fullWidth
            disabled={!canGenerate}
            onClick={() => go('reveal')}
            className={`!py-3.5 !text-base !font-bold !rounded-2xl ${
              canGenerate ? '!cta-gradient !text-white !shadow-glow-pink' : '!bg-line !text-muted'
            }`}
            sx={{ background: canGenerate ? undefined : 'none' }}
          >
            Generate my card 💌
          </Button>
          {!canGenerate && (
            <p className="mt-2 text-center text-xs text-muted">Add their name to continue</p>
          )}
        </div>
      </div>
    </div>
  );
}
