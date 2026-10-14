import { type NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

// Email links that carry a `token_hash` (set in the Supabase email templates).
// Unlike `/auth/callback?code=…`, this works even when the email is opened in a
// different browser or app than the one that asked for it.
export const GET = async (request: NextRequest) => {
  const { searchParams, origin } = request.nextUrl
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const nextParam = searchParams.get('next')
  const next = nextParam?.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/'
  const failurePath = type === 'recovery' ? '/forgot-password?error=link' : '/login?error=auth'

  if (!tokenHash || !type) {
    return NextResponse.redirect(new URL(failurePath, origin))
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })

  if (error) {
    return NextResponse.redirect(new URL(failurePath, origin))
  }

  return NextResponse.redirect(new URL(type === 'recovery' ? '/reset-password' : next, origin))
}
