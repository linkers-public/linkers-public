'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchResultCard } from '@/components/legal/SearchResultCard'
import { Search, Loader2 } from 'lucide-react'
import { searchLegalCases, analyzeLegalSituation } from '@/apis/legal.service'

export default function LegalSearchPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<
    Array<{
      scenario: string
      riskLevel: 'high' | 'medium' | 'low'
      legalBasis: string
      recommendation: string
      relatedLaws?: string[]
    }>
  >([])
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      alert('검색어를 입력해주세요.')
      return
    }

    setIsSearching(true)
    setSearchResults([])
    setError(null)

    try {
      // 1. 케이스 검색
      const cases = await searchLegalCases(searchQuery, 5)

      // 2. 상황 분석으로 상세 정보 가져오기
      const analysisResult = await analyzeLegalSituation(searchQuery)

      // 케이스와 분석 결과를 결합하여 결과 생성
      const results = cases.map((caseItem, index) => {
        // 분석 결과에서 관련 이슈 찾기
        const relatedIssue = analysisResult.issues[index] || analysisResult.issues[0]
        const relatedRecommendation = analysisResult.recommendations[index] || analysisResult.recommendations[0]
        const relatedGrounding = analysisResult.grounding.find(
          (g) => g.source_type === 'case' && g.title.includes(caseItem.title)
        ) || analysisResult.grounding[0]

        return {
          scenario: caseItem.situation || caseItem.title,
          riskLevel: (relatedIssue?.severity || 'medium') as 'high' | 'medium' | 'low',
          legalBasis: relatedGrounding?.snippet || relatedIssue?.legal_basis.join(', ') || '',
          recommendation: relatedRecommendation
            ? `${relatedRecommendation.title}\n${relatedRecommendation.description}\n${relatedRecommendation.steps.join('\n')}`
            : '',
          relatedLaws: relatedIssue?.legal_basis || [],
        }
      })

      // 케이스가 없으면 분석 결과만 사용
      if (results.length === 0 && analysisResult.issues.length > 0) {
        const issueResults = analysisResult.issues.map((issue) => ({
          scenario: issue.name,
          riskLevel: issue.severity as 'high' | 'medium' | 'low',
          legalBasis: issue.legal_basis.join(', '),
          recommendation: analysisResult.recommendations
            .find((rec) => rec.title.includes(issue.name))
            ?.description || '',
          relatedLaws: issue.legal_basis,
        }))
        setSearchResults(issueResults)
      } else {
        setSearchResults(results)
      }
    } catch (err: any) {
      console.error('검색 오류:', err)
      setError(err.message || '검색 중 오류가 발생했습니다. 백엔드 서버가 실행 중인지 확인해주세요.')
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
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
          법률 검색
        </h1>
        <p className="text-lg text-slate-600">
          법적 상황을 입력하면 RAG 시스템이 관련 법률 시나리오와 대응 방법을 제공합니다.
        </p>
      </div>

      {/* 검색 입력 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-6 h-6 text-blue-600" />
            법적 상황 검색
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="예: 근로계약서에 최저임금 이하의 급여가 명시되어 있습니다..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 text-lg py-6"
            />
            <Button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-semibold"
              size="lg"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  검색 중...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  검색
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            법적 문제나 상황을 자세히 설명하면 더 정확한 검색 결과를 얻을 수 있습니다.
          </p>
        </CardContent>
      </Card>

      {/* 에러 메시지 */}
      {error && (
        <Card className="border-red-200 bg-red-50 mb-8">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* 검색 결과 */}
      {searchResults.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-slate-900">
              검색 결과 ({searchResults.length}개)
            </h2>
          </div>
          <div className="space-y-4">
            {searchResults.map((result, index) => (
              <SearchResultCard key={index} result={result} />
            ))}
          </div>
        </div>
      )}

      {/* 검색 결과 없음 */}
      {!isSearching && !error && searchResults.length === 0 && searchQuery && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-slate-600">검색 결과가 없습니다.</p>
            <p className="text-sm text-slate-500 mt-2">
              다른 키워드로 검색해보시거나 더 자세한 설명을 입력해주세요.
            </p>
          </CardContent>
        </Card>
      )}

      {/* 초기 상태 */}
      {!isSearching && searchResults.length === 0 && !searchQuery && (
        <Card className="text-center py-12">
          <CardContent>
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-lg text-slate-600 mb-2">법적 상황을 검색해보세요</p>
            <p className="text-sm text-slate-500">
              위의 검색창에 법적 문제나 상황을 입력하고 검색 버튼을 클릭하세요.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

