import { createSupabaseBrowserClient } from '@/supabase/supabase-client'

// 상담(counsel) 조회
export const getCompanyCounsels = async () => {
  const supabase = createSupabaseBrowserClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }

  // 활성 기업 프로필 확인
  const { data: profile } = await supabase
    .from('accounts')
    .select('profile_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .eq('profile_type', 'COMPANY')
    .is('deleted_at', null)
    .maybeSingle()

  if (!profile) {
    throw new Error('기업 프로필을 찾을 수 없습니다.')
  }

  // client 테이블에서 user_id 조회
  const { data: client } = await supabase
    .from('client')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!client) {
    return []
  }

  const { data, error } = await supabase
    .from('counsel')
    .select('*')
    .eq('client_id', client.user_id)
    .order('counsel_id', { ascending: false })

  if (error) {
    throw new Error(`상담 목록 조회 실패: ${error.message}`)
  }

  return data || []
}

// 견적(estimate) 조회 - 상태별 필터링
export const getCompanyEstimates = async (statuses?: string[]) => {
  const supabase = createSupabaseBrowserClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }

  // 활성 기업 프로필 확인
  const { data: profile } = await supabase
    .from('accounts')
    .select('profile_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .eq('profile_type', 'COMPANY')
    .is('deleted_at', null)
    .maybeSingle()

  if (!profile) {
    throw new Error('기업 프로필을 찾을 수 없습니다.')
  }

  // client 테이블에서 user_id 조회
  const { data: client } = await supabase
    .from('client')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!client) {
    return []
  }

  let query = supabase
    .from('estimate')
    .select(`
      *,
      teams:teams!team_id (
        id,
        name,
        manager_id
      ),
      estimate_version:estimate_version (
        estimate_version_id,
        total_amount,
        detail,
        start_date,
        end_date,
        version_date
      )
    `)
    .eq('client_id', client.user_id)
    .order('estimate_id', { ascending: false })

  if (statuses && statuses.length > 0) {
    query = query.in('estimate_status', statuses)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`견적 목록 조회 실패: ${error.message}`)
  }

  return data || []
}

// 견적 상세 조회 (estimate + estimate_version + milestone + payment)
export const getEstimateDetail = async (estimateId: number) => {
  const supabase = createSupabaseBrowserClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }

  const { data, error } = await supabase
    .from('estimate')
    .select(`
      *,
      teams:teams!team_id (
        id,
        name,
        manager_id
      ),
      estimate_version:estimate_version (
        estimate_version_id,
        total_amount,
        detail,
        start_date,
        end_date,
        version_date
      ),
      milestone:milestone (
        milestone_id,
        estimate_id,
        estimate_version_id,
        title,
        detail,
        payment_amount,
        milestone_start_date,
        milestone_due_date,
        milestone_status,
        progress,
        payment:payment (
          payment_id,
          payment_amount,
          payment_date,
          payment_method,
          payment_status
        )
      )
    `)
    .eq('estimate_id', estimateId)
    .maybeSingle()

  if (error) {
    throw new Error(`견적 상세 조회 실패: ${error.message}`)
  }

  return data
}

// 받은 견적서 목록 조회 (팀/매니저가 보낸 견적서)
export const getReceivedEstimates = async () => {
  const supabase = createSupabaseBrowserClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }

  // 활성 기업 프로필 확인
  const { data: profile } = await supabase
    .from('accounts')
    .select('profile_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .eq('profile_type', 'COMPANY')
    .is('deleted_at', null)
    .maybeSingle()

  if (!profile) {
    throw new Error('기업 프로필을 찾을 수 없습니다.')
  }

  // client 테이블에서 user_id 조회
  const { data: client } = await supabase
    .from('client')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!client) {
    return []
  }

  const { data, error } = await supabase
    .from('estimate')
    .select(`
      estimate_id,
      team_id,
      counsel_id,
      client_id,
      estimate_status,
      estimate_start_date,
      estimate_due_date,
      estimate_date,
      teams:teams!team_id (
        id,
        name,
        manager_id
      ),
      estimate_version:estimate_version (
        estimate_version_id,
        total_amount,
        detail,
        start_date,
        end_date,
        version_date
      )
    `)
    .eq('client_id', client.user_id)
    .order('estimate_id', { ascending: false })

  if (error) {
    throw new Error(`받은 견적서 목록 조회 실패: ${error.message}`)
  }

  return data || []
}

// 견적 상태 업데이트 (수락/보류/계약 진행)
export const updateEstimateStatus = async (estimateId: number, status: string) => {
  const supabase = createSupabaseBrowserClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }

  const { data, error } = await supabase
    .from('estimate')
    .update({ 
      estimate_status: status
    })
    .eq('estimate_id', estimateId)
    .select()
    .single()

  if (error) {
    throw new Error(`견적 상태 업데이트 실패: ${error.message}`)
  }

  return data
}

// 상담 상태 업데이트 (마감)
export const updateCounselStatus = async (counselId: number, status: string) => {
  const supabase = createSupabaseBrowserClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }

  const { data, error } = await supabase
    .from('counsel')
    .update({ 
      counsel_status: status
    })
    .eq('counsel_id', counselId)
    .select()
    .single()

  if (error) {
    throw new Error(`상담 상태 업데이트 실패: ${error.message}`)
  }

  return data
}

// 마일스톤 승인
export const approveMilestone = async (milestoneId: number) => {
  const supabase = createSupabaseBrowserClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }

  const { data, error } = await supabase
    .from('milestone')
    .update({ 
      milestone_status: 'approved'
    })
    .eq('milestone_id', milestoneId)
    .select()
    .single()

  if (error) {
    throw new Error(`마일스톤 승인 실패: ${error.message}`)
  }

  return data
}

