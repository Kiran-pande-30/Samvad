import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/data/auth'
import { completeLesson } from '@/lib/data/progress'

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

  try {
    const result = await completeLesson(
      supabase,
      user.id,
      body.lesson_id,
      body.module_id
    )
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}
