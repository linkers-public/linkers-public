'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { 
  Search, 
  BookOpen, 
  ChevronRight, 
  X, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  FileWarning
} from 'lucide-react'
import { searchLegalCases } from '@/apis/legal.service'
import { cn } from '@/lib/utils'
import type { LegalCasePreview } from '@/apis/legal.service'

type CategoryFilter = 'all' | 'intern' | 'wage' | 'stock' | 'freelancer' | 'harassment'
type SortOption = 'recommended' | 'recent' | 'severity'

interface CaseCard extends LegalCasePreview {
  category?: CategoryFilter
  severity?: 'low' | 'medium' | 'high'
  keywords?: string[]
  legalIssues?: string[]
  learnings?: string[]
  actions?: string[]
}

// Mock 데이터 (실제로는 API에서 가져옴)
const MOCK_CASES: CaseCard[] = [
  {
    id: 'case_01_intern_termination',
    title: '수습 3개월 만에 "내일부터 나오지 마" 통보 받은 인턴',
    situation: '정규직 전환을 기대하며 인턴을 시작했지만, 별도 서면 통보 없이 구두로 계약 해지 통보를 받은 사례입니다.',
    main_issues: ['수습해고', '부당해고', '인턴'],
    category: 'intern',
    severity: 'high',
    keywords: ['#수습해고', '#부당해고', '#인턴'],
    legalIssues: [
      '근로기준법 제27조: 수습·해고 관련 규정',
      '서면통지 의무 위반 가능성',
      '실질 근로자성 인정 여부'
    ],
    learnings: [
      '수습 기간에도 근로기준법이 적용된다',
      '해고·계약해지는 가능하면 서면 통지 요구',
      '구두 통보만으로는 법적 효력이 약할 수 있다'
    ],
    actions: [
      '계약서·카톡·메일 등 증거 정리',
      'HR/대표와의 1차 대화 준비',
      '공공 상담기관(노무사·노동상담센터 등) 문의 고려'
    ]
  },
  {
    id: 'case_02_unpaid_overtime',
    title: '야근·주말 근무인데 초과수당 0원, "연봉에 다 포함"이라고 말하는 회사',
    situation: '주 52시간을 초과하여 근무하는데도 연장근로 수당이 지급되지 않고, 회사는 "연봉에 모두 포함되어 있다"고 주장하는 사례입니다.',
    main_issues: ['임금체불', '초과근무', '가산수당'],
    category: 'wage',
    severity: 'high',
    keywords: ['#임금체불', '#초과근무', '#가산수당'],
    legalIssues: [
      '근로기준법 제56조: 연장근로 가산수당 지급 의무',
      '"연봉에 포함"이라는 말만으로는 가산수당을 대체할 수 없음',
      '주 52시간 초과 근무 시 가산수당 필수'
    ],
    learnings: [
      '"연봉에 다 포함"이라는 말만으로 초과수당을 대체할 수 없다',
      '주 52시간 초과 시 50% 가산수당 필수',
      '출퇴근 기록을 반드시 보관해야 함'
    ],
    actions: [
      '출퇴근 기록, 근무 시간 증거 수집',
      '회사에 연장근로 수당 지급 요청 (서면)',
      '고용노동부 1350 상담센터 신고 고려'
    ]
  },
  {
    id: 'case_03_stock_option',
    title: '스톡옵션 계약서에 행사 조건이 모호하게 적혀있어요',
    situation: '스톡옵션 부여 조건과 행사 조건이 불명확하게 기재되어 있어, 실제 행사 시 문제가 발생할 가능성이 있는 사례입니다.',
    main_issues: ['스톡옵션', '계약조항', 'IP'],
    category: 'stock',
    severity: 'medium',
    keywords: ['#스톡옵션', '#계약조항', '#IP'],
    legalIssues: [
      '스톡옵션 행사 조건 명시 의무',
      '부여 시점과 행사 시점의 주가 차이',
      '퇴사 시 행사 권리 소멸 여부'
    ],
    learnings: [
      '스톡옵션 행사 조건은 반드시 명확히 기재되어야 함',
      '부여 시점과 행사 시점을 구분해야 함',
      '퇴사 시 행사 권리 소멸 여부 확인 필요'
    ],
    actions: [
      '계약서의 스톡옵션 조항 재검토',
      '회사에 행사 조건 명확화 요청',
      '변호사 상담 고려 (복잡한 경우)'
    ]
  },
  {
    id: 'case_04_freelancer_payment',
    title: '프리랜서 프로젝트 완료했는데 대금이 3개월째 안 들어와요',
    situation: '프로젝트를 완료하고 납품했지만, 계약서에 명시된 대금 지급일로부터 3개월이 지나도 대금이 지급되지 않는 사례입니다.',
    main_issues: ['프리랜서', '대금미지급', '용역계약'],
    category: 'freelancer',
    severity: 'high',
    keywords: ['#프리랜서', '#대금미지급', '#용역계약'],
    legalIssues: [
      '용역계약상 대금 지급 의무',
      '지연 손해금 청구 가능성',
      '실질 근로자성 인정 여부 (4대보험)'
    ],
    learnings: [
      '용역계약서에 대금 지급일을 명확히 기재해야 함',
      '지연 시 지연 손해금 청구 가능',
      '실질적으로 근로자에 가까우면 4대보험 가입 가능'
    ],
    actions: [
      '계약서, 납품 증거, 대화 기록 수집',
      '회사에 대금 지급 최고장 발송',
      '소액사건심판 또는 변호사 상담 고려'
    ]
  },
  {
    id: 'case_05_harassment',
    title: '팀장이 단톡방에서 반복적으로 모욕적인 말을 해요',
    situation: '팀장이 단체 채팅방에서 특정 직원을 지목하여 반복적으로 모욕적이고 인격 모독적인 발언을 하는 사례입니다.',
    main_issues: ['직장내괴롭힘', '모욕', '인격모독'],
    category: 'harassment',
    severity: 'high',
    keywords: ['#직장내괴롭힘', '#모욕', '#인격모독'],
    legalIssues: [
      '직장 내 괴롭힘 방지 및 근로자 보호에 관한 법률',
      '반복성과 지속성 판단 기준',
      '업무상 적정 범위를 벗어난 행위'
    ],
    learnings: [
      '직장 내 괴롭힘은 반복성과 지속성이 중요',
      '단톡방, 이메일 등 모든 증거를 보관해야 함',
      '회사에 신고하고 대응을 요구할 권리가 있음'
    ],
    actions: [
      '단톡방 캡처, 녹음 등 모든 증거 수집',
      '회사 인사팀 또는 상급자에게 신고',
      '고용노동부 직장 내 괴롭힘 신고 고려'
    ]
  }
]

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: '전체',
  intern: '인턴/수습',
  wage: '근로시간·임금',
  stock: '스톡옵션',
  freelancer: '프리랜서',
  harassment: '직장 내 괴롭힘',
}

