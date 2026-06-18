export type OccasionId = 'feelgood' | 'sorry' | 'birthday' | 'congrats' | 'thankyou';
export type RecipientId = 'friend' | 'partner' | 'spouse' | 'date';
export type StockId = 'midnight' | 'ivory' | 'blush' | 'foil';

export interface Occasion {
  id: OccasionId;
  emoji: string;
  title: string;
  subtitle: string;
}

export interface Recipient {
  id: RecipientId;
  emoji: string;
  title: string;
  subtitle: string;
}

export interface PhotoItem {
  id: string;
  url: string;
  name: string;
}

export interface CardDraft {
  occasion?: OccasionId;
  recipient?: RecipientId;
  name: string;
  message: string;
  from: string;
  stock: StockId;
  photos: PhotoItem[];
  voiceUrl?: string;
  voiceDuration?: number;
}

export type Step = 'landing' | 'occasion' | 'recipient' | 'details' | 'reveal';
