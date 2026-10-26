import type { SupabaseClient } from '@supabase/supabase-js'
import { NotFoundError } from './errors'
import type { ConversationScenario, ScenarioSummary } from '../types'

// A conversation ends after this many learner turns, even if goals are left.
export const MAX_CONVERSATION_TURNS = 12

export const getScenarios = async (supabase: SupabaseClient): Promise<ScenarioSummary[]> => {
  const { data, error } = await supabase
    .from('conversation_scenarios')
    .select('slug, title, title_mr, setting, goals')
    .order('order_index', { ascending: true })

  if (error) throw new Error('Failed to fetch scenarios')
  return data as ScenarioSummary[]
}

export const getScenario = async (supabase: SupabaseClient, slug: string): Promise<ConversationScenario> => {
  const { data, error } = await supabase
    .from('conversation_scenarios')
    .select('id, module_id, slug, title, title_mr, ai_role, setting, opening_line, goals, key_phrases, order_index')
    .eq('slug', slug)
    .maybeSingle()

  if (error) throw new Error('Failed to fetch scenario')
  if (!data) throw new NotFoundError('Scenario not found')
  return data as ConversationScenario
}
