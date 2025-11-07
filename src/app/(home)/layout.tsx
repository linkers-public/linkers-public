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
      <main className={`flex w-full h-full min-h-[calc(100vh-64px)] ${
        isLandingPage ? 'pt-0' : 'pt-0 md:pt-1' // 랜딩 페이지는 헤더와 탭 사이 여백 없음
      }`}>
        <div className={`flex w-full px-0 md:px-6 ${
          isMyPage 
            ? 'md:max-w-[90%] md:mx-auto' // 마이페이지는 웹에서만 비율 제한
            : 'md:max-w-[90%] md:mx-auto' // 나머지 페이지도 웹에서만 비율 제한
        }`}>{children}</div>
      </main>
    </>
  )
}
