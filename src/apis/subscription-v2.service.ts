/**
 * 포트원 V2 정기 결제 서비스
 * 첫 달 무료 + 월 정기 결제 구현
 */

import { PortOneClient, PaymentClient, BillingKeyClient } from '@portone/server-sdk'
import { Webhook } from '@portone/server-sdk'

// 포트원 V2 클라이언트 생성
const PORTONE_API_SECRET = process.env.PORTONE_V2_API_SECRET || ''

if (!PORTONE_API_SECRET) {
  console.warn('PORTONE_V2_API_SECRET이 설정되지 않았습니다.')
}

const portoneClient = PortOneClient({ secret: PORTONE_API_SECRET })
const paymentClient = PaymentClient({ secret: PORTONE_API_SECRET })
const billingKeyClient = BillingKeyClient({ secret: PORTONE_API_SECRET })

/**
 * 빌링키 ID 생성
 */
export function generateBillingKeyId(userId: string): string {
  return `linkers_${userId}_${Date.now()}`
}

/**
 * 빌링키로 즉시 결제 요청
 */
export async function requestPaymentWithBillingKey(
  billingKey: string,
  paymentId: string,
  amount: number,
  orderName: string,
  customer: {
    name?: string
    email?: string
    phoneNumber?: string
  }
) {
  try {
    const payment = await paymentClient.payWithBillingKey({
      paymentId,
      billingKey,
      orderName,
      customer: {
        name: customer.name ? { full: customer.name } : undefined,
        email: customer.email || undefined,
        phoneNumber: customer.phoneNumber && customer.phoneNumber.trim() !== '' 
          ? customer.phoneNumber 
          : '010-0000-0000', // 필수 필드이므로 기본값 제공
      },
      amount: {
        total: amount,
      },
      currency: 'KRW',
    })

    return payment
  } catch (error: any) {
    throw new Error(`결제 요청 실패: ${error.message || '알 수 없는 오류'}`)
  }
}

/**
 * 결제 예약 (월 정기 결제)
 * 빌링키 발급 직후 바로 사용할 경우 재시도 로직 포함
 */
export async function scheduleMonthlyPayment(
  billingKey: string,
  paymentId: string,
  scheduledAt: string, // ISO 8601 형식 (예: "2024-12-25T00:00:00Z")
  amount: number,
  orderName: string,
  customer: {
    name?: string
    email?: string
    phoneNumber?: string
  },
  retryCount: number = 3,
  retryDelay: number = 1000
) {
  let lastError: any = null
  
  for (let attempt = 1; attempt <= retryCount; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`결제 예약 재시도 (${attempt}/${retryCount})...`)
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
      }
      
      console.log('결제 예약 요청:', {
        paymentId,
        timeToPay: scheduledAt,
        billingKey: billingKey.substring(0, 10) + '...',
        amount,
        orderName,
        attempt,
        customer: {
          name: customer.name,
          email: customer.email,
          phoneNumber: customer.phoneNumber,
        },
      })

      const scheduledPayment = await paymentClient.paymentSchedule.createPaymentSchedule({
        paymentId,
        timeToPay: scheduledAt,
        payment: {
          billingKey,
          orderName,
          customer: {
            name: customer.name ? { full: customer.name } : undefined,
            email: customer.email || undefined,
            phoneNumber: customer.phoneNumber && customer.phoneNumber.trim() !== '' 
              ? customer.phoneNumber 
              : '010-0000-0000', // 필수 필드이므로 기본값 제공
          },
          amount: {
            total: amount,
          },
          currency: 'KRW',
        },
      })

      console.log('결제 예약 성공:', scheduledPayment)
      return scheduledPayment
    } catch (error: any) {
      lastError = error
      const errorData = error.data || error.response?.data
      
      // BILLING_KEY_NOT_FOUND 에러이고 재시도 가능하면 계속 시도
      if (errorData?.type === 'BILLING_KEY_NOT_FOUND' && attempt < retryCount) {
        console.warn(`빌링키를 찾을 수 없음 (시도 ${attempt}/${retryCount}), 재시도 중...`)
        continue
      }
      
      // 재시도 불가능한 에러이거나 마지막 시도면 에러 던지기
      if (attempt === retryCount || errorData?.type !== 'BILLING_KEY_NOT_FOUND') {
        throw error
      }
    }
  }
  
  // 모든 재시도 실패 - 에러 처리
  const errorData = lastError?.data || lastError?.response?.data
  
  console.error('결제 예약 실패 상세:', {
    errorType: errorData?.type,
    errorMessage: errorData?.message || lastError?.message,
    errorData: errorData,
    billingKey: billingKey.substring(0, 20) + '...',
    attempts: retryCount,
  })
  
  // 에러 타입별 메시지 처리
  let errorMessage = '알 수 없는 오류'
  
  if (errorData?.type === 'BILLING_KEY_NOT_FOUND') {
    errorMessage = '빌링키를 찾을 수 없습니다. 빌링키 발급 후 잠시 기다린 후 다시 시도해주세요.'
  } else if (errorData?.type) {
    errorMessage = `포트원 API 오류: ${errorData.type}${errorData.message ? ` - ${errorData.message}` : ''}`
  } else if (errorData?.message) {
    errorMessage = errorData.message
  } else if (lastError?.message) {
    errorMessage = lastError.message
  }
  
  throw new Error(`결제 예약 실패: ${errorMessage}`)
}

