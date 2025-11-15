'use client'

import { useState } from 'react'
import { Upload, FileText, Link as LinkIcon, Loader2, CheckCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadAnnouncement, extractPdfText, analyzeAnnouncement } from '@/apis/public-announcement.service'
import AnnouncementAnalysisResult from '@/components/AnnouncementAnalysisResult'

interface PublicAnnouncementUploadProps {
  onUploadComplete?: (announcementId: number) => void
}

interface AnalysisResult {
  summary?: string
  requiredSkills?: string[]
  budgetMin?: number
  budgetMax?: number
  durationMonths?: number
  organizationName?: string
  deadline?: string
  location?: string
}

export default function PublicAnnouncementUpload({
  onUploadComplete,
}: PublicAnnouncementUploadProps) {
  const [uploadType, setUploadType] = useState<'file' | 'url'>('file')
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'upload' | 'analyzing' | 'complete'>('upload')
  const [announcementId, setAnnouncementId] = useState<number | null>(null)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async () => {
    if (uploadType === 'file' && !file) {
      alert('파일을 선택해주세요.')
      return
    }

    if (uploadType === 'url' && !url.trim()) {
      alert('URL을 입력해주세요.')
      return
    }

    // 파일명에서 자동으로 title 추출
    const title = file 
      ? file.name.replace(/\.[^/.]+$/, '') 
      : url || '제목 없음'

    setLoading(true)
    setStep('upload')

    try {
      // 1. 공고 업로드
      const { id, pdfUrl } = await uploadAnnouncement(
        uploadType === 'file' ? file : null,
        uploadType === 'url' ? url : null,
        title
      )

      setAnnouncementId(id)
      setStep('analyzing')

      // 2. 파일 텍스트 추출 (파일인 경우, 서버에서 자동 처리)
      let rawText = ''
      if (pdfUrl) {
        // PDF URL이 있는 경우에만 텍스트 추출 시도
        try {
          rawText = await extractPdfText(pdfUrl)
        } catch (e) {
          // PDF가 아니거나 추출 실패 시 서버에서 처리됨
          rawText = `파일 업로드 완료. 서버에서 자동으로 처리 중입니다...`
        }
      } else if (url) {
        // URL인 경우 페이지 텍스트 추출 (실제로는 서버에서 처리)
        rawText = `URL: ${url}\n공고 내용을 분석 중입니다...`
      } else if (file) {
        // 파일 업로드 시 서버에서 자동 처리
        rawText = `파일 업로드 완료. 서버에서 자동으로 처리 중입니다...`
      }

      // 3. AI 분석
      const analysis = await analyzeAnnouncement(id, rawText)
      
      // 분석 결과 저장
      setAnalysisResult({
        summary: analysis.summary,
        requiredSkills: analysis.requiredSkills,
        budgetMin: analysis.budgetMin,
        budgetMax: analysis.budgetMax,
        durationMonths: analysis.durationMonths,
        organizationName: analysis.organizationName,
        deadline: analysis.deadline,
        location: analysis.location,
      })

      setStep('complete')
      onUploadComplete?.(id)
    } catch (error: any) {
      console.error('업로드 실패:', error)
      alert(`업로드 실패: ${error.message}`)
      setStep('upload')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6 border rounded-lg">
      <div>
        <h2 className="text-2xl font-bold mb-2">공공 프로젝트 공고 업로드</h2>
        <p className="text-gray-600">파일(PDF, HWP, HWPX, HWPS) 또는 URL을 업로드하여 AI 분석을 시작하세요.</p>
      </div>

      {/* 업로드 타입 선택 */}
      <div className="flex gap-4">
        <Button
          variant={uploadType === 'file' ? 'default' : 'outline'}
          onClick={() => setUploadType('file')}
        >
          <FileText className="w-4 h-4 mr-2" />
          파일 업로드
        </Button>
        <Button
          variant={uploadType === 'url' ? 'default' : 'outline'}
          onClick={() => setUploadType('url')}
        >
          <LinkIcon className="w-4 h-4 mr-2" />
          URL
        </Button>
      </div>

      {/* 파일 업로드 */}
      {uploadType === 'file' && (
        <div>
          <label className="block text-sm font-medium mb-2">파일 선택 (PDF, HWP, HWPX, HWPS)</label>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".pdf,.hwp,.hwpx,.hwps,.txt,.html,.htm"
              onChange={handleFileChange}
              disabled={loading}
              className="flex-1"
            />
            {file && (
              <span className="text-sm text-gray-600">{file.name}</span>
            )}
          </div>
        </div>
      )}

      {/* URL 입력 */}
      {uploadType === 'url' && (
        <div>
          <label className="block text-sm font-medium mb-2">공고 URL</label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.g2b.go.kr/..."
            disabled={loading}
          />
        </div>
      )}

      {/* 상태 표시 */}
      {step === 'analyzing' && (
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3 text-blue-700 mb-2">
            <Sparkles className="w-6 h-6 animate-pulse" />
            <span className="text-lg font-semibold">AI가 공고를 분석 중입니다...</span>
          </div>
          <p className="text-sm text-blue-600 ml-9">
            공고문을 요약하고 주요 정보를 추출하고 있습니다. 잠시만 기다려주세요.
          </p>
          <div className="mt-4 space-y-2 ml-9">
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>텍스트 추출 중...</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>요약 생성 중...</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>기술 요구사항 추출 중...</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>예산 및 기간 분석 중...</span>
            </div>
          </div>
        </div>
      )}

      {step === 'complete' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-6 h-6" />
            <span className="text-lg font-semibold">분석이 완료되었습니다!</span>
          </div>
          
          {/* 분석 결과 표시 */}
          {analysisResult && (
            <div className="mt-6">
              <div className="mb-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">AI 분석 결과</h3>
                <p className="text-gray-600">
                  LLM이 공고문을 분석하여 주요 정보를 자동으로 추출했습니다.
                </p>
              </div>
              <AnnouncementAnalysisResult analysis={analysisResult} />
            </div>
          )}
        </div>
      )}

      {/* 업로드 버튼 - 분석 중이 아닐 때만 표시 */}
      {step !== 'analyzing' && step !== 'complete' && (
        <Button
          onClick={handleSubmit}
          disabled={loading || (uploadType === 'file' && !file) || (uploadType === 'url' && !url)}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              처리 중...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              업로드 및 AI 분석 시작
            </>
          )}
        </Button>
      )}

      {/* 완료 후 상세 페이지로 이동 버튼 */}
      {step === 'complete' && announcementId && (
        <div className="flex gap-3">
          <Button
            onClick={() => {
              if (onUploadComplete) {
                onUploadComplete(announcementId)
              }
            }}
            className="flex-1"
            size="lg"
          >
            <FileText className="w-4 h-4 mr-2" />
            상세 페이지 보기
          </Button>
          <Button
            onClick={() => {
              setStep('upload')
              setFile(null)
              setUrl('')
              setAnalysisResult(null)
              setAnnouncementId(null)
            }}
            variant="outline"
            size="lg"
          >
            새 공고 업로드
          </Button>
        </div>
      )}

      {announcementId && step !== 'complete' && (
        <div className="text-sm text-gray-500">
          공고 ID: {announcementId}
        </div>
      )}
    </div>
  )
}

