'use client'

import React, { useEffect, useState } from 'react'
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


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const { data, error } = await searchMakers({
          job: filters.job.length > 0 ? filters.job : undefined,
          specialization: filters.specialization.length > 0 ? filters.specialization : undefined,
          experience: filters.experience,
        })
        
        if (error) {
          console.error('메이커 조회 에러:', error)
          setError(error)
          setMakerList([])
          return
        }
        
        if (data && Array.isArray(data)) {
          console.log('✅ 메이커 리스트 설정:', data.length, '개')
          setMakerList(data)
        } else {
          setMakerList([])
        }
      } catch (err) {
        console.error('메이커 조회 예외:', err)
        setError(err as PostgrestError)
        setMakerList([])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [filters])

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-6">메이커 찾기</h2>
      
      {/* 필터 섹션 */}
      <section className="flex gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
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
      </section>

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
          <span className="ml-2 text-gray-600">메이커를 불러오는 중...</span>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="text-center py-12">
          <div className="text-red-600 mb-2">오류가 발생했습니다</div>
          <div className="text-sm text-gray-600">{error.message}</div>
        </div>
      )}

      {/* 메이커 목록 */}
      {!isLoading && !error && (
        <section className="flex flex-col gap-3 w-full">
          {makerList.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              검색 조건에 맞는 메이커가 없습니다.
            </div>
          ) : (
            makerList.map((maker) => (
              <Link
                href={`/profile/${maker.username}`}
                key={maker.user_id}
                className="block"
              >
                <SearchMakerCard maker={maker} />
              </Link>
            ))
          )}
        </section>
      )}
    </div>
  )
}

export default SearchMakersClient
