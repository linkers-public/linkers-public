'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'
import { Filter, SortAsc, SortDesc, Clock, DollarSign, Users, FileText, Calendar, Phone, Mail, CreditCard, ArrowLeft } from 'lucide-react'

interface Estimate {
  estimate_id: number
  counsel_id: number | null
  estimate_status: string
  estimate_date: string | null
  estimate_start_date: string | null
  estimate_due_date: string | null
  team?: {
    id: number
    name: string
    bio: string | null
    specialty: string[] | null
  }
  estimate_version?: {
    estimate_version_id: number
    total_amount: number | null
    start_date: string | null
    end_date: string | null
    detail: string | null
  }
  milestone?: Array<{
    milestone_id: number
    title: string | null
    detail: string | null
    payment_amount: number | null
    milestone_start_date: string | null
    milestone_due_date: string | null
  }>
  counsel?: {
    counsel_id: number
    title: string | null
    feild: string | null
    due_date: string
  }
  team_members?: Array<{
    profile_id: string
    accounts: {
      username: string
      profile_type: string | null
    }
  }>
}

type FilterField = 'all' | '웹 개발' | '앱 개발' | '인공지능' | '서버 개발' | '클라우드' | 'CI/CD' | '데이터베이스' | '디자인' | '보안'
type SortBy = 'newest' | 'oldest' | 'cost_high' | 'cost_low' | 'deadline_soon'

