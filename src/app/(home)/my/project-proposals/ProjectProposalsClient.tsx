'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Clock, Building2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

interface CompanyProposal {
  id: number
  counsel_id: number
  counsel_title: string
  client_id: string
  client_name: string
  status: string | null
  created_at: string
}

export default function ProjectProposalsClient() {
  const router = useRouter()
  const [companyProposals, setCompanyProposals] = useState<CompanyProposal[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadProjectProposals()
  }, [])

  const loadProjectProposals = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // 활성 프로필 확인
      const { data: profile } = await supabase
        .from('accounts')
        .select('profile_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .maybeSingle()

      if (!profile) {
        toast({
          variant: 'destructive',
          title: '프로필이 필요합니다',
          description: '프로필을 생성해주세요.',
        })
        router.push('/my/profile/manage')
        return
      }

      // 기업 제안 조회 (project_members 테이블에서 본인이 초대된 경우)
      const { data: proposals, error: proposalsError } = await supabase
        .from('project_members')
        .select(
          `
            id,
            counsel_id,
            status,
            created_at,
            counsel:counsel_id (
              counsel_id,
              title,
              client_id,
              client:client_id (
                user_id,
                accounts:user_id (
                  username
                )
              )
            )
          `
        )
        .eq('profile_id', profile.profile_id)
        .order('created_at', { ascending: false })

      if (proposalsError) {
        console.error('기업 제안 조회 실패:', proposalsError)
        toast({
          variant: 'destructive',
          title: '프로젝트 제안을 불러오는데 실패했습니다',
          description: proposalsError.message,
        })
      } else {
        const formattedProposals: CompanyProposal[] =
          proposals?.map((proposal: any) => ({
            id: proposal.id,
            counsel_id: proposal.counsel_id,
            counsel_title: proposal.counsel?.title || '제목 없음',
            client_id: proposal.counsel?.client_id || '',
            client_name: proposal.counsel?.client?.accounts?.username || '알 수 없음',
            status: proposal.status,
            created_at: proposal.created_at,
          })) || []
        setCompanyProposals(formattedProposals)
      }
    } catch (error: any) {
      console.error('프로젝트 제안 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '프로젝트 제안을 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async (proposalId: number) => {
    try {
      const { error } = await supabase
        .from('project_members')
        .update({ status: 'ACTIVE' })
        .eq('id', proposalId)

      if (error) throw error

      toast({
        title: '프로젝트 제안 수락',
        description: '프로젝트 제안을 수락했습니다.',
      })
      loadProjectProposals()
    } catch (error: any) {
      console.error('프로젝트 제안 수락 실패:', error)
      toast({
        variant: 'destructive',
        title: '프로젝트 제안 수락 실패',
        description: error.message,
      })
    }
  }

  const handleDecline = async (proposalId: number) => {
    try {
      const { error } = await supabase
        .from('project_members')
        .update({ status: 'LEFT' })
        .eq('id', proposalId)

      if (error) throw error

      toast({
        title: '프로젝트 제안 거절',
        description: '프로젝트 제안을 거절했습니다.',
      })
      loadProjectProposals()
    } catch (error: any) {
      console.error('프로젝트 제안 거절 실패:', error)
      toast({
        variant: 'destructive',
        title: '프로젝트 제안 거절 실패',
        description: error.message,
      })
    }
  }

  const getStatusBadge = (status: string | null) => {
    if (!status || status === 'pending' || status === 'invited') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3" />
          대기중
        </span>
      )
    }
    if (status === 'active') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3" />
          수락됨
        </span>
      )
    }
    if (status === 'declined') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" />
          거절됨
        </span>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">프로젝트 제안을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-4 md:py-6 px-2 md:px-4">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">받은 프로젝트 제안</h1>
        <p className="text-gray-600">기업이 보낸 견적 요청을 확인하세요</p>
      </div>

      <div className="space-y-4">
        {companyProposals.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 md:p-12 text-center">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">받은 프로젝트 제안이 없습니다.</p>
          </div>
        ) : (
          companyProposals.map((proposal) => (
            <div
              key={proposal.id}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {proposal.counsel_title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    기업: {proposal.client_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(proposal.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                {getStatusBadge(proposal.status)}
              </div>
              <div className="flex gap-2">
                <Link href={`/enterprise/my-counsel/${proposal.counsel_id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    상세보기
                  </Button>
                </Link>
                {(!proposal.status || proposal.status === 'pending' || proposal.status === 'invited') && (
                  <>
                    <Button
                      onClick={() => handleAccept(proposal.id)}
                      className="flex-1"
                    >
                      수락
                    </Button>
                    <Button
                      onClick={() => handleDecline(proposal.id)}
                      variant="outline"
                      className="flex-1"
                    >
                      거절
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

