import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Database } from '@/types/supabase'

type ProjectRole = Database['public']['Enums']['project_role']
type ProjectMemberStatus = Database['public']['Enums']['project_member_status']

/**
 * 프로젝트 참여 신청 (프로필과 역할 선택)
 */
export const joinProject = async (data: {
  counsel_id: number
  profile_id: string
  role: ProjectRole
}) => {
  const supabase = createSupabaseBrowserClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('Not authenticated')

  // 본인의 프로필인지 확인
  const { data: profile } = await supabase
    .from('accounts')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('user_id', data.profile_id)
    .single()

  if (!profile) {
    throw new Error('권한이 없습니다.')
  }

  // 이미 참여 신청했는지 확인
  const { data: existing } = await supabase
    .from('project_members')
    .select('id')
    .eq('counsel_id', data.counsel_id)
    .eq('profile_id', data.profile_id)
    .eq('role', data.role)
    .single()

  if (existing) {
    throw new Error('이미 참여 신청한 프로젝트입니다.')
  }

  const { data: member, error } = await supabase
    .from('project_members')
    .insert({
      counsel_id: data.counsel_id,
      profile_id: data.profile_id,
      role: data.role,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return member
}

/**
 * 프로젝트 멤버 상태 업데이트 (초대 수락/거절, 역할 변경 등)
 */
export const updateProjectMember = async (
  memberId: number,
  data: {
    status?: ProjectMemberStatus
    role?: ProjectRole
  }
) => {
  const supabase = createSupabaseBrowserClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('Not authenticated')

  // 본인의 멤버십인지 확인
  const { data: member } = await supabase
    .from('project_members')
    .select('profile_id')
    .eq('id', memberId)
    .single()

  if (!member || member.profile_id !== user.id) {
    throw new Error('권한이 없습니다.')
  }

  const updateData: any = {
    updated_at: new Date().toISOString(),
  }

  if (data.status !== undefined) {
    updateData.status = data.status
    // active로 변경되면 joined_at 설정
    if (data.status === 'active') {
      updateData.joined_at = new Date().toISOString()
    }
    // completed나 declined로 변경되면 left_at 설정
    if (data.status === 'completed' || data.status === 'declined') {
      updateData.left_at = new Date().toISOString()
    }
  }
  if (data.role !== undefined) updateData.role = data.role

  const { data: updatedMember, error } = await supabase
    .from('project_members')
    .update(updateData)
    .eq('id', memberId)
    .select()
    .single()

  if (error) throw error
  return updatedMember
}

/**
 * 프로젝트의 모든 멤버 조회
 */
export const getProjectMembers = async (counselId: number) => {
  const supabase = createSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('project_members')
    .select(
      `
      *,
      profile:profile_id (
        username,
        profile_type,
        main_job,
        expertise,
        badges,
        availability_status
      )
    `
    )
    .eq('counsel_id', counselId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

/**
 * 프로필이 참여 중인 모든 프로젝트 조회
 */
export const getProfileProjects = async (profileId: string) => {
  const supabase = createSupabaseBrowserClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('Not authenticated')

  // 본인의 프로필인지 확인
  const { data: profile } = await supabase
    .from('accounts')
    .select('user_id')
    .eq('user_id', user.id)
    .eq('user_id', profileId)
    .single()

  if (!profile) {
    throw new Error('권한이 없습니다.')
  }

  const { data, error } = await supabase
    .from('project_members')
    .select(
      `
      *,
      counsel:counsel_id (
        counsel_id,
        title,
        counsel_status,
        cost,
        period,
        feild
      )
    `
    )
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * 프로젝트에서 역할 변경 (같은 프로젝트에서 MAKER ↔ MANAGER 전환)
 */
export const changeProjectRole = async (
  counselId: number,
  profileId: string,
  newRole: ProjectRole
) => {
  const supabase = createSupabaseBrowserClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError) throw authError
  if (!user) throw new Error('Not authenticated')

  // 본인의 프로필인지 확인
  if (profileId !== user.id) {
    throw new Error('권한이 없습니다.')
  }

  // 기존 멤버십 조회
  const { data: existingMember } = await supabase
    .from('project_members')
    .select('*')
    .eq('counsel_id', counselId)
    .eq('profile_id', profileId)
    .single()

  if (!existingMember) {
    throw new Error('프로젝트 멤버를 찾을 수 없습니다.')
  }

  // 같은 역할로 변경하려는 경우
  if (existingMember.role === newRole) {
    return existingMember
  }

  // 기존 멤버십의 역할 업데이트
  // UNIQUE 제약조건 때문에 기존 레코드 업데이트
  const { data: updatedMember, error } = await supabase
    .from('project_members')
    .update({
      role: newRole,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existingMember.id)
    .select()
    .single()

  if (error) {
    // UNIQUE 제약조건 위반 시, 기존 레코드 삭제 후 새로 생성
    if (error.code === '23505') {
      await supabase
        .from('project_members')
        .delete()
        .eq('id', existingMember.id)

      const { data: newMember, error: insertError } = await supabase
        .from('project_members')
        .insert({
          counsel_id: counselId,
          profile_id: profileId,
          role: newRole,
          status: existingMember.status,
          joined_at: existingMember.joined_at,
        })
        .select()
        .single()

      if (insertError) throw insertError
      return newMember
    }
    throw error
  }

  return updatedMember
}

