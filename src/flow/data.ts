import type { Occasion, Recipient, OccasionId, RecipientId } from './types';

export const OCCASIONS: Occasion[] = [
  { id: 'feelgood', emoji: '🌟', title: 'Feel Good', subtitle: 'No occasion needed — just because' },
  { id: 'sorry', emoji: '💔', title: 'Sorry', subtitle: 'Skip the awkward text. Send a moment' },
  { id: 'birthday', emoji: '🎂', title: 'Birthday', subtitle: 'Make their whole day stop and smile' },
  { id: 'congrats', emoji: '🏆', title: 'Congrats!', subtitle: 'Their big win deserves a moment' },
  { id: 'thankyou', emoji: '🙏', title: 'Thank You', subtitle: "Real gratitude, not just 'tysm'" },
];

export const RECIPIENTS: Recipient[] = [
  { id: 'friend', emoji: '👯', title: 'Friend', subtitle: 'Close friend' },
  { id: 'partner', emoji: '💑', title: 'Partner', subtitle: 'Girlfriend / Boyfriend' },
  { id: 'spouse', emoji: '💍', title: 'Spouse', subtitle: 'Wife / Husband' },
  { id: 'date', emoji: '🦋', title: 'Date', subtitle: 'First date or crush' },
];

// Warm, original message templates. {name} is interpolated when present.
const TEMPLATES: Record<OccasionId, Record<RecipientId, string>> = {
  feelgood: {
    friend:
      "Hey {name} — no reason for this, just wanted you to know the world feels lighter with you in it. Thanks for being my person. 💛",
    partner:
      "{name}, somewhere between the small mornings and the loud laughs, you became my favourite part of every day. Just a little reminder that I'm crazy about you. 💕",
    spouse:
      "{name}, after everything we've built, I still catch myself grateful it's you beside me. No occasion — just a heart that wanted to say it out loud. ❤️",
    date:
      "{name}, I keep smiling at my phone for no reason and it's pretty much your fault. Just wanted you to know you've been on my mind. ✨",
  },
  sorry: {
    friend:
      "{name}, I got it wrong and I know it. You matter more to me than being right ever could. I'm sorry — and I'm not going anywhere. 🤍",
    partner:
      "{name}, I've been replaying it and I just want to make it right. I'm sorry. You deserve the softest version of me, and I'm going to be better. 💗",
    spouse:
      "{name}, I'd choose us over my pride every single time. I'm sorry for the hurt — let's find our way back, like we always do. ❤️",
    date:
      "{name}, I think I came across wrong and it's been bugging me. I'm sorry. I'd really like a do-over if you'll let me. 🌸",
  },
  birthday: {
    friend:
      "Happy birthday, {name}! 🎉 Another year of you being ridiculously good to the people around you. The world got luckier the day you showed up. Go celebrate loud.",
    partner:
      "Happy birthday, {name}! 🥳 Getting to love you is the best plan I never planned. Today the whole world should slow down for you — I know I will. 💕",
    spouse:
      "Happy birthday to my favourite everything, {name}. ❤️ Every year with you is the gift; I just get to add candles. Here's to all the ones still coming.",
    date:
      "Happy birthday, {name}! 🎂 We're early in this story, but I already love that I get to wish you a day as bright as you are. Make a wish — I'm rooting for it. ✨",
  },
  congrats: {
    friend:
      "{name}, you did it!! 🏆 I've watched you work for this and you earned every bit of it. So proud of you — first round's on me.",
    partner:
      "Congratulations, {name}! 💕 Getting to watch you chase something and actually catch it is my favourite kind of beautiful. I'll be cheering loudest, always.",
    spouse:
      "Congratulations, {name}! 🎉 I've seen the late nights nobody else saw. This win is yours, all of it, and I couldn't be prouder to stand next to you.",
    date:
      "Congrats, {name}! 🌟 I haven't known you long, but I already know this is a big deal and you nailed it. We should celebrate — soon. 🥂",
  },
  thankyou: {
    friend:
      "{name}, thank you — really. You showed up when it counted and I won't forget it. Lucky doesn't begin to cover having you as a friend. 🤍",
    partner:
      "{name}, thank you for the soft landings and the steady hands. You make loving easy. I notice everything you do, and I'm so grateful it's you. 💗",
    spouse:
      "{name}, thank you for choosing this life with me, again and again. The big things and the boring Tuesdays — I'm grateful for all of it, and for you. ❤️",
    date:
      "{name}, thank you for the good time and the better company. You made an ordinary day worth remembering — and I'd love to do it again. ✨",
  },
};

export function buildMessage(
  occasion: OccasionId,
  recipient: RecipientId,
  name: string,
): string {
  const tpl = TEMPLATES[occasion][recipient];
  const safe = name.trim();
  return safe ? tpl.replaceAll('{name}', safe) : tpl.replaceAll('{name}', 'there');
}

export const MAX_MESSAGE = 300;
export const MAX_PHOTOS = 3;
export const MAX_PHOTO_MB = 5;
export const MAX_VOICE_SEC = 60;
