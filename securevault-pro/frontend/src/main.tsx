import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// ─── Apply theme before first paint (no FOUC) ────────────────────────────────
// Must stay in sync with the `version` in themeStore.ts.
// If the stored version is older than CURRENT_VERSION, we ignore it and use 'dark'.
const CURRENT_VERSION = 2;

(function applyTheme() {
  let theme: string = 'dark'; // default

  try {
    const raw = localStorage.getItem('svp-theme');
    if (raw) {
      const stored = JSON.parse(raw);
      if ((stored?.version ?? 0) >= CURRENT_VERSION && stored?.state?.theme) {
        theme = stored.state.theme;
      } else {
        // Stale version — nuke it so Zustand also starts fresh
        localStorage.removeItem('svp-theme');
      }
    }
  } catch { /* ignore corrupt data */ }

  const html = document.documentElement;

  if (theme === 'light') {
    html.classList.remove('dark');
    html.style.colorScheme = 'light';
  } else if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    html.classList.toggle('dark', prefersDark);
    html.style.colorScheme = prefersDark ? 'dark' : 'light';
  } else {
    // 'dark' (default)
    html.classList.add('dark');
    html.style.colorScheme = 'dark';
  }
})();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
