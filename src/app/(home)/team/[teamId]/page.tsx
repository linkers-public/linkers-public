import React, { Suspense } from 'react'
import TeamViewClient from './TeamViewClient'

interface PageProps {
  params: {
    teamId: string
  }
}

export default function Page({ params }: PageProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <TeamViewClient teamId={params.teamId} />
    </Suspense>
  )
}

