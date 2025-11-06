'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { fetchCounselWithClient } from '@/apis/counsel.service'
import { submitMakerEstimate, getMakerEstimate } from '@/apis/maker-estimate.service'
import { getProjectMembers } from '@/apis/project-member.service'
import { submitTeamEstimate, getTeamEstimate, TeamEstimate } from '@/apis/team-estimate.service'
import { fetchMyTeams } from '@/apis/team.service'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/dateFormat'
import { ArrowLeft, Plus, X, AlertCircle, DollarSign, Calendar, Clock, Briefcase, Users, FileText, CheckCircle, XCircle, Clock3 } from 'lucide-react'
import ProjectJoinModal from '@/components/ProjectJoinModal'

interface Counsel {
  counsel_id: number
  title: string | null
  outline: string | null
  period: string
  cost: string
  feild: string | null
  skill: string[] | null
  output: string | null
  counsel_status: string
  start_date: string
  due_date: string
}

interface Client {
  id: string
  name: string
  email: string
  contact: string
}

const ProjectDetailClient: React.FC = () => {
  const [counsel, setCounsel] = useState<Counsel | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [projectMembers, setProjectMembers] = useState<any[]>([])
  const [existingEstimate, setExistingEstimate] = useState<any>(null)
  const [teamEstimate, setTeamEstimate] = useState<TeamEstimate | null>(null)
  const [isManager, setIsManager] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showEstimateForm, setShowEstimateForm] = useState(false)
  const [showTeamEstimateForm, setShowTeamEstimateForm] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [estimateForm, setEstimateForm] = useState({
    estimateAmount: '',
    estimatePeriod: '',
    estimateDetails: ''
  })
  const [teamEstimateForm, setTeamEstimateForm] = useState({
    totalAmount: '',
    startDate: '',
    endDate: '',
    teamCapability: '',
    additionalSuggestions: '',
    detail: '',
    milestones: [] as Array<{
      title: string
      detail: string
      paymentAmount: string
      startDate: string
      endDate: string
    }>
  })
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [loadingTeams, setLoadingTeams] = useState(false)
  const router = useRouter()
  const params = useParams()
  const counselId = params?.id
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    const fetchData = async () => {
      if (!counselId) {
        console.error('counselId가 제공되지 않았습니다.')
        setLoading(false)
        return
      }

      try {
        // 프로젝트 상세 정보 조회 (필수)
        const result = await fetchCounselWithClient(Number(counselId))   
        if (!result || !result.counsel) {
          console.error('프로젝트를 찾을 수 없습니다.')
          setLoading(false)
          return
        }
        
        setCounsel(result.counsel)
        setClient(result.client || null)

        // 매니저 여부 확인
        try {
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            // 현재 사용자의 FREELANCER 프로필 조회
            const { data: managerProfile } = await supabase
              .from('accounts')
              .select('profile_id')
              .eq('user_id', user.id)
              .eq('profile_type', 'FREELANCER')
              .maybeSingle()

            if (managerProfile) {
              // 사용자의 모든 팀 조회
              const { data: teamsData, error: teamsError } = await fetchMyTeams()
              
              if (teamsData && teamsData.length > 0) {
                setIsManager(true)
                setTeams(teamsData)
                
                // 팀이 1개만 있으면 자동 선택
                if (teamsData.length === 1) {
                  setSelectedTeamId(teamsData[0].id)
                  
                  // 팀 견적서 조회
                  const estimate = await getTeamEstimate(Number(counselId), teamsData[0].id)
                  setTeamEstimate(estimate)
                  if (estimate?.estimate_version) {
                    setTeamEstimateForm(prev => ({
                      ...prev,
                      totalAmount: estimate.estimate_version?.total_amount?.toString() || '',
                      startDate: estimate.estimate_version?.start_date || '',
                      endDate: estimate.estimate_version?.end_date || '',
                      detail: estimate.estimate_version?.detail || '',
                    }))
                  }
                }
              } else {
                setIsManager(false)
              }
            }
          }
        } catch (error) {
          console.warn('매니저 확인 실패 (무시):', error)
        }

        // 프로젝트 멤버 조회 (선택적 - 실패해도 계속 진행)
        try {
          const members = await getProjectMembers(Number(counselId))
          setProjectMembers(members || [])
        } catch (error) {
          console.warn('프로젝트 멤버 조회 실패 (무시):', error)
          // 로그인하지 않은 사용자거나 에러가 발생해도 무시하고 계속 진행
        }

        // 현재 사용자의 견적 조회 (선택적 - 실패해도 계속 진행)
        // maker_estimates 테이블이 없을 수 있으므로 에러 무시
        try {
          const estimate = await getMakerEstimate(Number(counselId)) as any
          if (estimate && estimate.estimate_amount) {
            setExistingEstimate(estimate)
            setEstimateForm({
              estimateAmount: estimate.estimate_amount.toString(),
              estimatePeriod: estimate.estimate_period || '',
              estimateDetails: estimate.estimate_details || ''
            })
          }
        } catch (error: any) {
          // maker_estimates 테이블이 없는 경우 등 에러 무시
          if (error?.message?.includes('Could not find the table')) {
            console.log('maker_estimates 테이블이 없습니다. 메이커 견적 기능을 사용할 수 없습니다.')
          } else {
            console.warn('견적 조회 실패 (무시):', error)
          }
        }
      } catch (error) {
        console.error('Error fetching project details:', error)
        toast({
          variant: 'destructive',
          title: '에러 발생',
          description: '프로젝트 정보를 불러오는데 실패했습니다.',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [counselId])

  const handleJoinSuccess = async () => {
    toast({
      title: '참여 신청 완료',
      description: '프로젝트 참여 신청이 완료되었습니다.',
    })
    // 프로젝트 멤버 목록 새로고침
    if (counselId) {
      try {
        const members = await getProjectMembers(Number(counselId))
        setProjectMembers(members || [])
      } catch (error) {
        console.warn('프로젝트 멤버 조회 실패:', error)
      }
    }
  }

  const handleEstimateSubmit = async () => {
    if (!counselId) return

    if (!estimateForm.estimateAmount || !estimateForm.estimatePeriod || !estimateForm.estimateDetails) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '모든 견적 정보를 입력해주세요.',
      })
      return
    }

    setSubmitting(true)
    try {
      await submitMakerEstimate({
        counselId: Number(counselId),
        estimateAmount: Number(estimateForm.estimateAmount),
        estimatePeriod: estimateForm.estimatePeriod,
        estimateDetails: estimateForm.estimateDetails
      })
      
      setShowEstimateForm(false)
      toast({
        title: '견적 제출 완료',
        description: '견적이 성공적으로 제출되었습니다.',
      })
      
      // 견적 정보 새로고침
      const estimate = await getMakerEstimate(Number(counselId))
      setExistingEstimate(estimate)
    } catch (error) {
      console.error('Error submitting estimate:', error)
      toast({
        variant: 'destructive',
        title: '에러 발생',
        description: '견적 제출에 실패했습니다.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleTeamEstimateSubmit = async () => {
    if (!counselId || !client) return

    // 팀 선택 확인
    if (!selectedTeamId) {
      toast({
        variant: 'destructive',
        title: '팀을 선택해주세요',
        description: '견적서를 작성하려면 팀을 선택해야 합니다.',
      })
      return
    }

    if (!teamEstimateForm.totalAmount || !teamEstimateForm.startDate || !teamEstimateForm.endDate || !teamEstimateForm.detail) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '필수 항목(금액, 시작일, 종료일, 상세 설명)을 모두 입력해주세요.',
      })
      return
    }

    setSubmitting(true)
    try {
      // counsel에서 company_profile_id 가져오기
      const { data: counselData } = await (supabase as any)
        .from('counsel')
        .select('company_profile_id')
        .eq('counsel_id', Number(counselId))
        .maybeSingle()

      if (!counselData?.company_profile_id) {
        throw new Error('프로젝트 정보를 찾을 수 없습니다.')
      }

      await submitTeamEstimate(
        Number(counselId),
        counselData.company_profile_id,
        {
          totalAmount: Number(teamEstimateForm.totalAmount),
          startDate: teamEstimateForm.startDate,
          endDate: teamEstimateForm.endDate,
          detail: teamEstimateForm.detail,
          teamCapability: teamEstimateForm.teamCapability,
          additionalSuggestions: teamEstimateForm.additionalSuggestions,
          milestones: teamEstimateForm.milestones.map(m => ({
            title: m.title,
            detail: m.detail,
            paymentAmount: Number(m.paymentAmount),
            startDate: m.startDate,
            endDate: m.endDate,
          })),
        },
        selectedTeamId // 팀 ID 전달
      )

      setShowTeamEstimateForm(false)
      toast({
        title: '팀 견적서 제출 완료',
        description: '견적서가 성공적으로 기업에게 전송되었습니다.',
      })

      // 견적서 정보 새로고침
      const estimate = await getTeamEstimate(Number(counselId), selectedTeamId)
      setTeamEstimate(estimate)
    } catch (error: any) {
      console.error('Error submitting team estimate:', error)
      toast({
        variant: 'destructive',
        title: '에러 발생',
        description: error.message || '견적서 제출에 실패했습니다.',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const addMilestone = () => {
    setTeamEstimateForm(prev => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        {
          title: '',
          detail: '',
          paymentAmount: '',
          startDate: '',
          endDate: '',
        }
      ]
    }))
  }

  const removeMilestone = (index: number) => {
    setTeamEstimateForm(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }))
  }

  const updateMilestone = (index: number, field: string, value: string) => {
    setTeamEstimateForm(prev => ({
      ...prev,
      milestones: prev.milestones.map((m, i) => 
        i === index ? { ...m, [field]: value } : m
      )
    }))
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">프로젝트 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!counsel) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] px-4">
        <div className="text-center bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-md w-full">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-100 p-3">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">프로젝트를 불러올 수 없습니다</h2>
          <p className="text-sm text-gray-600 mb-6">프로젝트가 존재하지 않거나 접근 권한이 없습니다.</p>
          <Button onClick={() => router.back()} variant="outline" className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-8 px-4 md:px-6">
      {/* 프로젝트 헤더 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{counsel.title || '제목 없음'}</h1>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                counsel.counsel_status === 'recruiting' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-gray-50 text-gray-700 border border-gray-200'
              }`}>
                {counsel.counsel_status === 'recruiting' ? '모집중' : '대기중'}
              </span>
            </div>
          </div>
        </div>

        {/* 프로젝트 기본 정보 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-blue-50 p-2.5">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">예상 예산</p>
              <p className="text-lg font-semibold text-gray-900">{counsel.cost || '협의'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-purple-50 p-2.5">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">예상 기간</p>
              <p className="text-lg font-semibold text-gray-900">{counsel.period || '협의'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-indigo-50 p-2.5">
              <Briefcase className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">프로젝트 분야</p>
              <p className="text-lg font-semibold text-gray-900">{counsel.feild || '미지정'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-amber-50 p-2.5">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">시작 예정일</p>
              <p className="text-lg font-semibold text-gray-900">
                {counsel.start_date ? formatDate(counsel.start_date) : '미정'}
              </p>
            </div>
          </div>
        </div>

        {/* 프로젝트 참여 버튼 */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">프로젝트 참여하기</h3>
          </div>
          <Button
            onClick={() => setShowJoinModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            size="lg"
          >
            프로젝트 참여 신청
          </Button>
          {projectMembers.length > 0 && (
            <div className="mt-6">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-medium text-gray-700">참여 중인 멤버</p>
                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                  {projectMembers.length}명
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {projectMembers.slice(0, 5).map((member) => (
                  <span
                    key={member.id}
                    className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-sm border border-gray-200"
                  >
                    {member.profile?.username || '알 수 없음'} <span className="text-gray-500">({member.role === 'MAKER' ? '메이커' : '매니저'})</span>
                  </span>
                ))}
                {projectMembers.length > 5 && (
                  <span className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-sm border border-gray-200">
                    +{projectMembers.length - 5}명 더
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 팀 견적서 섹션 (매니저용) */}
      {isManager && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6 mb-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="rounded-lg bg-blue-50 p-2">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">팀 견적서 작성</h3>
              <p className="text-sm text-gray-600">팀의 수행 가능 범위와 제안사항을 포함한 상세 견적서를 기업에게 제출하세요</p>
            </div>
          </div>

          {teamEstimate ? (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-4 border border-blue-100">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">제출된 팀 견적서</h4>
              </div>
              {teamEstimate.estimate_version && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <span className="text-sm text-gray-500">최종 금액:</span>
                      <p className="font-semibold text-lg">
                        {teamEstimate.estimate_version.total_amount?.toLocaleString()}원
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">프로젝트 기간:</span>
                      <p className="font-semibold">
                        {teamEstimate.estimate_version.start_date && formatDate(teamEstimate.estimate_version.start_date)} ~{' '}
                        {teamEstimate.estimate_version.end_date && formatDate(teamEstimate.estimate_version.end_date)}
                      </p>
                    </div>
                  </div>
                  {teamEstimate.milestones && teamEstimate.milestones.length > 0 && (
                    <div className="mb-3">
                      <span className="text-sm text-gray-500 block mb-2">마일스톤:</span>
                      <div className="space-y-2">
                        {teamEstimate.milestones.map((milestone, idx) => (
                          <div key={milestone.milestone_id} className="bg-white rounded p-2 text-sm">
                            <span className="font-medium">{milestone.title}</span>
                            {milestone.payment_amount && (
                              <span className="text-gray-600 ml-2">
                                ({milestone.payment_amount.toLocaleString()}원)
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mb-3">
                    <span className="text-sm text-gray-500 block mb-1">상세 내용:</span>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap">{teamEstimate.estimate_version.detail}</p>
                  </div>
                  <div className="flex items-center gap-3 pt-4 border-t border-blue-200">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                      teamEstimate.estimate_status === 'pending' 
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : teamEstimate.estimate_status === 'accept'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                      {teamEstimate.estimate_status === 'pending' && (
                        <>
                          <Clock3 className="w-3.5 h-3.5" />
                          검토중
                        </>
                      )}
                      {teamEstimate.estimate_status === 'accept' && (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          수락됨
                        </>
                      )}
                      {teamEstimate.estimate_status === 'reject' && (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          거절됨
                        </>
                      )}
                    </span>
                    <Button
                      onClick={() => setShowTeamEstimateForm(true)}
                      variant="outline"
                      size="sm"
                      className="ml-auto"
                    >
                      견적서 수정
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="rounded-full bg-gray-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-6">아직 팀 견적서를 제출하지 않았습니다.</p>
              <Button
                onClick={() => setShowTeamEstimateForm(true)}
                className="bg-blue-600 hover:bg-blue-700 shadow-sm"
              >
                팀 견적서 작성하기
              </Button>
            </div>
          )}

          {showTeamEstimateForm && (
            <div className="border-t pt-6 mt-6">
              <h4 className="font-medium text-gray-900 mb-4">
                {teamEstimate ? '팀 견적서 수정' : '팀 견적서 작성'}
              </h4>
              <div className="space-y-4">
                {/* 팀 선택 */}
                {teams.length > 0 ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      팀 선택 <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={selectedTeamId?.toString() || ''}
                      onValueChange={(value) => {
                        const teamId = Number(value)
                        setSelectedTeamId(teamId)
                        // 팀 변경 시 해당 팀의 견적서 조회
                        getTeamEstimate(Number(counselId), teamId).then(estimate => {
                          setTeamEstimate(estimate)
                          if (estimate?.estimate_version) {
                            setTeamEstimateForm(prev => ({
                              ...prev,
                              totalAmount: estimate.estimate_version?.total_amount?.toString() || '',
                              startDate: estimate.estimate_version?.start_date || '',
                              endDate: estimate.estimate_version?.end_date || '',
                              detail: estimate.estimate_version?.detail || '',
                            }))
                          }
                        })
                      }}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      최종 금액 (원) <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      value={teamEstimateForm.totalAmount}
                      onChange={(e) => setTeamEstimateForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                      placeholder="예: 5000000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      프로젝트 시작일 <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={teamEstimateForm.startDate}
                      onChange={(e) => setTeamEstimateForm(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    프로젝트 종료일 <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={teamEstimateForm.endDate}
                    onChange={(e) => setTeamEstimateForm(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    팀 수행 가능 범위
                  </label>
                  <Textarea
                    value={teamEstimateForm.teamCapability}
                    onChange={(e) => setTeamEstimateForm(prev => ({ ...prev, teamCapability: e.target.value }))}
                    rows={3}
                    placeholder="팀이 수행할 수 있는 작업 범위, 보유 기술 스택, 팀원 구성 등을 설명해주세요."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    추가 제안
                  </label>
                  <Textarea
                    value={teamEstimateForm.additionalSuggestions}
                    onChange={(e) => setTeamEstimateForm(prev => ({ ...prev, additionalSuggestions: e.target.value }))}
                    rows={3}
                    placeholder="프로젝트 개선을 위한 추가 제안사항을 작성해주세요."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    상세 설명 <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={teamEstimateForm.detail}
                    onChange={(e) => setTeamEstimateForm(prev => ({ ...prev, detail: e.target.value }))}
                    rows={6}
                    placeholder="프로젝트 수행 계획, 작업 방식, 납품 내용 등을 상세히 작성해주세요."
                  />
                </div>

                {/* 마일스톤 섹션 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">마일스톤 (선택)</label>
                    <Button
                      type="button"
                      onClick={addMilestone}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      마일스톤 추가
                    </Button>
                  </div>
                  {teamEstimateForm.milestones.map((milestone, index) => (
                    <div key={index} className="border rounded-lg p-4 mb-3 bg-gray-50">
                      <div className="flex items-start justify-between mb-3">
                        <h5 className="font-medium text-gray-900">마일스톤 {index + 1}</h5>
                        <Button
                          type="button"
                          onClick={() => removeMilestone(index)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-3">
                        <Input
                          placeholder="마일스톤 제목"
                          value={milestone.title}
                          onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                        />
                        <Textarea
                          placeholder="마일스톤 상세 설명"
                          value={milestone.detail}
                          onChange={(e) => updateMilestone(index, 'detail', e.target.value)}
                          rows={2}
                        />
                        <div className="grid grid-cols-3 gap-3">
                          <Input
                            type="number"
                            placeholder="지급 금액 (원)"
                            value={milestone.paymentAmount}
                            onChange={(e) => updateMilestone(index, 'paymentAmount', e.target.value)}
                          />
                          <Input
                            type="date"
                            placeholder="시작일"
                            value={milestone.startDate}
                            onChange={(e) => updateMilestone(index, 'startDate', e.target.value)}
                          />
                          <Input
                            type="date"
                            placeholder="종료일"
                            value={milestone.endDate}
                            onChange={(e) => updateMilestone(index, 'endDate', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleTeamEstimateSubmit}
                    disabled={submitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {submitting ? '제출중...' : (teamEstimate ? '견적서 수정' : '견적서 제출')}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowTeamEstimateForm(false)
                      // 폼 초기화
                      setTeamEstimateForm({
                        totalAmount: '',
                        startDate: '',
                        endDate: '',
                        teamCapability: '',
                        additionalSuggestions: '',
                        detail: '',
                        milestones: [],
                      })
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    취소
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 견적 제출 섹션 (메이커용) */}
      {!isManager && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-lg bg-indigo-50 p-2">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">견적 제출</h3>
          </div>
        
        {existingEstimate ? (
          <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 mb-4 border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5 text-indigo-600" />
              <h4 className="font-semibold text-gray-900">제출된 견적</h4>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <span className="text-sm text-gray-500">견적 금액:</span>
                <p className="font-semibold">{existingEstimate.estimate_amount.toLocaleString()}원</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">예상 기간:</span>
                <p className="font-semibold">{existingEstimate.estimate_period}</p>
              </div>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">견적 상세:</span>
              <p className="text-gray-700 text-sm mt-1">{existingEstimate.estimate_details}</p>
            </div>
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                existingEstimate.estimate_status === 'pending' 
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : existingEstimate.estimate_status === 'accepted'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                {existingEstimate.estimate_status === 'pending' && (
                  <>
                    <Clock3 className="w-3.5 h-3.5" />
                    검토중
                  </>
                )}
                {existingEstimate.estimate_status === 'accepted' && (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    수락됨
                  </>
                )}
                {existingEstimate.estimate_status === 'rejected' && (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    거절됨
                  </>
                )}
              </span>
              <Button
                onClick={() => setShowEstimateForm(true)}
                variant="outline"
                size="sm"
                className="ml-auto"
              >
                견적 수정
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="rounded-full bg-gray-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 mb-6">아직 견적을 제출하지 않았습니다.</p>
            <Button
              onClick={() => setShowEstimateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 shadow-sm"
            >
              견적 제출하기
            </Button>
          </div>
        )}

        {showEstimateForm && (
          <div className="border-t pt-6">
            <h4 className="font-medium text-gray-900 mb-4">
              {existingEstimate ? '견적 수정' : '견적 제출'}
            </h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  견적 금액 (원)
                </label>
                <Input
                  type="number"
                  value={estimateForm.estimateAmount}
                  onChange={(e) => setEstimateForm(prev => ({ ...prev, estimateAmount: e.target.value }))}
                  placeholder="예: 5000000"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  예상 기간
                </label>
                <select
                  value={estimateForm.estimatePeriod}
                  onChange={(e) => setEstimateForm(prev => ({ ...prev, estimatePeriod: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">기간을 선택하세요</option>
                  <option value="1주일">1주일</option>
                  <option value="2주일">2주일</option>
                  <option value="1개월">1개월</option>
                  <option value="2개월">2개월</option>
                  <option value="3개월">3개월</option>
                  <option value="6개월">6개월</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  견적 상세 설명
                </label>
                <Textarea
                  value={estimateForm.estimateDetails}
                  onChange={(e) => setEstimateForm(prev => ({ ...prev, estimateDetails: e.target.value }))}
                  rows={4}
                  placeholder="프로젝트 수행 계획, 사용할 기술 스택, 추가 비용 등에 대해 설명해주세요."
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  onClick={handleEstimateSubmit}
                  disabled={submitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {submitting ? '제출중...' : (existingEstimate ? '견적 수정' : '견적 제출')}
                </Button>
                <Button
                  onClick={() => setShowEstimateForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  취소
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
      )}

      {/* 프로젝트 상세 정보 */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <FileText className="w-5 h-5 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-900">프로젝트 개요</h2>
        </div>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {counsel.outline}
          </p>
        </div>
      </div>

      {/* 요구 기술 스택 */}
      {counsel.skill && counsel.skill.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Briefcase className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">요구 기술 스택</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {counsel.skill.map((skill, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 기대 산출물 */}
      {counsel.output && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">기대 산출물</h2>
          </div>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {counsel.output}
            </p>
          </div>
        </div>
      )}

      {/* 클라이언트 정보 */}
      {client && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900">클라이언트 정보</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">회사명</h3>
              <p className="text-gray-900">{client.name || '미공개'}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">연락처</h3>
              <p className="text-gray-900">{client.contact || '미공개'}</p>
            </div>
          </div>
        </div>
      )}

      {/* 프로젝트 참여 모달 */}
      <ProjectJoinModal
        open={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        counselId={Number(counselId)}
        onSuccess={handleJoinSuccess}
      />

    </div>
  )
}

export default ProjectDetailClient
