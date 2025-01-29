'use client'

import React, { useState } from 'react'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'
import useHydration from '@/hooks/use-hydrate'

const AuthUI = ({ role }: { role: string }) => {
  const isMounted = useHydration()
  const [user, setUser] = useState()
  const supabaseClient = createSupabaseBrowserClient()

  if (!isMounted) return null

  const getUserInfo = async () => {
    const result = await supabaseClient.auth.getUser()
    // @ts-ignore
    if (result?.data?.user) setUser(result?.data?.user)
  }

  const handleLogout = async () => {
    await supabaseClient.auth.signOut()
    window.location.reload()
  }

  const handleGoogleLogin = async () => {
    await supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_AUTH_REDIRECT_TO}&role=${role}`,
        queryParams: { role },
      },
    })
  }

  return (
    <section className="w-full">
      <div className="flex justify-center items-center mx-auto max-w-[640px]">
        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center w-[480px] h-[48px] rounded-[12px] shadow-normal p-4"
        >
          구글로 시작하기
        </button>
      </div>
    </section>
  )
}

export default AuthUI
