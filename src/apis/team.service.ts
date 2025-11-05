import { createSupabaseBrowserClient } from '@/supabase/supabase-client'

export const fetchTeamProfileByTeamManager = async () => {
  const supabase = createSupabaseBrowserClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('로그인 하는 곳으로 리다이렉트')
  }

  // 현재 사용자의 FREELANCER 프로필 조회
  const { data: currentProfile, error: profileError } = await supabase
    .from('accounts')
    .select('profile_id')
    .eq('user_id', user.id)
    .eq('profile_type', 'FREELANCER')
    .maybeSingle()

  if (profileError || !currentProfile) {
    return { data: null, error: profileError || new Error('프리랜서 프로필을 찾을 수 없습니다.') }
  }

  // manager_profile_id를 사용하여 팀 조회 (FK 자동 조인)
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      manager:manager_profile_id (
        profile_id,
        user_id,
        username,
        role,
        bio,
        profile_image_url
      ),
      team_members:team_members (
        *,
        account:profile_id (
          profile_id,
          user_id,
          username,
          role,
          bio,
          profile_image_url
        )
      )
    `)
    .eq('manager_profile_id', currentProfile.profile_id)
    .single()

  if (error) {
    return { data: null, error }
  }

  // team_members는 이미 profile_id로 조인되어 있음
  // 필터링은 불필요 (FK로 자동 연결됨)

  return {
    data: {
      ...data,
      manager: data.manager || null,
      team_members: (data.team_members || []).map((member: any) => ({
        ...member,
        account: member.account || null,
      })),
    },
    error: null,
  }
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
