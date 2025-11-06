/**
 * 포트원 V2 Webhook 처리
 * 정기 결제 결과 수신 및 다음 달 결제 예약
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSideClient } from '@/supabase/supabase-server'
import {
  getPayment,
  scheduleMonthlyPayment,
  getNextBillingDateISO,
} from '@/apis/subscription-v2.service'
import { verifyWebhook } from '@/apis/subscription-v2.service'

export async function POST(request: NextRequest) {
  try {
    // Webhook 검증
    const webhookSecret = process.env.PORTONE_V2_WEBHOOK_SECRET || ''
    
    if (!webhookSecret) {
      console.error('PORTONE_V2_WEBHOOK_SECRET이 설정되지 않았습니다')
      return NextResponse.json({ error: 'Webhook Secret이 설정되지 않았습니다' }, { status: 500 })
    }

    const rawBody = await request.text()
    const headers = Object.fromEntries(request.headers.entries())

    console.log('웹훅 수신:', {
      method: request.method,
      url: request.url,
      headers: {
        'content-type': headers['content-type'],
        'webhook-id': headers['webhook-id'],
        'webhook-signature': headers['webhook-signature'] ? '***' : undefined,
      },
      bodyLength: rawBody.length,
    })

    let webhook
    try {
      webhook = await verifyWebhook(webhookSecret, rawBody, headers)
      console.log('웹훅 검증 성공:', {
        type: webhook.type,
        dataKeys: (webhook as any).data ? Object.keys((webhook as any).data) : [],
      })
    } catch (error: any) {
      console.error('Webhook 검증 실패:', {
        error: error.message,
        errorType: error.constructor.name,
        headers: {
          'webhook-id': headers['webhook-id'],
          'webhook-signature': headers['webhook-signature'] ? '***' : undefined,
        },
      })
      return NextResponse.json({ error: 'Webhook 검증 실패' }, { status: 401 })
    }

    // Transaction.Paid 이벤트 처리
    if (webhook.type === 'Transaction.Paid' && 'paymentId' in webhook.data) {
      const { paymentId } = webhook.data

      console.log('Transaction.Paid 이벤트 처리 시작:', { paymentId })

      // 결제 정보 조회
      const paymentInfo = await getPayment(paymentId)

      console.log('결제 정보 조회 완료:', {
        paymentId,
        status: paymentInfo.status,
        amount: (paymentInfo as any).amount?.total,
      })

      if (paymentInfo.status !== 'PAID') {
        console.warn('결제 상태가 PAID가 아닙니다:', {
          paymentId,
          status: paymentInfo.status,
          paymentInfo,
        })
        return NextResponse.json({ success: false, message: '결제 실패' }, { status: 200 })
      }

      const supabase = await createServerSideClient()

      // 구독 정보 조회 (paymentId로 찾기)
      const { data: subscription } = await supabase
        .from('subscriptions' as any)
        .select('*')
        .eq('portone_merchant_uid', paymentId)
        .single()

      if (!subscription) {
        console.error('구독 정보를 찾을 수 없습니다:', {
          paymentId,
          searchField: 'portone_merchant_uid',
        })
        return NextResponse.json({ error: '구독 정보를 찾을 수 없습니다' }, { status: 200 })
      }

      console.log('구독 정보 조회 완료:', {
        subscriptionId: subscription.id,
        userId: subscription.user_id,
        status: subscription.status,
        isFirstMonthFree: subscription.is_first_month_free,
        firstMonthUsed: subscription.first_month_used,
      })

      // 첫 달 무료 여부 확인
      const isFirstMonth = subscription.is_first_month_free && !subscription.first_month_used

      // 결제 내역 저장
      const { error: paymentError } = await supabase.from('payments' as any).insert({
        user_id: subscription.user_id,
        subscription_id: subscription.id,
        amount: (paymentInfo as any).amount?.total || 0,
        currency: 'KRW',
        payment_method: 'card',
        payment_status: 'completed',
        pg_provider: 'portone',
        pg_transaction_id: paymentId,
        portone_imp_uid: paymentId,
        portone_merchant_uid: paymentId,
        is_first_month: isFirstMonth,
        paid_at: (paymentInfo as any)?.paidAt || new Date().toISOString(),
      })

      if (paymentError) {
        console.error('결제 내역 저장 실패:', {
          error: paymentError,
          paymentId,
          subscriptionId: subscription.id,
        })
      } else {
        console.log('결제 내역 저장 완료:', {
          paymentId,
          amount: (paymentInfo as any).amount?.total || 0,
          isFirstMonth,
        })
      }

      // 첫 달 무료 처리
      if (isFirstMonth) {
        const { error: updateError } = await supabase
          .from('subscriptions' as any)
          .update({
            first_month_used: true,
          })
          .eq('id', subscription.id)

        if (updateError) {
          console.error('구독 정보 업데이트 실패:', updateError)
        }
      }

      // 사용자 정보 조회
      const { data: userData } = await supabase.auth.admin.getUserById(subscription.user_id)
      const { data: accountData } = await supabase
        .from('accounts')
        .select('username, contact_phone, contact_email')
        .eq('user_id', subscription.user_id)
        .single() as any

      // 다음 달 결제 예약 (현재 결제일 기준으로 다음 달)
      const currentDate = new Date()
      const nextBillingDate = new Date(currentDate)
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)

      const nextPaymentId = `linkers_sub_${subscription.user_id}_${Date.now()}`
      const scheduledAt = getNextBillingDateISO(nextBillingDate, false)

      // 전화번호 설정 (필수 필드)
      const phoneNumber = accountData?.contact_phone || '010-0000-0000'

      try {
        await scheduleMonthlyPayment(
          subscription.customer_uid!,
          nextPaymentId,
          scheduledAt,
          2000,
          '링커스 월 구독료',
          {
            name: accountData?.username || userData?.user?.email?.split('@')[0] || '사용자',
            email: userData?.user?.email || accountData?.contact_email || '',
            phoneNumber: phoneNumber,
          }
        )

        // 구독 정보 업데이트
        await supabase
          .from('subscriptions' as any)
          .update({
            next_billing_date: nextBillingDate.toISOString(),
            portone_merchant_uid: nextPaymentId,
          })
          .eq('id', subscription.id)
      } catch (scheduleError: any) {
        console.error('다음 달 결제 예약 실패:', {
          error: scheduleError.message,
          errorType: scheduleError.data?.type,
          subscriptionId: subscription.id,
          nextPaymentId,
        })
        // 예약 실패해도 현재 결제는 완료되었으므로 계속 진행
      }
    } else {
      // 다른 이벤트 타입은 로그만 남기고 성공 응답
      console.log('처리하지 않는 웹훅 이벤트:', {
        type: webhook.type,
        data: (webhook as any).data,
      })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error: any) {
    console.error('Webhook 처리 오류:', error)
    return NextResponse.json(
      { error: 'Webhook 처리 실패' },
      { status: 500 }
    )
  }
}

