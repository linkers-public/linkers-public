'use client'

import React, { useState, useMemo, useEffect, useRef } from 'react'
import { Filter, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  onAskAboutIssue?: (issueId: string) => void
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
}: AnalysisPanelProps) {
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
    working_hours: '근로시간',
    wage: '보수·수당',
    probation: '수습·해지',
    stock_option: '스톡옵션',
    ip: 'IP/저작권',
    harassment: '직장내괴롭힘',
    other: '기타',
  }

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

  const selectedIssue = issues.find(i => i.id === amendmentIssueId)

  return (
    <div className="h-full flex flex-col bg-slate-50" role="complementary" aria-label="분석 결과">
      {/* 헤더 */}
      <div className="p-3 sm:p-4 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">분석 결과</h2>
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

        {/* 요약 인사이트 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
          <p className="text-sm font-medium text-blue-900 mb-2">
            총 {totalIssues}개 조항 중
          </p>
          <div className="flex items-center gap-4 text-xs text-blue-800">
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

        {/* 필터 바 */}
        {showFilters && (
          <div id="filter-panel" className="border border-slate-200 rounded-lg p-3 bg-white mb-3">
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

      {/* 이슈 리스트 */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4">
        {filteredAndSortedIssues.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>필터 조건에 맞는 이슈가 없습니다.</p>
          </div>
        ) : (
          filteredAndSortedIssues.map(issue => (
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
          ))
        )}
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

