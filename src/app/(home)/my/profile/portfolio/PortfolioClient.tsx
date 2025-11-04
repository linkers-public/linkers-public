'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, ExternalLink, Edit2, Trash2, ArrowLeft } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Portfolio {
  id: number
  title: string
  description: string | null
  link_url: string
  role: string | null
  achievements: string | null
  image_url: string | null
  created_at: string
}

export default function PortfolioClient() {
  const router = useRouter()
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    link_url: '',
    role: '',
    achievements: '',
    image_url: '',
  })

  useEffect(() => {
    loadPortfolios()
  }, [])

  const loadPortfolios = async () => {
    try {
      setLoading(true)
      const supabase = createSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // 활성 프로필 가져오기
      const { data: profile } = await supabase
        .from('accounts')
        .select('profile_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single()

      if (!profile) {
        toast({
          variant: 'destructive',
          title: '프로필을 찾을 수 없습니다',
          description: '먼저 프로필을 생성해주세요.',
        })
        router.push('/my/profile/create')
        return
      }

      // 포트폴리오 가져오기
      const { data, error } = await supabase
        .from('account_portfolios')
        .select('*')
        .eq('profile_id', profile.profile_id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPortfolios(data || [])
    } catch (error: any) {
      console.error('포트폴리오 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '포트폴리오를 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      if (!formData.title || !formData.link_url) {
        toast({
          variant: 'destructive',
          title: '필수 항목을 입력해주세요',
          description: '제목과 링크는 필수입니다.',
        })
        return
      }

      const supabase = createSupabaseBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // 활성 프로필 가져오기
      const { data: profile } = await supabase
        .from('accounts')
        .select('profile_id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .single()

      if (!profile) {
        throw new Error('프로필을 찾을 수 없습니다')
      }

      if (editingPortfolio) {
        // 업데이트
        const { error } = await supabase
          .from('account_portfolios')
          .update({
            title: formData.title,
            description: formData.description || null,
            link_url: formData.link_url,
            role: formData.role || null,
            achievements: formData.achievements || null,
            image_url: formData.image_url || null,
          })
          .eq('id', editingPortfolio.id)

        if (error) throw error
        toast({
          title: '포트폴리오가 수정되었습니다',
        })
      } else {
        // 생성
        const { error } = await supabase
          .from('account_portfolios')
          .insert({
            profile_id: profile.profile_id,
            title: formData.title,
            description: formData.description || null,
            link_url: formData.link_url,
            role: formData.role || null,
            achievements: formData.achievements || null,
            image_url: formData.image_url || null,
          })

        if (error) throw error
        toast({
          title: '포트폴리오가 추가되었습니다',
        })
      }

      setShowDialog(false)
      setEditingPortfolio(null)
      setFormData({
        title: '',
        description: '',
        link_url: '',
        role: '',
        achievements: '',
        image_url: '',
      })
      await loadPortfolios()
    } catch (error: any) {
      console.error('포트폴리오 저장 실패:', error)
      toast({
        variant: 'destructive',
        title: '포트폴리오 저장에 실패했습니다',
        description: error.message,
      })
    }
  }

  const handleEdit = (portfolio: Portfolio) => {
    setEditingPortfolio(portfolio)
    setFormData({
      title: portfolio.title,
      description: portfolio.description || '',
      link_url: portfolio.link_url,
      role: portfolio.role || '',
      achievements: portfolio.achievements || '',
      image_url: portfolio.image_url || '',
    })
    setShowDialog(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('포트폴리오를 삭제하시겠습니까?')) return

    try {
      const supabase = createSupabaseBrowserClient()
      const { error } = await supabase
        .from('account_portfolios')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error
      toast({
        title: '포트폴리오가 삭제되었습니다',
      })
      await loadPortfolios()
    } catch (error: any) {
      console.error('포트폴리오 삭제 실패:', error)
      toast({
        variant: 'destructive',
        title: '포트폴리오 삭제에 실패했습니다',
        description: error.message,
      })
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">포트폴리오를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            돌아가기
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">포트폴리오</h1>
        </div>
        <Button
          onClick={() => {
            setEditingPortfolio(null)
            setFormData({
              title: '',
              description: '',
              link_url: '',
              role: '',
              achievements: '',
              image_url: '',
            })
            setShowDialog(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          포트폴리오 추가
        </Button>
      </div>

      {portfolios.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-6xl mb-6">📁</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            포트폴리오가 없습니다
          </h2>
          <p className="text-gray-600 mb-6">
            프로젝트 경험을 보여주는 포트폴리오를 추가해보세요.
          </p>
          <Button
            onClick={() => setShowDialog(true)}
            className="flex items-center gap-2 mx-auto"
          >
            <Plus className="w-4 h-4" />
            첫 포트폴리오 추가하기
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              {portfolio.image_url && (
                <img
                  src={portfolio.image_url}
                  alt={portfolio.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {portfolio.title}
              </h3>
              {portfolio.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {portfolio.description}
                </p>
              )}
              {portfolio.role && (
                <p className="text-xs text-gray-500 mb-2">
                  <span className="font-medium">역할:</span> {portfolio.role}
                </p>
              )}
              {portfolio.achievements && (
                <p className="text-xs text-gray-500 mb-4">
                  <span className="font-medium">성과:</span> {portfolio.achievements}
                </p>
              )}
              <div className="flex items-center gap-2">
                <a
                  href={portfolio.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink className="w-4 h-4" />
                  링크 열기
                </a>
                <div className="ml-auto flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(portfolio)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(portfolio.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPortfolio ? '포트폴리오 수정' : '포트폴리오 추가'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제목 <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="프로젝트 제목"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                링크 URL <span className="text-red-500">*</span>
              </label>
              <Input
                value={formData.link_url}
                onChange={(e) =>
                  setFormData({ ...formData, link_url: e.target.value })
                }
                placeholder="https://example.com"
                type="url"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                설명
              </label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="프로젝트 설명을 입력하세요"
                rows={4}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                역할
              </label>
              <Input
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                placeholder="프로젝트에서의 역할 (예: 프론트엔드 개발자)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                성과
              </label>
              <Textarea
                value={formData.achievements}
                onChange={(e) =>
                  setFormData({ ...formData, achievements: e.target.value })
                }
                placeholder="프로젝트 성과 및 기여도"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이미지 URL
              </label>
              <Input
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
                type="url"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                취소
              </Button>
              <Button onClick={handleSubmit}>
                {editingPortfolio ? '수정' : '추가'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

