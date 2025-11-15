'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Filter, AlertTriangle, CheckCircle2, FileText, BookOpen, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { AnalysisIssueCard } from './AnalysisIssueCard'
import { AmendmentModal } from './AmendmentModal'
import type { LegalIssue, LegalCategory, Severity } from '@/types/legal'

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
      grouped[issue.category].push(issue)
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

  const handleCategoryCardClick = (category: LegalCategory) => {
    setActiveTab('issues')
    setSelectedCategories(new Set([category]))
    onCategoryClick?.(category)
  }

  const selectedIssue = issues.find(i => i.id === amendmentIssueId)

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-slate-50/80 to-white" role="complementary" aria-label="분석 결과">
      {/* 헤더 */}
      <div className="p-4 sm:p-5 bg-white/95 backdrop-blur-sm border-b border-slate-200/60 shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">계약 건강 진단표</h2>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            aria-expanded={showFilters}
            aria-controls="filter-panel"
          >
            <Filter className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">필터</span>
          </Button>
        </div>

        {/* 탭 네비게이션 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="summary" className="flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">요약</span>
            </TabsTrigger>
            <TabsTrigger value="issues" className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span className="hidden sm:inline">조항별</span>
            </TabsTrigger>
            <TabsTrigger value="legal" className="flex items-center gap-1.5">
              <Scale className="w-4 h-4" />
              <span className="hidden sm:inline">법령·표준</span>
            </TabsTrigger>
          </TabsList>
        </Tabs>

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
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      selectedCategories.has(category)
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
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
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      selectedSeverities.has(severity)
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {severity === 'high' ? 'High만' :
                     severity === 'medium' ? 'Medium 이상' :
                     '전체'}
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
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    sortBy === 'severity'
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  위험도 높은 순
                </button>
                <button
                  onClick={() => setSortBy('order')}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    sortBy === 'order'
                      ? 'bg-blue-100 border-blue-500 text-blue-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  계약서 순서대로
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {/* 요약 보기 탭 */}
          <TabsContent value="summary" className="p-3 sm:p-4 mt-0">
            <div className="space-y-3">
              {/* 전체 요약 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-blue-900 mb-2">
                  총 {totalIssues}개 조항 중
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-blue-800">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span>법적 위험 HIGH: {highRiskCount}개</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>조정 권장 MED 이상: {mediumRiskCount + highRiskCount}개</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span>상대적으로 안전: {lowRiskCount}개</span>
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
                    className="w-full text-left p-5 bg-white border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-lg hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200 group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-slate-900 text-base group-hover:text-blue-700 transition-colors">{categoryLabels[category]}</span>
                      <span className={`px-3 py-1.5 text-xs font-semibold rounded-lg border-2 ${severityInfo.color}`}>
                        {severityInfo.label}
                      </span>
                    </div>
                    {topIssue && (
                      <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">{topIssue.summary}</p>
                    )}
                  </button>
                )
              })}
            </div>
          </TabsContent>

          {/* 조항별 분석 탭 */}
          <TabsContent value="issues" className="p-3 sm:p-4 mt-0">
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
          <TabsContent value="legal" className="p-3 sm:p-4 mt-0">
            <div className="space-y-4">
              {/* 법적 근거 아코디언 */}
              {issues.map((issue, index) => {
                if (!issue.legalBasis || issue.legalBasis.length === 0) return null

                return (
                  <details
                    key={issue.id}
                    className="bg-white border border-slate-200 rounded-lg overflow-hidden"
                  >
                    <summary className="p-4 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between">
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
                          className="w-full"
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
