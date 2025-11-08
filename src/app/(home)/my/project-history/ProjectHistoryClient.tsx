'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

interface Project {
  counsel_id: number
  title: string
  status: string
  start_date: string
  end_date?: string
  created_at: string
}

export default function ProjectHistoryClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadProjectHistory()
  }, [])

  const loadProjectHistory = async () => {
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

      // 진행 중인 프로젝트 조회
      // counsel 테이블의 counsel_status enum: 'pending', 'recruiting', 'end'
      // 진행 중인 프로젝트는 'pending' 또는 'recruiting' 상태
      const { data: counselData, error } = await supabase
        .from('counsel')
        .select('counsel_id, title, counsel_status, start_date, due_date, counsel_date, outline, deleted_at')
        .eq('client_id', clientData.user_id)
        .in('counsel_status', ['pending', 'recruiting'])
        .is('deleted_at', null)
        .order('start_date', { ascending: false })

      if (error) throw error

      // 잘못 생성된 counsel 필터링
      const validCounsels = (counselData || []).filter((counsel: any) => {
        // 제목에 "팀 견적 요청" 패턴이 있는 경우 제외
        if (counsel.title && (
          counsel.title.includes('팀 견적 요청') || 
          counsel.title.includes('팀 팀 견적 요청')
        )) {
          return false
        }
        
        // outline에 "팀 견적을 요청" 패턴이 있는 경우 제외
        if (counsel.outline && (
          counsel.outline.includes('팀 견적을 요청') ||
          counsel.outline.includes('팀 견적 요청') ||
          counsel.outline.includes('프젝에 참여')
        )) {
          return false
        }

        return true
      })

      const formattedProjects: Project[] = validCounsels.map((counsel: any) => ({
        counsel_id: counsel.counsel_id,
        title: counsel.title,
        status: counsel.counsel_status,
        start_date: counsel.start_date || counsel.counsel_date || new Date().toISOString(),
        end_date: counsel.due_date,
        created_at: counsel.counsel_date || counsel.start_date || new Date().toISOString(),
      }))

      setProjects(formattedProjects)
    } catch (error: any) {
      console.error('프로젝트 이력 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '프로젝트 이력을 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: '대기중', className: 'bg-gray-100 text-gray-800' },
      recruiting: { label: '매칭중', className: 'bg-yellow-100 text-yellow-800' },
      end: { label: '완료', className: 'bg-green-100 text-green-800' },
    }

    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
        <Clock className="w-3 h-3" />
        {statusInfo.label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">프로젝트 이력을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full md:py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">진행 이력</h1>
        <p className="text-gray-600">진행 중인 프로젝트를 확인하세요</p>
      </div>

      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium mb-2">진행 중인 프로젝트가 없습니다</p>
            <p className="text-sm text-gray-400">새 프로젝트를 등록하거나 견적을 요청해보세요</p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.counsel_id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {project.title}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span>
                      시작일: {new Date(project.start_date).toLocaleDateString('ko-KR')}
                    </span>
                    {project.end_date && (
                      <span>
                        마감일: {new Date(project.end_date).toLocaleDateString('ko-KR')}
                      </span>
                    )}
                  </div>
                  {getStatusBadge(project.status)}
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

