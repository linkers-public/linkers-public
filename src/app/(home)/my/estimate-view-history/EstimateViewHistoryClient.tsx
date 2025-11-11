'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { getEstimateViewHistory, type EstimateViewRecord } from '@/apis/estimate-view.service'
import { getEstimateDetail } from '@/apis/company-project.service'
import { FileText, Eye, DollarSign, Calendar, Users, Gift, CreditCard, CheckCircle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'

interface EstimateViewWithDetails extends EstimateViewRecord {
  estimate?: {
    estimate_id: number
    teams?: Array<{
      id: number
      name: string
      manager_id: string
    }>
    counsel?: {
      counsel_id: number
      title: string | null
      outline: string | null
    }
    estimate_version?: Array<{
      total_amount: number | null
    }>
  }
}

export default function EstimateViewHistoryClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [views, setViews] = useState<EstimateViewWithDetails[]>([])
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadViewHistory()
  }, [])

  const loadViewHistory = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // client 정보 확인
      const { data: client } = await supabase
        .from('client')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!client) {
        toast({
          variant: 'destructive',
          title: '기업 계정이 아닙니다',
          description: '견적서 열람 기록은 기업 계정에서만 확인할 수 있습니다.',
        })
        return
      }

      // 열람 기록 조회
      const viewHistory = await getEstimateViewHistory()

      // 각 열람 기록에 대해 견적서 정보 조회
      const viewsWithDetails = await Promise.all(
        viewHistory.map(async (view) => {
          try {
            const estimateDetail = await getEstimateDetail(view.estimate_id)
            return {
              ...view,
              estimate: estimateDetail,
            }
          } catch (error) {
            console.error(`견적서 ${view.estimate_id} 정보 조회 실패:`, error)
            return {
              ...view,
              estimate: undefined,
            }
          }
        })
      )

      setViews(viewsWithDetails as any)
    } catch (error: any) {
      console.error('견적서 열람 기록 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '견적서 열람 기록을 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const getViewTypeLabel = (viewType: string) => {
    switch (viewType) {
      case 'free':
        return { label: '무료 열람', icon: Gift, className: 'bg-green-100 text-green-800' }
      case 'subscription':
        return { label: '구독 열람', icon: CreditCard, className: 'bg-blue-100 text-blue-800' }
      case 'paid':
        return { label: '건별 결제', icon: DollarSign, className: 'bg-purple-100 text-purple-800' }
      default:
        return { label: viewType, icon: Eye, className: 'bg-gray-100 text-gray-800' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">견적서 열람 기록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full md:py-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">견적서 열람 기록</h1>
        <p className="text-gray-600">열람한 견적서 내역을 확인하세요</p>
      </div>

      <div className="space-y-4">
        {views.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 md:p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">견적서 열람 기록이 없습니다</p>
            <p className="text-sm text-gray-500 mb-4">견적서를 열람하면 기록이 표시됩니다</p>
            <Button onClick={() => router.push('/my/company/estimates')} variant="outline">
              견적서 보기
            </Button>
          </div>
        ) : (
          views.map((view) => {
            const viewTypeInfo = getViewTypeLabel(view.view_type)
            const Icon = viewTypeInfo.icon

            return (
              <div
                key={view.id}
                className="bg-white rounded-lg shadow-sm border p-4 md:p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {view.estimate ? (
                      <>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="flex items-center gap-2">
                            <Icon className="w-5 h-5 text-gray-600" />
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${viewTypeInfo.className}`}>
                              {viewTypeInfo.label}
                            </span>
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {view.estimate.counsel?.title || '제목 없음'}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{view.estimate.teams?.[0]?.name || '팀명 없음'}</span>
                          </div>
                          {view.estimate.estimate_version && view.estimate.estimate_version.length > 0 && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="w-4 h-4" />
                              <span className="font-semibold text-gray-900">
                                {view.estimate.estimate_version[0].total_amount?.toLocaleString()}원
                              </span>
                            </div>
                          )}
                        </div>
                        {view.estimate.counsel?.outline && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                            {view.estimate.counsel.outline}
                          </p>
                        )}
                      </>
                    ) : (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-5 h-5 text-gray-600" />
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${viewTypeInfo.className}`}>
                            {viewTypeInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">견적서 ID: {view.estimate_id}</p>
                        <p className="text-xs text-gray-500">견적서 정보를 불러올 수 없습니다</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        {new Date(view.created_at).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {view.view_type === 'paid' && view.amount_paid > 0 && (
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="font-semibold text-gray-900">
                          {view.amount_paid.toLocaleString()}원 결제
                        </span>
                      </div>
                    )}
                  </div>
                  {view.estimate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/my/company/estimates`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      견적서 보기
                    </Button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

