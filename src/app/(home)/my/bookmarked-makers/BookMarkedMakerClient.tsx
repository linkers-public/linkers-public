'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { fetchBookmarkList } from '@/apis/bookmark.service'
import { PostgrestError } from '@supabase/supabase-js'
import MultiSelectButton from '@/components/MultiSelector'
import { Slider } from '@/components/ui/slider'
import { XCircle } from 'lucide-react'

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
}

interface Bookmark {
  id: number
  maker_id: string
  maker: Maker
  created_at: string
  manager_id: string
}

const BookMarkedMakerClient = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<PostgrestError | null>(null)
  const [bookmarkList, setBookmarkList] = useState<Bookmark[]>([])
  const [showSlider, setShowSlider] = useState(false)
  const sliderRef = useRef<HTMLDivElement | null>(null)

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
        const { data, error } = await fetchBookmarkList()
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
  }, [filters])

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

  const handleUnbookmark = async (makerId: string) => {}
  const handlePropose = async (makerId: string) => {}

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">로딩중...</div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        에러가 발생했습니다
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <h3 className="text-h3">관심 메이커</h3>

      <div className="flex flex-col gap-4">
        <div className="flex gap-2 relative">
          <button
            className="flex items-center justify-center px-4 py-2 rounded-[12px] shadow-normal min-w-[120px]"
            onClick={() => setShowSlider((prev) => !prev)}
          >
            <span className="text-p2 text-palette-coolNeutral-40">
              경력 : {filters.experience[0]}년 ~ {filters.experience[1]}년
            </span>
          </button>

          {showSlider && (
            <div
              ref={sliderRef}
              className="flex flex-col gap-6 absolute top-full mt-2 bg-white shadow-emphasize p-4 rounded-[12px] z-50"
            >
              <div className="flex items-center justify-between">
                <div className="text-subtitle2">경력</div>
                <div
                  className="cursor-pointer rounded-full p-1 hover:bg-gray-200"
                  onClick={() => setShowSlider(false)}
                >
                  <XCircle />
                </div>
              </div>
              <Slider
                value={filters.experience}
                onValueChange={(value) =>
                  handleFilterChange('experience', value as [number, number])
                }
                min={1}
                max={20}
                step={1}
                className="w-40"
              />
              <p className="text-md text-gray-600 whitespace-nowrap">
                선택된 경력: {filters.experience[0]}년 ~ {filters.experience[1]}
                년
              </p>
            </div>
          )}

          <MultiSelectButton
            values={filters.job}
            onChange={(values) => handleFilterChange('job', values)}
            placeholder="직무를 선택하세요"
            options={[
              { label: '프론트엔드', value: '프론트엔드' },
              { label: '백엔드', value: '백엔드' },
              { label: '데이터 분석', value: '데이터 분석' },
              { label: '디자인', value: '디자인' },
            ]}
          />

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
        {bookmarkList.map((bookmark) => (
          <div
            key={bookmark.id}
            className="flex shadow-normal justify-between py-4 px-6 rounded-[12px] gap-2"
          >
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-full bg-palette-coolNeutral-90" />
              <div>
                <h3 className="text-subtitle2">{bookmark.maker.username}</h3>
                <div className="flex gap-2 text-p3 text-palette-coolNeutral-60">
                  <span>{bookmark.maker.main_job?.[0]}</span>
                  <span>{bookmark.maker.expertise?.[0]}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center gap-4">
              <Button
                className="bg-palette-primary-normal text-subtitle3 text-white rounded-[12px] w-[240px] h-[48px]"
                onClick={() => handlePropose(bookmark.maker_id)}
              >
                제안하기
              </Button>
              <Button
                className="text-subtitle3 text-white shadow-normal border rounded-[12px] w-[240px] h-[48px]"
                onClick={() => handleUnbookmark(bookmark.maker_id)}
              >
                관심 취소
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BookMarkedMakerClient
