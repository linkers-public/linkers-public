'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * V1 구독 등록 페이지는 더 이상 사용하지 않습니다.
 * V2 페이지로 리다이렉트합니다.
 */
export default function SubscriptionRegisterPage() {
  const router = useRouter()

  useEffect(() => {
    // V2 구독 등록 페이지로 리다이렉트
    router.replace('/my/subscription/register-v2')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">리다이렉트 중...</p>
      </div>
    </div>
  )
}

