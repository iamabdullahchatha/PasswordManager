import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Sidebar } from './Sidebar';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

// ─── Why CSS transitions instead of framer-motion here ───────────────────────
//
// The previous implementation used framer-motion's AnimatePresence +
// onAnimationStart callbacks to imperatively toggle pointer-events on the
// backdrop and drawer refs.  On mobile (especially iOS Safari) those callbacks
// can fire late, fire out-of-order, or be skipped entirely when animations are
// interrupted (e.g. user taps open → immediately taps a link → taps hamburger
// again before the exit animation finishes).  The result: pointer-events:'none'
// gets stuck on the backdrop/drawer — the drawer appears open and animates
// correctly but every tap inside it falls through, making it completely broken.
//
// The CSS-transition approach below ties pointer-events directly to the `open`
// React prop.  Because React state is the single source of truth, pointer-events
// can never become desynchronised from the visible state — they are always
// correct on the very next render.
// ─────────────────────────────────────────────────────────────────────────────

export function MobileNav({ open, onClose }: MobileNavProps) {
  return (
    <>
      {/* ── Backdrop ─────────────────────────────────────────────────────── */}
      {/* Always in the DOM; toggled via opacity + pointer-events.
          Using aria-hidden keeps it invisible to screen readers when closed. */}
      <div
        aria-hidden={!open}
        onClick={open ? onClose : undefined}
        className={cn(
          'fixed inset-0 z-overlay lg:hidden',
          'bg-black/60 backdrop-blur-sm',
          'transition-opacity duration-200 ease-out',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
      />

      {/* ── Drawer ───────────────────────────────────────────────────────── */}
      {/* Slides in/out with a CSS translateX transition.
          pointer-events is an inline style (not a class) so it takes
          precedence over anything in the stylesheet and is guaranteed to
          match the open state on every render. */}
      <div
        aria-hidden={!open}
        style={{ pointerEvents: open ? 'auto' : 'none' }}
        className={cn(
          'fixed inset-y-0 left-0 z-modal lg:hidden',
          'w-[260px] max-w-[82vw] overflow-hidden',
          'transition-transform duration-200 ease-out will-change-transform',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <Sidebar collapsed={false} onToggle={onClose} hideToggle />

        {/* Close button inside the drawer — top-right corner */}
        <button
          onClick={onClose}
          aria-label="Close menu"
          tabIndex={open ? 0 : -1}
          className="absolute top-3.5 right-3 z-10 w-8 h-8 rounded-lg flex items-center justify-center text-sidebar-muted hover:text-white hover:bg-sidebar-accent transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </>
  );
}
