'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { fetchCounselWithClient } from '@/apis/counsel.service'
import { submitMakerEstimate, getMakerEstimate } from '@/apis/maker-estimate.service'
import { getProjectMembers } from '@/apis/project-member.service'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { formatDate } from '@/lib/dateFormat'
import { ArrowLeft } from 'lucide-react'
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
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showEstimateForm, setShowEstimateForm] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [estimateForm, setEstimateForm] = useState({
    estimateAmount: '',
    estimatePeriod: '',
    estimateDetails: ''
  })
  const router = useRouter()
  const params = useParams()
  const counselId = params?.id

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

        // 프로젝트 멤버 조회 (선택적 - 실패해도 계속 진행)
        try {
          const members = await getProjectMembers(Number(counselId))
          setProjectMembers(members || [])
        } catch (error) {
          console.warn('프로젝트 멤버 조회 실패 (무시):', error)
          // 로그인하지 않은 사용자거나 에러가 발생해도 무시하고 계속 진행
        }

        // 현재 사용자의 견적 조회 (선택적 - 실패해도 계속 진행)
        try {
          const estimate = await getMakerEstimate(Number(counselId))
          setExistingEstimate(estimate)
          if (estimate) {
            setEstimateForm({
              estimateAmount: estimate.estimate_amount.toString(),
              estimatePeriod: estimate.estimate_period,
              estimateDetails: estimate.estimate_details
            })
          }
        } catch (error) {
          console.warn('견적 조회 실패 (무시):', error)
          // 로그인하지 않은 사용자거나 에러가 발생해도 무시하고 계속 진행
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
      <div className="flex justify-center items-center h-64">
        <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-lg font-semibold text-red-900 mb-2">프로젝트를 불러올 수 없습니다</p>
          <p className="text-sm text-red-700 mb-4">프로젝트가 존재하지 않거나 접근 권한이 없습니다.</p>
          <Button onClick={() => router.back()} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-[1024px] mx-auto py-6">

      {/* 프로젝트 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{counsel.title || '제목 없음'}</h1>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                counsel.counsel_status === 'recruiting' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {counsel.counsel_status === 'recruiting' ? '모집중' : '대기중'}
              </span>
            </div>
          </div>
        </div>

        {/* 프로젝트 기본 정보 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">예상 예산</h3>
            <p className="text-lg font-semibold text-gray-900">{counsel.cost || '협의'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">예상 기간</h3>
            <p className="text-lg font-semibold text-gray-900">{counsel.period || '협의'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">프로젝트 분야</h3>
            <p className="text-lg font-semibold text-gray-900">{counsel.feild || '미지정'}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">시작 예정일</h3>
            <p className="text-lg font-semibold text-gray-900">
              {counsel.start_date ? formatDate(counsel.start_date) : '미정'}
            </p>
          </div>
        </div>

        {/* 프로젝트 참여 버튼 */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">프로젝트 참여하기</h3>
          <Button
            onClick={() => setShowJoinModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            프로젝트 참여 신청
          </Button>
          {projectMembers.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">참여 중인 멤버 ({projectMembers.length}명)</p>
              <div className="flex flex-wrap gap-2">
                {projectMembers.slice(0, 5).map((member) => (
                  <span
                    key={member.id}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {member.profile?.username || '알 수 없음'} ({member.role === 'MAKER' ? '메이커' : '매니저'})
                  </span>
                ))}
                {projectMembers.length > 5 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                    +{projectMembers.length - 5}명 더
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 견적 제출 섹션 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">견적 제출</h3>
        
        {existingEstimate ? (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">제출된 견적</h4>
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
            <div className="flex gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                existingEstimate.estimate_status === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800'
                  : existingEstimate.estimate_status === 'accepted'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {existingEstimate.estimate_status === 'pending' && '검토중'}
                {existingEstimate.estimate_status === 'accepted' && '수락됨'}
                {existingEstimate.estimate_status === 'rejected' && '거절됨'}
              </span>
              <Button
                onClick={() => setShowEstimateForm(true)}
                variant="outline"
                size="sm"
              >
                견적 수정
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">아직 견적을 제출하지 않았습니다.</p>
            <Button
              onClick={() => setShowEstimateForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
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

      {/* 프로젝트 상세 정보 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">프로젝트 개요</h2>
        <div className="prose max-w-none">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {counsel.outline}
          </p>
        </div>
      </div>

      {/* 요구 기술 스택 */}
      {counsel.skill && counsel.skill.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">요구 기술 스택</h2>
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
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">기대 산출물</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {counsel.output}
            </p>
          </div>
        </div>
      )}

      {/* 클라이언트 정보 */}
      {client && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">클라이언트 정보</h2>
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
