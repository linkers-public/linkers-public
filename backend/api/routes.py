# backend/api/routes.py

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from models.schemas import APIResponse, EstimateRequest
from core.orchestrator import RAGOrchestrator
from core.async_tasks import get_task_manager
import shutil
import os
import json
import asyncio

router = APIRouter(prefix="/api", tags=["RAG"])

# RAG 오케스트레이터 초기화
rag = RAGOrchestrator()

# 임시 파일 디렉토리
TEMP_DIR = "./data/temp"
os.makedirs(TEMP_DIR, exist_ok=True)


@router.post("/announcements/upload", response_model=APIResponse)
async def upload_announcement(file: UploadFile = File(...)):
    """
    공고 PDF 업로드 및 자동 분석
    """
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="PDF 파일만 업로드 가능합니다")
    
    try:
        # 임시 저장
        temp_path = os.path.join(TEMP_DIR, file.filename)
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # RAG 처리
        result = await rag.process_announcement(temp_path)
        
        return APIResponse(
            status="success",
            message="공고 분석 완료",
            data=result
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/announcements/{announcement_id}/match", response_model=APIResponse)
async def match_teams(announcement_id: str):
    """
    공고에 적합한 팀 매칭
    """
    try:
        matched = await rag.match_teams(announcement_id)
        
        return APIResponse(
            status="success",
            message=f"{len(matched)}개 팀 매칭 완료",
            data={"matched_teams": matched}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/estimates/generate", response_model=APIResponse)
async def generate_estimate(request: EstimateRequest):
    """
    견적서 자동 생성
    """
    try:
        estimate = await rag.generate_estimate(
            announcement_id=request.announcement_id,
            team_id=request.team_id
        )
        
        return APIResponse(
            status="success",
            message="견적서 생성 완료",
            data={"estimate": estimate}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/analysis/start", response_model=APIResponse)
async def start_analysis(
    request: dict,
    background_tasks: BackgroundTasks
):
    """
    공고 분석 작업 시작 (비동기)
    """
    doc_id = request.get('doc_id')
    if not doc_id:
        raise HTTPException(status_code=400, detail="doc_id가 필요합니다")
    
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


@router.get("/health")
async def health_check():
    """헬스 체크"""
    return {"status": "ok", "message": "Linkus Public RAG API is running"}

