import { createSupabaseBrowserClient } from '@/supabase/supabase-client'

export const fetchTeamProfileByTeamManager = async () => {
  const supabase = createSupabaseBrowserClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('로그인 하는 곳으로 리다이렉트')
  }

  // team_members와 accounts 간의 관계 조인
  // team_members.maker_id = accounts.user_id
  // PostgREST가 자동으로 인식하지 못하므로 수동으로 조인
  const { data, error } = await supabase
    .from('teams')
    .select('*, team_members:team_members(*)')
    .eq('manager_id', user.id)
    .single()

  if (error) {
    return { data: null, error }
  }

  // 매니저 정보 조회 (프리랜서 프로필)
  // 팀 매니저는 프리랜서 프로필로 표시
  let managerAccount = null
  if (data && data.manager_id) {
    const { data: managerData, error: managerError } = await supabase
      .from('accounts')
      .select('profile_id, user_id, username, role, bio')
      .eq('user_id', data.manager_id)
      .eq('profile_type', 'FREELANCER')
      .single()

    if (!managerError && managerData) {
      managerAccount = managerData
    }
  }

  // team_members의 각 member에 대해 accounts 정보 조회
  // 팀원은 MAKER 역할만 포함 (매니저는 teams.manager_id로만 관리)
  let validMembers: any[] = []
  if (data && data.team_members && data.team_members.length > 0) {
    const teamMembersWithAccounts = await Promise.all(
      data.team_members.map(async (member: any) => {
        if (member.maker_id) {
          // MAKER 역할의 계정만 조회
          const { data: accountData, error: accountError } = await supabase
            .from('accounts')
            .select('profile_id, user_id, username, role, bio')
            .eq('user_id', member.maker_id)
            .eq('role', 'MAKER')
            .single()

          if (accountError) {
            console.error('Failed to fetch account for member:', member.maker_id, accountError)
            return null // MAKER 역할이 없으면 null 반환
          }

          return {
            ...member,
            account: accountData,
          }
        }
        return null
      }),
    )

    // null 값 제거 (MAKER 역할이 아닌 멤버 제외)
    validMembers = teamMembersWithAccounts.filter((member) => member !== null)
  }

  return {
    data: { ...data, manager: managerAccount, team_members: validMembers },
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
