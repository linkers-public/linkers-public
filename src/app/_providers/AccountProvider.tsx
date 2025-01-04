'use client'

import { useEffect } from 'react'

import { useAccountStore } from '@/stores/useAccoutStore'
import { createSupabaseBrowserClient } from '@/supabase/supabase-client'

export default function AccountProvider() {
  const setAccount = useAccountStore((state) => state.setAccount)
  useEffect(() => {
    const fetchAccount = async () => {
      const supabase = createSupabaseBrowserClient()
      const { data: account } = await supabase
        .from('accounts')
        .select('*')
        .single()

      setAccount(account)
    }

    fetchAccount()
  }, [])

  return null
}
