import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(
  request: Request,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  const { lessonId } = await params

  if (!UUID_REGEX.test(lessonId)) {
    return NextResponse.json({ error: 'Invalid lesson ID' }, { status: 400 })
  }

  const supabase = await createClient()

  const [lessonResult, phrasesResult, stepsResult] = await Promise.all([
    supabase
      .from('lessons')
      .select('*')
      .eq('id', lessonId)
      .single(),
    supabase
      .from('phrases')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index', { ascending: true }),
    supabase
      .from('lesson_steps')
      .select('*')
      .eq('lesson_id', lessonId)
      .order('order_index', { ascending: true }),
  ])

  if (lessonResult.error && lessonResult.error.code === 'PGRST116') {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  if (lessonResult.error || phrasesResult.error || stepsResult.error) {
    return NextResponse.json(
      { error: 'Failed to fetch lesson' },
      { status: 500 }
    )
  }

  const lesson = lessonResult.data
  const phrases = (phrasesResult.data || []).map((phrase) => ({
    id: phrase.id,
    source: phrase.source,
    target: phrase.target,
    transliteration: phrase.transliteration,
    order_index: phrase.order_index,
  }))
  const steps = (stepsResult.data || []).map((step) => ({
    id: step.id,
    phrase_id: step.phrase_id,
    step_type: step.step_type,
    order_index: step.order_index,
    prompt: step.prompt,
    data: step.data,
    correct_answer: step.correct_answer,
  }))

  return NextResponse.json({
    id: lesson.id,
    title: lesson.title,
    intro_text: lesson.intro_text,
    module_id: lesson.module_id,
    phrases,
    steps,
  })
}
