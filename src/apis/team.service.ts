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

/**
 * 사용자가 속한 모든 팀 목록 조회 (매니저인 팀 + 팀원으로 속한 팀)
 */
export const fetchMyTeams = async () => {
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
    return { data: [], error: profileError || new Error('프리랜서 프로필을 찾을 수 없습니다.') }
  }

  // 1. 매니저인 팀 조회
  const { data: managedTeams, error: managedError } = await supabase
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

  if (managedError) {
    return { data: [], error: managedError }
  }

  // 2. 팀원으로 속한 팀 조회
  const { data: memberTeams, error: memberError } = await supabase
    .from('team_members')
    .select(`
      team_id,
      teams:team_id (
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
      )
    `)
    .eq('profile_id', currentProfile.profile_id)
    .eq('status', 'active')

  if (memberError) {
    return { data: [], error: memberError }
  }

  // 3. 두 결과를 합치고 중복 제거
  const allTeams: any[] = []
  const teamIds = new Set<number>()

  // 매니저인 팀 추가
  if (managedTeams) {
    managedTeams.forEach((team: any) => {
      if (!teamIds.has(team.id)) {
        teamIds.add(team.id)
        allTeams.push({
          ...team,
          isManager: true,
          manager: team.manager || null,
          team_members: (team.team_members || []).map((member: any) => ({
            ...member,
            account: member.account || null,
          })),
        })
      }
    })
  }

  // 팀원으로 속한 팀 추가
  if (memberTeams) {
    memberTeams.forEach((memberTeam: any) => {
      const team = memberTeam.teams
      if (team && !teamIds.has(team.id)) {
        teamIds.add(team.id)
        allTeams.push({
          ...team,
          isManager: false,
          manager: team.manager || null,
          team_members: (team.team_members || []).map((member: any) => ({
            ...member,
            account: member.account || null,
          })),
        })
      }
    })
  }

  return { data: allTeams, error: null }
}

/**
 * 특정 팀의 상세 정보 조회
 */
export const fetchTeamDetail = async (teamId: number) => {
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

  // 팀 상세 정보 조회
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
    .eq('id', teamId)
    .single()

  if (error) {
    return { data: null, error }
  }

  // 매니저인지 확인
  const isManager = (data as any).manager_profile_id === currentProfile.profile_id

  return {
    data: {
      ...data,
      isManager,
      manager: data.manager || null,
      team_members: (data.team_members || []).map((member: any) => ({
        ...member,
        account: member.account || null,
      })),
    },
    error: null,
  }
}

/**
 * 팀원 추가
 */
export const addTeamMember = async (teamId: number, profileId: string) => {
  const supabase = createSupabaseBrowserClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('Not authenticated')

  // 팀의 매니저인지 확인
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('manager_profile_id')
    .eq('id', teamId)
    .single()

  if (teamError) throw teamError

  // 현재 사용자의 FREELANCER 프로필 조회
  const { data: currentProfile, error: profileError } = await supabase
    .from('accounts')
    .select('profile_id')
    .eq('user_id', user.id)
    .eq('profile_type', 'FREELANCER')
    .maybeSingle()

  if (profileError || !currentProfile) {
    throw new Error('프리랜서 프로필을 찾을 수 없습니다.')
  }

  // 매니저인지 확인
  if ((team as any).manager_profile_id !== currentProfile.profile_id) {
    throw new Error('팀 매니저만 팀원을 추가할 수 있습니다.')
  }

  // 이미 팀원인지 확인
  const { data: existingMember } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', teamId)
    .eq('profile_id', profileId)
    .maybeSingle()

  if (existingMember) {
    throw new Error('이미 팀원으로 등록되어 있습니다.')
  }

  // 팀원 추가
  const { data: member, error } = await supabase
    .from('team_members')
    .insert({
      team_id: teamId,
      profile_id: profileId,
      status: 'active',
    })
    .select()
    .single()

  if (error) throw error
  return member
}

/**
 * 팀원 제거
 */
export const removeTeamMember = async (teamId: number, memberId: number) => {
  const supabase = createSupabaseBrowserClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('Not authenticated')

  // 팀의 매니저인지 확인
  const { data: team, error: teamError } = await supabase
    .from('teams')
    .select('manager_profile_id')
    .eq('id', teamId)
    .single()

  if (teamError) throw teamError

  // 현재 사용자의 FREELANCER 프로필 조회
  const { data: currentProfile, error: profileError } = await supabase
    .from('accounts')
    .select('profile_id')
    .eq('user_id', user.id)
    .eq('profile_type', 'FREELANCER')
    .maybeSingle()

  if (profileError || !currentProfile) {
    throw new Error('프리랜서 프로필을 찾을 수 없습니다.')
  }

  // 매니저인지 확인
  if ((team as any).manager_profile_id !== currentProfile.profile_id) {
    throw new Error('팀 매니저만 팀원을 제거할 수 있습니다.')
  }

  // 팀원 제거
  const { error } = await supabase
    .from('team_members')
    .delete()
    .eq('id', memberId)
    .eq('team_id', teamId)

  if (error) throw error
  return { success: true }
}

/**
 * 기본 팀 생성 (매니저용)
 * 사용자가 팀이 없을 때 자동으로 기본 팀을 생성합니다.
 */
export const createDefaultTeam = async () => {
  const supabase = createSupabaseBrowserClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('로그인이 필요합니다')
  }

  // 현재 사용자의 FREELANCER 프로필 조회
  const { data: currentProfile, error: profileError } = await supabase
    .from('accounts')
    .select('profile_id, username')
    .eq('user_id', user.id)
    .eq('profile_type', 'FREELANCER')
    .maybeSingle()

  if (profileError || !currentProfile) {
    throw new Error('프리랜서 프로필을 찾을 수 없습니다.')
  }

  // 이미 팀이 있는지 확인
  const { data: existingTeam } = await supabase
    .from('teams')
    .select('id')
    .eq('manager_profile_id', currentProfile.profile_id)
    .maybeSingle()

  if (existingTeam) {
    return { data: existingTeam, error: null }
  }

  // 기본 팀 생성
  const teamName = `${currentProfile.username || '나'}의 팀`
  const { data: newTeam, error: teamError } = await supabase
    .from('teams')
    .insert({
      manager_profile_id: currentProfile.profile_id,
      name: teamName,
      description: '기본 팀입니다.',
    })
    .select()
    .single()

  if (teamError) {
    throw teamError
  }

  return { data: newTeam, error: null }
}