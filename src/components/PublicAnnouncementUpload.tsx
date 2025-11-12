'use client'

import { useState } from 'react'
import { Upload, FileText, Link as LinkIcon, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadAnnouncement, extractPdfText, analyzeAnnouncement } from '@/apis/public-announcement.service'

interface PublicAnnouncementUploadProps {
  onUploadComplete?: (announcementId: number) => void
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
      await analyzeAnnouncement(id, rawText)

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
        <div className="flex items-center gap-2 text-blue-600">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>AI가 공고를 분석 중입니다...</span>
        </div>
      )}

      {step === 'complete' && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-5 h-5" />
          <span>분석이 완료되었습니다!</span>
        </div>
      )}

      {/* 업로드 버튼 */}
      <Button
        onClick={handleSubmit}
        disabled={loading || (uploadType === 'file' && !file) || (uploadType === 'url' && !url)}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            처리 중...
          </>
        ) : (
          <>
            <Upload className="w-4 h-4 mr-2" />
            업로드 및 분석 시작
          </>
        )}
      </Button>

      {announcementId && (
        <div className="text-sm text-gray-500">
          공고 ID: {announcementId}
        </div>
      )}
    </div>
  )
}

