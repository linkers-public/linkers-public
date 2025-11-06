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
import { Search, Users, Filter } from 'lucide-react'

//TODO - 중북 추출 / ZOD 반영영
interface Maker {
  username: string
  main_job: string[] | null
  expertise: string[] | null
  bio: string
  user_id: string
  profile_id: string // 새로운 프로필 시스템
  profile_type: 'FREELANCER' | 'COMPANY' | null
  is_active: boolean | null
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
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredMakerList, setFilteredMakerList] = useState<Maker[]>([])

  // 검색어로 필터링
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredMakerList(makerList)
    } else {
      const filtered = makerList.filter((maker) => {
        const searchLower = searchTerm.toLowerCase()
        return (
          maker.username?.toLowerCase().includes(searchLower) ||
          maker.bio?.toLowerCase().includes(searchLower) ||
          maker.main_job?.some((job) => job.toLowerCase().includes(searchLower)) ||
          maker.expertise?.some((exp) => exp.toLowerCase().includes(searchLower))
        )
      })
      setFilteredMakerList(filtered)
    }
  }, [searchTerm, makerList])

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
    <div className="w-full min-h-screen bg-white">
      <div className="py-8">
        <div className="w-full px-4 md:px-6">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">메이커 검색</h1>
            <p className="text-gray-600 text-lg">프로젝트에 적합한 메이커를 찾아보세요</p>
          </div>

          {/* 검색 및 필터 섹션 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            {/* 검색창 */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="메이커 이름, 소개, 직무, 전문분야로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            {/* 필터 섹션 */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">필터</h3>
              </div>
              <div className="flex flex-wrap gap-3">
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
          </div>

          {/* 결과 통계 */}
          {!isLoading && !error && (
            <div className="mb-6 flex items-center gap-2 text-gray-600">
              <Users className="w-5 h-5" />
              <span className="font-medium">
                총 <strong className="text-gray-900">{filteredMakerList.length}</strong>명의 메이커를 찾았습니다
              </span>
            </div>
          )}

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 font-medium">메이커를 불러오는 중...</p>
              </div>
            </div>
          )}

          {/* 에러 상태 */}
          {error && (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-red-200">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">오류가 발생했습니다</h3>
              <p className="text-sm text-gray-600">{error.message}</p>
            </div>
          )}

          {/* 메이커 목록 */}
          {!isLoading && !error && (
            <section className="grid grid-cols-1 gap-4">
              {filteredMakerList.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">검색 결과가 없습니다</h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    {searchTerm ? '다른 검색어로 시도해보세요' : '필터 조건을 변경해보세요'}
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                    >
                      검색어 초기화
                    </button>
                  )}
                </div>
              ) : (
                filteredMakerList.map((maker) => (
                  <Link
                    href={`/profile/${maker.username}`}
                    key={maker.profile_id || maker.user_id}
                    className="block"
                  >
                    <SearchMakerCard maker={maker} />
                  </Link>
                ))
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchMakersClient
