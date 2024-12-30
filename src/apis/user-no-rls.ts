'use client'

import { createSupabaseBrowserClient } from '@/supabase/supabase-client'

export const getUser = async (id: string) => {
  const supabase = createSupabaseBrowserClient()
}
