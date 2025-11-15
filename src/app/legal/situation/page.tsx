'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Loader2, AlertTriangle, CheckCircle2, Copy, FileText, Sparkles, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { analyzeSituationDetailed } from '@/apis/legal.service'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
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
  { value: 'harassment', label: '직장 내 괴롭힘/모욕' },
  { value: 'unpaid_wage', label: '임금체불/수당 미지급' },
  { value: 'unfair_dismissal', label: '부당해고/계약해지' },
  { value: 'overtime', label: '장시간 근로/야근' },
  { value: 'probation', label: '수습·인턴 관련' },
  { value: 'unknown', label: '프리랜서/용역 문제' },
  { value: 'unknown', label: '잘 모르겠음' },
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

// 상황 템플릿
const SITUATION_TEMPLATES = [
  {
    title: '수습 인턴인데, 해고 통보를 받았어요',
    category: 'probation' as SituationCategory,
    employmentType: 'intern' as EmploymentType,
    workPeriod: 'under_3_months' as WorkPeriod,
    summary: '수습 인턴인데, 해고 통보를 받았어요',
    details: `[언제부터]
예: 2025년 1월부터, 수습 인턴으로 근무 중입니다.

[어떤 일이 반복되나요]
예: 최근 2주 동안, 팀장님이...

[내가 느끼는 문제점]
예: 수습이라서 언제든 내보낼 수 있다고 반복적으로 말하며...`,
  },
  {
    title: '야근은 매일인데 수당은 없어요',
    category: 'overtime' as SituationCategory,
    employmentType: 'regular' as EmploymentType,
    summary: '야근은 매일인데 수당은 없어요',
    details: `[언제부터]
예: 2024년 10월쯤부터, 거의 매주 회의 때마다...

[어떤 일이 반복되나요]
예: 매일 밤 10시 이후까지 근무하는데, 연장근로 수당은 전혀 지급되지 않습니다.

[내가 느끼는 문제점]
예: 법적으로 받아야 할 수당을 받지 못하고 있어서...`,
  },
  {
    title: '단톡방/회의에서 모욕적인 말을 들어요',
    category: 'harassment' as SituationCategory,
    summary: '단톡방/회의에서 모욕적인 말을 들어요',
    details: `[언제부터]
예: 2024년 10월쯤부터, 거의 매주 회의 때마다...

[누가, 누구에게, 어떤 상황에서 그런 말을/행동을 하나요]
예: 팀장 A가, 팀원들 다 있는 자리에서 특정 사람을 지목해...

[내가 느끼기에 어떤 점이 가장 힘들었나요]
예: 인격을 부정당하는 느낌이라 정신적으로 버티기 힘듦...`,
  },
  {
    title: '프리랜서인데, 대금이 계속 밀려요',
    category: 'unpaid_wage' as SituationCategory,
    employmentType: 'freelancer' as EmploymentType,
    summary: '프리랜서인데, 대금이 계속 밀려요',
    details: `[언제부터]
예: 2024년 11월부터, 프로젝트 완료 후 대금 지급이 계속 지연되고 있습니다.

[어떤 일이 반복되나요]
예: 계약서에는 "프로젝트 완료 후 7일 이내 지급"이라고 되어 있는데, 3개월째 미지급 상태입니다.

[내가 느끼는 문제점]
예: 생활비를 충당하기 어려워서...`,
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
      // summary + details를 합쳐서 situationText 생성
      const situationText = [summary, details].filter(Boolean).join('\n\n')

      const request: SituationAnalysisRequest = {
        categoryHint,
        summary: summary.trim(),
        details: details.trim() || undefined,
        situationText, // 백엔드 호환성
        ...(employmentType && { employmentType: employmentType as EmploymentType }),
        ...(workPeriod && { workPeriod: workPeriod as WorkPeriod }),
        ...(weeklyHours && { weeklyHours }),
        ...(isProbation !== 'unknown' && { isProbation: isProbation === true }),
        ...(socialInsurance && { socialInsurance: socialInsurance as SocialInsurance }),
      }

      const result = await analyzeSituationDetailed(request)
      setAnalysisResult(result)
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
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-slate-900">
            상황으로 진단받기
          </h1>
          <p className="text-lg text-slate-600 mb-4">
            지금 겪고 있는 일을 설명해주시면,
            <br />
            직장 내 괴롭힘 / 임금체불 / 부당해고 가능성을 1차로 판단해드릴게요.
          </p>
          
          {/* 안내 문구 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">⚠️ 이 서비스는 법률 자문이 아닙니다</p>
                <p className="text-blue-800">
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">자주 있는 상황을 골라서 시작해볼 수도 있어요</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SITUATION_TEMPLATES.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => handleTemplateSelect(template)}
                      className="p-4 text-left border border-slate-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all bg-white"
                    >
                      <p className="text-sm font-medium text-slate-900">{template.title}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>상황 정보 입력</CardTitle>
                <CardDescription>
                  3개만 하면 끝나는 간단한 폼입니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 1. 상황 유형 선택 (칩 버튼) */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Q. 어떤 상황에 가까워 보이나요?
                  </Label>
                  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {SITUATION_CATEGORIES.map((category) => (
                      <button
                        key={category.value + category.label}
                        onClick={() => setCategoryHint(category.value)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all flex-shrink-0",
                          categoryHint === category.value
                            ? "bg-blue-600 text-white shadow-md"
                            : "bg-white border border-slate-300 text-slate-700 hover:border-blue-400 hover:bg-blue-50"
                        )}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. 한 줄 요약 */}
                <div>
                  <Label htmlFor="summary" className="text-base font-semibold mb-2 block">
                    1) 한 줄로만 먼저 적어볼까요? <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="summary"
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder={getSummaryPlaceholder(categoryHint)}
                    className="text-base"
                    required
                  />
                </div>

                {/* 3. 자세한 설명 (선택) */}
                <div>
                  <Label htmlFor="details" className="text-base font-semibold mb-2 block">
                    2) 가능하다면, 아래 3가지만 더 써주세요 (선택)
                  </Label>
                  <p className="text-sm text-slate-600 mb-3">
                    언제부터 / 누가 / 어떤 식으로 인지만 간단히 적어도 충분해요.
                  </p>
                  <Textarea
                    id="details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder={`1. 언제부터 이런 일이 반복되고 있나요?
   - 예: 2024년 10월쯤부터, 거의 매주 회의 때마다…

2. 누가, 누구에게, 어떤 상황에서 그런 말을/행동을 하나요?
   - 예: 팀장 A가, 팀원들 다 있는 자리에서 특정 사람을 지목해…

3. 내가 느끼기에 어떤 점이 가장 힘들었나요?
   - 예: 인격을 부정당하는 느낌이라 정신적으로 버티기 힘듦…`}
                    className="min-h-[200px] text-base"
                  />
                </div>

                {/* 4. 고급 정보 (아코디언) */}
                <div className="border border-slate-200 rounded-lg">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      {showAdvanced ? (
                        <ChevronUp className="w-5 h-5 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                      )}
                      <span className="font-medium text-slate-900">🔽 추가 정보 입력 (선택)</span>
                    </div>
                  </button>
                  <p className="px-4 pb-3 text-sm text-slate-500">
                    안 적어도 분석은 됩니다. 조금 더 정밀한 판단을 원할 때만 써주세요.
                  </p>

                  {showAdvanced && (
                    <div className="px-4 pb-4 space-y-4 border-t border-slate-200 pt-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 고용 형태 */}
                        <div>
                          <Label htmlFor="employment-type" className="text-sm text-slate-600 mb-1.5 block">
                            고용 형태
                          </Label>
                          <Select
                            value={employmentType || undefined}
                            onValueChange={(value) => setEmploymentType(value as EmploymentType)}
                          >
                            <SelectTrigger id="employment-type">
                              <SelectValue placeholder="선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                              {EMPLOYMENT_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* 근무 기간 */}
                        <div>
                          <Label htmlFor="work-period" className="text-sm text-slate-600 mb-1.5 block">
                            근무 기간
                          </Label>
                          <Select
                            value={workPeriod || undefined}
                            onValueChange={(value) => setWorkPeriod(value as WorkPeriod)}
                          >
                            <SelectTrigger id="work-period">
                              <SelectValue placeholder="선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                              {WORK_PERIODS.map((period) => (
                                <SelectItem key={period.value} value={period.value}>
                                  {period.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* 근로시간/주 */}
                        <div>
                          <Label htmlFor="weekly-hours" className="text-sm text-slate-600 mb-1.5 block">
                            주당 근로시간: {weeklyHours}시간
                          </Label>
                          <div className="px-2">
                            <Slider
                              value={[weeklyHours]}
                              onValueChange={(values) => setWeeklyHours(values[0])}
                              min={0}
                              max={80}
                              step={1}
                              className="w-full"
                            />
                          </div>
                        </div>

                        {/* 수습 여부 */}
                        <div>
                          <Label htmlFor="probation" className="text-sm text-slate-600 mb-1.5 block">
                            수습 여부
                          </Label>
                          <Select
                            value={isProbation === 'unknown' ? undefined : isProbation ? 'yes' : 'no'}
                            onValueChange={(value) => {
                              if (value === 'yes') setIsProbation(true)
                              else if (value === 'no') setIsProbation(false)
                              else setIsProbation('unknown')
                            }}
                          >
                            <SelectTrigger id="probation">
                              <SelectValue placeholder="선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes">수습 중</SelectItem>
                              <SelectItem value="no">수습 아님</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* 4대보험 */}
                        <div className="sm:col-span-2">
                          <Label htmlFor="social-insurance" className="text-sm text-slate-600 mb-1.5 block">
                            4대보험
                          </Label>
                          <Select
                            value={socialInsurance || undefined}
                            onValueChange={(value) => setSocialInsurance(value as SocialInsurance)}
                          >
                            <SelectTrigger id="social-insurance">
                              <SelectValue placeholder="선택하세요" />
                            </SelectTrigger>
                            <SelectContent>
                              {SOCIAL_INSURANCE_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 분석 버튼 */}
                <div className="space-y-3">
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !summary.trim()}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        상황 분류 및 법적 기준 검토 중…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        AI에게 상황 분석 받기
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-slate-500">
                    이 서비스는 변호사·노무사의 법률 자문을 대체하지 않으며,
                    <br />
                    실제 분쟁 시에는 전문가 상담을 꼭 권장드립니다.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 분석 결과 (기존과 동일) */}
        {analysisResult && (
          <div className="space-y-6">
            {/* 결과 요약 카드 */}
            <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <CardHeader>
                <CardTitle className="text-2xl">진단 결과</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">상황 유형 추정</p>
                  <p className="text-lg font-bold text-slate-900">
                    {getCategoryLabel(analysisResult.classifiedType as SituationCategory)} 가능성이 높음
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-600">위험도</span>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-bold text-slate-900">
                        {analysisResult.riskScore}점
                      </span>
                      <span className={`text-lg font-semibold ${
                        analysisResult.riskScore <= 30 ? 'text-green-600' :
                        analysisResult.riskScore <= 70 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {getRiskLabel(analysisResult.riskScore)}
                      </span>
                    </div>
                  </div>
                  <div className="relative h-6 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full transition-all ${getRiskColor(analysisResult.riskScore)}`}
                      style={{ width: `${analysisResult.riskScore}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <p className="text-slate-700 leading-relaxed">{analysisResult.summary}</p>
                </div>
              </CardContent>
            </Card>

            {/* 법적 판단 관점 */}
            <Card>
              <CardHeader>
                <CardTitle>어떤 기준으로 판단했나요?</CardTitle>
                <CardDescription>
                  관련 법령 및 가이드라인 기준으로 평가했습니다.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysisResult.criteria.map((criterion, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {getCriteriaStatusIcon(criterion.status)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-slate-900">{criterion.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            criterion.status === 'likely' ? 'bg-green-100 text-green-700' :
                            criterion.status === 'unclear' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {getCriteriaStatusLabel(criterion.status)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-600">{criterion.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 행동 가이드 */}
            <Card>
              <CardHeader>
                <CardTitle>지금 할 수 있는 일</CardTitle>
                <CardDescription>
                  단계별로 진행하세요. 각 항목을 완료하면 체크해보세요.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {analysisResult.actionPlan.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="space-y-3">
                      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {stepIndex + 1}
                        </div>
                        {step.title}
                      </h3>
                      <div className="space-y-2 ml-10">
                        {step.items.map((item, itemIndex) => {
                          const itemKey = `step-${stepIndex}-item-${itemIndex}`
                          return (
                            <div
                              key={itemIndex}
                              className="flex items-start gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition-colors"
                            >
                              <button
                                onClick={() => toggleCheckItem(itemKey)}
                                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-colors ${
                                  checkedItems.has(itemKey)
                                    ? 'bg-blue-600 border-blue-600'
                                    : 'border-slate-300 bg-white'
                                }`}
                              >
                                {checkedItems.has(itemKey) && (
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                )}
                              </button>
                              <p className="flex-1 text-slate-700 text-sm leading-relaxed">
                                {item}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 스크립트/템플릿 */}
            {(analysisResult.scripts.toCompany || analysisResult.scripts.toAdvisor) && (
              <Card>
                <CardHeader>
                  <CardTitle>이렇게 말해보세요</CardTitle>
                  <CardDescription>
                    회사에 보낼 말/메시지 초안 및 상담 시 쓸 설명 템플릿
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysisResult.scripts.toCompany && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold text-slate-700">
                          회사에 보낼 메시지 초안
                        </Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(
                            analysisResult.scripts.toCompany!,
                            '회사 메시지 템플릿이 복사되었습니다'
                          )}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          복사
                        </Button>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                          {analysisResult.scripts.toCompany}
                        </p>
                      </div>
                    </div>
                  )}

                  {analysisResult.scripts.toAdvisor && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-semibold text-slate-700">
                          상담 시 쓸 설명 템플릿
                        </Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(
                            analysisResult.scripts.toAdvisor!,
                            '상담 템플릿이 복사되었습니다'
                          )}
                        >
                          <Copy className="w-4 h-4 mr-1" />
                          복사
                        </Button>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                          {analysisResult.scripts.toAdvisor}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* 유사한 사례 */}
            {analysisResult.relatedCases.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>유사한 사례 더 보기</CardTitle>
                  <CardDescription>
                    비슷한 법적 상황에 대한 사례를 확인하세요.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysisResult.relatedCases.map((caseItem) => (
                      <div
                        key={caseItem.id}
                        className="border border-slate-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer bg-white"
                        onClick={() => router.push(`/legal/cases/${caseItem.id}`)}
                      >
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 mb-2">
                              {caseItem.title}
                            </h3>
                            <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                              {caseItem.summary}
                            </p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/legal/cases/${caseItem.id}`)
                              }}
                            >
                              이 케이스에서 어떤 점이 문제였는지 보기
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-4">
              <Button
                onClick={() => {
                  setAnalysisResult(null)
                  setCheckedItems(new Set())
                  setSummary('')
                  setDetails('')
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
