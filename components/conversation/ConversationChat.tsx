'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Circle, Lightbulb, Mic, SendHorizontal, Volume2, X } from 'lucide-react'
import { MAX_CONVERSATION_TURNS } from '@/lib/data/scenarios'
import type {
  ChatEntry,
  ConversationReply,
  ConversationRequest,
  ConversationScenario,
  ConversationScreen,
  SpeechRecognitionLike,
} from '@/lib/types'

type SendStatus = 'idle' | 'sending' | 'busy' | 'error'

const getSpeechRecognition = (): (new () => SpeechRecognitionLike) | null => {
  if (typeof window === 'undefined') return null
  const w = window as unknown as Record<string, unknown>
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as (new () => SpeechRecognitionLike) | null
}

// A Marathi voice if the device has one, else Hindi (it reads Devanagari well enough).
const pickVoice = (): SpeechSynthesisVoice | null => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  const voices = window.speechSynthesis.getVoices()
  return voices.find((v) => v.lang.toLowerCase().startsWith('mr')) ?? voices.find((v) => v.lang.toLowerCase().startsWith('hi')) ?? null
}

const ConversationChat = ({ scenario }: { scenario: ConversationScenario }) => {
  const opening: ChatEntry = { role: 'partner', ...scenario.opening_line }
  const [screen, setScreen] = useState<ConversationScreen>('intro')
  const [entries, setEntries] = useState<ChatEntry[]>([opening])
  const [goalsDone, setGoalsDone] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<SendStatus>('idle')
  const [slowReply, setSlowReply] = useState(false)
  const [finished, setFinished] = useState(false)
  const [openMeanings, setOpenMeanings] = useState<Set<number>>(new Set())
  const [listening, setListening] = useState(false)
  const [micError, setMicError] = useState<string | null>(null)
  // Speech only exists in the browser; the server renders the intro screen, which doesn't use it.
  const [voice, setVoice] = useState<SpeechSynthesisVoice | null>(() => pickVoice())
  const canListen = screen === 'chat' && getSpeechRecognition() !== null
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)

  const learnerTurns = entries.filter((e) => e.role === 'learner').length
  const outOfTurns = learnerTurns >= MAX_CONVERSATION_TURNS && status === 'idle'
  const corrections = entries.flatMap((e) => (e.role === 'learner' && e.correction ? [e.correction] : []))

  // Voices often load after the page does, so listen for them.
  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const updateVoice = () => setVoice(pickVoice())
    window.speechSynthesis.addEventListener('voiceschanged', updateVoice)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoice)
      window.speechSynthesis.cancel()
      recognitionRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [entries, status])

  const speak = useCallback((text: string) => {
    if (!voice) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.voice = voice
    utterance.lang = voice.lang
    utterance.rate = 0.9
    window.speechSynthesis.speak(utterance)
  }, [voice])

  const startChat = () => {
    setScreen('chat')
    speak(scenario.opening_line.mr)
  }

  const restart = () => {
    window.speechSynthesis?.cancel()
    setEntries([opening])
    setGoalsDone([])
    setInput('')
    setStatus('idle')
    setFinished(false)
    setOpenMeanings(new Set())
    setScreen('intro')
  }

  const send = async () => {
    const text = input.trim()
    if (!text || status === 'sending' || finished || outOfTurns) return

    const history = entries.slice(1).map((e) => ({ role: e.role, text: e.role === 'learner' ? e.text : e.mr }))
    const request: ConversationRequest = { slug: scenario.slug, history, goals_done: goalsDone, learner_text: text }

    setEntries((prev) => [...prev, { role: 'learner', text, correction: null }])
    setInput('')
    setStatus('sending')
    const slowTimer = setTimeout(() => setSlowReply(true), 8000)

    try {
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })
      if (!response.ok) throw new Error(response.status === 429 ? 'busy' : 'error')
      const reply: ConversationReply = await response.json()

      setEntries((prev) => [
        ...prev.slice(0, -1),
        { role: 'learner', text, correction: reply.correction },
        { role: 'partner', mr: reply.reply_mr, translit: reply.reply_translit, hi: reply.reply_hi },
      ])
      setGoalsDone(reply.goals_done)
      setFinished(reply.finished)
      setStatus('idle')
      speak(reply.reply_mr)
    } catch (err) {
      // Take the line back so the learner can send it again unchanged.
      setEntries((prev) => prev.slice(0, -1))
      setInput(text)
      setStatus(err instanceof Error && err.message === 'busy' ? 'busy' : 'error')
    } finally {
      clearTimeout(slowTimer)
      setSlowReply(false)
    }
  }

  const startListening = () => {
    const Recognition = getSpeechRecognition()
    if (!Recognition || listening || status === 'sending') return
    window.speechSynthesis?.cancel()
    setMicError(null)

    const recognition = new Recognition()
    recognition.lang = 'mr-IN'
    recognition.interimResults = true
    recognition.continuous = true
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0].transcript).join(' ')
      setInput(transcript.trim())
    }
    recognition.onerror = (event) => {
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        setMicError('Allow the microphone in your browser to speak, or type your reply.')
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setMicError('Couldn’t hear that. Try again or type your reply.')
      }
    }
    recognition.onend = () => setListening(false)
    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }

  const stopListening = () => recognitionRef.current?.stop()

  const toggleMeaning = (index: number) => {
    setOpenMeanings((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  if (screen === 'intro') {
    return (
      <div className="flex-1 flex flex-col px-4 py-4 min-h-0">
        <div className="shrink-0 flex items-center gap-1 -ml-2">
          <Link
            href="/conversations"
            aria-label="Back to conversations"
            className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-gray-400 active:scale-95 transition-transform duration-150"
          >
            <X className="w-6 h-6" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-[24px] font-bold leading-[1.2]">{scenario.title}</h1>
            <p className="text-[15px] text-gray-500">{scenario.title_mr}</p>
          </div>
        </div>

        <div className="mt-6 flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-6">
          <div className="rounded-2xl bg-gray-50 border border-gray-200 p-5">
            <p className="text-[13px] font-medium text-gray-500">The scene</p>
            <p className="mt-1 text-[16px]">{scenario.setting}</p>
          </div>

          <section>
            <h2 className="text-[17px] font-semibold">Your goals</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {scenario.goals.map((goal, index) => (
                <li key={goal.id} className="flex items-center gap-3 text-[15px]">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-coral/5 text-coral-strong text-[13px] font-semibold flex items-center justify-center">
                    {index + 1}
                  </span>
                  {goal.label}
                </li>
              ))}
            </ul>
          </section>

          {scenario.key_phrases.length > 0 && (
            <section>
              <h2 className="text-[17px] font-semibold">Helpful phrases</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {scenario.key_phrases.map((phrase) => (
                  <li key={phrase.mr} className="rounded-2xl border border-gray-200 px-4 py-3">
                    <p className="font-semibold text-[17px]">{phrase.mr}</p>
                    <p className="text-[13px] text-gray-500">{phrase.translit} · {phrase.hi}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="text-[13px] text-gray-500">
            Replies are written by Google&apos;s Gemini AI, so please don&apos;t share personal details in the chat.
          </p>
        </div>

        <button
          onClick={startChat}
          className="shrink-0 w-full h-14.5 mt-4 bg-coral-strong text-white rounded-full text-[17px] font-semibold tracking-[-0.2px] flex items-center justify-center cursor-pointer border-none active:opacity-85 active:scale-[0.985] transition-[opacity,transform] duration-150"
        >
          Start conversation
        </button>
      </div>
    )
  }

  if (screen === 'summary') {
    const allDone = goalsDone.length === scenario.goals.length
    return (
      <div className="flex-1 flex flex-col px-4 py-6 min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar">
          <p className="text-[40px] leading-none" aria-hidden="true">{allDone ? '🎉' : '👏'}</p>
          <h1 className="mt-4 text-[28px] font-bold leading-[1.2]">{allDone ? 'शाब्बास! You did it' : 'Good practice!'}</h1>
          <p className="mt-2 text-[15px] text-gray-500">
            {goalsDone.length} of {scenario.goals.length} goals done in {learnerTurns} {learnerTurns === 1 ? 'reply' : 'replies'}.
          </p>

          <ul className="mt-6 flex flex-col gap-2">
            {scenario.goals.map((goal) => {
              const done = goalsDone.includes(goal.id)
              return (
                <li key={goal.id} className="flex items-center gap-3 text-[15px]">
                  {done
                    ? <Check className="w-5 h-5 shrink-0 text-success" />
                    : <Circle className="w-5 h-5 shrink-0 text-gray-300" />}
                  <span className={done ? '' : 'text-gray-500'}>{goal.label}</span>
                </li>
              )
            })}
          </ul>

          {corrections.length > 0 && (
            <section className="mt-8">
              <h2 className="text-[17px] font-semibold">Phrases to remember</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {corrections.map((c, index) => (
                  <li key={index} className="rounded-2xl border border-gray-200 px-4 py-3">
                    <p className="font-semibold text-[17px]">{c.better}</p>
                    <p className="text-[13px] text-gray-500 line-through">{c.said}</p>
                    <p className="mt-1 text-[14px] text-gray-600">{c.note_hi}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <button
          onClick={restart}
          className="shrink-0 w-full h-14.5 mt-4 bg-coral-strong text-white rounded-full text-[17px] font-semibold tracking-[-0.2px] flex items-center justify-center cursor-pointer border-none active:opacity-85 active:scale-[0.985] transition-[opacity,transform] duration-150"
        >
          Practise again
        </button>
        <Link href="/conversations" className="shrink-0 mt-2 h-11 flex items-center justify-center text-[15px] font-semibold text-gray-600">
          Back to conversations
        </Link>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="shrink-0 px-4 pt-3 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-1 -ml-2">
          <Link
            href="/conversations"
            aria-label="Leave the conversation"
            className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-gray-400 active:scale-95 transition-transform duration-150"
          >
            <X className="w-6 h-6" />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[16px] truncate">{scenario.title}</p>
            <p className="text-[13px] text-gray-500">
              Reply {Math.min(learnerTurns + 1, MAX_CONVERSATION_TURNS)} of {MAX_CONVERSATION_TURNS}
            </p>
          </div>
          <p className="shrink-0 rounded-full bg-coral/5 px-3 py-1 text-[13px] font-semibold text-coral-strong">
            {goalsDone.length}/{scenario.goals.length} goals
          </p>
        </div>
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {scenario.goals.map((goal) => {
            const done = goalsDone.includes(goal.id)
            return (
              <li
                key={goal.id}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium ${done ? 'bg-success-bg text-success' : 'bg-gray-100 text-gray-500'}`}
              >
                {done && <Check className="w-3 h-3" />}
                {goal.label}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-4 flex flex-col gap-4">
        {entries.map((entry, index) =>
          entry.role === 'partner' ? (
            <div key={index} className="flex items-end gap-1 max-w-[85%]">
              <button
                type="button"
                onClick={() => toggleMeaning(index)}
                aria-expanded={openMeanings.has(index)}
                className="text-left px-4 py-3 bg-gray-100 rounded-2xl rounded-tl-sm"
              >
                <p className="text-[17px] font-medium">{entry.mr}</p>
                <p className="mt-0.5 text-[13px] text-gray-500">{entry.translit}</p>
                {openMeanings.has(index)
                  ? <p className="mt-2 pt-2 border-t border-gray-200 text-[14px] text-gray-600">{entry.hi}</p>
                  : <p className="mt-1 text-[12px] font-medium text-gray-400">Tap for meaning</p>}
              </button>
              {voice && (
                <button
                  type="button"
                  onClick={() => speak(entry.mr)}
                  aria-label="Play this line"
                  className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center bg-coral/5 text-coral-strong active:scale-95 transition-transform duration-150"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              )}
            </div>
          ) : (
            <div key={index} className="flex flex-col items-end">
              <div className="max-w-[85%] px-4 py-3 bg-coral-strong text-white rounded-2xl rounded-tr-sm">
                <p className="text-[17px]">{entry.text}</p>
              </div>
              {/* Gentle correction under the learner's own line */}
              {entry.correction && (
                <div className="mt-2 max-w-[85%] rounded-xl bg-brand-blue/5 border border-brand-blue/15 px-3 py-2 flex gap-2">
                  <Lightbulb className="w-4 h-4 mt-0.5 shrink-0 text-brand-blue" />
                  <div className="text-[14px]">
                    <p>Better: <span className="font-semibold">{entry.correction.better}</span></p>
                    <p className="text-gray-600">{entry.correction.note_hi}</p>
                  </div>
                </div>
              )}
            </div>
          ),
        )}

        {status === 'sending' && (
          <div className="self-start flex flex-col gap-1">
            <div className="px-4 py-3 bg-gray-100 rounded-2xl rounded-tl-sm flex gap-1" aria-label="Waiting for a reply">
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce [animation-delay:300ms]" />
            </div>
            {slowReply && <p className="text-[13px] text-gray-500 px-1">Still thinking… the AI is slow right now.</p>}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 px-4 pt-3 pb-4 border-t border-gray-200" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)' }}>
        {finished || outOfTurns ? (
          <>
            <p className="mb-3 text-center text-[15px] text-gray-500">
              {finished ? 'All goals done — nicely handled!' : 'That’s the end of this conversation.'}
            </p>
            <button
              onClick={() => setScreen('summary')}
              className="w-full h-14.5 bg-coral-strong text-white rounded-full text-[17px] font-semibold tracking-[-0.2px] flex items-center justify-center cursor-pointer border-none active:opacity-85 active:scale-[0.985] transition-[opacity,transform] duration-150"
            >
              See how you did
            </button>
          </>
        ) : (
          <>
            {(status === 'busy' || status === 'error') && (
              <div className="mb-3 rounded-xl bg-error-bg px-4 py-3 text-[14px] text-error" role="alert">
                {status === 'busy'
                  ? 'The AI partner is busy right now. Try again after some time.'
                  : 'Something went wrong. Please try sending again.'}
              </div>
            )}
            {micError && <p className="mb-3 text-[14px] text-error" role="alert">{micError}</p>}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                send()
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={listening ? 'Listening…' : 'Type in Marathi…'}
                maxLength={300}
                lang="mr"
                className="flex-1 min-w-0 h-12 rounded-full border border-gray-200 bg-gray-50 px-4 text-[16px] outline-none focus:border-gray-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || status === 'sending' || listening}
                aria-label="Send"
                className="w-12 h-12 shrink-0 rounded-full bg-coral-strong text-white flex items-center justify-center active:scale-95 transition-transform duration-150 disabled:opacity-40"
              >
                <SendHorizontal className="w-5 h-5" />
              </button>
            </form>

            {canListen ? (
              <button
                type="button"
                onPointerDown={startListening}
                onPointerUp={stopListening}
                onPointerLeave={stopListening}
                onPointerCancel={stopListening}
                onContextMenu={(e) => e.preventDefault()}
                disabled={status === 'sending'}
                className={`mt-3 w-full h-14.5 rounded-full text-[17px] font-semibold flex items-center justify-center gap-2 select-none touch-none transition-[background-color,transform] duration-150 disabled:opacity-40 ${
                  listening ? 'bg-coral text-white scale-[0.985]' : 'bg-coral/5 text-coral-strong'
                }`}
              >
                <Mic className={`w-5 h-5 ${listening ? 'animate-pulse' : ''}`} />
                {listening ? 'Listening… let go when done' : 'Hold to speak'}
              </button>
            ) : (
              <p className="mt-3 text-center text-[13px] text-gray-500">Speaking works in Chrome. Type your reply here instead.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default ConversationChat
