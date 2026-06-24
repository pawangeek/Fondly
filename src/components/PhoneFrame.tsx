import type { ReactNode } from 'react';

// A centered phone-shaped viewport so the experience reads like the mobile app
// on desktop, and goes edge-to-edge on real phones.
export default function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="app-bg min-h-screen w-full flex items-center justify-center sm:p-6">
      <div
        className="relative w-full max-w-[430px] h-screen sm:h-[900px] sm:max-h-[92vh] overflow-hidden
                   bg-ink sm:rounded-[2.4rem] sm:border sm:border-line/70
                   sm:shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
      >
        <div className="h-full overflow-y-auto no-scrollbar overscroll-contain">
          {children}
          <footer className="px-5 pb-8 pt-4 text-center text-xs text-muted">
            Made with <span className="text-primary">♥</span> by Pawan
          </footer>
        </div>
      </div>
    </div>
  );
}
