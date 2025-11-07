'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { selectAccount, useAccountStore } from '@/stores/useAccoutStore'
import { useTeamProfileStore } from '@/stores/useTeamProfileStore'
import { addTeamMember, removeTeamMember } from '@/apis/team.service'
import { searchMakers } from '@/apis/search-maker.service'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SearchMakerCard } from '@/components/SearchMakerCard'
import { Plus, Trash2, Users, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

const TeamProfileClient = () => {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const { teamProfile, teams, selectedTeamId, fetchMyTeams, selectTeam, refreshTeam } = useTeamProfileStore()
  const account = useAccountStore(selectAccount)

  useEffect(() => {
    const getTeams = async () => {
      setIsLoading(true)
      try {
        await fetchMyTeams()
      } catch (err) {
        setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.')
      } finally {
        setIsLoading(false)
      }
    }

    getTeams()
  }, [])

  const {
    id,
    name,
    bio,
    specialty,
    sub_specialty,
    prefered,
    manager_id,
    manager_profile_id,
    created_at,
    updated_at,
    team_members,
    manager,
    isManager: isTeamManager,
  } = teamProfile || {}

  const editIntroduction = () => {}
  const editProfile = () => {}
  const editProject = () => {}
  const editCareer = () => {}

  // 현재 사용자가 이 팀의 매니저인지 확인
  const isManager = isTeamManager === true

  // 팀원 추가 모달 열기 (매니저만 가능)
  const editTeam = () => {
    if (!isManager) {
      toast({
        variant: 'destructive',
        title: '권한 없음',
        description: '팀 매니저만 팀원을 추가할 수 있습니다.',
      })
      return
    }
    setShowAddMemberDialog(true)
    setSearchTerm('')
    setSearchResults([])
  }

  // 메이커 검색
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const { data } = await searchMakers({})
      // 검색어로 필터링 (username, bio 등)
      const filtered = (data || []).filter((maker: any) => {
        const searchLower = searchTerm.toLowerCase()
        return (
          maker.username?.toLowerCase().includes(searchLower) ||
          maker.bio?.toLowerCase().includes(searchLower)
        )
      })
      // 이미 팀원인 사람 제외
      const existingMemberIds = (team_members || []).map((m: any) => m.account?.profile_id).filter(Boolean)
      const available = filtered.filter((maker: any) => !existingMemberIds.includes(maker.profile_id))
      setSearchResults(available)
    } catch (err) {
      console.error('메이커 검색 실패:', err)
      toast({
        variant: 'destructive',
        title: '검색 실패',
        description: '메이커를 검색하는 중 오류가 발생했습니다.',
      })
    } finally {
      setSearching(false)
    }
  }

  // 팀원 추가 (매니저만 가능)
  const handleAddMember = async (profileId: string) => {
    if (!id) return
    
    if (!isManager) {
      toast({
        variant: 'destructive',
        title: '권한 없음',
        description: '팀 매니저만 팀원을 추가할 수 있습니다.',
      })
      return
    }

    try {
      await addTeamMember(id, profileId)
      toast({
        title: '팀원 추가 완료',
        description: '팀원이 성공적으로 추가되었습니다.',
      })
      await refreshTeam(id)
      setShowAddMemberDialog(false)
      setSearchTerm('')
      setSearchResults([])
    } catch (err: any) {
      console.error('팀원 추가 실패:', err)
      toast({
        variant: 'destructive',
        title: '팀원 추가 실패',
        description: err.message || '팀원을 추가하는 중 오류가 발생했습니다.',
      })
    }
  }

  // 팀원 제거 (매니저만 가능)
  const handleRemoveMember = async (memberId: number) => {
    if (!id) return

    if (!isManager) {
      toast({
        variant: 'destructive',
        title: '권한 없음',
        description: '팀 매니저만 팀원을 제거할 수 있습니다.',
      })
      return
    }

    if (!confirm('정말 이 팀원을 제거하시겠습니까?')) {
      return
    }

    try {
      await removeTeamMember(id, memberId)
      toast({
        title: '팀원 제거 완료',
        description: '팀원이 성공적으로 제거되었습니다.',
      })
      await refreshTeam(id)
    } catch (err: any) {
      console.error('팀원 제거 실패:', err)
      toast({
        variant: 'destructive',
        title: '팀원 제거 실패',
        description: err.message || '팀원을 제거하는 중 오류가 발생했습니다.',
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">팀 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-red-900 mb-2">에러가 발생했습니다</p>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    )
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-lg text-gray-600 mb-2">속한 팀이 없습니다.</p>
          <p className="text-sm text-gray-500">팀에 가입하거나 팀을 생성해보세요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 w-full pb-8">
      {/* 팀 목록 */}
      <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">내가 속한 팀</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => selectTeam(team.id)}
              className={`text-left border-2 rounded-lg p-4 transition-all hover:shadow-md ${
                selectedTeamId === team.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                  {team.name?.[0] || '팀'}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{team.name || '팀 이름 없음'}</h3>
                  {team.isManager && (
                    <span className="inline-block mt-1 text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                      매니저
                    </span>
                  )}
                </div>
              </div>
              {team.bio && (
                <p className="text-sm text-gray-600 line-clamp-2 mt-2">{team.bio}</p>
              )}
              <div className="mt-2 text-xs text-gray-500">
                팀원 {team.team_members?.length || 0}명
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 선택된 팀 상세 정보 */}
      {!teamProfile ? (
        <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="text-center">
            <p className="text-lg text-gray-600">팀을 선택해주세요.</p>
          </div>
        </div>
      ) : (
        <>
      {/* 팀 기본 정보 */}
      <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
              {name?.[0] || '팀'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{name || '팀 이름 없음'}</h1>
              <p className="text-gray-600 text-lg">{bio || '소개가 없습니다.'}</p>
            </div>
          </div>
          {isManager && (
            <button
              onClick={editProfile}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              프로필 수정
            </button>
          )}
        </div>

        {/* 전문분야 */}
        {specialty && specialty.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">전문분야</h3>
            <div className="flex flex-wrap gap-2">
              {specialty.map((sep, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-sm rounded-full bg-blue-100 text-blue-700 font-medium"
                >
                  {sep}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 세부 전문분야 */}
        {sub_specialty && sub_specialty.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">세부 전문분야</h3>
            <div className="flex flex-wrap gap-2">
              {sub_specialty.map((ssep, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-sm rounded-full bg-purple-100 text-purple-700 font-medium"
                >
                  {ssep}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 선호 유형 */}
        {prefered && prefered.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">선호 프로젝트 유형</h3>
            <div className="flex flex-wrap gap-2">
              {prefered.map((pref, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 text-sm rounded-full bg-green-100 text-green-700 font-medium"
                >
                  {pref}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* 팀 매니저 */}
      {manager && (
        <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">팀 매니저</h2>
          </div>
          <Link
            href={`/profile/${encodeURIComponent(manager.username)}`}
            className="block border border-blue-200 rounded-lg p-4 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold">
                {manager.username?.[0] || '?'}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900 text-lg">{manager.username}</h3>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-200 text-blue-800 font-medium">
                    매니저
                  </span>
                </div>
                {manager.bio && (
                  <p className="text-sm text-gray-600 line-clamp-2">{manager.bio}</p>
                )}
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* 팀 멤버 */}
      <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">팀 멤버</h2>
          {isManager ? (
            <button
              onClick={editTeam}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
            >
              <Plus className="w-4 h-4" />
              멤버 추가
            </button>
          ) : (
            <p className="text-xs text-gray-500">매니저만 팀원을 관리할 수 있습니다.</p>
          )}
        </div>
        
        {team_members && team_members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team_members.map((member) => (
              <div
                key={member.id}
                className="relative border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <Link
                  href={`/profile/${encodeURIComponent(member.account?.username || '')}`}
                  className="block"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-pink-500 flex items-center justify-center text-white font-bold">
                      {member.account?.username?.[0] || '?'}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {member.account?.username || '이름 없음'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {member.account?.role === 'MAKER' && '메이커'}
                        {member.account?.role === 'MANAGER' && '매니저'}
                        {member.account?.role === 'NONE' && '역할 없음'}
                        {!member.account?.role && '역할 없음'}
                      </p>
                    </div>
                  </div>
                  {member.account?.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2">{member.account.bio}</p>
                  )}
                  {member.status && (
                    <div className="mt-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        member.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {member.status}
                      </span>
                    </div>
                  )}
                </Link>
                {isManager && (
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleRemoveMember(member.id)
                    }}
                    className="absolute top-2 right-2 p-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="팀원 제거"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>팀 멤버가 없습니다.</p>
            {isManager && (
              <button
                onClick={editTeam}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                멤버 추가하기
              </button>
            )}
          </div>
        )}
      </section>

      {/* 팀원 추가 다이얼로그 */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>팀원 추가</DialogTitle>
            <DialogDescription>
              메이커를 검색하여 팀에 추가하세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 검색 입력 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch()
                  }
                }}
                placeholder="메이커 이름 또는 소개로 검색..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button onClick={handleSearch} disabled={searching}>
                {searching ? '검색 중...' : '검색'}
              </Button>
            </div>

            {/* 검색 결과 */}
            {searchResults.length > 0 && (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {searchResults.map((maker) => (
                  <div
                    key={maker.profile_id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <SearchMakerCard maker={maker} />
                    </div>
                    <Button
                      onClick={() => handleAddMember(maker.profile_id)}
                      size="sm"
                      className="ml-4"
                    >
                      추가
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchTerm && searchResults.length === 0 && !searching && (
              <div className="text-center py-8 text-gray-500">
                <p>검색 결과가 없습니다.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 진행중인 프로젝트 */}
      <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">진행중인 프로젝트</h2>
          {isManager && (
            <button
              onClick={editProject}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              프로젝트 관리
            </button>
          )}
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>진행중인 프로젝트가 없습니다.</p>
        </div>
      </section>

      {/* 팀 경력 */}
      <section className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">팀 경력</h2>
          {isManager && (
            <button
              onClick={editCareer}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              경력 관리
            </button>
          )}
        </div>
        <div className="text-center py-8 text-gray-500">
          <p>팀 경력 정보가 없습니다.</p>
        </div>
      </section>
        </>
      )}
    </div>
  )
}

export default TeamProfileClient

