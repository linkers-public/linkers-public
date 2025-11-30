'use client'

import { useState } from 'react'
import { CheckCircle2, FileText, MessageSquare, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SituationChatResponse {
  reportTitle: string
  legalPerspective: {
    description: string
    references: Array<{
      name: string
      description: string
    }>
  }
  actions: Array<{
    description: string
    key: string
  }>
  conversationExamples: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

interface SituationChatMessageProps {
  content: string
}

/**
 * 상황분석 챗 답변을 구조화된 카드 형태로 렌더링
 * JSON 형식의 응답을 파싱하여 표시
 */
export function SituationChatMessage({ content }: SituationChatMessageProps) {
  const [expandedRefs, setExpandedRefs] = useState<Record<number, boolean>>({})
  const [expandedActions, setExpandedActions] = useState<Record<number, boolean>>({})
  const [expandedExamples, setExpandedExamples] = useState<Record<number, boolean>>({})

  // JSON 파싱 및 검증 함수
  const safeParseSituationResponse = (raw: string): SituationChatResponse | null => {
    if (!raw || !raw.trim()) return null

    try {
      // JSON 코드 블록 제거 (```json ... ```)
      let jsonPart = raw.trim()
      const jsonMatch = jsonPart.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        jsonPart = jsonMatch[1].trim()
      }

      // --- 구분선 찾기 (JSON과 안내 문구 사이)
      const separatorIndex = jsonPart.indexOf('---')
      if (separatorIndex !== -1) {
        jsonPart = jsonPart.substring(0, separatorIndex).trim()
      }

      // ⚠️ 뒤에 붙는 안내 문구 분리
      const warningIndex = jsonPart.indexOf("⚠️")
      if (warningIndex !== -1) {
        jsonPart = jsonPart.substring(0, warningIndex).trim()
      }

      // JSON 객체 시작/끝 찾기
      const firstBrace = jsonPart.indexOf('{')
      const lastBrace = jsonPart.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        jsonPart = jsonPart.substring(firstBrace, lastBrace + 1)
      }

      // JSON 파싱
      const parsed = JSON.parse(jsonPart)

      // 최소한의 구조 검증
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        !parsed.reportTitle ||
        !parsed.legalPerspective ||
        !parsed.actions ||
        !parsed.conversationExamples
      ) {
        return null
      }

      return parsed as SituationChatResponse
    } catch (e) {
      console.error('상황분석 응답 파싱 실패:', e)
      return null
    }
  }

  const parsed = safeParseSituationResponse(content)

  // 파싱 실패 시 원본 텍스트 표시
  if (!parsed) {
    return (
      <div className="prose prose-sm max-w-none">
        <pre className="whitespace-pre-wrap break-words text-sm">{content}</pre>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 리포트 제목 */}
      <div className="text-lg font-semibold text-slate-900">
        {parsed.reportTitle}
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
      <div className="text-xs text-slate-500 italic pt-2 border-t border-slate-200">
        ⚠️ 참고: 이 답변은 정보 안내를 위한 것이며 법률 자문이 아닙니다. 중요한 사안은 전문 변호사나 노동위원회 등 전문 기관에 상담하시기 바랍니다.
      </div>
    </div>
  )
}

