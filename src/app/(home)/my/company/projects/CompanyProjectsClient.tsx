'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { 
  getCompanyCounsels, 
  getCompanyEstimates, 
  getEstimateDetail,
  updateCounselStatus,
  updateEstimateStatus,
  approveMilestone
} from '@/apis/company-project.service'
import { toast } from '@/hooks/use-toast'
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Edit, 
  Eye,
  DollarSign,
  Calendar,
  Users,
  MessageSquare
} from 'lucide-react'

type TabType = 'counsel' | 'estimate' | 'milestone'

interface Counsel {
  counsel_id: number
  title: string
  outline: string
  period: string
  cost: string
  feild: string
  skill: string
  output: string
  counsel_status: string
  created_at: string
  updated_at: string
}

interface Estimate {
  estimate_id: number
  team_id: number
  counsel_id: number
  client_id: string
  estimate_status: string
  estimate_start_date: string | null
  estimate_due_date: string | null
  created_at: string
  teams?: {
    id: number
    name: string
    manager_id: string
  }
  estimate_version?: Array<{
    estimate_version_id: number
    total_amount: number | null
    detail: string | null
    start_date: string | null
    end_date: string | null
    version_date: string
  }>
}

interface Milestone {
  milestone_id: number
  estimate_id: number
  estimate_version_id: number
  title: string
  detail: string | null
  payment_amount: number | null
  milestone_start_date: string | null
  milestone_due_date: string | null
  milestone_status: string | null
  progress: number | null
  payment?: Array<{
    payment_id: number
    payment_amount: string | null
    payment_date: string | null
    payment_method: string | null
    payment_status: string | null
  }>
}

