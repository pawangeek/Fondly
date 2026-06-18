import { useEffect, useRef, useState } from 'react';
import { Mic, Stop, Delete, PlayArrow, Pause, MicOff } from '@mui/icons-material';
import { useFlow } from '../flow/FlowContext';
import { MAX_VOICE_SEC } from '../flow/data';

type State = 'idle' | 'recording' | 'recorded';

const SUPPORTED =
  typeof navigator !== 'undefined' &&
  !!navigator.mediaDevices?.getUserMedia &&
  typeof window !== 'undefined' &&
  'MediaRecorder' in window;

function pickMime(): string | undefined {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
  for (const t of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) return t;
  }
  return undefined;
}

const fmt = (s: number) => `0:${String(Math.floor(s)).padStart(2, '0')}`;

export default function VoiceRecorder() {
  const { draft, setVoice } = useFlow();
  const [state, setState] = useState<State>(draft.voiceUrl ? 'recorded' : 'idle');
  const [elapsed, setElapsed] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0); // playback position in seconds
  const [error, setError] = useState('');

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const elapsedRef = useRef(0); // latest elapsed, for the recorder.onstop closure

  // waveform
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);

  const total = draft.voiceDuration || elapsed || 1;

  const teardown = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    timerRef.current = null;
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') void audioCtxRef.current.close();
    audioCtxRef.current = null;
  };

  useEffect(() => () => teardown(), []);

  const drawWave = (analyser: AnalyserNode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const buf = new Uint8Array(analyser.frequencyBinCount);

    const render = () => {
      analyser.getByteTimeDomainData(buf);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      const bars = 40;
      const step = Math.floor(buf.length / bars);
      const bw = width / bars;
      for (let i = 0; i < bars; i++) {
        const v = Math.abs(buf[i * step] - 128) / 128; // 0..1
        const h = Math.max(2, v * height);
        ctx.fillStyle = 'hsl(45 95% 58%)';
        ctx.fillRect(i * bw + bw * 0.2, (height - h) / 2, bw * 0.6, h);
      }
      rafRef.current = requestAnimationFrame(render);
    };
    render();
  };

  const start = async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // waveform analyser
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const actx = new AudioCtx();
      audioCtxRef.current = actx;
      const source = actx.createMediaStreamSource(stream);
      const analyser = actx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      drawWave(analyser);

      const mimeType = pickMime();
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      rec.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data);
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        setVoice(URL.createObjectURL(blob), elapsedRef.current);
        setState('recorded');
        teardown();
      };
      rec.start();
      recorderRef.current = rec;
      setElapsed(0);
      elapsedRef.current = 0;
      setState('recording');
      timerRef.current = window.setInterval(() => {
        setElapsed((e) => {
          const n = e + 1;
          elapsedRef.current = n;
          if (n >= MAX_VOICE_SEC) {
            stop();
            return MAX_VOICE_SEC;
          }
          return n;
        });
      }, 1000);
    } catch (err) {
      teardown();
      const name = (err as DOMException)?.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setError('Microphone access was blocked. Allow it in your browser settings, or skip — it’s optional.');
      } else if (name === 'NotFoundError') {
        setError('No microphone found. You can skip this — it’s optional.');
      } else {
        setError('Couldn’t start recording. You can skip this — it’s optional.');
      }
    }
  };

  const stop = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop();
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  const discard = () => {
    if (draft.voiceUrl) URL.revokeObjectURL(draft.voiceUrl);
    setVoice(undefined, undefined);
    setState('idle');
    setElapsed(0);
    setPos(0);
    setPlaying(false);
  };

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.pause();
    else void a.play();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a) return;
    const r = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    a.currentTime = ratio * total;
    setPos(ratio * total);
  };

  if (!SUPPORTED) {
    return (
      <div className="rounded-2xl border border-line bg-surface/60 p-4">
        <p className="font-semibold flex items-center gap-2">
          🎙️ Add a voice note <span className="text-xs text-muted font-normal ml-auto">Optional</span>
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted">
          <MicOff sx={{ fontSize: 18 }} /> Voice notes aren’t supported on this browser.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-surface/60 p-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold flex items-center gap-2">🎙️ Add a voice note</p>
        <span className="text-xs text-muted">Optional</span>
      </div>

      <div className="mt-3">
        {state === 'idle' && (
          <button
            onClick={start}
            className="flex items-center gap-2 rounded-xl border border-gold/50 bg-gold/10 text-gold px-4 py-2.5 font-semibold hover:bg-gold/20 transition-colors"
          >
            <Mic sx={{ fontSize: 18 }} /> Start recording
            <span className="text-xs text-muted font-normal ml-1">Max {MAX_VOICE_SEC}s</span>
          </button>
        )}

        {state === 'recording' && (
          <div className="flex items-center gap-3 rounded-xl border border-primary/60 bg-primary/15 px-3 py-2.5">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
            </span>
            <span className="tabular-nums text-sm shrink-0">{fmt(elapsed)}</span>
            <canvas ref={canvasRef} width={160} height={32} className="flex-1 h-8" />
            <button onClick={stop} className="flex items-center gap-1 font-semibold shrink-0" aria-label="Stop recording">
              <Stop sx={{ fontSize: 20 }} /> Stop
            </button>
          </div>
        )}

        {state === 'recorded' && draft.voiceUrl && (
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/70 px-3 py-2.5">
            <button
              onClick={togglePlay}
              className="grid place-items-center h-9 w-9 rounded-full cta-gradient text-white shrink-0"
              aria-label={playing ? 'Pause' : 'Play voice note'}
            >
              {playing ? <Pause sx={{ fontSize: 20 }} /> : <PlayArrow sx={{ fontSize: 20 }} />}
            </button>
            <span className="text-xs text-muted tabular-nums shrink-0 w-8">{fmt(pos)}</span>
            <div className="flex-1 h-2 rounded-full bg-line overflow-hidden cursor-pointer" onClick={seek}>
              <div className="h-full cta-gradient" style={{ width: `${Math.min(100, (pos / total) * 100)}%` }} />
            </div>
            <span className="text-xs text-muted tabular-nums shrink-0 w-8">{fmt(total)}</span>
            <button onClick={discard} className="text-muted hover:text-white shrink-0" aria-label="Delete voice note">
              <Delete sx={{ fontSize: 18 }} />
            </button>
            <audio
              ref={audioRef}
              src={draft.voiceUrl}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => {
                setPlaying(false);
                setPos(0);
              }}
              onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
              hidden
            />
          </div>
        )}

        {error && <p className="mt-2 text-xs text-primary">{error}</p>}
      </div>
    </div>
  );
}
