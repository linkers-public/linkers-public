'use client'

import { Loader2 } from 'lucide-react'
import type { QueryResponse } from '@/types/rag'
import { MarkdownTable } from '@/components/rag/MarkdownTable'
import {
  TechStackCard,
  BudgetCard,
  PeriodCard,
} from '@/components/rag/AnalysisSummaryCard'

interface RAGQueryResultViewProps {
  analysis: QueryResponse | null
  loading?: boolean
  onShowEvidence?: (chunkId: number) => void
}

export default function RAGQueryResultView({
  analysis,
  loading = false,
  onShowEvidence,
}: RAGQueryResultViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!analysis) {
    return null
  }

  // 분석 결과에서 정보 추출 (간단한 파싱)
  const extractInfo = () => {
    if (!analysis?.answer) return null

    const answer = analysis.answer
    const techStack: string[] = []
    const budget: { min?: number; max?: number; evidenceId?: number } = {}
    const period: { months?: number; evidenceId?: number } = {}

    // 간단한 파싱 (실제로는 더 정교한 파싱 필요)
    const techKeywords = ['React', 'Node.js', 'Python', 'Java', 'AWS', 'Docker', 'TypeScript', 'Vue', 'Angular', 'Spring', 'Django']
    techKeywords.forEach((tech) => {
      if (answer.includes(tech)) techStack.push(tech)
    })

    const budgetMatch = answer.match(/(\d+)\s*만?원?\s*[~-]\s*(\d+)\s*만?원?/i)
    if (budgetMatch) {
      budget.min = parseInt(budgetMatch[1]) * 10000
      budget.max = parseInt(budgetMatch[2]) * 10000
    }

    const periodMatch = answer.match(/(\d+)\s*개월/i)
    if (periodMatch) {
      period.months = parseInt(periodMatch[1])
    }

    // 근거 ID 추출
    const evidenceIds = answer.match(/\[id:(\d+)\]/g)?.map((m) => parseInt(m.replace(/\[id:|\]/g, ''))) || []
    if (evidenceIds.length > 0) {
      budget.evidenceId = evidenceIds[0]
      period.evidenceId = evidenceIds[0]
    }

    return { techStack, budget, period }
  }

  const info = extractInfo()

  return (
    <div className="space-y-6">
      {/* 추출된 정보 카드들 */}
      {info?.techStack && info.techStack.length > 0 && (
        <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-sm">
          <h3 className="text-lg font-semibold mb-4">요구기술</h3>
          <div className="flex flex-wrap gap-2">
            {info.techStack.map((tech, i) => (
              <span
                key={i}
                className="inline-flex items-center px-3 py-1 rounded-xl text-sm font-medium bg-blue-100 text-blue-700 border border-blue-200"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {info?.budget && (info.budget.min || info.budget.max) && (
        <BudgetCard
          min={info.budget.min}
          max={info.budget.max}
          evidenceId={info.budget.evidenceId}
        />
      )}

      {info?.period && info.period.months && (
        <PeriodCard
          months={info.period.months}
          evidenceId={info.period.evidenceId}
        />
      )}

      {/* 상세 분석 결과 */}
      {analysis.answer && (
        <div className="rounded-2xl border border-slate-200 p-5 bg-white shadow-sm">
          <h3 className="text-lg font-semibold mb-4">상세 분석</h3>
          
          {/* 표가 있는 경우 표로 렌더링 */}
          <MarkdownTable content={analysis.answer} />
          
          {/* 일반 텍스트 렌더링 */}
          <div 
            className="prose max-w-none text-sm text-slate-700 whitespace-pre-wrap mt-4"
            dangerouslySetInnerHTML={{ 
              __html: analysis.answer
                .replace(/\|.+\|[\n\r]+/g, '') // 표 제거 (표는 별도 컴포넌트로 렌더링)
                .replace(/\n/g, '<br />')
                .replace(/\[id:(\d+)\]/g, '<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-blue-100 text-blue-700 border border-blue-200">[id:$1]</span>')
            }}
          />
        </div>
      )}
    </div>
  )
}

