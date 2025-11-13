"""
API Routes v2 - 실전형
공고 업로드 및 처리
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import Optional
from pathlib import Path
import tempfile
import os
import json
import asyncio

from core.orchestrator_v2 import Orchestrator
from core.async_tasks import get_task_manager
from models.schemas import APIResponse

router = APIRouter(prefix="/api", tags=["RAG"])
router_v2 = APIRouter(prefix="/api/v2", tags=["RAG v2"])

# 오케스트레이터 인스턴스 (지연 초기화)
_orchestrator = None

def get_orchestrator() -> Orchestrator:
    """오케스트레이터 인스턴스 가져오기 (지연 초기화)"""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = Orchestrator()
    return _orchestrator

# 임시 파일 디렉토리
TEMP_DIR = "./data/temp"
os.makedirs(TEMP_DIR, exist_ok=True)


@router_v2.post("/announcements/upload", response_model=APIResponse)
async def upload_announcement_v2(
    file: UploadFile = File(...),
    source: str = Form("streamlit_upload"),
    external_id: Optional[str] = Form(None),
    title: Optional[str] = Form(None),
    agency: Optional[str] = Form(None),
    budget_min: Optional[int] = Form(None),
    budget_max: Optional[int] = Form(None),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
):
    """
    공고 파일 업로드 및 처리 (v2)
    
    지원 포맷: PDF, 텍스트, HWP, HWPX, HWPS 파일
    파일 타입은 자동으로 감지됩니다.
    title이 없으면 파일명을 사용합니다.
    """
    # title이 없으면 파일명에서 추출
    if not title:
        title = file.filename or "제목 없음"
        # 확장자 제거
        import re
        title = re.sub(r'\.[^.]+$', '', title)
    
    # 파일 타입은 자동 감지 (None으로 전달)
    file_type = None
    
    # 지원하는 파일 확장자 확인 (선택적 검증)
    if file.filename:
        filename_lower = file.filename.lower()
        supported_extensions = ['.pdf', '.txt', '.hwp', '.hwpx', '.hwps', '.html', '.htm']
        if not any(filename_lower.endswith(ext) for ext in supported_extensions):
            raise HTTPException(
                status_code=415,
                detail=f"지원하지 않는 포맷입니다. 지원 형식: PDF, TXT, HWP, HWPX, HWPS, HTML"
            )
    
    try:
        # 파일 임시 저장
        temp_path = None
        try:
            # 원본 파일 확장자 유지
            suffix = Path(file.filename).suffix if file.filename else ".tmp"
            temp_file = tempfile.NamedTemporaryFile(
                delete=False,
                suffix=suffix,
                dir=TEMP_DIR
            )
            temp_path = temp_file.name
            
            # 파일 내용 쓰기
            content = await file.read()
            temp_file.write(content)
            temp_file.close()
            
            # 메타데이터 구성
            meta = {
                "source": source,
                "external_id": external_id or file.filename or title,
                "title": title,
                "agency": agency,
                "budget_min": budget_min,
                "budget_max": budget_max,
                "start_date": start_date,
                "end_date": end_date,
            }
            
            # 파이프라인 실행
            announcement_id = get_orchestrator().process_file(
                file_path=temp_path,
                file_type=file_type,
                meta=meta
            )
            
            return APIResponse(
                status="success",
                message="공고 업로드 및 처리 완료",
                data={
                    "announcement_id": announcement_id,
                    "source": source,
                    "title": title
                }
            )
            
        finally:
            # 임시 파일 삭제
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"공고 처리 실패: {str(e)}"
        )


@router.post("/announcements/upload", response_model=APIResponse)
async def upload_announcement(
    file: UploadFile = File(...),
    source: str = Form("manual"),
    external_id: Optional[str] = Form(None),
    title: str = Form(...),
    agency: Optional[str] = Form(None),
    budget_min: Optional[int] = Form(None),
    budget_max: Optional[int] = Form(None),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
):
    """
    공고 파일 업로드 및 처리
    
    지원 포맷: PDF, 텍스트, HWP, HWPX, HWPS 파일
    파일 타입은 자동으로 감지됩니다.
    """
    # 파일 타입은 자동 감지 (None으로 전달)
    file_type = None
    
    # 지원하는 파일 확장자 확인 (선택적 검증)
    if file.filename:
        filename_lower = file.filename.lower()
        supported_extensions = ['.pdf', '.txt', '.hwp', '.hwpx', '.hwps', '.html', '.htm']
        if not any(filename_lower.endswith(ext) for ext in supported_extensions):
            raise HTTPException(
                status_code=415,
                detail=f"지원하지 않는 포맷입니다. 지원 형식: PDF, TXT, HWP, HWPX, HWPS, HTML"
            )
    
    try:
        # 파일 임시 저장
        temp_path = None
        try:
            # 원본 파일 확장자 유지
            suffix = Path(file.filename).suffix if file.filename else ".tmp"
            temp_file = tempfile.NamedTemporaryFile(
                delete=False,
                suffix=suffix,
                dir=TEMP_DIR
            )
            temp_path = temp_file.name
            
            # 파일 내용 쓰기
            content = await file.read()
            temp_file.write(content)
            temp_file.close()
            
            # 메타데이터 구성
            meta = {
                "source": source,
                "external_id": external_id or title,  # 없으면 title로 대체
                "title": title,
                "agency": agency,
                "budget_min": budget_min,
                "budget_max": budget_max,
                "start_date": start_date,
                "end_date": end_date,
            }
            
            # 파이프라인 실행
            announcement_id = get_orchestrator().process_file(
                file_path=temp_path,
                file_type=file_type,
                meta=meta
            )
            
            return APIResponse(
                status="success",
                message="공고 업로드 및 처리 완료",
                data={
                    "announcement_id": announcement_id,
                    "source": source,
                    "title": title
                }
            )
            
        finally:
            # 임시 파일 삭제
            if temp_path and os.path.exists(temp_path):
                os.unlink(temp_path)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"공고 처리 실패: {str(e)}"
        )


@router.post("/announcements/text", response_model=APIResponse)
async def upload_announcement_text(
    text: str = Form(...),
    source: str = Form("manual"),
    external_id: Optional[str] = Form(None),
    title: str = Form(...),
    agency: Optional[str] = Form(None),
    budget_min: Optional[int] = Form(None),
    budget_max: Optional[int] = Form(None),
    start_date: Optional[str] = Form(None),
    end_date: Optional[str] = Form(None),
):
    """
    공고 텍스트 직접 업로드
    """
    try:
        meta = {
            "source": source,
            "external_id": external_id or title,
            "title": title,
            "agency": agency,
            "budget_min": budget_min,
            "budget_max": budget_max,
            "start_date": start_date,
            "end_date": end_date,
        }
        
        announcement_id = get_orchestrator().process_announcement(meta, text)
        
        return APIResponse(
            status="success",
            message="공고 처리 완료",
            data={"announcement_id": announcement_id}
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"공고 처리 실패: {str(e)}"
        )


@router.post("/analysis/start", response_model=APIResponse)
async def start_analysis(
    request: dict,
    background_tasks: BackgroundTasks
):
    """
    공고 분석 작업 시작 (비동기)
    """
    doc_id = request.get('doc_id') or request.get('announcement_id')
    if not doc_id:
        raise HTTPException(status_code=400, detail="doc_id 또는 announcement_id가 필요합니다")
    
    job_id = await get_task_manager().start_analysis_task(doc_id, background_tasks)
    
    return APIResponse(
        status="success",
        message="분석 작업이 시작되었습니다",
        data={"job_id": job_id}
    )


@router.get("/analysis/stream/{job_id}")
async def stream_analysis_progress(job_id: str):
    """
    분석 진행 상황 스트리밍 (Server-Sent Events)
    """
    async def event_generator():
        while True:
            task_status = get_task_manager().get_task_status(job_id)
            
            if not task_status:
                yield f"data: {json.dumps({'error': '작업을 찾을 수 없습니다'})}\n\n"
                break
            
            status = task_status.get('status')
            progress = task_status.get('progress', 0)
            message = task_status.get('message', '')
            
            data = {
                'status': status,
                'progress': progress,
                'message': message,
                'phase': 'analysis',
            }
            
            if status == 'completed':
                data['result'] = task_status.get('result')
                yield f"data: {json.dumps(data)}\n\n"
                break
            elif status == 'failed':
                data['error'] = task_status.get('error')
                yield f"data: {json.dumps(data)}\n\n"
                break
            else:
                yield f"data: {json.dumps(data)}\n\n"
            
            await asyncio.sleep(1)  # 1초마다 업데이트
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@router.get("/analysis/status/{job_id}")
async def get_analysis_status(job_id: str):
    """분석 작업 상태 조회"""
    task_status = task_manager.get_task_status(job_id)
    
    if not task_status:
        raise HTTPException(status_code=404, detail="작업을 찾을 수 없습니다")
    
    return APIResponse(
        status="success",
        data=task_status
    )


@router.get("/announcements/{announcement_id}/analysis")
async def get_announcement_analysis(announcement_id: str):
    """공고 분석 결과 조회"""
    try:
        analysis = get_orchestrator().get_announcement_analysis(announcement_id)
        
        if not analysis:
            raise HTTPException(
                status_code=404,
                detail="분석 결과를 찾을 수 없습니다"
            )
        
        return APIResponse(
            status="success",
            data=analysis
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"조회 실패: {str(e)}"
        )


@router.get("/v2/announcements/search")
async def search_announcements(
    query: str,
    limit: int = 5
):
    """
    공고 검색 (RAG Q&A)
    
    Args:
        query: 검색 쿼리 텍스트
        limit: 반환할 최대 개수
    
    Returns:
        {
            "answer": str,  # LLM이 생성한 답변
            "results": [   # 검색된 문서들
                {
                    "title": str,
                    "content": str,
                    "score": float,
                    "announcement_id": str
                }
            ]
        }
    """
    try:
        orchestrator = get_orchestrator()
        
        # 1. 벡터 검색
        search_results = orchestrator.search_similar_announcements(
            query=query,
            top_k=limit
        )
        
        # 2. 결과 포맷팅
        formatted_results = []
        for result in search_results:
            formatted_results.append({
                "title": result.get("metadata", {}).get("title", "제목 없음"),
                "content": result.get("content", ""),
                "score": result.get("similarity", 0.0),
                "announcement_id": result.get("announcement_id", "")
            })
        
        # 3. LLM으로 답변 생성 (검색 결과 기반)
        answer = ""
        if formatted_results and not orchestrator.generator.disable_llm:
            try:
                # 검색된 문서들을 컨텍스트로 사용
                context = "\n\n".join([
                    f"문서 {i+1}: {r['content'][:500]}"
                    for i, r in enumerate(formatted_results[:3])
                ])
                
                prompt = f"""당신은 한국어로 답변하는 전문가입니다. 다음 문서들을 기반으로 질문에 답변해주세요.

