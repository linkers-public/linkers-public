'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { Heart, Building2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

interface BookmarkedProject {
  id: number
  bookmark_id: number
  counsel_id: number
  title: string
  feild: string | null
  cost: any
  due_date: string
  created_at: string
}

export default function BookmarkedProjectsClient() {
  const router = useRouter()
  const [projects, setProjects] = useState<BookmarkedProject[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadBookmarkedProjects()
  }, [])

  const loadBookmarkedProjects = async () => {
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

      // project_bookmarks 테이블에서 북마크 조회
      // counsel 테이블이 없을 수 있으므로 먼저 북마크만 조회
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('project_bookmarks' as any)
        .select('id, counsel_id, created_at')
        .eq('profile_id', profile.profile_id)
        .order('created_at', { ascending: false })

      if (bookmarksError) {
        console.error('북마크 조회 실패:', bookmarksError)
        throw bookmarksError
      }

      if (!bookmarks || bookmarks.length === 0) {
        setProjects([])
        return
      }

      // counsel 테이블이 있는지 확인하고 조인 시도
      let counselDataMap: Record<number, any> = {}
      try {
        const counselIds = bookmarks.map((b: any) => b.counsel_id)
        const { data: counselData, error: counselError } = await supabase
          .from('counsel')
          .select('counsel_id, title, feild, cost, due_date')
          .in('counsel_id', counselIds)

        if (!counselError && counselData) {
          counselData.forEach((c: any) => {
            counselDataMap[c.counsel_id] = c
          })
        }
      } catch (counselErr: any) {
        // counsel 테이블이 없거나 접근할 수 없는 경우 무시
        console.warn('counsel 테이블 조회 실패:', counselErr.message)
      }

      // 북마크 데이터 포맷팅
      const formattedProjects: BookmarkedProject[] = bookmarks.map((bookmark: any) => {
        const counsel = counselDataMap[bookmark.counsel_id]
        return {
          id: bookmark.counsel_id,
          bookmark_id: bookmark.id,
          counsel_id: bookmark.counsel_id,
          title: counsel?.title || `프로젝트 #${bookmark.counsel_id}`,
          feild: counsel?.feild || null,
          cost: counsel?.cost || null,
          due_date: counsel?.due_date || '',
          created_at: bookmark.created_at,
        }
      })

      setProjects(formattedProjects)
    } catch (error: any) {
      console.error('관심 프로젝트 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '관심 프로젝트를 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnbookmark = async (bookmarkId: number) => {
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
        .from('project_bookmarks' as any)
        .delete()
        .eq('id', bookmarkId)
        .eq('profile_id', profile.profile_id)

      if (error) throw error

      toast({
        title: '북마크 해제 완료',
        description: '관심 프로젝트에서 제거되었습니다.',
      })

      // 목록 새로고침
      loadBookmarkedProjects()
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
          <p className="text-gray-600">관심 프로젝트를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-4 md:py-6 px-2 md:px-4">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">관심 프로젝트</h1>
        <p className="text-gray-600">스크랩한 프로젝트 리스트를 확인하세요</p>
      </div>

      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 md:p-12 text-center">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">관심 프로젝트가 없습니다.</p>
            <Link href="/search-projects">
              <Button className="mt-4">프로젝트 찾기</Button>
            </Link>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {project.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2">
                    분야: {project.feild}
                  </p>
                  {project.cost && (
                    <p className="text-sm text-gray-600 mb-2">
                      예상 비용: {typeof project.cost === 'number' ? project.cost.toLocaleString() : project.cost}원
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    마감일: {new Date(project.due_date).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <Button
                  onClick={() => handleUnbookmark(project.bookmark_id)}
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700"
                >
                  <Heart className="w-5 h-5 fill-current" />
                </Button>
              </div>
              <Link href={`/enterprise/my-counsel/${project.counsel_id}`}>
                <Button variant="outline" className="w-full">
                  상세보기
                </Button>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

