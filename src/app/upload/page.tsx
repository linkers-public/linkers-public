'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import { UploadCard } from '@/components/rag/UploadCard'
import { Button } from '@/components/ui/button'
import { Download, FileText, Loader2 } from 'lucide-react'

export default function UploadPage() {
  const router = useRouter()

  const handleUploadComplete = (docId: number, chunks: number) => {
    // AI 분석 페이지로 이동
    setTimeout(() => {
      router.push(`/analysis/${docId}`)
    }, 1500)
  }

  const handleSampleDownload = () => {
    // 샘플 계약서 다운로드 (실제로는 샘플 파일 URL로 변경 필요)
    const link = document.createElement('a')
    link.href = '/samples/sample-contract.pdf' // 샘플 파일 경로
    link.download = '샘플_근로계약서.pdf'
    link.click()
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 text-slate-900">
            계약서 업로드
          </h1>
          <p className="text-lg text-slate-600">
            PDF 파일을 업로드하면 AI가 자동으로 계약 조항을 분석합니다
          </p>
        </div>

        {/* 샘플 다운로드 섹션 */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-slate-900">샘플 계약서가 필요하신가요?</p>
                <p className="text-sm text-slate-600">예시 파일을 다운로드하여 참고하세요</p>
              </div>
            </div>
            <Button
              onClick={handleSampleDownload}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              <Download className="w-4 h-4 mr-2" />
              샘플 다운로드
            </Button>
          </div>
        </div>

        <UploadCard onUploadComplete={handleUploadComplete} />
      </main>
      <Footer />
    </div>
  )
}
