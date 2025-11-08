'use client'

import { Suspense } from 'react'
import CompanyEstimatesClient from './CompanyEstimatesClient'

export default function CompanyEstimatesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">로딩 중...</div>}>
      <CompanyEstimatesClient />
    </Suspense>
  )
}

