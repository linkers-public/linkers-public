'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { fetchBookmarkList, unbookmark } from '@/apis/bookmark.service'
import { PostgrestError } from '@supabase/supabase-js'
import {
  ExperienceFilter,
  JobFilter,
  SpecializationFilter,
} from '@/components/CommonMakerFilter'
import { toast } from '@/hooks/use-toast'
import { CommonModal } from '@/components/CommonModal'

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

  const [filters, setFilters] = useState<{
    specialization: string[]
    experience: [number, number]
    job: string[]
  }>({
    specialization: [],
    experience: [0, 20],
    job: [],
  })

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

  //TODO - 유틸 추출출
  const handleFilterChange = (
    key: 'specialization' | 'experience' | 'job',
    value: string | string[] | number[],
  ) => {
    setFilters((prev) => {
      if (key === 'experience' && Array.isArray(value)) {
        return { ...prev, [key]: value as [number, number] }
      }
      return { ...prev, [key]: value }
    })
  }

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
              <div
                key={bookmark.id}
                className="flex shadow-normal justify-between py-4 px-6 rounded-[12px] gap-2"
              >
                <div className="flex gap-4 items-center">
                  <div className="w-12 h-12 rounded-full bg-palette-coolNeutral-90" />
                  <div>
                    <h3 className="text-subtitle2">
                      {bookmark.maker.username}
                    </h3>
                    <div className="flex flex-col gap-2 text-p3 text-palette-coolNeutral-60">
                      <span>
                        총 경력 :
                        {bookmark.maker.account_work_experiences.length > 0 ? (
                          <span>
                            {
                              calculateTotalExperience(
                                bookmark.maker.account_work_experiences,
                              ).years
                            }
                            년 {''}
                            {
                              calculateTotalExperience(
                                bookmark.maker.account_work_experiences,
                              ).months
                            }
                            개월
                          </span>
                        ) : (
                          <span>신입</span>
                        )}
                        <span className="text-palette-coolNeutral-40 ml">
                          {'  '}(
                          {bookmark.maker.account_work_experiences.length > 0 &&
                            bookmark.maker.account_work_experiences.map(
                              (exp) => exp.company_name,
                            )}
                          )
                        </span>
                      </span>
                      <span>
                        주직무 : {bookmark.maker.main_job?.join(', ')}
                      </span>
                      <span>
                        전문분야 : {bookmark.maker.expertise?.join(', ')}
                      </span>
                      <div className="flex gap-2">
                        <span className="rounded-full px-2 py-1 border-solid border border-palette-coolNeutral-90 text-palette-coolNeutral-40 text-xs">
                          주요 스킬1
                        </span>
                        <span className="rounded-full px-2 py-1 border-solid border border-palette-coolNeutral-90 text-palette-coolNeutral-40 text-xs">
                          주요 스킬2
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col justify-center gap-4">
                  <CommonModal
                    trigger={
                      <Button className="bg-palette-primary-normal text-subtitle3 text-white rounded-[12px] w-[240px] h-[48px]">
                        찜 취소하기
                      </Button>
                    }
                    title="찜 취소"
                    description="해당 메이커를 찜 목록에서 삭제하시겠습니까?"
                    onConfirm={() => handleUnbookmark(bookmark.maker_id)}
                    confirmText="삭제"
                  />
                  {!bookmark.proposal_status && (
                    <Button
                      className="bg-palette-primary-normal text-subtitle3 text-white rounded-[12px] w-[240px] h-[48px]"
                      onClick={() => handlePropose(bookmark.maker_id)}
                    >
                      제안하기
                    </Button>
                  )}
                </div>
              </div>
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
