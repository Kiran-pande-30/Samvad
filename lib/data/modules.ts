import type { SupabaseClient } from '@supabase/supabase-js'
import { NotFoundError } from './errors'
import { LessonSummary, Module, ModuleWithLessons } from '../types'

export const getModulesByLanguagePair = async (supabase: SupabaseClient, languagePairSlug: string) => {
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

  return (modules as Module[]).map((m) => ({
    id: m.id,
    title: m.title,
    description: m.description,
    order_index: m.order_index,
    is_locked_initially: m.is_locked_initially
  }))
}

export const getModuleLessons = async (supabase: SupabaseClient, moduleId: string): Promise<LessonSummary[]> => {
  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('id')
    .eq('id', moduleId)
    .single()

  if (moduleError || !module) throw new NotFoundError('Module not found')

  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, title, module_id, order_index, phrases(target, order_index)')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: true })

  if (lessonsError) throw new Error('Failed to fetch lessons')

  // The first phrase doubles as the lesson's Devanagari subtitle on the path
  return lessons.map(({ phrases, ...lesson }) => {
    const [firstPhrase] = [...phrases].sort((a, b) => a.order_index - b.order_index)
    return { ...lesson, preview_phrase: firstPhrase?.target ?? null, phrase_count: phrases.length }
  })
}

// Guests (not signed in) can take every lesson of the first module of this pair.
export const FREE_LANGUAGE_PAIR_SLUG = 'hindi-marathi'

// The free lessons' ids, in path order. Lesson content is public-read, so this
// works with a logged-out Supabase client.
export const getFreeLessonIds = async (supabase: SupabaseClient): Promise<string[]> => {
  const [firstModule] = await getModulesByLanguagePair(supabase, FREE_LANGUAGE_PAIR_SLUG)
  if (!firstModule) return []

  const { data, error } = await supabase
    .from('lessons')
    .select('id')
    .eq('module_id', firstModule.id)
    .order('order_index', { ascending: true })

  if (error) throw new Error('Failed to fetch free lessons')
  return data.map((lesson) => lesson.id)
}

export const getModulesWithLessons = async ( supabase: SupabaseClient, languagePairSlug: string): Promise<ModuleWithLessons[]> => {
  const modules = await getModulesByLanguagePair(supabase, languagePairSlug)

  return Promise.all(
    modules.map(async (module) => ({
      ...module,
      lessons: await getModuleLessons(supabase, module.id),
    }))
  )
}