export default function EstimatesDashboardClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createSupabaseBrowserClient()
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [filteredEstimates, setFilteredEstimates] = useState<Estimate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null)
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showContactDialog, setShowContactDialog] = useState(false)
  const [contactInfo, setContactInfo] = useState<{ phone: string; email: string } | null>(null)
  const [fieldFilter, setFieldFilter] = useState<FilterField>('all')
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [deadlineFilter, setDeadlineFilter] = useState(false)
  const [profileType, setProfileType] = useState<'COMPANY' | 'FREELANCER' | null>(null)
  const [detailViewMode, setDetailViewMode] = useState(false) // estimate_id가 있을 때 상세 보기 모드

  useEffect(() => {
    loadEstimates()
  }, [])

  useEffect(() => {
    applyFiltersAndSort()
  }, [estimates, fieldFilter, sortBy, deadlineFilter])

  // estimate_id 쿼리 파라미터가 있으면 해당 견적서 상세 보기
  useEffect(() => {
    const estimateIdParam = searchParams.get('estimate_id')
    if (estimateIdParam && estimates.length > 0) {
      const estimateId = parseInt(estimateIdParam, 10)
      const foundEstimate = estimates.find(e => e.estimate_id === estimateId)
      if (foundEstimate) {
        setSelectedEstimate(foundEstimate)
        setShowDetailDialog(true)
        setDetailViewMode(true)
      }
    }
  }, [searchParams, estimates])

  const loadEstimates = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth')
        return
      }

      // 활성 프로필 확인
      const { data: activeProfile } = await supabase
        .from('accounts')
        .select('profile_id, profile_type')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .maybeSingle()

      if (!activeProfile) {
        toast({
          variant: 'destructive',
          title: '프로필이 필요합니다',
          description: '프로필을 생성해주세요.',
        })
        router.push('/my/profile/manage')
        return
      }

      setProfileType(activeProfile.profile_type as 'COMPANY' | 'FREELANCER')

      let data, error

      // 기업 프로필인 경우: 받은 견적서 조회
      if (activeProfile.profile_type === 'COMPANY') {
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

        // 견적서 조회 (counsel과 연결) - 받은 견적서
        const result = await supabase
          .from('estimate')
          .select(`
            estimate_id,
            counsel_id,
            estimate_status,
            estimate_date,
            estimate_start_date,
            estimate_due_date,
            team:team_id (
              id,
              name,
              bio
            ),
            counsel:counsel_id (
              counsel_id,
              title,
              feild,
              due_date
            )
          `)
          .eq('client_id', clientData.user_id)
          .order('estimate_date', { ascending: false })
        
        data = result.data
        error = result.error
      } 
      // 프리랜서 프로필인 경우: 작성한 견적서 조회
      else if (activeProfile.profile_type === 'FREELANCER') {
        // 견적서 조회 (manager_profile_id로 조회) - 작성한 견적서
        const result = await supabase
          .from('estimate')
          .select(`
            estimate_id,
            counsel_id,
            estimate_status,
            estimate_date,
            estimate_start_date,
            estimate_due_date,
            team:team_id (
              id,
              name,
              bio
            ),
            counsel:counsel_id (
              counsel_id,
              title,
              feild,
              due_date
            )
          `)
          .eq('manager_profile_id', activeProfile.profile_id)
          .order('estimate_date', { ascending: false })
        
        data = result.data
        error = result.error
      } else {
        toast({
          variant: 'destructive',
          title: '지원하지 않는 프로필 타입입니다',
        })
        return
      }

      if (error) throw error

      // estimate_version과 milestone 별도 조회
      const estimatesWithDetails = await Promise.all(
        (data || []).map(async (est) => {
          const { data: versionData } = await supabase
            .from('estimate_version')
            .select('*')
            .eq('estimate_id', est.estimate_id)
            .order('version_date', { ascending: false })
            .limit(1)
            .maybeSingle()

          const { data: milestoneData } = await supabase
            .from('milestone')
            .select('*')
            .eq('estimate_id', est.estimate_id)

          const { data: teamMembersData } = await supabase
            .from('team_members')
            .select(`
              profile_id,
              accounts:profile_id (
                username,
                profile_type
              )
            `)
            .eq('team_id', (est.team as any)?.id)

          return {
            ...est,
            estimate_version: versionData || undefined,
            milestone: milestoneData || [],
            team_members: teamMembersData || [],
          }
        })
      )

      setEstimates(estimatesWithDetails as any)
    } catch (error: any) {
      console.error('견적서 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '견적서를 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...estimates]

    // 분야 필터
    if (fieldFilter !== 'all') {
      filtered = filtered.filter(est => est.counsel?.feild === fieldFilter)
    }

    // 마감임박 필터
    if (deadlineFilter) {
      const now = new Date()
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
      filtered = filtered.filter(est => {
        const dueDate = est.estimate_due_date || est.counsel?.due_date
        if (!dueDate) return false
        const deadline = new Date(dueDate)
        return deadline <= threeDaysLater && deadline >= now
      })
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          const aDate = a.estimate_date ? new Date(a.estimate_date).getTime() : 0
          const bDate = b.estimate_date ? new Date(b.estimate_date).getTime() : 0
          return bDate - aDate
        case 'oldest':
          const aDateOld = a.estimate_date ? new Date(a.estimate_date).getTime() : 0
          const bDateOld = b.estimate_date ? new Date(b.estimate_date).getTime() : 0
          return aDateOld - bDateOld
        case 'cost_high':
          const aCost = a.estimate_version?.total_amount || 0
          const bCost = b.estimate_version?.total_amount || 0
          return bCost - aCost
        case 'cost_low':
          const aCostLow = a.estimate_version?.total_amount || 0
          const bCostLow = b.estimate_version?.total_amount || 0
          return aCostLow - bCostLow
        case 'deadline_soon':
          const aDeadline = a.estimate_due_date || a.counsel?.due_date || ''
          const bDeadline = b.estimate_due_date || b.counsel?.due_date || ''
          if (!aDeadline) return 1
          if (!bDeadline) return -1
          return new Date(aDeadline).getTime() - new Date(bDeadline).getTime()
        default:
          return 0
      }
    })

    setFilteredEstimates(filtered)
  }

  const handleViewContact = async (estimateId: number) => {
    try {
      // 먼저 counsel 정보 가져오기
      const estimate = estimates.find(e => e.estimate_id === estimateId)
      if (!estimate || !estimate.counsel_id) {
        toast({
          variant: 'destructive',
          title: '견적서 정보를 찾을 수 없습니다',
        })
        return
      }

      // MVP: 소액 과금 처리 (여기서는 간단히 토스트만 표시, 실제 결제는 향후 구현)
      toast({
        title: '연락처 열람',
        description: '소액 결제가 적용됩니다. (향후 결제 시스템 연동 예정)',
      })

      // TODO: counsel 테이블에 contact_phone, contact_email 컬럼이 추가되면 연동 필요
      setContactInfo({
        phone: '',
        email: '',
      })
      setShowContactDialog(true)
    } catch (error: any) {
      console.error('연락처 조회 실패:', error)
      toast({
        variant: 'destructive',
        title: '연락처를 불러오는데 실패했습니다',
        description: error.message,
      })
    }
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '비용 미정'
    return new Intl.NumberFormat('ko-KR').format(amount) + '원'
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '날짜 미정'
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  const getDaysUntilDeadline = (dueDate: string | null | undefined) => {
    if (!dueDate) return null
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
          <p className="text-lg text-gray-600">견적서를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // estimate_id가 있고 상세 보기 모드일 때
  const estimateIdParam = searchParams.get('estimate_id')
  if (estimateIdParam && selectedEstimate && showDetailDialog) {
    return (
      <div className="w-full md:py-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              router.push('/my/estimates-dashboard')
              setShowDetailDialog(false)
              setDetailViewMode(false)
            }}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            목록으로 돌아가기
          </Button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">견적서 상세</h1>
          <p className="text-gray-600">
            {selectedEstimate.counsel?.title || `견적서 #${selectedEstimate.estimate_id}`}
          </p>
        </div>

        {/* 상세 정보를 페이지 전체에 표시 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
          {/* 기본 정보 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 text-lg">기본 정보</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">프로젝트명</span>
                <span className="font-medium">{selectedEstimate.counsel?.title || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">분야</span>
                <span>{selectedEstimate.counsel?.feild || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">상태</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedEstimate.estimate_status === 'accept'
                    ? 'bg-green-100 text-green-700'
                    : selectedEstimate.estimate_status === 'in_progress'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {selectedEstimate.estimate_status === 'accept' ? '승인됨' :
                   selectedEstimate.estimate_status === 'in_progress' ? '진행중' : '대기중'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">견적서 작성일</span>
                <span>{formatDate(selectedEstimate.estimate_date)}</span>
              </div>
            </div>
          </div>

          {/* 팀 구성 */}
          {selectedEstimate.team && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                팀 구성
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="mb-2">
                  <span className="font-medium text-lg">{selectedEstimate.team.name}</span>
                  {selectedEstimate.team.bio && (
                    <p className="text-sm text-gray-600 mt-1">{selectedEstimate.team.bio}</p>
                  )}
                </div>
                {selectedEstimate.team.specialty && selectedEstimate.team.specialty.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedEstimate.team.specialty.map((spec, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                        {spec}
                      </span>
                    ))}
                  </div>
                )}
                {selectedEstimate.team_members && selectedEstimate.team_members.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">팀원</p>
                    <div className="space-y-1">
                      {selectedEstimate.team_members.map((member, idx) => (
                        <div key={idx} className="text-sm text-gray-600">
                          {member.accounts?.username || `프로필 ${idx + 1}`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 작업 범위 및 추가 옵션 */}
          {selectedEstimate.estimate_version && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 text-lg">작업 범위</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {selectedEstimate.estimate_version.detail && (
                  <div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedEstimate.estimate_version.detail}
                    </p>
                  </div>
                )}
                {selectedEstimate.milestone && selectedEstimate.milestone.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-gray-700 mb-2">마일스톤</p>
                    <div className="space-y-2">
                      {selectedEstimate.milestone.map((ms) => (
                        <div key={ms.milestone_id} className="bg-white rounded p-3">
                          <div className="font-medium text-gray-900">{ms.title || '제목 없음'}</div>
                          {ms.detail && (
                            <p className="text-sm text-gray-600 mt-1">{ms.detail}</p>
                          )}
                          {ms.payment_amount && (
                            <p className="text-sm text-blue-600 mt-1">
                              {formatCurrency(ms.payment_amount)}
                            </p>
                          )}
                          {ms.milestone_start_date && ms.milestone_due_date && (
                            <p className="text-xs text-gray-500 mt-1">
                              {formatDate(ms.milestone_start_date)} ~ {formatDate(ms.milestone_due_date)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 비용 및 기간 */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 text-lg">비용 및 기간</h3>
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600 text-sm">총 비용</span>
                <p className="text-xl font-bold text-blue-600 mt-1">
                  {selectedEstimate.estimate_version?.total_amount
                    ? formatCurrency(selectedEstimate.estimate_version.total_amount)
                    : '비용 미정'}
                </p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">기간</span>
                <p className="text-lg font-medium mt-1">
                  {selectedEstimate.estimate_version?.start_date && selectedEstimate.estimate_version?.end_date
                    ? `${formatDate(selectedEstimate.estimate_version.start_date)} ~ ${formatDate(selectedEstimate.estimate_version.end_date)}`
                    : '기간 미정'}
                </p>
              </div>
            </div>
          </div>

          {/* 액션 버튼 */}
          {profileType === 'COMPANY' && (
            <div className="flex gap-3 pt-4 border-t">
              <Button
                onClick={() => {
                  if (selectedEstimate) {
                    handleViewContact(selectedEstimate.estimate_id)
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                연락처 열람 (소액 과금)
              </Button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full md:py-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">견적서 대시보드</h1>
        <p className="text-gray-600">
          {profileType === 'COMPANY' 
            ? '제안받은 견적서를 검토하고 비교하세요' 
            : '작성한 견적서를 확인하고 관리하세요'}
        </p>
      </div>

      {/* 필터 및 정렬 */}
      <div className="bg-white rounded-lg shadow-sm border p-3 md:p-4 mb-4 md:mb-6">
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
            총 {filteredEstimates.length}개의 견적서
          </div>
        </div>
      </div>

      {/* 견적서 카드 리스트 */}
      {filteredEstimates.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500 mb-4">조건에 맞는 견적서가 없습니다.</p>
          <Button onClick={() => { setFieldFilter('all'); setDeadlineFilter(false) }} variant="outline">
            필터 초기화
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredEstimates.map((estimate) => {
            const daysUntilDeadline = getDaysUntilDeadline(estimate.estimate_due_date || estimate.counsel?.due_date)
            const isUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 3 && daysUntilDeadline >= 0

            return (
              <div
                key={estimate.estimate_id}
                className="bg-white rounded-lg shadow-sm border p-4 md:p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedEstimate(estimate)
                  setShowDetailDialog(true)
                }}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {estimate.counsel?.title || `견적서 #${estimate.estimate_id}`}
                    </h3>
                    {estimate.team && (
                      <p className="text-sm text-gray-600">{estimate.team.name}</p>
                    )}
                  </div>
                  {isUrgent && (
                    <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                      마감임박
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  {estimate.counsel?.feild && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <FileText className="w-4 h-4" />
                      <span>{estimate.counsel.feild}</span>
                    </div>
                  )}
                  {estimate.estimate_version?.total_amount && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold text-blue-600">
                        {formatCurrency(estimate.estimate_version.total_amount)}
                      </span>
                    </div>
                  )}
                  {estimate.estimate_due_date && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {formatDate(estimate.estimate_due_date)}
                        {daysUntilDeadline !== null && (
                          <span className={`ml-2 ${isUrgent ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                            (D-{daysUntilDeadline})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    estimate.estimate_status === 'accept'
                      ? 'bg-green-100 text-green-700'
                      : estimate.estimate_status === 'in_progress'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {estimate.estimate_status === 'accept' ? '승인됨' :
                     estimate.estimate_status === 'in_progress' ? '진행중' : '대기중'}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedEstimate(estimate)
                      setShowDetailDialog(true)
                    }}
                  >
                    상세보기
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 견적서 상세 다이얼로그 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>견적서 상세</DialogTitle>
          </DialogHeader>
          {selectedEstimate && (
            <div className="space-y-6">
              {/* 기본 정보 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">기본 정보</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">프로젝트명</span>
                    <span className="font-medium">{selectedEstimate.counsel?.title || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">분야</span>
                    <span>{selectedEstimate.counsel?.feild || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">상태</span>
                    <span>{selectedEstimate.estimate_status}</span>
                  </div>
                </div>
              </div>

              {/* 팀 구성 */}
              {selectedEstimate.team && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    팀 구성
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="mb-2">
                      <span className="font-medium">{selectedEstimate.team.name}</span>
                      {selectedEstimate.team.bio && (
                        <p className="text-sm text-gray-600 mt-1">{selectedEstimate.team.bio}</p>
                      )}
                    </div>
                    {selectedEstimate.team.specialty && selectedEstimate.team.specialty.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedEstimate.team.specialty.map((spec, idx) => (
                          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}
                    {selectedEstimate.team_members && selectedEstimate.team_members.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm font-medium text-gray-700 mb-2">팀원</p>
                        <div className="space-y-1">
                          {selectedEstimate.team_members.map((member, idx) => (
                            <div key={idx} className="text-sm text-gray-600">
                              {member.accounts?.username || `프로필 ${idx + 1}`}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 작업 범위 및 추가 옵션 */}
              {selectedEstimate.estimate_version && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">작업 범위</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    {selectedEstimate.estimate_version.detail && (
                      <div>
                        <p className="text-gray-700 whitespace-pre-wrap">
                          {selectedEstimate.estimate_version.detail}
                        </p>
                      </div>
                    )}
                    {selectedEstimate.milestone && selectedEstimate.milestone.length > 0 && (
                      <div className="mt-4">
                        <p className="font-medium text-gray-700 mb-2">마일스톤</p>
                        <div className="space-y-2">
                          {selectedEstimate.milestone.map((ms) => (
                            <div key={ms.milestone_id} className="bg-white rounded p-3">
                              <div className="font-medium text-gray-900">{ms.title || '제목 없음'}</div>
                              {ms.detail && (
                                <p className="text-sm text-gray-600 mt-1">{ms.detail}</p>
                              )}
                              {ms.payment_amount && (
                                <p className="text-sm text-blue-600 mt-1">
                                  {formatCurrency(ms.payment_amount)}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 비용 및 기간 */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">비용 및 기간</h3>
                <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600 text-sm">총 비용</span>
                    <p className="text-xl font-bold text-blue-600 mt-1">
                      {selectedEstimate.estimate_version?.total_amount
                        ? formatCurrency(selectedEstimate.estimate_version.total_amount)
                        : '비용 미정'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 text-sm">기간</span>
                    <p className="text-lg font-medium mt-1">
                      {selectedEstimate.estimate_version?.start_date && selectedEstimate.estimate_version?.end_date
                        ? `${formatDate(selectedEstimate.estimate_version.start_date)} ~ ${formatDate(selectedEstimate.estimate_version.end_date)}`
                        : '기간 미정'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={() => {
                    if (selectedEstimate) {
                      handleViewContact(selectedEstimate.estimate_id)
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  연락처 열람 (소액 과금)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDetailDialog(false)}
                >
                  닫기
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 연락처 다이얼로그 */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              연락처 정보
            </DialogTitle>
          </DialogHeader>
          {contactInfo && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-800" />
                <p className="text-sm text-blue-800">
                  소액 결제가 적용되었습니다. (향후 결제 시스템과 연동 예정)
                </p>
              </div>
              {contactInfo.phone && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    전화번호
                  </label>
                  <p className="text-gray-900 font-medium">{contactInfo.phone}</p>
                </div>
              )}
              {contactInfo.email && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    이메일
                  </label>
                  <p className="text-gray-900 font-medium">{contactInfo.email}</p>
                </div>
              )}
              <Button
                onClick={() => setShowContactDialog(false)}
                className="w-full"
              >
                확인
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

