'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, ArrowLeft, BookOpen, ExternalLink, Loader2 } from 'lucide-react'
import { searchLegalCases } from '@/apis/legal.service'

interface CaseItem {
  id: string
  title: string
  summary: string
  tags: string[]
}

export default function CasesPage() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [cases, setCases] = useState<CaseItem[]>([])

  // 임시 데이터 (실제로는 API에서 가져와야 함)
  const mockCases: CaseItem[] = [
    {
      id: '1',
      title: '수습 인턴, 평가 없이 계약 종료 통보',
      summary: '수습기간 중 성과 평가 없이 일방적으로 계약 종료를 통보받은 사례. 근로기준법 위반 가능성 확인.',
      tags: ['#수습해고', '#임금체불', '#해고'],
    },
    {
      id: '2',
      title: '초과근무 수당 미지급 사례',
      summary: '주 52시간 초과근무에 대한 가산수당이 지급되지 않은 경우. 근로기준법 제56조 위반.',
      tags: ['#임금체불', '#초과근무', '#가산수당'],
    },
    {
      id: '3',
      title: '스톡옵션 계약 조항 불명확',
      summary: '스톡옵션 부여 조건과 행사 조건이 불명확하게 기재된 계약서 사례.',
      tags: ['#스톡옵션', '#계약조항', '#IP'],
    },
  ]

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('검색어를 입력해주세요.')
      return
    }

    setIsSearching(true)
    try {
      // 실제 API 호출
      const apiCases = await searchLegalCases(searchQuery, 10)
      
      // API 응답을 CaseItem 형식으로 변환
      const convertedCases: CaseItem[] = apiCases.map((apiCase) => ({
        id: apiCase.id,
        title: apiCase.title,
        summary: apiCase.situation || apiCase.title,
        tags: apiCase.main_issues.map((issue) => `#${issue}`),
      }))
      
      setCases(convertedCases.length > 0 ? convertedCases : mockCases)
    } catch (error: any) {
      console.error('케이스 검색 오류:', error)
      // API 실패 시 mock 데이터 사용
      const filtered = mockCases.filter(
        (caseItem) =>
          caseItem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          caseItem.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          caseItem.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      setCases(filtered.length > 0 ? filtered : mockCases)
      alert(error.message || '케이스 검색 중 오류가 발생했습니다.')
    } finally {
      setIsSearching(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
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
            유사 케이스 찾기
          </h1>
          <p className="text-lg text-slate-600">
            비슷한 법적 상황에 대한 사례를 찾아보고, 어떻게 대응했는지 확인하세요.
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="예) 수습해고, 임금체불, 스톡옵션"
                className="flex-1 text-base"
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                size="lg"
              >
                {isSearching ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    검색
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Cases List */}
        <div className="space-y-4">
          {(cases.length > 0 ? cases : mockCases).map((caseItem) => (
            <Card key={caseItem.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="mb-2 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600" />
                      {caseItem.title}
                    </CardTitle>
                    <CardDescription className="text-base text-slate-700 mb-3">
                      {caseItem.summary}
                    </CardDescription>
                    <div className="flex flex-wrap gap-2">
                      {caseItem.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push(`/legal/cases/${caseItem.id}`)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  상세보기
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

