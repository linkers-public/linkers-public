'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { fetchTeamDetail, requestTeamJoin } from '@/apis/team.service'
import { acceptTeamProposal, declineTeamProposal } from '@/apis/proposal.service'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft,
  Building2,
  Users,
  UserCircle,
  Briefcase,
  Award,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  UserPlus
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface TeamViewClientProps {
  teamId: string
}

const TeamViewClient: React.FC<TeamViewClientProps> = ({ teamId }) => {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teamData, setTeamData] = useState<any>(null)
  const [hasProposal, setHasProposal] = useState(false)
  const [proposalId, setProposalId] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMember, setIsMember] = useState(false)
  const [hasPendingRequest, setHasPendingRequest] = useState(false)

  useEffect(() => {
    const loadTeam = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const teamIdNum = parseInt(teamId, 10)
        if (isNaN(teamIdNum)) {
          throw new Error('유효하지 않은 팀 ID입니다.')
        }

        // 먼저 팀 제안을 받은 사용자인지 확인
        const supabase = createSupabaseBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth')
          return
        }

        // 현재 사용자의 프로필 조회
        const { data: currentProfile } = await supabase
          .from('accounts')
          .select('profile_id')
          .eq('user_id', user.id)
          .eq('profile_type', 'FREELANCER')
          .eq('is_active', true)
          .is('deleted_at', null)
          .maybeSingle()

        let proposal: { id: number } | null = null
        
        if (currentProfile) {
          // 팀 제안 확인
          const { data: proposalData } = await supabase
            .from('team_proposals')
            .select('id')
            .eq('maker_id', user.id)
            .eq('team_id', teamIdNum)
            .maybeSingle()

          proposal = proposalData

          if (proposal) {
            setHasProposal(true)
            setProposalId(proposal.id)
          }

          // 팀원 여부 확인
          const { data: member } = await supabase
            .from('team_members')
            .select('id, status')
            .eq('team_id', teamIdNum)
            .eq('profile_id', currentProfile.profile_id)
            .maybeSingle()

          if (member) {
            if (member.status === 'active') {
              setIsMember(true)
            } else if (member.status === 'pending') {
              setHasPendingRequest(true)
            }
          }
        }

        // 팀 정보 조회
        const { data, error: teamError } = await fetchTeamDetail(teamIdNum)
        
        if (teamError) {
          // 팀 제안을 받은 사용자인 경우에도 조회 시도
          if (proposal) {
            // 직접 팀 정보 조회 시도
            const { data: directTeamData, error: directError } = await supabase
              .from('teams')
              .select(`
                *,
                manager:manager_profile_id (
                  profile_id,
                  user_id,
                  username,
                  role,
                  bio,
                  profile_image_url
                ),
                team_members:team_members (
                  *,
                  account:profile_id (
                    profile_id,
                    user_id,
                    username,
                    role,
                    bio,
                    profile_image_url
                  )
                )
              `)
              .eq('id', teamIdNum)
              .single()

            if (directError) {
              throw new Error('팀 정보를 불러올 수 없습니다.')
            }

            setTeamData({
              ...directTeamData,
              isManager: false,
              manager: directTeamData.manager || null,
              team_members: (directTeamData.team_members || []).map((member: any) => ({
                ...member,
                account: member.account || null,
              })),
            })
          } else {
            throw teamError
          }
        } else if (data) {
          setTeamData(data)
        } else {
          throw new Error('팀 정보를 찾을 수 없습니다.')
        }
      } catch (err: any) {
        console.error('팀 정보 로드 실패:', err)
        setError(err.message || '팀 정보를 불러오는데 실패했습니다.')
        toast({
          variant: 'destructive',
          title: '오류 발생',
          description: err.message || '팀 정보를 불러오는데 실패했습니다.',
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadTeam()
  }, [teamId, router, toast])

  const handleAccept = async () => {
    if (!proposalId) return

    setIsProcessing(true)
    try {
      await acceptTeamProposal(proposalId)
      toast({
        title: '팀 제안 수락',
        description: '팀 제안을 수락했습니다. 이제 팀원으로 활동할 수 있습니다.',
      })
      // 팀 프로필 페이지로 이동
      router.push('/my/team-profile')
    } catch (error: any) {
      console.error('팀 제안 수락 실패:', error)
      toast({
        variant: 'destructive',
        title: '팀 제안 수락 실패',
        description: error.message || '팀 제안을 수락하는데 실패했습니다.',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDecline = async () => {
    if (!proposalId) return

    if (!confirm('정말 이 팀 제안을 거절하시겠습니까?')) {
      return
    }

    setIsProcessing(true)
    try {
      await declineTeamProposal(proposalId)
      toast({
        title: '팀 제안 거절',
        description: '팀 제안을 거절했습니다.',
      })
      // 이전 페이지로 이동
      router.back()
    } catch (error: any) {
      console.error('팀 제안 거절 실패:', error)
      toast({
        variant: 'destructive',
        title: '팀 제안 거절 실패',
        description: error.message || '팀 제안을 거절하는데 실패했습니다.',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRequestJoin = async () => {
    if (!teamData?.id) return

    setIsProcessing(true)
    try {
      await requestTeamJoin(teamData.id)
      toast({
        title: '합류 신청 완료',
        description: '팀 합류 신청이 완료되었습니다. 매니저의 승인을 기다려주세요.',
      })
      setHasPendingRequest(true)
    } catch (error: any) {
      console.error('합류 신청 실패:', error)
      toast({
        variant: 'destructive',
        title: '합류 신청 실패',
        description: error.message || '합류 신청에 실패했습니다.',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] w-full">
        <div className="text-center space-y-4 w-full">
          <Loader2 className="w-12 h-12 text-blue-600 mx-auto animate-spin" />
          <p className="text-base font-medium text-gray-700 text-center">팀 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error || !teamData) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] px-4 w-full">
        <div className="text-center bg-red-50 border border-red-200 rounded-xl p-8 max-w-md w-full mx-auto">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-lg font-semibold text-red-900 mb-2 text-center">오류가 발생했습니다</p>
          <p className="text-sm text-red-700 text-center mb-4">{error || '팀 정보를 찾을 수 없습니다.'}</p>
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            돌아가기
          </Button>
        </div>
      </div>
    )
  }

  const {
    id,
    name,
    bio,
    specialty,
    sub_specialty,
    prefered,
    manager,
    team_members,
  } = teamData

  return (
    <div className="flex flex-col gap-8 w-full pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* 뒤로가기 버튼 */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => router.back()}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          돌아가기
        </Button>
        {hasProposal && (
          <div className="flex items-center gap-4 flex-1">
            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">
                이 팀으로부터 제안을 받으셨습니다
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleAccept}
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    수락
                  </>
                )}
              </Button>
              <Button
                onClick={handleDecline}
                variant="outline"
                disabled={isProcessing}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    처리 중...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    거절
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
        {!hasProposal && !isMember && !hasPendingRequest && teamData && !teamData.isManager && (
          <div className="flex items-center gap-4 flex-1">
            <Button
              onClick={handleRequestJoin}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  팀 합류 신청
                </>
              )}
            </Button>
          </div>
        )}
        {isMember && (
          <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700 font-medium">
              이미 이 팀의 멤버입니다
            </p>
          </div>
        )}
        {hasPendingRequest && (
          <div className="px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-700 font-medium">
              합류 신청이 진행 중입니다. 매니저의 승인을 기다려주세요.
            </p>
          </div>
        )}
      </div>

      {/* 팀 기본 정보 */}
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-start gap-5 flex-1">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md flex-shrink-0">
            {name?.[0] || '팀'}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{name || '팀 이름 없음'}</h1>
            <p className="text-gray-600 text-base leading-relaxed">{bio || '소개가 없습니다.'}</p>
          </div>
        </div>

        {/* 전문분야 */}
        {specialty && specialty.length > 0 && (
          <div className="mt-6 mb-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-gray-500" />
              전문분야
            </h3>
            <div className="flex flex-wrap gap-2">
              {specialty.map((sep: string, idx: number) => (
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
              {sub_specialty.map((ssep: string, idx: number) => (
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
              {prefered.map((pref: string, idx: number) => (
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
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">팀 멤버</h2>
        </div>
        
        {team_members && team_members.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team_members.map((member: any) => (
              <Link
                key={member.id}
                href={`/profile/${encodeURIComponent(member.account?.username || '')}`}
                className="block border-2 border-gray-100 rounded-xl p-5 hover:shadow-lg hover:border-gray-200 transition-all duration-200 bg-white"
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
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-700 mb-2">팀 멤버가 없습니다</p>
          </div>
        )}
      </section>
    </div>
  )
}

export default TeamViewClient

