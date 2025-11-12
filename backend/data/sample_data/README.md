# 샘플 데이터

이 디렉토리에 테스트용 샘플 데이터를 저장하세요.

## 필요한 샘플 데이터

1. **공고 PDF 파일**
   - `sample_announcement_1.pdf`
   - `sample_announcement_2.pdf`
   - `sample_announcement_3.pdf`

2. **팀 프로필 데이터** (JSON 형식)
   - `teams.json`

## 팀 프로필 데이터 형식

```json
[
  {
    "team_id": "team_001",
    "name": "프론트엔드 전문팀",
    "skills": ["React", "TypeScript", "Next.js"],
    "experience_years": 5,
    "rating": 4.8,
    "location": "서울",
    "projects": [
      "정부 디지털 서비스 구축",
      "금융권 모바일 앱 개발"
    ],
    "description": "프론트엔드 개발 전문 팀입니다."
  }
]
```

## 사용 방법

1. 샘플 PDF 파일을 이 디렉토리에 저장
2. 팀 프로필 데이터를 `teams.json`으로 저장
3. API를 통해 데이터 업로드

