'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim() || !email.trim()) {
      setError('Enter your name and email')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      if (error.message.toLowerCase().includes('already registered') ||
          error.message.toLowerCase().includes('already exists') ||
          error.message.toLowerCase().includes('user already')) {
        setError('An account with this email already exists')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  async function handleGoogleSignup() {
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
    // On success: browser is redirected by OAuth — no manual push needed
  }

  if (success) {
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
            We sent a confirmation link to <span className="font-semibold">{email}</span>. Click it to activate your account.
          </p>
          <p className="mt-6 text-sm text-gray-500">
            Already confirmed?{' '}
            <Link href="/login" className="text-coral-strong font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex justify-center bg-white">
      <div className="w-full max-w-107.5 px-7 pt-16 pb-10 flex flex-col">
        <div className="mb-10">
          <h1 className="text-[38px] font-bold leading-[1.16] tracking-[-1px]">Samvad</h1>
          <p className="mt-2 text-base text-gray-500">Learn the language of your new home</p>
        </div>

        <form onSubmit={handleEmailSignup} noValidate className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1.5">
              Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 rounded-xl border border-gray-200 bg-gray-50 px-4 text-[16px] placeholder-gray-400 focus:outline-none focus:bg-white focus:border-coral focus:ring-2 focus:ring-coral/20 transition-colors"
              placeholder="Your name"
            />
          </div>

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

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1.5">
              Password
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
              Confirm password
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
            className="w-full h-14 mt-2 bg-coral-strong text-white rounded-full text-[17px] font-semibold tracking-[-0.2px] flex items-center justify-center cursor-pointer active:opacity-85 active:scale-[0.985] transition-[opacity,transform] duration-150 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-xs text-gray-400 bg-white px-2">
            or
          </div>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignup}
          disabled={loading}
          className="w-full h-12 flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-full text-[15px] font-medium cursor-pointer active:scale-[0.985] transition-transform duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"
            />
          </svg>
          Sign up with Google
        </button>

        <p className="mt-8 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-coral-strong font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
