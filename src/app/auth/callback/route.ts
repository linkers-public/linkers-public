import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/supabase/supabase-server'

type Role = 'MAKER' | 'MANAGER' | 'NONE'
type UserRole = 'maker' | 'manager'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const role = searchParams.get('role') as UserRole
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

    // 사용자 정보를 역할에 따라 적절한 테이블에 저장
    if (session.user) {
      const userId = session.user.id
      const userEmail = session.user.email || ''
      const userName = session.user.email?.split('@')[0] || `user_${userId.slice(0, 8)}`

      if (role === 'manager') {
        // 기업 사용자 → client 테이블에 저장
        const { data: existingClient } = await supabase
          .from('client')
          .select('user_id')
          .eq('user_id', userId)
          .single()

        if (!existingClient) {
          const { error: insertError } = await supabase
            .from('client')
            .insert({
              user_id: userId,
              company_name: null,
              email: userEmail,
              contact_info: null,
              client_status: 'active'
            })

          if (insertError) {
            console.error('Failed to create client account:', insertError)
          }
        }
      } else {
        // 메이커/매니저 사용자 → accounts 테이블에 저장
        const { data: existingAccount } = await supabase
          .from('accounts')
          .select('user_id')
          .eq('user_id', userId)
          .single()

        if (!existingAccount) {
          const { error: insertError } = await supabase
            .from('accounts')
            .insert({
              user_id: userId,
              username: userName,
              bio: '',
              role: role === 'maker' ? 'MAKER' : 'MANAGER',
              main_job: [],
              expertise: []
            })

          if (insertError) {
            console.error('Failed to create account:', insertError)
          }
        }
      }
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
