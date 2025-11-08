'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { 
  getReceivedEstimates,
  getEstimateDetail,
  updateEstimateStatus
} from '@/apis/company-project.service'
import { toast } from '@/hooks/use-toast'
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Eye,
  DollarSign,
  Calendar,
  Users,
  MessageSquare,
  GitCompare,
  ArrowRight
} from 'lucide-react'

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

interface EstimateDetail extends Estimate {
  milestone?: Array<{
    milestone_id: number
    estimate_id: number
    estimate_version_id: number
    title: string
    detail: string | null
    payment_amount: number | null
    milestone_start_date: string | null
    milestone_due_date: string | null
    progress: string | null
  }>
}

export default function CompanyEstimatesClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [selectedEstimate, setSelectedEstimate] = useState<EstimateDetail | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [compareEstimates, setCompareEstimates] = useState<number[]>([])
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadEstimates()
    const compareId = searchParams?.get('compare')
    if (compareId) {
      setCompareMode(true)
      setCompareEstimates([parseInt(compareId)])
    }
  }, [])

  const loadEstimates = async () => {
    try {
      setLoading(true)
      const data = await getReceivedEstimates()
      setEstimates(data)
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
      setSelectedEstimate(data)
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

  const handleEstimateProceed = async (estimateId: number) => {
    try {
      await updateEstimateStatus(estimateId, 'in_progress')
      toast({
        title: '계약이 진행되었습니다',
      })
      loadEstimates()
      if (selectedEstimate?.estimate_id === estimateId) {
        loadEstimateDetail(estimateId)
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: '계약 진행 실패',
        description: error.message,
      })
    }
  }

  const handleChat = (estimateId: number) => {
    // 채팅 페이지로 이동 (추후 구현)
    router.push(`/chat?estimate_id=${estimateId}`)
  }

  const handleVersionCompare = (estimateId: number) => {
    if (compareEstimates.includes(estimateId)) {
      setCompareEstimates(compareEstimates.filter(id => id !== estimateId))
    } else {
      setCompareEstimates([...compareEstimates, estimateId])
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">견적서를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full md:py-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">받은 견적서</h1>
        <p className="text-gray-600">팀/매니저가 보낸 견적서를 확인하고 관리하세요</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 견적서 목록 */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="font-semibold mb-4">견적서 목록</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {estimates.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">받은 견적서가 없습니다</p>
                </div>
              ) : (
                estimates.map((estimate) => (
                  <div
                    key={estimate.estimate_id}
                    onClick={() => loadEstimateDetail(estimate.estimate_id)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedEstimate?.estimate_id === estimate.estimate_id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-sm">{estimate.teams?.name || '팀명 없음'}</h3>
                      {getStatusBadge(estimate.estimate_status)}
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>매니저: {estimate.teams?.manager_id || '없음'}</div>
                      {estimate.estimate_version && estimate.estimate_version.length > 0 && (
                        <>
                          <div>총액: {estimate.estimate_version[0].total_amount?.toLocaleString()}원</div>
                          <div>버전: {estimate.estimate_version.length}개</div>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 견적서 상세 */}
        <div className="lg:col-span-2">
          {selectedEstimate ? (
            <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedEstimate.teams?.name || '팀명 없음'}
                  </h2>
                  {getStatusBadge(selectedEstimate.estimate_status)}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleVersionCompare(selectedEstimate.estimate_id)}
                  >
                    <GitCompare className="w-4 h-4 mr-1" />
                    비교
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChat(selectedEstimate.estimate_id)}
                  >
                    <MessageSquare className="w-4 h-4 mr-1" />
                    질문하기
                  </Button>
                </div>
              </div>

              {/* 기본 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">담당 매니저</div>
                    <div className="font-medium">
                      {selectedEstimate.teams?.manager_id || '없음'}
                    </div>
                  </div>
                </div>
                {selectedEstimate.estimate_version && selectedEstimate.estimate_version.length > 0 && (
                  <>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">총액</div>
                        <div className="font-medium">
                          {selectedEstimate.estimate_version[0].total_amount?.toLocaleString()}원
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="text-sm text-gray-600">기간</div>
                        <div className="font-medium">
                          {selectedEstimate.estimate_version[0].start_date} ~ {selectedEstimate.estimate_version[0].end_date}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">버전</div>
                      <div className="font-medium">{selectedEstimate.estimate_version.length}개</div>
                    </div>
                  </>
                )}
              </div>

              {/* 견적 버전 목록 */}
              {selectedEstimate.estimate_version && selectedEstimate.estimate_version.length > 1 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">견적 버전</h3>
                  <div className="space-y-3">
                    {selectedEstimate.estimate_version.map((version, index) => (
                      <div key={version.estimate_version_id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium">버전 {index + 1}</div>
                            <div className="text-sm text-gray-600">{version.version_date}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{version.total_amount?.toLocaleString()}원</div>
                            <div className="text-sm text-gray-600">
                              {version.start_date} ~ {version.end_date}
                            </div>
                          </div>
                        </div>
                        {version.detail && (
                          <div className="mt-3 pt-3 border-t text-sm text-gray-700">
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
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">상세 내역</h3>
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedEstimate.estimate_version[0].detail}
                  </div>
                </div>
              )}

              {/* 액션 버튼 */}
              <div className="flex gap-2 pt-6 border-t">
                {selectedEstimate.estimate_status === 'pending' && (
                  <>
                    <Button
                      onClick={() => handleEstimateAccept(selectedEstimate.estimate_id)}
                      className="flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      수락
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleEstimateHold(selectedEstimate.estimate_id)}
                      className="flex-1"
                    >
                      <Clock className="w-4 h-4 mr-1" />
                      보류
                    </Button>
                  </>
                )}
                {selectedEstimate.estimate_status === 'accept' && (
                  <Button
                    onClick={() => handleEstimateProceed(selectedEstimate.estimate_id)}
                    className="flex-1"
                  >
                    <ArrowRight className="w-4 h-4 mr-1" />
                    계약 진행
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">견적서를 선택해주세요</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

