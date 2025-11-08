'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { 
  getReceivedEstimates,
  getEstimateDetail,
  updateEstimateStatus
} from '@/apis/company-project.service'
import {
  checkEstimateViewAccess,
  createEstimateView,
  createPaidEstimateView,
  type EstimateViewAccess
} from '@/apis/estimate-view.service'
import { toast } from '@/hooks/use-toast'
import { 
  FileText, 
  Eye,
  DollarSign,
  Calendar,
  Users,
  Search,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface Counsel {
  counsel_id: number
  title: string | null
  outline: string | null
  counsel_status: string
  start_date: string
  due_date: string
  cost: string | null
  period: string | null
  feild: string | null
}

interface Estimate {
  estimate_id: number
  team_id: number
  counsel_id: number | null
  client_id: string
  estimate_status: string
  estimate_start_date: string | null
  estimate_due_date: string | null
  created_at?: string
  teams?: Array<{
    id: number
    name: string
    manager_id: string
    contact_phone?: string | null
    contact_email?: string | null
    contact_website?: string | null
  }>
  counsel?: Counsel | null
  estimate_version?: Array<{
    estimate_version_id: number
    total_amount: number | null
    detail: string | null
    start_date: string | null
    end_date: string | null
    version_date: string | null
  }>
}

interface ProjectGroup {
  counsel_id: number
  counsel: Counsel
  estimates: Estimate[]
}

interface EstimateDetail extends Estimate {
  milestone?: Array<{
    milestone_id: number
    estimate_id: number | null
    estimate_version_id: number | null
    title: string | null
    detail: string | null
    payment_amount: number | null
    milestone_start_date: string | null
    milestone_due_date: string | null
    progress: number
  }>
}

type ViewMode = 'project' | 'all'
type StatusFilter = 'all' | 'pending' | 'accept' | 'in_progress' | 'completed' | 'rejected'

export default function CompanyEstimatesClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([])
  const [selectedProject, setSelectedProject] = useState<number | null>(null)
  const [selectedEstimate, setSelectedEstimate] = useState<EstimateDetail | null>(null)
  const [viewAccess, setViewAccess] = useState<EstimateViewAccess | null>(null)
  const [checkingAccess, setCheckingAccess] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('project')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set())
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadEstimates()
  }, [])

  const loadEstimates = async () => {
    try {
      setLoading(true)
      const data = await getReceivedEstimates()
      setEstimates(data)
      
      // 프로젝트별로 그룹화
      const grouped = new Map<number, ProjectGroup>()
      
      data.forEach((estimate: any) => {
        // Supabase 관계 조인 결과 확인
        // counsel이 배열일 수도 있고 객체일 수도 있음
        const counsel = Array.isArray(estimate.counsel) 
          ? estimate.counsel[0] 
          : estimate.counsel
        
        // team이 배열일 수도 있고 객체일 수도 있음
        const team = Array.isArray(estimate.team)
          ? estimate.team[0]
          : estimate.team
        
        // teams 배열 형태로 변환 (기존 코드와 호환성 유지)
        estimate.teams = team ? [team] : []
        
        if (!estimate.counsel_id) {
          // counsel_id가 없는 견적서는 별도 처리 (임시로 "미지정 프로젝트" 그룹에 추가)
          console.warn('counsel_id가 없는 견적서:', estimate.estimate_id)
          return
        }
        
        if (!counsel) {
          // counsel 정보가 없는 경우도 처리
          console.warn('counsel 정보가 없는 견적서:', estimate.estimate_id, 'counsel_id:', estimate.counsel_id)
          return
        }
        
        if (!grouped.has(estimate.counsel_id)) {
          grouped.set(estimate.counsel_id, {
            counsel_id: estimate.counsel_id,
            counsel: counsel,
            estimates: []
          })
        }
        
        // counsel 정보를 estimate에 추가
        estimate.counsel = counsel
        grouped.get(estimate.counsel_id)!.estimates.push(estimate)
      })
      
      // 그룹화 완료
      
      // 프로젝트별로 정렬 (최신 견적서가 있는 프로젝트 우선)
      const sortedGroups = Array.from(grouped.values()).sort((a, b) => {
        const aLatest = a.estimates[0]?.estimate_date || a.estimates[0]?.created_at || ''
        const bLatest = b.estimates[0]?.estimate_date || b.estimates[0]?.created_at || ''
        if (!aLatest && !bLatest) return 0
        if (!aLatest) return 1
        if (!bLatest) return -1
        return bLatest.localeCompare(aLatest)
      })
      
      setProjectGroups(sortedGroups)
      
      // 첫 번째 프로젝트 자동 선택 및 확장
      if (sortedGroups.length > 0 && !selectedProject) {
        const firstProjectId = sortedGroups[0].counsel_id
        setSelectedProject(firstProjectId)
        setExpandedProjects(new Set([firstProjectId]))
      }
    } catch (error: any) {
      console.error('견적서 목록 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '견적서 목록을 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const loadEstimateDetail = async (estimateId: number) => {
    try {
      const data = await getEstimateDetail(estimateId)
      
      // team 정보 처리 (배열/객체 모두 처리)
      if (data) {
        const team = Array.isArray(data.team)
          ? data.team[0]
          : data.team
        
        // teams 배열 형태로 변환 (기존 코드와 호환성 유지)
        // 연락처 정보도 포함
        data.teams = team ? [{
          id: team.id,
          name: team.name,
          manager_id: team.manager_id,
          contact_phone: team.contact_phone || null,
          contact_email: team.contact_email || null,
          contact_website: team.contact_website || null,
        }] : []
        
        // counsel 정보도 처리
        const counsel = Array.isArray(data.counsel)
          ? data.counsel[0]
          : data.counsel
        data.counsel = counsel
      }
      
      setSelectedEstimate(data)
      
      // 열람 권한 확인
      try {
        const access = await checkEstimateViewAccess(estimateId)
        setViewAccess(access)
      } catch (error) {
        console.error('열람 권한 확인 실패:', error)
        setViewAccess(null)
      }
    } catch (error: any) {
      console.error('견적서 상세 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '견적서 상세를 불러오는데 실패했습니다',
        description: error.message,
      })
    }
  }

  const handleEstimateAccept = async (estimateId: number) => {
    try {
      await updateEstimateStatus(estimateId, 'accept')
      toast({
        title: '견적서가 수락되었습니다',
      })
      loadEstimates()
      if (selectedEstimate?.estimate_id === estimateId) {
        loadEstimateDetail(estimateId)
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '견적서 수락 실패',
        description: error.message,
      })
    }
  }

  const handleEstimateHold = async (estimateId: number) => {
    try {
      await updateEstimateStatus(estimateId, 'pending')
      toast({
        title: '견적서가 보류되었습니다',
      })
      loadEstimates()
      if (selectedEstimate?.estimate_id === estimateId) {
        loadEstimateDetail(estimateId)
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '견적서 보류 실패',
        description: error.message,
      })
    }
  }

  // 계약 진행 기능은 MVP에서 제외됨
  // const handleEstimateProceed = async (estimateId: number) => {
  //   ...
  // }

  const handleChat = (estimateId: number) => {
    // 채팅 페이지로 이동 (추후 구현)
    router.push(`/chat?estimate_id=${estimateId}`)
  }

  const handlePurchaseEstimateView = async (estimateId: number) => {
    if (!viewAccess) return

    try {
      setCheckingAccess(true)

      // 무료 열람 또는 구독으로 열람 가능한 경우
      if (viewAccess.viewType === 'free' || viewAccess.viewType === 'subscription') {
        await createEstimateView(estimateId, viewAccess.viewType)
        toast({
          title: '견적서 열람 완료',
          description: viewAccess.viewType === 'free' 
            ? `무료 열람이 완료되었습니다. (남은 횟수: ${(viewAccess.freeViewsRemaining || 0) - 1}회)`
            : '구독으로 열람이 완료되었습니다.',
        })
        // 상세 정보 새로고침
        await loadEstimateDetail(estimateId)
        return
      }

      // 건별 결제는 제거됨 - 구독 가입으로 유도
      // 이 케이스는 발생하지 않아야 하지만, 안전을 위해 구독 페이지로 이동
      router.push('/my/subscription/register-v2')
    } catch (error: any) {
      console.error('견적서 열람 처리 실패:', error)
      toast({
        variant: 'destructive',
        title: '견적서 열람 실패',
        description: error.message,
      })
    } finally {
      setCheckingAccess(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: '대기중', className: 'bg-yellow-100 text-yellow-800' },
      accept: { label: '수락', className: 'bg-green-100 text-green-800' },
      in_progress: { label: '진행중', className: 'bg-blue-100 text-blue-800' },
      completed: { label: '완료', className: 'bg-gray-100 text-gray-800' },
      rejected: { label: '거절', className: 'bg-red-100 text-red-800' },
    }
    
    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  // 필터링된 견적서 목록
  const getFilteredEstimates = () => {
    let filtered = estimates

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(e => e.estimate_status === statusFilter)
    }

    // 검색 필터
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(e => {
        const teamName = e.teams?.[0]?.name?.toLowerCase() || ''
        const counselTitle = e.counsel?.title?.toLowerCase() || ''
        const counselOutline = e.counsel?.outline?.toLowerCase() || ''
        return teamName.includes(term) || counselTitle.includes(term) || counselOutline.includes(term)
      })
    }

    return filtered
  }

  // 필터링된 프로젝트 그룹
  const getFilteredProjectGroups = () => {
    let filtered = projectGroups

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.map(group => ({
        ...group,
        estimates: group.estimates.filter(e => e.estimate_status === statusFilter)
      })).filter(group => group.estimates.length > 0)
    }

    // 검색 필터
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered
        .map(group => ({
          ...group,
          estimates: group.estimates.filter(e => {
            const teamName = e.teams?.[0]?.name?.toLowerCase() || ''
            const counselTitle = group.counsel.title?.toLowerCase() || ''
            const counselOutline = group.counsel.outline?.toLowerCase() || ''
            return teamName.includes(term) || counselTitle.includes(term) || counselOutline.includes(term)
          })
        }))
        .filter(group => group.estimates.length > 0 || 
          group.counsel.title?.toLowerCase().includes(term) ||
          group.counsel.outline?.toLowerCase().includes(term))
    }

    return filtered
  }

  const toggleProjectExpansion = (counselId: number) => {
    const newExpanded = new Set(expandedProjects)
    if (newExpanded.has(counselId)) {
      newExpanded.delete(counselId)
    } else {
      newExpanded.add(counselId)
    }
    setExpandedProjects(newExpanded)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">견적서를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const filteredEstimates = getFilteredEstimates()
  const filteredProjectGroups = getFilteredProjectGroups()

  return (
    <div className="w-full md:py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">받은 견적서</h1>
          <p className="text-gray-600">프로젝트별로 받은 견적서를 확인하고 관리하세요</p>
        </div>

        {/* 필터 및 검색 바 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 뷰 모드 전환 */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('project')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'project'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                프로젝트별
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === 'all'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                전체 보기
              </button>
            </div>

            {/* 검색 */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="프로젝트명, 팀명, 내용으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchTerm('')
                  }
                }}
                className="w-full pl-12 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="검색어 지우기"
                >
                  ×
                </button>
              )}
            </div>

            {/* 상태 필터 */}
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors text-sm font-medium"
              >
                <option value="all">전체 상태</option>
                <option value="pending">대기중</option>
                <option value="accept">수락</option>
                <option value="in_progress">진행중</option>
                <option value="completed">완료</option>
                <option value="rejected">거절</option>
              </select>
              {(searchTerm || statusFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setStatusFilter('all')
                  }}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 whitespace-nowrap"
                >
                  초기화
                </button>
              )}
            </div>
          </div>
          
          {/* 필터 결과 표시 */}
          {(searchTerm || statusFilter !== 'all') && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-600">필터 적용:</span>
              {searchTerm && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  검색: {searchTerm}
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  상태: {statusFilter === 'pending' ? '대기중' : statusFilter === 'accept' ? '수락' : statusFilter === 'in_progress' ? '진행중' : statusFilter === 'completed' ? '완료' : '거절'}
                </span>
              )}
              <span className="text-sm text-gray-500">
                ({viewMode === 'project' ? filteredProjectGroups.length : filteredEstimates.length}개 결과)
              </span>
            </div>
          )}
        </div>

      {viewMode === 'project' ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* 프로젝트 목록 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">프로젝트</h2>
                <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                  {filteredProjectGroups.length}개
                </span>
              </div>
              <div className="space-y-2.5 max-h-[calc(100vh-150px)] overflow-y-auto pr-2 -mr-2">
                {filteredProjectGroups.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium mb-2">조건에 맞는 견적서가 없습니다</p>
                    {(searchTerm || statusFilter !== 'all') && (
                      <button
                        onClick={() => {
                          setSearchTerm('')
                          setStatusFilter('all')
                        }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        필터 초기화
                      </button>
                    )}
                  </div>
                ) : (
                  filteredProjectGroups.map((group) => {
                    const isExpanded = expandedProjects.has(group.counsel_id)
                    const isSelected = selectedProject === group.counsel_id
                    return (
                      <div
                        key={group.counsel_id}
                        className={`rounded-lg border transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/50 shadow-md'
                            : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                        }`}
                      >
                        <div
                          onClick={() => {
                            setSelectedProject(group.counsel_id)
                            toggleProjectExpansion(group.counsel_id)
                            if (group.estimates.length > 0 && !isExpanded) {
                              loadEstimateDetail(group.estimates[0].estimate_id)
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              setSelectedProject(group.counsel_id)
                              toggleProjectExpansion(group.counsel_id)
                              if (group.estimates.length > 0 && !isExpanded) {
                                loadEstimateDetail(group.estimates[0].estimate_id)
                              }
                            }
                          }}
                          className="p-4 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
                          tabIndex={0}
                          role="button"
                          aria-expanded={isExpanded}
                          aria-label={`${group.counsel.title} 프로젝트, 견적서 ${group.estimates.length}개`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 flex-shrink-0 transition-transform ${
                              isExpanded ? 'rotate-90' : ''
                            }`}>
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-gray-500" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className={`font-semibold line-clamp-2 ${
                                  isSelected ? 'text-blue-900' : 'text-gray-900'
                                }`}>
                                  {group.counsel.title || '제목 없음'}
                                </h3>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${
                                  isSelected 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {group.estimates.length}
                                </span>
                              </div>
                              {group.counsel.outline && (
                                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                  {group.counsel.outline}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                <span>{group.counsel.start_date}</span>
                                <span>~</span>
                                <span>{group.counsel.due_date}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* 해당 프로젝트의 견적서 목록 */}
                        {isExpanded && group.estimates.length > 0 && (
                          <div className="border-t border-gray-200 bg-gradient-to-b from-gray-50/50 to-white px-4 pb-4 pt-3 space-y-2">
                            <div className="text-xs font-medium text-gray-500 mb-2 px-1">
                              견적서 {group.estimates.length}개
                            </div>
                            {group.estimates.map((estimate) => (
                              <div
                                key={estimate.estimate_id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  loadEstimateDetail(estimate.estimate_id)
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    loadEstimateDetail(estimate.estimate_id)
                                  }
                                }}
                                className={`p-3 rounded-md border cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  selectedEstimate?.estimate_id === estimate.estimate_id
                                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                                    : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm'
                                }`}
                                tabIndex={0}
                                role="button"
                                aria-label={`${estimate.teams?.[0]?.name || '팀명 없음'} 견적서, ${estimate.estimate_version?.[0]?.total_amount?.toLocaleString() || 0}원`}
                              >
                                <div className="flex justify-between items-start gap-2 mb-2">
                                  <div className="font-medium text-gray-900 text-sm">
                                    {estimate.teams?.[0]?.name || '팀명 없음'}
                                  </div>
                                  {getStatusBadge(estimate.estimate_status)}
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                  {estimate.estimate_version && estimate.estimate_version.length > 0 && (
                                    <div className="text-sm font-bold text-gray-900">
                                      {estimate.estimate_version[0].total_amount?.toLocaleString()}원
                                    </div>
                                  )}
                                  {estimate.estimate_date && (
                                    <div className="text-xs text-gray-500">
                                      {new Date(estimate.estimate_date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* 견적서 상세 */}
          <div className="lg:col-span-3">
            {selectedEstimate ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
              {/* 프로젝트 정보 */}
              {selectedEstimate.counsel && (
                <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {selectedEstimate.counsel.title || '제목 없음'}
                      </h3>
                      {selectedEstimate.counsel.outline && (
                        <p className="text-sm text-gray-700 mb-4 line-clamp-2">
                          {selectedEstimate.counsel.outline}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="text-gray-600">
                          <span className="font-medium">기간:</span> {selectedEstimate.counsel.start_date} ~ {selectedEstimate.counsel.due_date}
                        </div>
                        {selectedEstimate.counsel.cost && (
                          <div className="text-gray-600">
                            <span className="font-medium">예산:</span> {selectedEstimate.counsel.cost}
                          </div>
                        )}
                        {selectedEstimate.counsel.feild && (
                          <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 border border-gray-200">
                            {selectedEstimate.counsel.feild}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/enterprise/counsel-detail/${selectedEstimate.counsel_id}`)}
                      className="ml-4"
                    >
                      상세보기
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-start mb-8 pb-6 border-b border-gray-200">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {selectedEstimate.teams?.[0]?.name || '팀명 없음'}
                    </h2>
                    {getStatusBadge(selectedEstimate.estimate_status)}
                  </div>
                  {selectedEstimate.teams?.[0] && (
                    <div className="space-y-1">
                      {selectedEstimate.teams[0].manager_id && (
                        <p className="text-sm text-gray-600">담당 매니저: {selectedEstimate.teams[0].manager_id}</p>
                      )}
                      {/* 연락처 정보 (견적서 열람 시 표시) */}
                      {viewAccess?.canView && (
                        <div className="space-y-1 pt-2 border-t border-gray-200">
                          {selectedEstimate.teams[0].contact_phone && (
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">전화:</span> {selectedEstimate.teams[0].contact_phone}
                            </p>
                          )}
                          {selectedEstimate.teams[0].contact_email && (
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">이메일:</span> {selectedEstimate.teams[0].contact_email}
                            </p>
                          )}
                          {selectedEstimate.teams[0].contact_website && (
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">웹사이트:</span>{' '}
                              <a 
                                href={selectedEstimate.teams[0].contact_website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {selectedEstimate.teams[0].contact_website}
                              </a>
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChat(selectedEstimate.estimate_id)}
                    className="border-gray-300 hover:bg-gray-50"
                    title="팀에게 문의하기 (준비 중)"
                    disabled
                  >
                    문의 (준비 중)
                  </Button>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {selectedEstimate.estimate_version && selectedEstimate.estimate_version.length > 0 && (
                  <>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">총 견적 금액</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {selectedEstimate.estimate_version[0].total_amount?.toLocaleString()}원
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">작업 기간</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {selectedEstimate.estimate_version[0].start_date} ~ {selectedEstimate.estimate_version[0].end_date}
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-600 mb-1">견적 버전</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {selectedEstimate.estimate_version.length}개
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* 견적 버전 목록 */}
              {selectedEstimate.estimate_version && selectedEstimate.estimate_version.length > 1 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">견적 버전</h3>
                  <div className="space-y-3">
                    {selectedEstimate.estimate_version.map((version, index) => (
                      <div key={version.estimate_version_id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="font-semibold text-gray-900 mb-1">버전 {index + 1}</div>
                            <div className="text-sm text-gray-500">{version.version_date && new Date(version.version_date).toLocaleDateString('ko-KR')}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-gray-900 mb-1">{version.total_amount?.toLocaleString()}원</div>
                            <div className="text-sm text-gray-600">
                              {version.start_date} ~ {version.end_date}
                            </div>
                          </div>
                        </div>
                        {version.detail && (
                          <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-700 whitespace-pre-wrap">
                            {version.detail}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 견적 상세 내용 */}
              {selectedEstimate.estimate_version && selectedEstimate.estimate_version[0]?.detail && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">상세 내역</h3>
                  {viewAccess?.canView ? (
                    <div className="bg-gray-50 rounded-xl p-6 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-200">
                      {selectedEstimate.estimate_version[0].detail}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-xl p-8 text-center border border-gray-200">
                      <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium mb-2">
                        {viewAccess?.viewType === 'free' 
                          ? '무료로 견적서 상세 내역을 열람할 수 있습니다'
                          : viewAccess?.hasActiveSubscription
                          ? '구독으로 무제한 열람 가능합니다'
                          : '견적서 상세 내역을 열람하려면 구독이 필요합니다'}
                      </p>
                      <p className="text-sm text-gray-500 mb-4">
                        {viewAccess?.freeViewsRemaining ? (
                          <>무료 열람 {viewAccess.freeViewsRemaining}회 남음</>
                        ) : viewAccess?.hasActiveSubscription ? (
                          <>구독 중: 무제한 열람 가능</>
                        ) : (
                          <>구독으로 무제한 열람 가능</>
                        )}
                      </p>
                      <div className="flex gap-3 justify-center">
                        {viewAccess?.viewType === 'free' && (
                          <Button
                            onClick={() => handlePurchaseEstimateView(selectedEstimate.estimate_id)}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-2.5"
                            disabled={checkingAccess}
                          >
                            {checkingAccess ? '처리 중...' : '무료로 열람하기'}
                          </Button>
                        )}
                        {viewAccess?.viewType === 'subscription' && (
                          <Button
                            onClick={() => handlePurchaseEstimateView(selectedEstimate.estimate_id)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5"
                            disabled={checkingAccess}
                          >
                            {checkingAccess ? '처리 중...' : '구독으로 열람하기'}
                          </Button>
                        )}
                        {viewAccess?.viewType === 'paid' && (
                          <Button
                            onClick={() => router.push('/my/subscription/register-v2')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5"
                          >
                            월 1만원 구독으로 무제한 열람하기
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                {selectedEstimate.estimate_status === 'pending' && (
                  <>
                    <Button
                      onClick={() => handleEstimateAccept(selectedEstimate.estimate_id)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 shadow-sm hover:shadow-md transition-all"
                    >
                      수락
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleEstimateHold(selectedEstimate.estimate_id)}
                      className="flex-1 border-gray-300 font-medium py-2.5 hover:bg-gray-50 transition-all"
                    >
                      보류
                    </Button>
                  </>
                )}
                {selectedEstimate.estimate_status === 'accept' && (
                  <div className="w-full text-center py-2">
                    <p className="text-sm text-gray-600">수락된 견적서입니다</p>
                  </div>
                )}
                {selectedEstimate.estimate_status === 'in_progress' && (
                  <div className="w-full text-center py-2">
                    <p className="text-sm text-gray-600">진행 중인 견적서입니다</p>
                  </div>
                )}
                {selectedEstimate.estimate_status === 'completed' && (
                  <div className="w-full text-center py-2">
                    <p className="text-sm text-gray-600">완료된 견적서입니다</p>
                  </div>
                )}
                {selectedEstimate.estimate_status === 'rejected' && (
                  <div className="w-full text-center py-2">
                    <p className="text-sm text-gray-600">거절된 견적서입니다</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-16 text-center">
              <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg font-medium mb-2">견적서를 선택해주세요</p>
              <p className="text-sm text-gray-400">왼쪽에서 프로젝트를 선택하면 견적서 상세 정보를 확인할 수 있습니다</p>
            </div>
          )}
          </div>
        </div>
      ) : (
        /* 전체 보기 모드 */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEstimates.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
              <p className="text-gray-500 text-lg mb-4">조건에 맞는 견적서가 없습니다</p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('all')
                }}
                className="border-gray-300"
              >
                필터 초기화
              </Button>
            </div>
          ) : (
            filteredEstimates.map((estimate) => (
              <div
                key={estimate.estimate_id}
                onClick={() => {
                  loadEstimateDetail(estimate.estimate_id)
                  setViewMode('project')
                  if (estimate.counsel_id) {
                    setSelectedProject(estimate.counsel_id)
                    setExpandedProjects(new Set([estimate.counsel_id]))
                  }
                }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 text-lg">
                      {estimate.counsel?.title || '제목 없음'}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {estimate.teams?.[0]?.name || '팀명 없음'}
                    </p>
                  </div>
                  {getStatusBadge(estimate.estimate_status)}
                </div>

                {estimate.counsel?.outline && (
                  <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                    {estimate.counsel.outline}
                  </p>
                )}

                <div className="space-y-3 pt-4 border-t border-gray-100">
                  {estimate.estimate_version && estimate.estimate_version.length > 0 && (
                    <div className="text-lg font-bold text-gray-900">
                      {estimate.estimate_version[0].total_amount?.toLocaleString()}원
                    </div>
                  )}
                  <div className="text-sm text-gray-600">
                    {estimate.counsel?.start_date} ~ {estimate.counsel?.due_date}
                  </div>
                  {estimate.estimate_date && (
                    <div className="text-xs text-gray-500">
                      견적일: {new Date(estimate.estimate_date).toLocaleDateString('ko-KR')}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      </div>
    </div>
  )
}

