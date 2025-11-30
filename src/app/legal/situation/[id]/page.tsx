'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '../../../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Loader2, AlertTriangle, Copy, FileText, Sparkles, Info, Scale, Clock, DollarSign, Users, Briefcase, TrendingUp, Zap, MessageSquare, XCircle, ExternalLink, Phone, Globe, BookOpen, Download, ArrowLeft } from 'lucide-react'
import { getSituationAnalysisByIdV2 } from '../../../../apis/legal.service'
import { useToast } from '../../../../hooks/use-toast'
import { cn } from '../../../../lib/utils'
import { MarkdownRenderer } from '../../../../components/rag/MarkdownRenderer'
import { RAGHighlightedMarkdown, RAGHighlightedText } from '../../../../components/legal/RAGHighlightedText'
import { SituationChat } from '../../../../components/legal/SituationChat'
import { LegalReportCard } from '../../../../components/legal/LegalReportCard'
import { ActionDashboard } from '../../../../components/legal/ActionDashboard'
import type { 
  SituationCategory, 
  SituationAnalysisResponse,
  RelatedCase
} from '../../../../types/legal'

// 카테고리 라벨 매핑
const getCategoryLabel = (category: SituationCategory): string => {
  const labels: Record<SituationCategory, string> = {
    harassment: '직장 내 괴롭힘',
    unpaid_wage: '임금체불',
    unfair_dismissal: '부당해고',
    overtime: '근로시간 문제',
    probation: '수습·인턴 문제',
    unknown: '기타',
  }
  return labels[category] || '알 수 없음'
}

// 위험도 색상
const getRiskColor = (score: number): string => {
  if (score <= 30) return 'bg-green-500'
  if (score <= 70) return 'bg-yellow-500'
  return 'bg-red-500'
}

