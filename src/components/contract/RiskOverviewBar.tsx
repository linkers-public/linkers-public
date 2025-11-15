'use client'

import React from 'react'
import { AlertTriangle, CheckCircle2, FileText, Calendar, Clock, TrendingUp, Shield, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'
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
        gradient: 'from-green-500 to-emerald-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-300',
        textColor: 'text-green-700',
        label: '위험 낮음',
        labelColor: 'text-green-600',
        icon: CheckCircle2,
      }
    } else if (score <= 69) {
      return {
        color: 'bg-amber-500',
        gradient: 'from-amber-500 to-orange-500',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-300',
        textColor: 'text-amber-700',
        label: '주의',
        labelColor: 'text-amber-600',
        icon: AlertTriangle,
      }
    } else {
      return {
        color: 'bg-red-500',
        gradient: 'from-red-500 to-rose-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        textColor: 'text-red-700',
        label: '위험 높음',
        labelColor: 'text-red-600',
        icon: AlertTriangle,
      }
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
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-lg">
      <div className="container mx-auto px-4 sm:px-6 py-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-5 lg:gap-6">
          {/* 좌측: 계약서 요약 정보 */}
          <div className="flex-1 flex flex-col sm:flex-row items-start sm:items-center gap-4 min-w-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-base font-bold text-slate-900 truncate">{contractType}</p>
                <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                  <span className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 rounded-md">
                    <Calendar className="w-3 h-3" />
                    {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                  </span>
                  {clauseCount > 0 && (
                    <span className="px-2 py-0.5 bg-slate-100 rounded-md">
                      {clauseCount}개 조항
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className={cn(
              "px-4 py-2 rounded-xl border-2 text-sm font-semibold flex items-center gap-2 shadow-sm",
              riskInfo.bgColor,
              riskInfo.borderColor,
              riskInfo.textColor
            )}>
              <RiskIcon className="w-4 h-4" />
              {riskInfo.label}
            </div>
          </div>

          {/* 중앙: 전체 위험도 게이지 */}
          <div className="flex items-center gap-5 min-w-0 bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 border border-slate-200/60 shadow-sm">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div className="flex-shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-slate-500" />
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">전체 위험도</p>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className={cn("text-3xl font-extrabold", riskInfo.labelColor)}>{riskScore}</span>
                  <span className="text-sm text-slate-500 font-medium">/100</span>
                </div>
              </div>
              <div className="flex-1 min-w-[140px] max-w-[220px]">
                <div className="h-4 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                  <div
                    className={cn(
                      "h-full bg-gradient-to-r transition-all duration-700 ease-out rounded-full shadow-sm",
                      riskInfo.gradient
                    )}
                    style={{ width: `${riskScore}%` }}
                  />
                </div>
                <p className={cn("text-xs mt-2 font-semibold", riskInfo.labelColor)}>
                  {riskInfo.label === '위험 낮음' ? '✅ 안전합니다' :
                   riskInfo.label === '주의' ? '⚠️ 주의 필요' :
                   '🚨 위험 높음'}
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
              
              const badgeConfig = hasHigh
                ? {
                    bg: 'bg-gradient-to-br from-red-50 to-rose-50',
                    border: 'border-red-300',
                    text: 'text-red-700',
                    label: `위험 ${count.high}개`,
                    icon: AlertTriangle,
                  }
                : hasMedium
                ? {
                    bg: 'bg-gradient-to-br from-amber-50 to-orange-50',
                    border: 'border-amber-300',
                    text: 'text-amber-700',
                    label: `경고 ${count.medium}개`,
                    icon: TrendingUp,
                  }
                : {
                    bg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
                    border: 'border-blue-300',
                    text: 'text-blue-700',
                    label: `주의 ${count.low}개`,
                    icon: Shield,
                  }

              const BadgeIcon = badgeConfig.icon

              return (
                <button
                  key={category}
                  onClick={() => onCategoryClick?.(category)}
                  className={cn(
                    "group px-4 py-2.5 rounded-xl border-2 text-xs font-semibold",
                    "transition-all duration-200 hover:shadow-lg hover:scale-105",
                    "flex items-center gap-2",
                    badgeConfig.bg,
                    badgeConfig.border,
                    badgeConfig.text
                  )}
                >
                  <BadgeIcon className="w-3.5 h-3.5 flex-shrink-0" />
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">{CATEGORY_LABELS[category]}</span>
                    <span className="opacity-60">·</span>
                    <span>{badgeConfig.label}</span>
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
