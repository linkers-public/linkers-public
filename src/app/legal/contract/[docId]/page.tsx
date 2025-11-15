'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, AlertCircle, ChevronUp, ChevronDown, MessageSquare, GripVertical } from 'lucide-react'
import { ContractViewer } from '@/components/contract/ContractViewer'
import { AnalysisPanel } from '@/components/contract/AnalysisPanel'
import { ContractChat } from '@/components/contract/ContractChat'
import { cn } from '@/lib/utils'
import type { LegalIssue, ContractAnalysisResult } from '@/types/legal'

export default function ContractDetailPage() {
  const params = useParams()
  const docId = params.docId as string

  const [loading, setLoading] = useState(true)
  const [analysisResult, setAnalysisResult] = useState<ContractAnalysisResult | null>(null)
  const [selectedIssueId, setSelectedIssueId] = useState<string | undefined>()
  const [error, setError] = useState<string | null>(null)
  const [chatIssueId, setChatIssueId] = useState<string | undefined>()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [prefilledQuestion, setPrefilledQuestion] = useState<string | undefined>()
  const [chatHeight, setChatHeight] = useState(380)
  const [isResizing, setIsResizing] = useState(false)

  // 분석 결과 로드
  useEffect(() => {
    const loadAnalysis = async () => {
      if (!docId) return

      setLoading(true)
      setError(null)

      try {
        // 1순위: DB에서 분석 결과 가져오기 시도
        let dbData: any = null
        try {
          const response = await fetch(`/api/legal/contract-analysis/${docId}`)
          if (response.ok) {
            dbData = await response.json()
            console.log('[Frontend] DB에서 분석 결과 조회 성공:', docId)
          } else if (response.status === 404) {
            // 404는 정상적인 경우 (DB에 없을 수 있음 - 로컬 스토리지에서 조회)
            console.log('[Frontend] DB에서 분석 결과를 찾을 수 없음, 로컬 스토리지 확인:', docId)
          } else {
            console.warn('[Frontend] DB 조회 실패:', response.status, docId)
          }
        } catch (dbError) {
          console.warn('[Frontend] DB 조회 중 예외 발생, 로컬 스토리지 확인:', dbError)
        }

        // 2순위: 로컬 스토리지에서 분석 결과 가져오기
        const storedData = localStorage.getItem(`contract_analysis_${docId}`)
        const localData = storedData ? JSON.parse(storedData) : null
        
        // DB 데이터를 로컬 형식으로 변환 (필요시)
        const normalizedData = dbData ? {
          risk_score: dbData.risk_score,
          summary: dbData.summary || '',
          contractText: dbData.contract_text || '',
          contract_text: dbData.contract_text || '',
          issues: dbData.analysis_result?.issues || [],
          recommendations: dbData.analysis_result?.recommendations || [],
          createdAt: dbData.created_at,
          fileUrl: dbData.file_url,
        } : localData
        
        if (normalizedData) {
          // 백엔드 응답을 새로운 형식으로 변환
          // "분석 실패" 같은 에러 이슈는 필터링
          const validIssues = (normalizedData.issues || []).filter((issue: any) => {
            const name = (issue.name || '').toLowerCase()
            return !name.includes('분석 실패') && 
                   !name.includes('llm 분석') && 
                   !name.includes('비활성화') &&
                   issue.name && 
                   issue.description
          })
          
          const issues: LegalIssue[] = validIssues.map((issue: any, index: number) => {
            // 카테고리 매핑
            const categoryMap: Record<string, string> = {
              '근로시간': 'working_hours',
              '근로시간/휴게': 'working_hours',
              '보수': 'wage',
              '보수/수당': 'wage',
              '수습': 'probation',
              '수습/해지': 'probation',
              '스톡옵션': 'stock_option',
              '스톡옵션/IP': 'stock_option',
              'IP': 'ip',
              '저작권': 'ip',
              '직장내괴롭힘': 'harassment',
            }

            const issueName = (issue.name || '').toLowerCase()
            const issueDesc = (issue.description || '').toLowerCase()
            const searchText = `${issueName} ${issueDesc}`

            let category: string = 'other'
            if (searchText.includes('근로시간') || searchText.includes('근무시간') || searchText.includes('휴게')) {
              category = 'working_hours'
            } else if (searchText.includes('보수') || searchText.includes('수당') || searchText.includes('임금') || searchText.includes('퇴직')) {
              category = 'wage'
            } else if (searchText.includes('수습') || searchText.includes('해지') || searchText.includes('해고')) {
              category = 'probation'
            } else if (searchText.includes('스톡옵션')) {
              category = 'stock_option'
            } else if (searchText.includes('ip') || searchText.includes('지적재산') || searchText.includes('저작권')) {
              category = 'ip'
            } else if (searchText.includes('괴롭힘') || searchText.includes('성희롱')) {
              category = 'harassment'
            }

            // 위치 정보 추출 (description에서 조항 번호 찾기)
            const clauseMatch = issue.description?.match(/제\s*(\d+)\s*조/)
            const location = {
              clauseNumber: clauseMatch ? clauseMatch[1] : undefined,
              startIndex: issue.start_index ?? issue.startIndex,
              endIndex: issue.end_index ?? issue.endIndex,
            }

            // 메트릭 생성 (severity 기반, 더 정교한 계산 가능)
            const severity = (issue.severity || 'medium').toLowerCase()
            const metrics = {
              legalRisk: severity === 'high' ? 5 : severity === 'medium' ? 3 : 1,
              ambiguity: severity === 'high' ? 4 : severity === 'medium' ? 2 : 1,
              negotiability: severity === 'high' ? 5 : severity === 'medium' ? 3 : 2,
              priority: (severity === 'high' ? 'high' : severity === 'medium' ? 'medium' : 'low') as 'high' | 'medium' | 'low',
            }

            // 권장사항에서 수정안 찾기
            const relatedRec = (normalizedData.recommendations || []).find((rec: any) => {
              const recTitle = (rec.title || '').toLowerCase()
              return recTitle.includes(issueName) || issueName.includes(recTitle)
            })

            return {
              id: `issue-${index}`,
              category: category as any,
              severity: (issue.severity || 'medium').toLowerCase() as 'low' | 'medium' | 'high',
              summary: issue.name || issue.description?.substring(0, 100) || '문제 조항 발견',
              location,
              metrics,
              originalText: issue.description || issue.name || '',
              suggestedText: issue.suggested_text ?? issue.suggestedText ?? relatedRec?.description,
              rationale: issue.rationale ?? relatedRec?.description,
              legalBasis: Array.isArray(issue.legal_basis) ? issue.legal_basis : [],
              suggestedQuestions: issue.suggested_questions ?? issue.suggestedQuestions ?? relatedRec?.steps ?? [],
            } as LegalIssue
          })
          
          // 이슈가 없는 경우 처리
          if (issues.length === 0) {
            console.warn('분석된 이슈가 없습니다. 백엔드 응답:', normalizedData)
          }
          
          // DB 데이터를 로컬 스토리지에 캐싱 (다음 접근 시 빠른 로드)
          if (dbData && !storedData) {
            localStorage.setItem(`contract_analysis_${docId}`, JSON.stringify(normalizedData))
          }

          // 계약서 텍스트 생성 (백엔드에서 제공된 텍스트 사용)
          const contractText = normalizedData.contractText || normalizedData.contract_text || '계약서 텍스트를 불러올 수 없습니다.'

          const result: ContractAnalysisResult = {
            contractText,
            issues,
            summary: normalizedData.summary || '',
            riskScore: normalizedData.risk_score || 0,
            totalIssues: issues.length,
            highRiskCount: issues.filter(i => i.severity === 'high').length,
            mediumRiskCount: issues.filter(i => i.severity === 'medium').length,
            lowRiskCount: issues.filter(i => i.severity === 'low').length,
          }

          setAnalysisResult(result)
        } else {
          setError('분석 결과를 찾을 수 없습니다.')
        }
      } catch (err: any) {
        console.error('분석 결과 로드 실패:', err)
        setError(err.message || '분석 결과를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadAnalysis()
  }, [docId])

  // 채팅 높이 조절 핸들러
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      const windowHeight = window.innerHeight
      const newHeight = windowHeight - e.clientY
      
      // 최소 200px, 최대 화면 높이의 80%
      const minHeight = 200
      const maxHeight = windowHeight * 0.8
      const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeight))
      
      setChatHeight(clampedHeight)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'row-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  // 분석 전 상태
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <div className="text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full blur-3xl opacity-30 animate-pulse"></div>
            <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin text-blue-600 mx-auto" />
            </div>
          </div>
          <p className="text-lg font-semibold text-slate-900 mb-2">계약 조항 분석 중...</p>
          <p className="text-sm text-slate-600">근로시간/보수/수습/스톡옵션 항목별로 조항을 분석하는 중입니다</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error || !analysisResult) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-red-50/20 to-slate-50">
        <div className="text-center max-w-md px-6">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-red-200 rounded-full blur-2xl opacity-20"></div>
            <AlertCircle className="relative w-20 h-20 text-red-500 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">분석 결과를 불러올 수 없습니다</h2>
          <p className="text-slate-600 mb-6">{error || '알 수 없는 오류가 발생했습니다.'}</p>
        </div>
      </div>
    )
  }

  // 분석 완료 상태 - 2-컬럼 레이아웃
  return (
    <div className="min-h-screen h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0 pb-16">
        {/* 상단: 2-컬럼 레이아웃 (계약서 + 분석 결과) */}
        <div className={cn(
          "flex flex-col lg:flex-row overflow-hidden",
          isChatOpen ? "flex-1 min-h-0" : "flex-[1.2] min-h-0"
        )}>
          {/* 왼쪽: 계약서 뷰어 */}
          <div className="w-full lg:w-1/2 flex-shrink-0 overflow-hidden bg-white border-r border-slate-200/60 shadow-sm">
            <ContractViewer
              contractText={analysisResult.contractText}
              issues={analysisResult.issues}
              selectedIssueId={selectedIssueId}
              onIssueClick={setSelectedIssueId}
            />
          </div>

          {/* 오른쪽: 분석 결과 패널 */}
          <div className="w-full lg:w-1/2 flex-shrink-0 overflow-hidden bg-white shadow-sm">
            <AnalysisPanel
              issues={analysisResult.issues}
              totalIssues={analysisResult.totalIssues}
              highRiskCount={analysisResult.highRiskCount}
              mediumRiskCount={analysisResult.mediumRiskCount}
              lowRiskCount={analysisResult.lowRiskCount}
              selectedIssueId={selectedIssueId}
              onIssueSelect={setSelectedIssueId}
              riskScore={analysisResult.riskScore}
              contractText={analysisResult.contractText}
              onCategoryClick={(category) => {
                const categoryIssue = analysisResult.issues.find(i => i.category === category)
                if (categoryIssue) {
                  setSelectedIssueId(categoryIssue.id)
                }
              }}
              onAskAboutIssue={(issueId, prefilledText) => {
                setChatIssueId(issueId)
                setSelectedIssueId(issueId)
                setIsChatOpen(true) // 채팅 열기
                
                // 자동 프리필 질문 설정
                if (prefilledText) {
                  setPrefilledQuestion(prefilledText)
                } else {
                  const issue = analysisResult.issues.find(i => i.id === issueId)
                  if (issue) {
                    const prefilled = `다음 조항이 왜 위험한지와 현실적으로 어떤 협상 포인트를 잡을 수 있을지 알려줘.\n\n[문제 조항]\n${issue.originalText || issue.summary}`
                    setPrefilledQuestion(prefilled)
                  }
                }
                
                // 채팅 영역으로 스크롤
                setTimeout(() => {
                  const chatElement = document.getElementById('contract-chat')
                  if (chatElement) {
                    chatElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }, 100)
              }}
            />
          </div>
        </div>

        {/* 하단: 채팅 UI (접기/펼치기 가능) - 고정 */}
        <div className={cn(
          "fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md shadow-lg",
          isChatOpen ? "flex flex-col" : ""
        )}>
          {/* 채팅 토글 버튼 - 파란색 헤더 스타일 */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={cn(
              "w-full relative overflow-hidden",
              "bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600",
              "hover:from-blue-700 hover:via-blue-600 hover:to-indigo-700",
              "transition-all duration-200",
              "border-t border-blue-400/30"
            )}
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDIuMjA5LTEuNzkxIDQtNCA0cy00LTEuNzkxLTQtNCAxLjc5MS00IDQtNCA0IDEuNzkxIDQgNHptMTAtMTBjMCAyLjIwOS0xLjc5MSA0LTQgNHMtNC0xLjc5MS00LTQgMS43OTEtNCA0LTQgNCAxLjc5MSA0IDR6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L2c+PC9zdmc+')] opacity-20"></div>
            <div className="relative px-4 sm:px-5 py-3 sm:py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg flex-shrink-0">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base sm:text-lg font-bold text-white mb-0.5">AI 법률 상담</h2>
                  <p className="text-xs text-blue-100 leading-relaxed">
                    위험 조항에 대해 구체적으로 질문하시면 이해하기 쉽게 설명해드립니다
                  </p>
                </div>
              </div>
              <div className={cn(
                "p-2 rounded-lg transition-all duration-200 flex-shrink-0 ml-3",
                isChatOpen ? "bg-white/30 text-white rotate-180" : "bg-white/20 text-white/80"
              )}>
                {isChatOpen ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </div>
            </div>
          </button>

          {/* 채팅 컨텐츠 (접기/펼치기) */}
          {isChatOpen && (
            <>
              {/* 리사이저 핸들 */}
              <div
                onMouseDown={(e) => {
                  e.preventDefault()
                  setIsResizing(true)
                }}
                className={cn(
                  "h-2 cursor-row-resize bg-gradient-to-r from-blue-400/50 via-blue-500/50 to-indigo-500/50",
                  "hover:from-blue-500 hover:via-blue-600 hover:to-indigo-600",
                  "transition-colors duration-200",
                  "flex items-center justify-center group relative"
                )}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-blue-300 group-hover:text-white transition-colors" />
                  <span className="text-[10px] text-blue-200 group-hover:text-white font-medium transition-colors">
                    드래그하여 높이 조절
                  </span>
                  <GripVertical className="w-4 h-4 text-blue-300 group-hover:text-white transition-colors" />
                </div>
              </div>
              
              <div 
                id="contract-chat" 
                className="overflow-hidden flex flex-col animate-in slide-in-from-bottom-2 duration-300"
                style={{ height: `${chatHeight}px` }}
              >
              <ContractChat
                docId={docId}
                analysisResult={analysisResult}
                selectedIssueId={chatIssueId || selectedIssueId}
                prefilledQuestion={prefilledQuestion}
                onQuestionPrefilled={() => setPrefilledQuestion(undefined)}
              />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
