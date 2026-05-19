import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  request: Request,
  { params }: { params: Promise<{ moduleId: string }> }
) {
  const { moduleId } = await params

  // Validate UUID format
  if (!UUID_REGEX.test(moduleId)) {
    return NextResponse.json({ error: 'Invalid module ID' }, { status: 400 })
  }

  const supabase = await createClient()

  // Check if module exists
  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('id')
    .eq('id', moduleId)
    .single()

  if (moduleError || !module) {
    return NextResponse.json(
      { error: 'Module not found' },
      { status: 404 }
    )
  }

  // Fetch lessons for the module
  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, title, intro_text, order_index')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: true })

  if (lessonsError) {
    return NextResponse.json(
      { error: 'Failed to fetch lessons' },
      { status: 500 }
    )
  }

  return NextResponse.json(lessons)
}
