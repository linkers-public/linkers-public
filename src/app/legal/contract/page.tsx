'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Upload, 
  FileText, 
  Loader2, 
  History, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  FileCheck,
  Info,
  X,
  Zap
} from 'lucide-react'
import { analyzeContract } from '@/apis/legal.service'
import { uploadContractFile, saveContractAnalysis, getContractAnalysisHistory } from '@/apis/contract-history.service'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

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
  const [isDragging, setIsDragging] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [analysisStep, setAnalysisStep] = useState<number>(0)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      validateAndSetFile(selectedFile)
    }
  }

  const validateAndSetFile = (selectedFile: File) => {
    setUploadError(null)
    
    // 파일 크기 체크 (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setUploadError('파일 크기는 10MB를 초과할 수 없습니다.')
      return
    }

    // 파일 형식 체크
    const allowedExtensions = ['.pdf', '.hwpx', '.hwp']
    const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'))
    if (!allowedExtensions.includes(fileExtension)) {
      setUploadError('지원되는 형식: PDF, HWPX (일반 HWP는 변환 필요)')
      return
    }

    setFile(selectedFile)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      validateAndSetFile(droppedFile)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
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
        return 'text-red-700 bg-red-50 border-red-200'
      case 'medium':
        return 'text-amber-700 bg-amber-50 border-amber-200'
      default:
        return 'text-emerald-700 bg-emerald-50 border-emerald-200'
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
    setAnalysisError(null)
    setAnalysisStep(1)

    try {
      // Step 1: 파일 업로드
      let fileUrl: string | null = null
      try {
        fileUrl = await uploadContractFile(file)
        if (fileUrl) {
          console.log('파일 업로드 완료:', fileUrl)
        }
      } catch (uploadError: any) {
        console.warn('파일 업로드 실패, 분석은 계속 진행:', uploadError)
        fileUrl = null
      }

      setAnalysisStep(2)

      // Step 2: 계약서 분석 수행
      const result = await analyzeContract(file)
      
      setAnalysisStep(3)
      
      // docId 생성 (UUID) - DB 저장 후 실제 ID 사용
      let docId = crypto.randomUUID()
      
      // Step 3: 분석 결과를 DB에 저장
      try {
        if (fileUrl) {
          const savedId = await saveContractAnalysis(file, fileUrl, {
            ...result,
            contract_text: result.contract_text,
          })
          docId = savedId
          console.log('분석 결과 DB 저장 완료, ID:', docId)
        }
      } catch (saveError: any) {
        console.warn('DB 저장 실패, 로컬 스토리지만 사용:', saveError)
      }
      
      // 분석 결과를 로컬 스토리지에 저장 (fallback)
      const analysisData = {
        risk_score: result.risk_score,
        summary: result.summary || '',
        contractText: result.contract_text || '',
        issues: result.issues || [],
        recommendations: result.recommendations || [],
        createdAt: new Date().toISOString(),
        fileUrl,
      }
      localStorage.setItem(`contract_analysis_${docId}`, JSON.stringify(analysisData))
      
      // 상세 페이지로 이동
      router.push(`/legal/contract/${docId}`)
    } catch (error: any) {
      console.error('분석 오류:', error)
      setAnalysisError(error.message || '분석 중 오류가 발생했습니다.')
      setIsAnalyzing(false)
      setAnalysisStep(0)
      toast({
        variant: 'destructive',
        title: '분석 실패',
        description: error.message || '분석 중 오류가 발생했습니다.',
      })
    }
  }

  const handleSampleContract = async (sampleType: 'intern' | 'freelancer') => {
    // 샘플 계약서 처리 (백엔드에서 샘플 docId 제공 시 사용)
    // 임시로 알림만 표시
    toast({
      title: '샘플 계약서',
      description: '샘플 계약서 기능은 곧 제공될 예정입니다.',
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  const getFileIcon = (fileName: string) => {
    const ext = fileName.toLowerCase().split('.').pop()
    if (ext === 'pdf') return '📄'
    if (ext === 'hwpx' || ext === 'hwp') return '📝'
    return '📎'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50">
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
        {/* 상단 영역: 페이지 타이틀 & 설명 */}
        <div className="mb-12">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            {/* 좌측: 타이틀 & 설명 */}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4 text-slate-900 leading-tight">
                계약서 올리고,<br />
                AI에게 먼저 점검 받아보세요
              </h1>
              <p className="text-base md:text-lg text-slate-600 leading-relaxed mb-6">
                근로·프리랜서·용역·스톡옵션 계약서를 업로드하면<br />
                위험 조항, 법령 기준과의 차이, 수정이 필요한 부분을 카드로 정리해 드립니다.
              </p>
            </div>

            {/* 우측: 배지/태그 */}
            <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-xs font-semibold text-blue-700 border border-blue-200">
                <Zap className="w-3 h-3" />
                청년 · 프리랜서 대상
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 text-xs font-semibold text-purple-700 border border-purple-200">
                <Sparkles className="w-3 h-3" />
                해커톤 데모 버전
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-xs font-semibold text-amber-700 border border-amber-200">
                <Info className="w-3 h-3" />
                법률 정보 제공 서비스
              </div>
            </div>
          </div>
        </div>

        {/* 메인: 2컬럼 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-12">
          {/* 좌측: 업로드 영역 (약 60%) */}
          <div className="lg:col-span-3 space-y-6">
            {/* 업로드 카드 */}
            <Card className="border-2 border-slate-200 shadow-xl bg-white">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">1. 계약서 파일 업로드</CardTitle>
                    <CardDescription className="mt-1">
                      PDF, HWPX 파일을 올려주세요.<br />
                      <span className="text-amber-600">스캔본(이미지) 계약서는 현재 데모에서 정확도가 떨어질 수 있습니다.</span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* 업로드 박스 */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => !file && document.getElementById('file-input')?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer relative",
                    isDragging 
                      ? "border-blue-500 bg-blue-50/50 shadow-lg" 
                      : file 
                        ? "border-slate-300 bg-slate-50" 
                        : "border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/30"
                  )}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept=".pdf,.hwpx,.hwp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {!file ? (
                    <>
                      <div className={cn(
                        "w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all",
                        isDragging 
                          ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg scale-110" 
                          : "bg-gradient-to-br from-slate-100 to-slate-200"
                      )}>
                        <Upload className={cn(
                          "w-10 h-10 transition-colors",
                          isDragging ? "text-white" : "text-slate-400"
                        )} />
                      </div>
                      <p className={cn(
                        "text-lg font-bold mb-2 transition-colors",
                        isDragging ? "text-blue-700" : "text-slate-700"
                      )}>
                        {isDragging 
                          ? "파일을 여기로 가져오면 바로 분석을 시작할 수 있어요." 
                          : "여기에 파일을 드래그하거나 클릭해서 선택하세요"}
                      </p>
                      <p className="text-sm text-slate-500 mt-2">
                        지원 형식: PDF, HWPX (일반 HWP는 변환 필요)<br />
                        최대 10MB (데모 환경 기준)
                      </p>
                    </>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-5xl">{getFileIcon(file.name)}</div>
                        <div className="text-left">
                          <p className="text-lg font-bold text-slate-900 mb-1">{file.name}</p>
                          <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setFile(null)
                          setUploadError(null)
                        }}
                        className="text-slate-600 hover:text-slate-900"
                      >
                        <X className="w-4 h-4 mr-2" />
                        다른 파일로 변경하기
                      </Button>
                    </div>
                  )}
                </div>

                {/* 업로드 에러 메시지 */}
                {uploadError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700">{uploadError}</p>
                </div>
              </div>
                )}

                {/* 분석 버튼 영역 */}
                {file && !isAnalyzing && (
                  <div className="mt-6 space-y-3">
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg h-14 text-base font-semibold"
                      size="lg"
                    >
                      <FileCheck className="w-5 h-5 mr-2" />
                      이 계약서로 위험도 분석 시작하기
                    </Button>
                    <p className="text-xs text-center text-slate-500">
                      분석에는 10~20초 정도 걸릴 수 있습니다. (해커톤 데모 환경 기준)<br />
                      분석이 끝나면 상세 페이지로 자동 이동합니다.
                    </p>
                  </div>
                )}

                {/* 분석 중 로딩 */}
                {isAnalyzing && (
                  <div className="mt-6 space-y-4">
                    {/* Step Progress Indicator */}
                    <div className="flex items-center justify-between mb-6">
                      {[
                        { step: 1, label: '텍스트 추출' },
                        { step: 2, label: '조항 분류' },
                        { step: 3, label: '위험도 분석' },
                      ].map((item) => (
                        <div key={item.step} className="flex-1 flex flex-col items-center">
                          <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-all",
                            analysisStep >= item.step
                              ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg scale-110"
                              : "bg-slate-200 text-slate-400"
                          )}>
                            {analysisStep > item.step ? (
                              <CheckCircle2 className="w-6 h-6" />
                            ) : (
                              item.step
                            )}
                          </div>
                          <p className={cn(
                            "text-xs font-medium text-center",
                            analysisStep >= item.step ? "text-blue-600" : "text-slate-400"
                          )}>
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="text-center py-8">
                      <div className="relative inline-block mb-4">
                        <div className="absolute inset-0 w-16 h-16 border-4 border-blue-100 rounded-full animate-pulse"></div>
                        <Loader2 className="w-16 h-16 animate-spin text-blue-600 relative" />
                      </div>
                      <p className="text-lg font-bold text-slate-900 mb-2">분석 중...</p>
                      <p className="text-sm text-slate-600">
                        법령·표준계약서와 비교하여 위험 신호를 찾고 있습니다.
                      </p>
                    </div>
                  </div>
                )}

                {/* 분석 실패 에러 */}
                {analysisError && (
                  <div className="mt-6 p-6 bg-red-50 border-2 border-red-200 rounded-xl">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-bold text-red-900 mb-2">계약서 분석에 실패했습니다.</h3>
                        <p className="text-sm text-red-700 mb-4">{analysisError}</p>
                        <ul className="text-sm text-red-700 space-y-1 mb-4">
                          <li>· 이미지 기반 스캔 PDF일 수 있어요.</li>
                          <li>· 다시 시도하거나, 다른 파일로 테스트해 주세요.</li>
                        </ul>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setAnalysisError(null)
                              setFile(null)
                            }}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            다시 시도하기
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSampleContract('intern')}
                            className="border-slate-300"
                          >
                            샘플 계약서로 대신 살펴보기
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 샘플 계약서 섹션 */}
            {!file && !isAnalyzing && (
              <Card className="border-2 border-slate-200 shadow-lg bg-gradient-to-br from-white to-slate-50/50">
                <CardContent className="p-6">
                  <p className="text-sm text-slate-600 mb-4 text-center">
                    계약서가 없나요? 샘플로 먼저 구경해보세요.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handleSampleContract('intern')}
                      className="h-auto py-4 border-2 border-slate-300 hover:border-blue-400 hover:bg-blue-50"
                    >
                      <div className="text-left w-full">
                        <p className="font-semibold text-slate-900 mb-1">IT 인턴 근로계약</p>
                        <p className="text-xs text-slate-600">샘플로 분석하기</p>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleSampleContract('freelancer')}
                      className="h-auto py-4 border-2 border-slate-300 hover:border-blue-400 hover:bg-blue-50"
                    >
                      <div className="text-left w-full">
                        <p className="font-semibold text-slate-900 mb-1">프리랜서 용역 계약</p>
                        <p className="text-xs text-slate-600">샘플로 분석하기</p>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 우측: 히스토리 & 안내 (약 40%) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 최근 분석 카드 */}
            <Card className="border-2 border-slate-200 shadow-lg bg-white">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-md">
                    <History className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-bold">최근에 분석한 계약서</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      다시 보고 싶은 분석 결과가 있다면 여기서 바로 이동할 수 있습니다.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                      <p className="text-sm text-slate-600">내역을 불러오는 중...</p>
                    </div>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl w-16 h-16 mx-auto mb-4 shadow-md">
                      <History className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-700 mb-2">
                      아직 분석한 계약서가 없습니다.
                    </p>
                    <p className="text-xs text-slate-500 mb-4">
                      첫 계약서를 올려서, 위험 신호를 미리 점검해 보세요.
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        document.getElementById('file-input')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                        setTimeout(() => document.getElementById('file-input')?.click(), 500)
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      첫 분석 시작하기
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.slice(0, 5).map((item) => {
                      const issueCount = item.analysis_result?.issues?.length || 0
                      return (
                        <Card
                          key={item.id}
                          onClick={() => router.push(`/legal/contract/${item.id}`)}
                          className="border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all cursor-pointer bg-white group"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="p-1 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                                    <FileText className="w-3 h-3 text-blue-600" />
                                  </div>
                                  <p className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-700 transition-colors">
                                    {item.file_name || '계약서'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDate(item.created_at)}</span>
                                </div>
                              </div>
                              <div className={cn(
                                "px-2 py-1 text-xs font-bold rounded-full border flex-shrink-0 shadow-sm",
                                getRiskColor(item.risk_level)
                              )}>
                                {getRiskLabel(item.risk_level)}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 mb-3 pb-3 border-b border-slate-100">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs text-slate-600">위험도:</span>
                                <span className="text-sm font-extrabold text-slate-900">{item.risk_score}점</span>
                              </div>
                              {issueCount > 0 && (
                                <div className="flex items-center gap-1.5">
                                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                                  <span className="text-xs font-medium text-slate-700">{issueCount}개 조항</span>
                                </div>
                              )}
                            </div>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/legal/contract/${item.id}`)
                              }}
                              className="w-full text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              분석 결과 다시 보기
                              <ArrowRight className="w-3 h-3 ml-2" />
                            </Button>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 안내/Tip 섹션 */}
            <Card className="border-2 border-blue-200 shadow-lg bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                    <Info className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-lg font-bold">어떤 계약서를 올리면 좋나요?</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">·</span>
                    <span>첫 입사/인턴/수습 근로계약서</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">·</span>
                    <span>프리랜서/용역 계약서</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">·</span>
                    <span>스톡옵션/인센티브/성과급 조항이 포함된 계약서</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* 데모 버전 한계 안내 */}
            <Card className="border-2 border-amber-200 shadow-lg bg-amber-50/50">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-amber-700" />
                  </div>
                  <CardTitle className="text-lg font-bold">현재 데모 버전에서의 한계</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-amber-800">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">·</span>
                    <span>스캔된 이미지 기반 PDF는 텍스트 추출이 잘 안 될 수 있어요.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">·</span>
                    <span>일반 HWP는 변환 후 업로드하는 걸 권장합니다.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600 mt-1">·</span>
                    <span>이 서비스는 법률 자문이 아니라, 정보 제공용입니다.</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 페이지 하단 디스클레이머 */}
        {!isAnalyzing && (
          <Card className="bg-amber-50 border-2 border-amber-200 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-amber-100 rounded-lg flex-shrink-0">
                  <ShieldAlert className="w-6 h-6 text-amber-700" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-amber-900 mb-3">
                    이 분석 결과는 변호사·노무사의 법률 자문을 대체하지 않습니다.
                  </p>
                  <p className="text-sm text-amber-800 leading-relaxed">
                    공개된 법령·표준계약·가이드 문서를 바탕으로, 사용자가 계약 내용을 이해하기 쉽도록 정리해 주는 도구입니다.
                    <br />
                    실제 소송, 분쟁 대응, 합의 등은 반드시 전문가의 도움을 받으셔야 합니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
