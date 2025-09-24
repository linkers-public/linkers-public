'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { fetchCounselWithClient } from '@/apis/counsel.service'
import { submitParticipationInterest, getParticipationStatus } from '@/apis/participation.service'
import { submitMakerEstimate, getMakerEstimate } from '@/apis/maker-estimate.service'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

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
  const [participationStatus, setParticipationStatus] = useState<string | null>(null)
  const [existingEstimate, setExistingEstimate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showEstimateForm, setShowEstimateForm] = useState(false)
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
        // 프로젝트 상세 정보 조회
        const result = await fetchCounselWithClient(Number(counselId))   
        setCounsel(result?.counsel || null)
        setClient(result?.client || null)

        // 현재 사용자의 참여 의향 상태 조회
        const participation = await getParticipationStatus(Number(counselId))
        setParticipationStatus(participation?.participation_status || null)

        // 현재 사용자의 견적 조회
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

  const handleParticipationInterest = async (status: 'interested' | 'not_interested') => {
    if (!counselId) return

    setSubmitting(true)
    try {
      await submitParticipationInterest(Number(counselId), status)
      setParticipationStatus(status)
      
      toast({
        title: '참여 의향 제출 완료',
        description: status === 'interested' 
          ? '프로젝트에 참여 의향을 표시했습니다.' 
          : '프로젝트 참여 의향이 없음을 표시했습니다.',
      })
    } catch (error) {
      console.error('Error submitting participation interest:', error)
      toast({
        variant: 'destructive',
        title: '에러 발생',
        description: '참여 의향 제출에 실패했습니다.',
      })
    } finally {
      setSubmitting(false)
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
        <p className="text-lg text-gray-600">로딩중...</p>
      </div>
    )
  }

  if (!counsel) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-gray-600">프로젝트를 불러올 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 프로젝트 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-3xl font-bold text-gray-900">{counsel.title}</h1>
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              counsel.counsel_status === 'recruiting' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {counsel.counsel_status === 'recruiting' ? '모집중' : '대기중'}
            </span>
          </div>
        </div>

        {/* 프로젝트 기본 정보 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">예상 예산</h3>
            <p className="text-lg font-semibold text-gray-900">{counsel.cost}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">예상 기간</h3>
            <p className="text-lg font-semibold text-gray-900">{counsel.period}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">프로젝트 분야</h3>
            <p className="text-lg font-semibold text-gray-900">{counsel.feild}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-1">시작 예정일</h3>
            <p className="text-lg font-semibold text-gray-900">
              {new Date(counsel.start_date).toLocaleDateString('ko-KR')}
            </p>
          </div>
        </div>

        {/* 참여 의향 버튼 */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">프로젝트 참여 의향</h3>
          <div className="flex gap-4">
            <Button
              onClick={() => handleParticipationInterest('interested')}
              disabled={submitting || participationStatus === 'interested'}
              className={`px-6 py-3 ${
                participationStatus === 'interested'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white`}
            >
              {participationStatus === 'interested' ? '참여 의향 있음 ✓' : '참여 의향 있음'}
            </Button>
            <Button
              onClick={() => handleParticipationInterest('not_interested')}
              disabled={submitting || participationStatus === 'not_interested'}
              variant="outline"
              className={`px-6 py-3 ${
                participationStatus === 'not_interested'
                  ? 'border-red-500 text-red-600 bg-red-50'
                  : 'border-gray-300 text-gray-700'
              }`}
            >
              {participationStatus === 'not_interested' ? '참여 의향 없음 ✓' : '참여 의향 없음'}
            </Button>
          </div>
          {participationStatus && (
            <p className="text-sm text-gray-600 mt-2">
              현재 상태: {participationStatus === 'interested' ? '참여 의향 있음' : '참여 의향 없음'}
            </p>
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
                <input
                  type="number"
                  value={estimateForm.estimateAmount}
                  onChange={(e) => setEstimateForm(prev => ({ ...prev, estimateAmount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <textarea
                  value={estimateForm.estimateDetails}
                  onChange={(e) => setEstimateForm(prev => ({ ...prev, estimateDetails: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* 뒤로가기 버튼 */}
      <div className="mt-6">
        <Button
          onClick={() => router.back()}
          variant="outline"
          className="px-6 py-2"
        >
          뒤로가기
        </Button>
      </div>
    </div>
  )
}

export default ProjectDetailClient
