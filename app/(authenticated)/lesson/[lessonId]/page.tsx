'use client'

import { useRouter, useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import MobileNavBar from '@/components/nav/AppFooter'
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

type Screen = 'intro' | 'active' | 'finished'

export default function LessonPage() {
  const router = useRouter()
  const params = useParams()
  const lessonId = params.lessonId as string
  const [lesson, setLesson] = useState<LessonDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [screen, setScreen] = useState<Screen>('intro')
  const [streak, setStreak] = useState<number | null>(null)

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const response = await fetch(`/api/lessons/${lessonId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch lesson')
        }
        const data = await response.json()
        setLesson(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (lessonId) {
      fetchLesson()
    }
  }, [lessonId])

  const phrasesById = useMemo(() => {
    const map = new Map<string, Phrase>()
    lesson?.phrases.forEach((phrase) => map.set(phrase.id, phrase))
    return map
  }, [lesson])

  const handleStart = async () => {
    if (!lesson) return
    await fetch('/api/me/progress/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson_id: lesson.id, module_id: lesson.module_id }),
    })
    setScreen('active')
  }

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
      <div className="flex flex-col min-h-dvh pb-16">
        <div className="fixed inset-0 flex justify-center">
          <div className="w-full max-w-107.5 min-h-dvh bg-white flex items-center justify-center px-7">
            <p className="text-[#8A8A96]">Loading lesson...</p>
          </div>
        </div>
        <MobileNavBar />
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="flex flex-col min-h-dvh pb-16">
        <div className="fixed inset-0 flex justify-center">
          <div className="w-full max-w-107.5 min-h-dvh bg-white flex flex-col items-center justify-center px-7">
            <p className="text-coral font-semibold">{error || 'Lesson not found'}</p>
            <button
              onClick={() => router.back()}
              className="mt-6 px-6 h-11 bg-[#111111] text-white rounded-full font-semibold text-[15px] hover:opacity-90 transition-opacity"
            >
              Go Back
            </button>
          </div>
        </div>
        <MobileNavBar />
      </div>
    )
  }

  if (screen === 'finished') {
    return (
      <div className="flex flex-col min-h-dvh pb-16">
        <div className="fixed inset-0 flex justify-center">
          <div className="w-full max-w-107.5 min-h-dvh bg-white flex flex-col items-center justify-center px-7 text-center">
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
        </div>
        <MobileNavBar />
      </div>
    )
  }

  if (screen === 'active') {
    return (
      <div className="flex flex-col min-h-dvh pb-16">
        <div className="fixed inset-0 flex justify-center">
          <div className="w-full max-w-107.5 min-h-dvh bg-white flex flex-col px-7 pt-6 pb-10">
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
        </div>
        <MobileNavBar />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-dvh pb-16">
      <div className="fixed inset-0 flex justify-center">
        <div className="w-full max-w-107.5 min-h-dvh bg-white flex flex-col px-7 pt-6 pb-10">
          <div className="flex-1 overflow-y-auto">
            <h1 className="text-[32px] font-bold text-[#111111] leading-[1.2]">
              {lesson.title}
            </h1>

            <div className="mt-6 p-6 bg-[#F9F9F9] rounded-2xl border border-[#E0E0E0]">
              <p className="text-base font-normal leading-[1.58] text-[#333333]">
                {lesson.intro_text}
              </p>
            </div>

            {lesson.phrases && lesson.phrases.length > 0 && (
              <div className="mt-8">
                <h2 className="text-[20px] font-bold text-[#111111] mb-4">Phrases</h2>
                <div className="space-y-3">
                  {lesson.phrases.map((phrase) => (
                    <div
                      key={phrase.id}
                      className="p-4 bg-white border border-[#E0E0E0] rounded-xl"
                    >
                      <p className="font-semibold text-[#111111]">{phrase.source}</p>
                      <p className="text-sm text-[#8A8A96] mt-1">{phrase.target}</p>
                      {phrase.transliteration && (
                        <p className="text-sm text-[#8A8A96] mt-1 italic">
                          {phrase.transliteration}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleStart}
            className="w-full h-14.5 mt-8 bg-[#111111] text-white rounded-full text-[17px] font-semibold tracking-[-0.2px] flex items-center justify-center cursor-pointer border-none active:opacity-85 active:scale-[0.985] transition-[opacity,transform] duration-150 shrink-0"
          >
            Start Lesson
          </button>
        </div>
      </div>
      <MobileNavBar />
    </div>
  )
}
