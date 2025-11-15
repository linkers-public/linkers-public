'use client'

import { useState } from 'react'
import { AlertTriangle, Eye, FileEdit, Copy, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import type { LegalIssue } from '@/types/legal'

interface AnalysisIssueCardProps {
  issue: LegalIssue
  isSelected?: boolean
  onSelect?: () => void
  onShowAmendment?: () => void
  onAskAboutIssue?: (issueId: string) => void
}

export function AnalysisIssueCard({
  issue,
  isSelected,
  onSelect,
  onShowAmendment,
  onAskAboutIssue,
}: AnalysisIssueCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const { toast } = useToast()

  const severityColors = {
    high: 'bg-red-100 text-red-800 border-red-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    low: 'bg-green-100 text-green-800 border-green-300',
  }

  const severityLabels = {
    high: '심각',
    medium: '경고',
    low: '주의',
  }

  const categoryLabels: Record<string, string> = {
    working_hours: '근로시간',
    wage: '보수·수당',
    probation: '수습·해지',
    stock_option: '스톡옵션',
    ip: 'IP/저작권',
    harassment: '직장내괴롭힘',
    other: '기타',
  }

  const getLocationText = () => {
    if (issue.location.clauseNumber) {
      return `제 ${issue.location.clauseNumber}조`
    }
    if (issue.location.page) {
      return `${issue.location.page}페이지`
    }
    if (issue.location.startIndex !== undefined && issue.location.endIndex !== undefined) {
      return '계약서 내 위치 확인됨'
    }
    // 위치 정보가 없어도 원문 텍스트가 있으면 표시하지 않음
    if (issue.originalText && issue.originalText.trim().length > 0) {
      return ''
    }
    return '위치 정보 없음'
  }

  const handleCopyQuestion = async (question: string) => {
    try {
      await navigator.clipboard.writeText(question)
      toast({
        title: '복사 완료',
        description: '질문이 클립보드에 복사되었습니다.',
      })
    } catch (error) {
      toast({
        title: '복사 실패',
        description: '클립보드에 복사할 수 없습니다.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div
      className={`border rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-md'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-label={`${issue.summary} - ${getLocationText()}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect?.()
        }
      }}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {/* 카테고리 & 위험도 */}
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-1 text-xs font-medium rounded bg-slate-100 text-slate-700">
              {categoryLabels[issue.category] || issue.category}
            </span>
            <span
              className={`px-2 py-1 text-xs font-medium rounded border ${severityColors[issue.severity]}`}
            >
              {severityLabels[issue.severity]}
            </span>
          </div>

          {/* 요약 */}
          <p className="text-sm font-medium text-slate-900 mb-2">{issue.summary}</p>

          {/* 위치 정보 (있는 경우에만 표시) */}
          {getLocationText() && (
            <p className="text-xs text-slate-500 mb-2">{getLocationText()}</p>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation()
            setIsExpanded(!isExpanded)
          }}
          className="ml-2 p-1 hover:bg-slate-100 rounded"
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-500" />
          )}
        </button>
      </div>

      {/* 멀티 메트릭 */}
      <div className="flex items-center gap-3 mb-3 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-slate-500">법적 위험:</span>
          <MetricBar value={issue.metrics.legalRisk} max={5} color="red" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-500">모호성:</span>
          <MetricBar value={issue.metrics.ambiguity} max={5} color="yellow" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-500">협상 여지:</span>
          <MetricBar value={issue.metrics.negotiability} max={5} color="green" />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-slate-500">우선순위:</span>
          <span className={`font-medium ${
            issue.metrics.priority === 'high' ? 'text-red-600' :
            issue.metrics.priority === 'medium' ? 'text-yellow-600' :
            'text-green-600'
          }`}>
            {issue.metrics.priority.toUpperCase()}
          </span>
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.()
            // 스크롤이 제대로 작동하도록 약간의 지연 후 포커스
            setTimeout(() => {
              // ContractViewer가 스크롤할 시간을 줌
            }, 50)
          }}
          className="flex-1"
        >
          <Eye className="w-4 h-4 mr-1" />
          해당 조항 보기
        </Button>
        {onAskAboutIssue && (
          <Button
            variant="default"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onAskAboutIssue(issue.id)
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            이 부분 질문하기
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onShowAmendment?.()
          }}
          className="flex-1"
        >
          <FileEdit className="w-4 h-4 mr-1" />
          수정안 보기
        </Button>
      </div>

      {/* 확장된 내용 */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
          {/* 원문 */}
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">현재 조항</p>
            <p className="text-sm text-slate-700 bg-slate-50 p-2 rounded border border-slate-200">
              {issue.originalText}
            </p>
          </div>

          {/* 근거 */}
          {issue.legalBasis && issue.legalBasis.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">법적 근거</p>
              <div className="space-y-1">
                {issue.legalBasis.map((basis, idx) => (
                  <p key={idx} className="text-xs text-slate-600 bg-blue-50 p-2 rounded">
                    {basis}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* 질문 스크립트 */}
          {issue.suggestedQuestions && issue.suggestedQuestions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-2">이렇게 질문해 보세요</p>
              <div className="space-y-2">
                {issue.suggestedQuestions.map((question, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2 bg-purple-50 rounded border border-purple-200"
                  >
                    <p className="flex-1 text-sm text-slate-700">{question}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCopyQuestion(question)
                      }}
                      className="p-1 h-auto"
                    >
                      <Copy className="w-4 h-4 text-purple-600" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function MetricBar({ value, max, color }: { value: number; max: number; color: string }) {
  const filled = Math.round((value / max) * 5)
  const colorClass = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
  }[color] || 'bg-slate-500'

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i < filled ? colorClass : 'bg-slate-200'
          }`}
        />
      ))}
    </div>
  )
}

