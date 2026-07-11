import type { SupabaseClient } from '@supabase/supabase-js'
import { NotFoundError } from './errors'

export async function getModulesByLanguagePair(supabase: SupabaseClient, languagePairSlug: string) {
  const { data: pair, error: pairError } = await supabase
    .from('language_pairs')
    .select('id')
    .eq('slug', languagePairSlug)
    .eq('is_active', true)
    .single()

  if (pairError || !pair) throw new NotFoundError('Language pair not found')

  const { data: modules, error: modulesError } = await supabase
    .from('modules')
    .select('*, lessons(count)')
    .eq('language_pair_id', pair.id)
    .order('order_index', { ascending: true })

  if (modulesError) throw new Error('Failed to fetch modules')

  type ModuleRow = {
    id: string
    title: string
    description: string | null
    order_index: number
    is_locked_initially: boolean
    lessons: { count: number }[]
  }

  return (modules as ModuleRow[]).map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    order_index: m.order_index,
    is_locked_initially: m.is_locked_initially,
    lesson_count: m.lessons[0].count,
  }))
}

export async function getModuleLessons(supabase: SupabaseClient, moduleId: string) {
  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('id')
    .eq('id', moduleId)
    .single()

  if (moduleError || !module) throw new NotFoundError('Module not found')

  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, title, intro_text, order_index')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: true })

  if (lessonsError) throw new Error('Failed to fetch lessons')

  return lessons
}
