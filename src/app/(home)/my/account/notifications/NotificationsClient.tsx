'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Bell, Mail, Smartphone, MessageSquare } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface NotificationSettings {
  email_enabled: boolean
  web_push_enabled: boolean
  kakao_enabled: boolean
}

export default function NotificationsClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    email_enabled: true,
    web_push_enabled: true,
    kakao_enabled: false,
  })
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadNotificationSettings()
  }, [])

  const loadNotificationSettings = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // user_settings 테이블에서 알림 설정 조회
      const { data: settingsData, error } = await supabase
        .from('user_settings' as any)
        .select('email_enabled, web_push_enabled, kakao_enabled')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error('알림 설정 조회 실패:', error)
        throw error
      }

      // 설정이 있으면 사용, 없으면 기본값 사용
      if (settingsData) {
        setSettings({
          email_enabled: settingsData.email_enabled ?? true,
          web_push_enabled: settingsData.web_push_enabled ?? true,
          kakao_enabled: settingsData.kakao_enabled ?? false,
        })
      } else {
        // 기본값 사용
        setSettings({
          email_enabled: true,
          web_push_enabled: true,
          kakao_enabled: false,
        })
      }
    } catch (error: any) {
      console.error('알림 설정 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '알림 설정을 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // user_settings 테이블에 알림 설정 저장 (upsert)
      const { error } = await supabase
        .from('user_settings' as any)
        .upsert({
          user_id: user.id,
          email_enabled: settings.email_enabled,
          web_push_enabled: settings.web_push_enabled,
          kakao_enabled: settings.kakao_enabled,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      toast({
        title: '알림 설정 저장 완료',
        description: '알림 설정이 성공적으로 저장되었습니다.',
      })
    } catch (error: any) {
      console.error('알림 설정 저장 실패:', error)
      toast({
        variant: 'destructive',
        title: '알림 설정 저장 실패',
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
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full md:py-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">알림 설정</h1>
        <p className="text-gray-600">이메일/웹푸시/카카오톡 알림을 설정하세요</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6">
        <div className="space-y-6">
          {/* 이메일 알림 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <Label htmlFor="email" className="text-base font-medium">
                  이메일 알림
                </Label>
                <p className="text-sm text-gray-500">이메일로 알림을 받습니다</p>
              </div>
            </div>
            <Switch
              id="email"
              checked={settings.email_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, email_enabled: checked })
              }
            />
          </div>

          {/* 웹 푸시 알림 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-gray-600" />
              <div>
                <Label htmlFor="webPush" className="text-base font-medium">
                  웹 푸시 알림
                </Label>
                <p className="text-sm text-gray-500">브라우저 푸시 알림을 받습니다</p>
              </div>
            </div>
            <Switch
              id="webPush"
              checked={settings.web_push_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, web_push_enabled: checked })
              }
            />
          </div>

          {/* 카카오톡 알림 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <div>
                <Label htmlFor="kakao" className="text-base font-medium">
                  카카오톡 알림
                </Label>
                <p className="text-sm text-gray-500">카카오톡으로 알림을 받습니다</p>
              </div>
            </div>
            <Switch
              id="kakao"
              checked={settings.kakao_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, kakao_enabled: checked })
              }
            />
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <Button onClick={handleSave} disabled={saving} className="w-full md:w-auto">
            {saving ? '저장 중...' : '설정 저장'}
          </Button>
        </div>
      </div>
    </div>
  )
}

