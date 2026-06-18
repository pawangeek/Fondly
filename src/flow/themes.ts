import type { OccasionId, RecipientId, StockId } from './types';

export type RevealEffect = 'confetti' | 'shine' | 'soft' | 'sparkle' | 'hearts';

export interface OccasionTheme {
  // gradient used for accents, CTAs, the wax seal and "Dear {name}" text
  cta: string;
  glow: string; // rgba/hsla used for the pink-style glow shadow
  seal: string; // wax-seal background
  effect: RevealEffect;
  particles: { emojis: string[]; count: number };
  spring: { stiffness: number; damping: number }; // flip-in motion mood
}

// Each occasion gets its own palette + motion mood so the card *feels* like
// the moment it is for — festive birthday, gentle apology, gilded congrats.
export const OCCASION_THEMES: Record<OccasionId, OccasionTheme> = {
  feelgood: {
    cta: 'linear-gradient(95deg, hsl(45 95% 60%), hsl(328 86% 62%))',
    glow: 'hsl(45 95% 58% / 0.45)',
    seal: 'linear-gradient(135deg, hsl(45 95% 60%), hsl(328 86% 60%))',
    effect: 'sparkle',
    particles: { emojis: ['🌟', '✨', '💫', '💛'], count: 12 },
    spring: { stiffness: 60, damping: 13 },
  },
  sorry: {
    cta: 'linear-gradient(95deg, hsl(255 45% 64%), hsl(330 38% 62%))',
    glow: 'hsl(255 50% 62% / 0.4)',
    seal: 'linear-gradient(135deg, hsl(255 45% 64%), hsl(330 38% 60%))',
    effect: 'soft',
    particles: { emojis: ['🤍', '🕊️'], count: 6 },
    spring: { stiffness: 42, damping: 17 }, // slower, gentler open
  },
  birthday: {
    cta: 'linear-gradient(95deg, hsl(328 86% 60%), hsl(45 95% 58%), hsl(190 90% 55%))',
    glow: 'hsl(328 86% 60% / 0.5)',
    seal: 'linear-gradient(135deg, hsl(328 86% 60%), hsl(45 95% 58%))',
    effect: 'confetti',
    particles: { emojis: ['🎉', '🎂', '✨', '💕'], count: 14 },
    spring: { stiffness: 82, damping: 11 }, // bouncy, festive
  },
  congrats: {
    cta: 'linear-gradient(95deg, hsl(45 92% 56%), hsl(38 92% 50%), hsl(28 95% 53%))',
    glow: 'hsl(42 92% 55% / 0.5)',
    seal: 'linear-gradient(135deg, hsl(48 95% 62%), hsl(32 92% 52%))',
    effect: 'shine', // gilded foil sweep
    particles: { emojis: ['🏆', '🎉', '⭐', '✨'], count: 12 },
    spring: { stiffness: 66, damping: 13 },
  },
  thankyou: {
    cta: 'linear-gradient(95deg, hsl(12 80% 58%), hsl(340 68% 60%), hsl(150 38% 55%))',
    glow: 'hsl(340 68% 60% / 0.42)',
    seal: 'linear-gradient(135deg, hsl(12 80% 58%), hsl(340 68% 60%))',
    effect: 'hearts',
    particles: { emojis: ['🙏', '💛', '🌸', '🤍'], count: 12 },
    spring: { stiffness: 54, damping: 14 },
  },
};

export interface CardStock {
  id: StockId;
  label: string;
  swatch: string; // small preview background
  surface: string; // card background
  body: string; // body text color
  muted: string; // secondary text color
  border: string;
}

// Selectable "paper" the card is printed on.
export const CARD_STOCKS: CardStock[] = [
  {
    id: 'midnight',
    label: 'Midnight',
    swatch: 'linear-gradient(160deg, hsl(280 40% 14%), hsl(280 45% 7%))',
    surface: 'hsl(280 40% 9% / 0.92)',
    body: 'hsl(0 0% 96%)',
    muted: 'hsl(280 20% 62%)',
    border: 'rgba(255,255,255,0.10)',
  },
  {
    id: 'ivory',
    label: 'Ivory',
    swatch: 'linear-gradient(160deg, #fdfbf7, #efe6d6)',
    surface: 'linear-gradient(160deg, #fdfbf7, #f1e9da)',
    body: '#2c2533',
    muted: '#8b8194',
    border: 'rgba(0,0,0,0.08)',
  },
  {
    id: 'blush',
    label: 'Blush',
    swatch: 'linear-gradient(160deg, #fff1f6, #ffdbe9)',
    surface: 'linear-gradient(160deg, #fff1f6, #ffdfeb)',
    body: '#4a2436',
    muted: '#b07089',
    border: 'rgba(0,0,0,0.06)',
  },
  {
    id: 'foil',
    label: 'Gold foil',
    swatch:
      'radial-gradient(circle at 25% 30%, hsl(45 90% 62% / .45), transparent 30%), radial-gradient(circle at 75% 70%, hsl(45 90% 62% / .35), transparent 30%), hsl(280 45% 8%)',
    surface:
      'radial-gradient(circle at 18% 22%, hsl(45 90% 60% / .16), transparent 22%), radial-gradient(circle at 82% 30%, hsl(45 90% 60% / .12), transparent 20%), radial-gradient(circle at 60% 80%, hsl(45 90% 60% / .14), transparent 24%), linear-gradient(160deg, hsl(280 42% 11%), hsl(280 48% 6%))',
    body: 'hsl(45 30% 93%)',
    muted: 'hsl(45 18% 66%)',
    border: 'hsl(45 60% 52% / 0.32)',
  },
];

export function getStock(id: StockId): CardStock {
  return CARD_STOCKS.find((s) => s.id === id) ?? CARD_STOCKS[0];
}

// A signed sign-off, chosen by who the card is for and the occasion's tone.
export function signOff(occasion: OccasionId | undefined, recipient: RecipientId | undefined): string {
  if (occasion === 'sorry') {
    if (recipient === 'partner' || recipient === 'spouse') return 'With all my heart,';
    if (recipient === 'friend') return 'Your friend, always,';
    return 'Truly sorry,';
  }
  if (occasion === 'thankyou') return 'With gratitude,';
  if (occasion === 'congrats') return 'So proud of you,';

  switch (recipient) {
    case 'partner':
      return 'All my love,';
    case 'spouse':
      return 'Forever yours,';
    case 'friend':
      return 'Love always,';
    case 'date':
      return 'Fondly,';
    default:
      return 'With love,';
  }
}
