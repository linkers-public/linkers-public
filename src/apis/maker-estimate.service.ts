import { createSupabaseBrowserClient } from '@/supabase/supabase-client'

export interface MakerEstimate {
  id: number
  counsel_id: number
  maker_id: string
  estimate_amount: number
  estimate_period: string
  estimate_details: string
  estimate_status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
}

export const submitMakerEstimate = async (estimateData: {
  counselId: number
  estimateAmount: number
  estimatePeriod: string
  estimateDetails: string
}) => {
  const supabase = createSupabaseBrowserClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }

  // 기존 견적이 있는지 확인
  const { data: existingEstimate } = await supabase
    .from('maker_estimates')
    .select('*')
    .eq('counsel_id', estimateData.counselId)
    .eq('maker_id', user.id)
    .single()

  if (existingEstimate) {
    // 기존 견적 업데이트
    const { data, error } = await supabase
      .from('maker_estimates')
      .update({
        estimate_amount: estimateData.estimateAmount,
        estimate_period: estimateData.estimatePeriod,
        estimate_details: estimateData.estimateDetails,
        estimate_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', existingEstimate.id)
      .select()
      .single()

    if (error) {
      throw new Error(`견적 업데이트 실패: ${error.message}`)
    }

    return data
  } else {
    // 새로운 견적 생성
    const { data, error } = await supabase
      .from('maker_estimates')
      .insert({
        counsel_id: estimateData.counselId,
        maker_id: user.id,
        estimate_amount: estimateData.estimateAmount,
        estimate_period: estimateData.estimatePeriod,
        estimate_details: estimateData.estimateDetails,
        estimate_status: 'pending'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`견적 제출 실패: ${error.message}`)
    }

    return data
  }
}

export const getMakerEstimate = async (counselId: number) => {
  const supabase = createSupabaseBrowserClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('maker_estimates')
    .select('*')
    .eq('counsel_id', counselId)
    .eq('maker_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116은 "no rows returned" 에러
    throw new Error(`견적 조회 실패: ${error.message}`)
  }

  return data
}

export const getMakerEstimates = async (makerId?: string) => {
  const supabase = createSupabaseBrowserClient()
  
  let targetMakerId = makerId
  if (!targetMakerId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('로그인이 필요합니다.')
    }
    targetMakerId = user.id
  }

  const { data, error } = await supabase
    .from('maker_estimates')
    .select(`
      *,
      counsel:counsel_id (
        counsel_id,
        title,
        outline,
        period,
        cost,
        feild,
        skill,
        output,
        counsel_status
      )
    `)
    .eq('maker_id', targetMakerId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`메이커 견적 목록 조회 실패: ${error.message}`)
  }

  return data
}

export const getProjectMakerEstimates = async (counselId: number) => {
  const supabase = createSupabaseBrowserClient()

  const { data, error } = await supabase
    .from('maker_estimates')
    .select(`
      *,
      maker:maker_id (
        username,
        main_job,
        expertise,
        availability_status
      )
    `)
    .eq('counsel_id', counselId)

  if (error) {
    throw new Error(`프로젝트 메이커 견적 목록 조회 실패: ${error.message}`)
  }

  return data
}
