'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import LessonEngine from '@/components/lesson/LessonEngine'
import type { LessonStep, Phrase, StepAttempt } from '@/components/lesson/types'
import type { UserProgressStatus } from '@/lib/types'

interface LessonDetail {
  id: string
  title: string
  module_id: string
  phrases: Phrase[]
  steps: LessonStep[]
  status: UserProgressStatus
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
        if (data.status !== 'completed') {
          await fetch('/api/me/progress/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lesson_id: data.id, module_id: data.module_id }),
          })
        }
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

  const handleComplete = async (attempts: StepAttempt[]) => {
    if (!lesson) return
    try {
      const response = await fetch('/api/me/progress/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lesson_id: lesson.id, module_id: lesson.module_id, attempts }),
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
      <div className="flex-1 flex flex-col px-7 py-8 overflow-y-auto min-h-0">
        <h1 className="text-[28px] font-bold leading-[1.2]">{lesson.title}</h1>
        <p className="mt-2 text-[15px] text-gray-500">
          Here are the phrases you&apos;ll learn in this lesson. Keep them in mind before you start.
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3">
          {lesson.phrases.map((phrase) => (
            <div
              key={phrase.id}
              className="flex flex-col gap-1 px-5 py-4 rounded-2xl border border-gray-200"
            >
              <p className="font-semibold text-[17px]">{phrase.target}</p>
              {phrase.transliteration && (
                <p className="text-[13px] text-gray-500">{phrase.transliteration}</p>
              )}
              <p className="text-[15px] text-gray-500">{phrase.source}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => setScreen('active')}
          className="w-full h-14.5 mt-8 bg-coral-strong text-white rounded-full text-[17px] font-semibold tracking-[-0.2px] flex items-center justify-center cursor-pointer border-none active:opacity-85 active:scale-[0.985] transition-[opacity,transform] duration-150"
        >
          Start Lesson
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
        <LessonEngine steps={lesson.steps} phrasesById={phrasesById} onComplete={handleComplete} />
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
