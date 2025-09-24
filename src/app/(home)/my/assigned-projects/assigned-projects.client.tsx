'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAssignedProjects, updateAssignmentStatus } from '@/apis/assignment.service'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

interface AssignedProject {
  id: number
  counsel_id: number
  maker_id: string
  assigned_by: string
  assignment_status: 'pending' | 'accepted' | 'declined'
  created_at: string
  updated_at: string
}

const AssignedProjectsClient: React.FC = () => {
  const [assignedProjects, setAssignedProjects] = useState<AssignedProject[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<number | null>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchAssignedProjects = async () => {
      try {
        const data = await getAssignedProjects()
        setAssignedProjects(data || [])
      } catch (error) {
        console.error('Error fetching assigned projects:', error)
        toast({
          variant: 'destructive',
          title: '에러 발생',
          description: '할당된 프로젝트를 불러오는데 실패했습니다.',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchAssignedProjects()
  }, [])

  const handleAssignmentResponse = async (
    assignmentId: number, 
    status: 'accepted' | 'declined'
  ) => {
    setUpdating(assignmentId)
    try {
      await updateAssignmentStatus(assignmentId, status)
      
      // 로컬 상태 업데이트
      setAssignedProjects(prev => 
        prev.map(project => 
          project.id === assignmentId 
            ? { ...project, assignment_status: status }
            : project
        )
      )

      toast({
        title: '응답 완료',
        description: status === 'accepted' 
          ? '프로젝트 참여를 수락했습니다.' 
          : '프로젝트 참여를 거절했습니다.',
      })
    } catch (error) {
      console.error('Error updating assignment status:', error)
      toast({
        variant: 'destructive',
        title: '에러 발생',
        description: '응답 처리에 실패했습니다.',
      })
    } finally {
      setUpdating(null)
    }
  }

  const handleViewProject = (counselId: number) => {
    router.push(`/project-detail/${counselId}`)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-gray-600">로딩중...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">할당된 프로젝트</h1>
        <p className="text-gray-600">
          운영자가 귀하에게 할당한 프로젝트 목록입니다.
        </p>
      </div>

      {assignedProjects.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">할당된 프로젝트가 없습니다</h3>
          <p className="text-gray-600">
            운영자가 귀하에게 할당한 프로젝트가 없습니다. 프로젝트 검색에서 관심 있는 프로젝트를 찾아보세요.
          </p>
          <Button 
            onClick={() => router.push('/search-projects')}
            className="mt-4"
          >
            프로젝트 검색하기
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {assignedProjects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    프로젝트 ID: {project.counsel_id}
                  </h3>
                  <p className="text-sm text-gray-600">
                    할당자 ID: {project.assigned_by}
                  </p>
                  <p className="text-sm text-gray-600">
                    할당일: {new Date(project.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    project.assignment_status === 'pending' 
                      ? 'bg-yellow-100 text-yellow-800'
                      : project.assignment_status === 'accepted'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {project.assignment_status === 'pending' && '대기중'}
                    {project.assignment_status === 'accepted' && '수락됨'}
                    {project.assignment_status === 'declined' && '거절됨'}
                  </span>
                </div>
              </div>




              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => handleViewProject(project.counsel_id)}
                  variant="outline"
                  className="flex-1"
                >
                  상세 보기
                </Button>
                
                {project.assignment_status === 'pending' && (
                  <>
                    <Button
                      onClick={() => handleAssignmentResponse(project.id, 'accepted')}
                      disabled={updating === project.id}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      {updating === project.id ? '처리중...' : '참여 수락'}
                    </Button>
                    <Button
                      onClick={() => handleAssignmentResponse(project.id, 'declined')}
                      disabled={updating === project.id}
                      variant="outline"
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      {updating === project.id ? '처리중...' : '참여 거절'}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AssignedProjectsClient
