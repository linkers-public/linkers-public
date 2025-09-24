import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/supabase/supabase-server'

type AccountType = 'personal' | 'client'
type Role = 'MAKER' | 'MANAGER'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const accountType = searchParams.get('type') as AccountType
  const role = searchParams.get('role') as Role
  let next = searchParams.get('next') ?? '/'
  
  // 보안을 위해 next가 /로 시작하는지 확인
  if (!next.startsWith('/')) next = '/'

  if (code) {
    const supabase = await createServerSideClient()

    const { data: session, error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError || !session) {
      return NextResponse.redirect(`${origin}/auth/auth-code-error`)
    }

    // 사용자 정보를 계정 타입에 따라 적절한 테이블에 저장
    if (session.user) {
      const userId = session.user.id
      const userEmail = session.user.email || ''
      const userName = session.user.user_metadata?.name || 
                      session.user.email?.split('@')[0] || 
                      `user_${userId.slice(0, 8)}`

      if (accountType === 'client') {
        // 기업 사용자 → client 테이블에 upsert
        const { error: upsertError } = await supabase
          .from('client')
          .upsert({
            user_id: userId,
            email: userEmail,
            company_name: null, // 온보딩에서 수집
            contact_info: null,
            client_status: 'active'
          }, { 
            onConflict: 'user_id' 
          })

        if (upsertError) {
          console.error('Failed to upsert client account:', upsertError)
        }
      } else {
        // 개인 사용자 → accounts 테이블에 upsert
        const { error: upsertError } = await supabase
          .from('accounts')
          .upsert({
            user_id: userId,
            username: userName,
            bio: '',
            role: role || 'MAKER', // 기본값은 MAKER
            main_job: [],
            expertise: []
          }, { 
            onConflict: 'user_id' 
          })

        if (upsertError) {
          console.error('Failed to upsert account:', upsertError)
        }
      }
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
