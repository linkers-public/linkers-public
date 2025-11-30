'use client'

import { useState } from 'react'
import { CheckCircle2, FileText, MessageSquare, ChevronRight, ChevronDown, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MarkdownRenderer } from '@/components/rag/MarkdownRenderer'

/**
 * 상황분석 메시지 페이로드 타입
 */
export interface SituationAnalysisMessagePayload {
  reportTitle: string
  legalPerspective: {
    description: string
    references?: Array<{
      name: string
      description: string
    }>
  }
  actions?: Array<{
    key: string
    description: string
  }>
  conversationExamples?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

/**
 * 메시지에서 JSON 추출
 */
function extractJsonFromMessage(raw: string): any | null {
  let text = raw.trim()

  if (!text) {
    return null
  }

  // ```json ... ``` 형식이면 코드펜스 제거
  if (text.startsWith('```')) {
    const firstNewline = text.indexOf('\n')
    if (firstNewline !== -1) {
      text = text.slice(firstNewline + 1) // 언어줄(json) 자르고
    }
    if (text.endsWith('```')) {
      text = text.slice(0, -3)
    }
    text = text.trim()
  }

  // --- 구분선 찾기 (JSON과 안내 문구 사이)
  const separatorIndex = text.indexOf('---')
  if (separatorIndex !== -1) {
    text = text.substring(0, separatorIndex).trim()
  }

  // ⚠️ 뒤에 붙는 안내 문구 분리
  const warningIndex = text.indexOf('⚠️')
  if (warningIndex !== -1) {
    text = text.substring(0, warningIndex).trim()
  }

  // JSON 객체 시작/끝 찾기 (중괄호 매칭)
  const firstBrace = text.indexOf('{')
  if (firstBrace !== -1) {
    let braceCount = 0
    let lastBrace = -1
    for (let i = firstBrace; i < text.length; i++) {
      if (text[i] === '{') {
        braceCount++
      } else if (text[i] === '}') {
        braceCount--
        if (braceCount === 0) {
          lastBrace = i
          break
        }
      }
    }
    if (lastBrace !== -1) {
      text = text.substring(firstBrace, lastBrace + 1)
    } else {
      // 중괄호 매칭 실패 시 마지막 } 사용
      const lastBraceIndex = text.lastIndexOf('}')
      if (lastBraceIndex !== -1 && lastBraceIndex > firstBrace) {
        text = text.substring(firstBrace, lastBraceIndex + 1)
      }
    }
  }

  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

/**
 * 타입 가드: 상황분석 페이로드인지 확인
 */
function isSituationPayload(v: any): v is SituationAnalysisMessagePayload {
  return (
    v &&
    typeof v.reportTitle === 'string' &&
    v.legalPerspective &&
    typeof v.legalPerspective.description === 'string'
  )
}

interface SituationChatMessageProps {
  content: string
  contextId?: string | null
}

/**
 * 상황분석 챗 답변을 구조화된 카드 형태로 렌더링
 * JSON 형식의 응답을 파싱하여 표시
 */
export function SituationChatMessage({ content, contextId }: SituationChatMessageProps) {
  const [expandedRefs, setExpandedRefs] = useState<Record<number, boolean>>({})
  const [expandedActions, setExpandedActions] = useState<Record<number, boolean>>({})
  const [expandedExamples, setExpandedExamples] = useState<Record<number, boolean>>({})

  // JSON 파싱 시도
  const json = extractJsonFromMessage(content)
  const parsed = json && isSituationPayload(json) ? json : null

  // 파싱 실패 시 마크다운 렌더링 (fallback)
  if (!parsed) {
    return (
      <div className="prose prose-sm max-w-none prose-headings:text-slate-900 prose-p:text-slate-700 prose-strong:text-slate-900 prose-code:text-blue-600 prose-pre:bg-slate-50 prose-pre:border prose-pre:border-slate-200 text-sm leading-relaxed">
        <MarkdownRenderer content={content} />
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-4">
      {/* 리포트 제목 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">
          {parsed.reportTitle}
        </h3>
        {contextId && (
          <a
            href={`/legal/situation/${contextId}`}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>전체 리포트 보러가기</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* 법적 관점 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
        <div className="flex items-start gap-2">
          <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">⚖️ 법적 관점에서 본 현재상황</h3>
            <p className="text-sm text-blue-800 leading-relaxed whitespace-pre-wrap">
              {parsed.legalPerspective.description}
            </p>
          </div>
        </div>

        {/* 참고 문서 */}
        {parsed.legalPerspective.references && parsed.legalPerspective.references.length > 0 && (
          <div className="mt-3 pt-3 border-t border-blue-200">
            <h4 className="text-xs font-semibold text-blue-700 mb-2">참고 문서</h4>
            <div className="space-y-2">
              {parsed.legalPerspective.references.map((ref, idx) => (
                <div key={idx} className="text-xs">
                  <button
                    onClick={() =>
                      setExpandedRefs((prev) => ({ ...prev, [idx]: !prev[idx] }))
                    }
                    className="flex items-start gap-2 w-full text-left hover:text-blue-900 transition-colors"
                  >
                    {expandedRefs[idx] ? (
                      <ChevronDown className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium text-blue-800">{ref.name}</div>
                      {expandedRefs[idx] && (
                        <div className="mt-1 text-blue-700 leading-relaxed">
                          {ref.description}
                        </div>
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 행동 항목 */}
      {parsed.actions && parsed.actions.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            🎯 지금 당장 할 수 있는 행동
          </h3>
          <div className="space-y-2">
            {parsed.actions.map((action, idx) => (
              <div
                key={action.key || idx}
                className="flex items-start gap-2 text-sm text-green-800"
              >
                <span className="font-semibold text-green-700 flex-shrink-0">
                  {action.key}.
                </span>
                <span className="leading-relaxed">{action.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 대화 예시 */}
      {parsed.conversationExamples && parsed.conversationExamples.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            💬 이렇게 말해보세요
          </h3>
          <div className="space-y-3">
            {parsed.conversationExamples.map((example, idx) => (
              <div
                key={idx}
                className={cn(
                  'rounded-lg p-3 text-sm',
                  example.role === 'user'
                    ? 'bg-white border border-purple-200'
                    : 'bg-purple-100 border border-purple-200'
                )}
              >
                <div className="font-semibold text-purple-700 mb-1">
                  {example.role === 'user' ? '사용자' : 'AI'}
                </div>
                <div className="text-purple-800 leading-relaxed whitespace-pre-wrap">
                  {example.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 참고 문구 */}
      <p className="mt-1 text-[11px] text-slate-400 leading-snug pt-2 border-t border-slate-200">
        ⚠️ 이 답변은 정보 안내를 위한 것이며 법률 자문이 아닙니다. 중요한 사안은 변호사,
        노동청, 노동위원회 등 전문기관에 상담하시기 바랍니다.
      </p>
    </div>
  )
}

