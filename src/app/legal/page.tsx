'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Upload, MessageSquare, AlertTriangle, Info } from 'lucide-react'

export default function LegalLandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-20 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 text-slate-900 leading-tight">
            첫 계약, AI와 함께 점검해보세요.
          </h1>
        </div>

        {/* Main CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button
            onClick={() => router.push('/legal/contract')}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            <Upload className="w-5 h-5 mr-2" />
            계약서 업로드해서 분석 받기
          </Button>
          <Button
            onClick={() => router.push('/legal/situation')}
            className="w-full sm:w-auto bg-blue-700 hover:bg-blue-800 text-white rounded-xl px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            size="lg"
          >
            <MessageSquare className="w-5 h-5 mr-2" />
            지금 겪는 상황부터 상담 받기
          </Button>
        </div>

        {/* Legal Disclaimer Card */}
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900 leading-relaxed">
                이 서비스는 법률 자문이 아닌 정보 안내 서비스입니다.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

