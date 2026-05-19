import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

async function getAuthenticatedUser(supabase: SupabaseClient) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function GET(request: Request) {
  const supabase = await createClient()

  const user = await getAuthenticatedUser(supabase)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const [progressResult, profileResult, modulesResult] = await Promise.all([
    supabase
      .from('user_progress')
      .select('lesson_id, module_id, status, completed_at')
      .eq('user_id', user.id),
    supabase
      .from('profiles')
      .select('current_streak, last_active_date')
      .eq('id', user.id)
      .single(),
    supabase
      .from('modules')
      .select('id, lessons(count)'),
  ])

  if (progressResult.error || profileResult.error || modulesResult.error) {
    return NextResponse.json(
      { error: 'Failed to fetch progress' },
      { status: 500 }
    )
  }

  const progress = progressResult.data || []
  const profile = profileResult.data
  const modules = modulesResult.data || []

  // Compute modules_completed — a module is complete when ALL its
  // lessons have status 'completed'
  const modulesCompleted = modules
    .filter(m => {
      const totalLessons = m.lessons[0]?.count ?? 0
      const completedLessons = progress.filter(
        p => p.module_id === m.id && p.status === 'completed'
      ).length
      return completedLessons === totalLessons && totalLessons > 0
    })
    .map(m => m.id)

  return NextResponse.json({
    lessons: progress.map(p => ({
      lesson_id: p.lesson_id,
      module_id: p.module_id,
      status: p.status,
      completed_at: p.completed_at,
    })),
    modules_completed: modulesCompleted,
    streak: profile?.current_streak ?? 0,
    last_active_date: profile?.last_active_date ?? null,
  })
}
