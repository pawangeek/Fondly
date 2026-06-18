import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { CardDraft, OccasionId, RecipientId, Step, PhotoItem, StockId } from './types';
import { buildMessage } from './data';
import { decodeShare } from './share';
import { getSlugFromPath, fetchCard } from '../lib/api';

interface FlowState {
  step: Step;
  draft: CardDraft;
  sharedView: boolean;
  loadingCard: boolean;
  linkError: boolean;
  clearLinkError: () => void;
  chooseOccasion: (id: OccasionId) => void;
  chooseRecipient: (id: RecipientId) => void;
  setName: (name: string) => void;
  setMessage: (msg: string) => void;
  setFrom: (from: string) => void;
  setStock: (stock: StockId) => void;
  setPhotos: (photos: PhotoItem[]) => void;
  setVoice: (url?: string, duration?: number) => void;
  go: (step: Step) => void;
  back: () => void;
  reset: () => void;
}

const emptyDraft: CardDraft = { name: '', message: '', from: '', stock: 'midnight', photos: [] };

const STORAGE_KEY = 'fondly:draft';

// Only the serialisable, non-blob fields are persisted — photos and the voice
// note are object URLs that don't survive a reload, so they stay session-only.
type Persisted = Pick<CardDraft, 'occasion' | 'recipient' | 'name' | 'message' | 'from' | 'stock'> & {
  step: Step;
};

function loadPersisted(): Persisted | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Persisted;
  } catch {
    return null;
  }
}

const FlowCtx = createContext<FlowState | null>(null);

const ORDER: Step[] = ['landing', 'occasion', 'recipient', 'details', 'reveal'];

export function FlowProvider({ children }: { children: ReactNode }) {
  const hasWindow = typeof window !== 'undefined';
  // A /c/:slug path means a server-published card we need to fetch.
  const slug = hasWindow ? getSlugFromPath() : null;
  // Hash links are the offline fallback; only consult them when there's no slug.
  const shared = !slug && hasWindow ? decodeShare() : null;
  // A #card= token that's present but won't decode is a broken/old link.
  const brokenLink = !slug && !shared && hasWindow && /[#&]card=/.test(window.location.hash);
  const persisted = !slug && !shared && hasWindow ? loadPersisted() : null;

  const initialDraft: CardDraft = shared
    ? shared
    : persisted
      ? {
          ...emptyDraft,
          occasion: persisted.occasion,
          recipient: persisted.recipient,
          name: persisted.name ?? '',
          message: persisted.message ?? '',
          from: persisted.from ?? '',
          stock: persisted.stock ?? 'midnight',
        }
      : emptyDraft;

  const [step, setStep] = useState<Step>(slug || shared ? 'reveal' : (persisted?.step ?? 'landing'));
  const [draft, setDraft] = useState<CardDraft>(initialDraft);
  const [sharedView, setSharedView] = useState(!!shared || !!slug);
  const [loadingCard, setLoadingCard] = useState(!!slug);
  const [linkError, setLinkError] = useState(brokenLink);
  const clearLinkError = useCallback(() => setLinkError(false), []);
  // Tracks whether the user has hand-edited the message, so auto-fill won't clobber it.
  // A restored non-empty message counts as already authored.
  const [messageTouched, setMessageTouched] = useState(!!persisted?.message);

  // Drop a broken #card= hash so a reload lands cleanly on the home screen.
  useEffect(() => {
    if (brokenLink) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch a server-published card when we arrived via /c/:slug.
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    fetchCard(slug)
      .then((card) => {
        if (cancelled) return;
        if (card) {
          setDraft(card);
          setSharedView(true);
          setStep('reveal');
        } else {
          setLinkError(true);
          setSharedView(false);
          setStep('landing');
          history.replaceState(null, '', '/');
        }
      })
      .finally(() => !cancelled && setLoadingCard(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist the text card on every change (never persist a received/shared card).
  useEffect(() => {
    if (sharedView || !hasWindow) return;
    if (step === 'landing' && !draft.name && !draft.occasion) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const payload: Persisted = {
      occasion: draft.occasion,
      recipient: draft.recipient,
      name: draft.name,
      message: draft.message,
      from: draft.from,
      stock: draft.stock,
      step,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* storage full or unavailable — non-fatal */
    }
  }, [draft, step, sharedView, hasWindow]);

  const chooseOccasion = useCallback((id: OccasionId) => {
    setDraft((d) => ({ ...d, occasion: id }));
    setStep('recipient');
  }, []);

  const chooseRecipient = useCallback(
    (id: RecipientId) => {
      setDraft((d) => {
        const next = { ...d, recipient: id };
        if (!messageTouched && d.occasion) {
          next.message = buildMessage(d.occasion, id, d.name);
        }
        return next;
      });
      setStep('details');
    },
    [messageTouched],
  );

  const setName = useCallback(
    (name: string) => {
      setDraft((d) => {
        const next = { ...d, name };
        if (!messageTouched && d.occasion && d.recipient) {
          next.message = buildMessage(d.occasion, d.recipient, name);
        }
        return next;
      });
    },
    [messageTouched],
  );

  const setMessage = useCallback((message: string) => {
    setMessageTouched(true);
    setDraft((d) => ({ ...d, message }));
  }, []);

  const setFrom = useCallback((from: string) => {
    setDraft((d) => ({ ...d, from }));
  }, []);

  const setStock = useCallback((stock: StockId) => {
    setDraft((d) => ({ ...d, stock }));
  }, []);

  const setPhotos = useCallback((photos: PhotoItem[]) => {
    setDraft((d) => ({ ...d, photos }));
  }, []);

  const setVoice = useCallback((voiceUrl?: string, voiceDuration?: number) => {
    setDraft((d) => ({ ...d, voiceUrl, voiceDuration }));
  }, []);

  const go = useCallback((s: Step) => setStep(s), []);

  const back = useCallback(() => {
    setStep((s) => {
      const i = ORDER.indexOf(s);
      return i > 0 ? ORDER[i - 1] : s;
    });
  }, []);

  const reset = useCallback(() => {
    if (window.location.hash || window.location.pathname.startsWith('/c/')) {
      history.replaceState(null, '', '/');
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setDraft(emptyDraft);
    setMessageTouched(false);
    setLinkError(false);
    setSharedView(false);
    setStep('landing');
  }, []);

  const value = useMemo(
    () => ({
      step,
      draft,
      sharedView,
      loadingCard,
      linkError,
      clearLinkError,
      chooseOccasion,
      chooseRecipient,
      setName,
      setMessage,
      setFrom,
      setStock,
      setPhotos,
      setVoice,
      go,
      back,
      reset,
    }),
    [step, draft, sharedView, loadingCard, linkError, clearLinkError, chooseOccasion, chooseRecipient, setName, setMessage, setFrom, setStock, setPhotos, setVoice, go, back, reset],
  );

  return <FlowCtx.Provider value={value}>{children}</FlowCtx.Provider>;
}

export function useFlow() {
  const ctx = useContext(FlowCtx);
  if (!ctx) throw new Error('useFlow must be used within FlowProvider');
  return ctx;
}
