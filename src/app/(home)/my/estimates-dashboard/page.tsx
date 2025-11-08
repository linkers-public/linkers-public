import { Suspense } from 'react'
import EstimatesDashboardClient from './EstimatesDashboardClient'

export default function EstimatesDashboardPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">로딩 중...</div>}>
      <EstimatesDashboardClient />
    </Suspense>
  )
}

