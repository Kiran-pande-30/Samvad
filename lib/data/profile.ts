import type { SupabaseClient } from '@supabase/supabase-js'
import { ValidationError } from './errors'

const UPDATABLE_PROFILE_FIELDS = [
  'display_name',
  'native_language',
  'active_language_pair_id',
  'onboarding_completed',
  'daily_goal',
] as const

export async function getProfile(supabase: SupabaseClient, userId: string) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, language_pairs(*)')
    .eq('id', userId)
    .single()

  if (error) throw new Error('Failed to fetch profile')

  const { language_pairs, ...profileData } = profile
  return { ...profileData, active_language_pair: language_pairs || null }
}

export async function updateProfile(
  supabase: SupabaseClient,
  userId: string,
  body: Record<string, unknown>
) {
  const updates: Record<string, unknown> = {}
  for (const field of UPDATABLE_PROFILE_FIELDS) {
    if (body[field] !== undefined) updates[field] = body[field]
  }

  if (Object.keys(updates).length === 0) {
    throw new ValidationError('No valid fields to update')
  }

  const { error } = await supabase.from('profiles').update(updates).eq('id', userId)
  if (error) throw new Error('Failed to update profile')
}
