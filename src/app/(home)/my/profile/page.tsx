import { fetchUserProfile } from '@/apis/user.server'
import ProfileClient from './ProfileClient'

export default async function Page() {
  const profile = await fetchUserProfile()
  return <ProfileClient profile={profile} />
}
