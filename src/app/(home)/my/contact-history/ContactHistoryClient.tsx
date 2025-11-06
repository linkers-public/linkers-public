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

      // TODO: 연락처 열람 기록 조회 (contact_purchases 테이블)
      // 현재는 임시로 빈 배열
      setContacts([])
      
      toast({
        title: '준비 중',
        description: '연락처 열람 기록 기능은 곧 제공될 예정입니다.',
      })
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
              className="bg-white rounded-lg shadow-sm border p-6"
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

