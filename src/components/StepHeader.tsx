import { ArrowBackIosNew } from '@mui/icons-material';
import { useFlow } from '../flow/FlowContext';

// Top bar: back chevron, "✨ Create 3D Card" label, and amber progress pills.
export default function StepHeader({ progress }: { progress: number }) {
  const { back } = useFlow();
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between px-4 pt-4 pb-3 bg-ink/80 backdrop-blur-md">
      <button
        onClick={back}
        className="flex items-center gap-1 text-sm text-muted hover:text-white transition-colors"
        aria-label="Go back"
      >
        <ArrowBackIosNew sx={{ fontSize: 14 }} />
        Back
      </button>

      <div className="flex items-center gap-1.5 text-sm font-semibold">
        <span className="text-gold">✨</span>
        <span className="gradient-text">Create 3D Card</span>
      </div>

      <div className="flex items-center gap-1">
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i <= progress ? 'w-6 bg-gold shadow-[0_0_8px_hsl(45_95%_58%/0.7)]' : 'w-3 bg-line'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
