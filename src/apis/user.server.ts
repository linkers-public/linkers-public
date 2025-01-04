import { createServerSideClient } from '@/supabase/supabase-server'
import { redirect } from 'next/navigation'

export const fetchLoginUserInfo = async () => {
  const supabase = await createServerSideClient()
  const { data, error } = await supabase.from('accounts').select('*').single()
  if (error) {
    console.error(error)
    return null
  }
  return data
}

export const fetchUserProfile = async (userId?: string) => {
  const supabase = await createServerSideClient()

  let targetUserId = userId

  if (!targetUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    targetUserId = user?.id
  }

  if (!targetUserId) {
    redirect('/auth')
  }

  const { data, error } = await supabase
    .from('accounts')
    .select(
      `
   *,
    account_work_experiences!account_id(*),
    account_educations!account_id(*),
    account_license!account_id(*)
  `,
    )
    .eq('user_id', targetUserId)
    .single()

  if (error) {
    throw error
  }

  return data
}
