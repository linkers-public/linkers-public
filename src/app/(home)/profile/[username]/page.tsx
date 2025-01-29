import { ProfileClient } from '@/components/ProfileClient'
import React from 'react'

export default async function ProfilePage({
  params,
}: {
  params: { username: string }
}) {
  return (
    <ProfileClient
      username={params.username}
      isOwner={false}
    />
  )
}
