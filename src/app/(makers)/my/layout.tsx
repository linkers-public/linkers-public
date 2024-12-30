import SideNavigator from '@/components/SideNavigator'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <section className="flex flew-row w-full">
      <SideNavigator />
      <div className="flex-1 mt-8">{children}</div>
    </section>
  )
}
