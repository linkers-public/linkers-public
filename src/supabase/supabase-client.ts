import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// 싱글톤 클라이언트 인스턴스
let supabaseBrowserClientInstance: SupabaseClient<Database> | null = null

// 브라우저용 쿠키 헬퍼 함수
const getCookie = (name: string): string | undefined => {
  if (typeof document === 'undefined') return undefined
  
  try {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(';').shift()
      // 빈 문자열이나 undefined가 아닌 경우만 반환
      return cookieValue && cookieValue.trim() ? cookieValue : undefined
    }
  } catch (error) {
    console.warn('[Supabase Client] 쿠키 파싱 오류:', error)
  }
  
  return undefined
}

const setCookie = (name: string, value: string, options?: { maxAge?: number; path?: string }) => {
  if (typeof document === 'undefined') return
  let cookie = `${name}=${value}`
  if (options?.maxAge) cookie += `; max-age=${options.maxAge}`
  if (options?.path) cookie += `; path=${options.path}`
  else cookie += `; path=/`
  document.cookie = cookie
}

const removeCookie = (name: string, options?: { path?: string }) => {
  if (typeof document === 'undefined') return
  const path = options?.path || '/'
  document.cookie = `${name}=; path=${path}; expires=Thu, 01 Jan 1970 00:00:00 GMT`
}

// 브라우저용 싱글톤 클라이언트 (직접 사용 권장)
export const supabaseBrowserClient = ((): SupabaseClient<Database> => {
  // 이미 생성된 인스턴스가 있으면 재사용
  if (supabaseBrowserClientInstance) {
    return supabaseBrowserClientInstance
  }
  
  // 브라우저 환경 확인
  const isBrowser = typeof window !== 'undefined'
  
  // ✅ @supabase/ssr의 createBrowserClient는 브라우저에서 쿠키를 자동으로 처리합니다
  // 쿠키 옵션을 제공하지 않아도 자동으로 document.cookie를 사용합니다
  // auth 옵션만 설정하여 세션 저장 방식을 지정합니다
  supabaseBrowserClientInstance = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        storageKey: 'linkus-auth',
        // 브라우저에서 쿠키를 자동으로 사용하도록 설정
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    }
  )
  
  return supabaseBrowserClientInstance
})()

// 레거시 호환성을 위한 함수 (내부적으로 싱글톤 사용)
export const createSupabaseBrowserClient = (): SupabaseClient<Database> => {
  return supabaseBrowserClient
}