export default function CompanyProjectsClient() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('counsel')
  const [loading, setLoading] = useState(true)
  const [counsels, setCounsels] = useState<Counsel[]>([])
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [selectedEstimate, setSelectedEstimate] = useState<number | null>(null)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadData()
  }, [activeTab, selectedEstimate])

  const loadData = async () => {
    try {
      setLoading(true)
      
      if (activeTab === 'counsel') {
        const data = await getCompanyCounsels()
        setCounsels(data)
      } else if (activeTab === 'estimate') {
        const data = await getCompanyEstimates(['pending', 'accept', 'in_progress'])
        setEstimates(data)
      } else if (activeTab === 'milestone' && selectedEstimate) {
        const data = await getEstimateDetail(selectedEstimate)
        if (data?.milestone) {
          setMilestones(data.milestone)
        }
      }
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
  }

  const handleCounselEdit = (counselId: number) => {
    router.push(`/enterprise/counsel-form?counsel_id=${counselId}`)
  }

  const handleCounselClose = async (counselId: number) => {
    try {
      await updateCounselStatus(counselId, 'closed')
      toast({
        title: '상담이 마감되었습니다',
      })
      loadData()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '상담 마감 실패',
        description: error.message,
      })
    }
  }

  const handleEstimateCompare = (estimateId: number) => {
    // 견적 비교 페이지로 이동 (추후 구현)
    router.push(`/my/company/estimates?compare=${estimateId}`)
  }

  const handleEstimateConfirm = async (estimateId: number) => {
    try {
      await updateEstimateStatus(estimateId, 'in_progress')
      toast({
        title: '계약이 확정되었습니다',
      })
      loadData()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '계약 확정 실패',
        description: error.message,
      })
    }
  }

  const handleMilestoneApprove = async (milestoneId: number) => {
    try {
      await approveMilestone(milestoneId)
      toast({
        title: '마일스톤이 승인되었습니다',
      })
      loadData()
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '마일스톤 승인 실패',
        description: error.message,
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      recruiting: { label: '모집중', className: 'bg-blue-100 text-blue-800' },
      closed: { label: '마감', className: 'bg-gray-100 text-gray-800' },
      pending: { label: '대기중', className: 'bg-yellow-100 text-yellow-800' },
      accept: { label: '수락', className: 'bg-green-100 text-green-800' },
      in_progress: { label: '진행중', className: 'bg-blue-100 text-blue-800' },
      completed: { label: '완료', className: 'bg-gray-100 text-gray-800' },
    }
    
    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' }
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    )
  }

  if (loading && counsels.length === 0 && estimates.length === 0) {
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
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">내 프로젝트</h1>
        <p className="text-gray-600">상담, 견적, 마일스톤을 관리하세요</p>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('counsel')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'counsel'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          상담
        </button>
        <button
          onClick={() => setActiveTab('estimate')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'estimate'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          견적 진행
        </button>
        <button
          onClick={() => {
            if (estimates.length > 0) {
              setSelectedEstimate(estimates[0].estimate_id)
              setActiveTab('milestone')
            }
          }}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'milestone'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          마일스톤/지급
        </button>
      </div>

      {/* 상담 탭 */}
      {activeTab === 'counsel' && (
        <div className="space-y-4">
          {counsels.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">등록된 상담이 없습니다</p>
            </div>
          ) : (
            counsels.map((counsel) => (
              <div key={counsel.counsel_id} className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{counsel.title}</h3>
                    {getStatusBadge(counsel.counsel_status)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCounselEdit(counsel.counsel_id)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      수정
                    </Button>
                    {counsel.counsel_status === 'recruiting' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCounselClose(counsel.counsel_id)}
                      >
                        마감
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">기간:</span> {counsel.period}
                  </div>
                  <div>
                    <span className="font-medium">예산:</span> {counsel.cost}
                  </div>
                  <div>
                    <span className="font-medium">분야:</span> {counsel.feild}
                  </div>
                  <div>
                    <span className="font-medium">기술:</span> {counsel.skill}
                  </div>
                </div>
                {counsel.outline && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-700">{counsel.outline}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 견적 진행 탭 */}
      {activeTab === 'estimate' && (
        <div className="space-y-4">
          {estimates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">진행 중인 견적이 없습니다</p>
            </div>
          ) : (
            estimates.map((estimate) => (
              <div key={estimate.estimate_id} className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {estimate.teams?.name || '팀명 없음'}
                    </h3>
                    {getStatusBadge(estimate.estimate_status)}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEstimateCompare(estimate.estimate_id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      비교
                    </Button>
                    {estimate.estimate_status === 'accept' && (
                      <Button
                        size="sm"
                        onClick={() => handleEstimateConfirm(estimate.estimate_id)}
                      >
                        계약 확정
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>담당 매니저: {estimate.teams?.manager_id || '없음'}</span>
                  </div>
                  {estimate.estimate_version && estimate.estimate_version.length > 0 && (
                    <>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>총액: {estimate.estimate_version[0].total_amount?.toLocaleString()}원</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          기간: {estimate.estimate_version[0].start_date} ~ {estimate.estimate_version[0].end_date}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">버전:</span> {estimate.estimate_version.length}개
                      </div>
                    </>
                  )}
                </div>
                {estimate.estimate_version && estimate.estimate_version[0]?.detail && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-700">{estimate.estimate_version[0].detail}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* 마일스톤/지급 탭 */}
      {activeTab === 'milestone' && (
        <div className="space-y-4">
          {!selectedEstimate ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 mb-4">견적을 선택해주세요</p>
              <Button onClick={() => setActiveTab('estimate')}>
                견적 진행 탭으로 이동
              </Button>
            </div>
          ) : milestones.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">마일스톤이 없습니다</p>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('estimate')}
                >
                  견적 선택으로 돌아가기
                </Button>
              </div>
              {milestones.map((milestone) => (
                <div key={milestone.milestone_id} className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{milestone.title}</h3>
                      {milestone.milestone_status && getStatusBadge(milestone.milestone_status)}
                    </div>
                      {milestone.milestone_status !== 'approved' && (
                      <Button
                        size="sm"
                        onClick={() => handleMilestoneApprove(milestone.milestone_id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        승인
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span>금액: {milestone.payment_amount?.toLocaleString()}원</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        기간: {milestone.milestone_start_date} ~ {milestone.milestone_due_date}
                      </span>
                    </div>
                  </div>
                  {milestone.detail && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-700">{milestone.detail}</p>
                    </div>
                  )}
                  {milestone.payment && milestone.payment.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium mb-2">지급 내역</h4>
                      {milestone.payment.map((pay) => (
                        <div key={pay.payment_id} className="text-sm text-gray-600">
                          <div>금액: {pay.payment_amount}원</div>
                          <div>일자: {pay.payment_date}</div>
                          <div>방법: {pay.payment_method}</div>
                          <div>상태: {pay.payment_status}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

