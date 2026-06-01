import { Outlet, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { useInactivityLogout } from '../../hooks/useInactivityLogout';

const PAGE_VARIANTS = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
};

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

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  return (
    /* bg-background resolves to dark navy in dark mode, off-white in light mode */
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden lg:flex flex-shrink-0 h-full">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(p => !p)} />
      </div>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMobileMenuToggle={() => setMobileOpen(true)} sidebarCollapsed={sidebarCollapsed} />

        <main className="flex-1 overflow-y-auto bg-background">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="h-full"
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
