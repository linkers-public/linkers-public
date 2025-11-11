# MCP 연결 확인 가이드

## 📋 현재 MCP 서버 설정

### 설정 파일 위치
`.cursor/mcp.json`

### 등록된 MCP 서버

#### 1. Supabase MCP 서버
```json
{
  "name": "supabase-sessac",
  "url": "https://mcp.supabase.com/mcp?project_ref=zmxxbdrfwhavwxizdfyz"
}
```

**프로젝트 정보:**
- **프로젝트 ID**: `zmxxbdrfwhavwxizdfyz`
- **프로젝트 URL**: `https://zmxxbdrfwhavwxizdfyz.supabase.co`
- **프로젝트 이름**: linkers-public

#### 2. Vercel MCP 서버
```json
{
  "name": "vercel-sessac",
  "url": "https://mcp.vercel.com",
  "headers": {}
}
```

## ✅ 연결 확인 방법

### 방법 1: Cursor에서 직접 확인

1. **Cursor 설정 확인**
   - Cursor 설정에서 MCP 서버 상태 확인
   - 각 서버의 연결 상태가 "Connected"인지 확인

2. **MCP 도구 사용 테스트**
   - Cursor에서 MCP 도구가 사용 가능한지 확인
   - 예: Supabase 테이블 조회, Vercel 배포 상태 확인 등

### 방법 2: Supabase 프로젝트 확인

Supabase MCP 서버가 올바르게 연결되었는지 확인:

1. **Supabase 대시보드 접속**
   - [Supabase 대시보드](https://app.supabase.com) 접속
   - 프로젝트 ID `zmxxbdrfwhavwxizdfyz` 확인

2. **프로젝트 URL 확인**
   ```
   https://zmxxbdrfwhavwxizdfyz.supabase.co
   ```

3. **환경 변수 확인**
   - `.env.local` 파일에서 다음 변수 확인:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://zmxxbdrfwhavwxizdfyz.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
   ```

### 방법 3: API 테스트

프로젝트에서 Supabase 연결 테스트:

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 접속
http://localhost:3000/api/test-supabase
```

또는 curl 사용:
```bash
curl http://localhost:3000/api/test-supabase
```

## 🔍 연결 상태 확인 체크리스트

### Supabase MCP
- [ ] `.cursor/mcp.json` 파일에 올바른 프로젝트 ID 설정됨
- [ ] Supabase 프로젝트가 활성화되어 있음
- [ ] 프로젝트 URL이 올바름 (`https://zmxxbdrfwhavwxizdfyz.supabase.co`)
- [ ] 환경 변수에 올바른 URL과 키가 설정됨

### Vercel MCP
- [ ] `.cursor/mcp.json` 파일에 Vercel MCP URL 설정됨
- [ ] Vercel 계정에 로그인되어 있음
- [ ] 프로젝트가 Vercel에 배포되어 있음

## 🐛 문제 해결

### MCP 서버가 연결되지 않는 경우

1. **설정 파일 확인**
   - `.cursor/mcp.json` 파일이 올바른 위치에 있는지 확인
   - JSON 형식이 올바른지 확인

2. **Cursor 재시작**
   - Cursor를 완전히 종료하고 다시 시작
   - MCP 서버 연결이 초기화됨

3. **프로젝트 ID 확인**
   - Supabase 대시보드에서 프로젝트 ID 확인
   - `project_ref` 파라미터가 올바른지 확인

4. **인증 확인**
   - Supabase MCP는 프로젝트 ID만 필요
   - Vercel MCP는 추가 인증이 필요할 수 있음

## 📝 현재 프로젝트 정보

**프로젝트 이름**: linkers-public  
**Supabase 프로젝트 ID**: zmxxbdrfwhavwxizdfyz  
**Supabase URL**: https://zmxxbdrfwhavwxizdfyz.supabase.co

## 🔗 관련 링크

- [Supabase 대시보드](https://app.supabase.com/project/zmxxbdrfwhavwxizdfyz)
- [Vercel 대시보드](https://vercel.com)
- [MCP 문서](https://modelcontextprotocol.io)

