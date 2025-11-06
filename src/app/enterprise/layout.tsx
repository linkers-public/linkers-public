import Header from '@/layout/Header'

export const metadata = {
  title: 'LINKUS - 기업 서비스',
  description: '프리랜서와 기업을 연결하는 초고속 서비스 제작 플랫폼. 비교 견적은 무료, 실제 컨택 시에만 비용이 발생합니다.',
};

export default function EnterpriseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex w-full h-full min-h-[calc(100vh-64px)] pt-1">
        <div className="flex mx-auto w-full max-w-[1024px] px-4 md:px-6">{children}</div>
      </main>
    </>
  );
}
