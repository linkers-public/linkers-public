'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Filter, AlertTriangle, CheckCircle2, FileText, BookOpen, Scale, Calendar, BarChart3, TrendingUp, Shield, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AnalysisIssueCard } from './AnalysisIssueCard'
import { AmendmentModal } from './AmendmentModal'
import { ClauseList } from './ClauseList'
import { cn } from '@/lib/utils'
import { SEVERITY_COLORS, SEVERITY_LABELS, getSeverityFromScore, FOCUS_STYLE } from './contract-design-tokens'
import type { LegalIssue, LegalCategory, Severity } from '@/types/legal'
import { ChevronDown } from 'lucide-react'

interface Clause {
  id: string
  title: string
  content: string
  articleNumber?: number
  category?: string
}

interface AnalysisPanelProps {
  issues: LegalIssue[]
  totalIssues: number
  highRiskCount: number
  mediumRiskCount: number
  lowRiskCount: number
  selectedIssueId?: string
  onIssueSelect: (issueId: string) => void
  onAskAboutIssue?: (issueId: string, prefilledText?: string) => void
  onCategoryClick?: (category: LegalCategory) => void
  riskScore?: number
  contractText?: string
  clauses?: Clause[]
  selectedClauseId?: string
  onClauseClick?: (clauseId: string) => void
  // 새로운 독소조항 탐지 필드
  oneLineSummary?: string
  riskTrafficLight?: string
  top3ActionPoints?: string[]
  riskSummaryTable?: Array<{
    item: string
    riskLevel: 'low' | 'medium' | 'high'
    problemPoint: string
    simpleExplanation: string
    revisionKeyword: string
  }>
  toxicClauses?: Array<{
    clauseLocation: string
    contentSummary: string
    whyRisky: string
    realWorldProblems: string
    suggestedRevisionLight: string
    suggestedRevisionFormal: string
  }>
  negotiationQuestions?: string[]
}

