import { Suspense } from 'react'
import ClientEstimateDetailPage from './estimate-detail.client'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientEstimateDetailPage />
    </Suspense>
  )
}
