# 원본 저장소로 동기화하기

현재 fork된 저장소(`makers-for-free/linkers`)에서 작업한 내용을 원본 저장소(`suhyeon10/linkers`)로 푸시하는 방법입니다.

## 방법 1: 로컬에서 직접 푸시 (권장)

### 1. Remote 확인
```bash
git remote -v
```

### 2. Origin을 원본 저장소로 변경
```bash
# 기존 origin 제거
git remote remove origin

# 원본 저장소를 origin으로 설정
git remote add origin https://github.com/suhyeon10/linkers.git

# 또는 기존 origin의 URL만 변경
git remote set-url origin https://github.com/suhyeon10/linkers.git
```

### 3. 원본 저장소로 푸시
```bash
git push origin main
```

### 4. Fork 저장소도 유지하려면
```bash
# Fork 저장소를 별도 remote로 추가
git remote add fork https://github.com/makers-for-free/linkers.git

# Fork에도 푸시
git push fork main
```

## 방법 2: GitHub Actions로 자동 푸시

GitHub Actions를 사용하여 fork에서 원본으로 자동 푸시하려면:

1. **Personal Access Token (PAT) 생성**
   - GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - `repo` 권한 필요
   - 토큰을 GitHub Secrets에 `UPSTREAM_PAT`로 저장

2. **워크플로우 수정**
   - `.github/workflows/sync-fork.yml` 수정
   - PAT를 사용하여 원본 저장소로 푸시

## 현재 Remote 설정

- **origin**: `makers-for-free/linkers` (fork된 저장소)
- **upstream**: `suhyeon10/linkers` (원본 저장소)

## 주의사항

- 원본 저장소에 대한 **write 권한**이 필요합니다
- 원본 저장소가 private인 경우 **인증 토큰**이 필요합니다
- Fork된 저장소에서 원본으로 직접 푸시하는 것은 일반적이지 않습니다
  - 일반적인 워크플로우: Fork → Pull Request → 원본 저장소에 머지

