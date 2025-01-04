import Header from '@/layout/Header'
import GlobalNavigator from '@/components/GlobalNavigator'
import AccountProvider from '@/app/_providers/AccountProvider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <AccountProvider />
      <GlobalNavigator />
      <Header />
      <main className="flex w-full h-full min-h-[calc(100vh-96px)] pt-1">
        <div className="flex mx-auto w-full max-w-[1024px] ">{children}</div>
      </main>
    </>
  )
}
