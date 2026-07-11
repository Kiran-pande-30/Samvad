import type { SupabaseClient } from '@supabase/supabase-js'

function getYesterday(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().split('T')[0]
}

export async function getProgress(supabase: SupabaseClient, userId: string) {
  const [progressResult, profileResult, modulesResult] = await Promise.all([
    supabase
      .from('user_progress')
      .select('lesson_id, module_id, status, completed_at')
      .eq('user_id', userId),
    supabase
      .from('profiles')
      .select('current_streak, last_active_date')
      .eq('id', userId)
      .single(),
    supabase.from('modules').select('id, lessons(count)'),
  ])

  if (progressResult.error || profileResult.error || modulesResult.error) {
    throw new Error('Failed to fetch progress')
  }

  const progress = progressResult.data || []
  const profile = profileResult.data
  const modules = modulesResult.data || []

  const modulesCompleted = modules
    .filter((m) => {
      const totalLessons = m.lessons[0]?.count ?? 0
      const completedLessons = progress.filter(
        (p) => p.module_id === m.id && p.status === 'completed'
      ).length
      return completedLessons === totalLessons && totalLessons > 0
    })
    .map((m) => m.id)

  return {
    lessons: progress.map((p) => ({
      lesson_id: p.lesson_id,
      module_id: p.module_id,
      status: p.status,
      completed_at: p.completed_at,
    })),
    modules_completed: modulesCompleted,
    streak: profile?.current_streak ?? 0,
    last_active_date: profile?.last_active_date ?? null,
  }
}

export async function startLesson(
  supabase: SupabaseClient,
  userId: string,
  lessonId: string,
  moduleId: string
) {
  const { error } = await supabase.from('user_progress').upsert(
    { user_id: userId, lesson_id: lessonId, module_id: moduleId, status: 'in_progress' },
    { onConflict: 'user_id,lesson_id' }
  )

  if (error) throw new Error('Failed to save progress')
}

export async function completeLesson(
  supabase: SupabaseClient,
  userId: string,
  lessonId: string,
  moduleId: string,
  attempts: { step_id: string; phrase_id?: string | null; is_correct: boolean }[]
) {
  const now = new Date().toISOString()
  const today = now.split('T')[0]

  const [progressResult, attemptsResult] = await Promise.all([
    supabase.from('user_progress').upsert(
      {
        user_id: userId,
        lesson_id: lessonId,
        module_id: moduleId,
        status: 'completed',
        completed_at: now,
      },
      { onConflict: 'user_id,lesson_id' }
    ),
    supabase.from('step_attempts').insert(
      attempts.map((a) => ({
        user_id: userId,
        step_id: a.step_id,
        phrase_id: a.phrase_id ?? null,
        is_correct: a.is_correct,
        attempted_at: now,
      }))
    ),
  ])

  if (progressResult.error || attemptsResult.error) {
    throw new Error('Failed to save progress')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('current_streak, last_active_date')
    .eq('id', userId)
    .single()

  if (profileError) throw new Error('Failed to fetch profile')

  const lastActive = profile?.last_active_date
  let newStreak = profile?.current_streak ?? 0

  if (lastActive === today) {
    // Already completed a lesson today — streak unchanged
  } else if (lastActive === getYesterday()) {
    newStreak = newStreak + 1
  } else {
    newStreak = 1
  }

  const { error: streakError } = await supabase
    .from('profiles')
    .update({ current_streak: newStreak, last_active_date: today })
    .eq('id', userId)

  if (streakError) throw new Error('Failed to update streak')

  return { status: 'completed' as const, completed_at: now, streak: newStreak }
}
