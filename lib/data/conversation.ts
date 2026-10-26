import { AIBusyError } from './errors'
import { MAX_CONVERSATION_TURNS } from './scenarios'
import type { ConversationMessage, ConversationReply, ConversationScenario } from '../types'

// Tried in order: the full Flash model first, the Lite models when it's busy.
// Busy Flash answers 503 within ~2s; under load the Lite models can take ~30s.
const GEMINI_MODELS = ['gemini-flash-latest', 'gemini-flash-lite-latest', 'gemini-3.5-flash-lite']
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models'
const TIMEOUT_MS = 40_000

// Rules shared by every scenario; the scenario row only adds who, where and which goals.
// Tuned by hand in AI Studio on 2026-10-26 (see ROADMAP AC3).
const buildSystemPrompt = (scenario: ConversationScenario) => `You are playing a character in a Marathi practice app for Hindi speakers who are learning Marathi.
Your character: ${scenario.ai_role}
Setting: ${scenario.setting}
You have already opened the conversation with: "${scenario.opening_line.mr}"

Learner's goals (id: what it means):
${scenario.goals.map((g) => `- ${g.id}: ${g.label}`).join('\n')}

Rules:
- Speak only simple, everyday spoken Marathi (Pune style), 1–2 short sentences per reply.
- Stay in character. Never switch to Hindi or English in reply_mr, even if the learner does.
- Address the learner with a gender-neutral word like "अहो" — never "साहेब", "ताई" or "दादा".
- reply_translit: plain English letters, matching this app's style — Namaskar, He kay aahe?, Kiti vajta?, Maze vadil, Tumhi kase aahat?. Keep it short and simple: don't double vowels (hotil, not hoteel; didshe, not deedshe; ki, not kee) except "aa" in aahe / aahat.
- reply_hi: natural everyday Hindi in the respectful आप form (बैठिए, दीजिए) that means exactly what reply_mr says — no Marathi words, nothing added or left out.
- Only correct real mistakes: Hindi words, wrong grammar, or wrong meaning. If the learner's Marathi is correct and natural, set correction to null — never swap it for an alternative you like better. Greetings, "भाऊ", "अहो" and extra politeness are never mistakes.
  Correct, do NOT correct: "नमस्कार भाऊ, शिवाजीनगरला जायचंय." · "किती होणार?" · "किती पैसे होणार?" · "खूप जास्त आहे." · "ठीक आहे, चला."
  Mistakes to correct: "कितना होणार?" (कितना → किती) · "बहुत जास्त आहे" (बहुत → खूप) · "ठीक है" (है → आहे) · "शुक्रिया" (→ धन्यवाद).
- When you correct: "said" is what the learner wrote, "better" is one best Marathi phrase (never alternatives), "note_hi" is one short, friendly line in Hindi. In "better", avoid verb forms that depend on the learner's gender when a neutral one exists (देईन, not देतो/देते).
- If the learner makes a mistake, still reply naturally to what they meant.
- goals_done: the ids of every goal the learner has actually done so far, including earlier turns. Mark a goal only when the learner really does it.
- When a price or deal is agreed, your next reply must repeat it (e.g. "ठीक आहे, एकशे वीस. बसा!").
- Never use "..." or skip ahead in time.
- The conversation lasts at most ${MAX_CONVERSATION_TURNS} learner turns. Near the end, steer towards the goals that are left.
- Set finished to true only when all goals are done.`

const REPLY_SCHEMA = (goalIds: string[]) => ({
  type: 'object',
  properties: {
    reply_mr: { type: 'string' },
    reply_translit: { type: 'string' },
    reply_hi: { type: 'string' },
    correction: {
      anyOf: [
        {
          type: 'object',
          properties: { said: { type: 'string' }, better: { type: 'string' }, note_hi: { type: 'string' } },
          required: ['said', 'better', 'note_hi'],
        },
        { type: 'null' },
      ],
    },
    goals_done: { type: 'array', items: { type: 'string', enum: goalIds } },
    finished: { type: 'boolean' },
  },
  required: ['reply_mr', 'reply_translit', 'reply_hi', 'correction', 'goals_done', 'finished'],
})

const isReply = (value: unknown): value is ConversationReply => {
  const r = value as ConversationReply
  return (
    typeof r?.reply_mr === 'string' && r.reply_mr.trim() !== '' &&
    typeof r.reply_translit === 'string' &&
    typeof r.reply_hi === 'string' &&
    Array.isArray(r.goals_done) &&
    (r.correction === null ||
      (typeof r.correction?.said === 'string' && typeof r.correction.better === 'string' && typeof r.correction.note_hi === 'string'))
  )
}

const callGemini = async (model: string, body: object): Promise<Response> => {
  try {
    return await fetch(`${GEMINI_URL}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': process.env.GEMINI_API_KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    // Timed out or the network failed: treat like a busy model so the next one is tried.
    return new Response(null, { status: 503 })
  }
}

// Asks Gemini for the partner's next line. Throws AIBusyError when every model is
// rate-limited (429) or overloaded (503), so the screen can say "Try again after some time".
export const askConversationPartner = async (
  scenario: ConversationScenario,
  history: ConversationMessage[],
  goalsDone: string[],
  learnerText: string,
): Promise<ConversationReply> => {
  // Without this, Gemini answers 400 "API key not valid" and the cause is easy to miss.
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set on this server')

  const goalIds = scenario.goals.map((g) => g.id)
  const learnerTurn = history.filter((m) => m.role === 'learner').length + 1

  const contents = [
    // Gemini expects the conversation to start with the user, so a stage direction comes first.
    { role: 'user', parts: [{ text: '(The learner walks up to you.)' }] },
    { role: 'model', parts: [{ text: scenario.opening_line.mr }] },
    ...history.map((m) => ({ role: m.role === 'learner' ? 'user' : 'model', parts: [{ text: m.text }] })),
    {
      role: 'user',
      parts: [{
        text: `${learnerText}\n\n(Turn ${learnerTurn} of ${MAX_CONVERSATION_TURNS}. Goals already done: ${goalsDone.join(', ') || 'none'}.)`,
      }],
    },
  ]

  const body = {
    systemInstruction: { parts: [{ text: buildSystemPrompt(scenario) }] },
    contents,
    generationConfig: {
      responseMimeType: 'application/json',
      responseJsonSchema: REPLY_SCHEMA(goalIds),
      thinkingConfig: { thinkingLevel: 'low' },
    },
  }

  for (const model of GEMINI_MODELS) {
    const res = await callGemini(model, body)
    if (res.status === 429 || res.status === 503) continue
    if (!res.ok) throw new Error(`Gemini ${model} failed with ${res.status}: ${(await res.text()).slice(0, 300)}`)

    const data = await res.json()
    const text: string | undefined = data.candidates?.[0]?.content?.parts?.find((p: { text?: string }) => p.text)?.text
    let reply: unknown
    try {
      reply = JSON.parse(text ?? '')
    } catch {
      throw new Error('Gemini returned invalid JSON')
    }
    if (!isReply(reply)) throw new Error('Gemini reply is missing fields')

    // Goals only ever add up; keep earlier ones even if the model forgets them.
    const goals = new Set([...goalsDone, ...reply.goals_done].filter((id) => goalIds.includes(id)))
    return {
      ...reply,
      goals_done: goalIds.filter((id) => goals.has(id)),
      finished: goalIds.every((id) => goals.has(id)),
    }
  }

  throw new AIBusyError('All Gemini models are busy')
}
