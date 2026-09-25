import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProgressData } from '@/lib/types'

const DEFAULT_TIMEZONE = 'Asia/Kolkata'

/** Today's date (YYYY-MM-DD) in the given IANA timezone, not in UTC. */
const localToday = (timezone: string): string =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

const shiftDays = (isoDate: string, days: number): string => {
  const d = new Date(`${isoDate}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().split('T')[0]
}

/**
 * The streak as it stands *right now*. `profiles.current_streak` is only written
 * when a lesson is completed, so a stored value goes stale the moment the user
 * misses a day — it has to be re-derived against last_active_date on every read.
 */
export const effectiveStreak = (
  currentStreak: number | null | undefined,
  lastActiveDate: string | null | undefined,
  timezone: string | null | undefined = DEFAULT_TIMEZONE
): number => {
  if (!lastActiveDate || !currentStreak) return 0
  const today = localToday(timezone || DEFAULT_TIMEZONE)
  return lastActiveDate === today || lastActiveDate === shiftDays(today, -1) ? currentStreak : 0
}

export const getProgress = async (
  supabase: SupabaseClient,
  userId: string
): Promise<ProgressData> => {
  const [progressResult, profileResult, modulesResult] = await Promise.all([
    supabase
      .from('user_progress')
      .select('lesson_id, module_id, status, completed_at')
      .eq('user_id', userId),
    supabase
      .from('profiles')
      .select('current_streak, last_active_date, timezone')
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
    streak: effectiveStreak(profile?.current_streak, profile?.last_active_date, profile?.timezone),
    last_active_date: profile?.last_active_date ?? null,
  }
}

export const startLesson = async (
  supabase: SupabaseClient,
  _userId: string,
  lessonId: string,
  moduleId: string
) => {
  const { data, error } = await supabase.rpc('start_lesson', {
    p_lesson_id: lessonId,
    p_module_id: moduleId,
  })

  if (error) throw new Error('Failed to save progress')
  return data as { status: string }
}

export const completeLesson = async (
  supabase: SupabaseClient,
  _userId: string,
  lessonId: string,
  moduleId: string,
  attempts: { step_id: string; phrase_id?: string | null; is_correct: boolean }[]
) => {
  const { data, error } = await supabase.rpc('complete_lesson', {
    p_lesson_id: lessonId,
    p_module_id: moduleId,
    p_attempts: attempts,
  })

  if (error) throw new Error('Failed to save progress')

  return data as {
    status: 'completed'
    completed_at: string
    streak: number
    score: number | null
  }
}
