/**
 * 견적서 열람 관련 API 서비스
 * MVP: 건별 열람권(1만원) + 구독제(무제한) + 최초 n회 무료
 */

import { createSupabaseBrowserClient } from '@/supabase/supabase-client'

export interface EstimateViewRecord {
  id: number
  created_at: string
  client_id: string
  estimate_id: number
  view_type: 'free' | 'paid' | 'subscription'
  amount_paid: number
  payment_id: number | null
  subscription_id: number | null
}

export interface EstimateViewAccess {
  canView: boolean
  viewType: 'free' | 'paid' | 'subscription' | null
  freeViewsRemaining: number
  hasActiveSubscription: boolean
  hasViewed: boolean
  price: number // 건별 결제 가격 (1만원)
}

/**
 * 견적서 열람 권한 확인
 */
export const checkEstimateViewAccess = async (estimateId: number): Promise<EstimateViewAccess> => {
  const supabase = createSupabaseBrowserClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }

  // client 정보 조회
  const { data: client } = await supabase
    .from('client')
    .select('user_id, free_estimate_views_remaining')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!client) {
    throw new Error('기업 계정이 아닙니다.')
  }

  // 이미 열람한 경우 확인
  const { data: existingView } = await supabase
    .from('estimate_views')
    .select('id, view_type')
    .eq('client_id', client.user_id)
    .eq('estimate_id', estimateId)
    .maybeSingle()

  if (existingView) {
    return {
      canView: true,
      viewType: existingView.view_type,
      freeViewsRemaining: client.free_estimate_views_remaining || 0,
      hasActiveSubscription: false, // 구독 정보는 별도 조회
      hasViewed: true,
      price: 10000
    }
  }

  // 무료 열람 횟수 확인
  const freeViewsRemaining = client.free_estimate_views_remaining || 0
  if (freeViewsRemaining > 0) {
    return {
      canView: true,
      viewType: 'free',
      freeViewsRemaining,
      hasActiveSubscription: false,
      hasViewed: false,
      price: 10000
    }
  }

  // 활성 구독 확인
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id, status, next_billing_date')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle()

  const hasActiveSubscription = subscription !== null && 
    (subscription.next_billing_date === null || new Date(subscription.next_billing_date) > new Date())

  if (hasActiveSubscription) {
    return {
      canView: true,
      viewType: 'subscription',
      freeViewsRemaining: 0,
      hasActiveSubscription: true,
      hasViewed: false,
      price: 10000
    }
  }

  // 구독 가입 필요 (건별 결제는 제거됨)
  return {
    canView: false,
    viewType: 'paid', // UI에서 구독 가입 버튼 표시를 위해 유지
    freeViewsRemaining: 0,
    hasActiveSubscription: false,
    hasViewed: false,
    price: 10000 // 구독 가격 표시용
  }
}

/**
 * 견적서 열람 기록 생성 (무료/구독)
 */
export const createEstimateView = async (
  estimateId: number,
  viewType: 'free' | 'subscription'
): Promise<EstimateViewRecord> => {
  const supabase = createSupabaseBrowserClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }

  // client 정보 조회
  const { data: client } = await supabase
    .from('client')
    .select('user_id, free_estimate_views_remaining')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!client) {
    throw new Error('기업 계정이 아닙니다.')
  }

  // 이미 열람한 경우 확인
  const { data: existingView } = await supabase
    .from('estimate_views')
    .select('id')
    .eq('client_id', client.user_id)
    .eq('estimate_id', estimateId)
    .maybeSingle()

  if (existingView) {
    throw new Error('이미 열람한 견적서입니다.')
  }

  let subscriptionId: number | null = null
  if (viewType === 'subscription') {
    // 구독 ID 조회
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle()
    
    if (!subscription) {
      throw new Error('활성 구독이 없습니다.')
    }
    subscriptionId = subscription.id
  } else if (viewType === 'free') {
    // 무료 열람 횟수 차감
    if ((client.free_estimate_views_remaining || 0) <= 0) {
      throw new Error('무료 열람 횟수가 없습니다.')
    }

    const { error: updateError } = await supabase
      .from('client')
      .update({
        free_estimate_views_remaining: (client.free_estimate_views_remaining || 0) - 1
      })
      .eq('user_id', user.id)

    if (updateError) {
      throw new Error(`무료 열람 횟수 차감 실패: ${updateError.message}`)
    }
  }

  // 열람 기록 생성
  const { data, error } = await supabase
    .from('estimate_views')
    .insert({
      client_id: client.user_id,
      estimate_id: estimateId,
      view_type: viewType,
      amount_paid: 0,
      subscription_id: subscriptionId
    })
    .select()
    .single()

  if (error) {
    throw new Error(`견적서 열람 기록 생성 실패: ${error.message}`)
  }

  return data
}

/**
 * 건별 결제 후 열람 기록 생성
 */
export const createPaidEstimateView = async (
  estimateId: number,
  paymentId: number
): Promise<EstimateViewRecord> => {
  const supabase = createSupabaseBrowserClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }

  // client 정보 조회
  const { data: client } = await supabase
    .from('client')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!client) {
    throw new Error('기업 계정이 아닙니다.')
  }

  // 결제 정보 확인
  const { data: payment } = await supabase
    .from('payments')
    .select('id, amount, payment_status')
    .eq('id', paymentId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!payment) {
    throw new Error('결제 정보를 찾을 수 없습니다.')
  }

  if (payment.payment_status !== 'completed') {
    throw new Error('결제가 완료되지 않았습니다.')
  }

  // 이미 열람한 경우 확인
  const { data: existingView } = await supabase
    .from('estimate_views')
    .select('id')
    .eq('client_id', client.user_id)
    .eq('estimate_id', estimateId)
    .maybeSingle()

  if (existingView) {
    throw new Error('이미 열람한 견적서입니다.')
  }

  // 열람 기록 생성
  const { data, error } = await supabase
    .from('estimate_views')
    .insert({
      client_id: client.user_id,
      estimate_id: estimateId,
      view_type: 'paid',
      amount_paid: payment.amount || 10000,
      payment_id: paymentId
    })
    .select()
    .single()

  if (error) {
    throw new Error(`견적서 열람 기록 생성 실패: ${error.message}`)
  }

  return data
}

/**
 * 견적서 열람 기록 조회
 */
export const getEstimateViewHistory = async (): Promise<EstimateViewRecord[]> => {
  const supabase = createSupabaseBrowserClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }

  // client 정보 조회
  const { data: client } = await supabase
    .from('client')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!client) {
    return []
  }

  const { data, error } = await supabase
    .from('estimate_views')
    .select('*')
    .eq('client_id', client.user_id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`견적서 열람 기록 조회 실패: ${error.message}`)
  }

  return data || []
}

