'use client'

import { useState } from 'react'
import { AlertTriangle, Eye, FileEdit, Copy, ChevronDown, ChevronUp, MessageSquare, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { RewriteModal } from './RewriteModal'
import { cn } from '@/lib/utils'
import { SEVERITY_COLORS, SEVERITY_LABELS, SEVERITY_LABELS_SHORT, PRIMARY_GRADIENT, PRIMARY_GRADIENT_HOVER, FOCUS_STYLE, ICON_SIZES } from './contract-design-tokens'
import type { LegalIssue } from '@/types/legal'

interface AnalysisIssueCardProps {
  issue: LegalIssue
  isSelected?: boolean
  onSelect?: () => void
  onShowAmendment?: () => void
  onAskAboutIssue?: (issueId: string, prefilledText?: string) => void
}

export function AnalysisIssueCard({
  issue,
  isSelected,
  onSelect,
  onShowAmendment,
  onAskAboutIssue,
}: AnalysisIssueCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showRewriteModal, setShowRewriteModal] = useState(false)
  const { toast } = useToast()

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
      className={cn(
        "relative border rounded-xl p-4 sm:p-5 mb-4 transition-all issue-card",
        isSelected
          ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-md scale-[1.01]'
          : 'border-slate-200 bg-white hover:border-slate-300'
      )}
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
      {isSelected && (
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-l-xl" />
      )}
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          {/* 카테고리 & 위험도 */}
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 border border-slate-200">
              {categoryLabels[issue.category] || issue.category}
            </span>
            <span
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-lg border-2 shadow-sm",
                SEVERITY_COLORS[issue.severity].badge
              )}
            >
              {SEVERITY_LABELS_SHORT[issue.severity]}
            </span>
          </div>

          {/* 연결된 조항 */}
          {issue.location.clauseNumber && (
            <p className="text-xs text-blue-600 font-medium mb-1">
              연결 조항: 제 {issue.location.clauseNumber}조 계약의 해지
            </p>
          )}

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
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "상세 정보 접기" : "상세 정보 펼치기"}
          className={cn("ml-2 p-1 hover:bg-slate-100 rounded", FOCUS_STYLE)}
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
      <div className="flex gap-2 mt-3">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.()
            setTimeout(() => {}, 50)
          }}
          aria-label="계약서에서 해당 조항 위치 보기"
          className="flex-1 border-slate-300 hover:bg-slate-50 hover:border-blue-300"
        >
          <Eye className="w-4 h-4 mr-1.5" aria-hidden="true" />
          해당 조항 보기
        </Button>
        {onAskAboutIssue && (
        <Button
          variant="default"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            const prefilled = `다음 조항이 왜 위험한지와 현실적으로 어떤 협상 포인트를 잡을 수 있을지 알려줘.\n\n[문제 조항]\n${issue.originalText || issue.summary}`
            onAskAboutIssue(issue.id, prefilled)
          }}
          aria-label={`${issue.summary}에 대해 AI에게 질문하기`}
          className={cn(PRIMARY_GRADIENT, PRIMARY_GRADIENT_HOVER, "text-white shadow-md hover:shadow-lg transition-all ai-button")}
        >
          <MessageSquare className="w-4 h-4 mr-1.5" aria-hidden="true" />
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
          aria-label="이 조항의 수정 제안 보기"
          className="flex-1 border-slate-300 hover:bg-slate-50 hover:border-blue-300"
        >
          <FileEdit className="w-4 h-4 mr-1.5" aria-hidden="true" />
          수정안 보기
        </Button>
        {issue.originalText && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setShowRewriteModal(true)
            }}
            aria-label="AI 조항 리라이트"
            className="flex-1 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
          >
            <Sparkles className="w-4 h-4 mr-1.5" aria-hidden="true" />
            AI 수정
          </Button>
        )}
      </div>
      
      {/* 리라이트 모달 */}
      {showRewriteModal && issue.originalText && (
        <RewriteModal
          clauseId={issue.id}
          originalText={issue.originalText}
          issueId={issue.id}
          onClose={() => setShowRewriteModal(false)}
        />
      )}

      {/* 확장된 내용 */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-slate-200 space-y-3 content">
          {/* 원문 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-600">문제되는 문장 (원문 발췌)</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect?.()
                }}
                className="text-xs h-7 px-3 hover:bg-blue-50 text-blue-600"
              >
                원문 위치로 이동 →
              </Button>
            </div>
            <div className="text-sm text-slate-700 bg-gradient-to-br from-slate-50 to-slate-100/50 p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="whitespace-pre-wrap leading-relaxed">{issue.originalText}</p>
            </div>
          </div>

          {/* 위험 분석 */}
          {issue.rationale && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">위험 분석 (왜 문제인지)</p>
              <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
                {issue.rationale.split('\n').filter(line => line.trim()).map((line, idx) => (
                  <li key={idx} className="text-slate-700">{line.trim().replace(/^[-•]\s*/, '')}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 수정 제안 */}
          {issue.suggestedText && (
            <div>
              <p className="text-xs font-semibold text-slate-600 mb-2">수정 제안 (이렇게 고쳐보면 좋음)</p>
              <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-xl p-4 shadow-sm relative">
                <p className="text-sm text-slate-800 whitespace-pre-wrap mb-3 leading-relaxed font-medium">{issue.suggestedText}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigator.clipboard.writeText(issue.suggestedText || '')
                      toast({
                        title: '복사 완료',
                        description: '제안 문구가 클립보드에 복사되었습니다.',
                      })
                    }}
                    className="flex-1 text-xs h-8 border-emerald-300 hover:bg-emerald-100 ai-button"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    제안 문구 복사
                  </Button>
                  {onAskAboutIssue && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        const prefilled = `다음 조항이 왜 위험한지와 현실적으로 어떤 협상 포인트를 잡을 수 있을지 알려줘.\n\n[문제 조항]\n${issue.originalText || issue.summary}`
                        onAskAboutIssue(issue.id, prefilled)
                      }}
                      className={cn("flex-1 text-xs h-8", PRIMARY_GRADIENT, PRIMARY_GRADIENT_HOVER, "text-white shadow-md ai-button")}
                    >
                      <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                      이 문장으로 질문하기
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

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

