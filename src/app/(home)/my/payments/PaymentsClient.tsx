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
  payment_id?: string
  portone_imp_uid?: string
  portone_merchant_uid?: string
  is_first_month?: boolean
  currency?: string
  payment_method?: string
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

      // payments 테이블에서 결제 내역 조회
      const { data: paymentsData, error } = await supabase
        .from('payments' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('결제 내역 조회 실패:', error)
        throw error
      }

      // 데이터 변환
      const formattedPayments: Payment[] = (paymentsData || []).map((payment: any) => ({
        id: payment.id,
        amount: payment.amount,
        date: payment.paid_at || payment.created_at,
        status: payment.payment_status === 'completed' ? 'completed' :
                payment.payment_status === 'pending' ? 'pending' : 'failed',
        payment_id: payment.portone_imp_uid || payment.portone_merchant_uid,
        portone_imp_uid: payment.portone_imp_uid,
        portone_merchant_uid: payment.portone_merchant_uid,
        is_first_month: payment.is_first_month || false,
        currency: payment.currency || 'KRW',
        payment_method: payment.payment_method || 'card',
      }))

      setPayments(formattedPayments)
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

  const handleDownloadReceipt = async (payment: Payment) => {
    try {
      if (!payment.payment_id) {
        toast({
          variant: 'destructive',
          title: '영수증 정보 없음',
          description: '결제 ID를 찾을 수 없습니다.',
        })
        return
      }

      // API를 통해 영수증 정보 조회
      const response = await fetch(`/api/payments/receipt?paymentId=${payment.payment_id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '영수증 조회에 실패했습니다')
      }

      // PortOne 관리자 콘솔에서 영수증 확인
      // 또는 영수증 정보를 표시할 수 있음
      if (data.payment?.receiptUrl) {
        window.open(data.payment.receiptUrl, '_blank')
        toast({
          title: '영수증 열기',
          description: 'PortOne 관리자 콘솔에서 영수증을 확인할 수 있습니다.',
        })
      } else {
        // 영수증 정보를 모달이나 새 페이지에 표시할 수 있음
        toast({
          title: '영수증 정보',
          description: `결제 금액: ${data.payment?.amount?.toLocaleString()}원, 상태: ${data.payment?.status}`,
        })
      }
    } catch (error: any) {
      console.error('영수증 조회 실패:', error)
      toast({
        variant: 'destructive',
        title: '영수증 조회 실패',
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
          <div className="bg-white rounded-lg shadow-sm border p-4 md:p-12 text-center">
            <Receipt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">결제 내역이 없습니다.</p>
          </div>
        ) : (
          payments.map((payment) => (
            <div
              key={payment.id}
              className="bg-white rounded-lg shadow-sm border p-4 md:p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {payment.amount.toLocaleString()}원
                    </h3>
                    {payment.is_first_month && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                        첫 달 무료
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    {new Date(payment.date).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                      payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {payment.status === 'completed' ? '완료' :
                       payment.status === 'pending' ? '대기중' : '실패'}
                    </span>
                    {payment.payment_method && (
                      <span className="text-xs text-gray-500">
                        {payment.payment_method === 'card' ? '카드' : payment.payment_method}
                      </span>
                    )}
                  </div>
                  {payment.portone_merchant_uid && (
                    <p className="text-xs text-gray-400 mt-1">
                      주문번호: {payment.portone_merchant_uid}
                    </p>
                  )}
                </div>
                {payment.status === 'completed' && payment.payment_id && (
                  <Button
                    onClick={() => handleDownloadReceipt(payment)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    영수증 확인
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

