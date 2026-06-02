import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-overlay lg:hidden"
          />

          {/* Drawer — explicit width, close button lives INSIDE so it can never
              leak outside the panel (which caused the stray X at the top-left). */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 left-0 z-modal lg:hidden w-[260px] max-w-[82vw] overflow-hidden"
          >
            <Sidebar collapsed={false} onToggle={onClose} hideToggle />

            {/* Close button — inside the drawer, top-right corner */}
            <button
              onClick={onClose}
              aria-label="Close menu"
              className="absolute top-3.5 right-3 z-10 w-8 h-8 rounded-lg flex items-center justify-center text-sidebar-muted hover:text-white hover:bg-sidebar-accent transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
