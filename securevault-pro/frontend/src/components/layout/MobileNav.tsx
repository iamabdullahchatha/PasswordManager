import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { useState } from 'react';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const [collapsed] = useState(false);

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-sidebar lg:hidden"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-y-0 left-0 z-overlay lg:hidden flex"
          >
            <div className="relative h-full">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 -right-10 z-10 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X size={15} />
              </button>
              <Sidebar collapsed={collapsed} onToggle={onClose} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
