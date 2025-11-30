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
import { LegalEmailHelper } from '../../../../components/legal/LegalEmailHelper'
import { parseSummary, findSectionByEmoji, removeEmojiFromTitle } from '../../../../utils/parseSummary'
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
      
      // 디버깅: scripts 확인
      console.log('🔍 [상황분석 상세] analysis 객체:', analysis)
      console.log('🔍 [상황분석 상세] analysis.scripts:', analysis?.scripts)
      console.log('🔍 [상황분석 상세] analysis.scripts?.toCompany:', analysis?.scripts?.toCompany)
      console.log('🔍 [상황분석 상세] analysis.scripts?.toAdvisor:', analysis?.scripts?.toAdvisor)
      
      setAnalysisId(situationId)
      
      // v2 응답을 v1 형식으로 변환
      const analysisData = analysis?.analysis || {}
      
      // criteria 찾기
      const criteriaArray = (analysis?.criteria && Array.isArray(analysis.criteria) && analysis.criteria.length > 0)
        ? analysis.criteria
        : (analysisData?.criteria && Array.isArray(analysisData.criteria) && analysisData.criteria.length > 0)
        ? analysisData.criteria
        : []
      
      // scripts 변환 - 명시적으로 처리
      const scriptsData = analysis?.scripts
      const scripts = scriptsData
        ? {
            toCompany: scriptsData.toCompany || undefined,
            toAdvisor: scriptsData.toAdvisor || undefined,
          }
        : {
            toCompany: undefined,
            toAdvisor: undefined,
          }
      
      console.log('🔍 [상황분석 상세] 변환된 scripts:', scripts)
      console.log('🔍 [상황분석 상세] 변환된 scripts.toCompany:', scripts.toCompany)
      console.log('🔍 [상황분석 상세] 변환된 scripts.toAdvisor:', scripts.toAdvisor)
      
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
        scripts: scripts,
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
      
      // 디버깅: 최종 변환된 scripts 확인
      console.log('🔍 [상황분석 상세] v1Format.scripts:', v1Format.scripts)
      console.log('🔍 [상황분석 상세] v1Format.scripts?.toCompany:', v1Format.scripts?.toCompany)
      console.log('🔍 [상황분석 상세] v1Format.scripts?.toAdvisor:', v1Format.scripts?.toAdvisor)
      
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

  // 페이지 진입 시 상단으로 스크롤
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [situationId])

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

  // summary를 섹션별로 파싱
  const sections = parseSummary(analysisResult.summary || '')
  const summarySection = findSectionByEmoji(sections, '📊')
  const legalViewSection = findSectionByEmoji(sections, '⚖️')
  const actionSection = findSectionByEmoji(sections, '🎯')
  const speakSection = findSectionByEmoji(sections, '💬')

  // 요약 텍스트 추출 (첫 줄만)
  const summaryText = summarySection?.content?.split('\n')[0] || summarySection?.content || ''
  
  // 디버깅: 렌더링 시점 scripts 확인
  console.log('🔍 [상황분석 상세] 렌더링 시점 analysisResult.scripts:', analysisResult.scripts)
  console.log('🔍 [상황분석 상세] 렌더링 시점 analysisResult.scripts?.toCompany:', analysisResult.scripts?.toCompany)
  console.log('🔍 [상황분석 상세] 렌더링 시점 analysisResult.scripts?.toAdvisor:', analysisResult.scripts?.toAdvisor)
  console.log('🔍 [상황분석 상세] 조건 체크:', {
    speakSection: !!speakSection,
    toCompany: !!analysisResult.scripts?.toCompany,
    toAdvisor: !!analysisResult.scripts?.toAdvisor,
    shouldShow: !!(speakSection || analysisResult.scripts?.toCompany || analysisResult.scripts?.toAdvisor)
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* 분석 결과 */}
        <div id="analysis-result" className="space-y-6">
          {/* 1. 상단 헤더 영역 */}
          <Card className="border-2 border-blue-200 shadow-xl bg-gradient-to-br from-white to-blue-50/30">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900 text-center mb-4">
                사용자님의 상황 분석 결과입니다.
              </CardTitle>
              
              {/* 배지 영역 */}
              <div className="flex flex-wrap gap-2 justify-center mb-4">
                {/* 메인 카테고리 배지 */}
                <div className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-lg shadow-md font-semibold text-sm flex items-center gap-2">
                  <span>🚨</span>
                  <span>{getCategoryLabel(analysisResult.classifiedType as SituationCategory)}</span>
                </div>
                
                {/* 위험도 배지 */}
                <div className={`px-3 py-1.5 rounded-lg shadow-md font-semibold text-sm flex items-center gap-2 text-white ${getRiskColor(analysisResult.riskScore)}`}>
                  <span>{analysisResult.riskScore <= 30 ? '✅' : analysisResult.riskScore <= 70 ? '⚠️' : '🚨'}</span>
                  <span>위험도 {analysisResult.riskScore}</span>
                </div>
                
                {/* criteria 첫 번째 항목 배지 */}
                {analysisResult.criteria && analysisResult.criteria.length > 0 && (
                  <div className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-lg shadow-md font-semibold text-sm flex items-center gap-2">
                    <span>{analysisResult.criteria[0].status === 'likely' ? '🌙' : analysisResult.criteria[0].status === 'unclear' ? '📉' : '⚠️'}</span>
                    <span className="max-w-[200px] truncate">{analysisResult.criteria[0].name}</span>
                  </div>
                )}
              </div>

              {/* 요약 설명 */}
              {summaryText && (
                <CardDescription className="text-center text-base text-slate-700">
                  {summaryText}
                </CardDescription>
              )}
            </CardHeader>
          </Card>

          {/* 2. AI 법률 진단 리포트 블록 (기존 LegalReportCard 스타일 반영) */}
          <LegalReportCard 
            analysisResult={analysisResult}
            onCopy={handleCopy}
          />

          {/* 3. 참고 문헌 카드 (relatedCases + sources) */}
          {((analysisResult.relatedCases && analysisResult.relatedCases.length > 0) || (analysisResult.sources && analysisResult.sources.length > 0)) && (
            <Card className="border-2 border-purple-200 shadow-xl bg-white">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg shadow-md">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <span>참고 문헌 및 관련 사례</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 대표 근거 케이스 (relatedCases[0]) */}
                {analysisResult.relatedCases && analysisResult.relatedCases.length > 0 && (
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-purple-600 text-white text-xs font-semibold rounded">
                        대표 근거 케이스
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-2">{analysisResult.relatedCases[0].title}</h4>
                    <p className="text-sm text-slate-700 mb-3">{analysisResult.relatedCases[0].summary}</p>
                    {analysisResult.relatedCases[0].fileUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(analysisResult.relatedCases[0].fileUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        문서 보기
                      </Button>
                    )}
                  </div>
                )}

                {/* sources 리스트 */}
                {analysisResult.sources && analysisResult.sources.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900">관련 법령 및 가이드라인</h4>
                    {analysisResult.sources.map((source, idx) => {
                      const sourceTypeLabels = {
                        law: '법령',
                        manual: '매뉴얼',
                        standard_contract: '표준계약서',
                        case: '사례',
                      }
                      const sourceTypeColors = {
                        law: 'bg-blue-100 text-blue-800 border-blue-300',
                        manual: 'bg-green-100 text-green-800 border-green-300',
                        standard_contract: 'bg-orange-100 text-orange-800 border-orange-300',
                        case: 'bg-purple-100 text-purple-800 border-purple-300',
                      }
                      
                      return (
                        <div key={idx} className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-3">
                            <span className={`px-2 py-1 rounded text-xs font-semibold border ${sourceTypeColors[source.sourceType] || sourceTypeColors.law}`}>
                              {sourceTypeLabels[source.sourceType] || '법령'}
                            </span>
                            <div className="flex-1">
                              <h5 className="font-semibold text-slate-900 mb-1">{source.title}</h5>
                              <p className="text-sm text-slate-600 line-clamp-2 mb-2">{source.snippet}</p>
                              {source.fileUrl && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => window.open(source.fileUrl, '_blank')}
                                  className="h-7 text-xs"
                                >
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  문서 보기
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 4. 실전 대응 대시보드 */}
          <ActionDashboard 
            classifiedType={analysisResult.classifiedType as SituationCategory}
            analysisId={analysisId}
            onCopy={handleCopy}
            organizations={analysisResult.organizations}
          />

          {/* 5. 행동 카드 (🎯 지금 당장 할 수 있는 행동) */}
          {actionSection && (
            <Card className="border-2 border-green-200 shadow-xl bg-gradient-to-br from-white to-green-50/30">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span>{removeEmojiFromTitle(actionSection.title)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-slate max-w-none">
                  <RAGHighlightedMarkdown 
                    content={actionSection.content}
                    sources={analysisResult.sources || []}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* 6. AI 전담 노무사 채팅 (말하기 스크립트 포함) */}
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
            <CardContent className="space-y-4">
              {/* 말하기 팁 카드 */}
              {/* 이렇게 말해보세요 섹션 - Gmail 메일 작성 도우미 */}
              {(speakSection || analysisResult.scripts?.toCompany || analysisResult.scripts?.toAdvisor) && (
                <div className="space-y-4">
                  {speakSection?.content && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="font-semibold text-slate-900 flex items-center gap-2 mb-3">
                        <span>💬</span>
                        <span>이렇게 말해보세요</span>
                      </h4>
                      <div className="prose prose-slate max-w-none text-sm">
                        <RAGHighlightedMarkdown 
                          content={speakSection.content}
                          sources={analysisResult.sources || []}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* 회사에 보낼 메일 */}
                  {analysisResult.scripts?.toCompany && (
                    <LegalEmailHelper
                      toEmail=""
                      recipientName="회사"
                      defaultSubject="[문의] 근로 관련 사안에 대한 확인 요청"
                      suggestionText={analysisResult.scripts.toCompany}
                      title="회사에 이렇게 말해보세요"
                      description="아래 내용을 복사하거나 Gmail로 바로 보낼 수 있습니다."
                    />
                  )}
                  
                  {/* 노무사/기관에 보낼 메일 */}
                  {analysisResult.scripts?.toAdvisor && (
                    <LegalEmailHelper
                      toEmail=""
                      recipientName="노무사/상담 기관"
                      defaultSubject="[상담 요청] 근로 관련 문의"
                      suggestionText={analysisResult.scripts.toAdvisor}
                      title="노무사/상담 기관에 이렇게 말해보세요"
                      description="아래 내용을 복사하거나 Gmail로 바로 보낼 수 있습니다."
                    />
                  )}
                </div>
              )}

              {/* 챗 컴포넌트 */}
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

