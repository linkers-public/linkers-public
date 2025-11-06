import SideNavigator from '@/components/SideNavigator'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <section className="flex flex-col md:flex-row w-full">
      <div className="flex h-full">
        <nav className="hidden md:flex flex-col w-[200px] gap-4 mx-5 my-10">
          <SideNavigator />
        </nav>
      </div>
      <div className="flex-1 md:mt-4 md:px-0 w-full">{children}</div>
    </section>
  )
}
