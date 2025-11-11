'use client'

import { useRouter } from 'next/navigation'
import PublicAnnouncementUpload from '@/components/PublicAnnouncementUpload'

export default function PublicAnnouncementUploadPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">공공 프로젝트 공고 업로드</h1>
        <p className="text-gray-600">
          나라장터 또는 NTIS 공고를 업로드하면 AI가 자동으로 분석하고 적합한 팀을 매칭해드립니다.
        </p>
      </div>

      <PublicAnnouncementUpload
        onUploadComplete={(announcementId) => {
          router.push(`/public-announcements/${announcementId}`)
        }}
      />
    </div>
  )
}

