# 공고 문서 폴더

이 폴더에 공고 문서 파일을 넣고 배치 처리 스크립트를 실행하면 자동으로 RAG에 반영됩니다.

## 사용 방법

### 1. 파일 준비
- PDF, 텍스트, HWP, HWPX, HTML 파일을 이 폴더에 복사
- **지원 형식**: `.pdf`, `.txt`, `.hwp`, `.hwpx`, `.html`, `.htm`

### 2. 배치 처리 실행
```bash
cd backend
python scripts/batch_ingest.py data/announcements
```

### 3. 자동 감시 (선택)
```bash
python scripts/watch_folder.py data/announcements
# 새 파일이 추가되면 자동으로 처리됨
```

## 파일명 규칙 (선택)

파일명에서 메타데이터를 자동 추출합니다:

**형식**: `{source}_{external_id}_{title}.{확장자}`

**예시**:
- `나라장터_2024-001_웹사이트구축.pdf`
- `조달청_2024-002_모바일앱개발.html`
- `정보통신시스템_2024-003_유지관리.hwpx`

규칙을 따르지 않으면 기본값이 사용됩니다.