export default function SituationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const situationId = params.id as string

  const [loading, setLoading] = useState(true)
  const [analysisResult, setAnalysisResult] = useState<SituationAnalysisResponse | null>(null)
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 분석 결과 불러오기
  const loadAnalysis = useCallback(async () => {
    if (!situationId) return

    try {
      setLoading(true)
      setError(null)
      
      const { createSupabaseBrowserClient } = await import('../../../../supabase/supabase-client')
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id || null
      
      const analysis = await getSituationAnalysisByIdV2(situationId, userId) as any
      
      if (!analysis) {
        setError('분석 결과를 찾을 수 없습니다')
        return
      }
      
      setAnalysisId(situationId)
      
      // v2 응답을 v1 형식으로 변환
      const analysisData = analysis?.analysis || {}
      
      // criteria 찾기
      const criteriaArray = (analysis?.criteria && Array.isArray(analysis.criteria) && analysis.criteria.length > 0)
        ? analysis.criteria
        : (analysisData?.criteria && Array.isArray(analysisData.criteria) && analysisData.criteria.length > 0)
        ? analysisData.criteria
        : []
      
      const v1Format: SituationAnalysisResponse = {
        classifiedType: (analysis?.tags?.[0] || analysisData?.classifiedType || 'unknown') as SituationCategory,
        riskScore: analysis?.riskScore ?? analysisData?.riskScore ?? 0,
        summary: analysisData?.summary || analysis?.analysis?.summary || '',
        criteria: criteriaArray.map((criterion: any) => ({
          name: criterion?.name || '',
          status: (criterion?.status || 'likely') as 'likely' | 'unclear' | 'unlikely',
          reason: criterion?.reason || '',
        })),
        actionPlan: analysisData?.actionPlan || analysis?.actionPlan || {
          steps: [
            {
              title: '즉시 조치',
              items: analysis?.checklist?.slice(0, 3) || [],
            },
            {
              title: '권고사항',
              items: analysisData?.recommendations || analysis?.analysis?.recommendations || [],
            },
          ],
        },
        scripts: analysisData?.scripts || analysis?.scripts || {
          toCompany: undefined,
          toAdvisor: undefined,
        },
        relatedCases: (analysis?.relatedCases || []).map((c: any) => ({
          id: c?.id || '',
          title: c?.title || '',
          summary: c?.summary || '',
        })),
        sources: (analysis?.sources || []).map((source: any) => ({
          sourceId: source.sourceId || source.source_id || '',
          sourceType: (source.sourceType || source.source_type || 'law') as 'law' | 'manual' | 'case' | 'standard_contract',
          title: source.title || '',
          snippet: source.snippet || '',
          score: source.score || 0,
          externalId: source.externalId || source.external_id,
          fileUrl: source.fileUrl || source.file_url,
        })),
        organizations: analysis?.organizations || [],
      }
      
      setAnalysisResult(v1Format)
    } catch (err: any) {
      console.error('분석 결과 로드 오류:', err)
      setError(err.message || '분석 결과를 불러오는 중 오류가 발생했습니다.')
      toast({
        title: '오류',
        description: err.message || '분석 결과를 불러오는 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [situationId, toast])

  useEffect(() => {
    loadAnalysis()
  }, [loadAnalysis])

  const handleCopy = (text: string, description: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: '복사 완료',
      description,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-lg font-medium text-slate-700">분석 결과를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !analysisResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                오류
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-700 mb-4">{error || '분석 결과를 찾을 수 없습니다.'}</p>
              <Button onClick={() => router.push('/legal/situation')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                상황 분석 페이지로 돌아가기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* 뒤로가기 버튼 */}
        <Button
          onClick={() => router.push('/legal/situation')}
          variant="ghost"
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          상황 분석 페이지로 돌아가기
        </Button>

        {/* 분석 결과 */}
        <div id="analysis-result" className="space-y-4">
          {/* 상황 분류 카드 */}
          <div className="mb-4">
            <div className="text-center mb-3">
              <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-3">
                사용자님의 상황 분석 결과입니다.
              </h2>
            </div>
            
            {/* 상황 분류 태그 (Badge 형태) */}
            <div className="flex flex-wrap gap-1.5 justify-center mb-4">
              {/* 메인 카테고리 태그 */}
              <div className="px-2.5 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg shadow-md font-semibold text-xs flex items-center gap-1.5">
                <span className="text-xs">🚨</span>
                <span>{getCategoryLabel(analysisResult.classifiedType as SituationCategory)}</span>
              </div>
              
              {/* 위험도 태그 */}
              <div className={`px-2.5 py-1.5 rounded-lg shadow-md font-semibold text-xs flex items-center gap-1.5 text-white ${getRiskColor(analysisResult.riskScore)}`}>
                <span className="text-xs">{analysisResult.riskScore <= 30 ? '✅' : analysisResult.riskScore <= 70 ? '⚠️' : '🚨'}</span>
                <span>위험도 {analysisResult.riskScore}</span>
              </div>
              
              {/* 추가 태그들 */}
              {analysisResult.criteria && analysisResult.criteria.length > 0 && (
                <>
                  {analysisResult.criteria.slice(0, 3).map((criterion, idx) => {
                    const tagEmoji = criterion.status === 'likely' ? '🌙' : criterion.status === 'unclear' ? '📉' : '⚠️'
                    const tagText = criterion.name.length > 20 ? criterion.name.substring(0, 20) + '...' : criterion.name
                    return (
                      <div key={idx} className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg shadow-md font-semibold text-xs flex items-center gap-1.5">
                        <span className="text-xs">{tagEmoji}</span>
                        <span>{tagText}</span>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          </div>

          {/* 리포트 카드 */}
          <LegalReportCard 
            analysisResult={analysisResult}
            onCopy={handleCopy}
          />

          {/* 실전 대응 대시보드 */}
          <ActionDashboard 
            classifiedType={analysisResult.classifiedType as SituationCategory}
            analysisId={analysisId}
            onCopy={handleCopy}
            organizations={analysisResult.organizations}
          />

          {/* AI 전담 노무사 채팅 */}
          <Card className="border-2 border-purple-300 shadow-xl bg-gradient-to-br from-white to-purple-50/30">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-md">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <span>AI 전담 노무사와 상담하기</span>
              </CardTitle>
              <CardDescription>
                상황 분석 결과를 바탕으로 AI 노무사와 실시간 상담할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SituationChat 
                analysisId={analysisId}
                analysisResult={analysisResult}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

