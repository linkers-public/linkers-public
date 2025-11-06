'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { CreditCard, Calendar, CheckCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Subscription {
  status: 'active' | 'inactive' | 'cancelled'
  plan: string
  price: number
  next_billing_date: string
  auto_renew: boolean
}

export default function SubscriptionClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [updating, setUpdating] = useState(false)
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

      // TODO: 구독 정보 조회 (subscriptions 테이블 또는 결제 시스템 연동)
      // 현재는 임시 데이터
      setSubscription({
        status: 'active',
        plan: '기본 플랜',
        price: 2000,
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        auto_renew: true,
      })
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
      // TODO: 자동 갱신 토글 로직 구현
      setSubscription((prev) => prev ? { ...prev, auto_renew: !prev.auto_renew } : null)
      toast({
        title: subscription?.auto_renew ? '자동 갱신이 해제되었습니다' : '자동 갱신이 활성화되었습니다',
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
      // TODO: 구독 해지 로직 구현
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

      {subscription && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{subscription.plan}</h2>
                <p className="text-sm text-gray-600">
                  {subscription.price.toLocaleString()}원 / 월
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

          {subscription.status === 'active' && (
            <div className="pt-6 border-t">
              <Button
                onClick={handleCancel}
                variant="destructive"
                disabled={updating}
                className="w-full md:w-auto"
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

