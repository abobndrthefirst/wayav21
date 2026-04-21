// useShopStats — one-call shop analytics for the dashboard home + data tabs.
// Always returns real numbers from public.shop_stats. Zeros are fine — they
// just mean "no activity yet" for a fresh shop.

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

const ZERO = {
  customers: 0,
  scans: 0,
  rewardsRedeemed: 0,
  totalPoints: 0,
  rewardsSent: 0,
  repeatRatePct: 0,
}

export function useShopStats({ shopId }) {
  const [stats, setStats] = useState(ZERO)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const mounted = useRef(true)

  const load = useCallback(async () => {
    if (!shopId) return
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase.rpc('shop_stats', { _shop_id: shopId })
    if (!mounted.current) return
    if (err) {
      setError(err.message || String(err))
      setStats(ZERO)
    } else if (data && typeof data === 'object') {
      setStats({
        customers: Number(data.customers ?? 0),
        scans: Number(data.scans ?? 0),
        rewardsRedeemed: Number(data.rewards_redeemed ?? 0),
        totalPoints: Number(data.total_points ?? 0),
        rewardsSent: Number(data.rewards_sent ?? 0),
        repeatRatePct: Number(data.repeat_rate_pct ?? 0),
      })
    } else {
      setStats(ZERO)
    }
    setLoading(false)
  }, [shopId])

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (!shopId) { setStats(ZERO); setLoading(false); return }
    load()
  }, [shopId, load])

  return {
    ...stats,
    loading,
    error,
    refresh: load,
  }
}
