-- 기업 프로젝트 목 데이터 생성
-- counsel 테이블에 테스트용 프로젝트 데이터 삽입

-- 기존 client user_id와 company_profile_id 사용
-- client user_id: '20b6c4f0-1933-4ea3-b534-1f050184c572', 'baa0fd5e-4add-44f2-b1df-1ec59a838b7e'
-- company profile_id: 'f5193be0-6586-4aed-ba5d-d2bfd3df4c8f', 'b6d802de-a39a-4b5c-806f-607ac09f44dd', '619453d2-1d1a-41c6-abeb-d4fe00c90f59'

INSERT INTO counsel (
  client_id,
  company_profile_id,
  title,
  outline,
  feild,
  cost,
  period,
  counsel_status,
  start_date,
  due_date,
  expected_cost,
  expected_period,
  skill,
  output,
  contact_phone,
  contact_email
) VALUES
-- 1. 웹 개발 프로젝트
(
  '20b6c4f0-1933-4ea3-b534-1f050184c572',
  'f5193be0-6586-4aed-ba5d-d2bfd3df4c8f',
  '전자상거래 플랫폼 구축 프로젝트',
  '온라인 쇼핑몰 플랫폼을 구축하고자 합니다. 상품 관리, 주문 처리, 결제 시스템, 고객 관리 기능이 필요합니다. 반응형 웹 디자인으로 모바일과 데스크톱 모두 지원해야 합니다.',
  '웹 개발',
  '1000만원 ~ 5000만원',
  '3개월 ~ 6개월',
  'recruiting',
  CURRENT_DATE + INTERVAL '7 days',
  CURRENT_DATE + INTERVAL '37 days',
  3000,
  4,
  ARRAY['java', 'db']::skill[],
  '완전한 전자상거래 웹사이트, 관리자 대시보드, API 문서',
  '02-1234-5678',
  'project1@company.com'
),

-- 2. 앱 개발 프로젝트
(
  'baa0fd5e-4add-44f2-b1df-1ec59a838b7e',
  'b6d802de-a39a-4b5c-806f-607ac09f44dd',
  '모바일 헬스케어 앱 개발',
  '건강 관리 및 운동 추적을 위한 iOS/Android 네이티브 앱을 개발하고자 합니다. 사용자 인증, 운동 데이터 기록, 통계 대시보드, 푸시 알림 기능이 필요합니다.',
  '앱 개발',
  '5000만원 ~ 1억원',
  '6개월 ~ 1년',
  'pending',
  CURRENT_DATE + INTERVAL '14 days',
  CURRENT_DATE + INTERVAL '44 days',
  8000,
  8,
  ARRAY['ios', 'java']::skill[],
  'iOS 앱, Android 앱, 백엔드 API, 관리자 웹 대시보드',
  '02-2345-6789',
  'project2@company.com'
),

-- 3. 인공지능 프로젝트
(
  '20b6c4f0-1933-4ea3-b534-1f050184c572',
  'f5193be0-6586-4aed-ba5d-d2bfd3df4c8f',
  '고객 서비스 챗봇 AI 시스템',
  '고객 문의를 자동으로 처리하는 AI 챗봇을 개발하고자 합니다. 자연어 처리, 의도 분류, 자동 응답 생성 기능이 필요합니다. 기존 고객 데이터를 학습에 활용할 수 있습니다.',
  '인공지능',
  '1000만원 ~ 5000만원',
  '3개월 ~ 6개월',
  'recruiting',
  CURRENT_DATE + INTERVAL '3 days',
  CURRENT_DATE + INTERVAL '33 days',
  4500,
  5,
  ARRAY['llm', 'java']::skill[],
  'AI 챗봇 시스템, 학습 모델, API 서버, 통합 문서',
  '02-3456-7890',
  'project3@company.com'
),

-- 4. 서버 개발 프로젝트
(
  'baa0fd5e-4add-44f2-b1df-1ec59a838b7e',
  '619453d2-1d1a-41c6-abeb-d4fe00c90f59',
  '마이크로서비스 아키텍처 구축',
  '기존 모놀리식 시스템을 마이크로서비스 아키텍처로 전환하고자 합니다. API 게이트웨이, 서비스 디스커버리, 로드 밸런싱, 모니터링 시스템 구축이 필요합니다.',
  '서버 개발',
  '5000만원 ~ 1억원',
  '6개월 ~ 1년',
  'pending',
  CURRENT_DATE + INTERVAL '10 days',
  CURRENT_DATE + INTERVAL '40 days',
  7000,
  7,
  ARRAY['java', 'db']::skill[],
  '마이크로서비스 시스템, CI/CD 파이프라인, 모니터링 대시보드',
  '02-4567-8901',
  'project4@company.com'
),

