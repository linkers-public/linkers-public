# backend/core/async_tasks.py

"""
비동기 작업 처리
Celery 또는 FastAPI BackgroundTasks 사용
"""

from typing import Dict, Any, Optional
from fastapi import BackgroundTasks
from .bidding_rag import BiddingRAG
import asyncio
from datetime import datetime


class AsyncTaskManager:
    """비동기 작업 관리자"""
    
    def __init__(self):
        self._rag = None  # 지연 초기화
        self.tasks: Dict[str, Dict[str, Any]] = {}  # job_id -> task_info
    
    @property
    def rag(self):
        """BiddingRAG 지연 초기화"""
        if self._rag is None:
            self._rag = BiddingRAG()
        return self._rag
    
    async def start_analysis_task(
        self,
        doc_id: str,
        background_tasks: BackgroundTasks
    ) -> str:
        """
        비동기 공고 분석 작업 시작
        
        Returns:
            job_id: 작업 ID
        """
        job_id = f"analysis_{doc_id}_{datetime.now().timestamp()}"
        
        # 작업 정보 저장
        self.tasks[job_id] = {
            'status': 'pending',
            'progress': 0,
            'doc_id': doc_id,
            'created_at': datetime.now().isoformat(),
        }
        
        # 백그라운드 작업 시작
        background_tasks.add_task(
            self._run_analysis_task,
            job_id,
            doc_id
        )
        
        return job_id
    
    async def _run_analysis_task(self, job_id: str, doc_id: str):
        """실제 분석 작업 실행"""
        try:
            # 진행 상황 업데이트
            self._update_task(job_id, {
                'status': 'progress',
                'progress': 10,
                'message': '문서 로드 중...',
            })
            
            # 1. 문서 로드
            doc = await self.rag.load_document(doc_id)
            self._update_task(job_id, {
                'progress': 30,
                'message': '요구사항 추출 중...',
            })
            
            # 2. 요구사항 추출
            requirements = await self.rag.extract_requirements(
                doc.get('content', '')
            )
            self._update_task(job_id, {
                'progress': 50,
                'message': '유사 입찰 검색 중...',
            })
            
            # 3. 유사 입찰 검색
            similar_bids = await self.rag.search_similar_bids(requirements)
            self._update_task(job_id, {
                'progress': 70,
                'message': '리스크 분석 중...',
            })
            
            # 4. 리스크 분석
            risk_analysis = await self.rag.analyze_risks(
                requirements,
                similar_bids
            )
            self._update_task(job_id, {
                'progress': 90,
                'message': '결과 저장 중...',
            })
            
            # 5. 결과 저장
            result = {
                'requirements': requirements,
                'similar_bids': similar_bids,
                'risk_analysis': risk_analysis,
                'estimated_effort': self.rag.calculate_effort(requirements),
            }
            
            self._update_task(job_id, {
                'status': 'completed',
                'progress': 100,
                'message': '분석 완료',
                'result': result,
            })
            
        except Exception as e:
            self._update_task(job_id, {
                'status': 'failed',
                'error': str(e),
            })
    
    def _update_task(self, job_id: str, updates: Dict[str, Any]):
        """작업 상태 업데이트"""
        if job_id in self.tasks:
            self.tasks[job_id].update(updates)
            self.tasks[job_id]['updated_at'] = datetime.now().isoformat()
    
    def get_task_status(self, job_id: str) -> Optional[Dict[str, Any]]:
        """작업 상태 조회"""
        return self.tasks.get(job_id)
    
    def get_all_tasks(self) -> Dict[str, Dict[str, Any]]:
        """모든 작업 조회"""
        return self.tasks


# 전역 인스턴스 (지연 초기화)
_task_manager = None

def get_task_manager() -> AsyncTaskManager:
    """TaskManager 인스턴스 가져오기 (지연 초기화)"""
    global _task_manager
    if _task_manager is None:
        _task_manager = AsyncTaskManager()
    return _task_manager

# 호환성을 위한 별칭
task_manager = None  # 실제로는 get_task_manager() 사용

