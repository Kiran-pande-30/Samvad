import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'

async function getAuthenticatedUser(supabase: SupabaseClient) {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const user = await getAuthenticatedUser(supabase)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  if (!body.lesson_id || !body.module_id) {
    return NextResponse.json(
      { error: 'lesson_id and module_id are required' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('user_progress')
    .upsert(
      {
        user_id: user.id,
        lesson_id: body.lesson_id,
        module_id: body.module_id,
        status: 'in_progress',
      },
      { onConflict: 'user_id,lesson_id' }
    )

  if (error) {
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    )
  }

  return NextResponse.json({ status: 'in_progress' })
}
