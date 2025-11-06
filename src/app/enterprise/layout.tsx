import Header from '@/layout/Header'
import GlobalNavigator from '@/components/GlobalNavigator'

export const metadata = {
  title: 'Makers - 기업 서비스',
  description: 'AI와 프리랜서를 연결하는 초고속 서비스 제작 플랫폼',
};

export default function EnterpriseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <GlobalNavigator />
      <Header />
      <main className="flex w-full h-full min-h-[calc(100vh-96px)] pt-1">
        <div className="flex mx-auto w-full max-w-[1024px] px-4 md:px-6">{children}</div>
      </main>
    </>
  );
}
