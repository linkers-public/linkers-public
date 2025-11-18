'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Zap, 
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  Copy,
  Phone,
  FileText,
  ArrowRight,
  ArrowLeft,
  Info,
  Scale,
  Clock,
  Shield,
  ChevronRight,
  Search,
  Briefcase,
  DollarSign,
  Users,
  TrendingUp,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { analyzeSituationV2, type SituationRequestV2, type SituationResponseV2 } from '@/apis/legal.service'
import type { SituationAnalysisResponse } from '@/types/legal'
import { EvidenceGuideModal } from '@/components/legal/EvidenceGuideModal'

// 대표 질문 버튼 (카테고리별 분류)
const QUICK_QUESTIONS = [
  // 해고 관련
  {
    text: '수습 중 해고가 가능한가요?',
    category: 'probation' as const,
    icon: Briefcase,
    tags: ['수습', '해고'],
  },
  {
    text: '이 상황이 불법인가요?',
    category: 'unfair_dismissal' as const,
    icon: AlertTriangle,
    tags: ['해고', '불법'],
  },
  {
    text: '정규직인데 갑자기 해고 통보를 받았어요',
    category: 'unfair_dismissal' as const,
    icon: AlertTriangle,
    tags: ['정규직', '해고'],
  },
  // 임금 관련
  {
    text: '포괄임금제 거절해도 되나요?',
    category: 'unpaid_wage' as const,
    icon: DollarSign,
    tags: ['포괄임금', '임금'],
  },
  {
    text: '야근 수당이 안 들어와요',
    category: 'unpaid_wage' as const,
    icon: DollarSign,
    tags: ['야근', '수당'],
  },
  {
    text: '프리랜서 대금 체불 대응 어떻게 하나요?',
    category: 'unpaid_wage' as const,
    icon: DollarSign,
    tags: ['프리랜서', '체불'],
  },
  {
    text: '월급이 계속 늦게 들어와요',
    category: 'unpaid_wage' as const,
    icon: DollarSign,
    tags: ['월급', '체불'],
  },
  // 근로시간 관련
  {
    text: '주 52시간을 초과해서 일하는데 괜찮나요?',
    category: 'overtime' as const,
    icon: Clock,
    tags: ['근로시간', '52시간'],
  },
  {
    text: '야근은 매일인데 수당은 없어요',
    category: 'overtime' as const,
    icon: Clock,
    tags: ['야근', '수당'],
  },
  // 괴롭힘 관련
  {
    text: '상사가 모욕적인 말을 해요',
    category: 'harassment' as const,
    icon: Users,
    tags: ['괴롭힘', '모욕'],
  },
  {
    text: '직장 내 괴롭힘 신고를 해야 하나요?',
    category: 'harassment' as const,
    icon: Users,
    tags: ['괴롭힘', '신고'],
  },
  // 스톡옵션/IP 관련
  {
    text: '스톡옵션 행사 조건이 이상해요',
    category: 'unknown' as const,
    icon: TrendingUp,
    tags: ['스톡옵션'],
  },
  {
    text: '회사가 내 IP를 가져가려고 해요',
    category: 'unknown' as const,
    icon: FileText,
    tags: ['IP', '저작권'],
  },
  {
    text: 'NDA 계약서에 서명해야 하나요?',
    category: 'unknown' as const,
    icon: FileText,
    tags: ['NDA', '비밀유지'],
  },
]

