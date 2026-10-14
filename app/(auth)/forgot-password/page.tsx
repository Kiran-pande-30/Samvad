'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { Lightbulb } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { AuthPageProps } from '@/lib/types'

const ForgotPasswordPage = ({ searchParams }: AuthPageProps) => {
  const { error: linkError } = use(searchParams)
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Enter the email you signed up with')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    setLoading(false)

    if (error) {
      if (error.status === 429 || error.message.toLowerCase().includes('rate limit')) {
        setError('Too many requests — wait a minute and try again')
      } else {
        setError(error.message)
      }
      return
    }

    // Same screen whether or not the email has an account, so nobody can probe which emails are registered.
    setSent(true)
  }

  if (sent) {
    return (
      <div className="min-h-dvh flex justify-center bg-white">
        <div className="w-full max-w-107.5 px-7 pt-24 pb-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-coral/10 rounded-full flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-coral-strong" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-[28px] font-bold leading-[1.2] mb-3">Check your email</h2>
          <p className="text-gray-500 text-[15px]">
            If <span className="font-semibold">{email.trim()}</span> has a Samvad account, we&apos;ve sent it a link to set a new password.
          </p>
          <p className="mt-3 text-gray-500 text-sm">Open the link in this browser. It works once.</p>
          <p className="mt-8 text-sm text-gray-500">
            Didn&apos;t get it?{' '}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-coral-strong font-semibold cursor-pointer py-3"
            >
              Try again
            </button>
          </p>
          <Link href="/login" className="mt-2 text-sm text-gray-500 py-3">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex justify-center bg-white">
      <div className="w-full max-w-107.5 px-7 pt-16 pb-10 flex flex-col">
        <div className="mb-8">
          <h1 className="text-[32px] font-bold leading-[1.16] tracking-[-0.8px]">Forgot your password?</h1>
          <p className="mt-2 text-base text-gray-500">
            Enter your email and we&apos;ll send you a link to set a new one.
          </p>
        </div>

        {linkError && (
          <div className="mb-6 flex gap-3 bg-brand-blue/5 border border-brand-blue/15 rounded-xl p-4">
            <Lightbulb className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm">
              That reset link has expired or was already used. Ask for a new one below.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-[16px] placeholder-gray-400 focus:outline-none focus:bg-white focus:border-coral focus:ring-2 focus:ring-coral/20 transition-colors"
              placeholder="you@example.com"
            />
          </div>

          {error && (
            <p role="alert" className="text-error text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-14 mt-2 bg-coral-strong text-white rounded-full text-[17px] font-semibold tracking-[-0.2px] flex items-center justify-center cursor-pointer active:opacity-85 active:scale-[0.985] transition-[opacity,transform] duration-150 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? 'Sending link…' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500">
          Remembered it?{' '}
          <Link href="/login" className="text-coral-strong font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPasswordPage
