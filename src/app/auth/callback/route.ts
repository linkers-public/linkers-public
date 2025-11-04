import { NextResponse } from 'next/server'
import { createServerSideClient } from '@/supabase/supabase-server'
import { Database } from '@/types/supabase'

type ProfileType = Database['public']['Enums']['profile_type']

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const profileType = searchParams.get('profile_type') as ProfileType
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

    // 사용자 정보를 프로필 타입에 따라 accounts 테이블에 저장
    if (session.user) {
      const userId = session.user.id
      const userEmail = session.user.email || ''
      const userName = session.user.user_metadata?.name || 
                      session.user.email?.split('@')[0] || 
                      `user_${userId.slice(0, 8)}`

      // 프로필 타입이 지정된 경우에만 프로필 생성
      if (profileType) {
        const { data: existingProfile } = await supabase
          .from('accounts')
          .select('user_id, profile_type')
          .eq('user_id', userId)
          .eq('profile_type', profileType)
          .is('deleted_at', null)
          .maybeSingle()

        // 같은 타입의 프로필이 없으면 생성
        if (!existingProfile) {
          const { error: upsertError } = await supabase
            .from('accounts')
            .upsert({
              user_id: userId,
              username: userName,
              profile_type: profileType,
              bio: '',
              role: profileType === 'FREELANCER' ? 'MAKER' : 'MANAGER',
              main_job: [],
              expertise: [],
              badges: [],
              is_active: true,
              availability_status: 'available',
              profile_created_at: new Date().toISOString()
            }, { 
              onConflict: 'user_id',
              ignoreDuplicates: false
            })

          if (upsertError) {
            console.error('Failed to upsert account:', upsertError)
          }
        }
      } else {
        // 프로필 타입이 없는 경우 (기존 사용자), 기존 프로필 유지
        // 새로운 사용자는 프로필 타입 선택 후 프로필 생성 페이지로 이동하도록
        const { data: existingAccount } = await supabase
          .from('accounts')
          .select('user_id')
          .eq('user_id', userId)
          .maybeSingle()

        // 프로필이 없으면 프로필 생성 페이지로 리다이렉트
        if (!existingAccount) {
          return NextResponse.redirect(`${origin}/my/profile/create`)
        }
      }
    }

    return NextResponse.redirect(`${origin}${next}`)
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
