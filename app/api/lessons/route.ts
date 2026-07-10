import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()

  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    )
  }

  return NextResponse.json({
    lessons: (lessons || []).map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      intro_text: lesson.intro_text,
      module_id: lesson.module_id,
    })),
  })
}
