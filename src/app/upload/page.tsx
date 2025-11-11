'use client'

import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import SubHeader from '@/components/layout/SubHeader'
import { UploadCard } from '@/components/rag/UploadCard'

export default function UploadPage() {
  const router = useRouter()

  const handleUploadComplete = (docId: number, chunks: number) => {
    // AI 분석 페이지로 이동
    setTimeout(() => {
      router.push(`/analysis/${docId}`)
    }, 1500)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <SubHeader currentStep={1} totalSteps={5} />
      <main className="flex-1 container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold mb-2">공고 문서 업로드</h1>
          <p className="text-slate-600">
            PDF 파일을 업로드하면 AI가 자동으로 분석하고 인덱싱합니다.
          </p>
        </div>
        <UploadCard onUploadComplete={handleUploadComplete} />
      </main>
      <Footer />
    </div>
  )
}
