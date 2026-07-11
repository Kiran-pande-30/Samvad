import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getModuleLessons } from '@/lib/data/modules'
import { NotFoundError } from '@/lib/data/errors'
import { isValidUUID } from '@/lib/data/validation'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  const { moduleId } = await params

  if (!isValidUUID(moduleId)) {
    return NextResponse.json({ error: 'Invalid module ID' }, { status: 400 })
  }

  const supabase = await createClient()

  try {
    const lessons = await getModuleLessons(supabase, moduleId)
    return NextResponse.json(lessons)
  } catch (e) {
    if (e instanceof NotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 })
  }
}
