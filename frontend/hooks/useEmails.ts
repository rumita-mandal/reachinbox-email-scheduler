'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, User, EmailJob, PaginatedResponse, EmailStats } from '@/lib/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getMe()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
    window.location.href = '/';
  }, []);

  return { user, loading, error, logout };
}

export function useEmailStats() {
  const [stats, setStats] = useState<EmailStats | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    api
      .getStats()
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, [refresh]);

  return { stats, loading, refresh };
}

export function useScheduledEmails() {
  const [data, setData] = useState<PaginatedResponse<EmailJob> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const refresh = useCallback(
    (p = page) => {
      setLoading(true);
      api
        .getScheduled(p)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    },
    [page]
  );

  useEffect(() => {
    refresh(page);
    const interval = setInterval(() => refresh(page), 8000);
    return () => clearInterval(interval);
  }, [page, refresh]);

  return { data, loading, page, setPage, refresh };
}

export function useSentEmails() {
  const [data, setData] = useState<PaginatedResponse<EmailJob> | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const refresh = useCallback(
    (p = page) => {
      setLoading(true);
      api
        .getSent(p)
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    },
    [page]
  );

  useEffect(() => {
    refresh(page);
    const interval = setInterval(() => refresh(page), 8000);
    return () => clearInterval(interval);
  }, [page, refresh]);

  return { data, loading, page, setPage, refresh };
}
