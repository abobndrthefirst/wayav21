// useShopStats — one-call shop analytics for the dashboard home + data tabs.
//
//   accountStatus === 'trial'  → return demo numbers (the preview the user
//                                sees before paying, to understand what the
//                                dashboard will look like once they have
//                                real activity).
//   accountStatus === 'active' → call public.shop_stats(shop_id) RPC and
//                                return real aggregates from the DB.
//                                Zeros are normal for a freshly-activated
//                                shop — that's ok, not hidden behind demo.
//
// Returns a stable shape so the render block doesn't branch:
//   {
//     customers, scans, rewardsRedeemed, totalPoints,
//     rewardsSent, repeatRatePct,
//     isDemo: true|false,   // caller can show/hide "demo preview" ribbons
//     loading, error
//   }

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

const DEMO = {
  customers: 1247,
  scans: 8432,
  rewardsRedeemed: 3891,
  totalPoints: 25296,
  rewardsSent: 3891,
  repeatRatePct: 67,
}

const ZERO = {
  customers: 0,
  scans: 0,
  rewardsRedeemed: 0,
  totalPoints: 0,
  rewardsSent: 0,
  repeatRatePct: 0,
}

export function useShopStats({ shopId, accountStatus }) {
  const isActive = accountStatus === 'active' || accountStatus === 'past_due' ||
                   accountStatus === 'canceled'  // already activated at least once
  const [stats, setStats] = useState(isActive ? ZERO : DEMO)
  const [loading, setLoading] = useState(isActive)
  const [error, setError] = useState(null)
  const mounted = useRef(true)

  const load = useCallback(async () => {
    if (!shopId || !isActive) return
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
    }
    setLoading(false)
  }, [shopId, isActive])

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (!isActive) {
      setStats(DEMO)
      setLoading(false)
      return
    }
    load()
  }, [isActive, load])

  return {
    ...stats,
    isDemo: !isActive,
    loading,
    error,
    refresh: load,
  }
}
