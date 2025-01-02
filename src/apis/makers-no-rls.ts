'use client'

import { createSupabaseBrowserClient } from '@/supabase/supabase-client'

export const getMaker = async (id: number) => {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('makers_no_rls')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single()
}
