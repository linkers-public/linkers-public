'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { fetchBookmarkList, unbookmark } from '@/apis/bookmark.service'
import { PostgrestError } from '@supabase/supabase-js'
import {
  ExperienceFilter,
  JobFilter,
  SpecializationFilter,
} from '@/components/CommonMakerFilter'
import { toast } from '@/hooks/use-toast'
import { useMakerFilter } from '@/hooks/use-maker-filter'
import { MakerCard } from '@/components/MakerMeta'

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
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<PostgrestError | null>(null)
  const [bookmarkList, setBookmarkList] = useState<Bookmark[]>([])
  const [isProposed, setIsProposed] = useState<boolean>(false)
  const { filters, handleFilterChange } = useMakerFilter()

  useEffect(() => {
    const getBookmarkList = async () => {
      try {
        const { data, error } = await fetchBookmarkList({ isProposed })
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
  }, [filters, isProposed])

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

  const handlePropose = async (makerId: string) => {}

  //TODO - 유틸 추출
  const calculateTotalExperience = (experiences: any[]) => {
    const today = new Date()

    const totalMonths = experiences.reduce((acc, exp) => {
      const startDate = new Date(exp.start_date)
      const endDate = exp.end_date ? new Date(exp.end_date) : today

      const months =
        (endDate.getFullYear() - startDate.getFullYear()) * 12 +
        (endDate.getMonth() - startDate.getMonth())

      return acc + months
    }, 0)

    const years = Math.floor(totalMonths / 12)
    const months = totalMonths % 12

    return { years, months }
  }

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">로딩중...</div>
    )
  if (error)
    return (
      <div className="flex justify-center items-center h-64">
        에러가 발생했습니다
      </div>
    )

  return (
    <div className="flex flex-col gap-4 w-full">
      <h3 className="text-h3">내가 찜한 메이커</h3>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2">
          <div
            onClick={() => setIsProposed(true)}
            className={`flex justify-center items-center px-3 py-1 rounded-[12px] text-p3 ${
              isProposed ? 'shadow-emphasize' : 'shadow-normal'
            }`}
          >
            제안함
          </div>
          <div
            onClick={() => setIsProposed(false)}
            className={`flex justify-center items-center px-3 py-1 rounded-[12px] text-p3 ${
              !isProposed ? 'shadow-emphasize' : 'shadow-normal'
            }`}
          >
            제안하지 않음
          </div>
        </div>

        <div className="flex gap-2 relative">
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

      <div className="flex flex-col gap-4">
        {bookmarkList.length > 0 ? (
          bookmarkList.map((bookmark) => {
            return (
              <MakerCard
                key={bookmark.id}
                bookmark={bookmark}
                onUnbookmark={handleUnbookmark}
                onPropose={handlePropose}
              />
            )
          })
        ) : (
          <div className="flex justify-center items-center h-64">
            찜한 메이커가 없습니다.
          </div>
        )}
      </div>
    </div>
  )
}

export default BookMarkedMakerClient
