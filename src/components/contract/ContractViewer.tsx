'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { FileText, AlertTriangle, Clock, DollarSign, Briefcase, Scale, BookOpen, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SEVERITY_COLORS, SEVERITY_LABELS_SHORT, FOCUS_STYLE } from './contract-design-tokens'
import type { LegalIssue } from '@/types/legal'

interface HighlightedText {
  text: string
  startIndex: number
  endIndex: number
  severity: 'low' | 'medium' | 'high'
  issueId: string
}

interface Clause {
  id: string
  number: number
  title: string
  content: string
  startIndex: number
  endIndex: number
  maxSeverity?: 'low' | 'medium' | 'high'
  issueCount: number
  issues: LegalIssue[]
  category?: string
}

interface ContractViewerProps {
  contractText: string
  issues: LegalIssue[]
  selectedIssueId?: string
  onIssueClick?: (issueId: string) => void
  highlightedTexts?: HighlightedText[]
  clauses?: Array<{
    id: string
    title: string
    content: string
    articleNumber?: number
    category?: string
  }>
}

export function ContractViewer({
  contractText,
  issues,
  selectedIssueId,
  onIssueClick,
  highlightedTexts = [],
  clauses: clausesProp = [],
}: ContractViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const highlightedRefs = useRef<Map<string, HTMLSpanElement>>(new Map())
  const clauseRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const [currentHoveredIssue, setCurrentHoveredIssue] = useState<LegalIssue | null>(null)
  const [selectedClauseNumber, setSelectedClauseNumber] = useState<number | null>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [tooltipPosition, setTooltipPosition] = useState<{ x: number; y: number } | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const hideTooltipTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 조항 파싱 및 이슈 매핑
  const parsedClauses = useMemo(() => {
    if (!contractText) return []

    // clauses prop이 있으면 사용, 없으면 텍스트에서 파싱
    if (clausesProp.length > 0) {
      return clausesProp.map((clause, idx) => {
        const clauseNumber = clause.articleNumber || idx + 1
        const clauseIssues = issues.filter(issue => {
          const issueClauseNum = issue.location.clauseNumber
          return issueClauseNum === clauseNumber.toString() || issueClauseNum === clause.articleNumber?.toString()
        })

        const severities = clauseIssues.map(i => i.severity)
        const maxSeverity = severities.includes('high') ? 'high' :
                           severities.includes('medium') ? 'medium' :
                           severities.includes('low') ? 'low' : undefined

        return {
          id: clause.id,
          number: clauseNumber,
          title: clause.title || `제${clauseNumber}조`,
          content: clause.content,
          startIndex: 0, // TODO: 실제 위치 계산
          endIndex: clause.content.length,
          maxSeverity,
          issueCount: clauseIssues.length,
          issues: clauseIssues,
          category: clause.category,
        } as Clause
      })
    }

    // 텍스트에서 조항 파싱
    const clauseMatches = contractText.matchAll(/제\s*(\d+)\s*조[^\n]*\n([\s\S]*?)(?=제\s*\d+\s*조|$)/g)
    const parsed: Clause[] = []
    let lastIndex = 0

    for (const match of clauseMatches) {
      const clauseNumber = parseInt(match[1])
      const clauseText = match[0]
      const startIndex = match.index || lastIndex
      const endIndex = startIndex + clauseText.length

      const clauseIssues = issues.filter(issue => {
        const issueStart = issue.location.startIndex ?? 0
        return issueStart >= startIndex && issueStart < endIndex
      })

      const severities = clauseIssues.map(i => i.severity)
      const maxSeverity = severities.includes('high') ? 'high' :
                         severities.includes('medium') ? 'medium' :
                         severities.includes('low') ? 'low' : undefined

      // 조항 제목 추출
      const titleMatch = clauseText.match(/제\s*\d+\s*조[^\n]*/)
      const title = titleMatch ? titleMatch[0].trim() : `제${clauseNumber}조`

      parsed.push({
        id: `clause-${clauseNumber}`,
        number: clauseNumber,
        title,
        content: clauseText,
        startIndex,
        endIndex,
        maxSeverity,
        issueCount: clauseIssues.length,
        issues: clauseIssues,
      })

      lastIndex = endIndex
    }

    return parsed
  }, [contractText, issues, clausesProp])

  // 카테고리 아이콘
  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      working_hours: <Clock className="w-3 h-3" />,
      wage: <DollarSign className="w-3 h-3" />,
      probation: <Briefcase className="w-3 h-3" />,
      stock_option: <Scale className="w-3 h-3" />,
      ip: <BookOpen className="w-3 h-3" />,
      harassment: <AlertTriangle className="w-3 h-3" />,
      other: <FileText className="w-3 h-3" />,
    }
    return icons[category] || <FileText className="w-3 h-3" />
  }

  // 카테고리 한글 라벨
  const getCategoryLabel = (category: string): string => {
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

  // 위험도 라벨
  const getSeverityLabel = (severity: string): string => {
    const labels: Record<string, string> = {
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    }
    return labels[severity] || severity
  }

  // 툴팁 위치 계산
  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>, issue: LegalIssue) => {
    // 이전 타임아웃이 있으면 취소
    if (hideTooltipTimeoutRef.current) {
      clearTimeout(hideTooltipTimeoutRef.current)
      hideTooltipTimeoutRef.current = null
    }
    
    const rect = e.currentTarget.getBoundingClientRect()
    const container = containerRef.current
    if (!container) return
    
    const tooltipWidth = 280 // 툴팁 너비
    const margin = 16 // 여유 공간 (양쪽 마진)
    
    // 부모 컨테이너 찾기 (계약서 텍스트 영역)
    const textContainer = e.currentTarget.closest('.flex-1.space-y-4.relative') as HTMLElement
    if (!textContainer) return
    
    const textContainerRect = textContainer.getBoundingClientRect()
    const scrollTop = container.scrollTop
    const scrollLeft = container.scrollLeft
    
    // 화면 기준 공간 확인
    const spaceOnRight = window.innerWidth - rect.right
    const spaceOnLeft = rect.left
    
    // 텍스트 컨테이너 기준 상대 위치 계산 (스크롤 오프셋 포함)
    let x = rect.right - textContainerRect.left + scrollLeft + 12 // 오른쪽에 12px 간격
    let y = rect.top - textContainerRect.top + scrollTop
    
    // 오른쪽 공간이 부족하면 왼쪽에 표시
    if (spaceOnRight < tooltipWidth + margin) {
      x = rect.left - textContainerRect.left + scrollLeft - tooltipWidth - 12
    }
    
    // 컨테이너 경계 내에서 조정 (양쪽 마진 확보)
    const minX = margin
    const maxX = textContainerRect.width - tooltipWidth - margin
    
    if (x < minX) {
      x = minX
    } else if (x > maxX) {
      x = maxX
    }
    
    // 위쪽으로 넘어가지 않도록 조정
    if (y < scrollTop + margin) {
      y = scrollTop + margin
    }
    
    setTooltipPosition({ x, y })
    setCurrentHoveredIssue(issue)
  }

  const handleMouseLeave = () => {
    // 툴팁을 즉시 숨기지 않고 약간의 지연을 추가하여 툴팁으로 마우스를 이동할 시간을 줌
    if (hideTooltipTimeoutRef.current) {
      clearTimeout(hideTooltipTimeoutRef.current)
    }
    hideTooltipTimeoutRef.current = setTimeout(() => {
      setCurrentHoveredIssue(null)
      setTooltipPosition(null)
      hideTooltipTimeoutRef.current = null
    }, 150) // 150ms 지연
  }

  const handleTooltipMouseEnter = () => {
    // 툴팁 위에 마우스가 있으면 숨기지 않음
    if (hideTooltipTimeoutRef.current) {
      clearTimeout(hideTooltipTimeoutRef.current)
      hideTooltipTimeoutRef.current = null
    }
  }

  const handleTooltipMouseLeave = () => {
    // 툴팁에서 마우스가 벗어나면 숨김
    if (hideTooltipTimeoutRef.current) {
      clearTimeout(hideTooltipTimeoutRef.current)
    }
    hideTooltipTimeoutRef.current = setTimeout(() => {
      setCurrentHoveredIssue(null)
      setTooltipPosition(null)
      hideTooltipTimeoutRef.current = null
    }, 100) // 100ms 지연
  }

  // 하이라이트된 텍스트 렌더링 (태그 + 아이콘 포함)
  const renderHighlightedText = (text: string, issue: LegalIssue, isSelected: boolean) => {
    return (
      <span className="relative inline-block group">
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium mr-1.5 align-middle transition-all",
            SEVERITY_COLORS[issue.severity].badge,
          )}
        >
          {getCategoryIcon(issue.category)}
          <span>{getCategoryLabel(issue.category)}</span>
          <span className="opacity-60">·</span>
          <span>{getSeverityLabel(issue.severity)}</span>
        </span>
        <span
          className={cn(
            "inline-block transition-all rounded-sm px-0.5 py-0.5",
            FOCUS_STYLE,
            "highlight interactive",
            issue.severity === 'high' && `highlight-severity-high ${SEVERITY_COLORS.high.bg}/70 hover:${SEVERITY_COLORS.high.bgHover} underline decoration-red-500 decoration-2 underline-offset-2 font-medium`,
            issue.severity === 'medium' && `highlight-severity-medium ${SEVERITY_COLORS.medium.bg}/60 hover:${SEVERITY_COLORS.medium.bgHover} underline decoration-amber-500 decoration-2 underline-offset-2`,
            issue.severity === 'low' && `highlight-severity-low ${SEVERITY_COLORS.low.bg}/50 hover:${SEVERITY_COLORS.low.bgHover} underline decoration-green-500 decoration-2 underline-offset-2`,
            isSelected && "ring-2 ring-blue-500 ring-offset-2 shadow-lg scale-105"
          )}
          onMouseEnter={(e) => handleMouseEnter(e, issue)}
          onMouseLeave={handleMouseLeave}
          role="button"
          tabIndex={0}
          aria-label={`${getCategoryLabel(issue.category)} 위험 조항, 위험도: ${getSeverityLabel(issue.severity)}, 클릭하여 상세 정보 보기`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onIssueClick?.(issue.id)
            }
          }}
        >
          {text}
        </span>
      </span>
    )
  }

  // 조항으로 스크롤
  const scrollToClause = (clauseNumber: number) => {
    const element = clauseRefs.current.get(clauseNumber)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setSelectedClauseNumber(clauseNumber)
      setTimeout(() => setSelectedClauseNumber(null), 2000)
    }
  }

  // 선택된 이슈로 스크롤
  useEffect(() => {
    if (selectedIssueId) {
      const timeoutId = setTimeout(() => {
        const element = highlightedRefs.current.get(selectedIssueId)
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center',
            inline: 'nearest'
          })
          // 선택된 이슈의 조항으로도 스크롤
          const issue = issues.find(i => i.id === selectedIssueId)
          if (issue?.location.clauseNumber) {
            const clauseNum = parseInt(issue.location.clauseNumber)
            scrollToClause(clauseNum)
          }
        }
      }, 100)
      return () => clearTimeout(timeoutId)
    }
  }, [selectedIssueId, issues])

  // 스크롤 진행률 계산 및 툴팁 위치 업데이트
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return
      const container = containerRef.current
      const scrollTop = container.scrollTop
      const scrollHeight = container.scrollHeight - container.clientHeight
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0
      setScrollProgress(progress)
      
      // 스크롤 시 툴팁 숨기기 (위치 계산이 복잡하므로)
      if (tooltipPosition) {
        if (hideTooltipTimeoutRef.current) {
          clearTimeout(hideTooltipTimeoutRef.current)
        }
        setTooltipPosition(null)
        setCurrentHoveredIssue(null)
        hideTooltipTimeoutRef.current = null
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('scroll', handleScroll)
      handleScroll() // 초기값 설정
      return () => container.removeEventListener('scroll', handleScroll)
    }
  }, [contractText, tooltipPosition])

  // 컴포넌트 언마운트 시 타임아웃 정리
  useEffect(() => {
    return () => {
      if (hideTooltipTimeoutRef.current) {
        clearTimeout(hideTooltipTimeoutRef.current)
      }
    }
  }, [])

  // 조항별 텍스트 렌더링
  const renderClauseContent = (clause: Clause) => {
    const content = clause.content
    const clauseHighlights = [
      ...highlightedTexts.filter(ht => {
        const issue = issues.find(i => i.id === ht.issueId)
        return issue && clause.issues.includes(issue)
      }),
      ...clause.issues.map(issue => ({
        startIndex: issue.location.startIndex ?? 0,
        endIndex: issue.location.endIndex ?? (issue.location.startIndex ?? 0) + (issue.originalText?.length ?? 0),
        severity: issue.severity,
        issueId: issue.id,
        text: issue.originalText || '',
      }))
    ].sort((a, b) => a.startIndex - b.startIndex)

    if (clauseHighlights.length === 0) {
      return <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800">{content}</p>
    }

    let lastIndex = 0
    const elements: React.ReactNode[] = []

    clauseHighlights.forEach((highlight, idx) => {
      const issue = issues.find(i => i.id === highlight.issueId)
      if (!issue) return

      const relativeStart = Math.max(0, highlight.startIndex - clause.startIndex)
      const relativeEnd = Math.min(content.length, highlight.endIndex - clause.startIndex)
      const isSelected = highlight.issueId === selectedIssueId

      // 하이라이트 앞의 텍스트
      if (relativeStart > lastIndex) {
        elements.push(
          <span key={`text-before-${idx}`}>
            {content.substring(lastIndex, relativeStart)}
          </span>
        )
      }

      // 하이라이트된 텍스트
      const highlightText = content.substring(relativeStart, relativeEnd)
      elements.push(
        <span
          key={`highlight-${highlight.issueId}`}
          ref={(el) => {
            if (el) {
              highlightedRefs.current.set(highlight.issueId, el)
            } else {
              highlightedRefs.current.delete(highlight.issueId)
            }
          }}
          onClick={() => onIssueClick?.(highlight.issueId)}
          onMouseEnter={(e) => handleMouseEnter(e, issue)}
          onMouseLeave={handleMouseLeave}
          className={cn(
            "inline-block viewer-chunk cursor-pointer transition-all",
            highlight.severity === 'high' && "highlight-severity-high hover:bg-red-100/50",
            highlight.severity === 'medium' && "highlight-severity-medium hover:bg-amber-100/50",
            highlight.severity === 'low' && "highlight-severity-low hover:bg-green-100/50",
            isSelected && "ring-2 ring-blue-500 ring-offset-1 rounded"
          )}
        >
          {renderHighlightedText(highlightText, issue, isSelected)}
        </span>
      )

      lastIndex = Math.max(lastIndex, relativeEnd)
    })

    // 남은 텍스트
    if (lastIndex < content.length) {
      elements.push(
        <span key="text-end">
          {content.substring(lastIndex)}
        </span>
      )
    }

    return <p className="text-sm leading-relaxed whitespace-pre-wrap text-slate-800">{elements}</p>
  }

  // 요약 통계 계산
  const summaryStats = useMemo(() => {
    const categoryStats: Record<string, { count: number; maxSeverity: 'low' | 'medium' | 'high' | undefined }> = {}
    
    issues.forEach(issue => {
      if (!categoryStats[issue.category]) {
        categoryStats[issue.category] = { count: 0, maxSeverity: undefined }
      }
      categoryStats[issue.category].count++
      const current = categoryStats[issue.category].maxSeverity
      const priority = { high: 3, medium: 2, low: 1 }
      if (!current || priority[issue.severity] > priority[current]) {
        categoryStats[issue.category].maxSeverity = issue.severity
      }
    })

    return categoryStats
  }, [issues])

  // TOP 3 위험 조항
  const topRiskyClauses = useMemo(() => {
    return parsedClauses
      .filter(c => c.issueCount > 0)
      .sort((a, b) => {
        const priority = { high: 3, medium: 2, low: 1, undefined: 0 }
        return priority[b.maxSeverity || 'undefined'] - priority[a.maxSeverity || 'undefined']
      })
      .slice(0, 3)
  }, [parsedClauses])

  return (
    <div className="h-full flex flex-col relative">
      {/* 스크롤 진행률 표시 바 */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-slate-200/50 z-30">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-150"
          style={{ width: `${scrollProgress}%` }}
          aria-hidden="true"
        />
      </div>
      
      <div 
        className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50/80 to-white" 
        ref={containerRef}
        role="main"
        aria-label="계약서 전문 뷰어"
      >
      <div className="w-full max-w-none lg:max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
        {/* 상단 요약 헤더 - 개선된 레이아웃 */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-20 pt-2 sm:pt-3 pb-2 sm:pb-3 mb-3 sm:mb-4 border-b border-slate-200/60 shadow-sm">
          {/* 위험 타임라인 네비게이션 - 개선된 크기와 가시성 */}
          {parsedClauses.length > 0 && (
            <div 
              className="mb-3 flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide"
              role="navigation"
              aria-label="조항 네비게이션"
            >
              {parsedClauses.map(clause => (
                <button
                  key={clause.id}
          onClick={() => scrollToClause(clause.number)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              scrollToClause(clause.number)
            }
          }}
          aria-label={`제${clause.number}조 ${clause.title}로 이동, ${clause.maxSeverity ? getSeverityLabel(clause.maxSeverity) : '안전'} 위험도, 이슈 ${clause.issueCount}건`}
          className={cn(
            "flex flex-col items-center justify-center min-w-[44px] sm:min-w-[52px] px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg transition-all duration-200 cursor-pointer",
            "text-xs sm:text-sm",
            `hover:bg-slate-100 hover:scale-105 active:scale-95 ${FOCUS_STYLE}`,
            selectedClauseNumber === clause.number && "bg-blue-100 ring-2 ring-blue-400 scale-105 shadow-sm"
          )}
                >
                  <span className="mb-1.5 text-xs sm:text-sm text-slate-700 font-semibold whitespace-nowrap">제{clause.number}조</span>
                  <span
                    className={cn(
                      "h-3 w-3 sm:h-3.5 sm:w-3.5 rounded-full transition-transform shadow-sm",
                      clause.maxSeverity === 'high' && SEVERITY_COLORS.high.solid,
                      clause.maxSeverity === 'medium' && SEVERITY_COLORS.medium.solid,
                      clause.maxSeverity === 'low' && SEVERITY_COLORS.low.solid,
                      !clause.maxSeverity && "bg-slate-300"
                    )}
                    aria-hidden="true"
                  />
                  {clause.issueCount > 0 && (
                    <span className="mt-1 text-[9px] sm:text-[10px] text-slate-500 font-medium">
                      {clause.issueCount}건
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* 요약 통계 - 간소화된 레이아웃 */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md flex-shrink-0" aria-hidden="true">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base sm:text-lg lg:text-xl font-bold text-slate-900">계약서 전문</h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5 line-clamp-1">
                  위험 조항은 색상으로 표시됩니다. 하이라이트된 텍스트를 클릭하면 상세 정보를 확인할 수 있습니다.
                </p>
              </div>
            </div>

            {/* 카테고리별 위험도 바 - 컴팩트 버전 */}
            {Object.keys(summaryStats).length > 0 && (
              <div className="flex flex-wrap gap-2 sm:gap-3" role="region" aria-label="카테고리별 위험도 통계">
                {Object.entries(summaryStats).map(([category, stats]) => {
                  return (
                    <div key={category} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-[10px] sm:text-xs text-slate-700 font-medium whitespace-nowrap">{getCategoryLabel(category)}</span>
                      <span className={cn(
                        "text-[10px] sm:text-xs font-bold px-1.5 py-0.5 rounded",
                        stats.maxSeverity === 'high' && "bg-red-100 text-red-700",
                        stats.maxSeverity === 'medium' && "bg-amber-100 text-amber-700",
                        stats.maxSeverity === 'low' && "bg-blue-100 text-blue-700"
                      )}>
                        {stats.count}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* TOP 3 위험 조항 - 접을 수 있는 섹션으로 변경 */}
            {topRiskyClauses.length > 0 && (
              <details className="group" open={false}>
                <summary className="cursor-pointer text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-1.5 list-none">
                  <span>가장 위험한 조항 TOP 3</span>
                  <ChevronRight className="w-3 h-3 text-slate-400 group-open:rotate-90 transition-transform" />
                </summary>
                <div className="mt-2 space-y-1.5" role="region" aria-label="가장 위험한 조항 TOP 3">
                  {topRiskyClauses.map((clause, idx) => (
                    <button
                      key={clause.id}
                      onClick={() => scrollToClause(clause.number)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          scrollToClause(clause.number)
                        }
                      }}
                      aria-label={`${idx + 1}위: 제${clause.number}조 ${clause.title}로 이동`}
                      className={cn("w-full flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer transition-colors rounded px-2 py-1.5 hover:bg-slate-50", FOCUS_STYLE)}
                    >
                      <span className="font-bold text-blue-600">{idx + 1}.</span>
                      <span className="flex-1 text-left truncate">제{clause.number}조 {clause.title}</span>
                      {clause.maxSeverity && (
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0",
                          clause.maxSeverity === 'high' && SEVERITY_COLORS.high.badge,
                          clause.maxSeverity === 'medium' && SEVERITY_COLORS.medium.badge,
                          clause.maxSeverity === 'low' && SEVERITY_COLORS.low.badge
                        )}>
                          {getSeverityLabel(clause.maxSeverity)} {clause.issueCount}건
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </details>
            )}
          </div>
        </div>

        {/* 계약서 본문 */}
        {parsedClauses.length === 0 ? (
          <div className="text-center py-20">
            <div className="p-4 bg-slate-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <FileText className="w-10 h-10 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-600 mb-2">계약서 내용이 없습니다.</p>
            <p className="text-sm text-slate-500">
              {contractText && contractText.trim().length > 0 
                ? '계약서 텍스트는 있지만 파싱할 수 없습니다.' 
                : '계약서 텍스트를 불러올 수 없습니다.'}
            </p>
          </div>
        ) : (
          <div className="relative flex gap-3 lg:gap-4">
            {/* 왼쪽: 리스크 minimap */}
            <div 
              className="w-1 lg:w-1.5 flex-shrink-0 flex flex-col rounded-full overflow-hidden bg-slate-100"
              role="navigation"
              aria-label="위험도 미니맵"
            >
              {parsedClauses.map(clause => {
                const clauseHeight = Math.max(30, (clause.endIndex - clause.startIndex) / 15) // 대략적인 높이 계산
                return (
                  <button
                    key={clause.id}
                    onClick={() => scrollToClause(clause.number)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        scrollToClause(clause.number)
                      }
                    }}
                    aria-label={`제${clause.number}조 ${clause.title}로 이동, ${clause.maxSeverity ? getSeverityLabel(clause.maxSeverity) : '안전'} 위험도, 이슈 ${clause.issueCount}건`}
                    className={cn(
                      "transition-all hover:opacity-100 cursor-pointer group relative rounded",
                      FOCUS_STYLE,
                      clause.maxSeverity === 'high' && `${SEVERITY_COLORS.high.solid}/70 hover:${SEVERITY_COLORS.high.solid}`,
                      clause.maxSeverity === 'medium' && `${SEVERITY_COLORS.medium.solid}/70 hover:${SEVERITY_COLORS.medium.solid}`,
                      clause.maxSeverity === 'low' && `${SEVERITY_COLORS.low.solid}/70 hover:${SEVERITY_COLORS.low.solid}`,
                      !clause.maxSeverity && "bg-slate-300/50 hover:bg-slate-300"
                    )}
                    style={{ minHeight: `${clauseHeight}px` }}
                    title={`제${clause.number}조 ${clause.title} – ${clause.maxSeverity ? getSeverityLabel(clause.maxSeverity) : '안전'} ${clause.issueCount}건`}
                  >
                    <div className="absolute left-full ml-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50 pointer-events-none shadow-lg">
                      제{clause.number}조 {clause.title} – {clause.maxSeverity ? getSeverityLabel(clause.maxSeverity) : '안전'} {clause.issueCount}건
                    </div>
                  </button>
                )
              })}
            </div>

            {/* 중앙: 계약서 텍스트 */}
            <div className="flex-1 space-y-4 relative overflow-visible">
              {/* 호버 툴팁 - 호버한 위치에 표시 */}
              {currentHoveredIssue && tooltipPosition && (
                <div
                  ref={tooltipRef}
                  className="absolute z-50 w-[280px] pointer-events-auto"
                  style={{
                    left: `${tooltipPosition.x}px`,
                    top: `${tooltipPosition.y}px`,
                    maxWidth: 'calc(100% - 24px)', // 양쪽 마진 확보
                  }}
                  role="tooltip"
                  aria-label="위험 조항 상세 정보"
                  onMouseEnter={handleTooltipMouseEnter}
                  onMouseLeave={handleTooltipMouseLeave}
                >
                  <div className="bg-white rounded-lg border-2 border-slate-200 shadow-xl p-3 animate-in fade-in zoom-in-95 duration-200">
                    {/* 툴팁 헤더 */}
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        currentHoveredIssue.severity === 'high' && "bg-red-100",
                        currentHoveredIssue.severity === 'medium' && "bg-amber-100",
                        currentHoveredIssue.severity === 'low' && "bg-blue-100"
                      )}>
                        {getCategoryIcon(currentHoveredIssue.category)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {getCategoryLabel(currentHoveredIssue.category)}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {getSeverityLabel(currentHoveredIssue.severity)} 위험도
                        </div>
                      </div>
                    </div>
                    
                    {/* 요약 */}
                    <div className="mb-2">
                      <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">
                        {currentHoveredIssue.summary}
                      </p>
                    </div>
                    
                    {/* 법적 근거 (있는 경우) */}
                    {currentHoveredIssue.legalBasis && currentHoveredIssue.legalBasis.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-1 mb-1">
                          <BookOpen className="w-3 h-3 text-slate-500" aria-hidden="true" />
                          <span className="text-[10px] font-semibold text-slate-600">관련 법령</span>
                        </div>
                        <div className="space-y-1">
                          {currentHoveredIssue.legalBasis.slice(0, 2).map((basis, idx) => (
                            <div key={idx} className="text-[10px] text-slate-600 line-clamp-2">
                              {basis}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* 클릭 안내 */}
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <p className="text-[10px] text-slate-500 text-center">
                        클릭하여 상세 정보 보기
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {parsedClauses.map(clause => (
                <section
                  key={clause.id}
                  id={`clause-${clause.number}`}
                  ref={(el) => {
                    if (el) {
                      clauseRefs.current.set(clause.number, el)
                    } else {
                      clauseRefs.current.delete(clause.number)
                    }
                  }}
                  className={cn(
                    "mb-6 rounded-lg border bg-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                    "focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-2",
                    clause.maxSeverity === 'high' && `${SEVERITY_COLORS.high.border} ${SEVERITY_COLORS.high.bg}/60`,
                    clause.maxSeverity === 'medium' && `${SEVERITY_COLORS.medium.border} ${SEVERITY_COLORS.medium.bg}/60`,
                    clause.maxSeverity === 'low' && `${SEVERITY_COLORS.low.border} ${SEVERITY_COLORS.low.bg}/30`,
                    !clause.maxSeverity && "border-slate-200",
                    selectedClauseNumber === clause.number && "ring-2 ring-blue-400 ring-offset-2 animate-pulse"
                  )}
                  aria-labelledby={`clause-${clause.number}-header`}
                >
                  {/* 조항 헤더 */}
                  <header 
                    id={`clause-${clause.number}-header`}
                    onClick={() => scrollToClause(clause.number)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 border-b transition-colors cursor-pointer",
                      clause.maxSeverity === 'high' && `${SEVERITY_COLORS.high.bg}/80 ${SEVERITY_COLORS.high.border}`,
                      clause.maxSeverity === 'medium' && `${SEVERITY_COLORS.medium.bg}/80 ${SEVERITY_COLORS.medium.border}`,
                      clause.maxSeverity === 'low' && `${SEVERITY_COLORS.low.bg}/80 ${SEVERITY_COLORS.low.border}`,
                      !clause.maxSeverity && "bg-slate-50/80 border-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "text-base font-bold flex-shrink-0 clause-number clause-number-clickable",
                        clause.maxSeverity === 'high' && SEVERITY_COLORS.high.text,
                        clause.maxSeverity === 'medium' && SEVERITY_COLORS.medium.text,
                        clause.maxSeverity === 'low' && SEVERITY_COLORS.low.text,
                        !clause.maxSeverity && "text-slate-700"
                      )}>
                        제{clause.number}조
                      </div>
                      <div className="text-sm font-semibold text-slate-900 truncate">{clause.title}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs flex-shrink-0">
                      {clause.maxSeverity && (
                        <span 
                          className={cn(
                            "px-2 py-1 rounded-full font-semibold",
                            clause.maxSeverity === 'high' && SEVERITY_COLORS.high.badge,
                            clause.maxSeverity === 'medium' && SEVERITY_COLORS.medium.badge,
                            clause.maxSeverity === 'low' && SEVERITY_COLORS.low.badge
                          )}
                          aria-label={`위험도: ${getSeverityLabel(clause.maxSeverity)}`}
                        >
                          {getSeverityLabel(clause.maxSeverity)}
                        </span>
                      )}
                      {clause.issueCount > 0 && (
                        <span 
                          className="rounded-full bg-slate-100 px-2 py-1 text-slate-700 font-medium"
                          aria-label={`이슈 ${clause.issueCount}건`}
                        >
                          이슈 {clause.issueCount}건
                        </span>
                      )}
                    </div>
                  </header>

                  {/* 조항 내용 */}
                  <div className="px-4 py-4">
                    {renderClauseContent(clause)}
                  </div>
                </section>
              ))}
            </div>

          </div>
        )}
      </div>

      </div>
      
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}
