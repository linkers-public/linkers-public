'use client'

import React, { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, AlertCircle, ChevronUp, ChevronDown, MessageSquare } from 'lucide-react'
import { ContractViewer } from '@/components/contract/ContractViewer'
import { AnalysisPanel } from '@/components/contract/AnalysisPanel'
import { ContractChat } from '@/components/contract/ContractChat'
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

  // 분석 전 상태
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-blue-100 rounded-full mx-auto"></div>
          </div>
          <p className="text-gray-700 font-medium">계약 조항 분석 중...</p>
          <p className="text-sm text-gray-500 mt-2">근로시간/보수/수습/스톡옵션 항목별로 조항을 분석하는 중입니다…</p>
        </div>
      </div>
    )
  }

  // 에러 상태
  if (error || !analysisResult) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">분석 결과를 불러올 수 없습니다</h2>
          <p className="text-slate-600 mb-4">{error || '알 수 없는 오류가 발생했습니다.'}</p>
        </div>
      </div>
    )
  }

  // 분석 완료 상태 - 2-컬럼 레이아웃
  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* 상단 배너 */}
      {analysisResult.totalIssues > 0 ? (
        <div className="bg-blue-50 border-b border-blue-200 px-4 sm:px-6 py-2 sm:py-3">
          <p className="text-xs sm:text-sm text-blue-900">
            총 <strong>{analysisResult.totalIssues}개</strong>의 위험 또는 주의가 필요한 조항을 발견했습니다.
          </p>
        </div>
      ) : (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 sm:px-6 py-2 sm:py-3">
          <p className="text-xs sm:text-sm text-yellow-900">
            분석된 위험 조항이 없습니다. 계약서를 다시 확인하거나 다른 계약서를 업로드해보세요.
          </p>
        </div>
      )}

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 상단: 2-컬럼 레이아웃 (계약서 + 분석 결과) */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden border-b border-slate-200">
          {/* 왼쪽: 계약서 뷰어 */}
          <div className="w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-slate-200 flex-shrink-0 overflow-hidden">
            <ContractViewer
              contractText={analysisResult.contractText}
              issues={analysisResult.issues}
              selectedIssueId={selectedIssueId}
              onIssueClick={setSelectedIssueId}
            />
          </div>

          {/* 오른쪽: 분석 결과 패널 */}
          <div className="w-full lg:w-1/2 flex-shrink-0 overflow-hidden">
            <AnalysisPanel
              issues={analysisResult.issues}
              totalIssues={analysisResult.totalIssues}
              highRiskCount={analysisResult.highRiskCount}
              mediumRiskCount={analysisResult.mediumRiskCount}
              lowRiskCount={analysisResult.lowRiskCount}
              selectedIssueId={selectedIssueId}
              onIssueSelect={setSelectedIssueId}
              onAskAboutIssue={(issueId) => {
                setChatIssueId(issueId)
                setSelectedIssueId(issueId)
                setIsChatOpen(true) // 채팅 열기
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

        {/* 하단: 채팅 UI (접기/펼치기 가능) */}
        <div className="border-t border-slate-200 bg-white">
          {/* 채팅 토글 버튼 */}
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-slate-900">AI 법률 상담</span>
              <span className="text-xs text-slate-500">
                위험 조항에 대해 구체적으로 질문하세요
              </span>
            </div>
            {isChatOpen ? (
              <ChevronUp className="w-5 h-5 text-slate-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-500" />
            )}
          </button>

          {/* 채팅 컨텐츠 (접기/펼치기) */}
          {isChatOpen && (
            <div 
              id="contract-chat" 
              className="h-[400px] lg:h-[450px] overflow-hidden flex flex-col border-t border-slate-200"
            >
              <ContractChat
                docId={docId}
                analysisResult={analysisResult}
                selectedIssueId={chatIssueId || selectedIssueId}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
