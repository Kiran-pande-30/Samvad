import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const { origin } = new URL(request.url)

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=auth', origin))
  }

  const supabase = await createClient()

  try {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    if (exchangeError) {
      return NextResponse.redirect(new URL('/login?error=auth', origin))
    }

    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData.user) {
      return NextResponse.redirect(new URL('/login?error=auth', origin))
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userData.user.id)
      .single()

    if (profileError || !profile.onboarding_completed) {
      return NextResponse.redirect(new URL('/', origin))
    }

    return NextResponse.redirect(new URL('/', origin))
  } catch {
    return NextResponse.redirect(new URL('/login?error=auth', origin))
  }
}
