import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';

export function Layout() {
  useInactivityLogout();

  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // Collapse sidebar automatically on screens narrower than 1280px
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1280px)');
    const handler = (e: MediaQueryListEvent | MediaQueryList) => setSidebarCollapsed(e.matches);
    handler(mq);
    mq.addEventListener('change', handler as (e: MediaQueryListEvent) => void);
    return () => mq.removeEventListener('change', handler as (e: MediaQueryListEvent) => void);
  }, []);

  // Lock body scroll while mobile nav is open so content behind the
  // drawer cannot scroll.  Cleanup always unlocks on unmount.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  // ─── Global route-change cleanup ───────────────────────────────────────────
  // Runs on every client-side navigation. This is the primary fix for the
  // mobile "page frozen/stuck" bug.
  //
  // ROOT CAUSE: React Router v6 does NOT reset the scroll position of custom
  // scroll containers (our <main> element) on navigation.  If the user scrolled
  // 500 px down on the previous page, the next page also opens at 500 px — the
  // visible viewport shows nothing and the page appears completely frozen.
  // Refreshing the browser resets the scroll to 0, which is why a refresh "fixes"
  // it every time.
  //
  // Additional cleanup guards against scroll locks, stuck overlays, and
  // pointer-events left over from modals or drawers that were open at the moment
  // the user navigated away.
  // ───────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    // 1. Close mobile nav
    setMobileOpen(false);

    // 2. Release every possible scroll/overflow lock.
    //    A modal that was open during navigation may have left these set.
    document.body.style.overflow         = '';
    document.body.style.position         = '';
    document.body.style.top              = '';
    document.body.style.width            = '';
    document.documentElement.style.overflow  = '';
    document.documentElement.style.position = '';

    // 3. *** THE CRITICAL FIX ***
    //    Scroll the main content container back to the very top.
    //    This must happen after the DOM has updated so we use the ref.
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    // h-screen is the Tailwind fallback (100vh).
    // The inline style overrides it with 100dvh on browsers that support it —
    // 100dvh adjusts for the iOS address bar so the layout never overflows the
    // visible viewport.  On browsers without dvh support the inline style is
    // silently ignored and h-screen (100vh) applies as intended.
    <div
      className="flex h-screen overflow-hidden bg-background"
      style={{ height: '100dvh' }}
    >
      {/* Desktop sidebar — hidden on mobile */}
      <div className="hidden lg:flex flex-shrink-0 h-full">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />
      </div>

      {/* Mobile navigation drawer */}
      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          onMobileMenuToggle={() => setMobileOpen(true)}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/*
          overscroll-y-contain — prevents iOS rubber-band overscroll from
          propagating to the body, which can temporarily lock the whole page.

          PAGE TRANSITION DESIGN:
          We use a simple fade-IN only.  The old page is removed from the DOM
          INSTANTLY when the route changes (exit: duration 0 = instant snap).
          The new page then fades in over 150 ms.

          Why no slow exit animation:
          • With mode="wait" + a real exit duration, if the exit animation
            stalls for any reason the new page NEVER mounts — blank screen
            that looks identical to a frozen page.
          • An instant exit + fade-in looks clean and is completely safe on
            every mobile browser.
          • The new page starts with pointer-events:auto (framer-motion does
            NOT disable pointer-events for opacity animations), so every button
            and scroll gesture works the moment the page mounts.
        */}
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto overscroll-y-contain bg-background"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0 } }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="min-h-full"
            >
              <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-full">
                <Outlet />
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