중요: 반드시 한국어로만 답변하세요. 영어를 사용하지 마세요.

질문: {query}

관련 문서:
{context}

위 문서들을 참고하여 질문에 대해 한국어로 상세히 답변해주세요:"""
                
                # LLM 호출
                if orchestrator.generator.use_ollama:
                    from langchain_community.llms import Ollama
                    from config import settings
                    
                    # 시스템 프롬프트 추가 (한국어 답변 강제)
                    system_prompt = "당신은 한국어로 답변하는 AI 어시스턴트입니다. 모든 답변은 반드시 한국어로 작성해야 합니다."
                    full_prompt = f"{system_prompt}\n\n{prompt}"
                    
                    llm = Ollama(
                        base_url=settings.ollama_base_url,
                        model=settings.ollama_model
                    )
                    answer = llm.invoke(full_prompt)
                    
                    # 영어로 답변한 경우 재시도
                    if answer and len(answer) > 0 and not any(ord(c) >= 0xAC00 and ord(c) <= 0xD7A3 for c in answer[:100]):
                        # 한국어가 없으면 더 강한 프롬프트로 재시도
                        retry_prompt = f"""당신은 한국어 전문가입니다. 다음 질문에 반드시 한국어로만 답변하세요. 영어를 사용하지 마세요.

