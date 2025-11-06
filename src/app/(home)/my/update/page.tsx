import { Suspense } from 'react'
import ProfileUpdateClient from './ProfileUpdateClient'

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <ProfileUpdateClient />
    </Suspense>
  )
}

