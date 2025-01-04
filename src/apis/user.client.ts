'use client'

import { createSupabaseBrowserClient } from '@/supabase/supabase-client'

export const fetchUserProfile = async (userId?: string) => {
  const supabase = createSupabaseBrowserClient()

  let targetUserId = userId
  if (!targetUserId) {
    const {
      data: { session },
    } = await supabase.auth.getSession()
    targetUserId = session?.user?.id
  }
  if (!targetUserId) {
    return null
  }

  const { data, error } = await supabase
    .from('accounts')
    .select(
      `
   *,
    account_work_experiences!account_id(*),
    account_educations!account_id(*),
    account_license!account_id(*),
  `,
    )
    .eq('user_id', targetUserId)
    .single()

  if (error) {
    console.error(error)
    return null
  }

  return data
}
