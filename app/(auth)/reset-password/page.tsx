'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import type { ResetPasswordStatus } from '@/lib/types'

const ResetPasswordPage = () => {
  const [status, setStatus] = useState<ResetPasswordStatus>('checking')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // The reset link signs the user in (via /auth/callback). No session means the link expired or was never opened.
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data: { user } }) => setStatus(user ? 'ready' : 'expired'))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (error) {
      if (error.code === 'same_password') {
        setError('That’s your current password — choose a new one')
      } else if (error.code === 'session_not_found' || error.status === 401) {
        setStatus('expired')
      } else {
        setError(error.message)
      }
      return
    }

    setStatus('done')
  }

  if (status === 'checking') {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-white">
        <p className="text-sm text-gray-500">Checking your link…</p>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className="min-h-dvh flex justify-center bg-white">
        <div className="w-full max-w-107.5 px-7 pt-24 pb-10 flex flex-col items-center text-center">
          <h2 className="text-[28px] font-bold leading-[1.2] mb-3">This link has expired</h2>
          <p className="text-gray-500 text-[15px]">
            Reset links work once and only for a short while. Ask for a new one and open it in this browser.
          </p>
          <Link
            href="/forgot-password"
            className="w-full h-14 mt-10 bg-coral-strong text-white rounded-full text-[17px] font-semibold tracking-[-0.2px] flex items-center justify-center active:opacity-85 active:scale-[0.985] transition-[opacity,transform] duration-150"
          >
            Send a new link
          </Link>
          <Link href="/login" className="mt-4 text-sm text-gray-500 py-3">
            Back to sign in
          </Link>
        </div>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="min-h-dvh flex justify-center bg-white">
        <div className="w-full max-w-107.5 px-7 pt-24 pb-10 flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-success-bg rounded-full flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-[28px] font-bold leading-[1.2] mb-3">Password updated</h2>
          <p className="text-gray-500 text-[15px]">
            You&apos;re signed in. Your streak and progress are right where you left them.
          </p>
          <Link
            href="/"
            className="w-full h-14 mt-10 bg-coral-strong text-white rounded-full text-[17px] font-semibold tracking-[-0.2px] flex items-center justify-center active:opacity-85 active:scale-[0.985] transition-[opacity,transform] duration-150"
          >
            Continue learning
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex justify-center bg-white">
      <div className="w-full max-w-107.5 px-7 pt-16 pb-10 flex flex-col">
        <div className="mb-8">
          <h1 className="text-[32px] font-bold leading-[1.16] tracking-[-0.8px]">Set a new password</h1>
          <p className="mt-2 text-base text-gray-500">At least 8 characters.</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              New password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-[16px] placeholder-gray-400 focus:outline-none focus:bg-white focus:border-coral focus:ring-2 focus:ring-coral/20 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5">
              Confirm new password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-[16px] placeholder-gray-400 focus:outline-none focus:bg-white focus:border-coral focus:ring-2 focus:ring-coral/20 transition-colors"
              placeholder="••••••••"
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
            {loading ? 'Saving…' : 'Save new password'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPasswordPage
