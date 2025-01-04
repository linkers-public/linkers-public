import ProfileDecider from '@/components/ProfileDecider'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <section className="flex flew-row w-full">
      <ProfileDecider />
      <div className="flex-1 mt-8">{children}</div>
    </section>
  )
}
