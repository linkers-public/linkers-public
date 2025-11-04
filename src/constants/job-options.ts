// 공통 직무 및 전문분야 옵션 정의

export const JOB_CATEGORIES = [
  {
    category: '개발',
    jobs: [
      '프론트엔드 개발',
      '백엔드 개발',
      '풀스택 개발',
      '모바일 개발',
      '웹 개발',
      '앱 개발',
      '데이터 엔지니어링',
      '데브옵스',
    ],
  },
  {
    category: '디자인',
    jobs: ['UX/UI 디자인', '그래픽 디자인', '브랜드 디자인'],
  },
  {
    category: '기획',
    jobs: ['서비스 기획', '전략 기획', '프로덕트 매니저', '프로젝트 매니저'],
  },
  {
    category: '기타',
    jobs: ['데이터 분석', 'AI/ML', 'QA/테스팅'],
  },
] as const

// 플랫한 직무 목록 (프로필 업데이트용) - 중복 제거
export const JOB_OPTIONS: string[] = Array.from(
  new Set(JOB_CATEGORIES.flatMap((cat) => cat.jobs))
)

// 전문분야 옵션
export const EXPERTISE_OPTIONS: string[] = [
  '웹 개발',
  '모바일 개발',
  'AI/ML',
  'UI/UX 디자인',
  '데이터 분석',
  '클라우드',
  '데이터 분석 및 처리',
  '머신러닝 및 인공지능',
  '데이터 시각화',
  '데이터베이스 설계 및 최적화',
  '자연어 처리(NLP)',
  '데이터 마이그레이션 및 ETL',
  '앱 애플리케이션 개발',
  '전자상거래 플랫폼 개발',
  'API 개발 및 운영',
  'SaaS 개발',
  '클라우드 인프라(AWS, Azure, GCP)',
  '컨테이너 오케스트레이션(Docker, Kubernetes)',
  'CI/CD 파이프라인 구축',
  '서비스 아키텍처 설계',
  '애플리케이션 보안',
  '네트워크 보안',
] as const

