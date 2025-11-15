"""
Supabase Vector Store 어댑터
pgvector 기반 벡터 저장 및 검색
"""

from typing import List, Dict, Any, Optional
import hashlib
import os
from supabase import create_client, Client
from config import settings


class SupabaseVectorStore:
    """Supabase pgvector 기반 벡터 저장소"""
    
    def __init__(self):
        self.sb: Optional[Client] = None
        self._initialized = False
    
    def _ensure_initialized(self):
        """Supabase 클라이언트 지연 초기화"""
        if self._initialized:
            return
        
        supabase_url = os.getenv("SUPABASE_URL") or settings.supabase_url
        supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or settings.supabase_service_role_key
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다")
        
        try:
            # Supabase 클라이언트 생성 (기본 방식만 사용)
            self.sb = create_client(supabase_url, supabase_key)
            self._initialized = True
        except Exception as e:
            error_msg = str(e)
            if "'dict' object has no attribute 'headers'" in error_msg:
                # supabase 패키지 버전 문제일 수 있음
                raise ValueError(
                    f"Supabase 클라이언트 초기화 실패: {error_msg}\n"
                    f"[해결] supabase 패키지를 재설치하세요: pip install --upgrade supabase"
                )
            raise ValueError(f"Supabase 클라이언트 초기화 실패: {error_msg}")
    
    @staticmethod
    def content_hash(text: str) -> str:
        """텍스트 해시 생성 (중복 감지용)"""
        return hashlib.sha256(text.encode("utf-8")).hexdigest()
    
    def upsert_announcement(
        self,
        meta: Dict[str, Any],
        text: str
    ) -> str:
        """
        공고 메타데이터 및 본문 저장 (중복/버전 관리)
        
        Args:
            meta: {
                source: str,
                external_id: str,
                title: str,
                agency: str,
                budget_min: int,
                budget_max: int,
                start_date: str,
                end_date: str,
                ...
            }
            text: 공고 본문 텍스트
        
        Returns:
            announcement_id (uuid)
        """
        self._ensure_initialized()
        content_hash = self.content_hash(text)
        
        # 기존 최신 버전 조회
        existing = self.sb.table("announcements")\
            .select("*")\
            .eq("source", meta["source"])\
            .eq("external_id", meta.get("external_id", ""))\
            .order("version", desc=True)\
            .limit(1)\
            .execute()
        
        # 버전 결정
        if existing.data and len(existing.data) > 0:
            prev_hash = existing.data[0].get("content_hash")
            if prev_hash == content_hash:
                # 동일 내용이면 기존 ID 반환
                return existing.data[0]["id"]
            version = existing.data[0]["version"] + 1
        else:
            version = 1
        
        # 공고 메타데이터 삽입
        # 날짜 필드 처리: 문자열을 적절한 형식으로 변환하거나 None 처리
        insert_data = {
            "source": meta.get("source"),
            "external_id": meta.get("external_id", ""),
            "title": meta.get("title", ""),
            "agency": meta.get("agency"),
            "budget_min": meta.get("budget_min"),
            "budget_max": meta.get("budget_max"),
            "version": version,
            "content_hash": content_hash,
            "status": "active",
            # Storage 파일 정보 (meta에 포함된 경우)
            "storage_file_path": meta.get("storage_file_path"),
            "storage_bucket": meta.get("storage_bucket", "announcements"),
            "file_name": meta.get("file_name"),
            "file_mime_type": meta.get("file_mime_type")
        }
        
        # 날짜 필드 처리 (None이거나 빈 문자열이면 제외)
        from datetime import datetime
        if meta.get("start_date"):
            try:
                # ISO 형식 문자열을 datetime으로 변환
                if isinstance(meta["start_date"], str):
                    # ISO 형식인지 확인
                    if "T" in meta["start_date"] or len(meta["start_date"]) > 10:
                        insert_data["start_date"] = meta["start_date"]
                    else:
                        # YYYY-MM-DD 형식이면 시간 추가
                        insert_data["start_date"] = f"{meta['start_date']}T00:00:00+00:00"
                else:
                    insert_data["start_date"] = meta["start_date"]
            except Exception as e:
                print(f"[경고] start_date 변환 실패: {str(e)}, 원본: {meta.get('start_date')}")
        
        if meta.get("end_date"):
            try:
                if isinstance(meta["end_date"], str):
                    if "T" in meta["end_date"] or len(meta["end_date"]) > 10:
                        insert_data["end_date"] = meta["end_date"]
                    else:
                        insert_data["end_date"] = f"{meta['end_date']}T23:59:59+00:00"
                else:
                    insert_data["end_date"] = meta["end_date"]
            except Exception as e:
                print(f"[경고] end_date 변환 실패: {str(e)}, 원본: {meta.get('end_date')}")
        
        # None 값 제거
        insert_data = {k: v for k, v in insert_data.items() if v is not None}
        
        result = self.sb.table("announcements")\
            .insert(insert_data)\
            .execute()
        
        if not result.data or len(result.data) == 0:
            raise Exception("공고 저장 실패")
        
        announcement_id = result.data[0]["id"]
        
        # 본문 저장
        self.sb.table("announcement_bodies")\
            .insert({
                "announcement_id": announcement_id,
                "text": text,
                "mime": "text/plain",
                "language": "ko"
            })\
            .execute()
        
        return announcement_id
    
    def bulk_upsert_chunks(
        self,
        announcement_id: str,
        chunks: List[Dict[str, Any]]
    ):
        """
        청크 및 임베딩 일괄 저장
        
        Args:
            announcement_id: 공고 ID
            chunks: [{
                chunk_index: int,
                content: str,
                embedding: List[float],
                metadata: Dict
            }]
        """
        self._ensure_initialized()
        if not chunks:
            return
        
        # Supabase는 vector 타입을 배열로 받음
        payload = [
            {
                "announcement_id": announcement_id,
                "chunk_index": c["chunk_index"],
                "content": c["content"],
                "embedding": c["embedding"],  # float[] 배열
                "metadata": c.get("metadata", {})
            }
            for c in chunks
        ]
        
        # 배치 삽입 (성능을 위해 나중에 RPC로 전환 가능)
        self.sb.table("announcement_chunks")\
            .insert(payload)\
            .execute()
    
    def search_similar_chunks(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        유사 청크 검색 (벡터 코사인 유사도)
        
        Args:
            query_embedding: 쿼리 임베딩 벡터
            top_k: 반환할 최대 개수
            filters: 메타데이터 필터 (예: {"budget_min": 10000000})
        
        Returns:
            [{
                announcement_id: str,
                chunk_index: int,
                content: str,
                similarity: float,
                metadata: Dict
            }]
        """
        self._ensure_initialized()
        # Supabase RPC 함수 사용
        rpc_params = {
            "query_embedding": query_embedding,
            "match_threshold": 0.7,
            "match_count": top_k,
            "filters": filters or {}
        }
        
        try:
            result = self.sb.rpc(
                "match_announcement_chunks",
                rpc_params
            ).execute()
            
            return result.data if result.data else []
        except Exception as e:
            # RPC 함수가 없거나 오류 발생 시 빈 리스트 반환
            print(f"벡터 검색 오류: {str(e)}")
            print("[팁] Supabase RPC 함수 'match_announcement_chunks'가 필요합니다.")
            return []
    
    def get_announcement_by_id(self, announcement_id: str) -> Optional[Dict[str, Any]]:
        """공고 정보 조회"""
        self._ensure_initialized()
        result = self.sb.table("announcements")\
            .select("*")\
            .eq("id", announcement_id)\
            .eq("status", "active")\
            .single()\
            .execute()
        
        return result.data if result.data else None
    
    def get_announcement_body(self, announcement_id: str) -> Optional[str]:
        """공고 본문 조회"""
        self._ensure_initialized()
        result = self.sb.table("announcement_bodies")\
            .select("text")\
            .eq("announcement_id", announcement_id)\
            .single()\
            .execute()
        
        return result.data.get("text") if result.data else None
    
    def save_analysis(
        self,
        announcement_id: str,
        analysis_result: Dict[str, Any],
        score: Optional[float] = None
    ):
        """분석 결과 저장"""
        self._ensure_initialized()
        self.sb.table("announcement_analysis")\
            .insert({
                "announcement_id": announcement_id,
                "result": analysis_result,
                "score": score
            })\
            .execute()
    
    def upsert_team_embedding(
        self,
        team_id: int,
        summary: str,
        meta: Dict[str, Any] = None,
        embedding: Optional[List[float]] = None
    ):
        """
        팀 임베딩 저장/업데이트
        
        Args:
            team_id: 팀 ID
            summary: 팀 요약 텍스트 (임베딩 생성용)
            meta: 팀 메타데이터 (기술 스택, 지역, 평점 등)
            embedding: 임베딩 벡터 (None이면 자동 생성)
        
        Returns:
            성공 여부
        """
        self._ensure_initialized()
        
        # 임베딩이 없으면 생성 (generator 사용)
        if embedding is None:
            from .generator_v2 import LLMGenerator
            generator = LLMGenerator()
            embedding = generator.embed_one(summary)
        
        # 팀 임베딩 저장/업데이트
        payload = {
            "team_id": team_id,
            "summary": summary,
            "meta": meta or {},
            "embedding": embedding,
            "updated_at": "now()"
        }
        
        self.sb.table("team_embeddings")\
            .upsert(payload, on_conflict="team_id")\
            .execute()
        
        return True
    
    def search_similar_teams(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        유사 팀 검색 (벡터 코사인 유사도)
        
        Args:
            query_embedding: 쿼리 임베딩 벡터
            top_k: 반환할 최대 개수
            filters: 메타데이터 필터 (예: {"specialty": ["웹개발"]})
        
        Returns:
            [{
                team_id: int,
                summary: str,
                similarity: float,
                meta: Dict
            }]
        """
        self._ensure_initialized()
        
        # Supabase RPC 함수 사용 (있으면)
        try:
            rpc_params = {
                "query_embedding": query_embedding,
                "match_threshold": 0.7,
                "match_count": top_k,
                "filters": filters or {}
            }
            
            result = self.sb.rpc(
                "match_team_embeddings",
                rpc_params
            ).execute()
            
            return result.data if result.data else []
        except Exception as e:
            # RPC 함수가 없으면 직접 SQL 쿼리 (간단한 버전)
            print(f"[경고] 팀 벡터 검색 RPC 함수가 없습니다: {str(e)}")
            print("[팁] Supabase에 'match_team_embeddings' RPC 함수를 생성하거나 직접 쿼리를 구현하세요.")
            
            # 기본 검색 (모든 팀 조회 후 클라이언트 사이드에서 필터링)
            # 실제로는 RPC 함수를 사용하는 것이 권장됩니다
            result = self.sb.table("team_embeddings")\
                .select("team_id, summary, meta, embedding")\
                .limit(100)\
                .execute()
            
            if not result.data:
                return []
            
            # 간단한 유사도 계산 (코사인 유사도)
            import numpy as np
            
            query_vec = np.array(query_embedding)
            similarities = []
            
            for team in result.data:
                if team.get("embedding"):
                    team_vec = np.array(team["embedding"])
                    # 코사인 유사도
                    similarity = np.dot(query_vec, team_vec) / (
                        np.linalg.norm(query_vec) * np.linalg.norm(team_vec)
                    )
                    similarities.append({
                        "team_id": team["team_id"],
                        "summary": team["summary"],
                        "similarity": float(similarity),
                        "meta": team.get("meta", {})
                    })
            
            # 유사도 순으로 정렬하고 top_k 반환
            similarities.sort(key=lambda x: x["similarity"], reverse=True)
            return similarities[:top_k]
    
    def get_team_embedding(self, team_id: int) -> Optional[Dict[str, Any]]:
        """팀 임베딩 조회"""
        self._ensure_initialized()
        result = self.sb.table("team_embeddings")\
            .select("*")\
            .eq("team_id", team_id)\
            .single()\
            .execute()
        
        return result.data if result.data else None

