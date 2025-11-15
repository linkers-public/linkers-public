'use client'

import React, { useEffect, useRef } from 'react'
import type { LegalIssue } from '@/types/legal'

interface ContractViewerProps {
  contractText: string
  issues: LegalIssue[]
  selectedIssueId?: string
  onIssueClick?: (issueId: string) => void
}

export function ContractViewer({
  contractText,
  issues,
  selectedIssueId,
  onIssueClick,
}: ContractViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const highlightedRefs = useRef<Map<string, HTMLSpanElement>>(new Map())

  // 텍스트를 문단 단위로 분리 (줄바꿈 2개 이상 또는 빈 줄 기준)
  // 줄바꿈 정보를 보존하기 위해 trim() 대신 끝부분의 연속 줄바꿈만 제거
  const paragraphMatches = contractText.match(/(.+?)(\n\s*\n+|$)/gs) || []
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

  // 텍스트에 하이라이트 적용
  const renderTextWithHighlights = (text: string, paragraphIndex: number) => {
    const paragraphStart = paragraphStarts[paragraphIndex] ?? 0
    // 문단의 실제 끝 위치 계산 (원본 텍스트 기준)
    const paragraphEnd = paragraphStart + text.length

    // 이 문단과 겹치는 이슈 찾기 (경계를 넘어가는 경우도 포함)
    const paragraphIssues = sortedIssues.filter(issue => {
      const start = issue.location.startIndex ?? 0
      const end = issue.location.endIndex ?? start + (issue.originalText?.length ?? 0)
      // 겹치는 경우: 이슈가 문단 범위와 겹치면 포함
      return (start < paragraphEnd && end > paragraphStart)
    })

    if (paragraphIssues.length === 0) {
      // 줄바꿈을 보존하기 위해 whitespace-pre-line 사용
      return <p className="mb-5 leading-loose text-base text-slate-800 whitespace-pre-line">{text}</p>
    }

    // 하이라이트 적용
    let lastIndex = 0
    const elements: React.ReactNode[] = []
    const sortedParagraphIssues = paragraphIssues.sort(
      (a, b) => (a.location.startIndex ?? 0) - (b.location.startIndex ?? 0)
    )

    sortedParagraphIssues.forEach((issue, idx) => {
      const issueStart = issue.location.startIndex ?? 0
      const issueEnd = issue.location.endIndex ?? issueStart + (issue.originalText?.length ?? 0)
      
      // 문단 내 상대 위치 계산
      const relativeStart = Math.max(0, issueStart - paragraphStart)
      const relativeEnd = Math.min(text.length, issueEnd - paragraphStart)
      const isSelected = issue.id === selectedIssueId

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

      // 하이라이트된 이슈 텍스트 (줄바꿈 포함)
      const issueText = text.substring(relativeStart, relativeEnd)
      const issueTextParts = issueText.split('\n')
      const severityClass = issue.severity === 'high' 
        ? 'bg-red-100/60 border-b-2 border-red-400 text-red-900 font-medium' 
        : issue.severity === 'medium'
        ? 'bg-yellow-100/60 border-b-2 border-yellow-400 text-yellow-900'
        : 'bg-orange-100/60 border-b-2 border-orange-400 text-orange-900'

      const selectedClass = isSelected 
        ? 'bg-red-200/80 border-l-4 border-red-600 pl-3 shadow-sm' 
        : ''

      // 이슈 텍스트를 줄바꿈 단위로 분리하여 렌더링
      issueTextParts.forEach((part, partIdx) => {
        if (partIdx > 0) {
          elements.push(<br key={`br-issue-${issue.id}-${partIdx}`} />)
        }
        if (part.length > 0) {
          elements.push(
            <span
              key={`issue-${issue.id}-${partIdx}`}
              ref={partIdx === 0 ? (el) => {
                if (el) {
                  highlightedRefs.current.set(issue.id, el)
                } else {
                  highlightedRefs.current.delete(issue.id)
                }
              } : undefined}
              className={`risk-highlight ${severityClass} ${selectedClass} cursor-pointer hover:bg-opacity-90 transition-all duration-200 px-1 py-0.5 rounded-sm`}
              onClick={() => onIssueClick?.(issue.id)}
              title={`${getCategoryLabel(issue.category)} 관련 위험 (위험도: ${getSeverityLabel(issue.severity)}) - 자세히 보려면 클릭`}
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
      className="h-full overflow-y-auto bg-slate-50/50 p-6 sm:p-8"
      role="article"
      aria-label="계약서 전문"
    >
      <div className="max-w-4xl mx-auto">
        <div className="sticky top-0 bg-slate-50/95 backdrop-blur-sm z-10 pb-4 mb-6 border-b border-slate-200">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">계약서 전문</h2>
          <p className="text-sm text-slate-600 mt-1">위험 조항은 색상으로 표시됩니다</p>
        </div>
        {paragraphs.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <p className="text-lg">계약서 내용이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-7 bg-white rounded-lg p-6 sm:p-8 shadow-sm">
            {paragraphs.map((paragraph, index) => {
              const clauseNumber = detectClauseNumber(paragraph.trim())
              return (
                <div key={index} className="relative">
                  {clauseNumber && (
                    <div className="flex items-start gap-3 mb-2">
                      <span className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-700 font-bold text-lg rounded-lg border-2 border-blue-200">
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

