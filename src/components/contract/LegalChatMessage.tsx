'use client'

import { useMemo, useState } from 'react'
import { Scale, AlertTriangle, CheckCircle2, MessageSquare, FileText, Copy, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { MarkdownRenderer } from '@/components/rag/MarkdownRenderer'

interface ParsedLegalResponse {
  summary: string
  riskLevel: '경미' | '보통' | '높음' | null
  riskLevelDescription: string // 위험도 설명 (예: "법적 분쟁 가능성은 크지 않지만...")
  riskContent: string
  checklist: string[]
  negotiationPoints: {
    clauseModification?: string
    conversationExamples: string[]
  }
  legalReferences: Array<{
    name: string
    description: string
  }>
}

interface LegalChatMessageProps {
  content: string
  selectedIssue?: {
    category?: string
    summary?: string
  }
}

/**
 * 법률 챗 답변을 구조화된 카드 형태로 렌더링
 * 마크다운을 파싱하여 탭/아코디언 형태로 표시
 */
export function LegalChatMessage({ content, selectedIssue }: LegalChatMessageProps) {
  const [activeTab, setActiveTab] = useState('summary')
  const [copiedText, setCopiedText] = useState<string | null>(null)

  // JSON 파싱 및 검증 함수
  const safeParseLegalResponse = (raw: string): ParsedLegalResponse => {
    const defaultResult: ParsedLegalResponse = {
      summary: '',
      riskLevel: null,
      riskLevelDescription: '',
      riskContent: '',
      checklist: [],
      negotiationPoints: {
        conversationExamples: [],
      },
      legalReferences: [],
    }

    if (!raw || !raw.trim()) return defaultResult

    try {
      // JSON 파싱 시도
      let parsed: any
      
      // JSON 코드 블록 제거 (```json ... ```)
      const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[1])
      } else {
        // 직접 JSON 파싱 시도
        parsed = JSON.parse(raw.trim())
      }

      // 최소한의 구조 검증
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('invalid response structure')
      }

      // 안전하게 파싱된 데이터 반환
      return {
        summary: typeof parsed.summary === 'string' ? parsed.summary : defaultResult.summary,
        riskLevel: parsed.riskLevel === '경미' || parsed.riskLevel === '보통' || parsed.riskLevel === '높음' 
          ? parsed.riskLevel 
          : parsed.riskLevel === null 
            ? null 
            : defaultResult.riskLevel,
        riskLevelDescription: typeof parsed.riskLevelDescription === 'string' 
          ? parsed.riskLevelDescription 
          : defaultResult.riskLevelDescription,
        riskContent: typeof parsed.riskContent === 'string' ? parsed.riskContent : defaultResult.riskContent,
        checklist: Array.isArray(parsed.checklist) 
          ? parsed.checklist.filter((item: any) => typeof item === 'string')
          : defaultResult.checklist,
        negotiationPoints: {
          clauseModification: parsed.negotiationPoints?.clauseModification && typeof parsed.negotiationPoints.clauseModification === 'string'
            ? parsed.negotiationPoints.clauseModification
            : defaultResult.negotiationPoints.clauseModification,
          conversationExamples: Array.isArray(parsed.negotiationPoints?.conversationExamples)
            ? parsed.negotiationPoints.conversationExamples.filter((item: any) => typeof item === 'string')
            : defaultResult.negotiationPoints.conversationExamples,
        },
        legalReferences: Array.isArray(parsed.legalReferences)
          ? parsed.legalReferences
              .filter((ref: any) => ref && typeof ref === 'object' && typeof ref.name === 'string' && typeof ref.description === 'string')
              .map((ref: any) => ({ name: ref.name, description: ref.description }))
          : defaultResult.legalReferences,
      }
    } catch (e) {
      console.error('legal chat parse failed:', e)
      // 파싱 실패 시 원본 텍스트를 summary로 사용 (fallback)
      return {
        ...defaultResult,
        summary: raw.length > 500 ? raw.substring(0, 500) + '...' : raw,
      }
    }
  }

  // 마크다운을 파싱하여 구조화된 데이터로 변환 (하위 호환성 유지)
  const parsed = useMemo(() => {
    // 먼저 JSON 파싱 시도
    const jsonParsed = safeParseLegalResponse(content)
    
    // JSON 파싱이 성공하고 summary가 있고, riskContent나 checklist가 있으면 JSON 형식으로 간주
    if (jsonParsed.summary && (jsonParsed.riskContent || jsonParsed.checklist.length > 0)) {
      return jsonParsed
    }

    // JSON 파싱 실패 또는 마크다운 형식인 경우 기존 마크다운 파싱 로직 사용
    const result: ParsedLegalResponse = {
      summary: jsonParsed.summary || '',
      riskLevel: jsonParsed.riskLevel,
      riskLevelDescription: jsonParsed.riskLevelDescription || '',
      riskContent: jsonParsed.riskContent || '',
      checklist: jsonParsed.checklist.length > 0 ? jsonParsed.checklist : [],
      negotiationPoints: {
        clauseModification: jsonParsed.negotiationPoints.clauseModification,
        conversationExamples: jsonParsed.negotiationPoints.conversationExamples.length > 0 
          ? jsonParsed.negotiationPoints.conversationExamples 
          : [],
      },
      legalReferences: jsonParsed.legalReferences.length > 0 ? jsonParsed.legalReferences : [],
    }

    if (!content) return result

    // 위험도 레벨 및 설명 추출 (다양한 패턴 지원)
    const riskLevelPatterns = [
      /위험도:\s*(경미|보통|높음)/i,
      /\[(경미|보통|높음)\]:\s*([^\n]+)/,  // [경미]: 설명
      /\[(경미|보통|높음)\]\s*([^\n]+)/,  // [경미] 설명
      /위험도:\s*(경미|보통|높음)\([^)]+\)/i,
    ]
    
    for (const pattern of riskLevelPatterns) {
      const match = content.match(pattern)
      if (match) {
        const level = match[1] as '경미' | '보통' | '높음'
        result.riskLevel = level
        // 설명 추출 (있는 경우)
        if (match[2]) {
          result.riskLevelDescription = match[2].trim()
        }
        break
      }
    }

    // 섹션별로 분리 (더 정확한 패턴)
    const sections = content.split(/(?=##\s)/)

    for (const section of sections) {
      // 요약 결론
      if (section.includes('## 요약 결론')) {
        const summaryMatch = section.match(/## 요약 결론\s*\n([\s\S]*?)(?=\n##|$)/)
        if (summaryMatch) {
          let summaryText = summaryMatch[1]
            .replace(/위험도:.*/i, '')
            .replace(/\[(경미|보통|높음)\]:\s*/g, '')
            .replace(/요약|리스크|협상|체크/g, '') // 탭 라벨 제거
            .trim()
          result.summary = summaryText
        }
      }

      // 왜 위험한지 (더 넓은 패턴 매칭)
      if (section.includes('## 왜 위험한지') || 
          section.includes('## 법적') || 
          section.includes('## 리스크')) {
        const riskMatch = section.match(/## [^#]+\n([\s\S]*?)(?=\n##|$)/)
        if (riskMatch) {
          let riskText = riskMatch[1]
            .replace(/요약|리스크|협상|체크/g, '') // 탭 라벨 제거
            .trim()
          
          // 빈 내용이 아닌 경우만 저장
          if (riskText.length > 10) {
            result.riskContent = riskText
          }
        }
      }

      // 체크리스트
      if (section.includes('## 체크리스트')) {
        const checklistMatch = section.match(/## 체크리스트\s*\n([\s\S]*?)(?=\n##|$)/)
        if (checklistMatch) {
          const checklistText = checklistMatch[1]
          // bullet point 추출 (더 정확한 패턴)
          const items = checklistText
            .split(/\n/)
            .map(line => {
              // 탭 라벨 제거
              line = line.replace(/요약|리스크|협상|체크/g, '')
              // bullet 제거
              line = line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim()
              return line
            })
            .filter(line => line.length > 0 && !line.startsWith('##') && !line.match(/^위험도:/i))
          result.checklist = items
        }
      }

      // 실무 협상 포인트
      if (section.includes('## 실무 협상 포인트')) {
        const negotiationMatch = section.match(/## 실무 협상 포인트\s*\n([\s\S]*?)(?=\n##|$)/)
        if (negotiationMatch) {
          let negotiationText = negotiationMatch[1]
            .replace(/요약|리스크|협상|체크/g, '') // 탭 라벨 제거
          
          // 조항 수정 예시 추출 (더 넓은 패턴)
          const modificationPatterns = [
            /기존[:\s]*["']([^"']+)["']/i,
            /수정안[:\s]*["']([^"']+)["']/i,
            /기존:\s*([^\n]+)/i,
            /수정안:\s*([^\n]+)/i,
          ]
          
          for (const pattern of modificationPatterns) {
            const match = negotiationText.match(pattern)
            if (match && match[1].length > 10) {
              result.negotiationPoints.clauseModification = match[1].trim()
              break
            }
          }

          // 협상 문장 예시 추출 (따옴표, 인용구 등 다양한 패턴)
          const examplePatterns = [
            /["']([^"']{30,})["']/g,  // 따옴표
            /^-\s*["']([^"']{30,})["']/gm,  // bullet + 따옴표
            /^[0-9]+\.\s*["']([^"']{30,})["']/gm,  // 번호 + 따옴표
          ]
          
          const allExamples: string[] = []
          for (const pattern of examplePatterns) {
            const matches = negotiationText.match(pattern)
            if (matches) {
              allExamples.push(...matches.map(m => m.replace(/^[-*•0-9.\s]+["']|["']$/g, '').trim()))
            }
          }
          
          // 중복 제거 및 필터링
          result.negotiationPoints.conversationExamples = Array.from(new Set(allExamples))
            .filter(text => text.length > 20 && !text.includes('##'))
        }
      }

      // 참고 법령/표준 계약 (더 정확한 파싱)
      if (section.includes('## 참고 법령') || section.includes('## 참고')) {
        const legalMatch = section.match(/## [^#]+\n([\s\S]*?)(?=\n---|$)/)
        if (legalMatch) {
          const legalText = legalMatch[1]
            .replace(/요약|리스크|협상|체크/g, '') // 탭 라벨 제거
          
          // 다양한 패턴으로 법령 추출
          const lawPatterns = [
            /\*\*([^*]+)\*\*[:\s]*\n?([^\n]+)/g,  // **법령명**: 설명
            /^-\s*\*\*([^*]+)\*\*[:\s]*\n?([^\n]+)/gm,  // - **법령명**: 설명
            /([가-힣\s]+법\s*제\d+조[^:]*):\s*([^\n]+)/g,  // 법령명: 설명
          ]
          
          const allRefs: Array<{ name: string; description: string }> = []
          
          for (const pattern of lawPatterns) {
            const matches = legalText.matchAll(pattern)
            for (const match of matches) {
              if (match[1] && match[2]) {
                allRefs.push({
                  name: match[1].trim(),
                  description: match[2].trim(),
                })
              }
            }
          }
          
          // 중복 제거
          const uniqueRefs = Array.from(
            new Map(allRefs.map(ref => [ref.name, ref])).values()
          ).filter(ref => ref.name.length > 3 && ref.description.length > 5)
          
          result.legalReferences = uniqueRefs
        }
      }
    }

    return result
  }, [content])

  // 복사 기능
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(text)
    setTimeout(() => setCopiedText(null), 2000)
  }

  // 위험도 배지 색상
  const getRiskBadgeColor = (level: string | null) => {
    switch (level) {
      case '높음':
        return 'bg-red-100 text-red-700 border-red-200'
      case '보통':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case '경미':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200'
    }
  }

  // 카테고리 라벨
  const categoryLabel = selectedIssue?.category
    ? {
        pay: '보수·수당',
        wage: '보수·수당',
        working_hours: '근로시간',
        leave: '연차·휴가',
        termination: '해지·해고',
        non_compete: '경업금지',
        nda: '비밀유지',
        ip: '저작권',
      }[selectedIssue.category] || selectedIssue.category
    : '계약 조항'

  return (
    <div className="w-full space-y-3">
      {/* 상단 헤더: 조항 정보 + 위험도 배지 */}
      <div className="flex items-start justify-between gap-3 p-3 bg-gradient-to-r from-slate-50 to-blue-50/30 rounded-lg border border-slate-200">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <div className="p-1.5 bg-blue-100 rounded-lg flex-shrink-0">
            <Scale className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-slate-500 mb-1">검토 중인 조항</div>
            <div className="font-semibold text-sm text-slate-900 truncate">
              {selectedIssue?.summary || categoryLabel}
            </div>
          </div>
        </div>
        {parsed.riskLevel && (
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold border',
                getRiskBadgeColor(parsed.riskLevel)
              )}
            >
              {parsed.riskLevel === '높음' && <AlertTriangle className="w-3 h-3" />}
              {parsed.riskLevel === '보통' && <AlertTriangle className="w-3 h-3" />}
              {parsed.riskLevel === '경미' && <CheckCircle2 className="w-3 h-3" />}
              {parsed.riskLevel}
              {parsed.riskLevel === '높음' && '(삭제/수정 권장)'}
              {parsed.riskLevel === '보통' && '(주의/협상 권장)'}
              {parsed.riskLevel === '경미' && '(주의 필요)'}
            </span>
            {parsed.riskLevelDescription && (
              <div className="text-xs text-slate-600 text-right max-w-[200px] leading-tight">
                {parsed.riskLevelDescription}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 탭 영역 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-slate-100">
          <TabsTrigger value="summary" className="text-xs py-2">
            요약
          </TabsTrigger>
          <TabsTrigger value="risk" className="text-xs py-2">
            리스크
          </TabsTrigger>
          <TabsTrigger value="deal" className="text-xs py-2">
            협상
          </TabsTrigger>
          <TabsTrigger value="check" className="text-xs py-2">
            체크
          </TabsTrigger>
        </TabsList>

        {/* 요약 탭 */}
        <TabsContent value="summary" className="mt-3 space-y-2">
          {selectedIssue?.summary && (
            <div className="text-xs text-slate-500 mb-2">
              검토 중인 조항: <span className="font-medium text-slate-700">{selectedIssue.summary}</span>
            </div>
          )}
          {parsed.summary ? (
            <div className="text-sm text-slate-700 leading-relaxed">
              <MarkdownRenderer content={parsed.summary} />
            </div>
          ) : (
            <div className="text-sm text-slate-500 italic">요약 정보를 불러오는 중...</div>
          )}
        </TabsContent>

        {/* 리스크 탭 */}
        <TabsContent value="risk" className="mt-3 space-y-3">
          {parsed.riskLevel && (
            <div className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 bg-slate-100 text-xs text-slate-700">
              <span className="font-semibold">위험도: {parsed.riskLevel}</span>
              {parsed.riskLevelDescription && (
                <span className="text-[11px] text-slate-500">· {parsed.riskLevelDescription}</span>
              )}
            </div>
          )}
          {parsed.riskContent ? (
            <div className="text-sm text-slate-700 leading-relaxed">
              <MarkdownRenderer content={parsed.riskContent} />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm text-slate-600 leading-relaxed">
                해당 조항은 법적 분쟁 가능성은 크지 않지만, 다음 사항은 체크해 보세요.
              </div>
              {parsed.checklist.length > 0 && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-semibold text-slate-700 mb-2">확인 사항:</div>
                  <ul className="space-y-1.5">
                    {parsed.checklist.slice(0, 3).map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                        <CheckSquare className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* 협상 포인트 탭 */}
        <TabsContent value="deal" className="mt-3 space-y-4">
          {/* 조항 수정 예시 */}
          {parsed.negotiationPoints.clauseModification && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <FileText className="w-4 h-4" />
                조항 수정 제안
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm text-slate-700">
                {parsed.negotiationPoints.clauseModification}
              </div>
            </div>
          )}

          {/* 협상 문장 예시 */}
          {parsed.negotiationPoints.conversationExamples.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <MessageSquare className="w-4 h-4" />
                이렇게 말해볼 수 있어요
              </div>
              <div className="space-y-2">
                {parsed.negotiationPoints.conversationExamples.map((example, index) => (
                  <div
                    key={index}
                    className="relative group p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100 text-sm text-slate-700 leading-relaxed"
                  >
                    <div className="pr-8">{example}</div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(example)}
                      className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="복사"
                    >
                      <Copy className={cn('w-3.5 h-3.5', copiedText === example && 'text-green-600')} />
                    </Button>
                    {copiedText === example && (
                      <div className="absolute top-2 right-8 text-xs text-green-600 font-medium">
                        복사됨!
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsed.negotiationPoints.conversationExamples.length === 0 && !parsed.negotiationPoints.clauseModification && (
            <div className="text-sm text-slate-500">협상 포인트 정보가 없습니다.</div>
          )}
        </TabsContent>

        {/* 체크리스트 탭 */}
        <TabsContent value="check" className="mt-3 space-y-2">
          {parsed.checklist.length > 0 ? (
            <ul className="space-y-2">
              {parsed.checklist.map((item, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckSquare className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                  <span className="flex-1 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-slate-500">체크리스트 항목이 없습니다.</div>
          )}
        </TabsContent>
      </Tabs>

      {/* 참고 법령 (하단 고정) */}
      <div className="mt-4 pt-4 border-t border-slate-200 space-y-2">
        <div className="text-xs font-semibold text-slate-700 mb-2">참고 법령/표준 계약</div>
        {parsed.legalReferences.length > 0 ? (
          <div className="space-y-2">
            {parsed.legalReferences.map((ref, index) => (
              <div key={index} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-semibold text-sm text-slate-900 mb-1">{ref.name}</div>
                <div className="text-xs text-slate-600 leading-relaxed">{ref.description}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-xs text-slate-600 leading-relaxed">
              {selectedIssue?.category === 'pay' || selectedIssue?.category === 'wage' 
                ? '이 조항은 주로 근로기준법 제17조(근로조건의 명시), 제43조(임금 지급 원칙), 제56조(연장·야간·휴일근로 가산수당)와 관련됩니다.'
                : '이 조항은 일반적인 근로계약 관련 법령과 관련됩니다. 구체적인 법령 정보는 위 리스크 섹션을 참고하세요.'}
            </div>
          </div>
        )}
      </div>

      {/* 파싱 실패 시 fallback: 기존 마크다운 렌더링 */}
      {!parsed.summary && !parsed.riskContent && (
        <div className="text-sm text-slate-700 leading-relaxed">
          <MarkdownRenderer content={content} />
        </div>
      )}
    </div>
  )
}

