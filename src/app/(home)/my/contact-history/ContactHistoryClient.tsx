'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Phone, User } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

interface ContactHistory {
  id: string
  profile_id: string
  username: string
  contact_phone: string
  purchased_at: string
  price: number
}

export default function ContactHistoryClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [contacts, setContacts] = useState<ContactHistory[]>([])
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadContactHistory()
  }, [])

  const loadContactHistory = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
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
        toast({
          variant: 'destructive',
          title: '프로필이 필요합니다',
          description: '프로필을 생성해주세요.',
        })
        router.push('/my/profile/manage')
        return
      }

      // contact_purchases 테이블에서 구매 기록 조회
      const { data: purchases, error: purchasesError } = await supabase
        .from('contact_purchases' as any)
        .select('id, seller_profile_id, price, purchased_at')
        .eq('buyer_user_id', user.id)
        .eq('buyer_profile_id', profile.profile_id)
        .order('purchased_at', { ascending: false })

      if (purchasesError) {
        console.error('구매 기록 조회 실패:', purchasesError)
        throw purchasesError
      }

      if (!purchases || purchases.length === 0) {
        setContacts([])
        return
      }

      // accounts 테이블에서 프리랜서 정보 가져오기
      const sellerProfileIds = purchases.map((p: any) => p.seller_profile_id)
      const { data: sellerData, error: sellerError } = await supabase
        .from('accounts')
        .select('profile_id, username')
        .in('profile_id', sellerProfileIds)
        .eq('profile_type', 'FREELANCER')

      if (sellerError) {
        console.error('프리랜서 정보 조회 실패:', sellerError)
        throw sellerError
      }

      // 구매 기록 데이터 포맷팅
      const formattedContacts: ContactHistory[] = purchases.map((purchase: any) => {
        const seller = sellerData?.find((s: any) => s.profile_id === purchase.seller_profile_id)
        return {
          id: purchase.id.toString(),
          profile_id: purchase.seller_profile_id,
          username: seller?.username || '알 수 없음',
          contact_phone: '', // accounts 테이블에 contact_phone 컬럼이 없음
          purchased_at: purchase.purchased_at,
          price: purchase.price,
        }
      })

      setContacts(formattedContacts)
    } catch (error: any) {
      console.error('연락처 열람 기록 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '연락처 열람 기록을 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">연락처 열람 기록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-4 md:py-6 px-2 md:px-4">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">연락처 열람 기록</h1>
        <p className="text-gray-600">어떤 프리랜서 연락처를 구매했는지 확인하세요</p>
      </div>

      <div className="space-y-4">
        {contacts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 md:p-12 text-center">
            <Phone className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">연락처 열람 기록이 없습니다.</p>
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-white rounded-lg shadow-sm border p-4 md:p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                    {contact.username?.[0] || '?'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {contact.username}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                      <Phone className="w-4 h-4" />
                      <span>{contact.contact_phone}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      구매일: {new Date(contact.purchased_at).toLocaleDateString('ko-KR')}
                    </p>
                    <p className="text-xs text-gray-500">
                      구매 금액: {contact.price.toLocaleString()}원
                    </p>
                  </div>
                </div>
                <Link href={`/maker-profile/${contact.username}`}>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    프로필 보기
                  </button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

