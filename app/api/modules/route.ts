import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getModulesByLanguagePair } from '@/lib/data/modules'
import { NotFoundError } from '@/lib/data/errors'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const languagePair = searchParams.get('language_pair')

  if (!languagePair) {
    return NextResponse.json(
      { error: 'language_pair query param is required' },
      { status: 400 }
    )
  }

  const supabase = await createClient()

  try {
    const modules = await getModulesByLanguagePair(supabase, languagePair)
    return NextResponse.json(modules)
  } catch (e) {
    if (e instanceof NotFoundError) {
      return NextResponse.json({ error: e.message }, { status: 404 })
    }
    return NextResponse.json({ error: 'Failed to fetch modules' }, { status: 500 })
  }
}
