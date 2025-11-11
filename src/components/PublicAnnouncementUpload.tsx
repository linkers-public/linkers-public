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
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'upload' | 'analyzing' | 'complete'>('upload')
  const [announcementId, setAnnouncementId] = useState<number | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      if (!title && e.target.files[0].name) {
        setTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''))
      }
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      alert('공고 제목을 입력해주세요.')
      return
    }

    if (uploadType === 'file' && !file) {
      alert('파일을 선택해주세요.')
      return
    }

    if (uploadType === 'url' && !url.trim()) {
      alert('URL을 입력해주세요.')
      return
    }

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

      // 2. PDF 텍스트 추출 (파일인 경우)
      let rawText = ''
      if (pdfUrl) {
        rawText = await extractPdfText(pdfUrl)
      } else if (url) {
        // URL인 경우 페이지 텍스트 추출 (실제로는 서버에서 처리)
        rawText = `URL: ${url}\n공고 내용을 분석 중입니다...`
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
        <p className="text-gray-600">PDF 파일 또는 URL을 업로드하여 AI 분석을 시작하세요.</p>
      </div>

      {/* 업로드 타입 선택 */}
      <div className="flex gap-4">
        <Button
          variant={uploadType === 'file' ? 'default' : 'outline'}
          onClick={() => setUploadType('file')}
        >
          <FileText className="w-4 h-4 mr-2" />
          PDF 파일
        </Button>
        <Button
          variant={uploadType === 'url' ? 'default' : 'outline'}
          onClick={() => setUploadType('url')}
        >
          <LinkIcon className="w-4 h-4 mr-2" />
          URL
        </Button>
      </div>

      {/* 제목 입력 */}
      <div>
        <label className="block text-sm font-medium mb-2">공고 제목</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="예: 전자정부 플랫폼 구축 사업"
          disabled={loading}
        />
      </div>

      {/* 파일 업로드 */}
      {uploadType === 'file' && (
        <div>
          <label className="block text-sm font-medium mb-2">PDF 파일 선택</label>
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept=".pdf"
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
        disabled={loading || !title.trim() || (uploadType === 'file' && !file) || (uploadType === 'url' && !url)}
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

