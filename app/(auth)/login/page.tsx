'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Enter your email and password')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      if (error.message.toLowerCase().includes('invalid login credentials') ||
          error.message.toLowerCase().includes('wrong') ||
          error.message.toLowerCase().includes('invalid')) {
        setError('Incorrect email or password')
      } else if (error.message.toLowerCase().includes('email not confirmed') ||
                 error.message.toLowerCase().includes('not verified')) {
        setError('Please verify your email before signing in')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    router.push('/')
  }

  async function handleGoogleLogin() {
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

  return (
    <div className="min-h-dvh flex justify-center bg-white">
      <div className="w-full max-w-107.5 px-7 pt-16 pb-10 flex flex-col">
        <div className="mb-10">
          <h1 className="text-[38px] font-bold leading-[1.16] tracking-[-1px]">Samvad</h1>
          <p className="mt-2 text-base text-gray-500">Learn the language of your new home</p>
        </div>

        <form onSubmit={handleEmailLogin} noValidate className="space-y-4">
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? 'Signing in…' : 'Sign in'}
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
          onClick={handleGoogleLogin}
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
          Sign in with Google
        </button>

        <p className="mt-8 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-coral-strong font-semibold">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}
