'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// 싱글톤 클라이언트 인스턴스
let supabaseBrowserClientInstance: SupabaseClient<Database> | null = null

// 브라우저용 싱글톤 클라이언트 (직접 사용 권장)
// ✅ 'use client' 필수: SSR 환경에서 localStorage 접근 방지
export const supabaseBrowserClient = ((): SupabaseClient<Database> => {
  // 이미 생성된 인스턴스가 있으면 재사용
  if (supabaseBrowserClientInstance) {
    return supabaseBrowserClientInstance
  }
  
  // ✅ 브라우저 환경에서만 클라이언트 생성
  if (typeof window === 'undefined') {
    throw new Error('supabaseBrowserClient는 브라우저 환경에서만 사용할 수 있습니다. 서버 컴포넌트에서는 createServerSideClient를 사용하세요.')
  }
  
  // ✅ @supabase/ssr의 createBrowserClient는 브라우저에서 쿠키를 자동으로 처리합니다
  // storage 옵션을 제거하고 기본 동작 사용 (쿠키 기반)
  supabaseBrowserClientInstance = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // auth 옵션을 명시하지 않으면 기본적으로 쿠키 기반 스토리지 사용
      // storage를 명시적으로 설정하면 내부 로직과 충돌할 수 있음
    }
  )
  
  return supabaseBrowserClientInstance
})()

// 레거시 호환성을 위한 함수 (내부적으로 싱글톤 사용)
export const createSupabaseBrowserClient = (): SupabaseClient<Database> => {
  // ✅ 브라우저 환경 체크
  if (typeof window === 'undefined') {
    throw new Error('createSupabaseBrowserClient는 브라우저 환경에서만 사용할 수 있습니다.')
  }
  return supabaseBrowserClient
}
