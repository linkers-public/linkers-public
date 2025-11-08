'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { selectAccount, useAccountStore } from '@/stores/useAccoutStore'
import { useTeamProfileStore } from '@/stores/useTeamProfileStore'
import { removeTeamMember, createDefaultTeam, updateTeam } from '@/apis/team.service'
import { searchMakers } from '@/apis/search-maker.service'
import { propose } from '@/apis/proposal.service'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { SearchMakerCard } from '@/components/SearchMakerCard'
import { JOB_OPTIONS, EXPERTISE_OPTIONS } from '@/constants/job-options'
import { useToast } from '@/hooks/use-toast'
import { 
  Plus, 
  Trash2, 
  Users, 
  XCircle, 
  UserPlus, 
  Settings, 
  Briefcase, 
  Award, 
  Search, 
  Edit, 
  Building2,
  UserCircle,
  Loader2,
  AlertCircle
} from 'lucide-react'

// team_specialty enum 값들 (데이터베이스 enum과 일치해야 함)
const TEAM_SPECIALTY_OPTIONS = [
  '웹 및 모바일 개발',
  '데이터 및 인공지능',
  '클라우드 및 인프라',
  '보안 및 테스트',
  '비즈니스 프로세스 관리',
  '기타',
] as const

const TeamProfileClient = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedMaker, setSelectedMaker] = useState<{ makerId: string; makerUsername: string } | null>(null)
  const [proposalMessage, setProposalMessage] = useState('')
  const [isSendingProposal, setIsSendingProposal] = useState(false)
  const [isCreatingTeam, setIsCreatingTeam] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isUpdatingTeam, setIsUpdatingTeam] = useState(false)
  const [editFormData, setEditFormData] = useState({
    name: '',
    bio: '',
    specialty: [] as string[],
    sub_specialty: [] as string[],
    prefered: [] as string[],
  })
  const { teamProfile, teams, selectedTeamId, fetchMyTeams, selectTeam, refreshTeam } = useTeamProfileStore()
  const account = useAccountStore(selectAccount)

  // 팀 목록 불러오기
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
  }, [fetchMyTeams])

  // URL 쿼리 파라미터에서 team_id 확인
  useEffect(() => {
    const teamIdParam = searchParams.get('team_id')
    if (teamIdParam) {
      const teamId = parseInt(teamIdParam, 10)
      if (!isNaN(teamId)) {
        // 먼저 teams 목록에서 확인
        const teamExists = teams.some((team: any) => team.id === teamId)
        if (teamExists) {
          // 현재 선택된 팀과 다를 때만 선택
          if (selectedTeamId !== teamId) {
            selectTeam(teamId)
          }
        } else if (!isLoading) {
          // teams 목록에 없고 로딩이 완료된 경우
          // 팀 제안을 받은 사용자일 수 있으므로 직접 조회 시도
          const loadTeamDirectly = async () => {
            try {
              // 먼저 팀 제안을 받은 사용자인지 확인
              const supabase = (await import('@/supabase/supabase-client')).createSupabaseBrowserClient()
              const { data: { user } } = await supabase.auth.getUser()
              if (user) {
                const { data: proposal } = await supabase
                  .from('team_proposals')
                  .select('id')
                  .eq('maker_id', user.id)
                  .eq('team_id', teamId)
                  .maybeSingle()
                
                if (proposal) {
                  // 팀 제안을 받은 사용자이므로 팀 정보를 직접 조회
                  const { fetchTeamDetail } = await import('@/apis/team.service')
                  const { data, error } = await fetchTeamDetail(teamId)
                  if (error) {
                    toast({
                      variant: 'destructive',
                      title: '팀 정보를 불러올 수 없습니다',
                      description: error.message || '팀 정보를 조회하는데 실패했습니다.',
                    })
                  } else if (data) {
                    // 팀 정보를 성공적으로 조회했으므로 선택
                    await selectTeam(teamId)
                  }
                } else {
                  toast({
                    variant: 'destructive',
                    title: '팀을 찾을 수 없습니다',
                    description: '해당 팀에 대한 접근 권한이 없습니다.',
                  })
                }
              }
            } catch (err) {
              console.error('팀 정보 조회 실패:', err)
              toast({
                variant: 'destructive',
                title: '팀을 찾을 수 없습니다',
                description: '해당 팀에 대한 접근 권한이 없습니다.',
              })
            }
          }
          loadTeamDirectly()
        }
        // isLoading이 true인 경우는 아직 로딩 중이므로 기다림
      }
    }
  }, [searchParams, teams, selectedTeamId, selectTeam, toast, isLoading])

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
  const editProfile = () => {
    if (!isManager) {
      toast({
        variant: 'destructive',
        title: '권한 없음',
        description: '팀 매니저만 팀 정보를 수정할 수 있습니다.',
      })
      return
    }
    
    if (!teamProfile) return
    
    // 현재 팀 정보로 폼 데이터 초기화
    setEditFormData({
      name: teamProfile.name || '',
      bio: teamProfile.bio || '',
      specialty: teamProfile.specialty || [],
      sub_specialty: teamProfile.sub_specialty || [],
      prefered: teamProfile.prefered || [],
    })
    setShowEditDialog(true)
  }
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

  // 팀 제안 보내기 (매니저만 가능)
  const handlePropose = (maker: any) => {
    if (!id) return
    
    if (!isManager) {
      toast({
        variant: 'destructive',
        title: '권한 없음',
        description: '팀 매니저만 팀 제안을 보낼 수 있습니다.',
      })
      return
    }

    // 메이커의 user_id 확인 (accounts 테이블에서 가져온 데이터는 user_id를 포함)
    if (!maker.user_id) {
      toast({
        variant: 'destructive',
        title: '오류',
        description: '메이커 정보를 찾을 수 없습니다.',
      })
      return
    }

    setSelectedMaker({
      makerId: maker.user_id,
      makerUsername: maker.username || '메이커',
    })
    setProposalMessage('')
  }

  // 팀 제안 전송
  const handleSendProposal = async () => {
    if (!id || !selectedMaker) return

    setIsSendingProposal(true)
    try {
      await propose(selectedMaker.makerId, {
        teamId: id,
        message: proposalMessage.trim() || null,
      })
      
      toast({
        title: '팀 제안 전송 완료',
        description: `${selectedMaker.makerUsername}님에게 팀 제안을 보냈습니다.`,
      })
      
      setSelectedMaker(null)
      setProposalMessage('')
      setShowAddMemberDialog(false)
      setSearchTerm('')
      setSearchResults([])
      await refreshTeam(id)
    } catch (err: any) {
      console.error('팀 제안 전송 실패:', err)
      toast({
        variant: 'destructive',
        title: '팀 제안 전송 실패',
        description: err.message || '팀 제안을 보내는 중 오류가 발생했습니다.',
      })
    } finally {
      setIsSendingProposal(false)
    }
  }

  // 팀 정보 업데이트 핸들러
  const handleUpdateTeam = async () => {
    if (!id) return

    if (!editFormData.name.trim()) {
      toast({
        variant: 'destructive',
        title: '입력 오류',
        description: '팀 이름을 입력해주세요.',
      })
      return
    }

    setIsUpdatingTeam(true)
    try {
      await updateTeam(id, {
        name: editFormData.name.trim(),
        bio: editFormData.bio.trim() || null,
        specialty: editFormData.specialty,
        sub_specialty: editFormData.sub_specialty,
        prefered: editFormData.prefered,
      })

      toast({
        title: '팀 정보 수정 완료',
        description: '팀 정보가 성공적으로 업데이트되었습니다.',
      })

      setShowEditDialog(false)
      await refreshTeam(id)
    } catch (err: any) {
      console.error('팀 정보 수정 실패:', err)
      toast({
        variant: 'destructive',
        title: '팀 정보 수정 실패',
        description: err.message || '팀 정보를 수정하는 중 오류가 발생했습니다.',
      })
    } finally {
      setIsUpdatingTeam(false)
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
      <div className="flex justify-center items-center min-h-[60vh] w-full">
        <div className="text-center space-y-4 w-full">
          <Loader2 className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
          <p className="text-base font-medium text-gray-700 text-center">팀 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] px-4 w-full">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-8 max-w-md w-full mx-auto">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-red-900 mb-2 text-center">오류가 발생했습니다</p>
          <p className="text-sm text-red-700 text-center">{error}</p>
        </div>
      </div>
    )
  }

  // 팀 생성 핸들러
  const handleCreateTeam = async () => {
    setIsCreatingTeam(true)
    try {
      const { data, error } = await createDefaultTeam()
      
      if (error) {
        throw error
      }

      if (data) {
        toast({
          title: '팀 생성 완료',
          description: '기본 팀이 생성되었습니다.',
        })
        
        // 팀 목록 다시 로드
        await fetchMyTeams()
        
        // 생성된 팀 자동 선택
        if (data.id) {
          await selectTeam(data.id)
        }
      }
    } catch (err: any) {
      console.error('팀 생성 실패:', err)
      toast({
        variant: 'destructive',
        title: '팀 생성 실패',
        description: err.message || '팀을 생성하는데 실패했습니다.',
      })
    } finally {
      setIsCreatingTeam(false)
    }
  }

  if (!teams || teams.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] px-4 w-full">
        <div className="text-center space-y-6 w-full max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-900 text-center">속한 팀이 없습니다</p>
            <p className="text-sm text-gray-500 text-center">팀에 가입하거나 팀을 생성해보세요.</p>
          </div>
          <Button
            onClick={handleCreateTeam}
            disabled={isCreatingTeam}
            size="lg"
            className="flex items-center gap-2 mx-auto"
          >
            {isCreatingTeam ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                팀 생성하기
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 w-full pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 팀 목록 */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">내가 속한 팀</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teams.map((team) => (
            <button
              key={team.id}
              onClick={() => selectTeam(team.id)}
              className={`text-left border-2 rounded-xl p-5 transition-all duration-200 hover:shadow-lg ${
                selectedTeamId === team.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start gap-4 mb-3">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
                  {team.name?.[0] || '팀'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">{team.name || '팀 이름 없음'}</h3>
                    {team.isManager && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 text-xs font-medium flex-shrink-0">
                        <Settings className="w-3 h-3" />
                        매니저
                      </span>
                    )}
                  </div>
                  {team.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">{team.bio}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-xs font-medium text-gray-600">
                  팀원 {team.team_members?.length || 0}명
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 선택된 팀 상세 정보 */}
      {!teamProfile ? (
        <div className="flex justify-center items-center min-h-[400px] bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-700">팀을 선택해주세요</p>
            <p className="text-sm text-gray-500">위에서 팀을 선택하면 상세 정보를 확인할 수 있습니다.</p>
          </div>
        </div>
      ) : (
        <>
      {/* 팀 기본 정보 */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-start justify-between mb-6 gap-4">
          <div className="flex items-start gap-5 flex-1">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md flex-shrink-0">
              {name?.[0] || '팀'}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{name || '팀 이름 없음'}</h1>
              <p className="text-gray-600 text-base leading-relaxed">{bio || '소개가 없습니다.'}</p>
            </div>
          </div>
          {isManager && (
            <Button
              onClick={editProfile}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 flex-shrink-0 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <Edit className="w-4 h-4" />
              프로필 수정
            </Button>
          )}
        </div>

        {/* 전문분야 */}
        {specialty && specialty.length > 0 && (
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-gray-500" />
              전문분야
            </h3>
            <div className="flex flex-wrap gap-2">
              {specialty.map((sep, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 text-sm rounded-lg bg-blue-50 text-blue-700 font-medium border border-blue-100"
                >
                  {sep}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 세부 전문분야 */}
        {sub_specialty && sub_specialty.length > 0 && (
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-gray-500" />
              세부 전문분야
            </h3>
            <div className="flex flex-wrap gap-2">
              {sub_specialty.map((ssep, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 text-sm rounded-lg bg-purple-50 text-purple-700 font-medium border border-purple-100"
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
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-gray-500" />
              선호 프로젝트 유형
            </h3>
            <div className="flex flex-wrap gap-2">
              {prefered.map((pref, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 text-sm rounded-lg bg-green-50 text-green-700 font-medium border border-green-100"
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
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <UserCircle className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">팀 매니저</h2>
          </div>
          <Link
            href={`/profile/${encodeURIComponent(manager.username)}`}
            className="block border-2 border-blue-100 rounded-xl p-5 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0">
                {manager.username?.[0] || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 text-lg truncate">{manager.username}</h3>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-blue-200 text-blue-800 font-medium flex-shrink-0">
                    <Settings className="w-3 h-3" />
                    매니저
                  </span>
                </div>
                {manager.bio && (
                  <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">{manager.bio}</p>
                )}
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* 팀 멤버 */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">팀 멤버</h2>
          </div>
          {isManager ? (
            <Button
              onClick={editTeam}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <UserPlus className="w-4 h-4" />
              멤버 추가
            </Button>
          ) : (
            <p className="text-xs text-gray-500 hidden sm:block">매니저만 팀원을 관리할 수 있습니다.</p>
          )}
        </div>
        
        {team_members && team_members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team_members.map((member) => (
              <div
                key={member.id}
                className="relative border-2 border-gray-100 rounded-xl p-5 hover:shadow-lg hover:border-gray-200 transition-all duration-200 bg-white"
              >
                <Link
                  href={`/profile/${encodeURIComponent(member.account?.username || '')}`}
                  className="block"
                >
                  <div className="flex items-start gap-4 mb-3">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
                      {member.account?.username?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate mb-1">
                        {member.account?.username || '이름 없음'}
                      </h3>
                      <p className="text-xs text-gray-500 font-medium">
                        {member.account?.role === 'MAKER' && '메이커'}
                        {member.account?.role === 'MANAGER' && '매니저'}
                        {member.account?.role === 'NONE' && '역할 없음'}
                        {!member.account?.role && '역할 없음'}
                      </p>
                    </div>
                  </div>
                  {member.account?.bio && (
                    <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-3">{member.account.bio}</p>
                  )}
                  {member.status && (
                    <div className="mt-2">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg font-medium ${
                        member.status === 'active' 
                          ? 'bg-green-50 text-green-700 border border-green-100' 
                          : 'bg-gray-50 text-gray-700 border border-gray-100'
                      }`}>
                        {member.status === 'active' && <div className="w-1.5 h-1.5 rounded-full bg-green-500" />}
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
                    className="absolute top-3 right-3 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                    title="팀원 제거"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-700 mb-2">팀 멤버가 없습니다</p>
            {isManager && (
              <Button
                onClick={editTeam}
                variant="outline"
                size="default"
                className="mt-4 flex items-center gap-2 mx-auto border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              >
                <UserPlus className="w-4 h-4" />
                멤버 추가하기
              </Button>
            )}
          </div>
        )}
      </section>

      {/* 팀원 추가 다이얼로그 */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              팀 제안 보내기
            </DialogTitle>
            <DialogDescription>
              메이커를 검색하여 팀 제안을 보내세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 검색 입력 */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <Button 
                onClick={handleSearch} 
                disabled={searching} 
                variant="default"
                size="default"
                className="flex items-center gap-2 px-6"
              >
                {searching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    검색 중...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    검색
                  </>
                )}
              </Button>
            </div>

            {/* 검색 결과 */}
            {searchResults.length > 0 && (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {searchResults.map((maker) => (
                  <div
                    key={maker.profile_id}
                    className="flex items-center justify-between p-4 border-2 border-gray-100 rounded-xl hover:bg-gray-50 hover:border-gray-200 transition-all"
                  >
                    <div className="flex-1">
                      <SearchMakerCard maker={maker} />
                    </div>
                    <Button
                      onClick={() => handlePropose(maker)}
                      variant="outline"
                      size="sm"
                      className="ml-4 flex items-center gap-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                    >
                      <UserPlus className="w-4 h-4" />
                      제안 보내기
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {searchTerm && searchResults.length === 0 && !searching && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-base font-medium text-gray-700">검색 결과가 없습니다</p>
                <p className="text-sm text-gray-500 mt-1">다른 검색어로 시도해보세요.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 팀 제안 메시지 입력 다이얼로그 */}
      <Dialog open={!!selectedMaker} onOpenChange={(open) => !open && setSelectedMaker(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>팀 제안 보내기</DialogTitle>
            <DialogDescription>
              {selectedMaker?.makerUsername}님에게 팀 제안을 보냅니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                메시지 내용 <span className="text-gray-400 font-normal">(선택사항)</span>
              </label>
              <Textarea
                value={proposalMessage}
                onChange={(e) => setProposalMessage(e.target.value)}
                placeholder="팀 제안 내용을 입력해주세요... (선택사항)"
                rows={6}
                className="resize-none"
                maxLength={1000}
              />
              <p className={`text-xs mt-2 ${
                proposalMessage.length >= 1000 
                  ? 'text-red-500' 
                  : 'text-gray-500'
              }`}>
                {proposalMessage.length}/1000자
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedMaker(null)}
              disabled={isSendingProposal}
            >
              취소
            </Button>
            <Button 
              onClick={handleSendProposal}
              disabled={isSendingProposal}
            >
              {isSendingProposal ? '전송 중...' : '제안 보내기'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 팀 정보 편집 다이얼로그 */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              팀 정보 수정
            </DialogTitle>
            <DialogDescription>
              팀 정보를 수정할 수 있습니다. 매니저만 수정 가능합니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* 팀 이름 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                팀 이름 <span className="text-red-500">*</span>
              </label>
              <Input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="팀 이름을 입력하세요"
                maxLength={100}
              />
            </div>

            {/* 팀 소개 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                팀 소개
              </label>
              <Textarea
                value={editFormData.bio}
                onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                placeholder="팀에 대해 간단히 소개해주세요"
                rows={5}
                className="resize-none"
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {editFormData.bio.length}/1000자
              </p>
            </div>

            {/* 전문분야 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                전문분야
              </label>
              <div className="flex flex-wrap gap-2">
                {TEAM_SPECIALTY_OPTIONS.map((specialty) => (
                  <button
                    key={specialty}
                    type="button"
                    onClick={() => {
                      const newSpecialty = editFormData.specialty.includes(specialty)
                        ? editFormData.specialty.filter((s) => s !== specialty)
                        : [...editFormData.specialty, specialty]
                      setEditFormData({ ...editFormData, specialty: newSpecialty })
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      editFormData.specialty.includes(specialty)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {specialty}
                  </button>
                ))}
              </div>
            </div>

            {/* 세부 전문분야 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                세부 전문분야
              </label>
              <div className="flex flex-wrap gap-2">
                {EXPERTISE_OPTIONS.map((expertise) => (
                  <button
                    key={expertise}
                    type="button"
                    onClick={() => {
                      const newSubSpecialty = editFormData.sub_specialty.includes(expertise)
                        ? editFormData.sub_specialty.filter((s) => s !== expertise)
                        : [...editFormData.sub_specialty, expertise]
                      setEditFormData({ ...editFormData, sub_specialty: newSubSpecialty })
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      editFormData.sub_specialty.includes(expertise)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {expertise}
                  </button>
                ))}
              </div>
            </div>

            {/* 선호 프로젝트 유형 */}
            <div>
              <label className="block text-sm font-medium mb-2">
                선호 프로젝트 유형
              </label>
              <div className="flex flex-wrap gap-2">
                {JOB_OPTIONS.map((job) => (
                  <button
                    key={job}
                    type="button"
                    onClick={() => {
                      const newPrefered = editFormData.prefered.includes(job)
                        ? editFormData.prefered.filter((p) => p !== job)
                        : [...editFormData.prefered, job]
                      setEditFormData({ ...editFormData, prefered: newPrefered })
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      editFormData.prefered.includes(job)
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {job}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={isUpdatingTeam}
            >
              취소
            </Button>
            <Button 
              onClick={handleUpdateTeam}
              disabled={isUpdatingTeam}
            >
              {isUpdatingTeam ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  수정 중...
                </>
              ) : (
                '수정 완료'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 진행중인 프로젝트 */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">진행중인 프로젝트</h2>
          </div>
          {isManager && (
            <Button
              onClick={editProject}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <Settings className="w-4 h-4" />
              프로젝트 관리
            </Button>
          )}
        </div>
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-base font-medium text-gray-700">진행중인 프로젝트가 없습니다</p>
        </div>
      </section>

      {/* 팀 경력 */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Award className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">팀 경력</h2>
          </div>
          {isManager && (
            <Button
              onClick={editCareer}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <Settings className="w-4 h-4" />
              경력 관리
            </Button>
          )}
        </div>
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-base font-medium text-gray-700">팀 경력 정보가 없습니다</p>
        </div>
      </section>
        </>
      )}
    </div>
  )
}

export default TeamProfileClient

