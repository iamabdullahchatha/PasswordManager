import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { Toaster } from './components/ui/toaster';
import { useThemeStore } from './store/themeStore';
import { useEffect } from 'react';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

export default function App() {
  const { theme } = useThemeStore();

  useEffect(() => {
    const root = document.documentElement;
    const apply = (dark: boolean) => {
      root.classList.toggle('dark', dark);
      root.style.colorScheme = dark ? 'dark' : 'light';
    };

    if (theme === 'dark') {
      apply(true);
    } else if (theme === 'light') {
      apply(false);
    } else {
      // system
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches);
      const handler = (e: MediaQueryListEvent) => apply(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    }
  }, [theme]);

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <Toaster />
    </ErrorBoundary>
  );
}
