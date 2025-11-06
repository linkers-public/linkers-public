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
      <div className="flex-1 mt-2 md:mt-4 px-2 md:px-0">{children}</div>
    </section>
  )
}
