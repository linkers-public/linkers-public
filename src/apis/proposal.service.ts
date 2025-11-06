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
export const propose = async (makerId: string, teamId?: number | null) => {
  const supabase = createSupabaseBrowserClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('로그인이 필요합니다')
  }

  // 매니저의 팀 정보 가져오기
  let targetTeamId = teamId
  if (!targetTeamId) {
    const { data: team } = await supabase
      .from('teams')
      .select('id')
      .eq('manager_id', user.id)
      .single()

    if (team) {
      targetTeamId = team.id
    }
  }

  // team_proposals에 제안 추가
  const { data: proposal, error: proposalError } = await supabase
    .from('team_proposals')
    .insert({
      maker_id: makerId,
      manager_id: user.id,
      team_id: targetTeamId,
    })
    .select()
    .single()

  if (proposalError) {
    console.error('Proposal error:', proposalError)
    throw proposalError
  }

  // manager_bookmarks의 proposal_status 업데이트
  const { error: bookmarkError } = await supabase
    .from('manager_bookmarks')
    .update({ proposal_status: true })
    .eq('maker_id', makerId)
    .eq('manager_id', user.id)

  if (bookmarkError) {
    console.error('Bookmark update error:', bookmarkError)
    // 제안은 성공했지만 북마크 업데이트 실패는 치명적이지 않음
  }

  return { data: proposal, error: proposalError }
}
