import { useState } from 'react';
import StepHeader from './StepHeader';
import { OCCASIONS } from '../flow/data';
import { useFlow } from '../flow/FlowContext';
import type { OccasionId } from '../flow/types';

export default function OccasionStep() {
  const { chooseOccasion, draft } = useFlow();
  const [selected, setSelected] = useState<OccasionId | undefined>(draft.occasion);

  const pick = (id: OccasionId) => {
    setSelected(id);
    // brief highlight before advancing, matching the source's selected-glow feel
    window.setTimeout(() => chooseOccasion(id), 180);
  };

  return (
    <div className="app-bg min-h-full pb-10">
      <StepHeader progress={1} />
      <div className="px-5 pt-6">
        <h2 className="text-3xl font-extrabold text-center">What’s the occasion?</h2>
        <p className="text-muted text-center mt-2">Pick the vibe for your card</p>

        <div className="mt-7 space-y-3">
          {OCCASIONS.map((o) => {
            const on = selected === o.id;
            return (
              <button
                key={o.id}
                onClick={() => pick(o.id)}
                className={`w-full flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200
                  ${
                    on
                      ? 'border-gold bg-gold/10 shadow-glow scale-[0.99]'
                      : 'border-line bg-surface/60 hover:border-line/80 hover:bg-surface-2/70'
                  }`}
              >
                <span className="text-3xl leading-none">{o.emoji}</span>
                <div>
                  <p className="font-semibold text-lg">{o.title}</p>
                  <p className="text-sm text-muted mt-0.5">{o.subtitle}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
