'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { Loader2, FileText, Calendar, Building2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Document {
  id: string  // UUID
  title?: string
  source?: string
  agency?: string
  external_id?: string
  budget_min?: number
  budget_max?: number
  start_date?: string
  end_date?: string
  status?: string
  created_at?: string
  updated_at?: string
}

export default function DocsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/rag/docs?limit=100')
      
      if (!response.ok) {
        throw new Error('문서 목록을 불러오는데 실패했습니다')
      }
      
      const data = await response.json()
      setDocuments(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '문서 목록을 불러오는데 실패했습니다')
      console.error('문서 목록 조회 오류:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentClick = (doc: Document) => {
    const docId = doc.id
    router.push(`/analysis/${docId}`)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '날짜 없음'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  }

  const getDocumentTitle = (doc: Document) => {
    return doc.title || `문서 #${doc.id.substring(0, 8)}`
  }

  const getOrganization = (doc: Document) => {
    return doc.agency || '기관 정보 없음'
  }

  const filteredDocuments = documents.filter((doc) => {
    if (!searchTerm) return true
    const title = getDocumentTitle(doc).toLowerCase()
    const org = getOrganization(doc).toLowerCase()
    const search = searchTerm.toLowerCase()
    return title.includes(search) || org.includes(search)
  })

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">업로드된 문서 목록</h1>
          <p className="text-slate-600">
            업로드된 모든 문서를 확인하고 관리할 수 있습니다.
          </p>
        </div>

        {/* 검색 바 */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="문서 제목이나 기관명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-slate-600">문서 목록을 불러오는 중...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchDocuments} variant="outline">
              다시 시도
            </Button>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
            <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <p className="text-slate-600 text-lg mb-2">
              {searchTerm ? '검색 결과가 없습니다' : '업로드된 문서가 없습니다'}
            </p>
            {!searchTerm && (
              <Button
                onClick={() => router.push('/upload')}
                className="mt-4"
              >
                문서 업로드하기
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleDocumentClick(doc)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {getDocumentTitle(doc)}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building2 className="w-4 h-4" />
                    <span className="truncate">{getOrganization(doc)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(doc.created_at)}</span>
                  </div>
                  {doc.budget_min && doc.budget_max && (
                    <div className="text-sm text-gray-600">
                      예산: {doc.budget_min.toLocaleString()}원 ~ {doc.budget_max.toLocaleString()}원
                    </div>
                  )}
                </div>

                {doc.source && (
                  <div className="pt-4 border-t border-gray-100">
                    <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {doc.source}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 통계 정보 */}
        {!loading && !error && documents.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            총 {documents.length}개의 문서가 있습니다
            {searchTerm && filteredDocuments.length !== documents.length && (
              <span className="ml-2">
                (검색 결과: {filteredDocuments.length}개)
              </span>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

