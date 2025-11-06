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
  bookmark_id?: number
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

      // company_bookmarks 테이블에서 북마크 조회
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('company_bookmarks' as any)
        .select('id, company_profile_id, created_at')
        .eq('profile_id', profile.profile_id)
        .order('created_at', { ascending: false })

      if (bookmarksError) {
        console.error('북마크 조회 실패:', bookmarksError)
        throw bookmarksError
      }

      if (!bookmarks || bookmarks.length === 0) {
        setCompanies([])
        return
      }

      // accounts 테이블에서 기업 정보 가져오기
      const companyProfileIds = bookmarks.map((b: any) => b.company_profile_id)
      const { data: companyData, error: companyError } = await supabase
        .from('accounts')
        .select('profile_id, username, user_id')
        .in('profile_id', companyProfileIds)
        .eq('profile_type', 'COMPANY')

      if (companyError) {
        console.error('기업 정보 조회 실패:', companyError)
        throw companyError
      }

      // client 테이블에서 이메일 정보 가져오기
      const userIds = companyData?.map((c: any) => c.user_id).filter(Boolean) || []
      const { data: clientData } = await supabase
        .from('client')
        .select('user_id, email')
        .in('user_id', userIds)

      // 북마크 데이터 포맷팅
      const formattedCompanies: BookmarkedCompany[] = bookmarks.map((bookmark: any) => {
        const company = companyData?.find((c: any) => c.profile_id === bookmark.company_profile_id)
        const client = clientData?.find((c: any) => c.user_id === company?.user_id)
        return {
          id: bookmark.id,
          bookmark_id: bookmark.id,
          company_id: bookmark.company_profile_id,
          company_name: company?.username || '알 수 없음',
          email: client?.email || '',
          created_at: bookmark.created_at,
        }
      })

      setCompanies(formattedCompanies)
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
        })
        return
      }

      // 북마크 삭제
      const { error } = await supabase
        .from('company_bookmarks' as any)
        .delete()
        .eq('profile_id', profile.profile_id)
        .eq('company_profile_id', companyId)

      if (error) throw error

      toast({
        title: '북마크 해제 완료',
        description: '관심 기업에서 제거되었습니다.',
      })

      // 목록 새로고침
      loadBookmarkedCompanies()
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
    <div className="w-full md:py-6">
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
              className="bg-white rounded-lg shadow-sm border p-4 md:p-6"
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
                  title="북마크 해제"
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

