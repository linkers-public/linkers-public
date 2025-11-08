'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  getCompanyEstimates, 
  getEstimateDetail,
  updateEstimateStatus,
  approveMilestone,
  requestEstimate
} from '@/apis/company-project.service'
import { searchTeams } from '@/apis/team.service'
import { toast } from '@/hooks/use-toast'
import { 
  FileText, 
  CheckCircle, 
  Eye,
  DollarSign,
  Calendar,
  Users,
  Plus,
  Search,
  Loader2
} from 'lucide-react'

type TabType = 'estimate' | 'milestone'

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
  }>
  estimate_version?: Array<{
    estimate_version_id: number
    total_amount: number | null
    detail: string | null
    start_date: string | null
    end_date: string | null
    version_date: string | null
  }>
}

interface Milestone {
  milestone_id: number
  estimate_id: number | null
  estimate_version_id: number | null
  title: string | null
  detail: string | null
  payment_amount: number | null
  milestone_start_date: string | null
  milestone_due_date: string | null
  milestone_status: string | null
  progress: number
  payment?: Array<{
    payment_id: number
    payment_amount: string | null
    payment_date: string | null
    payment_method: string | null
    payment_status: string | null
  }>
}

interface Team {
  id: number
  name: string
  bio?: string | null
  specialty?: string[] | null
  manager?: {
    username: string
  } | null | any
}

export default function CompanyProjectsClient() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('estimate')
  const [loading, setLoading] = useState(true)
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [selectedEstimate, setSelectedEstimate] = useState<number | null>(null)
  
  // 견적 요청 관련
  const [showRequestDialog, setShowRequestDialog] = useState(false)
  const [searchingTeams, setSearchingTeams] = useState(false)
  const [teamSearchTerm, setTeamSearchTerm] = useState('')
  const [teamResults, setTeamResults] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [requestForm, setRequestForm] = useState({
    title: '',
    outline: '',
    start_date: '',
    due_date: ''
  })
  const [submittingRequest, setSubmittingRequest] = useState(false)
  
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadData()
  }, [activeTab, selectedEstimate])

  const loadData = async () => {
    try {
      setLoading(true)
      
      if (activeTab === 'estimate') {
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

    if (!requestForm.title || !requestForm.outline || !requestForm.start_date || !requestForm.due_date) {
      toast({
        variant: 'destructive',
        title: '모든 필드를 입력해주세요',
      })
      return
    }

    setSubmittingRequest(true)
    try {
      await requestEstimate(selectedTeam.id, {
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

  const handleEstimateCompare = (estimateId: number) => {
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

  if (loading && estimates.length === 0) {
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
          <p className="text-gray-600">견적 요청과 마일스톤을 관리하세요</p>
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
              <DialogTitle>프리랜서팀에게 견적 요청</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
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

              {/* 프로젝트 정보 입력 */}
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

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
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
                  }}
                >
                  취소
                </Button>
                <Button
                  onClick={handleRequestEstimate}
                  disabled={submittingRequest || !selectedTeam}
                >
                  {submittingRequest ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      요청 중...
                    </>
                  ) : (
                    '견적 요청하기'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 탭 네비게이션 */}
      <div className="flex gap-2 mb-6 border-b">
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

      {/* 견적 진행 탭 */}
      {activeTab === 'estimate' && (
        <div className="space-y-4">
          {estimates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">진행 중인 견적이 없습니다</p>
              <Button onClick={() => setShowRequestDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                견적 요청하기
              </Button>
            </div>
          ) : (
            estimates.map((estimate) => (
              <div key={estimate.estimate_id} className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {estimate.teams?.[0]?.name || '팀명 없음'}
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
                    <span>담당 매니저: {estimate.teams?.[0]?.manager_id || '없음'}</span>
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
                      {milestone.milestone_status !== 'task_completed' && (
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
