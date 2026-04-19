// useSubscription — client-side subscription state hook.
// Fetches from streampay-get-status on mount, on `visibilitychange`, and on
// manual refresh(). Short-circuits cleanly when the user is not logged in.

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { getStatus, type Subscription } from './streampayClient';

export interface UseSubscriptionResult {
  subscription: Subscription | null;
  hasActive: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionResult {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [hasActive, setHasActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const inFlight = useRef(false);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    try {
      const res = await getStatus();
      if (!mounted.current) return;
      setSubscription(res.subscription);
      setHasActive(res.hasActive);
    } catch (e) {
      if (!mounted.current) return;
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      setSubscription(null);
      setHasActive(false);
    } finally {
      if (mounted.current) setLoading(false);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setSubscription(null);
      setHasActive(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    load();
  }, [user, authLoading, load]);

  useEffect(() => {
    if (!user) return;
    const onVis = () => {
      if (document.visibilityState === 'visible') load();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [user, load]);

  return { subscription, hasActive, loading, error, refresh: load };
}
