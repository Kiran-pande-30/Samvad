'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface LanguagePair {
  id: string
  source_lang: string
  target_lang: string
  slug: string
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedLanguage, setSelectedLanguage] = useState<string>('hindi')
  const [selectedPairId, setSelectedPairId] = useState<string>('')
  const [displayName, setDisplayName] = useState<string>('')
  const [languagePairs, setLanguagePairs] = useState<LanguagePair[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch display_name on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', user.id)
          .single()
        if (data?.display_name) {
          setDisplayName(data.display_name)
        }
      }
    }
    fetchProfile()
  }, [])

  // Fetch language pairs when reaching screen 3
  useEffect(() => {
    if (step !== 3) return
    const fetchPairs = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('language_pairs')
        .select('id, source_lang, target_lang, slug')
        .eq('is_active', true)
        .eq('source_lang', selectedLanguage)
      if (data) {
        setLanguagePairs(data)
        if (data.length > 0) {
          setSelectedPairId(data[0].id)
        }
      }
    }
    fetchPairs()
  }, [step, selectedLanguage])

  const handleSubmit = async () => {
    if (!selectedPairId) {
      setError('Please select a language pair')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          native_language: selectedLanguage,
          active_language_pair_id: selectedPairId,
          onboarding_completed: true,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to complete onboarding')
      }

      router.push('/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Progress indicator - visible on screens 2 and 3 */}
      {step !== 1 && (
        <div className="flex justify-center gap-2 pt-8">
          <div className="w-2 h-2 rounded-full bg-gray-900 opacity-30"></div>
          <div className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-gray-900' : 'bg-gray-900 opacity-30'}`}></div>
          <div className={`w-2 h-2 rounded-full ${step >= 3 ? 'bg-gray-900' : 'bg-gray-900 opacity-30'}`}></div>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-12">
        {step === 1 && (
          <div className="w-full max-w-md text-center">
            <h1 className="text-3xl font-bold mb-2 text-gray-900">
              Welcome, {displayName || 'there'}!
            </h1>
            <p className="text-gray-600 mb-8">
              Let's get you set up in 2 quick steps.
            </p>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 px-6 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition"
            >
              Get Started
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold mb-2 text-gray-900 text-center">
              What language do you speak at home?
            </h2>
            <p className="text-gray-600 text-center mb-8">
              We'll use this to explain things in a way that makes sense to you.
            </p>

            <div className="space-y-3 mb-8">
              {/* Hindi card - only option for MVP */}
              <button
                onClick={() => setSelectedLanguage('hindi')}
                className={`w-full p-4 rounded-lg border-2 transition text-left ${
                  selectedLanguage === 'hindi'
                    ? 'border-gray-900 bg-gray-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">हिन्दी (Hindi)</span>
                  {selectedLanguage === 'hindi' && (
                    <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            </div>

            <p className="text-sm text-gray-500 text-center mb-8">
              More languages coming soon
            </p>

            <button
              onClick={() => setStep(3)}
              className="w-full py-3 px-6 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition"
            >
              Continue
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="w-full max-w-md">
            <h2 className="text-2xl font-bold mb-2 text-gray-900 text-center">
              What do you want to learn?
            </h2>
            <p className="text-gray-600 text-center mb-8">
              Pick the language you need for daily life.
            </p>

            <div className="space-y-3 mb-8">
              {languagePairs.length > 0 ? (
                languagePairs.map((pair) => (
                  <button
                    key={pair.id}
                    onClick={() => setSelectedPairId(pair.id)}
                    className={`w-full p-4 rounded-lg border-2 transition text-left ${
                      selectedPairId === pair.id
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {pair.source_lang.charAt(0).toUpperCase() + pair.source_lang.slice(1)} → {pair.target_lang.charAt(0).toUpperCase() + pair.target_lang.slice(1)}
                        </div>
                        <div className="text-sm text-gray-500">
                          For life in {pair.target_lang.charAt(0).toUpperCase() + pair.target_lang.slice(1)}
                        </div>
                      </div>
                      {selectedPairId === pair.id && (
                        <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Loading language pairs...
                </div>
              )}
            </div>

            <p className="text-sm text-gray-500 text-center mb-8">
              More pairs coming soon
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedPairId}
              className="w-full py-3 px-6 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              )}
              {isSubmitting ? 'Starting...' : 'Start Learning'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
