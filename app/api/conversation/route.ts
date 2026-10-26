import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/data/auth'
import { getScenario, MAX_CONVERSATION_TURNS } from '@/lib/data/scenarios'
import { askConversationPartner } from '@/lib/data/conversation'
import { AIBusyError, NotFoundError } from '@/lib/data/errors'
import type { ConversationMessage } from '@/lib/types'

// Gemini can be slow under load and may fall back through several models.
export const maxDuration = 120

const MAX_TEXT_LENGTH = 300
const SLUG_REGEX = /^[a-z0-9-]{1,60}$/

const isMessage = (value: unknown): value is ConversationMessage => {
  const m = value as ConversationMessage
  return (m?.role === 'learner' || m?.role === 'partner') && typeof m.text === 'string' && m.text.length <= MAX_TEXT_LENGTH
}

// One turn of an AI conversation: the learner's line in, the partner's reply out.
export const POST = async (request: Request) => {
  const supabase = await createClient()

  const user = await getAuthenticatedUser(supabase)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const learnerText = typeof body?.learner_text === 'string' ? body.learner_text.trim() : ''

  if (
    typeof body?.slug !== 'string' || !SLUG_REGEX.test(body.slug) ||
    !Array.isArray(body.history) || !body.history.every(isMessage) ||
    !Array.isArray(body.goals_done) || !body.goals_done.every((g: unknown) => typeof g === 'string') ||
    learnerText === '' || learnerText.length > MAX_TEXT_LENGTH
  ) {
    return NextResponse.json({ error: 'slug, history, goals_done and learner_text are required' }, { status: 400 })
  }

  const history: ConversationMessage[] = body.history
  const learnerTurns = history.filter((m) => m.role === 'learner').length
  if (learnerTurns >= MAX_CONVERSATION_TURNS) {
    return NextResponse.json({ error: 'This conversation is over' }, { status: 400 })
  }

  try {
    const scenario = await getScenario(supabase, body.slug)
    const reply = await askConversationPartner(scenario, history, body.goals_done, learnerText)
    return NextResponse.json(reply)
  } catch (e) {
    if (e instanceof NotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 })
    }
    if (e instanceof AIBusyError) {
      return NextResponse.json({ error: 'Try again after some time' }, { status: 429 })
    }
    console.error('Conversation turn failed:', e)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 502 })
  }
}
