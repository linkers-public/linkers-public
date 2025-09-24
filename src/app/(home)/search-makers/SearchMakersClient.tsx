'use client'

import React, { useEffect, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { useMakerFilter } from '@/hooks/use-maker-filter'
import { useRouter } from 'next/navigation'
import {
  ExperienceFilter,
  JobFilter,
  SpecializationFilter,
} from '@/components/CommonMakerFilter'
import { searchMakers } from '@/apis/search-maker.service'
import { PostgrestError } from '@supabase/supabase-js'
import { SearchMakerCard } from '@/components/SearchMakerCard'
import Link from 'next/link'

//TODO - 중북 추출 / ZOD 반영영
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

const SearchMakersClient = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<PostgrestError | null>(null)
  const { filters, handleFilterChange } = useMakerFilter()
  const [makerList, setMakerList] = useState<Maker[]>([])
  const [isMounted, setIsMounted] = useState(true)

  console.log('makerList', makerList)

  useEffect(() => {
    let isCancelled = false

    const getMakers = async () => {
      try {
        const { data, error } = await searchMakers({})
        
        // 컴포넌트가 언마운트되었거나 요청이 취소된 경우 상태 업데이트 중단
        if (isCancelled || !isMounted) return
        
        if (error) {
          setError(error)
          return
        }
        if (data) {
          //@ts-ignore
          setMakerList(data)
        }
      } catch (err) {
        if (!isCancelled && isMounted) {
          setError(err as PostgrestError)
        }
      } finally {
        if (!isCancelled && isMounted) {
          setIsLoading(false)
        }
      }
    }
    
    getMakers()

    // cleanup 함수
    return () => {
      isCancelled = true
    }
  }, [filters, isMounted])

  // 컴포넌트 언마운트 시 상태 업데이트 방지
  useEffect(() => {
    return () => {
      setIsMounted(false)
    }
  }, [])

  // 컴포넌트가 언마운트된 경우 렌더링하지 않음
  if (!isMounted) {
    return null
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-h3">메이커 찾기</h3>
      <section className="flex gap-4">
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
        <div className="flex-1 flex gap-4 shadow-normal py-2 px-4 rounded-[12px] hover:shadow-emphasize">
          <SearchIcon />
          <span className="text-palette-coolNeutral-40">검색</span>
        </div>
      </section>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">메이커를 불러오는 중...</span>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="text-center py-8">
          <div className="text-red-600 mb-2">오류가 발생했습니다</div>
          <div className="text-sm text-gray-600">{error.message}</div>
        </div>
      )}

      {/* 메이커 목록 */}
      {!isLoading && !error && (
        <ul className="flex flex-wrap gap-6 justify-between mt-6">
          {makerList.map((maker) => (
            <Link
              href={`/profile/${maker.username}`}
              key={maker.user_id}
            >
              <SearchMakerCard
                key={maker.user_id}
                maker={maker}
              />
            </Link>
          ))}
        </ul>
      )}

      {/* 메이커가 없는 경우 */}
      {!isLoading && !error && makerList.length === 0 && (
        <div className="text-center py-8">
          <div className="text-gray-600">등록된 메이커가 없습니다</div>
        </div>
      )}
    </div>
  )
}

export default SearchMakersClient
