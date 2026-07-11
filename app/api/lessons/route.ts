import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getLessonSummaries } from '@/lib/data/lessons'

export async function GET() {
  const supabase = await createClient()

  try {
    const lessons = await getLessonSummaries(supabase)
    return NextResponse.json({ lessons })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch lessons' }, { status: 500 })
  }
}
