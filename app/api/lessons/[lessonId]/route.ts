import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLessonDetail } from '@/lib/data/lessons'
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
    const lesson = await getLessonDetail(supabase, lessonId)
    return NextResponse.json(lesson)
  } catch (e) {
    if (e instanceof NotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to fetch lesson' }, { status: 500 })
  }
}
