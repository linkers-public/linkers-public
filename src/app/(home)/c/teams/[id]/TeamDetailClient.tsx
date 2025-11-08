'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { fetchTeamDetail } from '@/apis/team.service'
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
  FileText
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface TeamDetailClientProps {
  teamId: number
}

const TeamDetailClient: React.FC<TeamDetailClientProps> = ({ teamId }) => {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teamData, setTeamData] = useState<any>(null)
  const [showProposalDialog, setShowProposalDialog] = useState(false)
  const [proposalMessage, setProposalMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [companyProfile, setCompanyProfile] = useState<any>(null)

  useEffect(() => {
    const loadTeam = async () => {
      setIsLoading(true)
      setError(null)
      
      try {
        const supabase = createSupabaseBrowserClient()
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          router.push('/auth')
          return
        }

        // 기업 프로필 확인
        const { data: profile } = await supabase
          .from('accounts')
          .select('profile_id, user_id, username')
          .eq('user_id', user.id)
          .eq('profile_type', 'COMPANY')
          .eq('is_active', true)
          .is('deleted_at', null)
          .maybeSingle()

        if (!profile) {
          setError('기업 프로필이 필요합니다.')
          return
        }

        setCompanyProfile(profile)

        // 팀 정보 조회
        const { data, error: teamError } = await fetchTeamDetail(teamId)
        
        if (teamError) {
          throw teamError
        }

        if (!data) {
          throw new Error('팀 정보를 찾을 수 없습니다.')
        }

        setTeamData(data)
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

  const handlePropose = () => {
    setProposalMessage('')
    setShowProposalDialog(true)
  }

  const handleSubmitProposal = async () => {
    if (!teamData || !companyProfile) return

    setIsSubmitting(true)
    try {
      const supabase = createSupabaseBrowserClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('로그인이 필요합니다.')
      }

      // counsel 생성 후 estimate 요청
      // 먼저 counsel 생성
      const { data: counselData, error: counselError } = await supabase
        .from('counsel')
        .insert({
          client_id: user.id,
          company_profile_id: companyProfile.profile_id,
          title: `${teamData.name} 팀 견적 요청`,
          outline: proposalMessage || '팀 견적을 요청합니다.',
          counsel_status: 'pending',
          start_date: new Date().toISOString().split('T')[0],
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })
        .select()
        .single()

      if (counselError) throw counselError

      // estimate 생성 (팀에게 견적 요청)
      const { data: estimateData, error: estimateError } = await supabase
        .from('estimate')
        .insert({
          team_id: teamData.id,
          company_profile_id: companyProfile.profile_id,
          counsel_id: counselData.counsel_id,
          estimate_status: 'pending',
          estimate_date: new Date().toISOString().split('T')[0],
        })
        .select()
        .single()

      if (estimateError) throw estimateError

      toast({
        title: '견적 요청 완료',
        description: `${teamData.name} 팀에 견적을 요청했습니다.`,
      })

      setShowProposalDialog(false)
      setProposalMessage('')
      router.push('/enterprise/my-counsel')
    } catch (err: any) {
      console.error('견적 요청 실패:', err)
      toast({
        variant: 'destructive',
        title: '견적 요청 실패',
        description: err.message || '견적을 요청하는 중 오류가 발생했습니다.',
      })
    } finally {
      setIsSubmitting(false)
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
    <>
      <div className="flex flex-col gap-8 w-full pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 뒤로가기 버튼 및 제안하기 */}
        <div className="flex items-center justify-between gap-4">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </Button>
          <Button
            onClick={handlePropose}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
          >
            <FileText className="w-4 h-4" />
            견적 요청
          </Button>
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

      {/* 견적 요청 다이얼로그 */}
      <Dialog open={showProposalDialog} onOpenChange={setShowProposalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>견적 요청</DialogTitle>
            <DialogDescription>
              {teamData?.name} 팀에 구체적인 프로젝트 견적을 요청합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                프로젝트 설명 (선택사항)
              </label>
              <Textarea
                value={proposalMessage}
                onChange={(e) => setProposalMessage(e.target.value)}
                placeholder="프로젝트에 대한 간단한 설명을 입력해주세요..."
                rows={4}
                className="resize-none"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowProposalDialog(false)
                setProposalMessage('')
              }}
            >
              취소
            </Button>
            <Button
              onClick={handleSubmitProposal}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  전송 중...
                </>
              ) : (
                '전송'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default TeamDetailClient

