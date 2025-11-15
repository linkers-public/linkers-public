'use client'

import React from 'react'
import { AlertTriangle, CheckCircle2, FileText, Calendar, Clock } from 'lucide-react'
import type { ContractAnalysisResult, LegalCategory } from '@/types/legal'

interface RiskOverviewBarProps {
  analysisResult: ContractAnalysisResult
  onCategoryClick?: (category: LegalCategory) => void
}

const CATEGORY_LABELS: Record<LegalCategory, string> = {
  working_hours: '근로시간·휴게',
  wage: '보수·수당',
  probation: '수습·해지',
  stock_option: '스톡옵션/IP',
  ip: 'IP/저작권',
  harassment: '직장내괴롭힘',
  other: '기타',
}

export function RiskOverviewBar({ analysisResult, onCategoryClick }: RiskOverviewBarProps) {
  const { riskScore, totalIssues, issues } = analysisResult

  // 위험도에 따른 색상 및 라벨
  const getRiskInfo = (score: number) => {
    if (score <= 39) {
      return {
        color: 'bg-green-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        textColor: 'text-green-700',
        label: '위험 낮음',
        labelColor: 'text-green-600',
      }
    } else if (score <= 69) {
      return {
        color: 'bg-yellow-500',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        textColor: 'text-yellow-700',
        label: '주의',
        labelColor: 'text-yellow-600',
      }
    } else {
      return {
        color: 'bg-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        label: '위험 높음',
        labelColor: 'text-red-600',
      }
    }
  }

  const riskInfo = getRiskInfo(riskScore)

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

  // 계약 유형 추정 (이슈 기반)
  const estimateContractType = (): string => {
    if (categoryCounts.probation?.total > 0) return '인턴/수습 근로계약'
    if (categoryCounts.stock_option?.total > 0) return '정규직 근로계약'
    if (categoryCounts.wage?.total > 0) return '근로계약'
    return '근로계약'
  }

  // 조항 수 추정 (텍스트에서 "제 X조" 패턴 찾기)
  const estimateClauseCount = (): number => {
    const clauseMatches = analysisResult.contractText.match(/제\s*\d+\s*조/g)
    return clauseMatches ? clauseMatches.length : 0
  }

  const clauseCount = estimateClauseCount()
  const contractType = estimateContractType()

  return (
    <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-slate-200/60 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
          {/* 좌측: 계약서 요약 정보 */}
          <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-500 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{contractType}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                  </span>
                  {clauseCount > 0 && (
                    <>
                      <span>·</span>
                      <span>{clauseCount}개 조항</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1 ${riskInfo.bgColor} ${riskInfo.borderColor} ${riskInfo.textColor}`}>
              {riskInfo.label === '위험 낮음' ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <AlertTriangle className="w-3 h-3" />
              )}
              {riskInfo.label}
            </div>
          </div>

          {/* 중앙: 전체 위험도 게이지 */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex-shrink-0">
                <p className="text-xs text-slate-500 mb-1">전체 위험도</p>
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-bold ${riskInfo.labelColor}`}>{riskScore}</span>
                  <span className="text-sm text-slate-500">/100</span>
                </div>
              </div>
              <div className="flex-1 min-w-[120px] max-w-[200px]">
                <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${riskInfo.color} transition-all duration-500 rounded-full`}
                    style={{ width: `${riskScore}%` }}
                  />
                </div>
                <p className={`text-xs mt-1 ${riskInfo.labelColor} font-medium`}>
                  {riskInfo.label === '위험 낮음' ? '안전합니다' :
                   riskInfo.label === '주의' ? '주의 필요' :
                   '위험 높음'}
                </p>
              </div>
            </div>
          </div>

          {/* 우측: 카테고리별 요약 뱃지 */}
          <div className="flex flex-wrap gap-2 lg:flex-nowrap">
            {displayedCategories.map(category => {
              const count = categoryCounts[category]
              if (!count || count.total === 0) return null

              const hasHigh = count.high > 0
              const hasMedium = count.medium > 0
              const badgeColor = hasHigh
                ? 'bg-red-50 border-red-200 text-red-700'
                : hasMedium
                ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                : 'bg-blue-50 border-blue-200 text-blue-700'

              const badgeLabel = hasHigh
                ? `위험 ${count.high}개`
                : hasMedium
                ? `경고 ${count.medium}개`
                : `주의 ${count.low}개`

              return (
                <button
                  key={category}
                  onClick={() => onCategoryClick?.(category)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all hover:shadow-md hover:scale-105 ${badgeColor} cursor-pointer`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">{CATEGORY_LABELS[category]}</span>
                    <span className="text-xs opacity-80">·</span>
                    <span>{badgeLabel}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

