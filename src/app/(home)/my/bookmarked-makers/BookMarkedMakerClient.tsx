'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { fetchBookmarkList, unbookmark } from '@/apis/bookmark.service'
import { PostgrestError } from '@supabase/supabase-js'
import {
  ExperienceFilter,
  JobFilter,
  SpecializationFilter,
} from '@/components/CommonMakerFilter'
import { toast } from '@/hooks/use-toast'
import { useMakerFilter } from '@/hooks/use-maker-filter'
import { ManageableMakerCard } from '@/components/ManageableMakerCard'
import { Button } from '@/components/ui/button'
import { UserSearch } from 'lucide-react'
import Link from 'next/link'

//TODO - ZOD 반영
interface Maker {
  username: string
  main_job: string[] | null
  expertise: string[] | null
  bio: string
  user_id: string
  created_at: string
  updated_at: string
  deleted_at: string | null
  role: 'MAKER' | 'MANAGER' | 'NONE'
  account_work_experiences: any[]
}

//TODO - ZOD 반영
interface Bookmark {
  id: number
  maker_id: string
  maker: Maker
  created_at: string
  manager_id: string
  proposal_status: boolean
}

const BookMarkedMakerClient = () => {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<PostgrestError | null>(null)
  const [bookmarkList, setBookmarkList] = useState<Bookmark[]>([])
  const [isProposed, setIsProposed] = useState<boolean>(false)
  const { filters, handleFilterChange } = useMakerFilter()

  useEffect(() => {
    const getBookmarkList = async () => {
      try {
        setIsLoading(true)
        const { data, error } = await fetchBookmarkList({ 
          isProposed,
          experience: filters.experience,
          job: filters.job,
          specialization: filters.specialization,
        })
        if (error) {
          setError(error)
          return
        }
        if (data) {
          //@ts-ignore
          setBookmarkList(data)
        }
      } catch (err) {
        setError(err as PostgrestError)
      } finally {
        setIsLoading(false)
      }
    }
    getBookmarkList()
  }, [filters.experience, filters.job, filters.specialization, isProposed])

  const handleUnbookmark = useCallback(async (makerId: string) => {
    try {
      await unbookmark(makerId)

      setBookmarkList((prev) =>
        prev.filter((bookmark) => bookmark.maker_id !== makerId),
      )
      toast({
        title: '찜 취소 완료',
        description: '메이커 찜이 취소되었습니다.',
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '에러 발생',
        description: '작업 중 문제가 발생했습니다.',
      })
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">찜한 메이커를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-600 mb-4">에러가 발생했습니다</p>
          <Button onClick={() => window.location.reload()}>다시 시도</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-6 md:py-8">
      {/* 헤더 섹션 */}
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">
          내가 찜한 메이커
        </h1>
        <p className="text-gray-600">
          저장해둔 메이커 리스트를 확인하고 관리하세요
        </p>
      </div>

      {/* 필터 섹션 */}
      <div className="flex flex-col gap-4 mb-6">
        {/* 제안 상태 필터 */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsProposed(true)}
            className={`flex justify-center items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              isProposed
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            제안함
          </button>
          <button
            onClick={() => setIsProposed(false)}
            className={`flex justify-center items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              !isProposed
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            제안하지 않음
          </button>
        </div>

        {/* 상세 필터 */}
        <div className="flex flex-wrap gap-2">
          <ExperienceFilter
            value={filters.experience}
            onChange={(value) => handleFilterChange('experience', value)}
          />
          <JobFilter
            value={filters.job}
            onChange={(value) => handleFilterChange('job', value)}
          />
          <SpecializationFilter
            value={filters.specialization}
            onChange={(value) => handleFilterChange('specialization', value)}
          />
        </div>
      </div>

      {/* 메이커 목록 */}
      <div className="space-y-4">
        {bookmarkList.length > 0 ? (
          bookmarkList.map((bookmark) => (
            <ManageableMakerCard
              key={bookmark.id}
              bookmark={bookmark}
              onUnbookmark={handleUnbookmark}
            />
          ))
        ) : (
          <div className="bg-white rounded-lg shadow-sm border p-6 md:p-12 text-center">
            <UserSearch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">찜한 메이커가 없습니다.</p>
            <p className="text-sm text-gray-500 mb-4">
              관심 있는 메이커를 찾아 찜해보세요.
            </p>
            <Link href="/search-makers">
              <Button className="mt-4">메이커 찾기</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default BookMarkedMakerClient
