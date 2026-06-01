import { useState, useEffect, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

let toastCount = 0;

interface ToastStore {
  toasts: Toast[];
  add: (toast: Omit<Toast, 'id'>) => void;
  remove: (id: string) => void;
}

let listeners: Array<(toasts: Toast[]) => void> = [];
let toasts: Toast[] = [];
const timers = new Map<string, ReturnType<typeof setTimeout>>();

function notify() {
  listeners.forEach((l) => l([...toasts]));
}

export const toastManager = {
  add(toast: Omit<Toast, 'id'>, duration = 5000) {
    const id = String(++toastCount);
    toasts = [...toasts, { ...toast, id }];
    notify();
    const timer = setTimeout(() => toastManager.remove(id), duration);
    timers.set(id, timer);
    return id;
  },
  remove(id: string) {
    const timer = timers.get(id);
    if (timer) { clearTimeout(timer); timers.delete(id); }
    toasts = toasts.filter((t) => t.id !== id);
    notify();
  },
};

export function useToastManager(): ToastStore {
  const [localToasts, setLocalToasts] = useState<Toast[]>(toasts);

  useEffect(() => {
    const listener = (t: Toast[]) => setLocalToasts(t);
    listeners.push(listener);
    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  return {
    toasts: localToasts,
    add: useCallback((t) => { toastManager.add(t); }, []),
    remove: useCallback((id) => { toastManager.remove(id); }, []),
  };
}

export function toast(title: string, type: ToastType = 'info', description?: string) {
  toastManager.add({ title, description, type });
}
