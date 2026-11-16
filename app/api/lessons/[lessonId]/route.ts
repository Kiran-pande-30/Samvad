import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthenticatedUser } from '@/lib/data/auth'
import { getLessonDetail } from '@/lib/data/lessons'
import { getFreeLessonIds } from '@/lib/data/modules'
import { NotFoundError } from '@/lib/data/errors'
import { isValidUUID } from '@/lib/data/validation'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params

  if (!isValidUUID(lessonId)) {
    return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    const user = await getAuthenticatedUser(supabase)

    // Guests may only open the free first module; for them the response also
    // says which free lesson comes next (null after the last one).
    let guest: { next_lesson_id: string | null } | null = null
    if (!user) {
      const freeLessonIds = await getFreeLessonIds(supabase)
      const index = freeLessonIds.indexOf(lessonId)
      if (index === -1) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      guest = { next_lesson_id: freeLessonIds[index + 1] ?? null }
    }

    const lesson = await getLessonDetail(supabase, lessonId, user?.id ?? null)
    return NextResponse.json({ ...lesson, guest })
  } catch (e) {
    if (e instanceof NotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to fetch lesson' }, { status: 500 })
  }
}
