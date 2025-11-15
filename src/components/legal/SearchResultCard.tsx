'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, AlertTriangle, Lightbulb } from 'lucide-react'

interface SearchResult {
  scenario: string
  riskLevel: 'high' | 'medium' | 'low'
  legalBasis: string
  recommendation: string
  relatedLaws?: string[]
}

interface SearchResultCardProps {
  result: SearchResult
}

export function SearchResultCard({ result }: SearchResultCardProps) {
  const riskColors = {
    high: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200',
      label: '높음',
    },
    medium: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200',
      label: '보통',
    },
    low: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200',
      label: '낮음',
    },
  }

  const colors = riskColors[result.riskLevel]

  return (
    <Card className={`${colors.border} border-2 hover:shadow-lg transition-shadow`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg flex-1">{result.scenario}</CardTitle>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors.text} ${colors.bg}`}>
            {colors.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 법적 근거 */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <h4 className="font-medium text-blue-900">법적 근거</h4>
          </div>
          <p className="text-sm text-blue-800 ml-7">{result.legalBasis}</p>
        </div>

        {/* 추천 대응 */}
        <div className="bg-emerald-50 p-4 rounded-lg">
          <div className="flex items-start gap-2 mb-2">
            <Lightbulb className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <h4 className="font-medium text-emerald-900">추천 대응 방법</h4>
          </div>
          <p className="text-sm text-emerald-800 ml-7">{result.recommendation}</p>
        </div>

        {/* 관련 법률 */}
        {result.relatedLaws && result.relatedLaws.length > 0 && (
          <div className="bg-slate-50 p-4 rounded-lg">
            <div className="flex items-start gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
              <h4 className="font-medium text-slate-900">관련 법률</h4>
            </div>
            <ul className="list-disc list-inside text-sm text-slate-700 ml-7 space-y-1">
              {result.relatedLaws.map((law, index) => (
                <li key={index}>{law}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

