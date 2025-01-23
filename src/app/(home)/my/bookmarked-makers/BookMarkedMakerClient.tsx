'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { fetchBookmarkList, unbookmark } from '@/apis/bookmark.service'
import { PostgrestError } from '@supabase/supabase-js'
import MultiSelectButton from '@/components/MultiSelector'
import { Slider } from '@/components/ui/slider'
import { XCircle } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'

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

interface Bookmark {
  id: number
  maker_id: string
  maker: Maker
  created_at: string
  manager_id: string
  proposal_status: boolean
}

const jobCategories = [
  {
    category: '개발',
    jobs: ['프론트엔드', '백엔드', '풀스택', '모바일', '데브옵스'],
  },
  {
    category: '디자인',
    jobs: ['UX/UI', '그래픽', '브랜드', '3D'],
  },
  {
    category: '기획',
    jobs: ['서비스 기획', '전략 기획', '프로덕트 매니저', '프로젝트 매니저'],
  },
]

const BookMarkedMakerClient = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<PostgrestError | null>(null)
  const [bookmarkList, setBookmarkList] = useState<Bookmark[]>([])
  const [isProposed, setIsProposed] = useState<boolean>(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

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
  }, [filters, isProposed])

  console.log(filters)
  console.log(bookmarkList)

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
          <Dialog>
            <DialogTrigger asChild>
              <Button className="flex items-center justify-center px-4 py-2 rounded-[12px] shadow-normal min-w-[120px]">
                경력 : {filters.experience[0]}년 ~ {filters.experience[1]}년
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[400px]">
              <DialogHeader>
                <DialogTitle>경력 선택</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-6 p-4">
                <Slider
                  value={filters.experience}
                  onValueChange={(value) =>
                    handleFilterChange('experience', value as [number, number])
                  }
                  min={1}
                  max={20}
                  step={1}
                  className="w-full"
                />
                <p className="text-md text-gray-600">
                  선택된 경력: {filters.experience[0]}년 ~{' '}
                  {filters.experience[1]}년
                </p>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button>선택</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button>
                {selectedCategory ? (
                  <>
                    {selectedCategory} · {filters.job[0]}
                    {filters.job.length > 1 &&
                      ` 외 ${filters.job.length - 1}개`}
                  </>
                ) : (
                  `직무를 선택하세요 (${filters.job.length})`
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="min-w-[500px]">
              <DialogHeader>
                <DialogTitle>직무 선택</DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-[1fr_1fr] gap-4">
                {/* 대분류 */}
                <div className="border-r pr-4">
                  <h4 className="font-medium mb-2">대분류</h4>
                  {jobCategories.map((category) => (
                    <div
                      key={category.category}
                      onClick={() => setSelectedCategory(category.category)}
                      className={`cursor-pointer p-2 hover:bg-gray-50 ${
                        selectedCategory === category.category
                          ? 'bg-gray-100'
                          : ''
                      }`}
                    >
                      {category.category}
                    </div>
                  ))}
                </div>

                {/* 소분류 */}
                <div>
                  <h4 className="font-medium mb-2">소분류</h4>
                  {selectedCategory &&
                    jobCategories
                      .find((c) => c.category === selectedCategory)
                      ?.jobs.map((job) => (
                        <div
                          key={job}
                          className="flex justify-between p-2 hover:bg-gray-50"
                        >
                          <span>{job}</span>
                          <input
                            type="checkbox"
                            disabled={!selectedCategory}
                            checked={filters.job.includes(job)}
                            onChange={() => {
                              if (
                                filters.job.length >= 3 &&
                                !filters.job.includes(job)
                              )
                                return
                              const newJobs = filters.job.includes(job)
                                ? filters.job.filter((j) => j !== job)
                                : [...filters.job, job]
                              handleFilterChange('job', newJobs)
                            }}
                          />
                        </div>
                      ))}
                </div>
              </div>

              <div className="mt-4 text-sm text-gray-500">
                {filters.job.length}/2개 직무가 선택되었습니다
              </div>

              <div className="flex gap-2 mt-2">
                {filters.job.map((job) => (
                  <div
                    key={job}
                    className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded"
                  >
                    {job}{' '}
                    <XCircle
                      className="h-4 w-4 cursor-pointer"
                      onClick={() =>
                        handleFilterChange(
                          'job',
                          filters.job.filter((j) => j !== job),
                        )
                      }
                    />
                  </div>
                ))}
              </div>

              <DialogFooter className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setFilters((prev) => ({ ...prev, job: [] }))}
                >
                  초기화
                </Button>
                <DialogClose asChild>
                  <Button>선택</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <MultiSelectButton
            values={filters.specialization}
            onChange={(values) => handleFilterChange('specialization', values)}
            placeholder="분야를 선택하세요"
            options={[
              { label: '웹 개발', value: '웹 개발' },
              { label: '모바일 개발', value: '모바일 개발' },
              { label: 'AI', value: 'AI' },
              { label: 'UI/UX', value: 'UI/UX' },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {bookmarkList.length > 0 ? (
          bookmarkList.map((bookmark) => (
            <div
              key={bookmark.id}
              className="flex shadow-normal justify-between py-4 px-6 rounded-[12px] gap-2"
            >
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-full bg-palette-coolNeutral-90" />
                <div>
                  <h3 className="text-subtitle2">{bookmark.maker.username}</h3>
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
                    <span>주직무 : {bookmark.maker.main_job?.join(', ')}</span>
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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-palette-primary-normal text-subtitle3 text-white rounded-[12px] w-[240px] h-[48px]">
                      찜 취소하기
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>찜 취소</DialogTitle>
                      <DialogDescription>
                        해당 메이커를 찜 목록에서 삭제하시겠습니까?
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">취소</Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button
                          onClick={() => handleUnbookmark(bookmark.maker_id)}
                        >
                          삭제
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

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
          ))
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
