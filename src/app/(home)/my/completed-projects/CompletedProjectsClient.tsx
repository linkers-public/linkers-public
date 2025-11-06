'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { Archive, CheckCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

interface Project {
  counsel_id: number
  title: string
  completed_at: string
  created_at: string
}

export default function CompletedProjectsClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadCompletedProjects()
  }, [])

  const loadCompletedProjects = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // client 테이블에서 client_id 가져오기
      const { data: clientData } = await supabase
        .from('client')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!clientData) {
        toast({
          variant: 'destructive',
          title: '기업 계정이 아닙니다',
        })
        return
      }

      // 완료된 프로젝트 조회
      // counsel 테이블에 created_at 컬럼이 없으므로 counsel_date 또는 start_date 사용
      const { data: counselData, error } = await supabase
        .from('counsel')
        .select('counsel_id, title, counsel_date, start_date')
        .eq('client_id', clientData.user_id)
        .eq('counsel_status', 'end')
        .order('counsel_date', { ascending: false })

      if (error) throw error

      const formattedProjects: Project[] = (counselData || []).map((counsel: any) => ({
        counsel_id: counsel.counsel_id,
        title: counsel.title,
        completed_at: counsel.counsel_date || counsel.start_date || new Date().toISOString(),
        created_at: counsel.start_date || counsel.counsel_date || new Date().toISOString(),
      }))

      setProjects(formattedProjects)
    } catch (error: any) {
      console.error('완료 프로젝트 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '완료 프로젝트를 불러오는데 실패했습니다',
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
          <p className="text-gray-600">완료 프로젝트를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full md:py-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">완료 프로젝트 저장함</h1>
        <p className="text-gray-600">아카이브 성격의 완료된 프로젝트를 확인하세요</p>
      </div>

      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 md:p-12 text-center">
            <Archive className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">완료된 프로젝트가 없습니다.</p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.counsel_id}
              className="bg-white rounded-lg shadow-sm border p-4 md:p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {project.title}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    완료일: {new Date(project.completed_at).toLocaleDateString('ko-KR')}
                  </p>
                  <p className="text-xs text-gray-500">
                    생성일: {new Date(project.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <Link href={`/enterprise/my-counsel/${project.counsel_id}`}>
                  <Button variant="outline" size="sm">
                    상세보기
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

