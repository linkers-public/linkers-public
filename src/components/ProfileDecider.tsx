'use client'

import { useAccountStore } from '@/stores/useAccoutStore'
import React from 'react'
import SideNavigator from './SideNavigator'

const ProfileDecider = () => {
  const account = useAccountStore((state) => state.account)
  if (account?.role === 'MAKER') {
    return <SideNavigator />
  } else if (account?.role === 'MANAGER') {
    return <SideNavigator />
  } else {
    return null
  }
}

export default ProfileDecider
