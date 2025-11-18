'use client'

import React, { useEffect, useRef } from 'react'
import { FileText } from 'lucide-react'
import type { LegalIssue } from '@/types/legal'

interface HighlightedText {
  text: string
  startIndex: number
  endIndex: number
  severity: 'low' | 'medium' | 'high'
  issueId: string
}

interface ContractViewerProps {
  contractText: string
  issues: LegalIssue[]
  selectedIssueId?: string
  onIssueClick?: (issueId: string) => void
  highlightedTexts?: HighlightedText[]  // ✨ 추가
}

export function ContractViewer({
  contractText,
  issues,
  selectedIssueId,
  onIssueClick,
  highlightedTexts = [],  // ✨ 추가
}: ContractViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const highlightedRefs = useRef<Map<string, HTMLSpanElement>>(new Map())

  // 디버깅: contractText 확인
  useEffect(() => {
    console.log('[ContractViewer] contractText 확인:', {
      length: contractText?.length || 0,
      isEmpty: !contractText || contractText.trim().length === 0,
      preview: contractText?.substring(0, 100) || '(없음)'
    })
  }, [contractText])

  // 텍스트를 문단 단위로 분리 (줄바꿈 2개 이상 또는 빈 줄 기준)
  // 줄바꿈 정보를 보존하기 위해 trim() 대신 끝부분의 연속 줄바꿈만 제거
  const paragraphMatches = contractText?.match(/(.+?)(\n\s*\n+|$)/gs) || []
  const paragraphs = paragraphMatches
    .map(p => p.replace(/\n\s*\n+$/, '')) // 끝부분의 연속 줄바꿈만 제거
    .filter(p => p.trim().length > 0) // 빈 문단만 필터링
  
  // 원본 텍스트에서 각 문단의 시작 위치 계산
  const paragraphStarts: number[] = []
  let currentPos = 0
  for (const match of paragraphMatches) {
    paragraphStarts.push(currentPos)
    currentPos += match.length
  }

  // 이슈를 텍스트 위치 기준으로 정렬
  const sortedIssues = [...issues].sort((a, b) => {
    const aIndex = a.location.startIndex ?? 0
    const bIndex = b.location.startIndex ?? 0
    return aIndex - bIndex
  })
  
  // highlightedTexts와 issues를 병합하여 하이라이트 정보 생성
  const allHighlights = [
    ...highlightedTexts.map(ht => ({
      startIndex: ht.startIndex,
      endIndex: ht.endIndex,
      severity: ht.severity,
      issueId: ht.issueId,
      text: ht.text,
    })),
    ...sortedIssues.map(issue => ({
      startIndex: issue.location.startIndex ?? 0,
      endIndex: issue.location.endIndex ?? (issue.location.startIndex ?? 0) + (issue.originalText?.length ?? 0),
      severity: issue.severity,
      issueId: issue.id,
      text: issue.originalText || '',
    })),
  ].sort((a, b) => a.startIndex - b.startIndex)
  
  // 중복 제거 (같은 위치의 하이라이트는 하나만)
  const uniqueHighlights = allHighlights.reduce((acc, highlight) => {
    const existing = acc.find(h => 
      h.startIndex === highlight.startIndex && 
      h.endIndex === highlight.endIndex
    )
    if (!existing) {
      acc.push(highlight)
    } else {
      // severity가 더 높으면 교체
      const severityPriority = { high: 3, medium: 2, low: 1 }
      if (severityPriority[highlight.severity] > severityPriority[existing.severity]) {
        const index = acc.indexOf(existing)
        acc[index] = highlight
      }
    }
    return acc
  }, [] as typeof allHighlights)

  // 텍스트에 하이라이트 적용
  const renderTextWithHighlights = (text: string, paragraphIndex: number) => {
    const paragraphStart = paragraphStarts[paragraphIndex] ?? 0
    // 문단의 실제 끝 위치 계산 (원본 텍스트 기준)
    const paragraphEnd = paragraphStart + text.length

    // 이 문단과 겹치는 하이라이트 찾기 (경계를 넘어가는 경우도 포함)
    const paragraphHighlights = uniqueHighlights.filter(highlight => {
      const start = highlight.startIndex
      const end = highlight.endIndex
      // 겹치는 경우: 하이라이트가 문단 범위와 겹치면 포함
      return (start < paragraphEnd && end > paragraphStart)
    })

    if (paragraphHighlights.length === 0) {
      // 줄바꿈을 보존하기 위해 whitespace-pre-line 사용
      return <p className="mb-5 leading-loose text-base text-slate-800 whitespace-pre-line">{text}</p>
    }

    // 하이라이트 적용
    let lastIndex = 0
    const elements: React.ReactNode[] = []
    const sortedParagraphHighlights = paragraphHighlights.sort(
      (a, b) => a.startIndex - b.startIndex
    )

    sortedParagraphHighlights.forEach((highlight, idx) => {
      const issueStart = highlight.startIndex
      const issueEnd = highlight.endIndex
      
      // 문단 내 상대 위치 계산
      const relativeStart = Math.max(0, issueStart - paragraphStart)
      const relativeEnd = Math.min(text.length, issueEnd - paragraphStart)
      const isSelected = highlight.issueId === selectedIssueId

      // 이슈 앞의 텍스트 (줄바꿈 보존)
      if (relativeStart > lastIndex) {
        const beforeText = text.substring(lastIndex, relativeStart)
        // 줄바꿈을 <br />로 변환
        const beforeTextParts = beforeText.split('\n')
        beforeTextParts.forEach((part, partIdx) => {
          if (partIdx > 0) {
            elements.push(<br key={`br-before-${idx}-${partIdx}`} />)
          }
          if (part.length > 0) {
            elements.push(
              <span key={`text-${idx}-${partIdx}`}>
                {part}
              </span>
            )
          }
        })
      }

      // 하이라이트된 텍스트 (줄바꿈 포함)
      const highlightText = text.substring(relativeStart, relativeEnd)
      const highlightTextParts = highlightText.split('\n')
      
      // 위험도별 색상 통일
      const severityClass = highlight.severity === 'high' 
        ? 'bg-red-50 border-l-4 border-red-400 pl-2 text-red-900 font-medium underline decoration-red-400' 
        : highlight.severity === 'medium'
        ? 'bg-amber-50 border-l-4 border-amber-400 pl-2 text-amber-900 border-b border-amber-400'
        : 'bg-sky-50 border-l-4 border-sky-400 pl-2 text-sky-900'

      const selectedClass = isSelected 
        ? 'ring-2 ring-red-400 ring-offset-2 shadow-lg animate-pulse' 
        : ''

      // 하이라이트 텍스트를 줄바꿈 단위로 분리하여 렌더링
      highlightTextParts.forEach((part, partIdx) => {
        if (partIdx > 0) {
          elements.push(<br key={`br-highlight-${highlight.issueId}-${partIdx}`} />)
        }
        if (part.length > 0) {
          elements.push(
            <span
              key={`highlight-${highlight.issueId}-${partIdx}`}
              ref={partIdx === 0 ? (el) => {
                if (el) {
                  highlightedRefs.current.set(highlight.issueId, el)
                } else {
                  highlightedRefs.current.delete(highlight.issueId)
                }
              } : undefined}
              role="button"
              tabIndex={0}
              aria-label={`위험 조항, 위험도: ${getSeverityLabel(highlight.severity)}`}
              className={`risk-highlight ${severityClass} ${selectedClass} cursor-pointer hover:bg-opacity-90 transition-all duration-200 px-1 py-0.5 rounded-sm relative group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
              onClick={() => onIssueClick?.(highlight.issueId)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onIssueClick?.(highlight.issueId)
                }
              }}
              title={`위험 조항 (위험도: ${getSeverityLabel(highlight.severity)}) - 자세히 보려면 클릭`}
            >
              {part}
            </span>
          )
        }
      })

      lastIndex = Math.max(lastIndex, relativeEnd)
    })

    // 남은 텍스트 (줄바꿈 보존)
    if (lastIndex < text.length) {
      const afterText = text.substring(lastIndex)
      const afterTextParts = afterText.split('\n')
      afterTextParts.forEach((part, partIdx) => {
        if (partIdx > 0) {
          elements.push(<br key={`br-end-${partIdx}`} />)
        }
        if (part.length > 0) {
          elements.push(
            <span key={`text-end-${partIdx}`}>
              {part}
            </span>
          )
        }
      })
    }

    return <p className="mb-5 leading-loose text-base text-slate-800">{elements}</p>
  }

  // 선택된 이슈로 스크롤
  useEffect(() => {
    if (selectedIssueId) {
      // 약간의 지연을 두어 DOM이 완전히 렌더링된 후 스크롤
      const timeoutId = setTimeout(() => {
        const element = highlightedRefs.current.get(selectedIssueId)
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          })
        } else {
          console.warn('선택된 이슈를 찾을 수 없습니다:', selectedIssueId)
        }
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [selectedIssueId])

  // 조항 번호 감지 함수
  const detectClauseNumber = (text: string): string | null => {
    const clauseMatch = text.match(/^제\s*(\d+)\s*조/)
    if (clauseMatch) {
      return clauseMatch[1]
    }
    // 다른 패턴도 시도
    const altMatch = text.match(/^(\d+)\s*[\.\)]\s*조/)
    if (altMatch) {
      return altMatch[1]
    }
    return null
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto bg-gradient-to-b from-slate-50/80 to-white px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8"
      role="article"
      aria-label="계약서 전문"
      aria-live="polite"
    >
      <div className="w-full max-w-none lg:max-w-5xl mx-auto">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 pt-3 pb-3 mb-4 border-b border-slate-200/60">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md flex-shrink-0">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900">계약서 전문</h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">위험 조항은 색상으로 표시됩니다</p>
            </div>
          </div>
        </div>
        {paragraphs.length === 0 ? (
          <div className="text-center py-20">
            <div className="p-4 bg-slate-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <FileText className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-600 mb-2">계약서 내용이 없습니다.</p>
            <p className="text-sm text-slate-500">
              {contractText && contractText.trim().length > 0 
                ? '계약서 텍스트는 있지만 파싱할 수 없습니다.' 
                : '계약서 텍스트를 불러올 수 없습니다. 계약서를 다시 업로드해주세요.'}
            </p>
            {contractText && contractText.trim().length > 0 && (
              <div className="mt-4 p-4 bg-slate-50 rounded-lg max-w-2xl mx-auto">
                <p className="text-xs text-slate-600 mb-2">원본 텍스트 (처음 500자):</p>
                <pre className="text-xs text-slate-700 whitespace-pre-wrap break-words">
                  {contractText.substring(0, 500)}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-7 bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-slate-100">
            {paragraphs.map((paragraph, index) => {
              const clauseNumber = detectClauseNumber(paragraph.trim())
              return (
                <div key={index} className="relative">
                  {clauseNumber && (
                    <div className="flex items-start gap-4 mb-3">
                      <span className="flex-shrink-0 w-14 h-14 flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg rounded-xl shadow-md ring-2 ring-blue-100">
                        {clauseNumber}
                      </span>
                      <div className="flex-1 pt-1">
                        {renderTextWithHighlights(paragraph, index)}
                      </div>
                    </div>
                  )}
                  {!clauseNumber && (
                    <div>
                      {renderTextWithHighlights(paragraph, index)}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    working_hours: '근로시간',
    wage: '보수·수당',
    probation: '수습·해지',
    stock_option: '스톡옵션',
    ip: 'IP/저작권',
    harassment: '직장내괴롭힘',
    other: '기타',
  }
  return labels[category] || category
}

function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    high: '높음',
    medium: '보통',
    low: '낮음',
  }
  return labels[severity] || severity
}

