import { createSupabaseBrowserClient } from '@/supabase/supabase-client'

export const fetchTeamProfileByTeamManager = async () => {
  const supabase = createSupabaseBrowserClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('로그인 하는 곳으로 리다이렉트')
  }

  const { data, error } = await supabase
    .from('teams')
    .select(
      `
      *,
      team_members:team_members(
        *,
        account:accounts(*)
      )
    `,
    )
    .eq('manager_id', user.id)
    .single()
  return { data, error }
}

export const fetchTeamProfile = async (teamId: string) => {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('teams')
    .select(`*, team_members:team_members(*)`)
    .eq('id', teamId)
    .single()

  return { data, error }
}
