'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import { Button } from '@/components/ui/button'
import { Receipt, Download } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

interface Payment {
  id: string
  amount: number
  date: string
  status: 'completed' | 'pending' | 'failed'
  receipt_url?: string
}

export default function PaymentsClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])
  const supabase = createSupabaseBrowserClient()

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth')
        return
      }

      // TODO: 결제 내역 조회 (payments 테이블 또는 PG 연동)
      // 현재는 임시로 빈 배열
      setPayments([])
      
      toast({
        title: '준비 중',
        description: '결제 내역 조회 기능은 곧 제공될 예정입니다.',
      })
    } catch (error: any) {
      console.error('결제 내역 로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '결제 내역을 불러오는데 실패했습니다',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReceipt = async (paymentId: string) => {
    try {
      // TODO: 영수증 다운로드 로직 구현
      toast({
        title: '준비 중',
        description: '영수증 다운로드 기능은 곧 제공될 예정입니다.',
      })
    } catch (error: any) {
      console.error('영수증 다운로드 실패:', error)
      toast({
        variant: 'destructive',
        title: '영수증 다운로드 실패',
        description: error.message,
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">결제 내역을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full py-4 md:py-6 px-2 md:px-4">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">결제 내역 / 영수증</h1>
        <p className="text-gray-600">PG 영수증을 다운로드하세요</p>
      </div>

      <div className="space-y-4">
        {payments.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-6 md:p-12 text-center">
            <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">결제 내역이 없습니다.</p>
          </div>
        ) : (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white rounded-lg shadow-sm border p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {payment.amount.toLocaleString()}원
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(payment.date).toLocaleDateString('ko-KR')}
                  </p>
                  <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-medium ${
                    payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                    payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {payment.status === 'completed' ? '완료' :
                     payment.status === 'pending' ? '대기중' : '실패'}
                  </span>
                </div>
                {payment.receipt_url && (
                  <Button
                    onClick={() => handleDownloadReceipt(payment.id)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    영수증 다운로드
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

