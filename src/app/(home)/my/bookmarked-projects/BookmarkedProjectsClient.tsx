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
  counsel_id: number
  title: string
  feild: string
  expected_cost: number
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

      // TODO: project_bookmarks 테이블이 있다면 사용, 없다면 다른 방식으로 구현
      // 현재는 counsel 테이블에서 북마크된 프로젝트를 조회하는 로직이 필요합니다
      // 임시로 빈 배열 반환
      setProjects([])
      
      toast({
        title: '준비 중',
        description: '관심 프로젝트 기능은 곧 제공될 예정입니다.',
      })
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

  const handleUnbookmark = async (projectId: number) => {
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
                  <p className="text-sm text-gray-600 mb-2">
                    예상 비용: {project.expected_cost?.toLocaleString()}원
                  </p>
                  <p className="text-xs text-gray-500">
                    마감일: {new Date(project.due_date).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <Button
                  onClick={() => handleUnbookmark(project.id)}
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

