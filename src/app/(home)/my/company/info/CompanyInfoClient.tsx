'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, User, Phone, Mail } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface CompanyInfo {
  company_name: string
  contact_person: string
  contact_phone: string
  contact_email: string
  address?: string
  website?: string
}

export default function CompanyInfoClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    company_name: '',
    contact_person: '',
    contact_phone: '',
    contact_email: '',
    address: '',
    website: '',
  })
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadCompanyInfo()
  }, [])

  const loadCompanyInfo = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // 활성 기업 프로필 확인
      const { data: profile } = await supabase
        .from('accounts')
        .select('profile_id, profile_type')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .eq('profile_type', 'COMPANY')
        .is('deleted_at', null)
        .maybeSingle()

      if (!profile) {
        toast({
          variant: 'destructive',
          title: '기업 프로필이 필요합니다',
          description: '기업 프로필을 생성해주세요.',
        })
        router.push('/my/profile/manage')
        return
      }

      // client 테이블에서 기업 정보 조회
      const { data: clientData, error: clientError } = await supabase
        .from('client')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle() as any

      if (clientError) {
        console.error('기업 정보 조회 실패:', clientError)
      }

      // accounts 테이블에서 추가 정보 조회
      const { data: accountData } = await supabase
        .from('accounts')
        .select('username, contact_phone, contact_website')
        .eq('profile_id', profile.profile_id)
        .maybeSingle() as any

      setCompanyInfo({
        company_name: clientData?.company_name || accountData?.username || '',
        contact_person: clientData?.contact_person || '',
        contact_phone: clientData?.contact_phone || accountData?.contact_phone || '',
        contact_email: user.email || '',
        address: clientData?.address || '',
        website: clientData?.website || accountData?.contact_website || '',
      })
    } catch (error: any) {
      console.error('기업 정보 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '기업 정보를 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSaving(true)

    try {
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
        .eq('profile_type', 'COMPANY')
        .is('deleted_at', null)
        .maybeSingle()

      if (!profile) {
        throw new Error('기업 프로필을 찾을 수 없습니다.')
      }

      // client 테이블 업데이트
      // 먼저 기존 레코드가 있는지 확인
      const { data: existingClient } = await supabase
        .from('client')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingClient) {
        // client 테이블 업데이트
        const clientUpdateData: any = {
          company_name: companyInfo.company_name,
          email: companyInfo.contact_email,
          contact_person: companyInfo.contact_person,
          contact_phone: companyInfo.contact_phone,
          address: companyInfo.address,
          website: companyInfo.website,
          updated_at: new Date().toISOString(),
        }

        const { error: clientError } = await supabase
          .from('client')
          .update(clientUpdateData)
          .eq('user_id', user.id)
        
        if (clientError) {
          console.error('client 테이블 업데이트 실패:', clientError)
          throw clientError
        }
      } else {
        // 새 레코드 삽입
        const insertData: any = {
          user_id: user.id,
          company_name: companyInfo.company_name,
          email: user.email || '',
          contact_person: companyInfo.contact_person,
          contact_phone: companyInfo.contact_phone,
          address: companyInfo.address,
          website: companyInfo.website,
        }

        const { error: insertError } = await supabase
          .from('client')
          .insert(insertData)
        
        if (insertError) {
          console.error('client 테이블 삽입 실패:', insertError)
          throw insertError
        }
      }

      // accounts 테이블 업데이트
      const { error: accountError } = await supabase
        .from('accounts')
        .update({
          username: companyInfo.company_name,
          contact_phone: companyInfo.contact_phone,
          contact_website: companyInfo.website,
          updated_at: new Date().toISOString(),
        })
        .eq('profile_id', profile.profile_id)

      if (accountError) throw accountError

      toast({
        title: '기업 정보 수정 완료',
        description: '기업 정보가 성공적으로 수정되었습니다.',
      })
    } catch (error: any) {
      console.error('기업 정보 수정 실패:', error)
      toast({
        variant: 'destructive',
        title: '기업 정보 수정 실패',
        description: error.message,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">기업 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-4 md:py-6 px-2 md:px-4">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">내 정보 / 회사 정보 수정</h1>
        <p className="text-gray-600">회사명·담당자·연락처 등을 수정하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
        <div className="space-y-6">
          <div>
            <Label htmlFor="company_name" className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4" />
              회사명
            </Label>
            <Input
              id="company_name"
              value={companyInfo.company_name}
              onChange={(e) => setCompanyInfo({ ...companyInfo, company_name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="contact_person" className="flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              담당자명
            </Label>
            <Input
              id="contact_person"
              value={companyInfo.contact_person}
              onChange={(e) => setCompanyInfo({ ...companyInfo, contact_person: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="contact_phone" className="flex items-center gap-2 mb-2">
              <Phone className="w-4 h-4" />
              연락처
            </Label>
            <Input
              id="contact_phone"
              type="tel"
              value={companyInfo.contact_phone}
              onChange={(e) => setCompanyInfo({ ...companyInfo, contact_phone: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="contact_email" className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4" />
              이메일
            </Label>
            <Input
              id="contact_email"
              type="email"
              value={companyInfo.contact_email}
              disabled
              className="bg-gray-50"
            />
            <p className="text-xs text-gray-500 mt-1">이메일은 로그인/보안 페이지에서 변경할 수 있습니다.</p>
          </div>

          <div>
            <Label htmlFor="address">주소</Label>
            <Input
              id="address"
              value={companyInfo.address || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, address: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="website">웹사이트</Label>
            <Input
              id="website"
              type="url"
              value={companyInfo.website || ''}
              onChange={(e) => setCompanyInfo({ ...companyInfo, website: e.target.value })}
              placeholder="https://example.com"
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <Button type="submit" disabled={saving} className="w-full md:w-auto">
            {saving ? '저장 중...' : '저장하기'}
          </Button>
        </div>
      </form>
    </div>
  )
}

