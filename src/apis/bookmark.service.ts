import { createSupabaseBrowserClient } from '@/supabase/supabase-client'

export const fetchBookmarkList = async ({
  isProposed,
  experience,
  job,
  specialization,
}: {
  isProposed: boolean
  experience?: [number, number]
  job?: string[]
  specialization?: string[]
}) => {
  const supabase = createSupabaseBrowserClient()

  let query = supabase
    .from('manager_bookmarks')
    .select(
      `
     *,
     maker:maker_id (
       *,
       account_work_experiences(*),
       account_license(*)
     )
   `,
    )
    .eq('proposal_status', isProposed)

  // if (job.length > 0) {
  //   query = query.contains('maker.main_job', job)
  // }

  // if (specialization.length > 0) {
  //   query = query.contains('maker.expertise', specialization)
  // }
  return await query
}
export const unbookmark = async (makerId: string) => {
  const supabase = createSupabaseBrowserClient()
  const { data, error } = await supabase
    .from('manager_bookmarks')
    .delete()
    .eq('maker_id', makerId)

  if (error) console.error('Delete error:', error)
  return { data, error }
}
export const propose = async () => {}

// 프로젝트 북마크 관련 함수들
export const bookmarkProject = async (counselId: number) => {
  const supabase = createSupabaseBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }

  // 활성 프로필 확인
  const { data: profile } = await supabase
    .from('accounts')
    .select('profile_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (!profile) {
    throw new Error('프로필을 찾을 수 없습니다.')
  }

  // 북마크 추가
  const { data, error } = await supabase
    .from('project_bookmarks' as any)
    .insert({
      profile_id: profile.profile_id,
      counsel_id: counselId,
    })
    .select()
    .single()

  if (error) {
    // 이미 북마크된 경우 (UNIQUE 제약조건 위반)
    if (error.code === '23505' || error.message?.includes('duplicate')) {
      throw new Error('이미 북마크된 프로젝트입니다.')
    }
    throw error
  }

  return data
}

export const unbookmarkProject = async (counselId: number) => {
  const supabase = createSupabaseBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }

  // 활성 프로필 확인
  const { data: profile } = await supabase
    .from('accounts')
    .select('profile_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (!profile) {
    throw new Error('프로필을 찾을 수 없습니다.')
  }

  // 북마크 삭제
  const { error } = await supabase
    .from('project_bookmarks' as any)
    .delete()
    .eq('profile_id', profile.profile_id)
    .eq('counsel_id', counselId)

  if (error) throw error
  return { success: true }
}

export const checkProjectBookmarked = async (counselId: number): Promise<boolean> => {
  const supabase = createSupabaseBrowserClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return false
  }

  // 활성 프로필 확인
  const { data: profile } = await supabase
    .from('accounts')
    .select('profile_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle()

  if (!profile) {
    return false
  }

  // 북마크 확인
  const { data, error } = await supabase
    .from('project_bookmarks' as any)
    .select('id')
    .eq('profile_id', profile.profile_id)
    .eq('counsel_id', counselId)
    .maybeSingle()

  if (error || !data) {
    return false
  }

  return true
}