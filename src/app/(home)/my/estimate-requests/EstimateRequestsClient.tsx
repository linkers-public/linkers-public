'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { fetchMyTeams } from '@/apis/team.service'
import { Filter, SortAsc, Clock, DollarSign, FileText, Calendar, CheckCircle, XCircle, Search } from 'lucide-react'

interface CounselRequest {
  counsel_id: number
  title: string | null
  outline: string | null
  feild: string | null
  expected_cost: number | null
  expected_period: number | null
  cost: string | null
  period: string | null
  due_date: string
  start_date: string
  counsel_status: string
  skill: string[] | null
  client?: {
    user_id: string
    company_name: string | null
    email: string | null
  }
  estimate?: {
    estimate_id: number
    estimate_status: string
  }
}

type FilterField = 'all' | '웹 개발' | '앱 개발' | '인공지능' | '서버 개발' | '클라우드' | 'CI/CD' | '데이터베이스' | '디자인' | '보안'
type SortBy = 'newest' | 'oldest' | 'cost_high' | 'cost_low' | 'deadline_soon'

export default function EstimateRequestsClient() {
  const router = useRouter()
  const supabase = createSupabaseBrowserClient()
  const [requests, setRequests] = useState<CounselRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<CounselRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<CounselRequest | null>(null)
  const [showEstimateDialog, setShowEstimateDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [fieldFilter, setFieldFilter] = useState<FilterField>('all')
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [deadlineFilter, setDeadlineFilter] = useState(false)

  // 견적서 작성 폼 데이터
  const [estimateForm, setEstimateForm] = useState({
    total_amount: '',
    start_date: '',
    end_date: '',
    detail: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [loadingTeams, setLoadingTeams] = useState(false)

  useEffect(() => {
    loadRequests()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [requests, fieldFilter, sortBy, deadlineFilter, searchTerm])

  const loadRequests = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      // 매니저 프로필 확인
      const { data: profile } = await supabase
        .from('accounts')
        .select('profile_id, profile_type, role')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .maybeSingle()

      if (!profile || (profile.role !== 'MANAGER' && profile.profile_type !== 'FREELANCER')) {
        toast({
          variant: 'destructive',
          title: '매니저 권한이 필요합니다',
          description: '매니저 프로필로 접근해주세요.',
        })
        return
      }

      // 모든 견적 요청 조회 (상태가 pending 또는 recruiting인 것)
      const { data, error } = await supabase
        .from('counsel')
        .select(`
          counsel_id,
          title,
          outline,
          feild,
          expected_cost,
          expected_period,
          cost,
          period,
          due_date,
          start_date,
          counsel_status,
          skill,
          company:company_profile_id (
            user_id,
            company_name,
            email
          )
        `)
        .in('counsel_status', ['pending', 'recruiting'])
        .order('start_date', { ascending: false })

      if (error) throw error

      // 각 요청에 대해 견적서 제출 여부 확인
      const requestsWithEstimates = await Promise.all(
        (data || []).map(async (req) => {
          // 팀 정보 가져오기
          const { data: teamData } = await supabase
            .from('teams')
            .select('id')
            .eq('manager_profile_id', profile.profile_id)
            .limit(1)
            .maybeSingle()

          if (!teamData) {
            return { ...(req as any), estimate: null }
          }

          // 해당 팀이 이미 견적서를 제출했는지 확인
          const { data: estimateData } = await supabase
            .from('estimate')
            .select('estimate_id, estimate_status')
            .eq('counsel_id', (req as any).counsel_id)
            .eq('team_id', teamData.id)
            .maybeSingle()

          return { ...(req as any), estimate: estimateData || null }
        })
      )

      setRequests(requestsWithEstimates)
    } catch (error: any) {
      console.error('견적 요청 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '견적 요청을 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...requests]

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.outline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.client?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 분야 필터
    if (fieldFilter !== 'all') {
      filtered = filtered.filter(req => req.feild === fieldFilter)
    }

    // 마감임박 필터
    if (deadlineFilter) {
      const now = new Date()
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(req => {
        const deadline = new Date(req.due_date)
        return deadline <= threeDaysLater && deadline >= now
      })
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        case 'oldest':
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        case 'cost_high':
          const aCost = a.expected_cost || 0
          const bCost = b.expected_cost || 0
          return bCost - aCost
        case 'cost_low':
          const aCostLow = a.expected_cost || 0
          const bCostLow = b.expected_cost || 0
          return aCostLow - bCostLow
        case 'deadline_soon':
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
        default:
          return 0
      }
    })

    setFilteredRequests(filtered)
  }

  const handleOpenEstimateDialog = async (request: CounselRequest) => {
    setSelectedRequest(request)
    setEstimateForm({
      total_amount: '',
      start_date: '',
      end_date: '',
      detail: '',
    })
    
    // 팀 목록 로드
    setLoadingTeams(true)
    try {
      const { data: teamsData, error: teamsError } = await fetchMyTeams()
      if (teamsError || !teamsData || teamsData.length === 0) {
        toast({
          variant: 'destructive',
          title: '팀이 없습니다',
          description: '견적서를 작성하려면 먼저 팀을 생성해주세요.',
        })
        setLoadingTeams(false)
        return
      }
      
      setTeams(teamsData)
      
      // 팀이 1개만 있으면 자동 선택
      if (teamsData.length === 1) {
        setSelectedTeamId(teamsData[0].id)
      } else {
        setSelectedTeamId(null)
      }
    } catch (error: any) {
      console.error('팀 목록 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '팀 목록을 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoadingTeams(false)
    }
    
    setShowEstimateDialog(true)
  }

  const handleSubmitEstimate = async () => {
    if (!selectedRequest) return

    // 팀 선택 확인
    if (!selectedTeamId) {
      toast({
        variant: 'destructive',
        title: '팀을 선택해주세요',
        description: '견적서를 작성하려면 팀을 선택해야 합니다.',
      })
      return
    }

    try {
      setSubmitting(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('인증되지 않은 사용자입니다.')

      // 현재 사용자의 FREELANCER 프로필 조회
      const { data: managerProfile, error: profileError } = await supabase
        .from('accounts')
        .select('profile_id')
        .eq('user_id', user.id)
        .eq('profile_type', 'FREELANCER')
        .maybeSingle()

      if (profileError || !managerProfile) {
        throw new Error('프리랜서 프로필을 찾을 수 없습니다.')
      }

      // 선택된 팀이 사용자의 팀인지 확인
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('id')
        .eq('id', selectedTeamId)
        .eq('manager_profile_id', managerProfile.profile_id)
        .maybeSingle()

      if (teamError || !teamData) {
        throw new Error('유효하지 않은 팀입니다.')
      }

      // counsel에서 company_profile_id 확인
      const { data: counselData, error: counselError } = await supabase
        .from('counsel')
        .select('company_profile_id')
        .eq('counsel_id', selectedRequest.counsel_id)
        .maybeSingle()

      if (counselError || !counselData || !(counselData as any).company_profile_id) {
        throw new Error('프로젝트 정보를 찾을 수 없습니다.')
      }

      // 견적서 생성
      const { data: estimateData, error: estimateError } = await supabase
        .from('estimate')
        .insert({
          team_id: selectedTeamId,
          manager_profile_id: managerProfile.profile_id,
          company_profile_id: (counselData as any).company_profile_id,
          counsel_id: selectedRequest.counsel_id,
          estimate_status: 'pending',
          estimate_start_date: estimateForm.start_date || null,
          estimate_due_date: estimateForm.end_date || null,
        })
        .select()
        .single()

      if (estimateError) throw estimateError

      // 견적서 버전 생성
      const { error: versionError } = await supabase
        .from('estimate_version')
        .insert({
          estimate_id: estimateData.estimate_id,
          total_amount: estimateForm.total_amount ? parseFloat(estimateForm.total_amount) : null,
          start_date: estimateForm.start_date || null,
          end_date: estimateForm.end_date || null,
          detail: estimateForm.detail || null,
        })

      if (versionError) throw versionError

      toast({
        title: '견적서 제출 완료',
        description: '견적서가 성공적으로 제출되었습니다.',
      })

      setShowEstimateDialog(false)
      loadRequests()
    } catch (error: any) {
      console.error('견적서 제출 실패:', error)
      toast({
        variant: 'destructive',
        title: '견적서 제출 실패',
        description: error.message,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '비용 미정'
    return new Intl.NumberFormat('ko-KR').format(amount) + '만원'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const getDaysUntilDeadline = (dueDate: string) => {
    const now = new Date()
    const deadline = new Date(dueDate)
    const diff = deadline.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">견적 요청을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">견적 요청 목록</h1>
        <p className="text-gray-600">기업이 등록한 프로젝트 견적 요청을 확인하고 견적서를 제출하세요</p>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col gap-4">
          {/* 검색바 */}
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-gray-500" />
            <Input
              placeholder="프로젝트명, 설명, 기업명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            {/* 분야 필터 */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={fieldFilter}
                onChange={(e) => setFieldFilter(e.target.value as FilterField)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="all">전체 분야</option>
                <option value="웹 개발">웹 개발</option>
                <option value="앱 개발">앱 개발</option>
                <option value="인공지능">인공지능</option>
                <option value="서버 개발">서버 개발</option>
                <option value="클라우드">클라우드</option>
                <option value="CI/CD">CI/CD</option>
                <option value="데이터베이스">데이터베이스</option>
                <option value="디자인">디자인</option>
                <option value="보안">보안</option>
              </select>
            </div>

            {/* 정렬 */}
            <div className="flex items-center gap-2">
              <SortAsc className="w-4 h-4 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortBy)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="newest">최신순</option>
                <option value="oldest">오래된순</option>
                <option value="cost_high">비용 높은순</option>
                <option value="cost_low">비용 낮은순</option>
                <option value="deadline_soon">마감임박순</option>
              </select>
            </div>

            {/* 마감임박 필터 */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={deadlineFilter}
                onChange={(e) => setDeadlineFilter(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-gray-700 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                마감임박 (3일 이내)
              </span>
            </label>

            <div className="ml-auto text-sm text-gray-600">
              총 {filteredRequests.length}개의 요청
            </div>
          </div>
        </div>
      </div>

      {/* 견적 요청 카드 리스트 */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">조건에 맞는 견적 요청이 없습니다.</p>
          <Button onClick={() => { setFieldFilter('all'); setDeadlineFilter(false); setSearchTerm('') }} variant="outline">
            필터 초기화
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map((request) => {
            const daysUntilDeadline = getDaysUntilDeadline(request.due_date)
            const isUrgent = daysUntilDeadline <= 3 && daysUntilDeadline >= 0
            const hasEstimate = request.estimate !== null

            return (
              <div
                key={request.counsel_id}
                className="bg-white rounded-lg shadow-sm border p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                      {request.title || '제목 없음'}
                    </h3>
                    {request.client?.company_name && (
                      <p className="text-sm text-gray-600">{request.client.company_name}</p>
                    )}
                  </div>
                  {isUrgent && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full ml-2">
                      마감임박
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  {request.feild && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>{request.feild}</span>
                    </div>
                  )}
                  {request.expected_cost && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold text-blue-600">
                        희망: {formatCurrency(request.expected_cost)}
                      </span>
                    </div>
                  )}
                  {request.expected_period && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>희망 기간: {request.expected_period}개월</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      마감: {formatDate(request.due_date)}
                      <span className={`ml-2 ${isUrgent ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        (D-{daysUntilDeadline})
                      </span>
                    </span>
                  </div>
                </div>

                {request.outline && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{request.outline}</p>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  {hasEstimate ? (
                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      견적서 제출됨
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                      미제출
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant={hasEstimate ? "outline" : "default"}
                    onClick={() => handleOpenEstimateDialog(request)}
                    disabled={submitting}
                  >
                    {hasEstimate ? '견적서 수정' : '견적서 작성'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 견적서 작성 다이얼로그 */}
      <Dialog open={showEstimateDialog} onOpenChange={setShowEstimateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>견적서 작성</DialogTitle>
          </DialogHeader>
          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">{selectedRequest.title}</h4>
                <p className="text-sm text-gray-600">{selectedRequest.outline}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedRequest.feild && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      {selectedRequest.feild}
                    </span>
                  )}
                  {selectedRequest.expected_cost && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      희망 비용: {formatCurrency(selectedRequest.expected_cost)}
                    </span>
                  )}
                  {selectedRequest.expected_period && (
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      희망 기간: {selectedRequest.expected_period}개월
                    </span>
                  )}
                </div>
              </div>

              {/* 팀 선택 */}
              {loadingTeams ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-600">팀 목록을 불러오는 중...</p>
                </div>
              ) : teams.length > 0 ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    팀 선택 <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={selectedTeamId?.toString() || ''}
                    onValueChange={(value) => setSelectedTeamId(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="팀을 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map((team) => (
                        <SelectItem key={team.id} value={team.id.toString()}>
                          {team.name || `팀 #${team.id}`} {team.isManager ? '(매니저)' : '(팀원)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {teams.length === 1 && (
                    <p className="text-xs text-gray-500 mt-1">팀이 1개만 있어 자동으로 선택되었습니다.</p>
                  )}
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800">
                    팀이 없습니다. 먼저 팀을 생성해주세요.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  총 견적 금액 (원)
                </label>
                <Input
                  type="number"
                  value={estimateForm.total_amount}
                  onChange={(e) => setEstimateForm(prev => ({ ...prev, total_amount: e.target.value }))}
                  placeholder="예: 5000000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시작일
                  </label>
                  <Input
                    type="date"
                    value={estimateForm.start_date}
                    onChange={(e) => setEstimateForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    종료일
                  </label>
                  <Input
                    type="date"
                    value={estimateForm.end_date}
                    onChange={(e) => setEstimateForm(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  작업 범위 및 상세 설명
                </label>
                <textarea
                  value={estimateForm.detail}
                  onChange={(e) => setEstimateForm(prev => ({ ...prev, detail: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={8}
                  placeholder="작업 범위, 마일스톤, 산출물 등을 상세히 작성해주세요..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEstimateDialog(false)}>
              취소
            </Button>
            <Button onClick={handleSubmitEstimate} disabled={submitting}>
              {submitting ? '제출 중...' : '견적서 제출'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

