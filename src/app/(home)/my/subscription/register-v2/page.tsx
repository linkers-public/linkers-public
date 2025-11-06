'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { CreditCard, CheckCircle, Gift } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import PortOne from '@portone/browser-sdk/v2'
import { generateBillingKeyId } from '@/utils/billing-key'

export default function SubscriptionRegisterV2Page() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    loadUser()
  }, [])

  const loadUser = async () => {
    const supabase = createSupabaseBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth')
      return
    }
    
    // 사용자 계정 정보 조회 (전화번호 포함)
    const { data: accountData } = await supabase
      .from('accounts')
      .select('username, contact_phone, contact_email')
      .eq('user_id', user.id)
      .single()
    
    setUser({ ...user, accountData })
  }

  const handleRegister = async () => {
    if (!user) return

    try {
      setRegistering(true)

      // 빌링키 ID 생성
      const billingKeyId = generateBillingKeyId(user.id)

      // 사용자 전화번호 조회 (빌링키 발급 시 전달)
      const userPhoneNumber = (user as any).accountData?.contact_phone || ''
      
      // 포트원 V2 빌링키 발급 요청
      const billingKeyResponse = await PortOne.requestIssueBillingKey({
        storeId: process.env.NEXT_PUBLIC_PORTONE_V2_STORE_ID || '',
        channelKey: process.env.NEXT_PUBLIC_PORTONE_V2_CHANNEL_KEY || '',
        billingKeyMethod: 'CARD',
        issueId: billingKeyId,
        customer: {
          fullName: user.email?.split('@')[0] || '사용자',
          email: user.email || '',
          // 전화번호가 있으면 전달 (빌링키 발급 UI에서 입력 가능하지만 미리 채워줌)
          ...(userPhoneNumber && { phoneNumber: userPhoneNumber }),
        },
      })

      if (!billingKeyResponse || billingKeyResponse.code !== undefined) {
        // 빌링키 발급 실패
        toast({
          variant: 'destructive',
          title: '카드 등록 실패',
          description: billingKeyResponse?.message || '카드 등록에 실패했습니다',
        })
        setRegistering(false)
        return
      }

      // 빌링키 발급 성공
      const billingKey = billingKeyResponse.billingKey
      
      // 빌링키 발급 응답에서 사용자 정보 추출
      // 포트원 V2 빌링키 발급 UI에서 사용자가 입력한 정보가 응답에 포함될 수 있음
      // 타입 단언을 사용하여 응답 구조 확인
      const responseAny = billingKeyResponse as any
      const customerInfo = responseAny.customer || responseAny.billingKeyInfo?.customer || {}
      
      // 빌링키 발급 UI에서 사용자가 입력한 전화번호 추출
      const buyerInfo = {
        name: customerInfo.fullName || customerInfo.name || user.email?.split('@')[0] || '사용자',
        email: customerInfo.email || user.email || '',
        tel: customerInfo.phoneNumber || customerInfo.phone || customerInfo.tel || '', // 빌링키 발급 UI에서 입력한 전화번호
      }
      
      console.log('빌링키 발급 응답:', {
        billingKey: billingKey.substring(0, 20) + '...',
        customerInfo,
        buyerInfo,
        fullResponse: responseAny, // 디버깅용 전체 응답
      })

      // 서버에 구독 등록 요청
      try {
        const registerResponse = await fetch('/api/subscription-v2/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            billingKey,
            buyer_info: buyerInfo,
          }),
        })

        const data = await registerResponse.json()

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
      } finally {
        setRegistering(false)
      }
    } catch (error: any) {
      console.error('구독 등록 오류:', error)
      toast({
        variant: 'destructive',
        title: '오류 발생',
        description: error.message || '알 수 없는 오류가 발생했습니다',
      })
    } finally {
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

