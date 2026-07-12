import type { SupabaseClient } from '@supabase/supabase-js'
import { NotFoundError } from './errors'
import { Module, ModuleWithLessons } from '../types'

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

export const getModuleLessons = async (supabase: SupabaseClient, moduleId: string) => {
  const { data: module, error: moduleError } = await supabase
    .from('modules')
    .select('id')
    .eq('id', moduleId)
    .single()

  if (moduleError || !module) throw new NotFoundError('Module not found')

  const { data: lessons, error: lessonsError } = await supabase
    .from('lessons')
    .select('id, title, intro_text, module_id, order_index')
    .eq('module_id', moduleId)
    .order('order_index', { ascending: true })

  if (lessonsError) throw new Error('Failed to fetch lessons')

  return lessons
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
