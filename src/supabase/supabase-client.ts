import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

// 클라이언트 전용
export const createSupabaseBrowserClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
