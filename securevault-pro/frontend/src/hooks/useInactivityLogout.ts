import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth.service';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export function useInactivityLogout() {
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();
  const { isAuthenticated, refreshToken, logout } = useAuthStore();

  const handleLogout = useCallback(async () => {
    try {
      if (refreshToken) await authService.logout(refreshToken);
    } finally {
      logout();
      navigate('/login', { replace: true, state: { reason: 'inactivity' } });
    }
  }, [refreshToken, logout, navigate]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(handleLogout, INACTIVITY_TIMEOUT);
  }, [handleLogout]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAuthenticated, resetTimer]);
}
