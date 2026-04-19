// useShopStats — one-call shop analytics for the dashboard home + data tabs.
//
// Every account state that represents a real, usable shop — on_trial,
// active, past_due, canceled — gets real numbers from public.shop_stats
// (zeros are fine; they just mean "no activity yet"). Only the fallback
// paths (resubscribe_required, payment_failed) show demo numbers so the
// UI stays informative instead of empty while the shop is locked out.

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

// Shops in any of these states have a live, usable product experience →
// show their real activity.
const LIVE_STATES = new Set([
  'on_trial',
  'active',
  'past_due',
  'canceled',
])

export function useShopStats({ shopId, accountStatus }) {
  const isLive = LIVE_STATES.has(accountStatus)
  const [stats, setStats] = useState(isLive ? ZERO : DEMO)
  const [loading, setLoading] = useState(isLive)
  const [error, setError] = useState(null)
  const mounted = useRef(true)

  const load = useCallback(async () => {
    if (!shopId || !isLive) return
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
  }, [shopId, isLive])

  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (!isLive) {
      setStats(DEMO)
      setLoading(false)
      return
    }
    load()
  }, [isLive, load])

  return {
    ...stats,
    isDemo: !isLive,
    loading,
    error,
    refresh: load,
  }
}
