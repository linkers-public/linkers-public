'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { CreditCard, Calendar, CheckCircle, RefreshCw, History } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Subscription {
  id?: number
  status: 'active' | 'inactive' | 'cancelled'
  plan: string
  price: number
  next_billing_date: string
  auto_renew: boolean
  is_first_month_free?: boolean
}

interface Payment {
  id: number
  amount: number
  payment_status: string
  paid_at: string | null
  is_first_month: boolean
}

export default function SubscriptionClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [payments, setPayments] = useState<Payment[]>([])
  const [updating, setUpdating] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadSubscription()
  }, [])

  const loadSubscription = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // 구독 정보 조회
      const { data: subscriptionData, error } = await supabase
        .from('subscriptions' as any)
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116은 데이터 없음 에러
        throw error
      }

      if (!subscriptionData) {
        setSubscription(null)
        return
      }

      setSubscription({
        id: subscriptionData.id,
        status: subscriptionData.status as 'active' | 'inactive' | 'cancelled',
        plan: subscriptionData.plan === 'basic' ? '기본 플랜' : subscriptionData.plan,
        price: subscriptionData.price,
        next_billing_date: subscriptionData.next_billing_date || new Date().toISOString(),
        auto_renew: subscriptionData.auto_renew,
        is_first_month_free: subscriptionData.is_first_month_free && !subscriptionData.first_month_used,
      })

      // 최근 결제 내역 조회
      const { data: paymentData } = await supabase
        .from('payments' as any)
        .select('id, amount, payment_status, paid_at, is_first_month')
        .eq('subscription_id', subscriptionData.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (paymentData && Array.isArray(paymentData)) {
        setPayments(paymentData as Payment[])
      }
    } catch (error: any) {
      console.error('구독 정보 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '구독 정보를 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRenewalToggle = async () => {
    try {
      setUpdating(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newAutoRenew = !subscription?.auto_renew

      const { error } = await supabase
        .from('subscriptions' as any)
        .update({ auto_renew: newAutoRenew })
        .eq('user_id', user.id)

      if (error) throw error

      setSubscription((prev) => prev ? { ...prev, auto_renew: newAutoRenew } : null)
      toast({
        title: newAutoRenew ? '자동 갱신이 활성화되었습니다' : '자동 갱신이 해제되었습니다',
      })
    } catch (error: any) {
      console.error('자동 갱신 설정 실패:', error)
      toast({
        variant: 'destructive',
        title: '설정 변경 실패',
        description: error.message,
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('정말로 구독을 해지하시겠습니까? 구독 해지 후에도 현재 결제 기간까지는 서비스를 이용할 수 있습니다.')) {
      return
    }

    try {
      setUpdating(true)
      
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '구독 해지에 실패했습니다')
      }

      toast({
        title: '구독 해지 완료',
        description: '구독이 해지되었습니다. 현재 결제 기간까지는 서비스를 이용할 수 있습니다.',
      })
      loadSubscription()
    } catch (error: any) {
      console.error('구독 해지 실패:', error)
      toast({
        variant: 'destructive',
        title: '구독 해지 실패',
        description: error.message,
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleRetryPayment = async () => {
    if (!subscription?.id) return

    if (!confirm('결제를 재시도하시겠습니까?')) {
      return
    }

    try {
      setRetrying(true)

      const response = await fetch('/api/subscription/retry-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription_id: subscription.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '결제 재시도에 실패했습니다')
      }

      toast({
        title: '결제 성공',
        description: '결제가 성공적으로 처리되었습니다.',
      })
      loadSubscription()
    } catch (error: any) {
      console.error('결제 재시도 실패:', error)
      toast({
        variant: 'destructive',
        title: '결제 재시도 실패',
        description: error.message,
      })
    } finally {
      setRetrying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">구독 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-4 md:py-6 px-2 md:px-4">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">구독 관리</h1>
        <p className="text-gray-600">월 2,000원 상태 / 갱신 / 해지</p>
      </div>

      {!subscription ? (
        <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
          <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">구독이 없습니다</h3>
          <p className="text-gray-600 mb-6">링커스 서비스를 구독하고 모든 기능을 이용하세요</p>
          <Button onClick={() => router.push('/my/subscription/register')}>
            구독 등록하기
          </Button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{subscription.plan}</h2>
                <p className="text-sm text-gray-600">
                  {subscription.is_first_month_free ? (
                    <span className="text-green-600 font-medium">첫 달 무료</span>
                  ) : (
                    <span>{subscription.price.toLocaleString()}원 / 월</span>
                  )}
                </p>
              </div>
            </div>
            {subscription.status === 'active' && (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircle className="w-4 h-4" />
                활성
              </span>
            )}
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">다음 결제일</p>
                  <p className="text-sm text-gray-600">
                    {new Date(subscription.next_billing_date).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">자동 갱신</p>
                <p className="text-sm text-gray-600">
                  {subscription.auto_renew ? '활성화됨' : '비활성화됨'}
                </p>
              </div>
              <Button
                onClick={handleRenewalToggle}
                variant="outline"
                size="sm"
                disabled={updating}
              >
                {subscription.auto_renew ? '해제' : '활성화'}
              </Button>
            </div>
          </div>

          {/* 최근 결제 내역 */}
          {payments.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">최근 결제 내역</h3>
              </div>
              <div className="space-y-2">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {payment.is_first_month ? '첫 달 무료' : '월 구독료'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {payment.paid_at
                          ? new Date(payment.paid_at).toLocaleDateString('ko-KR')
                          : '결제 대기 중'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        {payment.is_first_month ? (
                          <span className="text-green-600">무료</span>
                        ) : (
                          `${payment.amount.toLocaleString()}원`
                        )}
                      </p>
                      <p
                        className={`text-xs ${
                          payment.payment_status === 'completed'
                            ? 'text-green-600'
                            : payment.payment_status === 'failed'
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {payment.payment_status === 'completed'
                          ? '완료'
                          : payment.payment_status === 'failed'
                          ? '실패'
                          : '대기'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {payments.some((p) => p.payment_status === 'failed') && (
                <div className="mt-4">
                  <Button
                    onClick={handleRetryPayment}
                    variant="outline"
                    size="sm"
                    disabled={retrying}
                    className="w-full"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
                    {retrying ? '재시도 중...' : '실패한 결제 재시도'}
                  </Button>
                </div>
              )}
              <div className="mt-4">
                <Button
                  onClick={() => router.push('/my/payments')}
                  variant="ghost"
                  size="sm"
                  className="w-full"
                >
                  전체 결제 내역 보기
                </Button>
              </div>
            </div>
          )}

          {subscription.status === 'active' && (
            <div className="pt-6 border-t">
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={updating}
                className="w-full md:w-auto text-red-600 border-red-600 hover:bg-red-50"
              >
                구독 해지
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

