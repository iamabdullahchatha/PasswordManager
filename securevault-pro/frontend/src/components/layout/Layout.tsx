import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';

// IMPORTANT: Only opacity — no y/x/scale transforms.
// Any CSS transform (including translateY(0)) creates a new "containing block"
// for position:fixed descendants. That breaks modal/overlay positioning on iOS
// because fixed children become positioned relative to this wrapper instead of
// the viewport, and get clipped by the overflow-y:auto scroll container.
const PAGE_VARIANTS = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
};

// Disable pointer-events the instant the exit animation starts so that any
// open modals or overlays on the leaving page cannot intercept touches on the
// incoming page.  We use a ref + onAnimationStart instead of usePresence()
// to avoid the double-registration pitfall (usePresence() + a child motion.div
// both registering with the same AnimatePresence context can deadlock mode="wait"
// — the new page never mounts).
function PageWrapper({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <motion.div
      ref={ref}
      variants={PAGE_VARIANTS}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
      className="min-h-full"
      onAnimationStart={(def) => {
        if (def === 'exit' && ref.current) {
          ref.current.style.pointerEvents = 'none';
        }
      }}
      onAnimationComplete={(def) => {
        // Restore pointer-events after the enter animation so the page is always
        // fully interactive once it has settled (safety net for quick navigation).
        if (def === 'animate' && ref.current) {
          ref.current.style.pointerEvents = '';
        }
      }}
    >
      {children}
    </motion.div>
  );
}

export function Layout() {
  useInactivityLogout();

  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1280px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setSidebarCollapsed(e.matches);
    handler(mq);
    mq.addEventListener('change', handler as (e: MediaQueryListEvent) => void);
    return () => mq.removeEventListener('change', handler as (e: MediaQueryListEvent) => void);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    // Safety net: clear any scroll lock a modal on the previous page left behind.
    document.body.style.overflow = '';
  }, [location.pathname]);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden lg:flex flex-shrink-0 h-full">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMobileMenuToggle={() => setMobileOpen(true)} sidebarCollapsed={sidebarCollapsed} />

        {/* overscroll-y-contain prevents iOS rubber-band scroll from propagating
            up to the body, which can temporarily lock the page on mobile. */}
        <main className="flex-1 overflow-y-auto overscroll-y-contain bg-background">
          <AnimatePresence mode="wait">
            <PageWrapper key={location.pathname}>
              <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-full">
                <Outlet />
              </div>
            </PageWrapper>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
