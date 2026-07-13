'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import LessonEngine from '@/components/lesson/LessonEngine'
import type { LessonStep, Phrase, StepAttempt } from '@/components/lesson/types'

interface LessonDetail {
  id: string
  title: string
  intro_text: string
  module_id: string
  phrases: Phrase[]
  steps: LessonStep[]
}

type Screen = 'active' | 'finished'

const LessonPage = () => {
  const router = useRouter()
  const params = useParams()
  const lessonId = params.lessonId as string
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [screen, setScreen] = useState<Screen>('active')
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

  const handleComplete = async (attempts: StepAttempt[]) => {
    if (!lesson) return
    const response = await fetch('/api/me/progress/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson_id: lesson.id, module_id: lesson.module_id, attempts }),
    })
    const data = await response.json()
    setStreak(data.streak ?? null)
    setScreen('finished')
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center px-7">
        <p className="text-[#8A8A96]">Loading lesson...</p>
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-7">
        <p className="text-coral font-semibold">{error || 'Lesson not found'}</p>
        <button
          onClick={() => router.back()}
          className="mt-6 px-6 h-11 bg-[#111111] text-white rounded-full font-semibold text-[15px] hover:opacity-90 transition-opacity"
        >
          Go Back
        </button>
      </div>
    )
  }

  if (screen === 'finished') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-7 text-center">
        <h1 className="text-[32px] font-bold text-[#111111] leading-[1.2]">Lesson complete!</h1>
        {streak !== null && (
          <p className="mt-4 text-[18px] text-[#8A8A96]">
            Current streak: <span className="font-bold text-[#111111]">{streak}</span> day
            {streak === 1 ? '' : 's'}
          </p>
        )}
        <button
          onClick={() => router.push('/')}
          className="w-full max-w-72 h-14.5 mt-10 bg-[#111111] text-white rounded-full text-[17px] font-semibold tracking-[-0.2px] flex items-center justify-center cursor-pointer border-none active:opacity-85 active:scale-[0.985] transition-[opacity,transform] duration-150"
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
          <p className="text-[#8A8A96]">This lesson has no steps yet.</p>
          <button
            onClick={() => router.back()}
            className="mt-6 px-6 h-11 bg-[#111111] text-white rounded-full font-semibold text-[15px]"
          >
            Go Back
          </button>
        </div>
      )}
    </div>
  )
}

export default LessonPage
