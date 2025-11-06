# Fork 저장소 자동 동기화 가이드

fork한 저장소(`makers-for-free/linkers`)를 원본 저장소(`suhyeon10/linkers`)와 자동으로 동기화하는 방법입니다.

## 🔄 자동 동기화 (GitHub Actions)

GitHub Actions 워크플로우가 자동으로 동기화를 수행합니다.

### 실행 시점

1. **수동 실행**: GitHub Actions 탭에서 "Sync Fork with Upstream" 워크플로우를 수동으로 실행
2. **자동 실행**: 매일 자정 (UTC)에 자동 실행
3. **Push 이벤트**: `main` 브랜치에 push될 때마다 실행

### 워크플로우 파일

`.github/workflows/sync-fork.yml` 파일이 자동 동기화를 담당합니다.

## 🔧 수동 동기화 방법

필요한 경우 로컬에서 수동으로 동기화할 수 있습니다.

### 1. Upstream 원격 저장소 추가 (최초 1회)

```bash
git remote add upstream https://github.com/suhyeon10/linkers.git
```

### 2. Upstream 변경사항 가져오기

```bash
git fetch upstream
```

### 3. Upstream의 main 브랜치를 현재 브랜치에 병합

```bash
git checkout main
git merge upstream/main
```

### 4. Fork 저장소에 푸시

```bash
git push origin main
```

## 📝 전체 명령어 (한 번에 실행)

```bash
# Upstream 추가 (최초 1회만)
git remote add upstream https://github.com/suhyeon10/linkers.git

# 동기화
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## ⚠️ 충돌 해결

병합 충돌이 발생하는 경우:

1. **자동 해결**: GitHub Actions 워크플로우는 충돌 시 현재 브랜치의 변경사항을 우선합니다.
2. **수동 해결**: 로컬에서 충돌을 해결한 후 푸시합니다.

```bash
# 충돌 발생 시
git merge upstream/main
# 충돌 파일 수정
git add .
git commit -m "chore: sync with upstream (resolve conflicts)"
git push origin main
```

## 🔍 현재 원격 저장소 확인

```bash
git remote -v
```

출력 예시:
```
origin    https://github.com/makers-for-free/linkers.git (fetch)
origin    https://github.com/makers-for-free/linkers.git (push)
upstream  https://github.com/suhyeon10/linkers.git (fetch)
upstream  https://github.com/suhyeon10/linkers.git (push)
```

## 💡 팁

- **자동 동기화**: GitHub Actions를 사용하면 수동 작업 없이 자동으로 동기화됩니다.
- **수동 동기화**: 더 세밀한 제어가 필요한 경우 로컬에서 수동으로 동기화하세요.
- **충돌 방지**: 가능하면 fork한 브랜치에서 직접 수정하지 않고, 별도 브랜치를 만들어 작업하세요.

