'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { Heart, Building2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

interface BookmarkedCompany {
  id: number
  company_id: string
  company_name: string
  email: string
  created_at: string
}

export default function BookmarkedCompaniesClient() {
  const router = useRouter()
  const [companies, setCompanies] = useState<BookmarkedCompany[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadBookmarkedCompanies()
  }, [])

  const loadBookmarkedCompanies = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // TODO: company_bookmarks 테이블이 있다면 사용, 없다면 다른 방식으로 구현
      // 현재는 client 테이블에서 북마크된 기업을 조회하는 로직이 필요합니다
      // 임시로 빈 배열 반환
      setCompanies([])
      
      toast({
        title: '준비 중',
        description: '관심 기업 기능은 곧 제공될 예정입니다.',
      })
    } catch (error: any) {
      console.error('관심 기업 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '관심 기업을 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnbookmark = async (companyId: string) => {
    try {
      // TODO: 북마크 해제 로직 구현
      toast({
        title: '준비 중',
        description: '북마크 해제 기능은 곧 제공될 예정입니다.',
      })
    } catch (error: any) {
      console.error('북마크 해제 실패:', error)
      toast({
        variant: 'destructive',
        title: '북마크 해제 실패',
        description: error.message,
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">관심 기업을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-4 md:py-6 px-2 md:px-4">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">관심 기업</h1>
        <p className="text-gray-600">저장해둔 기업 리스트를 확인하세요</p>
      </div>

      <div className="space-y-4">
        {companies.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 md:p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">관심 기업이 없습니다.</p>
            <Link href="/search-makers">
              <Button className="mt-4">기업 찾기</Button>
            </Link>
          </div>
        ) : (
          companies.map((company) => (
            <div
              key={company.id}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {company.company_name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    이메일: {company.email}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    저장일: {new Date(company.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <Button
                  onClick={() => handleUnbookmark(company.company_id)}
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700"
                >
                  <Heart className="w-5 h-5 fill-current" />
                </Button>
              </div>
              <Link href={`/enterprise/maker-profile/${company.company_id}`}>
                <Button variant="outline" className="w-full">
                  프로필 보기
                </Button>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

