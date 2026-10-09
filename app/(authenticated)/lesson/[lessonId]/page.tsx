'use client'

import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import LessonEngine from '@/components/lesson/LessonEngine'
import PlayAudioButton from '@/components/lesson/PlayAudioButton'
import type { LessonStep, Phrase } from '@/components/lesson/types'
import type { LessonResume, UserProgressStatus } from '@/lib/types'

interface LessonDetail {
  id: string
  title: string
  module_id: string
  phrases: Phrase[]
  steps: LessonStep[]
  status: UserProgressStatus
  resume: LessonResume | null
}

type Screen = 'preview' | 'active' | 'finished'

const LessonPage = () => {
  const router = useRouter()
  const params = useParams()
  const lessonId = params.lessonId as string
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [screen, setScreen] = useState<Screen>('preview')
  const [streak, setStreak] = useState<number | null>(null)

  useEffect(() => {
    const fetchAndStartLesson = async () => {
      try {
        const response = await fetch(`/api/lessons/${lessonId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch lesson')
        }
        const data: LessonDetail = await response.json()
        setLesson(data)
        // Always call start: for a completed lesson it begins a fresh run
        // (resets started_at) without un-completing it.
        await fetch('/api/me/progress/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lesson_id: data.id, module_id: data.module_id }),
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (lessonId) {
      fetchAndStartLesson()
    }
  }, [lessonId])

  const phrasesById = useMemo(() => {
    const map = new Map<string, Phrase>()
    lesson?.phrases.forEach((phrase) => map.set(phrase.id, phrase))
    return map
  }, [lesson])

  const handleComplete = async () => {
    if (!lesson) return
    try {
      const response = await fetch('/api/me/progress/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lesson.id, module_id: lesson.module_id }),
      })
      if (!response.ok) {
        throw new Error('Failed to save progress')
      }
      const data = await response.json()
      setStreak(data.streak ?? null)
      setScreen('finished')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save progress')
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center px-7">
        <p className="text-gray-500">Loading lesson...</p>
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-7">
        <p className="text-coral-strong font-semibold">{error || 'Lesson not found'}</p>
        <button
          onClick={() => router.back()}
          className="mt-6 px-6 h-11 bg-coral-strong text-white rounded-full font-semibold text-[15px] hover:opacity-90 transition-opacity"
        >
          Go Back
        </button>
      </div>
    )
  }

  if (screen === 'preview') {
    return (
      <div className="flex-1 flex flex-col px-7 pt-6 pb-6 min-h-0">
        <Link
          href="/"
          aria-label="Back to lessons"
          className="w-11 h-11 -ml-3 mb-2 shrink-0 rounded-full flex items-center justify-center text-gray-400 active:scale-95 transition-transform duration-150"
        >
          <X className="w-6 h-6" />
        </Link>
        <h1 className="shrink-0 text-[28px] font-bold leading-[1.2]">{lesson.title}</h1>
        <p className="shrink-0 mt-2 text-[15px] text-gray-500">
          Here are the phrases you&apos;ll learn in this lesson. Keep them in mind before you start.
        </p>

        {/* Only the phrase list scrolls, so Start Lesson stays on screen */}
        <ul className="mt-6 flex-1 min-h-0 overflow-y-auto no-scrollbar flex flex-col gap-2">
          {lesson.phrases.map((phrase) => (
            <li
              key={phrase.id}
              className="flex items-center gap-2 pl-4 pr-1 py-2.5 rounded-2xl border border-gray-200"
            >
              {/* One line: Marathi (transliteration) · Hindi — wraps only if it must */}
              <p className="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-1.5 leading-snug">
                <span className="font-semibold text-[17px]">{phrase.target}</span>
                {phrase.transliteration && (
                  <span className="text-[13px] text-gray-500">({phrase.transliteration})</span>
                )}
                <span className="text-[15px] text-gray-500">· {phrase.source}</span>
              </p>
              {phrase.audio_url && (
                <PlayAudioButton
                  src={phrase.audio_url}
                  label={`Play ${phrase.target}`}
                  className="shrink-0 text-coral-strong"
                />
              )}
            </li>
          ))}
        </ul>

        <button
          onClick={() => setScreen('active')}
          className="shrink-0 w-full h-14.5 mt-4 bg-coral-strong text-white rounded-full text-[17px] font-semibold tracking-[-0.2px] flex items-center justify-center cursor-pointer border-none active:opacity-85 active:scale-[0.985] transition-[opacity,transform] duration-150"
        >
          {lesson.resume ? `Continue · ${lesson.resume.done} of ${lesson.steps.length} done` : 'Start Lesson'}
        </button>
      </div>
    )
  }

  if (screen === 'finished') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-7 text-center">
        <h1 className="text-[32px] font-bold leading-[1.2]">Lesson complete!</h1>
        {streak !== null && (
          <p className="mt-4 text-[18px] text-gray-500">
            Current streak: <span className="font-bold">{streak}</span> day
            {streak === 1 ? '' : 's'}
          </p>
        )}
        <button
          onClick={() => router.push('/')}
          className="w-full max-w-72 h-14.5 mt-10 bg-coral-strong text-white rounded-full text-[17px] font-semibold tracking-[-0.2px] flex items-center justify-center cursor-pointer border-none active:opacity-85 active:scale-[0.985] transition-[opacity,transform] duration-150"
        >
          Back to lessons
        </button>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col px-4 py-6 min-h-0">
      {lesson.steps.length > 0 ? (
        <LessonEngine steps={lesson.steps} phrasesById={phrasesById} resume={lesson.resume} onComplete={handleComplete} />
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <p className="text-gray-500">This lesson has no steps yet.</p>
          <button
            onClick={() => router.back()}
            className="mt-6 px-6 h-11 bg-coral-strong text-white rounded-full font-semibold text-[15px]"
          >
            Go Back
          </button>
        </div>
      )}
    </div>
  )
}

export default LessonPage
