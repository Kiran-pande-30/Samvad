import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

async function getAuthenticatedUser(supabase: SupabaseClient) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

function getYesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const user = await getAuthenticatedUser(supabase)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  if (!body.lesson_id || !body.module_id || !Array.isArray(body.attempts)) {
    return NextResponse.json(
      { error: 'lesson_id, module_id and attempts are required' },
      { status: 400 }
    )
  }

  const now = new Date().toISOString()
  const today = now.split('T')[0]

  // Write 1 — mark lesson completed
  const progressUpdate = supabase
    .from('user_progress')
    .upsert(
      {
        user_id: user.id,
        lesson_id: body.lesson_id,
        module_id: body.module_id,
        status: 'completed',
        completed_at: now,
      },
      { onConflict: 'user_id,lesson_id' }
    )

  // Write 2 — bulk insert all step attempts
  const attemptsInsert = supabase
    .from('step_attempts')
    .insert(
      body.attempts.map((a: any) => ({
        user_id: user.id,
        step_id: a.step_id,
        phrase_id: a.phrase_id ?? null,
        is_correct: a.is_correct,
        attempted_at: now,
      }))
    )

  const [progressResult, attemptsResult] = await Promise.all([
    progressUpdate,
    attemptsInsert,
  ])

  if (progressResult.error || attemptsResult.error) {
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    )
  }

  // Fetch current streak state
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('current_streak, last_active_date')
    .eq('id', user.id)
    .single()

  if (profileError) {
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }

  const lastActive = profile?.last_active_date
  let newStreak = profile?.current_streak ?? 0

  if (lastActive === today) {
    // Already completed a lesson today — streak unchanged
  } else if (lastActive === getYesterday()) {
    // Completed yesterday — extend streak
    newStreak = newStreak + 1
  } else {
    // Missed a day or first lesson ever — reset to 1
    newStreak = 1
  }

  // Update streak on profile
  const { error: streakError } = await supabase
    .from('profiles')
    .update({
      current_streak: newStreak,
      last_active_date: today,
    })
    .eq('id', user.id)

  if (streakError) {
    return NextResponse.json(
      { error: 'Failed to update streak' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    status: 'completed',
    completed_at: now,
    streak: newStreak,
  })
}
