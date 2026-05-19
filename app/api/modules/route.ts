import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const languagePair = searchParams.get('language_pair')

  if (!languagePair) {
    return NextResponse.json(
      { error: 'language_pair query param is required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  // Look up the language pair by slug
  const { data: pair, error: pairError } = await supabase
    .from('language_pairs')
    .select('id')
    .eq('slug', languagePair)
    .eq('is_active', true)
    .single()

  if (pairError || !pair) {
    return NextResponse.json(
      { error: 'Language pair not found' },
      { status: 404 }
    )
  }

  // Fetch modules with lesson count
  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('*, lessons(count)')
    .eq('language_pair_id', pair.id)
    .order('order_index', { ascending: true })

  if (modulesError) {
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    )
  }

  // Shape the response — extract lesson_count from nested count
  const result = modules.map((m: any) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    order_index: m.order_index,
    is_locked_initially: m.is_locked_initially,
    lesson_count: m.lessons[0].count,
  }))

  return NextResponse.json(result)
}