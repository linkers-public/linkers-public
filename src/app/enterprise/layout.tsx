import EnterpriseNavigator from '../../components/EnterpriseNavigator'

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
    <html lang="ko">
      <body>
        <EnterpriseNavigator />
        {children}
      </body>
    </html>
  );
}
