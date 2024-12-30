'use client'

import React from 'react'
import { useRouter } from 'next/navigation'

const Logo = () => {
  const router = useRouter()

  const onClickLogo = () => {
    router.push('/')
  }

  return (
    <div
      onClick={onClickLogo}
      className="text-subtitle1 hover:cursor-pointer"
    >
      MAKERS
    </div>
  )
}

export default Logo
