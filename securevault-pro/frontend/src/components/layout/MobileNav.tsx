import { useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

// Named variants so onAnimationStart receives the string "exit" — inline
// animation objects would pass { opacity: 0 } and break the === 'exit' check.
const BACKDROP_V = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
};

const DRAWER_V = {
  initial: { x: '-100%' },
  animate: { x: 0,       transition: { type: 'spring' as const, stiffness: 320, damping: 34 } },
  exit:    { x: '-100%', transition: { type: 'spring' as const, stiffness: 320, damping: 34 } },
};

function NavOverlay({ onClose }: { onClose: () => void }) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const drawerRef   = useRef<HTMLDivElement>(null);

  // Fired with the variant name — "exit" when AnimatePresence removes this tree.
  const onExitStart = (def: string) => {
    if (def !== 'exit') return;
    // Disable pointer-events on both panels immediately so the new page is
    // interactive the instant the exit animation begins.
    if (backdropRef.current) backdropRef.current.style.pointerEvents = 'none';
    if (drawerRef.current)   drawerRef.current.style.pointerEvents   = 'none';
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        ref={backdropRef}
        variants={BACKDROP_V}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={onClose}
        onAnimationStart={onExitStart}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-overlay lg:hidden"
      />

      {/* Drawer */}
      <motion.div
        ref={drawerRef}
        variants={DRAWER_V}
        initial="initial"
        animate="animate"
        exit="exit"
        onAnimationStart={onExitStart}
        className="fixed inset-y-0 left-0 z-modal lg:hidden w-[260px] max-w-[82vw] overflow-hidden"
      >
        <Sidebar collapsed={false} onToggle={onClose} hideToggle />

        <button
          onClick={onClose}
          aria-label="Close menu"
          className="absolute top-3.5 right-3 z-10 w-8 h-8 rounded-lg flex items-center justify-center text-sidebar-muted hover:text-white hover:bg-sidebar-accent transition-colors"
        >
          <X size={16} />
        </button>
      </motion.div>
    </>
  );
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  return (
    <AnimatePresence>
      {open && <NavOverlay key="nav-overlay" onClose={onClose} />}
    </AnimatePresence>
  );
}
