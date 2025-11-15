'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, AlertTriangle, CheckCircle2, ArrowLeft, MessageSquare } from 'lucide-react'
import { analyzeLegalSituation } from '@/apis/legal.service'

interface RiskIssue {
  title: string
  description: string
  legalBasis?: string
  recommendation?: string
}

export default function SituationAnalysisPage() {
  const router = useRouter()
  const [situation, setSituation] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [riskScore, setRiskScore] = useState<number | null>(null)
  const [riskIssues, setRiskIssues] = useState<RiskIssue[]>([])
  const [checklist, setChecklist] = useState<string[]>([])

  const handleAnalyze = async () => {
    if (!situation.trim()) {
      alert('상황을 입력해주세요.')
      return
    }

    if (situation.trim().length < 10) {
      alert('최소 10자 이상 입력해주세요.')
      return
    }

    setIsAnalyzing(true)
    try {
      const result = await analyzeLegalSituation(situation.trim())
      
      setRiskScore(result.risk_score)
      
      const issues: RiskIssue[] = result.issues.map((issue) => ({
        title: issue.name,
        description: issue.description,
        legalBasis: issue.legal_basis.join(', '),
        recommendation: result.recommendations
          .find((rec) => rec.title.includes(issue.name) || issue.name.includes(rec.title))
          ?.description,
      }))
      
      setRiskIssues(issues)
      
      // 체크리스트 생성 (권장사항에서 추출)
      const checklistItems = result.recommendations
        .map((rec) => rec.description)
        .filter((desc) => desc.length < 100) // 짧은 설명만 체크리스트로
        .slice(0, 5)
      
      setChecklist(checklistItems)
    } catch (error: any) {
      console.error('분석 오류:', error)
      alert(error.message || '분석 중 오류가 발생했습니다.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getRiskColor = (score: number) => {
    if (score <= 30) return 'bg-green-500'
    if (score <= 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getRiskStatus = (score: number) => {
    if (score <= 30) return '위험이 낮습니다'
    if (score <= 70) return '주의가 필요합니다'
    return '위험이 매우 높습니다'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-6 py-12 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/legal')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
          <h1 className="text-4xl md:text-5xl font-bold mb-3 text-slate-900">
            상황 설명 분석
          </h1>
          <p className="text-lg text-slate-600">
            현재 겪고 있는 상황을 간단히 적어주세요. AI가 법적 리스크를 분석하고 대응 방법을 안내합니다.
          </p>
        </div>

        {/* Input Form */}
        {riskScore === null && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>상황 설명</CardTitle>
              <CardDescription>
                예) 수습 중인데, 갑자기 해고 통보만 받았어요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="예) 수습 중인데, 갑자기 해고 통보만 받았어요."
                className="min-h-[200px] text-base"
                required
              />
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-slate-500">
                  최소 10자 이상 입력해주세요. ({situation.length}자)
                </p>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || situation.trim().length < 10}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-5 h-5 mr-2" />
                      AI 분석하기
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {riskScore !== null && (
          <div className="space-y-6">
            {/* Risk Score */}
            <Card>
              <CardHeader>
                <CardTitle>위험도</CardTitle>
                <CardDescription>상황 분석 결과입니다.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-slate-900">{riskScore}%</span>
                    <span className={`text-lg font-semibold ${
                      riskScore <= 30 ? 'text-green-600' :
                      riskScore <= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {getRiskStatus(riskScore)}
                    </span>
                  </div>
                  <div className="relative h-6 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full transition-all ${getRiskColor(riskScore)}`}
                      style={{ width: `${riskScore}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk Issues */}
            {riskIssues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>위험 신호 리스트</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {riskIssues.map((issue, index) => (
                    <div key={index} className="border-l-4 border-l-red-500 pl-4 py-2">
                      <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        {issue.title}
                      </h3>
                      <p className="text-slate-700 mb-2">{issue.description}</p>
                      {issue.legalBasis && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                          <p className="text-sm font-semibold text-blue-900 mb-1">법적 근거</p>
                          <p className="text-sm text-blue-800">{issue.legalBasis}</p>
                        </div>
                      )}
                      {issue.recommendation && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mt-2">
                          <p className="text-sm font-semibold text-emerald-900 mb-1">권장 대응 방법</p>
                          <p className="text-sm text-emerald-800">{issue.recommendation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Checklist */}
            {checklist.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>상황별 대응 체크리스트</CardTitle>
                  <CardDescription>
                    다음 단계를 순서대로 진행하세요.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {checklist.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold">
                          {index + 1}
                        </div>
                        <p className="text-slate-700 flex-1">{item}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setSituation('')
                  setRiskScore(null)
                  setRiskIssues([])
                  setChecklist([])
                }}
                variant="outline"
                className="flex-1"
              >
                다시 분석하기
              </Button>
              <Button
                onClick={() => router.push('/legal')}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                홈으로 돌아가기
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