export function AnalysisPanel({
  issues,
  totalIssues,
  highRiskCount,
  mediumRiskCount,
  lowRiskCount,
  selectedIssueId,
  onIssueSelect,
  onAskAboutIssue,
  onCategoryClick,
  riskScore = 0,
  contractText = '',
  clauses = [],
  selectedClauseId,
  onClauseClick,
  oneLineSummary,
  riskTrafficLight,
  top3ActionPoints = [],
  riskSummaryTable = [],
  toxicClauses = [],
  negotiationQuestions = [],
}: AnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState('summary')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<Set<LegalCategory>>(new Set())
  const [selectedSeverities, setSelectedSeverities] = useState<Set<Severity>>(new Set())
  const [sortBy, setSortBy] = useState<'severity' | 'order'>('severity')
  const [amendmentIssueId, setAmendmentIssueId] = useState<string | null>(null)
  
  // 선택된 이슈로 스크롤
  const selectedIssueRef = React.useRef<HTMLDivElement>(null)
  
  React.useEffect(() => {
    if (selectedIssueId && selectedIssueRef.current) {
      selectedIssueRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [selectedIssueId])

  // 카테고리 클릭 시 조항별 탭으로 전환
  useEffect(() => {
    if (onCategoryClick && activeTab !== 'issues') {
      // 카테고리 클릭은 외부에서 처리
    }
  }, [activeTab, onCategoryClick])

  const categories: LegalCategory[] = [
    'working_hours',
    'wage',
    'probation',
    'stock_option',
    'ip',
    'harassment',
    'other',
  ]

  const categoryLabels: Record<LegalCategory, string> = {
    working_hours: '근로시간·휴게',
    wage: '보수·수당',
    probation: '수습·해지',
    stock_option: '스톡옵션',
    ip: 'IP/저작권',
    harassment: '직장내괴롭힘',
    other: '기타',
  }

  // 카테고리별 이슈 그룹화
  const issuesByCategory = useMemo(() => {
    const grouped: Record<LegalCategory, LegalIssue[]> = {
      working_hours: [],
      wage: [],
      probation: [],
      stock_option: [],
      ip: [],
      harassment: [],
      other: [],
    }
    issues.forEach(issue => {
      // 카테고리가 정의된 키에 있는지 확인, 없으면 'other'에 추가
      const validCategories: LegalCategory[] = ['working_hours', 'wage', 'probation', 'stock_option', 'ip', 'harassment', 'other']
      const category: LegalCategory = validCategories.includes(issue.category) ? issue.category : 'other'
      grouped[category].push(issue)
    })
    return grouped
  }, [issues])

  // 필터링 및 정렬
  const filteredAndSortedIssues = useMemo(() => {
    let filtered = issues

    // 카테고리 필터
    if (selectedCategories.size > 0) {
      filtered = filtered.filter(issue => selectedCategories.has(issue.category))
    }

    // 위험도 필터
    if (selectedSeverities.size > 0) {
      filtered = filtered.filter(issue => selectedSeverities.has(issue.severity))
    }

    // 정렬
    if (sortBy === 'severity') {
      const severityOrder = { high: 3, medium: 2, low: 1 }
      filtered = [...filtered].sort(
        (a, b) => severityOrder[b.severity] - severityOrder[a.severity]
      )
    } else {
      // 계약서 순서대로
      filtered = [...filtered].sort(
        (a, b) => (a.location.startIndex ?? 0) - (b.location.startIndex ?? 0)
      )
    }

    return filtered
  }, [issues, selectedCategories, selectedSeverities, sortBy])

  const toggleCategory = (category: LegalCategory) => {
    const newSet = new Set(selectedCategories)
    if (newSet.has(category)) {
      newSet.delete(category)
    } else {
      newSet.add(category)
    }
    setSelectedCategories(newSet)
  }

  const toggleSeverity = (severity: Severity) => {
    const newSet = new Set(selectedSeverities)
    if (newSet.has(severity)) {
      newSet.delete(severity)
    } else {
      newSet.add(severity)
    }
    setSelectedSeverities(newSet)
  }

  const handleCategoryFocus = (category: LegalCategory) => {
    setActiveTab('issues')
    setSelectedCategories(new Set([category]))
    onCategoryClick?.(category)
  }

  const handleCategoryCardClick = (category: LegalCategory) => {
    handleCategoryFocus(category)
  }

  const selectedIssue = issues.find(i => i.id === amendmentIssueId)

  // 위험도에 따른 색상 및 라벨
  const getRiskInfo = (score: number) => {
    const severity = getSeverityFromScore(score)
    const colors = SEVERITY_COLORS[severity]
    return {
      gradient: colors.gradient,
      bgColor: colors.bg,
      borderColor: colors.border,
      textColor: colors.text,
      label: SEVERITY_LABELS[severity],
      labelColor: colors.textDark,
      icon: severity === 'high' ? AlertTriangle : severity === 'medium' ? AlertTriangle : CheckCircle2,
    }
  }

  const riskInfo = getRiskInfo(riskScore)
  const RiskIcon = riskInfo.icon

  // 카테고리별 이슈 개수 계산
  const categoryCounts = issues.reduce((acc, issue) => {
    const category = issue.category
    if (!acc[category]) {
      acc[category] = { total: 0, high: 0, medium: 0, low: 0 }
    }
    acc[category].total++
    if (issue.severity === 'high') acc[category].high++
    else if (issue.severity === 'medium') acc[category].medium++
    else acc[category].low++
    return acc
  }, {} as Record<LegalCategory, { total: number; high: number; medium: number; low: number }>)

  // 주요 카테고리만 표시 (이슈가 있는 것만)
  const mainCategories: LegalCategory[] = ['working_hours', 'wage', 'probation', 'stock_option']
  const displayedCategories = mainCategories.filter(cat => categoryCounts[cat]?.total > 0)

  // 계약 유형 추정
  const estimateContractType = (): string => {
    if (categoryCounts.probation?.total > 0) return '인턴/수습 근로계약'
    if (categoryCounts.stock_option?.total > 0) return '정규직 근로계약'
    if (categoryCounts.wage?.total > 0) return '근로계약'
    return '근로계약'
  }

  // 조항 수 추정
  const estimateClauseCount = (): number => {
    const clauseMatches = contractText.match(/제\s*\d+\s*조/g)
    return clauseMatches ? clauseMatches.length : 0
  }

  const clauseCount = estimateClauseCount()
  const contractType = estimateContractType()

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50 via-white to-slate-50/50" role="complementary" aria-label="분석 결과">
      {/* 헤더 - 위험도 정보 통합 (sticky) */}
      <div className="p-3 sm:p-4 lg:p-5 bg-white/98 backdrop-blur-md border-b border-slate-200/80 shadow-sm flex-shrink-0 overflow-x-auto sticky top-0 z-20">
        {/* 상단: 위험도 정보 (간소화) */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md flex-shrink-0 ring-2 ring-blue-200/50">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm sm:text-base font-bold text-slate-900 truncate">{contractType}</p>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-600 mt-1">
                <span className="flex items-center gap-1 px-2 py-1 bg-gradient-to-br from-slate-100 to-slate-200 rounded-md shadow-sm flex-shrink-0 border border-slate-300/50">
                  <BarChart3 className="w-3 h-3 text-slate-700" />
                  <span className="font-bold text-slate-800">{riskScore}</span>
                  <span className="text-slate-600">/100</span>
                </span>
                {clauseCount > 0 && (
                  <span className="px-2 py-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-md whitespace-nowrap flex-shrink-0 border border-blue-200/50 text-blue-700 font-medium">
                    {clauseCount}개 조항
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className={cn(
            "px-3 py-2 rounded-xl border-2 text-xs sm:text-sm font-bold flex items-center gap-2 flex-shrink-0 shadow-md transition-all duration-200",
            riskInfo.bgColor,
            riskInfo.borderColor,
            riskInfo.textColor,
            "hover:scale-105 hover:shadow-lg"
          )}>
            <RiskIcon className="w-4 h-4" />
            <span className="whitespace-nowrap">{riskInfo.label}</span>
          </div>
        </div>

        {/* 중간: 카테고리별 요약 뱃지 */}
        {displayedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 overflow-x-auto pb-1">
            {displayedCategories.map(category => {
              const count = categoryCounts[category]
              if (!count || count.total === 0) return null

              const hasHigh = count.high > 0
              const hasMedium = count.medium > 0
              
              const badgeConfig = hasHigh
                ? {
                    bg: 'bg-gradient-to-br from-red-50 via-rose-50 to-red-100',
                    border: 'border-2 border-red-400',
                    text: 'text-red-800',
                    shadow: 'shadow-md shadow-red-200/50',
                    label: `${count.high}개`,
                    icon: AlertTriangle,
                  }
                : hasMedium
                ? {
                    bg: 'bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100',
                    border: 'border-2 border-amber-400',
                    text: 'text-amber-800',
                    shadow: 'shadow-md shadow-amber-200/50',
                    label: `${count.medium}개`,
                    icon: TrendingUp,
                  }
                : {
                    bg: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100',
                    border: 'border-2 border-blue-400',
                    text: 'text-blue-800',
                    shadow: 'shadow-md shadow-blue-200/50',
                    label: `${count.low}개`,
                    icon: Shield,
                  }

              const BadgeIcon = badgeConfig.icon

              return (
                <button
                  key={category}
                  onClick={() => handleCategoryFocus(category)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      handleCategoryFocus(category)
                    }
                  }}
                  aria-label={`${categoryLabels[category]} 카테고리, ${badgeConfig.label} 이슈 발견`}
                  className={cn(
                    "group px-3 py-2 rounded-xl border text-xs font-bold",
                    "transition-all duration-300 hover:shadow-lg hover:scale-110 hover:-translate-y-0.5",
                    "flex items-center gap-2",
                    FOCUS_STYLE,
                    "cursor-pointer active:scale-95",
                    badgeConfig.bg,
                    badgeConfig.border,
                    badgeConfig.text,
                    badgeConfig.shadow
                  )}
                >
                  <BadgeIcon className="w-4 h-4 flex-shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold">{categoryLabels[category]}</span>
                    <span className="opacity-50">·</span>
                    <span className="font-bold">{badgeConfig.label}</span>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* 하단: 타이틀 + 필터 버튼 */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg flex-shrink-0 ring-2 ring-blue-200/50">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-base sm:text-lg font-extrabold text-slate-900 truncate bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                계약 건강 진단표
              </h2>
              <p className="text-xs text-slate-600 truncate mt-0.5">
                위험 조항을 한눈에 보고, 우선 수정해야 할 순서를 정리해 드립니다.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-controls="filter-panel"
            className="flex-shrink-0 ai-button hover:shadow-lg hover:-translate-y-1 transition-all duration-200 border-2 hover:border-blue-400"
          >
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5" />
            <span className="hidden sm:inline text-sm font-semibold">필터</span>
            {(selectedCategories.size > 0 || selectedSeverities.size > 0 || sortBy === 'order') && (
              <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-xs font-bold text-white px-1.5 shadow-md">
                {selectedCategories.size + selectedSeverities.size + (sortBy === 'order' ? 1 : 0)}
              </span>
            )}
          </Button>
        </div>

        {/* 탭 네비게이션 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3 bg-slate-100/80 p-1.5 rounded-xl border border-slate-200 shadow-inner" role="tablist" aria-label="분석 결과 탭">
            <TabsTrigger 
              value="summary" 
              className="flex items-center gap-2 tab font-semibold text-sm transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:scale-105"
              aria-label="분석 요약 보기"
            >
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              <span className="hidden sm:inline">요약</span>
            </TabsTrigger>
            <TabsTrigger 
              value="issues" 
              className="flex items-center gap-2 tab font-semibold text-sm transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:scale-105"
              aria-label="조항별 분석 보기"
            >
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              <span className="hidden sm:inline">조항별</span>
            </TabsTrigger>
            <TabsTrigger 
              value="legal" 
              className="flex items-center gap-2 tab font-semibold text-sm transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:scale-105"
              aria-label="법령 및 표준계약서 비교 보기"
            >
              <Scale className="w-4 h-4 sm:w-5 sm:h-5" aria-hidden="true" />
              <span className="hidden sm:inline">법령·표준</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 필터 적용 중 미니 뱃지 */}
        {!showFilters && (selectedCategories.size > 0 || selectedSeverities.size > 0) && (
          <div className="mt-2 px-2 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
            <span className="font-medium text-slate-700">필터 적용 중</span>
            {selectedCategories.size > 0 && (
              <span>카테고리 {selectedCategories.size}개</span>
            )}
            {selectedSeverities.size > 0 && (
              <span>위험도 {Array.from(selectedSeverities).map(s => s === 'high' ? 'High' : s === 'medium' ? 'Medium' : 'Low').join(', ')}</span>
            )}
            <button
              onClick={() => {
                setSelectedCategories(new Set())
                setSelectedSeverities(new Set())
                setSortBy('severity')
              }}
              className="ml-auto text-xs text-blue-600 hover:underline cursor-pointer"
            >
              초기화
            </button>
          </div>
        )}

        {/* 필터 바 */}
        {showFilters && (
          <div id="filter-panel" className="border border-slate-200 rounded-lg p-3 bg-white mt-3">
            {/* 카테고리 필터 */}
            <div className="mb-3">
              <p className="text-xs font-medium text-slate-600 mb-2">카테고리</p>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={cn(
                      "px-2 py-1 text-xs rounded border transition-colors filter-button",
                      selectedCategories.has(category)
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    {categoryLabels[category]}
                  </button>
                ))}
              </div>
            </div>

            {/* 위험도 필터 */}
            <div className="mb-3">
              <p className="text-xs font-medium text-slate-600 mb-2">위험도</p>
              <div className="flex gap-2">
                {(['high', 'medium', 'low'] as Severity[]).map(severity => (
                  <button
                    key={severity}
                    onClick={() => toggleSeverity(severity)}
                    className={cn(
                      "px-2 py-1 text-xs rounded border transition-colors filter-button",
                      selectedSeverities.has(severity)
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    )}
                  >
                    {severity === 'high' ? 'High만' :
                     severity === 'medium' ? 'Medium만' :
                     'Low만'}
                  </button>
                ))}
              </div>
            </div>

            {/* 정렬 옵션 */}
            <div>
              <p className="text-xs font-medium text-slate-600 mb-2">정렬</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('severity')}
                  className={cn(
                    "px-2 py-1 text-xs rounded border transition-colors filter-button",
                    sortBy === 'severity'
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  위험도 높은 순
                </button>
                <button
                  onClick={() => setSortBy('order')}
                  className={cn(
                    "px-2 py-1 text-xs rounded border transition-colors filter-button",
                    sortBy === 'order'
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  계약서 순서대로
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-y-auto scroll-smooth">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* 요약 보기 탭 */}
          <TabsContent value="summary" className="p-4 sm:p-5 lg:p-6 mt-0">
            <div className="space-y-4 max-w-4xl mx-auto">
              {/* 한 줄 총평 */}
              {oneLineSummary && (
                <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 border-2 border-amber-400 rounded-2xl p-5 shadow-lg shadow-amber-200/50 hover:shadow-xl hover:shadow-amber-300/50 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-amber-200 to-orange-200 rounded-xl flex-shrink-0 shadow-md ring-2 ring-amber-300/50">
                      <AlertTriangle className="w-6 h-6 text-amber-800" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-extrabold text-amber-900 mb-2 flex items-center gap-2">
                        한 줄 총평
                        <span className="text-xs font-normal text-amber-700 bg-amber-200/50 px-2 py-0.5 rounded-full">
                          핵심 요약
                        </span>
                      </h3>
                      <p className="text-sm sm:text-base text-amber-900 leading-relaxed font-medium">{oneLineSummary}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 리스크 신호등 + 지금 당장 확인해야 할 포인트 */}
              {(riskTrafficLight || top3ActionPoints.length > 0) && (
                <div className="bg-gradient-to-br from-white via-slate-50 to-white border-2 border-slate-300 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                  {riskTrafficLight && (
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
                      <span className="text-4xl drop-shadow-lg">{riskTrafficLight}</span>
                      <div>
                        <span className="text-base font-extrabold text-slate-900 block">리스크 수준</span>
                        <span className="text-xs text-slate-600 mt-0.5">
                          {riskTrafficLight === '🔴' ? '높음 - 즉시 검토 필요' :
                           riskTrafficLight === '🟡' ? '보통 - 주의 깊게 확인' :
                           '낮음 - 일반적인 수준'}
                        </span>
                      </div>
                    </div>
                  )}
                  {top3ActionPoints.length > 0 && (
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 mb-3 flex items-center gap-2">
                        <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></span>
                        지금 당장 확인하거나 물어봐야 할 포인트
                      </h3>
                      <ul className="space-y-3">
                        {top3ActionPoints.map((point, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-slate-800 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 p-3 rounded-xl border border-blue-200/50 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                            <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-extrabold shadow-md ring-2 ring-blue-200">
                              {idx + 1}
                            </span>
                            <span className="flex-1 pt-0.5 font-medium leading-relaxed">{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* 리스크 요약 테이블 */}
              {riskSummaryTable.length > 0 && (
                <div className="bg-white border-2 border-slate-300 rounded-2xl overflow-hidden shadow-xl">
                  <div className="px-5 py-4 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 border-b-2 border-slate-300">
                    <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      리스크 요약
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-800 border-b-2 border-slate-300 uppercase tracking-wide">항목</th>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-800 border-b-2 border-slate-300 uppercase tracking-wide">리스크 수준</th>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-800 border-b-2 border-slate-300 uppercase tracking-wide">문제 포인트</th>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-800 border-b-2 border-slate-300 uppercase tracking-wide">간단 설명</th>
                          <th className="px-4 py-3 text-left text-xs font-extrabold text-slate-800 border-b-2 border-slate-300 uppercase tracking-wide">수정 제안</th>
                        </tr>
                      </thead>
                      <tbody>
                        {riskSummaryTable.map((item, idx) => (
                          <tr key={idx} className="border-b border-slate-200 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200">
                            <td className="px-4 py-3 font-bold text-slate-900">{item.item}</td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-extrabold shadow-sm border-2",
                                item.riskLevel === 'high' ? 'bg-gradient-to-br from-red-100 to-red-200 text-red-800 border-red-400' :
                                item.riskLevel === 'medium' ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-800 border-amber-400' :
                                'bg-gradient-to-br from-green-100 to-green-200 text-green-800 border-green-400'
                              )}>
                                {item.riskLevel === 'high' ? '🔴 높음' :
                                 item.riskLevel === 'medium' ? '🟡 보통' :
                                 '🟢 낮음'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-800 font-medium">{item.problemPoint}</td>
                            <td className="px-4 py-3 text-slate-700">{item.simpleExplanation}</td>
                            <td className="px-4 py-3">
                              <span className="text-blue-700 font-bold bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                                {item.revisionKeyword}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 독소조항 상세 */}
              {toxicClauses.length > 0 && (
                <div className="bg-gradient-to-br from-red-50 via-rose-50 to-red-100 border-4 border-red-400 rounded-2xl p-5 shadow-2xl shadow-red-200/50 hover:shadow-red-300/50 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b-2 border-red-300">
                    <div className="p-2.5 bg-gradient-to-br from-red-500 to-rose-600 rounded-xl shadow-lg ring-2 ring-red-300/50">
                      <AlertTriangle className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-extrabold text-red-900">독소조항 상세</h3>
                      <p className="text-xs text-red-700 mt-0.5">즉시 수정이 필요한 위험한 조항들</p>
                    </div>
                    <span className="text-sm font-extrabold bg-gradient-to-br from-red-500 to-rose-600 text-white px-3 py-1.5 rounded-full shadow-md ring-2 ring-red-300/50">
                      {toxicClauses.length}개
                    </span>
                  </div>
                  <div className="space-y-5">
                    {toxicClauses.map((toxic, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-5 border-2 border-red-300 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01]">
                        <div className="mb-4 pb-4 border-b-2 border-red-200">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center text-xs font-extrabold shadow-md">
                              {idx + 1}
                            </span>
                            <h4 className="text-base font-extrabold text-red-900">{toxic.clauseLocation}</h4>
                          </div>
                          <p className="text-sm text-red-800 font-medium bg-red-50/50 p-2 rounded-lg border border-red-200">{toxic.contentSummary}</p>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                            <span className="font-extrabold text-slate-900 block mb-1">⚠️ 왜 위험한지</span>
                            <span className="text-slate-800 leading-relaxed">{toxic.whyRisky}</span>
                          </div>
                          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                            <span className="font-extrabold text-slate-900 block mb-1">💥 현실에서 생길 수 있는 문제</span>
                            <span className="text-slate-800 leading-relaxed">{toxic.realWorldProblems}</span>
                          </div>
                          <div className="mt-4 pt-4 border-t-2 border-slate-200 space-y-3">
                            <div>
                              <p className="text-xs font-extrabold text-blue-700 mb-2 uppercase tracking-wide">수정 제안 (라이트 버전)</p>
                              <p className="text-sm text-slate-800 bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border-2 border-blue-200 font-medium leading-relaxed shadow-sm">
                                {toxic.suggestedRevisionLight}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-extrabold text-slate-700 mb-2 uppercase tracking-wide">수정 제안 (포멀 버전)</p>
                              <p className="text-sm text-slate-800 bg-gradient-to-br from-slate-50 to-slate-100 p-3 rounded-lg border-2 border-slate-300 font-medium leading-relaxed shadow-sm">
                                {toxic.suggestedRevisionFormal}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 협상 질문 리스트 */}
              {negotiationQuestions.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 border-2 border-blue-300 rounded-2xl p-5 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b-2 border-blue-200">
                    <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md ring-2 ring-blue-200/50">
                      <MessageSquare className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-extrabold text-blue-900">협상 시 질문 리스트</h3>
                      <p className="text-xs text-blue-700 mt-0.5">계약서 검토 시 활용하세요</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    {negotiationQuestions.map((question, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-blue-900 bg-white p-4 rounded-xl border-2 border-blue-200 hover:border-blue-400 hover:shadow-md transition-all duration-200">
                        <span className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-sm font-extrabold shadow-md ring-2 ring-blue-200 mt-0.5">
                          Q{idx + 1}
                        </span>
                        <span className="flex-1 pt-1 font-medium leading-relaxed">{question}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 조항 목록 (있는 경우) - 접을 수 있는 섹션 */}
              {clauses.length > 0 && (
                <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-lg overflow-hidden">
                  <details className="group">
                    <summary className="px-4 py-3 cursor-pointer hover:bg-slate-100/50 transition-colors flex items-center justify-between list-none">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-slate-900">
                          조항 목록
                        </span>
                        <span className="text-xs text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                          {clauses.length}개
                        </span>
                      </div>
                      <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-4 pb-4 max-h-[300px] overflow-y-auto border-t border-slate-200/60">
                      <ClauseList
                        clauses={clauses}
                        selectedClauseId={selectedClauseId}
                        onClauseClick={onClauseClick}
                      />
                    </div>
                  </details>
                </div>
              )}
              
              {/* 전체 요약 */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 border-2 border-blue-300 rounded-2xl p-5 shadow-lg">
                <p className="text-base font-extrabold text-blue-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  총 {totalIssues}개 조항 분석 결과
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 bg-white p-3 rounded-xl border-2 border-red-300 shadow-md">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-600 font-medium">법적 위험 HIGH</p>
                      <p className="text-lg font-extrabold text-red-700">{highRiskCount}개</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white p-3 rounded-xl border-2 border-amber-300 shadow-md">
                    <TrendingUp className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-600 font-medium">조정 권장 MED 이상</p>
                      <p className="text-lg font-extrabold text-amber-700">{mediumRiskCount + highRiskCount}개</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-white p-3 rounded-xl border-2 border-green-300 shadow-md">
                    <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-slate-600 font-medium">상대적으로 안전</p>
                      <p className="text-lg font-extrabold text-green-700">{lowRiskCount}개</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 카테고리별 카드 */}
              {categories.map(category => {
                const categoryIssues = issuesByCategory[category]
                if (categoryIssues.length === 0) return null

                const highCount = categoryIssues.filter(i => i.severity === 'high').length
                const mediumCount = categoryIssues.filter(i => i.severity === 'medium').length
                const lowCount = categoryIssues.filter(i => i.severity === 'low').length

                const getSeverityLabel = () => {
                  if (highCount > 0) return { label: `위험 ${highCount}건`, color: 'bg-red-50 border-red-300 text-red-700 shadow-sm' }
                  if (mediumCount > 0) return { label: `경고 ${mediumCount}건`, color: 'bg-yellow-50 border-yellow-300 text-yellow-700 shadow-sm' }
                  return { label: `주의 ${lowCount}건`, color: 'bg-blue-50 border-blue-300 text-blue-700 shadow-sm' }
                }

                const severityInfo = getSeverityLabel()
                const topIssue = categoryIssues[0]

                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryCardClick(category)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleCategoryCardClick(category)
                      }
                    }}
                    aria-label={`${categoryLabels[category]} 카테고리 상세 보기, ${severityInfo.label}`}
                    className="w-full text-left p-5 bg-white border-2 border-slate-300 rounded-2xl hover:border-blue-500 hover:shadow-xl hover:bg-gradient-to-br hover:from-blue-50/70 hover:to-indigo-50/70 transition-all duration-300 group focus:outline-none focus:ring-4 focus:ring-blue-400 focus:ring-offset-2 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-extrabold text-slate-900 text-base sm:text-lg group-hover:text-blue-700 transition-colors">{categoryLabels[category]}</span>
                      <span className={`px-4 py-2 text-xs font-extrabold rounded-xl border-2 shadow-md ${severityInfo.color} group-hover:scale-110 transition-transform`}>
                        {severityInfo.label}
                      </span>
                    </div>
                    {topIssue && (
                      <p className="text-sm sm:text-base text-slate-700 line-clamp-2 leading-relaxed font-medium group-hover:text-slate-900 transition-colors">{topIssue.summary}</p>
                    )}
                  </button>
                )
              })}
            </div>
          </TabsContent>

          {/* 조항별 분석 탭 */}
          <TabsContent value="issues" className="p-4 sm:p-5 lg:p-6 mt-0">
            {filteredAndSortedIssues.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <p>필터 조건에 맞는 이슈가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAndSortedIssues.map(issue => (
                  <div
                    key={issue.id}
                    ref={issue.id === selectedIssueId ? selectedIssueRef : null}
                  >
                    <AnalysisIssueCard
                      issue={issue}
                      isSelected={issue.id === selectedIssueId}
                      onSelect={() => onIssueSelect(issue.id)}
                      onShowAmendment={() => setAmendmentIssueId(issue.id)}
                      onAskAboutIssue={onAskAboutIssue}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 법령·표준계약 비교 탭 */}
          <TabsContent value="legal" className="p-4 sm:p-5 lg:p-6 mt-0">
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                각 위험 조항과 연결된 근로기준법·표준계약서 내용을 모아 보여줍니다.
              </p>
              {/* 법적 근거 아코디언 */}
              {issues.map((issue, index) => {
                if (!issue.legalBasis || issue.legalBasis.length === 0) return null

                return (
                  <details
                    key={issue.id}
                    className="bg-white border border-slate-200 rounded-lg overflow-hidden"
                  >
                    <summary 
                      className="p-4 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label={`${issue.summary} 법적 근거 보기`}
                    >
                      <div>
                        <span className="font-semibold text-slate-900">{issue.summary}</span>
                        <span className="text-xs text-slate-500 ml-2">
                          {categoryLabels[issue.category]}
                        </span>
                      </div>
                      <BookOpen className="w-4 h-4 text-slate-400" />
                    </summary>
                    <div className="p-4 border-t border-slate-200 space-y-3">
                      {issue.legalBasis.map((basis, idx) => (
                        <div key={idx} className="bg-blue-50 border border-blue-200 rounded p-3">
                          <p className="text-sm text-slate-800 leading-relaxed">{basis}</p>
                        </div>
                      ))}
                      {onAskAboutIssue && (
                        <Button
                          variant="outline"
                          size="sm"
                      onClick={() => {
                        onAskAboutIssue(issue.id)
                        setActiveTab('issues')
                      }}
                      className="w-full ai-button"
                    >
                      이 근거로 다시 설명 듣기
                    </Button>
                      )}
                    </div>
                  </details>
                )
              })}

              {issues.filter(i => i.legalBasis && i.legalBasis.length > 0).length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>법적 근거 정보가 없습니다.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* 수정안 모달 */}
      {selectedIssue && (
        <AmendmentModal
          issue={selectedIssue}
          isOpen={amendmentIssueId !== null}
          onClose={() => setAmendmentIssueId(null)}
        />
      )}
    </div>
  )
}
