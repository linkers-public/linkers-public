'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SubHeader from '@/components/layout/SubHeader'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowRight, Send, Sparkles } from 'lucide-react'
import type { QueryResponse } from '@/types/rag'
import AnnouncementAnalysisView from '@/components/AnnouncementAnalysisView'
import RAGQueryResultView from '@/components/rag/RAGQueryResultView'
import EvidencePanel from '@/components/rag/EvidencePanel'
import { getAnnouncement } from '@/apis/public-announcement.service'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'

export default function AnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const docId = params.docId as string

  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState<QueryResponse | null>(null)
  const [docInfo, setDocInfo] = useState<any>(null)
  const [customQuery, setCustomQuery] = useState('')
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [announcementAnalysis, setAnnouncementAnalysis] = useState<any>(null)
  const [loadingAnnouncement, setLoadingAnnouncement] = useState(true)
  const [autoAnalysisExecuted, setAutoAnalysisExecuted] = useState(false)
  const [examplePrompts] = useState([
    '아래 공고 PDF와 과거 3년간 유사 공공 IT사업 데이터를 바탕으로, 주요 기술 요구사항과 적정 예산 범위, 예상 수행기간을 요약해줘.',
    '아래 기업/프리랜서 이력 데이터 중 기술스택, 평점, 지역 경력을 비교해 상위 3개 팀 추천 이유를 표로 요약해줘.',
    '이 공고의 핵심 요구사항, 예산 범위, 예상 기간을 요약해주세요.',
    '과거 유사 프로젝트와 비교하여 이 공고의 난이도와 리스크를 분석해주세요.',
  ])

  useEffect(() => {
    loadDocInfo()
    loadAnnouncementAnalysis()
    // 자동으로 기본 분석 실행 (마크다운 형식으로 요청)
    if (!autoAnalysisExecuted) {
      loadAnalysis('이 공고의 핵심 요구사항, 예산 범위, 예상 기간을 마크다운 형식으로 구조화하여 요약해주세요. 제목과 내용을 명확히 구분해주세요.', false)
      setAutoAnalysisExecuted(true)
    }
  }, [docId])

  const loadDocInfo = async () => {
    try {
      const response = await fetch(`/api/rag/docs/${docId}`)
      if (response.ok) {
        const data = await response.json()
        setDocInfo({
          title: data.title || '공고 문서',
          organization: data.organization || data.meta?.organization,
          publishedAt: data.published_at || data.created_at,
        })
      } else {
        // 기본값 설정
        setDocInfo({
          title: '공고 문서',
          organization: '',
          publishedAt: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error('문서 정보 로드 실패:', error)
      setDocInfo({
        title: '공고 문서',
        organization: '',
        publishedAt: new Date().toISOString(),
      })
    }
  }

  const loadAnnouncementAnalysis = async () => {
    try {
      setLoadingAnnouncement(true)
      
      // UUID인 경우 public_announcements 테이블에서 조회 시도
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docId)
      
      if (isUUID) {
        // Supabase에서 UUID로 조회
        const supabase = createSupabaseBrowserClient()
        const { data, error } = await supabase
          .from('public_announcements')
          .select('*')
          .eq('id', docId)
          .maybeSingle()
        
        if (!error && data) {
          // 분석 결과가 있으면 변환
          if (data.ai_analysis || data.required_skills || data.budget_min || data.budget_max) {
            setAnnouncementAnalysis({
              summary: data.ai_analysis?.summary || data.raw_text?.substring(0, 200) + '...',
              requiredSkills: data.required_skills || data.ai_analysis?.requiredSkills || data.ai_analysis?.essential_skills || [],
              budgetMin: data.budget_min || data.ai_analysis?.budgetMin,
              budgetMax: data.budget_max || data.ai_analysis?.budgetMax,
              durationMonths: data.duration_months || data.ai_analysis?.durationMonths,
              organizationName: data.organization_name || data.ai_analysis?.organizationName,
              deadline: data.deadline || data.ai_analysis?.deadline,
              location: data.location || data.ai_analysis?.location,
            })
          }
        } else {
          // 백엔드 API로 시도
          const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000'
          try {
            const response = await fetch(`${backendUrl}/api/v2/announcements/${docId}/analysis`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            })
            
            if (response.ok) {
              const backendData = await response.json()
              const analysis = backendData.data || backendData
              
              setAnnouncementAnalysis({
                summary: analysis.summary || analysis.project_name || '',
                requiredSkills: analysis.required_skills || analysis.essential_skills || [],
                budgetMin: analysis.budget_min,
                budgetMax: analysis.budget_max,
                durationMonths: analysis.duration_months,
                organizationName: analysis.organization_name || analysis.agency,
                deadline: analysis.deadline,
                location: analysis.location,
              })
            }
          } catch (backendError) {
            console.error('백엔드 분석 조회 실패:', backendError)
          }
        }
      } else {
        // 숫자 ID인 경우
        const numericId = parseInt(docId)
        if (!isNaN(numericId)) {
          try {
            const data = await getAnnouncement(numericId)
            if (data) {
              setAnnouncementAnalysis({
                summary: data.ai_analysis?.summary || data.raw_text?.substring(0, 200) + '...',
                requiredSkills: data.required_skills || data.ai_analysis?.requiredSkills || data.ai_analysis?.essential_skills || [],
                budgetMin: data.budget_min || data.ai_analysis?.budgetMin,
                budgetMax: data.budget_max || data.ai_analysis?.budgetMax,
                durationMonths: data.duration_months || data.ai_analysis?.durationMonths,
                organizationName: data.organization_name || data.ai_analysis?.organizationName,
                deadline: data.deadline || data.ai_analysis?.deadline,
                location: data.location || data.ai_analysis?.location,
              })
            }
          } catch (error) {
            console.error('공고 분석 로드 실패:', error)
          }
        }
      }
    } catch (error) {
      console.error('공고 분석 로드 실패:', error)
    } finally {
      setLoadingAnnouncement(false)
    }
  }

  const loadAnalysis = async (query?: string, useCustomMode = false) => {
    try {
      setLoading(true)
      const analysisQuery = query || '이 공고의 핵심 요구사항, 예산 범위, 예상 기간을 요약해주세요.'
      const isTeamComparison = analysisQuery.includes('팀') && (analysisQuery.includes('비교') || analysisQuery.includes('추천'))
      
      // docId가 UUID인지 숫자인지 확인
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(docId)
      const docIds = isUUID ? [docId] : [parseInt(docId)]
      
      const response = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: useCustomMode ? 'custom' : 'summary',
          query: analysisQuery,
          topK: useCustomMode ? 16 : 8, // 커스텀 모드에서는 더 많은 청크 검색
          withTeams: isTeamComparison,
          docIds: docIds,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '분석 실패')
      }

      const data = await response.json()
      setAnalysis(data)
      setIsCustomMode(useCustomMode)
    } catch (error) {
      console.error('분석 로드 실패:', error)
      // 에러 상태 표시를 위해 null로 설정하지 않고 빈 결과로 설정
      setAnalysis({
        answer: '분석을 불러오는 중 오류가 발생했습니다.',
        usedChunks: [],
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCustomQuery = async () => {
    if (!customQuery.trim()) return
    await loadAnalysis(customQuery, true)
  }

  const handleExampleClick = (example: string) => {
    setCustomQuery(example)
    loadAnalysis(example, true)
  }

  const handleChunkClick = (chunkId: number) => {
    // 근거 청크 클릭 시 처리 (필요시 구현)
    console.log('Chunk clicked:', chunkId)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SubHeader
        docTitle={docInfo?.title}
        organization={docInfo?.organization}
        publishedAt={docInfo?.publishedAt}
        currentStep={2}
        totalSteps={5}
      />
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        {/* 프롬프트 입력 섹션 */}
        <div className="mb-8 rounded-2xl border border-slate-200/60 p-6 bg-gradient-to-br from-white to-slate-50/50 shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">커스텀 분석 프롬프트</h2>
              <p className="text-sm text-gray-500 mt-0.5">추가 질문이나 분석을 원하시면 입력해주세요</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <textarea
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="예: 아래 공고 PDF와 과거 3년간 유사 공공 IT사업 데이터를 바탕으로, 주요 기술 요구사항과 적정 예산 범위, 예상 수행기간을 요약해줘."
                className="flex-1 min-h-[110px] px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all duration-200 bg-white text-gray-900 placeholder:text-gray-400"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleCustomQuery()
                  }
                }}
              />
              <Button
                onClick={handleCustomQuery}
                disabled={loading || !customQuery.trim()}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl px-6 py-3 h-auto shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    분석
                  </>
                )}
              </Button>
            </div>

            {/* 예시 프롬프트 */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <span className="text-lg">💡</span>
                예시 프롬프트
              </p>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExampleClick(example)}
                    disabled={loading}
                    className="text-xs px-3 py-2 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow"
                  >
                    {example.substring(0, 40)}...
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 로딩 상태 표시 (초기 로딩) */}
        {loading && !analysis && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <div className="absolute inset-0 w-12 h-12 border-4 border-blue-100 rounded-full mx-auto"></div>
              </div>
              <p className="text-gray-700 font-medium">문서를 분석하고 요약 중입니다...</p>
              <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
            </div>
          </div>
        )}

        {/* 분석 결과 그리드 */}
        {(!loading || analysis) && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* 중앙: 분석 카드들 */}
            <div className="lg:col-span-2 space-y-8">
              {/* 공고 분석 결과 (기본 표시) */}
              {announcementAnalysis && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">AI 분석 결과</h2>
                      <p className="text-sm text-gray-500 mt-0.5">LLM이 공고문을 분석하여 주요 정보를 자동으로 추출했습니다</p>
                    </div>
                  </div>
                  <AnnouncementAnalysisView
                    analysis={announcementAnalysis}
                    loading={loadingAnnouncement}
                  />
                </div>
              )}

              {/* RAG 쿼리 결과 (조회/요약) - 기본 표시 */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">문서 분석/요약</h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {isCustomMode 
                        ? '사용자 프롬프트에 대한 RAG 기반 분석 결과입니다'
                        : '업로드한 문서에 대한 자동 분석 및 요약 결과입니다'}
                    </p>
                  </div>
                </div>
                <RAGQueryResultView
                  analysis={analysis}
                  loading={loading}
                  onShowEvidence={handleChunkClick}
                />
              </div>
            </div>

            {/* 우측: 근거 패널 */}
            <div className="lg:col-span-1">
              <EvidencePanel
                chunks={analysis?.usedChunks || []}
                onChunkClick={handleChunkClick}
              />
            </div>
          </div>
        )}

        {/* 하단 CTA */}
        {!loading && analysis && (
          <div className="mt-10 pt-8 border-t border-slate-200 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              분석이 완료되었습니다. 다음 단계로 진행하세요
            </p>
            <Button
              onClick={() => router.push(`/match/${docId}`)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              size="lg"
            >
              팀 추천 보기
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

