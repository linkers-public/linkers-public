import { createServerSideClientRSC } from '@/supabase/supabase-server'
import React from 'react'

const page = async () => {
  const supabase = await createServerSideClientRSC()
  const { data: user, error } = await supabase.auth.getUser()

  return (
    <div>
      <div>홈페이지</div>
      {user && <div>유저가 로그인했습니다: {user.user?.email}</div>}
      {error && <div>에러: {error.message}</div>}
    </div>
  )
}

export default page