// 위험도 라벨
const getRiskLabel = (score: number) => {
  if (score <= 30) return { label: '위험이 낮습니다', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-300', icon: CheckCircle2 }
  if (score <= 70) return { label: '주의가 필요합니다', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', icon: AlertTriangle }
  return { label: '위험이 매우 높습니다', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-300', icon: AlertTriangle }
}

// Burden Type 자동 분류 (간단한 키워드 기반)
const classifyBurdenType = (text: string): string => {
  const lowerText = text.toLowerCase()
  if (lowerText.includes('임금') || lowerText.includes('수당') || lowerText.includes('월급') || lowerText.includes('체불')) {
    return '임금'
  }
  if (lowerText.includes('시간') || lowerText.includes('야근') || lowerText.includes('근무') || lowerText.includes('휴게')) {
    return '시간'
  }
  if (lowerText.includes('해고') || lowerText.includes('해지') || lowerText.includes('계약')) {
    return '해고'
  }
  if (lowerText.includes('괴롭힘') || lowerText.includes('모욕') || lowerText.includes('성희롱')) {
    return '괴롭힘'
  }
  if (lowerText.includes('nda') || lowerText.includes('비밀유지')) {
    return 'NDA'
  }
  if (lowerText.includes('ip') || lowerText.includes('저작권') || lowerText.includes('지적재산')) {
    return 'IP'
  }
  return '기타'
}

// 긴급 조치 텍스트 가져오기
const getUrgencyText = (urgencyLevel: string | undefined) => {
  if (!urgencyLevel) return ''
  if (urgencyLevel === '즉시 조치 필요') return '⚠️ 즉시 조치 필요'
  if (urgencyLevel === '진행 중 위험') return '⏱ 진행 중 위험'
  return '🟢 모니터링 추천'
}

// 카테고리 배지 색상
const getCategoryBadge = (category: string) => {
  const categoryMap: Record<string, { emoji: string; color: string; bg: string; label: string }> = {
    '해고': { emoji: '🟥', color: 'text-red-700', bg: 'bg-red-50', label: '부당해고 의심' },
    '괴롭힘': { emoji: '🟧', color: 'text-orange-700', bg: 'bg-orange-50', label: '직장 내 괴롭힘 가능성' },
    '임금': { emoji: '🟦', color: 'text-blue-700', bg: 'bg-blue-50', label: '임금체불' },
    '시간': { emoji: '🟨', color: 'text-yellow-700', bg: 'bg-yellow-50', label: '근로시간 위반' },
    '기타': { emoji: '🟩', color: 'text-green-700', bg: 'bg-green-50', label: '기타 법적 문제' },
  }
  return categoryMap[category] || categoryMap['기타']
}

// 긴급 조치 필요 여부 판단
const getUrgencyLevel = (score: number) => {
  if (score > 70) {
    return { 
      level: '즉시 조치 필요', 
      icon: AlertTriangle, 
      color: 'text-red-700', 
      bg: 'bg-red-50', 
      border: 'border-red-300' 
    }
  }
  if (score > 40) {
    return { 
      level: '진행 중 위험', 
      icon: Clock, 
      color: 'text-amber-700', 
      bg: 'bg-amber-50', 
      border: 'border-amber-300' 
    }
  }
  return { 
    level: '모니터링 추천', 
    icon: CheckCircle2, 
    color: 'text-green-700', 
    bg: 'bg-green-50', 
    border: 'border-green-300' 
  }
}

export default function QuickAssistPage() {
  const router = useRouter()
  const { toast } = useToast()

  const [question, setQuestion] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<SituationAnalysisResponse | null>(null)
  const [burdenType, setBurdenType] = useState<string>('')
  const [riskScore, setRiskScore] = useState<number | null>(null)
  const [showEvidenceGuide, setShowEvidenceGuide] = useState(false)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [questionSearch, setQuestionSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const handleQuickQuestion = (quickQuestion: typeof QUICK_QUESTIONS[0]) => {
    setQuestion(quickQuestion.text)
    setBurdenType(classifyBurdenType(quickQuestion.text))
    setQuestionSearch('') // 검색어 초기화
  }

  // 질문 필터링
  const filteredQuestions = QUICK_QUESTIONS.filter(q => {
    const matchesSearch = questionSearch.trim() === '' || 
      q.text.toLowerCase().includes(questionSearch.toLowerCase()) ||
      q.tags.some(tag => tag.toLowerCase().includes(questionSearch.toLowerCase()))
    const matchesCategory = !selectedCategory || q.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // 카테고리 목록
  const categories = [
    { value: null, label: '전체', count: QUICK_QUESTIONS.length },
    { value: 'probation', label: '수습/해고', count: QUICK_QUESTIONS.filter(q => q.category === 'probation').length },
    { value: 'unfair_dismissal', label: '부당해고', count: QUICK_QUESTIONS.filter(q => q.category === 'unfair_dismissal').length },
    { value: 'unpaid_wage', label: '임금/수당', count: QUICK_QUESTIONS.filter(q => q.category === 'unpaid_wage').length },
    { value: 'overtime', label: '근로시간', count: QUICK_QUESTIONS.filter(q => q.category === 'overtime').length },
    { value: 'harassment', label: '괴롭힘', count: QUICK_QUESTIONS.filter(q => q.category === 'harassment').length },
  ]

  const handleAnalyze = async () => {
    if (!question.trim()) {
      toast({
        title: '질문을 입력해주세요',
        description: '무엇이 걱정되시는지 입력해주세요.',
        variant: 'destructive',
      })
      return
    }

    setIsAnalyzing(true)
    setBurdenType(classifyBurdenType(question))

    try {
      // v2 API 요청 형식
      const request: SituationRequestV2 = {
        situation: question.trim(),
        category: 'unknown',
      }

      const result = await analyzeSituationV2(request)
      
      // v2 응답을 v1 형식으로 변환 (기존 UI 호환성)
      const v1Format: SituationAnalysisResponse = {
        classifiedType: result.tags[0] || 'unknown',
        riskScore: result.riskScore,
        summary: result.analysis.summary,
        criteria: result.analysis.legalBasis.map(basis => ({
          name: basis.title,
          status: 'likely' as const,
          reason: basis.snippet,
        })),
        actionPlan: {
          steps: [
            {
              title: '즉시 조치',
              items: result.checklist.slice(0, 3),
            },
            {
              title: '권고사항',
              items: result.analysis.recommendations,
            },
          ],
        },
        scripts: {
          toCompany: undefined,
          toAdvisor: undefined,
        },
        relatedCases: result.relatedCases.map(c => ({
          id: c.id,
          title: c.title,
          summary: c.summary,
        })),
      }
      
      setAnalysisResult(v1Format)
      setRiskScore(result.riskScore)
      
      // 위험도가 높으면 증거 수집 가이드 자동 팝업
      if (result.riskScore > 70) {
        setTimeout(() => {
          setShowEvidenceGuide(true)
        }, 1000)
      }
    } catch (error: any) {
      console.error('분석 오류:', error)
      toast({
        title: '분석 실패',
        description: error.message || '분석 중 오류가 발생했습니다.',
        variant: 'destructive',
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCopy = (text: string, description: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: '복사 완료',
      description,
    })
  }

  const toggleCheckItem = (itemKey: string) => {
    const newSet = new Set(checkedItems)
    if (newSet.has(itemKey)) {
      newSet.delete(itemKey)
    } else {
      newSet.add(itemKey)
    }
    setCheckedItems(newSet)
  }

  // 분석 결과 렌더링을 위한 변수 준비
  const categoryBadge = analysisResult ? getCategoryBadge(burdenType || '기타') : null
  const riskInfo = riskScore !== null ? getRiskLabel(riskScore) : null
  const RiskIcon = riskInfo?.icon
  
  // 긴급 조치 필요 여부 계산
  const urgency = riskScore !== null ? getUrgencyLevel(riskScore) : null
  const UrgencyIcon = urgency?.icon
  const urgencyText = urgency?.level ? getUrgencyText(urgency.level) : ''

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/legal/assist')}
            className="mb-6 text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            상담 허브로 돌아가기
          </Button>
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full mb-4 shadow-lg">
              <Zap className="w-5 h-5" />
              <span className="font-semibold">즉시 상담</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              무엇이 걱정되시나요?
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
              자연어 질문만으로 법적 위험도·조항·상황 유형을 자동 분류하고,
              <br />
              위반 가능성과 핵심 권리, 조문 근거를 즉시 요약해드립니다.
            </p>
          </div>
        </div>

        {/* 입력 영역 */}
        {!analysisResult && (
          <div className="space-y-6">
            {/* 큰 입력창 (ChatGPT 스타일) */}
            <Card className="border-2 border-blue-200 shadow-xl bg-white">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Textarea
                    value={question}
                    onChange={(e) => {
                      setQuestion(e.target.value)
                      setBurdenType(classifyBurdenType(e.target.value))
                    }}
                    placeholder="예: 수습 중인데 갑자기 해고 통보를 받았어요. 이게 합법인가요?"
                    className="min-h-[200px] text-base border-2 border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-xl resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {burdenType && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {burdenType} 관련
                        </span>
                      )}
                    </div>
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing || !question.trim()}
                      className={cn(
                        "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg",
                        "disabled:opacity-50 disabled:cursor-not-allowed"
                      )}
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          분석 중...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          분석 받기
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 대표 질문 버튼 - 강화된 버전 */}
            <Card className="border-2 border-slate-200 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between mb-4">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-blue-600" />
                    자주 묻는 질문
                  </CardTitle>
                  <span className="text-xs text-slate-500">
                    {filteredQuestions.length}개 질문
                  </span>
                </div>
                
                {/* 검색 및 필터 */}
                <div className="space-y-3">
                  {/* 검색창 */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      placeholder="질문 검색... (예: 해고, 임금, 야근)"
                      className="pl-10 h-10 text-sm border-2 border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                    {questionSearch && (
                      <button
                        onClick={() => setQuestionSearch('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-slate-100 rounded"
                      >
                        <X className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                  </div>

                  {/* 카테고리 필터 */}
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <button
                        key={cat.value || 'all'}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
                          selectedCategory === cat.value
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                            : "bg-white border-2 border-slate-300 text-slate-700 hover:border-blue-400 hover:bg-blue-50"
                        )}
                      >
                        {cat.label} ({cat.count})
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredQuestions.length === 0 ? (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm text-slate-600">
                      검색 결과가 없습니다. 다른 키워드로 검색해보세요.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {filteredQuestions.map((q, index) => {
                      const Icon = q.icon
                      return (
                        <button
                          key={index}
                          onClick={() => handleQuickQuestion(q)}
                          className="p-4 text-left border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all bg-white group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors flex-shrink-0">
                              <Icon className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-900 mb-2 leading-relaxed">
                                {q.text}
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {q.tags.map((tag, tagIndex) => (
                                  <span
                                    key={tagIndex}
                                    className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium"
                                  >
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 분석 결과 */}
        {analysisResult && categoryBadge && (
          <div className="space-y-6">
            {/* ① 상단 결과 헤더 (AI 진단 박스) */}
            <Card className="border-2 border-blue-300 shadow-xl bg-gradient-to-br from-white to-blue-50/30">
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-4 flex-wrap mb-4">
                  <div
                    className={cn(
                      "px-5 py-3 border-2 rounded-xl shadow-sm flex items-center gap-2",
                      categoryBadge.bg,
                      categoryBadge.color
                    )}
                  >
                    <span className="text-2xl">{categoryBadge.emoji}</span>
                    <span className="text-base font-bold">{categoryBadge.label}</span>
                  </div>
                  {riskScore !== null && riskInfo && RiskIcon && (
                    <div
                      className={cn(
                        "px-5 py-3 border-2 rounded-xl shadow-sm flex items-center gap-2",
                        riskInfo.bg,
                        riskInfo.border
                      )}
                    >
                      <RiskIcon className="w-5 h-5" />
                      <span className="text-xs font-semibold uppercase tracking-wide mr-2">위험도:</span>
                      <span className={cn("text-base font-extrabold", riskInfo.color)}>
                        {riskInfo.label} ({riskScore}%)
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-base text-slate-700 leading-relaxed">
                    현재 상황은 <strong className="text-blue-700">{burdenType || '법적 문제'}</strong>에 해당하며,
                    법적 기준과 비교해 <strong className="text-red-700">위험도 {riskScore}%</strong>로 평가됩니다.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* ② 핵심 판단 카드 (3-4개) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 법적 판단 요약 카드 */}
              <Card className="border-2 border-blue-200 shadow-lg bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Scale className="w-4 h-4 text-blue-600" />
                    법적 판단 요약
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(analysisResult.criteria || []).slice(0, 2).map((criterion, index) => (
                      <p key={index} className="text-xs text-slate-700 leading-relaxed">
                        • {criterion.reason || criterion.name}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 현재 위험 수준 카드 */}
              {riskScore !== null && (
                <Card className="border-2 border-amber-200 shadow-lg bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-600" />
                      현재 위험 수준
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            riskScore > 70 ? "bg-red-500" : riskScore > 40 ? "bg-amber-500" : "bg-green-500"
                          )}
                          style={{ width: `${riskScore}%` }}
                        />
                      </div>
                      <p className="text-xs text-slate-600">
                        위험도: {riskScore}% ({riskScore > 70 ? '높음' : riskScore > 40 ? '중간' : '낮음'})
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 긴급 조치 필요 여부 카드 */}
              {riskScore !== null && urgency && UrgencyIcon && (
                <Card key="urgency-card" className={cn("border-2 shadow-lg", urgency.border, urgency.bg)}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <UrgencyIcon className={cn("w-4 h-4", urgency.color)} />
                      <span className={urgency.color}>긴급 조치 필요 여부</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={cn("text-sm font-semibold", urgency.color)}>
                      {urgencyText}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* 상황 태그 자동 추출 카드 */}
              <Card className="border-2 border-purple-200 shadow-lg bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    상황 태그
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {question.split(' ').filter(word => word.length > 2).slice(0, 5).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 법적 관점 요약 */}
            <Card className="border-2 border-blue-300 shadow-xl bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-3">
                  <Scale className="w-5 h-5 text-blue-600" />
                  <span className="font-bold">법적 관점 요약</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(analysisResult.criteria || []).map((criterion, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100 shadow-sm">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                        <span className="text-blue-600 font-bold text-xs">{index + 1}</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed flex-1">
                        {criterion.reason || `${criterion.name}: ${criterion.status === 'likely' ? '충족' : criterion.status === 'unclear' ? '부분 충족' : '불충족'}`}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ③ 증거 수집 체크리스트 */}
            <Card className="border-2 border-emerald-300 shadow-xl bg-gradient-to-br from-white to-emerald-50/30">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-3">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <span className="font-bold">증거 수집 체크리스트</span>
                </CardTitle>
                <p className="text-sm text-slate-600 mt-2">
                  완료한 항목은 체크해 두면, 다음에 다시 봐도 진행 상황을 기억하기 쉽습니다.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    '서면/카톡/이메일로 해고 통보 여부 확인',
                    '근로계약서 사본 확보',
                    '근무시간 기록(캘린더, 퇴근 로그, 메시지)',
                    '녹취가 필요한 경우 가능한 상황 여부 안내',
                    '5인 미만 사업장 여부 확인',
                    '급여명세서 및 수당 지급 내역',
                    '출퇴근 기록 및 근무일지',
                  ].map((item, index) => {
                    const itemKey = `evidence-${index}`
                    return (
                      <div
                        key={itemKey}
                        className={cn(
                          "flex items-start gap-4 p-4 bg-white border-2 rounded-xl transition-all cursor-pointer",
                          checkedItems.has(itemKey)
                            ? "border-emerald-400 bg-gradient-to-r from-emerald-50 to-green-50 shadow-md"
                            : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                        )}
                        onClick={() => toggleCheckItem(itemKey)}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleCheckItem(itemKey)
                          }}
                          className={cn(
                            "flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center mt-0.5 transition-all",
                            checkedItems.has(itemKey)
                              ? 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-600'
                              : 'border-slate-300 bg-white hover:border-emerald-400'
                          )}
                        >
                          {checkedItems.has(itemKey) && (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          )}
                        </button>
                        <p className={cn(
                          "flex-1 text-sm leading-relaxed",
                          checkedItems.has(itemKey) ? "text-emerald-900 font-medium" : "text-slate-700"
                        )}>
                          ☑︎ {item}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* ④ 다음 단계 액션 플로우 (3단계) */}
            <Card className="border-2 border-purple-300 shadow-xl bg-gradient-to-br from-white to-purple-50/30">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-3">
                  <ArrowRight className="w-5 h-5 text-purple-600" />
                  <span className="font-bold">다음 단계 액션 플로우</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* 1단계: 사실관계 정리 */}
                  <div className="border-2 border-blue-200 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        1
                      </div>
                      <h3 className="text-base font-bold text-slate-900">사실관계 정리</h3>
                    </div>
                    <ul className="space-y-2 ml-11">
                      {['해고 통보일자 정리', '수습기간 계약일 확인', '근무 기간 및 근무 시간 기록', '관련 문서 및 증거 수집'].map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="text-blue-600 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 2단계: 법적 절차 */}
                  <div className="border-2 border-amber-200 rounded-xl p-5 bg-gradient-to-br from-amber-50 to-orange-50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold">
                        2
                      </div>
                      <h3 className="text-base font-bold text-slate-900">법적 절차</h3>
                    </div>
                    <ul className="space-y-2 ml-11">
                      <li className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>노동청 신고 루트 확인</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>직장 내 괴롭힘 신고 양식 작성</span>
                      </li>
                      <li className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-amber-600 mt-1">•</span>
                        <span>노무사 상담 필요 여부 판단</span>
                      </li>
                    </ul>
                  </div>

                  {/* 3단계: 실제로 사용할 메시지 템플릿 */}
                  <div className="border-2 border-emerald-200 rounded-xl p-5 bg-gradient-to-br from-emerald-50 to-green-50">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                        3
                      </div>
                      <h3 className="text-base font-bold text-slate-900">실제로 사용할 메시지 템플릿</h3>
                    </div>
                    <div className="ml-11 space-y-4">
                      {analysisResult.scripts?.toCompany && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-2">회사에 전달할 메시지 예시:</p>
                          <div className="bg-white border-2 border-emerald-200 rounded-lg p-4">
                            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                              {analysisResult.scripts.toCompany}
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(analysisResult.scripts?.toCompany || '', '메시지 템플릿이 복사되었습니다')}
                            className="mt-2 border-emerald-300 hover:bg-emerald-50"
                          >
                            <Copy className="w-4 h-4 mr-1.5" />
                            바로 복사하기
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ⑤ 공공기관 바로가기 */}
            <Card className="border-2 border-blue-200 shadow-lg bg-white">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Phone className="w-5 h-5 text-blue-600" />
                  공공기관 바로가기
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={() => window.open('tel:1350')}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    고용노동부 전화 1350
                  </Button>
                  <Button
                    onClick={() => window.open('https://www.moel.go.kr/info/publict/publictNoticeView.do?bbs_seq=20241201001', '_blank')}
                    variant="outline"
                    className="w-full border-2 border-blue-300 hover:bg-blue-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    직장 내 괴롭힘 신고센터
                  </Button>
                  <Button
                    onClick={() => window.open('https://www.klac.or.kr/', '_blank')}
                    variant="outline"
                    className="w-full border-2 border-blue-300 hover:bg-blue-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    무료 노동상담센터
                  </Button>
                  <Button
                    onClick={() => window.open('https://www.klaf.or.kr/', '_blank')}
                    variant="outline"
                    className="w-full border-2 border-blue-300 hover:bg-blue-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    대한법률구조공단
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* ⑥ AI 챗 상담 이어가기 */}
            <Card className="border-2 border-purple-200 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  AI 챗 상담 이어가기
                </CardTitle>
                <p className="text-sm text-slate-600 mt-2">
                  추가로 궁금한 점이 있으시면 계속 질문하실 수 있습니다.
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuestion('이 상황에서 근로계약서도 같이 점검할래요')
                      setAnalysisResult(null)
                    }}
                    className="border-purple-300 hover:bg-purple-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    근로계약서 점검
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuestion('해고 대응 메시지 만들어줘')
                      setAnalysisResult(null)
                    }}
                    className="border-purple-300 hover:bg-purple-50"
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    해고 대응 메시지
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setQuestion('노무사에게 전달할 사건 요약 만들어줘')
                      setAnalysisResult(null)
                    }}
                    className="border-purple-300 hover:bg-purple-50"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    노무사 요약
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* 스크립트 및 행동 버튼 */}
            {(analysisResult.scripts?.toCompany || analysisResult.scripts?.toAdvisor) && (
              <Card className="border-2 border-purple-300 shadow-xl bg-gradient-to-br from-white to-purple-50/30">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-purple-600" />
                    <span className="font-bold">이렇게 말해보세요</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {analysisResult.scripts?.toCompany && (
                      <div className="border-2 border-purple-200 rounded-xl p-5 bg-gradient-to-br from-purple-50/80 to-indigo-50/50">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-bold text-slate-900">회사에 말할 때</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(analysisResult.scripts?.toCompany || '', '회사 메시지 템플릿이 복사되었습니다')}
                            className="bg-white hover:bg-purple-50 border-purple-300"
                          >
                            <Copy className="w-4 h-4 mr-1.5" />
                            복사
                          </Button>
                        </div>
                        <div className="bg-white border-2 border-purple-200 rounded-xl p-5">
                          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                            {analysisResult.scripts.toCompany}
                          </p>
                        </div>
                      </div>
                    )}

                    {analysisResult.scripts?.toAdvisor && (
                      <div className="border-2 border-blue-200 rounded-xl p-5 bg-gradient-to-br from-blue-50/80 to-indigo-50/50">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-bold text-slate-900">공공 기관 상담 시</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(analysisResult.scripts?.toAdvisor || '', '상담 템플릿이 복사되었습니다')}
                            className="bg-white hover:bg-blue-50 border-blue-300"
                          >
                            <Copy className="w-4 h-4 mr-1.5" />
                            복사
                          </Button>
                        </div>
                        <div className="bg-white border-2 border-blue-200 rounded-xl p-5">
                          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                            {analysisResult.scripts.toAdvisor}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 행동 버튼 3종 */}
                  <div className="mt-6 pt-5 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const textToCopy = analysisResult.scripts?.toCompany || analysisResult.scripts?.toAdvisor || ''
                        handleCopy(textToCopy, '수정 예시가 복사되었습니다')
                      }}
                      className="border-slate-300 hover:bg-slate-50"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      수정 예시 복사
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowEvidenceGuide(true)}
                      className="border-slate-300 hover:bg-slate-50"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      증거 수집 가이드
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const caseData = {
                          question,
                          burdenType,
                          riskScore,
                          analysisResult,
                          timestamp: new Date().toISOString(),
                        }
                        localStorage.setItem('myCase', JSON.stringify(caseData))
                        toast({
                          title: '저장 완료',
                          description: '나의 상황이 저장되었습니다.',
                        })
                      }}
                      className="border-slate-300 hover:bg-slate-50"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      나의 상황 저장
                    </Button>
                  </div>
              </CardContent>
            </Card>
            )}

            {/* 다시 분석하기 */}
            <div className="flex gap-4 pt-4">
              <Button
                onClick={() => {
                  setAnalysisResult(null)
                  setQuestion('')
                  setBurdenType('')
                  setRiskScore(null)
                }}
                variant="outline"
                className="flex-1 border-2 border-slate-300"
              >
                다시 질문하기
              </Button>
              <Button
                onClick={() => router.push('/legal/assist')}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
              >
                상담 허브로 돌아가기
              </Button>
            </div>
          </div>
        )}

        {/* 로딩 상태 */}
        {isAnalyzing && (
          <Card className="border-2 border-blue-200 shadow-lg">
            <CardContent className="p-12 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-lg font-semibold text-slate-900">분석 중...</p>
              <p className="text-sm text-slate-600 mt-2">법적 위험도를 분석하고 있습니다</p>
            </CardContent>
          </Card>
        )}

        {/* 증거 수집 가이드 모달 */}
        <EvidenceGuideModal
          open={showEvidenceGuide}
          onOpenChange={setShowEvidenceGuide}
          situationType={burdenType}
        />
      </div>
    </div>
  )
}

