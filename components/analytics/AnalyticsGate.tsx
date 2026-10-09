'use client'

import { useEffect, useRef, useState } from 'react'
import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next'
import { createClient } from '@/lib/supabase/client'

// Supabase user IDs whose visits should never reach Vercel Analytics
// (comma-separated, e.g. our own test accounts).
const EXCLUDED_USER_IDS = new Set(
  (process.env.NEXT_PUBLIC_ANALYTICS_EXCLUDED_USERS ?? '')
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
)

const AnalyticsGate = () => {
  const [ready, setReady] = useState(false)
  const excluded = useRef(false)

  useEffect(() => {
    const supabase = createClient()

    // Wait for the first auth check so the initial page view isn't sent
    // before we know who is signed in.
    supabase.auth.getSession().then(({ data }) => {
      excluded.current = EXCLUDED_USER_IDS.has(data.session?.user.id ?? '')
      setReady(true)
    })

    // Keep the flag current when someone signs in or out without a reload.
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      excluded.current = EXCLUDED_USER_IDS.has(session?.user.id ?? '')
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (!ready) return null

  return <Analytics beforeSend={(event: BeforeSendEvent) => (excluded.current ? null : event)} />
}

export default AnalyticsGate
