import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export interface AppNotification {
  id: string;
  type: 'warning' | 'info' | 'error' | 'success';
  title: string;
  body: string;
  createdAt: string;
  link?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.data ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refetch(); }, [refetch]);

  return { notifications, loading, refetch };
}
