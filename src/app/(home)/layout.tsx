import Header from '@/layout/Header'
import AccountProvider from '@/app/_providers/AccountProvider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      {/* <AccountProvider /> */}
      <Header />
      <main className="flex w-full h-full min-h-[calc(100vh-64px)] pt-1">
        <div className="flex w-full px-4 md:px-6 max-w-7xl mx-auto">{children}</div>
      </main>
    </>
  )
}
