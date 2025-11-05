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
      <div className="flex-1 mt-4 md:mt-8 px-4 md:px-0">{children}</div>
    </section>
  )
}
