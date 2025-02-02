import { createServerSideClientRSC } from '@/supabase/supabase-server'
import React from 'react'
import EnterpriseSidebar, {} from '../../components/EnterpriseSideBar'

const page = async () => {
  const supabase = await createServerSideClientRSC()
  const { data: user, error } = await supabase.auth.getUser()

  return (
    <div className="flex">
      <EnterpriseSidebar/>
      <div>홈페이지</div>
      {user && <div>유저가 로그인했습니다: {user.user?.email}</div>}
      {error && <div>에러: {error.message}</div>}
    </div>
  )
}

export default page
