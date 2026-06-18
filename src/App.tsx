import { AnimatePresence, motion } from 'framer-motion';
import PhoneFrame from './components/PhoneFrame';
import Landing from './components/Landing';
import OccasionStep from './components/OccasionStep';
import RecipientStep from './components/RecipientStep';
import DetailsStep from './components/DetailsStep';
import CardReveal from './components/CardReveal';
import { useFlow } from './flow/FlowContext';

const SCREENS = {
  landing: Landing,
  occasion: OccasionStep,
  recipient: RecipientStep,
  details: DetailsStep,
  reveal: CardReveal,
} as const;

function CardLoading() {
  return (
    <div className="app-bg min-h-full flex flex-col items-center justify-center gap-5">
      <span className="text-5xl animate-floaty">💌</span>
      <p className="text-muted text-sm">Unsealing your card…</p>
    </div>
  );
}

export default function App() {
  const { step, loadingCard } = useFlow();
  const Screen = SCREENS[step];

  return (
    <PhoneFrame>
      <AnimatePresence mode="wait">
        {loadingCard ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-full">
            <CardLoading />
          </motion.div>
        ) : (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="min-h-full"
          >
            <Screen />
          </motion.div>
        )}
      </AnimatePresence>
    </PhoneFrame>
  );
}
