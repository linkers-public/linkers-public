'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  createProjectAndRequestEstimate,
  requestEstimateToTeam,
  getCompanyCounsels
} from '@/apis/company-project.service'
import { searchTeams } from '@/apis/team.service'
import { toast } from '@/hooks/use-toast'
import { 
  FileText, 
  DollarSign,
  Calendar,
  Users,
  Plus,
  Search,
  Loader2,
  Clock
} from 'lucide-react'

interface Team {
  id: number
  name: string
  bio?: string | null
  specialty?: string[] | null
  manager?: {
    username: string
  } | null | any
}

interface Project {
  counsel_id: number
  title: string | null
  outline: string | null
  counsel_status: string
  start_date: string
  due_date: string
  cost?: string | null
  period?: string | null
  feild?: string | null
  created_at?: string
  estimate_count?: number
}

export default function CompanyProjectsClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [statusFilter, setStatusFilter] = useState<'all' | 'with_estimates' | 'without_estimates'>('all')
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  
  // 견적 요청 관련
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [searchingTeams, setSearchingTeams] = useState(false)
  const [teamSearchTerm, setTeamSearchTerm] = useState('')
  const [teamResults, setTeamResults] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedProjectForRequest, setSelectedProjectForRequest] = useState<number | null>(null)
  const [requestForm, setRequestForm] = useState({
    title: '',
    outline: '',
    start_date: '',
    due_date: ''
  })
  const [submittingRequest, setSubmittingRequest] = useState(false)
  const [submittingToExistingProject, setSubmittingToExistingProject] = useState(false)
  
  const supabase = createSupabaseBrowserClient()

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      const data = await getCompanyCounsels()
      // 각 프로젝트의 견적서 개수 가져오기
      const projectsWithCounts = await Promise.all(
        (data || []).map(async (project: any) => {
          const { count } = await supabase
            .from('estimate')
            .select('*', { count: 'exact', head: true })
            .eq('counsel_id', project.counsel_id)
          return {
            ...project,
            estimate_count: count || 0
          }
        })
      )
      setProjects(projectsWithCounts)
    } catch (error: any) {
      console.error('데이터 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '데이터를 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 프로젝트 필터링 (견적서 개수 기준)
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredProjects(projects)
    } else if (statusFilter === 'with_estimates') {
      setFilteredProjects(projects.filter(project => 
        (project.estimate_count || 0) > 0
      ))
    } else if (statusFilter === 'without_estimates') {
      setFilteredProjects(projects.filter(project => 
        (project.estimate_count || 0) === 0
      ))
    }
  }, [projects, statusFilter])

  const handleSearchTeams = async () => {
    if (!teamSearchTerm.trim()) {
      setTeamResults([])
      return
    }

    setSearchingTeams(true)
    try {
      const { data } = await searchTeams({
        searchTerm: teamSearchTerm.trim()
      })
      setTeamResults(data || [])
    } catch (error: any) {
      console.error('팀 검색 실패:', error)
      toast({
        variant: 'destructive',
        title: '팀 검색 실패',
        description: error.message,
      })
    } finally {
      setSearchingTeams(false)
    }
  }

  const handleRequestEstimate = async () => {
    if (!selectedTeam) {
      toast({
        variant: 'destructive',
        title: '팀을 선택해주세요',
      })
      return
    }

    // 기존 프로젝트에 견적 요청하는 경우
    if (selectedProjectForRequest) {
      setSubmittingToExistingProject(true)
      try {
        await requestEstimateToTeam(selectedProjectForRequest, selectedTeam.id)
        toast({
          title: '견적 요청 완료',
          description: `${selectedTeam.name} 팀에 견적을 요청했습니다.`,
        })
        setShowRequestDialog(false)
        setSelectedTeam(null)
        setSelectedProjectForRequest(null)
        setTeamSearchTerm('')
        setTeamResults([])
        loadData()
      } catch (error: any) {
        console.error('견적 요청 실패:', error)
        toast({
          variant: 'destructive',
          title: '견적 요청 실패',
          description: error.message,
        })
      } finally {
        setSubmittingToExistingProject(false)
      }
      return
    }

    // 새 프로젝트 생성하는 경우
    if (!requestForm.title || !requestForm.outline || !requestForm.start_date || !requestForm.due_date) {
      toast({
        variant: 'destructive',
        title: '모든 필드를 입력해주세요',
      })
      return
    }

    setSubmittingRequest(true)
    try {
      await createProjectAndRequestEstimate(selectedTeam.id, {
        title: requestForm.title,
        outline: requestForm.outline,
        start_date: requestForm.start_date,
        due_date: requestForm.due_date,
      })

      toast({
        title: '견적 요청 완료',
        description: `${selectedTeam.name} 팀에 견적을 요청했습니다.`,
      })

      setShowRequestDialog(false)
      setSelectedTeam(null)
      setRequestForm({
        title: '',
        outline: '',
        start_date: '',
        due_date: ''
      })
      setTeamSearchTerm('')
      setTeamResults([])
      loadData()
    } catch (error: any) {
      console.error('견적 요청 실패:', error)
      toast({
        variant: 'destructive',
        title: '견적 요청 실패',
        description: error.message,
      })
    } finally {
      setSubmittingRequest(false)
    }
  }

  const handleRequestEstimateToExistingProject = (counselId: number) => {
    setSelectedProjectForRequest(counselId)
    setShowRequestDialog(true)
    }


  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: '대기중', className: 'bg-yellow-100 text-yellow-800' },
      accept: { label: '수락', className: 'bg-green-100 text-green-800' },
      in_progress: { label: '진행중', className: 'bg-blue-100 text-blue-800' },
      completed: { label: '완료', className: 'bg-gray-100 text-gray-800' },
      recruiting: { label: '모집중', className: 'bg-blue-100 text-blue-800' },
      end: { label: '종료', className: 'bg-gray-100 text-gray-800' },
    }
    
    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  const handleProjectClick = (counselId: number) => {
    router.push(`/enterprise/counsel-detail/${counselId}`)
  }

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full md:py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">내 프로젝트</h1>
          <p className="text-gray-600">프로젝트와 견적 요청을 관리하세요</p>
        </div>
        <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              견적 요청
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedProjectForRequest ? '기존 프로젝트에 견적 요청' : '프리랜서팀에게 견적 요청'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {selectedProjectForRequest && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-900">
                    기존 프로젝트에 특정 팀을 지정하여 견적을 요청합니다.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedProjectForRequest(null)
                      setRequestForm({
                        title: '',
                        outline: '',
                        start_date: '',
                        due_date: ''
                      })
                    }}
                    className="mt-2"
                  >
                    새 프로젝트로 변경
                  </Button>
                </div>
              )}
              {/* 팀 검색 */}
              <div>
                <Label>팀 검색</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="팀명 또는 매니저명으로 검색"
                    value={teamSearchTerm}
                    onChange={(e) => setTeamSearchTerm(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearchTeams()
                      }
                    }}
                  />
                  <Button onClick={handleSearchTeams} disabled={searchingTeams}>
                    {searchingTeams ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                
                {/* 팀 검색 결과 */}
                {teamResults.length > 0 && (
                  <div className="mt-2 border rounded-lg max-h-48 overflow-y-auto">
                    {teamResults.map((team) => (
                      <div
                        key={team.id}
                        onClick={() => setSelectedTeam(team)}
                        className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                          selectedTeam?.id === team.id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="font-medium">{team.name}</div>
                        <div className="text-sm text-gray-600">
                          매니저: {team.manager?.username || '없음'}
                        </div>
                        {team.bio && (
                          <div className="text-xs text-gray-500 mt-1">{team.bio}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedTeam && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <div className="font-medium text-blue-900">선택된 팀: {selectedTeam.name}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTeam(null)}
                      className="mt-1"
                    >
                      선택 취소
                    </Button>
                  </div>
                )}
              </div>

              {/* 프로젝트 정보 입력 (새 프로젝트인 경우만) */}
              {!selectedProjectForRequest && (
                <>
              <div>
                <Label htmlFor="title">프로젝트 제목 *</Label>
                <Input
                  id="title"
                  value={requestForm.title}
                  onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })}
                  placeholder="예: 웹사이트 개발 프로젝트"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="outline">프로젝트 개요 *</Label>
                <textarea
                  id="outline"
                  value={requestForm.outline}
                  onChange={(e) => setRequestForm({ ...requestForm, outline: e.target.value })}
                  placeholder="프로젝트에 대한 상세 설명을 입력해주세요"
                  className="mt-1 w-full min-h-[100px] p-2 border rounded-md"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">시작 예정일 *</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={requestForm.start_date}
                    onChange={(e) => setRequestForm({ ...requestForm, start_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="due_date">마감 예정일 *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={requestForm.due_date}
                    onChange={(e) => setRequestForm({ ...requestForm, due_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRequestDialog(false)
                    setSelectedTeam(null)
                    setSelectedProjectForRequest(null)
                    setRequestForm({
                      title: '',
                      outline: '',
                      start_date: '',
                      due_date: ''
                    })
                    setTeamSearchTerm('')
                    setTeamResults([])
                  }}
                >
                  취소
                </Button>
                <Button
                  onClick={handleRequestEstimate}
                  disabled={(submittingRequest || submittingToExistingProject) || !selectedTeam}
                >
                  {(submittingRequest || submittingToExistingProject) ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      요청 중...
                    </>
                  ) : (
                    selectedProjectForRequest ? '기존 프로젝트에 견적 요청' : '견적 요청하기'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 프로젝트 목록 */}
      <div className="space-y-4">
        {/* 필터 */}
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              전체 ({projects.length})
            </button>
        <button
              onClick={() => setStatusFilter('with_estimates')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                statusFilter === 'with_estimates'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
              견적서 있음 ({projects.filter(p => (p.estimate_count || 0) > 0).length})
        </button>
        <button
              onClick={() => setStatusFilter('without_estimates')}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                statusFilter === 'without_estimates'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
              견적서 없음 ({projects.filter(p => (p.estimate_count || 0) === 0).length})
        </button>
      </div>

          {filteredProjects.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">프로젝트가 없습니다</p>
              <Button onClick={() => router.push('/enterprise/counsel-form')}>
                <Plus className="w-4 h-4 mr-2" />
                프로젝트 등록하기
              </Button>
            </div>
          ) : (
            filteredProjects.map((project) => (
              <div
                key={project.counsel_id}
                className="bg-white rounded-lg shadow-sm border p-4 md:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => handleProjectClick(project.counsel_id)}
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {project.title || '제목 없음'}
                    </h3>
                    {getStatusBadge(project.counsel_status)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>견적서 {project.estimate_count || 0}개</span>
                  </div>
                </div>
                
                {project.outline && (
                  <p 
                    className="text-sm text-gray-700 mb-4 line-clamp-2 cursor-pointer"
                    onClick={() => handleProjectClick(project.counsel_id)}
                  >
                    {project.outline}
                  </p>
                )}

                <div 
                  className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 cursor-pointer"
                  onClick={() => handleProjectClick(project.counsel_id)}
                >
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                      기간: {project.start_date} ~ {project.due_date}
                        </span>
                  </div>
                  {project.cost && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>예산: {project.cost}</span>
                    </div>
                  )}
                  {project.period && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>기간: {project.period}</span>
                    </div>
                  )}
                        </div>

                {project.feild && (
                  <div 
                    className="mt-4 pt-4 border-t cursor-pointer"
                    onClick={() => handleProjectClick(project.counsel_id)}
                  >
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                      {project.feild}
                    </span>
                    </div>
                  )}

                {/* 기존 프로젝트에 견적 요청 버튼 */}
                <div className="mt-4 pt-4 border-t flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRequestEstimateToExistingProject(project.counsel_id)
                    }}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    팀에게 견적 요청
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
    </div>
  )
}