-- 5. 클라우드 프로젝트
(
  '20b6c4f0-1933-4ea3-b534-1f050184c572',
  'f5193be0-6586-4aed-ba5d-d2bfd3df4c8f',
  'AWS 클라우드 인프라 마이그레이션',
  '온프레미스 서버를 AWS 클라우드로 마이그레이션하고자 합니다. 고가용성 아키텍처 설계, 자동 스케일링, 백업 및 재해 복구 시스템 구축이 필요합니다.',
  '클라우드',
  '1000만원 ~ 5000만원',
  '3개월 ~ 6개월',
  'recruiting',
  CURRENT_DATE + INTERVAL '5 days',
  CURRENT_DATE + INTERVAL '35 days',
  4000,
  4,
  ARRAY['java', 'db']::skill[],
  '클라우드 인프라, 자동화 스크립트, 모니터링 설정, 문서화',
  '02-5678-9012',
  'project5@company.com'
),

-- 6. CI/CD 프로젝트
(
  'baa0fd5e-4add-44f2-b1df-1ec59a838b7e',
  'b6d802de-a39a-4b5c-806f-607ac09f44dd',
  'DevOps 파이프라인 구축',
  '소프트웨어 배포 자동화를 위한 CI/CD 파이프라인을 구축하고자 합니다. 코드 빌드, 테스트 자동화, 배포 스크립트, 모니터링 통합이 필요합니다.',
  'CI/CD',
  '500만원 ~ 1000만원',
  '1개월 ~ 3개월',
  'pending',
  CURRENT_DATE + INTERVAL '1 days',
  CURRENT_DATE + INTERVAL '31 days',
  800,
  2,
  ARRAY['java', 'db']::skill[],
  'CI/CD 파이프라인, 배포 자동화 스크립트, 문서화',
  '02-6789-0123',
  'project6@company.com'
),

-- 7. 데이터베이스 프로젝트
(
  '20b6c4f0-1933-4ea3-b534-1f050184c572',
  '619453d2-1d1a-41c6-abeb-d4fe00c90f59',
  '데이터 웨어하우스 구축',
  '대용량 데이터 분석을 위한 데이터 웨어하우스를 구축하고자 합니다. ETL 프로세스, 데이터 파이프라인, 분석 쿼리 최적화, 리포트 대시보드가 필요합니다.',
  '데이터베이스',
  '1000만원 ~ 5000만원',
  '3개월 ~ 6개월',
  'recruiting',
  CURRENT_DATE + INTERVAL '8 days',
  CURRENT_DATE + INTERVAL '38 days',
  3500,
  4,
  ARRAY['db', 'java']::skill[],
  '데이터 웨어하우스, ETL 파이프라인, 분석 대시보드',
  '02-7890-1234',
  'project7@company.com'
),

-- 8. 디자인 프로젝트
(
  'baa0fd5e-4add-44f2-b1df-1ec59a838b7e',
  'f5193be0-6586-4aed-ba5d-d2bfd3df4c8f',
  '브랜드 아이덴티티 및 UI/UX 디자인',
  '새로운 브랜드 아이덴티티를 구축하고 웹사이트 및 모바일 앱의 UI/UX 디자인을 진행하고자 합니다. 로고, 컬러 팔레트, 타이포그래피, 디자인 시스템 구축이 필요합니다.',
  '디자인',
  '500만원 ~ 1000만원',
  '1개월 ~ 3개월',
  'pending',
  CURRENT_DATE + INTERVAL '2 days',
  CURRENT_DATE + INTERVAL '32 days',
  900,
  2,
  NULL,
  '브랜드 가이드라인, UI 디자인 시안, 디자인 시스템 문서',
  '02-8901-2345',
  'project8@company.com'
),

-- 9. 보안 프로젝트
(
  '20b6c4f0-1933-4ea3-b534-1f050184c572',
  'b6d802de-a39a-4b5c-806f-607ac09f44dd',
  '보안 감사 및 취약점 점검',
  '기존 시스템의 보안 취약점을 점검하고 보안 강화 방안을 제시하고자 합니다. 침투 테스트, 코드 보안 검토, 인프라 보안 설정 점검, 보안 정책 수립이 필요합니다.',
  '보안',
  '1000만원 ~ 5000만원',
  '1개월 ~ 3개월',
  'recruiting',
  CURRENT_DATE + INTERVAL '6 days',
  CURRENT_DATE + INTERVAL '36 days',
  2500,
  2,
  ARRAY['java', 'db']::skill[],
  '보안 감사 보고서, 취약점 분석, 보안 강화 가이드',
  '02-9012-3456',
  'project9@company.com'
),

-- 10. 웹 개발 프로젝트 (긴급)
(
  'baa0fd5e-4add-44f2-b1df-1ec59a838b7e',
  '619453d2-1d1a-41c6-abeb-d4fe00c90f59',
  '기업 홈페이지 리뉴얼',
  '기존 홈페이지를 현대적인 디자인으로 리뉴얼하고자 합니다. 반응형 웹 디자인, SEO 최적화, 성능 개선, CMS 통합이 필요합니다. 빠른 진행이 필요한 프로젝트입니다.',
  '웹 개발',
  '500만원 ~ 1000만원',
  '1개월 이하',
  'recruiting',
  CURRENT_DATE + INTERVAL '1 days',
  CURRENT_DATE + INTERVAL '21 days',
  800,
  1,
  ARRAY['java', 'db']::skill[],
  '리뉴얼된 웹사이트, 관리자 페이지, SEO 최적화',
  '02-0123-4567',
  'project10@company.com'
);

