'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Loader2, AlertTriangle, CheckCircle2, Copy, FileText, Sparkles, Info, ChevronDown, ChevronUp, Scale, Clock, DollarSign, Users, Briefcase, TrendingUp, Zap, MessageSquare, X } from 'lucide-react'
import { analyzeSituationV2, type SituationRequestV2, type SituationResponseV2 } from '@/apis/legal.service'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { SituationChat } from '@/components/legal/SituationChat'
import type { 
  SituationCategory, 
  EmploymentType, 
  WorkPeriod, 
  SocialInsurance,
  SituationAnalysisRequest,
  SituationAnalysisResponse,
  RelatedCase
} from '@/types/legal'

const SITUATION_CATEGORIES: { value: SituationCategory; label: string }[] = [
  { value: 'probation', label: '인턴/수습 해고' },
  { value: 'unfair_dismissal', label: '정규직 해고·계약해지' },
  { value: 'unpaid_wage', label: '임금 체불·무급 야근' },
  { value: 'harassment', label: '직장 내 괴롭힘' },
  { value: 'unknown', label: '프리랜서/용역' },
  { value: 'unknown', label: '스톡옵션/성과급' },
  { value: 'unknown', label: '기타/복합 상황' },
]

const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: 'regular', label: '정규직' },
  { value: 'contract', label: '계약직' },
  { value: 'intern', label: '인턴' },
  { value: 'freelancer', label: '프리랜서' },
  { value: 'part_time', label: '알바' },
  { value: 'other', label: '기타' },
]

const WORK_PERIODS: { value: WorkPeriod; label: string }[] = [
  { value: 'under_3_months', label: '3개월 미만' },
  { value: '3_12_months', label: '3~12개월' },
  { value: '1_3_years', label: '1~3년' },
  { value: 'over_3_years', label: '3년 이상' },
]

const SOCIAL_INSURANCE_OPTIONS: { value: SocialInsurance; label: string }[] = [
  { value: 'all', label: '모두 가입' },
  { value: 'partial', label: '일부만' },
  { value: 'none', label: '전혀 없음' },
  { value: 'unknown', label: '모름' },
]

// 상황 템플릿 (5-6개로 확장)
const SITUATION_TEMPLATES = [
  {
    title: '인턴/수습 해고 통보',
    icon: Briefcase,
    category: 'probation' as SituationCategory,
    employmentType: 'intern' as EmploymentType,
    workPeriod: 'under_3_months' as WorkPeriod,
    summary: '수습 인턴인데, 해고 통보를 받았어요',
    description: '수습 기간 중 갑작스러운 해고 통보를 받은 경우',
    details: `[언제부터]
예: 2025년 1월부터, 수습 인턴으로 근무 중입니다.

[어떤 일이 반복되나요]
예: 최근 2주 동안, 팀장님이...

[내가 느끼는 문제점]
예: 수습이라서 언제든 내보낼 수 있다고 반복적으로 말하며...`,
  },
  {
    title: '무급 야근·추가 근무',
    icon: Clock,
    category: 'overtime' as SituationCategory,
    employmentType: 'regular' as EmploymentType,
    summary: '야근은 매일인데 수당은 없어요',
    description: '연장근로 수당 없이 야근이나 추가 근무를 요구받는 경우',
    details: `[언제부터]
예: 2024년 10월쯤부터, 거의 매주 회의 때마다...

[어떤 일이 반복되나요]
예: 매일 밤 10시 이후까지 근무하는데, 연장근로 수당은 전혀 지급되지 않습니다.

[내가 느끼는 문제점]
예: 법적으로 받아야 할 수당을 받지 못하고 있어서...`,
  },
  {
    title: '임금 체불·수당 미지급',
    icon: DollarSign,
    category: 'unpaid_wage' as SituationCategory,
    summary: '3개월째 월급이 매번 일주일 이상 늦게 들어와요',
    description: '월급이나 수당이 지급되지 않거나 지연되는 경우',
    details: `[언제부터]
예: 2024년 9월부터 월급 지급이 불규칙해지기 시작했습니다.

[어떤 일이 반복되나요]
예: 계약서에는 매월 25일 지급이라고 되어 있는데, 실제로는 다음 달 초에야 들어옵니다.

[내가 느끼는 문제점]
예: 생활비 계획을 세우기 어려워서...`,
  },
  {
    title: '직장 내 괴롭힘·모욕 발언',
    icon: Users,
    category: 'harassment' as SituationCategory,
    summary: '단톡방/회의에서 모욕적인 말을 들어요',
    description: '상사나 동료로부터 모욕적 발언이나 괴롭힘을 당하는 경우',
    details: `[언제부터]
예: 2024년 10월쯤부터, 거의 매주 회의 때마다...

[누가, 누구에게, 어떤 상황에서 그런 말을/행동을 하나요]
예: 팀장 A가, 팀원들 다 있는 자리에서 특정 사람을 지목해...

[내가 느끼기에 어떤 점이 가장 힘들었나요]
예: 인격을 부정당하는 느낌이라 정신적으로 버티기 힘듦...`,
  },
  {
    title: '프리랜서/용역 대금 미지급',
    icon: FileText,
    category: 'unpaid_wage' as SituationCategory,
    employmentType: 'freelancer' as EmploymentType,
    summary: '프리랜서인데, 대금이 계속 밀려요',
    description: '프리랜서나 용역 계약에서 대금이 지급되지 않는 경우',
    details: `[언제부터]
예: 2024년 11월부터, 프로젝트 완료 후 대금 지급이 계속 지연되고 있습니다.

[어떤 일이 반복되나요]
예: 계약서에는 "프로젝트 완료 후 7일 이내 지급"이라고 되어 있는데, 3개월째 미지급 상태입니다.

[내가 느끼는 문제점]
예: 생활비를 충당하기 어려워서...`,
  },
  {
    title: '스톡옵션/성과급 관련 문제',
    icon: TrendingUp,
    category: 'unknown' as SituationCategory,
    summary: '스톡옵션이나 성과급이 약속과 다르게 지급되지 않아요',
    description: '스톡옵션이나 성과급 관련 약속이 지켜지지 않는 경우',
    details: `[언제부터]
예: 입사 시 스톡옵션을 받기로 약속받았는데...

[어떤 일이 반복되나요]
예: 계약서에는 명시되어 있지 않고, 구두로만 약속받았습니다.

[내가 느끼는 문제점]
예: 퇴사 시 스톡옵션을 받을 수 있을지 불확실해서...`,
  },
]

