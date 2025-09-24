'use client'

import React from 'react'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          인증 오류가 발생했습니다
        </h1>
        <p className="text-gray-600 mb-6">
          로그인 과정에서 문제가 발생했습니다. 다시 시도해주세요.
        </p>
        <button
          onClick={() => window.location.href = '/auth'}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          로그인 페이지로 돌아가기
        </button>
      </div>
    </div>
  )
}
