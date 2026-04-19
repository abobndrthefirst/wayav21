// useSubscription — client-side subscription state.
// Fetches from streampay-get-status on mount + on visibilitychange.
// Designed to be called inside any component that needs to read subscription
// state (billing page, gated dashboards, upgrade modal, etc.).

import { useCallback, useEffect, useRef, useState } from 'react'
import { getStatus } from './streampay.js'

export function useSubscription({ user, authLoading }) {
  const [subscription, setSubscription] = useState(null)
  const [hasActive, setHasActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const inFlight = useRef(false)
  const mounted = useRef(true)

  const load = useCallback(async () => {
    if (inFlight.current) return
    inFlight.current = true
    setError(null)
    try {
      const res = await getStatus()
      if (!mounted.current) return
      setSubscription(res?.subscription ?? null)
      setHasActive(Boolean(res?.hasActive))
    } catch (e) {
      if (!mounted.current) return
      setError(e?.message ?? 'Unknown error')
      setSubscription(null)
      setHasActive(false)
    } finally {
      if (mounted.current) setLoading(false)
      inFlight.current = false
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setSubscription(null)
      setHasActive(false)
      setLoading(false)
      return
    }
    setLoading(true)
    load()
  }, [user, authLoading, load])

  useEffect(() => {
    if (!user) return
    const onVis = () => { if (document.visibilityState === 'visible') load() }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [user, load])

  return { subscription, hasActive, loading, error, refresh: load }
}
