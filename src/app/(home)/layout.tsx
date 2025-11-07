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
  const isLandingPage = pathname === '/'
  
  return (
    <>
      {/* <AccountProvider /> */}
      <Header />
      <main className="flex w-full h-full min-h-[calc(100vh-64px)] pt-0 md:pt-1">
        <div className={`flex w-full ${
          isLandingPage 
            ? 'md:px-6 md:max-w-7xl md:mx-auto' // 랜딩 페이지는 모바일 패딩 없음, 웹에서는 헤더처럼 max-w-7xl 적용
            : `px-4 md:px-6 ${isMyPage ? 'md:max-w-7xl md:mx-auto' : 'max-w-7xl mx-auto'}`
        }`}>{children}</div>
      </main>
    </>
  )
}
