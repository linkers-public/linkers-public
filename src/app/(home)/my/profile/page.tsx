import { ProfileClient } from '@/components/ProfileClient'

export default async function Page() {
  return (
    <ProfileClient
      isOwner={true}
      username={''}
    />
  )
}
