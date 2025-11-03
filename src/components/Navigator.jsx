'use client'

import React, { useMemo } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const Navigator = () => {
  const pathname = usePathname()
  const routes = useMemo(() => {
    return [
      {
        icon: '',
        label: '메이커',
        isActive: pathname === '/search-makers',
        href: '/search-makers',
      },
      {
        icon: '',
        label: '상담서',
        isActive: pathname === '/search-projects',
        href: '/search-projects',
      },
    ]
  }, [pathname])

  return (
    <nav className="flex space-x-10">
      {routes.map((route) => (
        <div
          key={route.label}
          className="text-subtitle4 text-palette-coolNeutral-70 hover:text-palette-coolNeutral-20 transition-colors duration-200"
        >
          <Link href={route.href}>{route.label}</Link>
        </div>
      ))}
    </nav>
  )
}

export default Navigator
