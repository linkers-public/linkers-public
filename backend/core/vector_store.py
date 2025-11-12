# backend/core/vector_store.py

from langchain_openai import OpenAIEmbeddings
from typing import List, Dict, Optional
from config import settings

# ChromaDB는 Windows 빌드 문제로 선택사항
try:
    from langchain_community.vectorstores import Chroma
    import chromadb
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    print("[경고] ChromaDB를 사용할 수 없습니다. Supabase pgvector를 사용하세요.")


class VectorStoreManager:
    def __init__(self):
        # 로컬 임베딩 사용
        if settings.use_local_embedding:
            # 로컬 임베딩 사용
            try:
                from sentence_transformers import SentenceTransformer
                from langchain_community.embeddings import HuggingFaceEmbeddings
                print(f"[로딩] 로컬 임베딩 모델: {settings.local_embedding_model}")
                model = SentenceTransformer(settings.local_embedding_model)
                self.embeddings = HuggingFaceEmbeddings(model_name=settings.local_embedding_model)
                print("[완료] 로컬 임베딩 모델 로드 완료")
            except ImportError:
                raise ImportError("sentence-transformers가 설치되지 않았습니다. pip install sentence-transformers")
        else:
            # 로컬 임베딩이 비활성화된 경우 (일반적으로 발생하지 않음)
            raise ValueError("로컬 임베딩을 사용해야 합니다. sentence-transformers를 설치하세요.")
        
        if CHROMADB_AVAILABLE:
            # ChromaDB 클라이언트 초기화
            self.client = chromadb.PersistentClient(
                path=settings.chroma_persist_dir
            )
            
            # 컬렉션들
            self.announcements = self._get_or_create_collection("announcements")
            self.teams = self._get_or_create_collection("teams")
            self.estimates = self._get_or_create_collection("estimates")
        else:
            # ChromaDB 없이 작동 (Supabase 사용)
            self.client = None
            self.announcements = None
            self.teams = None
            self.estimates = None
            print("[정보] ChromaDB 없이 작동합니다. Supabase pgvector를 사용하세요.")
    
    def _get_or_create_collection(self, name: str):
        """컬렉션 가져오기 또는 생성"""
        if not CHROMADB_AVAILABLE:
            return None
        return Chroma(
            client=self.client,
            collection_name=name,
            embedding_function=self.embeddings
        )
    
    def add_announcement(self, chunks: List, announcement_id: str, metadata: Dict):
        """공고문 벡터 저장"""
        if not CHROMADB_AVAILABLE or not self.announcements:
            raise Exception("ChromaDB를 사용할 수 없습니다. Supabase pgvector를 사용하세요.")
        
        try:
            # chunks가 Document 객체인 경우 텍스트 추출
            if hasattr(chunks[0], 'page_content'):
                documents = [chunk.page_content for chunk in chunks]
            else:
                documents = chunks
            
            # 메타데이터 추가
            metadatas = [{
                "announcement_id": announcement_id,
                "chunk_index": i,
                **metadata
            } for i in range(len(documents))]
            
            self.announcements.add_documents(
                documents=documents,
                ids=[f"{announcement_id}_chunk_{i}" for i in range(len(documents))],
                metadatas=metadatas
            )
            return True
        except Exception as e:
            raise Exception(f"공고문 저장 실패: {str(e)}")
    
    def add_team(self, team_doc: str, team_data: Dict):
        """팀 프로필 저장"""
        if not CHROMADB_AVAILABLE or not self.teams:
            raise Exception("ChromaDB를 사용할 수 없습니다. Supabase pgvector를 사용하세요.")
        
        try:
            self.teams.add_texts(
                texts=[team_doc],
                metadatas=[team_data],
                ids=[team_data['team_id']]
            )
            return True
        except Exception as e:
            raise Exception(f"팀 프로필 저장 실패: {str(e)}")
    
    def search_similar_announcements(self, query: str, k: int = 3, filters: Optional[Dict] = None):
        """유사 공고 검색"""
        if not CHROMADB_AVAILABLE or not self.announcements:
            print("[경고] ChromaDB를 사용할 수 없습니다. Supabase pgvector를 사용하세요.")
            return []
        
        try:
            results = self.announcements.similarity_search(
                query=query,
                k=k,
                filter=filters
            )
            return results
        except Exception as e:
            print(f"검색 오류: {str(e)}")
            return []
    
    def search_matching_teams(self, requirements: str, k: int = 5, min_rating: float = 4.0):
        """요구사항 매칭 팀 검색"""
        if not CHROMADB_AVAILABLE or not self.teams:
            print("[경고] ChromaDB를 사용할 수 없습니다. Supabase pgvector를 사용하세요.")
            return []
        
        try:
            # 필터 적용 (평점 기준)
            results = self.teams.similarity_search_with_score(
                query=requirements,
                k=k * 2  # 필터링 고려해서 더 많이 검색
            )
            
            # 평점 필터링
            filtered_results = [
                (doc, score) for doc, score in results 
                if doc.metadata.get('rating', 0) >= min_rating
            ]
            
            return filtered_results[:k]
        except Exception as e:
            print(f"팀 검색 오류: {str(e)}")
            return []
    
    def get_announcement_by_id(self, announcement_id: str):
        """특정 공고 조회"""
        if not CHROMADB_AVAILABLE or not self.client:
            print("⚠️  ChromaDB를 사용할 수 없습니다. Supabase에서 조회하세요.")
            return None
        
        try:
            # ChromaDB에서 직접 조회
            collection = self.client.get_collection("announcements")
            results = collection.get(
                where={"announcement_id": announcement_id}
            )
            # 결과가 없으면 빈 딕셔너리 반환
            if not results or len(results.get('ids', [])) == 0:
                return None
            return results
        except Exception as e:
            print(f"공고 조회 오류: {str(e)}")
            return None

