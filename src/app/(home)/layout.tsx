'use client'

import Header from '@/layout/Header'
import AccountProvider from '@/app/_providers/AccountProvider'
import { usePathname } from 'next/navigation'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const pathname = usePathname()
  const isMyPage = pathname?.startsWith('/my')
  
  return (
    <>
      {/* <AccountProvider /> */}
      <Header />
      <main className={`flex w-full h-full min-h-[calc(100vh-64px)] ${isMyPage ? 'pt-0' : 'pt-1'}`}>
        <div className={`flex w-full ${isMyPage ? 'px-0 md:px-6' : 'px-4 md:px-6'} ${isMyPage ? 'md:max-w-7xl md:mx-auto' : 'max-w-7xl mx-auto'}`}>{children}</div>
      </main>
    </>
  )
}
