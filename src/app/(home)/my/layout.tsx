import ProfileDecider from '@/components/ProfileDecider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <section className="flex w-full">
      <div className="flex h-full">
        <nav className="flex flex-col w-[200px] gap-4 mx-5 my-10">
          <ProfileDecider />
        </nav>
      </div>
      <div className="flex-1 mt-8">{children}</div>
    </section>
  )
}
