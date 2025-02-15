import { ProfileClient } from '@/components/ProfileClient'
import React from 'react'

export default async function ProfilePage({
  params,
}: {
  params: { username: string }
}) {
  const decodedUsername = decodeURIComponent(params.username)

  return (
    <ProfileClient
      username={decodedUsername}
      isOwner={false}
    />
  )
}