질문: {query}

관련 문서:
{context}

한국어로 답변:"""
                        answer = llm.invoke(retry_prompt)
                elif False:  # OpenAI 사용 안 함 (해커톤 모드만 사용)
                    from langchain_openai import ChatOpenAI
                    from config import settings
                    llm = ChatOpenAI(
                        model=settings.llm_model,
                        temperature=settings.llm_temperature,
                        openai_api_key=settings.openai_api_key
                    )
                    response = llm.invoke(prompt)
                    answer = response.content if hasattr(response, 'content') else str(response)
                else:
                    answer = f"검색된 {len(formatted_results)}개의 문서를 찾았습니다."
            except Exception as e:
                print(f"[경고] LLM 답변 생성 실패: {str(e)}")
                answer = f"검색된 {len(formatted_results)}개의 문서를 찾았습니다."
        else:
            answer = f"검색된 {len(formatted_results)}개의 문서를 찾았습니다." if formatted_results else "관련 문서를 찾을 수 없습니다."
        
        return {
            "answer": answer,
            "results": formatted_results,
            "query": query,
            "count": len(formatted_results)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"검색 실패: {str(e)}"
        )


@router_v2.post("/teams/embedding", response_model=APIResponse)
async def upsert_team_embedding(
    team_id: int = Form(...),
    summary: str = Form(...),
    meta: Optional[str] = Form(None),  # JSON 문자열
):
    """
    팀 임베딩 저장/업데이트
    
    Args:
        team_id: 팀 ID
        summary: 팀 요약 텍스트
        meta: 팀 메타데이터 (JSON 문자열)
    """
    try:
        store = get_orchestrator().store
        
        # meta 파싱
        meta_dict = {}
        if meta:
            try:
                meta_dict = json.loads(meta)
            except:
                pass
        
        store.upsert_team_embedding(
            team_id=team_id,
            summary=summary,
            meta=meta_dict
        )
        
        return APIResponse(
            status="success",
            message="팀 임베딩 저장 완료",
            data={"team_id": team_id}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"팀 임베딩 저장 실패: {str(e)}"
        )


@router_v2.get("/teams/search")
async def search_teams(
    query: str,
    top_k: int = 5
):
    """
    유사 팀 검색
    
    Args:
        query: 검색 쿼리 텍스트
        top_k: 반환할 최대 개수
    """
    try:
        orchestrator = get_orchestrator()
        
        # 쿼리 임베딩 생성
        query_embedding = orchestrator.generator.embed_one(query)
        
        # 팀 검색
        results = orchestrator.store.search_similar_teams(
            query_embedding=query_embedding,
            top_k=top_k
        )
        
        return APIResponse(
            status="success",
            message=f"{len(results)}개 팀 검색 완료",
            data={"teams": results}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"팀 검색 실패: {str(e)}"
        )


@router_v2.get("/announcements/{announcement_id}/match-teams")
async def match_teams_for_announcement(
    announcement_id: str,
    top_k: int = 5
):
    """
    공고에 맞는 팀 매칭
    
    Args:
        announcement_id: 공고 ID
        top_k: 반환할 최대 팀 수
    """
    try:
        orchestrator = get_orchestrator()
        
        # 팀 매칭
        matched_teams = orchestrator.match_teams_for_announcement(
            announcement_id=announcement_id,
            top_k=top_k
        )
        
        return APIResponse(
            status="success",
            message=f"{len(matched_teams)}개 팀 매칭 완료",
            data={"teams": matched_teams}
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"팀 매칭 실패: {str(e)}"
        )


@router.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "ok", "message": "Linkus Public RAG API is running"}

