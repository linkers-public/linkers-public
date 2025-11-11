'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, FileText, Calendar, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAnnouncements } from '@/apis/public-announcement.service'

export default function PublicAnnouncementsPage() {
  const router = useRouter()
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const loadAnnouncements = async () => {
    try {
      setLoading(true)
      const data = await getAnnouncements()
      setAnnouncements(data || [])
    } catch (error) {
      console.error('공고 목록 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">공공 프로젝트 공고</h1>
          <p className="text-gray-600">AI가 분석한 공공 프로젝트 공고 목록입니다.</p>
        </div>
        <Button onClick={() => router.push('/public-announcements/upload')}>
          <Plus className="w-4 h-4 mr-2" />
          공고 업로드
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">로딩 중...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">등록된 공고가 없습니다.</p>
          <Button onClick={() => router.push('/public-announcements/upload')}>
            첫 공고 업로드하기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              onClick={() => router.push(`/public-announcements/${announcement.id}`)}
              className="p-6 border rounded-lg hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-bold line-clamp-2">{announcement.title}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    announcement.status === 'analyzed'
                      ? 'bg-green-100 text-green-700'
                      : announcement.status === 'matched'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {announcement.status === 'analyzed'
                    ? '분석 완료'
                    : announcement.status === 'matched'
                    ? '매칭 완료'
                    : '대기 중'}
                </span>
              </div>

              {announcement.organization_name && (
                <p className="text-sm text-gray-600 mb-3">{announcement.organization_name}</p>
              )}

              <div className="space-y-2">
                {announcement.budget_min && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span>
                      {announcement.budget_min.toLocaleString()}원
                      {announcement.budget_max && ` ~ ${announcement.budget_max.toLocaleString()}원`}
                    </span>
                  </div>
                )}
                {announcement.duration_months && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    <span>{announcement.duration_months}개월</span>
                  </div>
                )}
                {announcement.required_skills && announcement.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {announcement.required_skills.slice(0, 3).map((skill: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                    {announcement.required_skills.length > 3 && (
                      <span className="px-2 py-1 text-xs text-gray-500">
                        +{announcement.required_skills.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 text-xs text-gray-500">
                {new Date(announcement.created_at).toLocaleDateString('ko-KR')}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

