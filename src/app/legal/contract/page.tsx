'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Upload, FileText, Loader2, History, Calendar, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { analyzeContract } from '@/apis/legal.service'
import { uploadContractFile, saveContractAnalysis, getContractAnalysisHistory } from '@/apis/contract-history.service'
import { useToast } from '@/hooks/use-toast'

interface HistoryItem {
  id: string
  file_name: string
  risk_score: number
  risk_level: 'low' | 'medium' | 'high'
  summary?: string
  created_at: string
  analysis_result?: {
    issues?: any[]
  }
}

export default function ContractAnalysisPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  // 히스토리 로드
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoadingHistory(true)
        const historyData = await getContractAnalysisHistory(10)
        setHistory(historyData as HistoryItem[])
      } catch (error) {
        console.error('히스토리 로드 실패:', error)
      } finally {
        setLoadingHistory(false)
      }
    }
    loadHistory()
  }, [])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateString
    }
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default:
        return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getRiskLabel = (riskLevel: string) => {
    switch (riskLevel) {
      case 'high':
        return '높음'
      case 'medium':
        return '보통'
      default:
        return '낮음'
    }
  }

  const handleAnalyze = async () => {
    if (!file) {
      toast({
        variant: 'destructive',
        title: '파일 선택 필요',
        description: '파일을 선택해주세요.',
      })
      return
    }

    setIsAnalyzing(true)
    try {
      // 1. 파일을 Supabase Storage에 업로드 (선택적 - 실패해도 분석 계속)
      let fileUrl: string | null = null
      try {
        fileUrl = await uploadContractFile(file)
        if (fileUrl) {
          console.log('파일 업로드 완료:', fileUrl)
        } else {
          console.warn('파일 업로드 건너뜀 (버킷 없음), 분석은 계속 진행')
        }
      } catch (uploadError: any) {
        console.warn('파일 업로드 실패, 분석은 계속 진행:', uploadError)
        // 파일 업로드 실패해도 분석은 계속 진행 (로컬 스토리지만 사용)
        fileUrl = null
      }

      // 2. 계약서 분석 수행
      const result = await analyzeContract(file)
      
      // docId 생성 (UUID) - DB 저장 후 실제 ID 사용
      let docId = crypto.randomUUID()
      
      // 3. 분석 결과를 DB에 저장 (선택적 - 실패해도 계속 진행)
      try {
        if (fileUrl) {
          const savedId = await saveContractAnalysis(file, fileUrl, {
            ...result,
            contract_text: result.contract_text,
          })
          // DB에 저장된 ID 사용
          docId = savedId
          console.log('분석 결과 DB 저장 완료, ID:', docId)
        }
      } catch (saveError: any) {
        console.warn('DB 저장 실패, 로컬 스토리지만 사용:', saveError)
        // DB 저장 실패해도 로컬 스토리지에 저장하고 계속 진행
      }
      
      // 4. 분석 결과를 로컬 스토리지에 저장 (fallback)
      const analysisData = {
        risk_score: result.risk_score,
        summary: result.summary || '',
        contractText: result.contract_text || '',
        issues: result.issues || [],
        recommendations: result.recommendations || [],
        createdAt: new Date().toISOString(),
        fileUrl, // 파일 URL도 저장
      }
      localStorage.setItem(`contract_analysis_${docId}`, JSON.stringify(analysisData))
      
      // 5. 상세 페이지로 이동
      router.push(`/legal/contract/${docId}`)
    } catch (error: any) {
      console.error('분석 오류:', error)
      toast({
        variant: 'destructive',
        title: '분석 실패',
        description: error.message || '분석 중 오류가 발생했습니다.',
      })
      setIsAnalyzing(false)
    }
  }


  return (
    <div className="min-h-screen bg-slate-50">
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-slate-900">계약서 위험도 분석</h1>
          <p className="text-lg text-slate-600">업로드한 계약서를 분석하고, 위험한 조항을 알려드립니다. 계약을 서명하기 전에 체크하세요.</p>
        </div>

        {/* 파일 업로드 영역 */}
        {!isAnalyzing && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>파일 업로드</CardTitle>
              <CardDescription>
                PDF/HWPX 파일을 드래그하거나 클릭하여 업로드하세요.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center hover:border-blue-400 transition-colors cursor-pointer bg-white"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf,.hwpx,.hwp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Upload className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                <p className="text-lg font-medium text-slate-700 mb-2">
                  {file ? file.name : '파일을 드래그하거나 클릭하여 업로드'}
                </p>
                <p className="text-sm text-slate-500">
                  PDF, HWP, HWPX 형식 지원
                </p>
              </div>

              {file && (
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
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
                        <FileText className="w-5 h-5 mr-2" />
                        분석 시작
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 분석 중 로딩 */}
        {isAnalyzing && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                <div className="absolute inset-0 w-12 h-12 border-4 border-blue-100 rounded-full mx-auto"></div>
              </div>
              <p className="text-gray-700 font-medium">계약 조항 분석 중...</p>
              <p className="text-sm text-gray-500 mt-2">잠시만 기다려주세요</p>
            </div>
          </div>
        )}

        {/* 히스토리 섹션 */}
        {!isAnalyzing && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-slate-600" />
                <CardTitle>이전 분석 내역</CardTitle>
              </div>
              <CardDescription>
                이전에 분석한 계약서를 확인하거나 다시 분석할 수 있습니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                  <p>아직 분석한 계약서가 없습니다.</p>
                  <p className="text-sm mt-1">위에서 파일을 업로드하여 분석을 시작하세요.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {history.map((item) => {
                    const issueCount = item.analysis_result?.issues?.length || 0
                    return (
                      <div
                        key={item.id}
                        onClick={() => router.push(`/legal/contract/${item.id}`)}
                        className="border border-slate-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer bg-white"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                              <p className="text-sm font-medium text-slate-900 truncate">
                                {item.file_name || '계약서'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                              <Calendar className="w-3 h-3" />
                              <span>{formatDate(item.created_at)}</span>
                            </div>
                          </div>
                          <div className={`px-2 py-1 text-xs font-medium rounded border flex-shrink-0 ${getRiskColor(item.risk_level)}`}>
                            {getRiskLabel(item.risk_level)}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mb-3">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-600">위험도:</span>
                            <span className="text-sm font-bold text-slate-900">{item.risk_score}점</span>
                          </div>
                          {issueCount > 0 && (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              <span className="text-xs text-slate-600">{issueCount}개 조항</span>
                            </div>
                          )}
                        </div>

                        {item.summary && (
                          <p className="text-xs text-slate-600 line-clamp-2 mb-3">
                            {item.summary}
                          </p>
                        )}

                        <div className="flex items-center justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/legal/contract/${item.id}`)
                            }}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            상세 보기
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  )
}