const SEVERITY_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: '주의', color: 'bg-green-100 text-green-700 border-green-300' },
  medium: { label: '경고', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  high: { label: '매우 위험', color: 'bg-red-100 text-red-700 border-red-300' },
}

export default function CasesPage() {
  const router = useRouter()
  
  // 상태
  const [cases, setCases] = useState<CaseCard[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [sortOption, setSortOption] = useState<SortOption>('recommended')
  const [selectedCase, setSelectedCase] = useState<CaseCard | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // 초기 데이터 로드
  useEffect(() => {
    const loadCases = async () => {
      setLoading(true)
      try {
        // 실제 API 호출 시도
        if (searchQuery.trim()) {
          const apiCases = await searchLegalCases(searchQuery, 20)
          const convertedCases: CaseCard[] = apiCases.map((apiCase) => ({
            ...apiCase,
            category: 'all' as CategoryFilter,
            severity: 'medium' as const,
            keywords: apiCase.main_issues.map(issue => `#${issue}`),
          }))
          setCases(convertedCases.length > 0 ? convertedCases : MOCK_CASES)
        } else {
          // 검색어가 없으면 mock 데이터 사용
          setCases(MOCK_CASES)
        }
      } catch (error) {
        console.error('케이스 로드 오류:', error)
        // API 실패 시 mock 데이터 사용
        setCases(MOCK_CASES)
      } finally {
        setLoading(false)
      }
    }

    loadCases()
  }, [searchQuery])

  // 필터링 및 정렬
  const filteredAndSortedCases = cases
    .filter(caseItem => {
      if (categoryFilter === 'all') return true
      return caseItem.category === categoryFilter
    })
    .filter(caseItem => {
      if (!searchQuery.trim()) return true
      const query = searchQuery.toLowerCase()
      return (
        caseItem.title.toLowerCase().includes(query) ||
        caseItem.situation.toLowerCase().includes(query) ||
        caseItem.main_issues.some(issue => issue.toLowerCase().includes(query))
      )
    })
    .sort((a, b) => {
      switch (sortOption) {
        case 'severity':
          const severityOrder = { high: 3, medium: 2, low: 1 }
          return (severityOrder[b.severity || 'medium'] || 0) - (severityOrder[a.severity || 'medium'] || 0)
        case 'recent':
          // 최근 추가 순 (임시로 ID 기준)
          return b.id.localeCompare(a.id)
        case 'recommended':
        default:
          return 0
      }
    })

  const handleCaseClick = (caseItem: CaseCard) => {
    setSelectedCase(caseItem)
    setIsModalOpen(true)
  }

  const handleAnalyzeClick = () => {
    setIsModalOpen(false)
    router.push('/legal/situation')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FileWarning className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              실제처럼 구성한 청년 법률 케이스 모음
            </h1>
          </div>
          <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
            수습 해고, 무급 야근, 스톡옵션, 프리랜서 대금 미지급…
            <br />
            실제로 자주 발생하는 상황을 케이스로 정리했습니다.
          </p>
        </div>

        {/* Filter / Search Area */}
        <div className="mb-6 space-y-4">
          {/* 검색바 */}
          <div className="flex gap-3">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="수습 해고, 스톡옵션 같이 키워드로 찾아보세요"
              className="flex-1"
            />
            <Button
              onClick={() => {}}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Search className="w-4 h-4 mr-2" />
              검색
            </Button>
          </div>

          {/* 필터 및 정렬 */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* 카테고리 필터 */}
            <div className="flex flex-wrap gap-2">
              {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map((category) => (
                <button
                  key={category}
                  onClick={() => setCategoryFilter(category)}
                  className={cn(
                    "px-4 py-2 rounded-full text-sm font-medium transition-all",
                    categoryFilter === category
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-white border border-slate-300 text-slate-700 hover:border-blue-400 hover:bg-blue-50"
                  )}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              ))}
            </div>

            {/* 정렬 */}
            <Select value={sortOption} onValueChange={(value) => setSortOption(value as SortOption)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recommended">추천순</SelectItem>
                <SelectItem value="recent">최근 추가</SelectItem>
                <SelectItem value="severity">심각도 높은 순</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cases Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-5">
                  <div className="h-4 bg-slate-200 rounded mb-3" />
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-3" />
                  <div className="h-20 bg-slate-200 rounded mb-3" />
                  <div className="h-6 bg-slate-200 rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAndSortedCases.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600 mb-4">
                아직 준비된 케이스가 많지 않아요.
                <br />
                먼저 [상황 분석]에서 본인 상황을 입력해보셔도 좋아요.
              </p>
              <Button
                onClick={() => router.push('/legal/situation')}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                상황 분석으로 이동
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedCases.map((caseItem) => (
              <Card
                key={caseItem.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
                onClick={() => handleCaseClick(caseItem)}
              >
                <CardContent className="p-4 sm:p-5">
                  {/* 상단 라벨 영역 */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs bg-slate-100 text-slate-700 rounded-full px-2 py-1 font-medium">
                      {CATEGORY_LABELS[caseItem.category || 'all']}
                    </span>
                    {caseItem.severity && (
                      <span className={cn(
                        "text-xs rounded-full px-2 py-1 font-medium border",
                        SEVERITY_LABELS[caseItem.severity].color
                      )}>
                        {SEVERITY_LABELS[caseItem.severity].label}
                      </span>
                    )}
                  </div>

                  {/* 제목 */}
                  <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2">
                    {caseItem.title}
                  </h3>

                  {/* 요약 */}
                  <p className="text-sm text-slate-600 mb-3 line-clamp-3">
                    {caseItem.situation}
                  </p>

                  {/* 키워드 태그 */}
                  {caseItem.keywords && caseItem.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {caseItem.keywords.slice(0, 3).map((keyword, index) => (
                        <span
                          key={index}
                          className="text-xs bg-slate-50 text-slate-600 rounded-full px-2 py-1"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 푸터 */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <p className="text-xs text-slate-500">
                      핵심 쟁점: {caseItem.main_issues[0] || '법적 문제'}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-blue-600 hover:text-blue-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCaseClick(caseItem)
                      }}
                    >
                      자세히 보기
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Case Detail Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedCase && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <DialogTitle className="text-xl font-bold text-slate-900 mb-2">
                        {selectedCase.title}
                      </DialogTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-slate-100 text-slate-700 rounded-full px-2 py-1 font-medium">
                          {CATEGORY_LABELS[selectedCase.category || 'all']}
                        </span>
                        {selectedCase.severity && (
                          <span className={cn(
                            "text-xs rounded-full px-2 py-1 font-medium border",
                            SEVERITY_LABELS[selectedCase.severity].color
                          )}>
                            {SEVERITY_LABELS[selectedCase.severity].label}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsModalOpen(false)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </DialogHeader>

                <div className="space-y-6">
                  {/* [1] 상황 설명 */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      상황 설명
                    </h3>
                    <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {selectedCase.situation}
                      </p>
                    </div>
                  </div>

                  {/* [2] 법적 쟁점 */}
                  {selectedCase.legalIssues && selectedCase.legalIssues.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">
                        법적 쟁점
                      </h3>
                      <ul className="space-y-2">
                        {selectedCase.legalIssues.map((issue, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>{issue}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* [3] 배울 점 */}
                  {selectedCase.learnings && selectedCase.learnings.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">
                        이 케이스에서 배울 점
                      </h3>
                      <div className="space-y-2">
                        {selectedCase.learnings.map((learning, index) => (
                          <div key={index} className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-700">{learning}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* [4] 행동 가이드 */}
                  {selectedCase.actions && selectedCase.actions.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-3">
                        나도 비슷한 상황이라면?
                      </h3>
                      <ul className="space-y-2">
                        {selectedCase.actions.map((action, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* CTA 버튼 */}
                  <div className="pt-4 border-t border-slate-200">
                    <Button
                      onClick={handleAnalyzeClick}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      size="lg"
                    >
                      내 상황으로 분석 받기
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
