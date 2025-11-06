'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { CreditCard, CheckCircle, Gift } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { generateCustomerUid } from '@/apis/subscription.service'

declare global {
  interface Window {
    IMP: any
  }
}

export default function SubscriptionRegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [user, setUser] = useState<any>(null)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadUser()
    loadPortOneSDK()
  }, [])

  const loadUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    setUser(user)
  }

  const loadPortOneSDK = () => {
    if (window.IMP) return

    const script = document.createElement('script')
    script.src = 'https://cdn.iamport.kr/js/iamport.payment-1.2.0.js'
    script.onload = () => {
      window.IMP.init(process.env.NEXT_PUBLIC_PORTONE_IMP_CODE || '')
    }
    document.body.appendChild(script)
  }

  const handleRegister = async () => {
    if (!user) return

    try {
      setRegistering(true)

      // customer_uid 생성
      const customerUid = generateCustomerUid(user.id)

      // 포트원 결제창 호출 (빌링키 발급)
      window.IMP.request_pay(
        {
          channelKey: process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY || '',
          pay_method: 'card',
          merchant_uid: `billing_${user.id}_${Date.now()}`,
          name: '링커스 구독 등록',
          amount: 0, // 빌링키 발급 시 0원
          customer_uid: customerUid,
          buyer_email: user.email || '',
          buyer_name: user.email?.split('@')[0] || '사용자',
        },
        async (rsp: any) => {
          if (rsp.success) {
            // 빌링키 발급 성공
            // 서버에 구독 등록 요청
            try {
              const response = await fetch('/api/subscription/register', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  customer_uid: customerUid,
                  buyer_info: {
                    name: user.email?.split('@')[0] || '사용자',
                    email: user.email || '',
                  },
                }),
              })

              const data = await response.json()

              if (data.success) {
                toast({
                  title: '구독 등록 완료!',
                  description: '첫 달은 무료입니다. 다음 달부터 월 2,000원이 자동 결제됩니다.',
                })
                router.push('/my/subscription')
              } else {
                throw new Error(data.error || '구독 등록에 실패했습니다')
              }
            } catch (error: any) {
              console.error('구독 등록 실패:', error)
              toast({
                variant: 'destructive',
                title: '구독 등록 실패',
                description: error.message || '서버 오류가 발생했습니다',
              })
            }
          } else {
            toast({
              variant: 'destructive',
              title: '카드 등록 실패',
              description: rsp.error_msg || '카드 등록에 실패했습니다',
            })
          }
          setRegistering(false)
        }
      )
    } catch (error: any) {
      console.error('구독 등록 오류:', error)
      toast({
        variant: 'destructive',
        title: '오류 발생',
        description: error.message || '알 수 없는 오류가 발생했습니다',
      })
      setRegistering(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-4 md:py-6 px-2 md:px-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
          구독 등록
        </h1>
        <p className="text-gray-600">링커스 서비스를 구독하고 모든 기능을 이용하세요</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6 md:p-8">
        {/* 첫 달 무료 안내 */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Gift className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">첫 달 무료 혜택</h3>
          </div>
          <p className="text-sm text-green-800">
            지금 구독하시면 첫 달은 무료로 이용하실 수 있습니다!
          </p>
        </div>

        {/* 구독 플랜 정보 */}
        <div className="mb-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">기본 플랜</h3>
                <p className="text-sm text-gray-600">월 2,000원</p>
              </div>
            </div>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>

          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>첫 달 무료 이용</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>모든 기능 무제한 이용</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>월 단위 자동 결제</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span>언제든지 해지 가능</span>
            </div>
          </div>
        </div>

        {/* 결제 안내 */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>결제 안내:</strong> 카드 정보를 등록하시면 첫 달은 무료로 이용하실 수
            있으며, 다음 달부터 월 2,000원이 자동으로 결제됩니다. 언제든지 구독을 해지하실
            수 있습니다.
          </p>
        </div>

        {/* 등록 버튼 */}
        <Button
          onClick={handleRegister}
          disabled={registering || !user}
          className="w-full"
          size="lg"
        >
          {registering ? '처리 중...' : '구독 등록하기'}
        </Button>
      </div>
    </div>
  )
}