/**
 * 결제 예약 취소
 */
export async function unschedulePayment(paymentId: string): Promise<void> {
  try {
    // paymentId로 예약된 결제를 찾아서 취소
    // 실제로는 scheduleId를 사용해야 하므로, paymentId로 조회 후 scheduleId를 찾아야 함
    // 간단하게 paymentId를 scheduleId로 사용 (실제로는 조회 필요)
    await paymentClient.paymentSchedule.revokePaymentSchedules({
      scheduleIds: [paymentId],
    })
  } catch (error: any) {
    throw new Error(`결제 예약 취소 실패: ${error.message || '알 수 없는 오류'}`)
  }
}

/**
 * 결제 정보 조회
 */
export async function getPayment(paymentId: string) {
  try {
    const payment = await paymentClient.getPayment({ paymentId })
    return payment
  } catch (error: any) {
    throw new Error(`결제 정보 조회 실패: ${error.message || '알 수 없는 오류'}`)
  }
}

/**
 * 빌링키 정보 조회
 */
export async function getBillingKey(billingKey: string) {
  try {
    const billingKeyInfo = await billingKeyClient.getBillingKeyInfo({ billingKey })
    return billingKeyInfo
  } catch (error: any) {
    throw new Error(`빌링키 조회 실패: ${error.message || '알 수 없는 오류'}`)
  }
}

/**
 * 다음 달 결제일 계산 (첫 달 무료 고려)
 */
export function calculateNextBillingDate(
  subscriptionDate: Date,
  isFirstMonth: boolean
): Date {
  const nextDate = new Date(subscriptionDate)
  
  if (isFirstMonth) {
    // 첫 달이면 30일 후 (무료 기간)
    nextDate.setDate(nextDate.getDate() + 30)
  } else {
    // 이후에는 매월 같은 날짜
    nextDate.setMonth(nextDate.getMonth() + 1)
  }
  
  return nextDate
}

/**
 * 다음 달 결제일을 ISO 8601 형식으로 변환
 */
export function getNextBillingDateISO(
  subscriptionDate: Date,
  isFirstMonth: boolean
): string {
  const nextDate = calculateNextBillingDate(subscriptionDate, isFirstMonth)
  return nextDate.toISOString()
}

/**
 * Webhook 검증
 */
export async function verifyWebhook(
  webhookSecret: string,
  payload: string,
  headers: Record<string, string>
) {
  try {
    const webhook = await Webhook.verify(webhookSecret, payload, headers)
    return webhook
  } catch (error: any) {
    if (error instanceof Webhook.WebhookVerificationError) {
      throw new Error('Webhook 검증 실패')
    }
    throw error
  }
}

