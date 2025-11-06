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
        .select('counsel_id, title, counsel_status, start_date, due_date, counsel_date')
        .eq('client_id', clientData.user_id)
        .in('counsel_status', ['pending', 'recruiting'])
        .order('start_date', { ascending: false })

      if (error) throw error

      const formattedProjects: Project[] = (counselData || []).map((counsel: any) => ({
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
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">진행 이력</h1>
        <p className="text-gray-600">지난 프로젝트 타임라인을 확인하세요</p>
      </div>

      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 md:p-12 text-center">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">진행 중인 프로젝트가 없습니다.</p>
          </div>
        ) : (
          projects.map((project) => (
            <div
              key={project.counsel_id}
              className="bg-white rounded-lg shadow-sm border p-4 md:p-6"
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

