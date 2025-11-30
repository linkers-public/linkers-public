'use client'

import React, { useState } from 'react'
import { Mail, Copy, Check, ExternalLink } from 'lucide-react'

/**
 * 법률 상담 메일 작성 도우미 Props
 */
interface LegalEmailHelperProps {
  /** 받는 사람 이메일 주소 */
  toEmail?: string
  /** 받는 사람 이름/설명 (예: "노무사", "노동청") */
  recipientName?: string
  /** 기본 제목 */
  defaultSubject?: string
  /** 메일 본문 텍스트 */
  suggestionText: string
  /** 카드 제목 (선택적) */
  title?: string
  /** 추가 설명 (선택적) */
  description?: string
}

/**
 * 법률 상담 메일 작성 도우미 컴포넌트
 * Gmail로 바로 메일을 보낼 수 있는 카드 UI
 */
export function LegalEmailHelper({
  toEmail = '',
  recipientName = '상담 기관',
  defaultSubject = '[상담 요청] 근로 관련 문의',
  suggestionText,
  title = '이렇게 말해보세요',
  description,
}: LegalEmailHelperProps) {
  const [copied, setCopied] = useState(false)

  /**
   * Gmail 새 메일 작성 URL 생성
   */
  const handleSendMail = () => {
    if (!toEmail) {
      // 이메일이 없으면 mailto: 사용
      const mailtoUrl = `mailto:?subject=${encodeURIComponent(defaultSubject)}&body=${encodeURIComponent(suggestionText)}`
      window.open(mailtoUrl, '_blank', 'noopener,noreferrer')
      return
    }

    const to = encodeURIComponent(toEmail)
    const subject = encodeURIComponent(defaultSubject)
    const body = encodeURIComponent(suggestionText)

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`

    // Gmail 새 탭으로 열기
    window.open(gmailUrl, '_blank', 'noopener,noreferrer')
  }

  /**
   * 텍스트 복사
   */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(suggestionText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('복사 실패:', err)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* 헤더 */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <Mail className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-sm font-semibold text-purple-600">
              AI가 만들어준 메일 초안
            </p>
          </div>
          <h3 className="text-base font-bold text-gray-900 mt-1">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          )}
        </div>
        {toEmail && (
          <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5">
            <Mail className="w-3 h-3 text-gray-500" />
            <span className="text-xs font-medium text-gray-700">
              {recipientName}
            </span>
          </div>
        )}
      </div>

      {/* 예시 메일 본문 */}
      <div className="mt-3 rounded-xl bg-gray-50 border border-gray-100 p-4">
        <div className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">
          {suggestionText}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="mt-4 flex items-center justify-end gap-2">
        {/* 복사 버튼 */}
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-600" />
              <span className="text-green-600">복사됨</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>내용 복사하기</span>
            </>
          )}
        </button>

        {/* 메일 보내러가기 버튼 */}
        <button
          type="button"
          onClick={handleSendMail}
          className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>메일 보내러가기</span>
        </button>
      </div>

      {/* 안내 문구 */}
      <p className="mt-3 text-xs text-gray-400 text-center">
        {toEmail
          ? 'Gmail이 설치되어 있지 않으면 기본 메일 앱이 열립니다.'
          : '기본 메일 앱이 열립니다.'}
      </p>
    </div>
  )
}

