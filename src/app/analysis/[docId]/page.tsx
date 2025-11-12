'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SubHeader from '@/components/layout/SubHeader'
import {
  TechStackCard,
  BudgetCard,
  PeriodCard,
  AnalysisSummaryCard,
} from '@/components/rag/AnalysisSummaryCard'
import { Button } from '@/components/ui/button'
import { Loader2, ArrowRight, Send, Sparkles } from 'lucide-react'
import type { QueryResponse } from '@/types/rag'
import { MarkdownTable } from '@/components/rag/MarkdownTable'

export default function AnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const docId = params.docId as string

  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState<QueryResponse | null>(null)
  const [docInfo, setDocInfo] = useState<any>(null)
  const [customQuery, setCustomQuery] = useState('')
  const [isCustomMode, setIsCustomMode] = useState(false)
  const [examplePrompts] = useState([
    '아래 공고 PDF와 과거 3년간 유사 공공 IT사업 데이터를 바탕으로, 주요 기술 요구사항과 적정 예산 범위, 예상 수행기간을 요약해줘.',
    '아래 기업/프리랜서 이력 데이터 중 기술스택, 평점, 지역 경력을 비교해 상위 3개 팀 추천 이유를 표로 요약해줘.',
    '이 공고의 핵심 요구사항, 예산 범위, 예상 기간을 요약해주세요.',
    '과거 유사 프로젝트와 비교하여 이 공고의 난이도와 리스크를 분석해주세요.',
  ])

  useEffect(() => {
    loadAnalysis()
    loadDocInfo()
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

  // 분석 결과에서 정보 추출 (간단한 파싱)
  const extractInfo = () => {
    if (!analysis?.answer) return null

    const answer = analysis.answer
    const techStack: string[] = []
    const budget: { min?: number; max?: number; evidenceId?: number } = {}
    const period: { months?: number; evidenceId?: number } = {}
    const risks: Array<{ label: string; value: string; evidenceId?: number }> = []

    // 간단한 파싱 (실제로는 더 정교한 파싱 필요)
    const techKeywords = ['React', 'Node.js', 'Python', 'Java', 'AWS', 'Docker']
    techKeywords.forEach((tech) => {
      if (answer.includes(tech)) techStack.push(tech)
    })

    const budgetMatch = answer.match(/(\d+)\s*만?원?\s*[~-]\s*(\d+)\s*만?원?/i)
    if (budgetMatch) {
      budget.min = parseInt(budgetMatch[1]) * 10000
      budget.max = parseInt(budgetMatch[2]) * 10000
    }

    const periodMatch = answer.match(/(\d+)\s*개월/i)
    if (periodMatch) {
      period.months = parseInt(periodMatch[1])
    }

    // 근거 ID 추출
    const evidenceIds = answer.match(/\[id:(\d+)\]/g)?.map((m) => parseInt(m.replace(/\[id:|\]/g, ''))) || []
    if (evidenceIds.length > 0) {
      budget.evidenceId = evidenceIds[0]
      period.evidenceId = evidenceIds[0]
    }

    return { techStack, budget, period, risks }
  }

  const info = extractInfo()

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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 중앙: 분석 카드들 */}
            <div className="lg:col-span-2 space-y-6">
              {info?.techStack && info.techStack.length > 0 && (
                <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">요구기술</h3>
                  <div className="flex flex-wrap gap-2">
                    {info.techStack.map((tech, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center px-3 py-1 rounded-xl text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {info?.budget && (info.budget.min || info.budget.max) && (
                <BudgetCard
                  min={info.budget.min}
                  max={info.budget.max}
                  evidenceId={info.budget.evidenceId}
                />
              )}

              {info?.period && info.period.months && (
                <PeriodCard
                  months={info.period.months}
                  evidenceId={info.period.evidenceId}
                />
              )}

              {analysis?.answer && (
                <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-sm">
                  <h3 className="text-lg font-semibold mb-4">상세 분석</h3>
                  
                  {/* 표가 있는 경우 표로 렌더링 */}
                  <MarkdownTable content={analysis.answer} />
                  
                  {/* 일반 텍스트 렌더링 */}
                  <div 
                    className="prose max-w-none text-sm text-slate-700 whitespace-pre-wrap mt-4"
                    dangerouslySetInnerHTML={{ 
                      __html: analysis.answer
                        .replace(/\|.+\|[\n\r]+/g, '') // 표 제거 (표는 별도 컴포넌트로 렌더링)
                        .replace(/\n/g, '<br />')
                        .replace(/\[id:(\d+)\]/g, '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-blue-100 text-blue-700 border border-blue-200">[id:$1]</span>')
                    }}
                  />
                </div>
              )}
            </div>

            {/* 우측: 근거 패널 */}
            <div className="lg:col-span-1">
              <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-sm sticky top-24">
                <h3 className="text-lg font-semibold mb-4">사용된 근거</h3>
                <div className="space-y-2">
                  {analysis?.usedChunks.map((chunk) => (
                    <button
                      key={chunk.id}
                      className="w-full text-left p-2 rounded-lg hover:bg-slate-50 text-sm"
                    >
                      <div className="font-mono text-blue-600">[id:{chunk.id}]</div>
                      <div className="text-xs text-slate-500">
                        문서 {chunk.doc_id} · {(chunk.score * 100).toFixed(1)}%
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

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