// 상황 유형별 placeholder
const getSummaryPlaceholder = (category: SituationCategory): string => {
  switch (category) {
    case 'harassment':
      return '예: 팀장이 단톡방에서 반복적으로 모욕적인 말을 합니다'
    case 'unpaid_wage':
      return '예: 3개월째 월급이 매번 일주일 이상 늦게 들어와요'
    case 'unfair_dismissal':
      return '예: 수습 중인데 갑자기 해고 통보만 받았어요'
    case 'overtime':
      return '예: 인턴인데 야근은 매일인데 수당이 전혀 없어요'
    case 'probation':
      return '예: 수습 기간 중인데 계약 해지 통보를 받았어요'
    default:
      return '예: 인턴인데 야근은 매일인데 수당이 전혀 없어요'
  }
}

export default function SituationAnalysisPage() {
  const router = useRouter()
  const { toast } = useToast()

  // 폼 상태
  const [categoryHint, setCategoryHint] = useState<SituationCategory>('unknown')
  const [summary, setSummary] = useState('') // 한 줄 요약
  const [details, setDetails] = useState('') // 자세한 설명
  const [showAdvanced, setShowAdvanced] = useState(false) // 고급 정보 표시 여부
  const [employmentType, setEmploymentType] = useState<EmploymentType | undefined>(undefined)
  const [workPeriod, setWorkPeriod] = useState<WorkPeriod | undefined>(undefined)
  const [weeklyHours, setWeeklyHours] = useState<number>(40)
  const [isProbation, setIsProbation] = useState<boolean | 'unknown'>('unknown')
  const [socialInsurance, setSocialInsurance] = useState<SocialInsurance | undefined>(undefined)

  // 분석 결과 상태
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<SituationAnalysisResponse | null>(null)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  
  // 챗봇 상태
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [messageCount, setMessageCount] = useState(0)

  // ESC 키로 챗봇 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isChatOpen) {
        setIsChatOpen(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isChatOpen])

  // 템플릿 선택 핸들러
  const handleTemplateSelect = (template: typeof SITUATION_TEMPLATES[0]) => {
    setCategoryHint(template.category)
    setSummary(template.summary)
    setDetails(template.details)
    if (template.employmentType) {
      setEmploymentType(template.employmentType)
    }
    if (template.workPeriod) {
      setWorkPeriod(template.workPeriod)
    }
    // 수습 관련 템플릿이면 자동으로 수습 여부 설정
    if (template.category === 'probation' || template.employmentType === 'intern') {
      setIsProbation(true)
    }
  }

  // 예시 텍스트 불러오기
  const loadExampleText = () => {
    const exampleTexts: Record<SituationCategory, string> = {
      harassment: `[언제부터]
예: 2024년 10월쯤부터, 거의 매주 회의 때마다...

[누가, 누구에게, 어떤 상황에서 그런 말을/행동을 하나요]
예: 팀장 A가, 팀원들 다 있는 자리에서 특정 사람을 지목해 모욕적인 발언을 합니다.

[내가 느끼기에 어떤 점이 가장 힘들었나요]
예: 인격을 부정당하는 느낌이라 정신적으로 버티기 힘듭니다.`,
      unpaid_wage: `[언제부터]
예: 2024년 9월부터 월급 지급이 불규칙해지기 시작했습니다.

[어떤 일이 반복되나요]
예: 계약서에는 매월 25일 지급이라고 되어 있는데, 실제로는 다음 달 초에야 들어옵니다.

[지금까지 어떤 대화를 나눴는지]
예: 인사팀에 문의했지만 "다음 달에 지급하겠다"는 답변만 반복됩니다.`,
      unfair_dismissal: `[언제부터]
예: 2025년 1월부터, 수습 인턴으로 근무 중입니다.

[어떤 일이 반복되나요]
예: 최근 2주 동안, 팀장님이 수습이라서 언제든 내보낼 수 있다고 반복적으로 말하며...

[해고 통보는 어떻게 받았는지]
예: 갑자기 이번 주까지만 나오라고 통보만 받았고, 구체적인 사유는 없었습니다.`,
      overtime: `[언제부터]
예: 2024년 10월쯤부터, 거의 매주 회의 때마다...

[어떤 일이 반복되나요]
예: 매일 밤 10시 이후까지 근무하는데, 연장근로 수당은 전혀 지급되지 않습니다.

[지금까지 어떤 대화를 나눴는지]
예: 수당 지급을 요청했지만 "회사 사정상 어렵다"는 답변만 받았습니다.`,
      probation: `[언제부터]
예: 2025년 1월부터, 수습 인턴으로 근무 중입니다.

[어떤 일이 반복되나요]
예: 최근 2주 동안, 팀장님이 수습이라서 언제든 내보낼 수 있다고 반복적으로 말하며...

[해고 통보는 어떻게 받았는지]
예: 갑자기 이번 주까지만 나오라고 통보만 받았고, 구체적인 사유는 없었습니다.`,
      unknown: `[언제부터]
예: 최근 몇 주 전부터 이런 문제가 시작되었습니다.

[어떤 일이 반복되나요]
예: 구체적으로 설명하면...

[내가 느끼는 문제점]
예: 이 상황이 법적으로 문제가 될 수 있는지 알고 싶습니다.`,
    }
    const example = exampleTexts[categoryHint] || exampleTexts.unknown
    setDetails(example)
  }

  const handleAnalyze = async () => {
    if (!summary.trim()) {
      toast({
        title: '한 줄 요약을 입력해주세요',
        description: '상황을 한 줄로 요약해주세요.',
        variant: 'destructive',
      })
      return
    }

    setIsAnalyzing(true)
    try {
      // v2 API 요청 형식
      const request: SituationRequestV2 = {
        situation: [summary, details].filter(Boolean).join('\n\n'),
        category: categoryHint,
        employmentType: employmentType || undefined,
        companySize: undefined, // 필요시 추가
        workPeriod: workPeriod || undefined,
        hasWrittenContract: undefined, // 필요시 추가
        socialInsurance: socialInsurance ? [socialInsurance] : undefined,
      }

      const result = await analyzeSituationV2(request)
      
      // v2 응답을 v1 형식으로 변환 (기존 UI 호환성)
      const v1Format: SituationAnalysisResponse = {
        classifiedType: (result.tags[0] || 'unknown') as SituationCategory,
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
          toCompany: result.scripts?.toCompany,
          toAdvisor: result.scripts?.toAdvisor,
        },
        relatedCases: result.relatedCases.map(c => ({
          id: c.id,
          title: c.title,
          summary: c.summary,
        })),
      }
      
      setAnalysisResult(v1Format)
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

  const getRiskColor = (score: number) => {
    if (score <= 30) return 'bg-green-500'
    if (score <= 70) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getRiskLabel = (score: number) => {
    if (score <= 30) return '위험이 낮습니다'
    if (score <= 70) return '주의가 필요합니다'
    return '위험이 매우 높습니다'
  }

  const getCategoryLabel = (type: SituationCategory) => {
    return SITUATION_CATEGORIES.find(c => c.value === type)?.label || type
  }

  const getCriteriaStatusIcon = (status: string) => {
    switch (status) {
      case 'likely':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />
      case 'unclear':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      case 'unlikely':
        return <AlertTriangle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  const getCriteriaStatusLabel = (status: string) => {
    switch (status) {
      case 'likely':
        return '충족'
      case 'unclear':
        return '부분 충족'
      case 'unlikely':
        return '불충족'
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-5xl">
        {/* Header */}
        <div className="mb-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              지금 겪는 상황, 먼저 말로 설명해 주세요
            </h1>
            <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
              3가지 정보만 적으면, 법적 관점 + 행동 가이드를 한 번에 정리해 드려요.
            </p>
          </div>
          
          {/* 3단계 인디케이터 */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-5 py-2.5 text-sm font-semibold shadow-md">
              <span className="text-base">1️⃣</span>
              <span>상황 유형 선택</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white border-2 border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm">
              <span className="text-base">2️⃣</span>
              <span>한 줄 요약 & 자세한 설명</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white border-2 border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm">
              <span className="text-base">3️⃣</span>
              <span>AI 분석 결과 보기</span>
            </div>
          </div>
          
          {/* 안내 문구 */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-5 mb-8 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                <Info className="w-5 h-5 text-amber-700" />
              </div>
              <div className="text-sm text-amber-900">
                <p className="font-semibold mb-1.5">⚠️ 이 서비스는 법률 자문이 아닙니다</p>
                <p className="text-amber-800 leading-relaxed">
                  정보 안내와 가이드를 제공하는 것입니다. 개인정보(실명, 회사명)는 가급적 빼고 작성해주세요.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 입력 폼 */}
        {!analysisResult && (
          <div className="space-y-6">
            {/* 상황 템플릿 */}
            <Card className="border-2 border-slate-200 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">자주 있는 상황을 골라서 시작해볼 수도 있어요</CardTitle>
                    <CardDescription className="mt-1">클릭하면 자동으로 입력됩니다</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {SITUATION_TEMPLATES.map((template, index) => {
                    const Icon = template.icon
                    const isSelected = categoryHint === template.category && summary === template.summary
                    return (
                      <button
                        key={index}
                        onClick={() => handleTemplateSelect(template)}
                        className={cn(
                          "p-5 text-left border-2 rounded-xl transition-all duration-200 bg-white group",
                          isSelected
                            ? "border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg ring-2 ring-blue-200 scale-[1.02]"
                            : "border-slate-200 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-indigo-50/50 hover:shadow-md"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "p-3 rounded-xl flex-shrink-0 transition-all shadow-sm",
                            isSelected 
                              ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md" 
                              : "bg-gradient-to-br from-slate-100 to-slate-200 group-hover:from-blue-100 group-hover:to-indigo-100"
                          )}>
                            <Icon className={cn(
                              "w-6 h-6 transition-colors",
                              isSelected ? "text-white" : "text-slate-600 group-hover:text-blue-600"
                            )} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "text-sm font-bold mb-1.5 transition-colors",
                              isSelected ? "text-blue-900" : "text-slate-900 group-hover:text-blue-700"
                            )}>
                              {template.title}
                            </p>
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {template.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-slate-200 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">상황 정보 입력</CardTitle>
                    <CardDescription className="mt-1">3개만 하면 끝나는 간단한 폼입니다</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* 1. 상황 유형 선택 (칩 버튼) */}
                <div>
                  <Label className="text-base font-bold mb-4 block text-slate-900">
                    Q. 어떤 상황에 가까워 보이나요?
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {SITUATION_CATEGORIES.map((category) => (
                      <button
                        key={category.value + category.label}
                        onClick={() => setCategoryHint(category.value)}
                        className={cn(
                          "px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0",
                          categoryHint === category.value
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-105"
                            : "bg-white border-2 border-slate-300 text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md"
                        )}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. 한 줄 요약 */}
                <div>
                  <Label htmlFor="summary" className="text-base font-bold mb-3 block text-slate-900">
                    한 줄로 상황을 요약해 주세요 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder={getSummaryPlaceholder(categoryHint)}
                    className={cn(
                      "text-base h-12 border-2 transition-all",
                      summary.length >= 10
                        ? "border-green-300 focus:border-green-400 focus:ring-2 focus:ring-green-100"
                        : "border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    )}
                    required
                    minLength={10}
                  />
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      {summary.length < 10 ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span className="text-xs font-medium text-amber-600">최소 10자 이상 입력해주세요</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-xs font-medium text-green-600">✓ 입력 완료</span>
                        </>
                      )}
                    </div>
                    <p className={cn(
                      "text-xs font-semibold",
                      summary.length < 10 ? "text-slate-400" : "text-green-600"
                    )}>
                      {summary.length}자
                    </p>
                  </div>
                </div>

                {/* 3. 자세한 설명 (선택) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <Label htmlFor="details" className="text-base font-bold block text-slate-900">
                      조금만 더 자세히 적어주시면, 진단이 더 정확해져요 <span className="text-slate-400 font-normal">(선택)</span>
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={loadExampleText}
                      className="text-xs h-8 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                    >
                      <Zap className="w-3.5 h-3.5 mr-1.5" />
                      예시 불러오기
                    </Button>
                  </div>
                  <div className="bg-blue-50/50 border border-blue-200 rounded-lg p-4 mb-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      가능하면 아래 사항을 포함해 주세요:
                    </p>
                    <ul className="text-xs text-blue-800 space-y-1.5 list-none">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>언제부터 이런 일이 발생했는지</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>상대방(회사, 팀장, 클라이언트 등)이 누구인지</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>지금까지 어떤 대화를 나눴는지</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>가지고 있는 증거(카톡, 메일, 녹취 등)가 있는지</span>
                      </li>
                    </ul>
                  </div>
                  <Textarea
                    id="details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder={`예시:
- 언제부터: 2024년 10월쯤부터, 거의 매주 회의 때마다...
- 누가: 팀장 A가, 팀원들 다 있는 자리에서 특정 사람을 지목해...
- 어떤 대화: 수당 지급을 요청했지만 "회사 사정상 어렵다"는 답변만 받았습니다.
- 증거: 카톡 대화 내용과 근무 시간 기록이 있습니다.`}
                    className="min-h-[220px] text-base border-2 border-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 rounded-xl"
                  />
                </div>

                {/* 4. 고급 정보 (아코디언) */}
                <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full px-5 py-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        showAdvanced ? "bg-blue-100" : "bg-slate-100"
                      )}>
                        {showAdvanced ? (
                          <ChevronUp className="w-5 h-5 text-blue-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div className="text-left">
                        <span className="font-bold text-slate-900 block">선택 입력 (근로조건까지 알려주면 더 정확하게 판단해 드릴게요)</span>
                        <span className="text-xs text-slate-500 mt-0.5">근로형태, 주당 근로시간, 수습 여부 정도만 적어도 충분해요.</span>
                      </div>
                    </div>
                  </button>

                  {showAdvanced && (
                    <div className="px-5 pb-6 space-y-6 border-t-2 border-slate-200 pt-6 bg-gradient-to-br from-slate-50/80 to-blue-50/30">
                      {/* 고용 형태 - 카드형 버튼 */}
                      <div>
                        <Label className="text-sm font-semibold text-slate-700 mb-3 block">고용 형태</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {EMPLOYMENT_TYPES.map((type) => (
                            <button
                              key={type.value}
                              type="button"
                              onClick={() => setEmploymentType(type.value)}
                              className={cn(
                                "px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all",
                                employmentType === type.value
                                  ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
                                  : "bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50"
                              )}
                            >
                              {type.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 근무 기간 - 카드형 버튼 */}
                      <div>
                        <Label className="text-sm font-semibold text-slate-700 mb-3 block">재직 기간</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {WORK_PERIODS.map((period) => (
                            <button
                              key={period.value}
                              type="button"
                              onClick={() => setWorkPeriod(period.value)}
                              className={cn(
                                "px-3 py-2.5 rounded-lg border-2 text-xs font-medium transition-all",
                                workPeriod === period.value
                                  ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
                                  : "bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50"
                              )}
                            >
                              {period.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 주당 근로시간 - 선택형 */}
                      <div>
                        <Label className="text-sm font-semibold text-slate-700 mb-3 block">주당 근로시간</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {[
                            { label: '40시간 이하', value: 40 },
                            { label: '40~52시간', value: 50 },
                            { label: '52시간 초과 추정', value: 60 },
                            { label: '모름', value: 0 },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setWeeklyHours(option.value || 40)}
                              className={cn(
                                "px-3 py-2.5 rounded-lg border-2 text-xs font-medium transition-all",
                                weeklyHours === option.value || (option.value === 0 && weeklyHours === 40)
                                  ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
                                  : "bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50/50"
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 수습 여부 - 토글 */}
                      <div>
                        <Label className="text-sm font-semibold text-slate-700 mb-3 block">수습 여부</Label>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setIsProbation(true)}
                            className={cn(
                              "flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all",
                              isProbation === true
                                ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
                                : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"
                            )}
                          >
                            현재 수습/인턴 기간입니다
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsProbation(false)}
                            className={cn(
                              "flex-1 px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all",
                              isProbation === false
                                ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
                                : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"
                            )}
                          >
                            수습 아님
                          </button>
                        </div>
                        {isProbation === true && (
                          <p className="text-xs text-blue-600 mt-2">
                            💡 수습이라도 근로기준법상 보호 대상일 수 있어요.
                          </p>
                        )}
                      </div>

                      {/* 4대보험 - 칩 버튼 */}
                      <div>
                        <Label className="text-sm font-semibold text-slate-700 mb-3 block">4대보험 가입 여부</Label>
                        <div className="flex flex-wrap gap-2">
                          {SOCIAL_INSURANCE_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setSocialInsurance(option.value)}
                              className={cn(
                                "px-4 py-2 rounded-full border-2 text-sm font-medium transition-all",
                                socialInsurance === option.value
                                  ? "bg-blue-50 border-blue-500 text-blue-700 shadow-sm"
                                  : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 분석 버튼은 하단 고정 CTA로 이동 */}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 하단 고정 CTA 바 */}
        {!analysisResult && (
          <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t-2 border-slate-200 shadow-2xl z-40 -mx-4 sm:-mx-6 px-4 sm:px-6 py-5">
            <div className="container mx-auto max-w-5xl">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700">
                    입력된 내용으로 상황을 분석하고, 법적 관점 + 대응 가이드를 생성합니다.
                  </p>
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || summary.trim().length < 10}
                  className={cn(
                    "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl",
                    "min-w-[180px] h-12 text-base font-semibold",
                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-xl",
                    "transition-all duration-200"
                  )}
                  size="lg"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      분석 중...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      상황 분석 받기
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 로딩 상태 */}
        {isAnalyzing && !analysisResult && (
          <div className="space-y-4">
            <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-pulse" style={{ width: '60%' }}></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 bg-slate-200 rounded w-3/4"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-200 rounded w-full"></div>
                      <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                      <div className="h-4 bg-slate-200 rounded w-4/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* 분석 결과 */}
        {analysisResult && (
          <div className="space-y-6">
            {/* 결과 섹션 헤더 */}
            <div className="mb-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full mb-4 shadow-lg">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-semibold">AI 분석 결과</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3">
                  분석이 완료되었습니다
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                  입력하신 상황을 토대로, 법적 관점·위험도·행동 가이드를 정리했습니다.
                </p>
              </div>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="px-5 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl shadow-sm">
                  <span className="text-xs text-blue-600 font-semibold uppercase tracking-wide">예상 유형:</span>
                  <span className="ml-2 text-base font-bold text-blue-700">
                    {getCategoryLabel(analysisResult.classifiedType as SituationCategory)} 의심
                  </span>
                </div>
                <div className={cn(
                  "px-5 py-3 border-2 rounded-xl shadow-sm",
                  analysisResult.riskScore <= 30 
                    ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300"
                    : analysisResult.riskScore <= 70
                    ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300"
                    : "bg-gradient-to-r from-red-50 to-rose-50 border-red-300"
                )}>
                  <span className="text-xs font-semibold uppercase tracking-wide mr-2">위험도:</span>
                  <span className={cn(
                    "text-base font-extrabold",
                    analysisResult.riskScore <= 30 
                      ? "text-green-700"
                      : analysisResult.riskScore <= 70
                      ? "text-amber-700"
                      : "text-red-700"
                  )}>
                    {analysisResult.riskScore <= 30 ? '낮음' : analysisResult.riskScore <= 70 ? '중간' : '높음'}
                  </span>
                </div>
              </div>
            </div>

            {/* 카드 1 - 법적 관점 요약 */}
            <Card className="border-2 border-blue-300 shadow-xl bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-md">
                    <Scale className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold">법적 관점에서 본 현재 상황</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {analysisResult.criteria.map((criterion, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100 shadow-sm">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                        <span className="text-blue-600 font-bold text-xs">{index + 1}</span>
                      </div>
                      <p className="text-sm text-slate-700 leading-relaxed flex-1">
                        {criterion.reason || `${criterion.name}: ${getCriteriaStatusLabel(criterion.status)}`}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4 mt-5">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-900 leading-relaxed font-medium">
                      * 실제 법률 자문이 아닌, 공개된 가이드와 사례를 바탕으로 한 1차 정보입니다.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 카드 2 - 지금 할 수 있는 행동 체크리스트 */}
            <Card className="border-2 border-emerald-300 shadow-xl bg-gradient-to-br from-white to-emerald-50/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-md">
                    <CheckCircle2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-bold">지금 당장 할 수 있는 행동</span>
                </CardTitle>
                <CardDescription className="mt-2">
                  완료한 항목은 체크해 두면, 다음에 다시 봐도 진행 상황을 기억하기 쉽습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.actionPlan?.steps && analysisResult.actionPlan.steps.length > 0 ? (
                    analysisResult.actionPlan.steps.flatMap((step, stepIndex) =>
                      step.items && step.items.length > 0
                        ? step.items.map((item, itemIndex) => {
                            const itemKey = `step-${stepIndex}-item-${itemIndex}`
                            return (
                              <div
                                key={itemKey}
                                className={cn(
                                  "flex items-start gap-4 p-4 bg-white border-2 rounded-xl transition-all duration-200",
                                  checkedItems.has(itemKey)
                                    ? "border-emerald-400 bg-gradient-to-r from-emerald-50 to-green-50 shadow-md"
                                    : "border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 hover:shadow-sm"
                                )}
                              >
                                <button
                                  onClick={() => toggleCheckItem(itemKey)}
                                  className={cn(
                                    "flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center mt-0.5 transition-all shadow-sm",
                                    checkedItems.has(itemKey)
                                      ? 'bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-600'
                                      : 'border-slate-300 bg-white hover:border-emerald-400'
                                  )}
                                >
                                  {checkedItems.has(itemKey) && (
                                    <CheckCircle2 className="w-5 h-5 text-white" />
                                  )}
                                </button>
                                <p className={cn(
                                  "flex-1 text-sm leading-relaxed",
                                  checkedItems.has(itemKey) ? "text-emerald-900 font-medium" : "text-slate-700"
                                )}>
                                  {item}
                                </p>
                              </div>
                            )
                          })
                        : []
                    )
                  ) : (
                    <div className="p-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm text-slate-600 text-center">
                      행동 가이드가 아직 준비되지 않았습니다.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 카드 3 - 말/메일 스크립트 & 다음 단계 */}
            {(analysisResult.scripts.toCompany || analysisResult.scripts.toAdvisor) && (
              <Card className="border-2 border-purple-300 shadow-xl bg-gradient-to-br from-white to-purple-50/30">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-md">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-bold">이렇게 말해보세요</span>
                  </CardTitle>
                  <CardDescription className="mt-2">
                    회사에 보낼 말/메시지 초안 및 상담 시 쓸 설명 템플릿
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-5">
                    {analysisResult.scripts.toCompany && (
                      <div className="border-2 border-purple-200 rounded-xl p-5 bg-gradient-to-br from-purple-50/80 to-indigo-50/50 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <Label className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Users className="w-4 h-4 text-purple-600" />
                            대표/상사에게 말할 때
                          </Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(
                              analysisResult.scripts.toCompany!,
                              '회사 메시지 템플릿이 복사되었습니다'
                            )}
                            className="bg-white hover:bg-purple-50 border-purple-300 hover:border-purple-400 shadow-sm"
                          >
                            <Copy className="w-4 h-4 mr-1.5" />
                            문장 복사하기
                          </Button>
                        </div>
                        <div className="bg-white border-2 border-purple-200 rounded-xl p-5 shadow-sm">
                          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                            {analysisResult.scripts.toCompany}
                          </p>
                        </div>
                      </div>
                    )}

                    {analysisResult.scripts.toAdvisor && (
                      <div className="border-2 border-blue-200 rounded-xl p-5 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <Label className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Scale className="w-4 h-4 text-blue-600" />
                            공적 기관에 상담할 때
                          </Label>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopy(
                              analysisResult.scripts.toAdvisor!,
                              '상담 템플릿이 복사되었습니다'
                            )}
                            className="bg-white hover:bg-blue-50 border-blue-300 hover:border-blue-400 shadow-sm"
                          >
                            <Copy className="w-4 h-4 mr-1.5" />
                            문장 복사하기
                          </Button>
                        </div>
                        <div className="bg-white border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                          <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                            {analysisResult.scripts.toAdvisor}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 유사 사례 링크 */}
                  <div className="mt-6 pt-5 border-t-2 border-slate-200">
                    <Button
                      variant="outline"
                      onClick={() => router.push(`/legal/cases?category=${categoryHint}&summary=${encodeURIComponent(summary)}`)}
                      className="w-full h-12 border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-400 font-semibold shadow-sm"
                    >
                      <FileText className="w-5 h-5 mr-2" />
                      유사한 사례 더 보기
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 유사한 사례 */}
            {analysisResult.relatedCases.length > 0 && (
              <Card className="border-2 border-slate-300 shadow-lg bg-white">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-slate-500 to-slate-600 rounded-lg shadow-md">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">비슷한 상황 케이스</CardTitle>
                      <CardDescription className="mt-1">유사한 법적 상황에 대한 사례를 확인하세요</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysisResult.relatedCases.slice(0, 3).map((caseItem) => (
                      <div
                        key={caseItem.id}
                        className="border-2 border-slate-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer bg-white group"
                        onClick={() => router.push(`/legal/cases/${caseItem.id}`)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                            <FileText className="w-5 h-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
                              {caseItem.title}
                            </h3>
                            <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed">
                              {caseItem.summary}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 액션 버튼 */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={() => {
                  setAnalysisResult(null)
                  setCheckedItems(new Set())
                  setSummary('')
                  setDetails('')
                }}
                variant="outline"
                className="flex-1 h-12 border-2 border-slate-300 hover:bg-slate-50 hover:border-slate-400 font-semibold shadow-sm"
              >
                다시 분석하기
              </Button>
              <Button
                onClick={() => setIsChatOpen(true)}
                className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg hover:shadow-xl"
              >
                리포트 결과 관련 대화 시작하기
              </Button>
            </div>
          </div>
        )}

        {/* 챗봇 오버레이 배경 (모바일/태블릿용) */}
        {isChatOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-sm lg:hidden"
            onClick={() => setIsChatOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* 오른쪽: 채팅 UI (토글 가능한 사이드바) */}
        {analysisResult && (
          <div 
            className={cn(
              "fixed right-0 z-40 bg-white shadow-2xl border-l border-slate-200",
              "transition-transform duration-300 ease-in-out",
              "w-full sm:w-[90vw] md:w-[500px] lg:w-[400px]",
              isChatOpen ? "translate-x-0" : "translate-x-full"
            )}
            style={{ top: '64px', height: 'calc(100vh - 64px)' }}
          >
            {/* 채팅 헤더 */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 border-b border-blue-400/30">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAzNGMwIDIuMjA5LTEuNzkxIDQtNCA0cy00LTEuNzkxLTQtNCAxLjc5MS00IDQtNCA0IDEuNzkxIDQgNHptMTAtMTBjMCAyLjIwOS0xLjc5MSA0LTQgNHMtNC0xLjc5MS00LTQgMS43OTEtNCA0LTQgNCAxLjc5MSA0IDR6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L2c+PC9zdmc+')] opacity-20"></div>
              <div className="relative px-4 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg flex-shrink-0">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-white">리포트 결과 대화</h2>
                    <p className="text-xs text-blue-100 mt-0.5">
                      법적 관점 분석 결과에 대해 질문하세요
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {messageCount > 0 && (
                    <span className="px-2 py-0.5 bg-white/30 rounded-full text-[10px] font-medium text-white">
                      {messageCount}개 대화
                    </span>
                  )}
                  <button
                    onClick={() => setIsChatOpen(false)}
                    className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-white/20 transition-colors text-white flex items-center justify-center"
                    aria-label="채팅 닫기"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 채팅 컨텐츠 */}
            <div 
              role="region"
              aria-label="리포트 결과 대화"
              aria-live="polite"
              className="h-[calc(100%-80px)] overflow-hidden flex flex-col"
            >
              <SituationChat
                analysisResult={analysisResult}
                situationSummary={summary}
                onLoadingChange={setChatLoading}
                onMessageCountChange={setMessageCount}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
