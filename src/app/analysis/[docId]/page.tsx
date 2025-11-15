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
  const [examplePrompts] = useState([
    '아래 공고 PDF와 과거 3년간 유사 공공 IT사업 데이터를 바탕으로, 주요 기술 요구사항과 적정 예산 범위, 예상 수행기간을 요약해줘.',
    '아래 기업/프리랜서 이력 데이터 중 기술스택, 평점, 지역 경력을 비교해 상위 3개 팀 추천 이유를 표로 요약해줘.',
    '이 공고의 핵심 요구사항, 예산 범위, 예상 기간을 요약해주세요.',
    '과거 유사 프로젝트와 비교하여 이 공고의 난이도와 리스크를 분석해주세요.',
  ])

  useEffect(() => {
    loadAnalysis()
    loadDocInfo()
    loadAnnouncementAnalysis()
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
      <main className="flex-1 container mx-auto px-6 py-8 max-w-7xl">
        {/* 프롬프트 입력 섹션 */}
        <div className="mb-6 rounded-2xl border border-slate-200 p-6 bg-white shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-purple-500" />
            <h2 className="text-xl font-semibold">커스텀 분석 프롬프트</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex gap-2">
              <textarea
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="예: 아래 공고 PDF와 과거 3년간 유사 공공 IT사업 데이터를 바탕으로, 주요 기술 요구사항과 적정 예산 범위, 예상 수행기간을 요약해줘."
                className="flex-1 min-h-[100px] px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    handleCustomQuery()
                  }
                }}
              />
              <Button
                onClick={handleCustomQuery}
                disabled={loading || !customQuery.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3 h-auto"
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
              <p className="text-sm text-slate-600 mb-2">💡 예시 프롬프트:</p>
              <div className="flex flex-wrap gap-2">
                {examplePrompts.map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleExampleClick(example)}
                    disabled={loading}
                    className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {example.substring(0, 40)}...
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 중앙: 분석 카드들 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 공고 분석 결과 (기본 표시) */}
            <AnnouncementAnalysisView
              analysis={announcementAnalysis}
              loading={loadingAnnouncement}
            />

            {/* RAG 쿼리 결과 (조회/요약) */}
            {analysis && (
              <div className="space-y-4">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">RAG 조회 결과</h2>
                  <p className="text-gray-600">
                    사용자 프롬프트에 대한 RAG 기반 분석 결과입니다.
                  </p>
                </div>
                <RAGQueryResultView
                  analysis={analysis}
                  loading={loading}
                  onShowEvidence={handleChunkClick}
                />
              </div>
            )}
          </div>

          {/* 우측: 근거 패널 */}
          <div className="lg:col-span-1">
            <EvidencePanel
              chunks={analysis?.usedChunks || []}
              onChunkClick={handleChunkClick}
            />
          </div>
        </div>

        {/* 하단 CTA */}
        {!loading && (
          <div className="mt-8 flex justify-end">
            <Button
              onClick={() => router.push(`/match/${docId}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-2 font-medium shadow-sm"
              size="lg"
            >
              팀 추천 보기
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

