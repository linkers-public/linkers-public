'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { searchTeams } from '@/apis/team.service'
import { Search, Users, Building2, Filter, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const TEAM_SPECIALTY_OPTIONS = [
  '웹 및 모바일 개발',
  '데이터 및 인공지능',
  '클라우드 및 인프라',
  '보안 및 테스트',
  '비즈니스 프로세스 관리',
  '기타',
] as const

interface Team {
  id: number
  name: string
  bio: string | null
  specialty: string[] | null
  sub_specialty: string[] | null
  prefered: string[] | null
  manager: {
    username: string
    profile_image_url: string | null
  } | null
  team_members: Array<{
    account: {
      username: string
      profile_image_url: string | null
    } | null
  }>
  created_at: string
}

const SearchTeamsClient = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teamList, setTeamList] = useState<Team[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState<string[]>([])
  const [filteredTeamList, setFilteredTeamList] = useState<Team[]>([])

  // 검색 및 필터링
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const { data, error } = await searchTeams({
          searchTerm: searchTerm.trim() || undefined,
          specialty: selectedSpecialty.length > 0 ? selectedSpecialty : undefined,
        })
        
        if (error) {
          console.error('팀 조회 에러:', error)
          setError(error.message || '팀을 불러오는데 실패했습니다.')
          setTeamList([])
          return
        }
        
        if (data && Array.isArray(data)) {
          setTeamList(data)
          setFilteredTeamList(data)
        } else {
          setTeamList([])
          setFilteredTeamList([])
        }
      } catch (err: any) {
        console.error('팀 조회 예외:', err)
        setError(err.message || '팀을 불러오는데 실패했습니다.')
        setTeamList([])
        setFilteredTeamList([])
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
  }, [searchTerm, selectedSpecialty])

  const handleSpecialtyToggle = (specialty: string) => {
    setSelectedSpecialty(prev =>
      prev.includes(specialty)
        ? prev.filter(s => s !== specialty)
        : [...prev, specialty]
    )
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedSpecialty([])
  }

  return (
    <div className="w-full min-h-screen bg-white">
      <div className="py-8">
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6">
          {/* 헤더 */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">팀 검색</h1>
            <p className="text-gray-600 text-lg">함께 일할 팀을 찾아보세요</p>
          </div>

          {/* 검색 및 필터 섹션 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            {/* 검색창 */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="팀 이름, 소개로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            {/* 필터 섹션 */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">전문분야</h3>
                </div>
                {(searchTerm || selectedSpecialty.length > 0) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    필터 초기화
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {TEAM_SPECIALTY_OPTIONS.map((specialty) => (
                  <button
                    key={specialty}
                    onClick={() => handleSpecialtyToggle(specialty)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedSpecialty.includes(specialty)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {specialty}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 결과 통계 */}
          {!isLoading && !error && (
            <div className="mb-6 flex items-center gap-2 text-gray-600">
              <Building2 className="w-5 h-5" />
              <span className="font-medium">
                총 <strong className="text-gray-900">{filteredTeamList.length}</strong>개의 팀을 찾았습니다
              </span>
            </div>
          )}

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600 font-medium">팀을 불러오는 중...</p>
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
              <p className="text-sm text-gray-600">{error}</p>
            </div>
          )}

          {/* 팀 목록 */}
          {!isLoading && !error && (
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTeamList.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Building2 className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">검색 결과가 없습니다</h3>
                  <p className="text-gray-600 mb-6 text-lg">
                    {searchTerm || selectedSpecialty.length > 0
                      ? '다른 검색어나 필터로 시도해보세요'
                      : '조건을 변경해보세요'}
                  </p>
                  {(searchTerm || selectedSpecialty.length > 0) && (
                    <button
                      onClick={clearFilters}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-md hover:shadow-lg"
                    >
                      필터 초기화
                    </button>
                  )}
                </div>
              ) : (
                filteredTeamList.map((team) => (
                  <Link
                    key={team.id}
                    href={`/team/${team.id}`}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all p-6"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                        {team.name?.[0] || '팀'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 truncate">
                          {team.name}
                        </h3>
                        {team.manager && (
                          <p className="text-sm text-gray-600 truncate">
                            매니저: {team.manager.username}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {team.bio && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {team.bio}
                      </p>
                    )}

                    {team.specialty && team.specialty.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {team.specialty.slice(0, 3).map((spec, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                          >
                            {spec}
                          </span>
                        ))}
                        {team.specialty.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                            +{team.specialty.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{team.team_members?.length || 0}명</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(team.created_at).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
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

export default SearchTeamsClient

