import { useState } from 'react';
import StepHeader from './StepHeader';
import { RECIPIENTS } from '../flow/data';
import { useFlow } from '../flow/FlowContext';
import type { RecipientId } from '../flow/types';

export default function RecipientStep() {
  const { chooseRecipient, draft } = useFlow();
  const [selected, setSelected] = useState<RecipientId | undefined>(draft.recipient);

  const pick = (id: RecipientId) => {
    setSelected(id);
    window.setTimeout(() => chooseRecipient(id), 180);
  };

  return (
    <div className="app-bg min-h-full pb-10">
      <StepHeader progress={2} />
      <div className="px-5 pt-6">
        <h2 className="text-3xl font-extrabold text-center">Who is it for?</h2>
        <p className="text-muted text-center mt-2">We’ll personalise the message</p>

        <div className="mt-7 grid grid-cols-2 gap-3">
          {RECIPIENTS.map((r) => {
            const on = selected === r.id;
            return (
              <button
                key={r.id}
                onClick={() => pick(r.id)}
                className={`aspect-square rounded-2xl border flex flex-col items-center justify-center gap-2 p-3 transition-all duration-200
                  ${
                    on
                      ? 'border-gold bg-gold/10 shadow-glow scale-[0.98]'
                      : 'border-line bg-surface/60 hover:border-line/80 hover:bg-surface-2/70'
                  }`}
              >
                <span className="text-4xl">{r.emoji}</span>
                <p className="font-semibold text-lg">{r.title}</p>
                <p className="text-xs text-muted">{r.subtitle}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
