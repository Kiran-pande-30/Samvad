import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/data/auth'
import { recordAttempt } from '@/lib/data/progress'
import { isValidUUID } from '@/lib/data/validation'

export const POST = async (request: Request) => {
  const supabase = await createClient()

  const user = await getAuthenticatedUser(supabase)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  if (typeof body.step_id !== 'string' || !isValidUUID(body.step_id) || typeof body.is_correct !== 'boolean') {
    return NextResponse.json({ error: 'step_id (uuid) and is_correct (boolean) are required' }, { status: 400 })
  }

  try {
    await recordAttempt(supabase, body.step_id, body.is_correct)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 })
  }
}
