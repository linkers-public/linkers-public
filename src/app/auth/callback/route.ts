import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/supabase/supabase-server'

type Role = 'MAKER' | 'MANAGER' | 'NONE'

export async function GET(request: Request) {
  const overrideOrigin = process.env.NEXT_PUBLIC_AUTH_REDIRECT_HOME
  const { searchParams, origin } = new URL(request.url)

  const code = searchParams.get('code')

  if (code) {
    const supabase = await createServerSideClient()

    const { data: session, error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code)
    if (sessionError || !session) {
      return NextResponse.redirect(`${overrideOrigin}`)
    }

    return NextResponse.redirect(`${overrideOrigin}`)
  }

  return NextResponse.redirect(`${overrideOrigin}`)
}
