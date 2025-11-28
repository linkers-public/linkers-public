# backend/config.py

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    # API Keys (해커톤 모드에서는 사용 안 함)
    openai_api_key: Optional[str] = None
    anthropic_api_key: Optional[str] = None
    groq_api_key: Optional[str] = None  # Groq API 키 (환경변수 GROQ_API_KEY에서 가져옴)
    
    # Supabase
    supabase_url: Optional[str] = None
    supabase_service_role_key: Optional[str] = None
    database_url: Optional[str] = None
    
    # Vector DB (레거시 - ChromaDB)
    chroma_persist_dir: str = "./data/chroma_db"
    
    # Embedding Model (로컬 임베딩 사용)
    use_local_embedding: bool = True  # sentence-transformers 사용 (무료)
    local_embedding_model: str = "BAAI/bge-m3"  # 로컬 임베딩 모델: bge-m3 (1024차원, 다국어 지원, 법률/계약서에 적합)
    embedding_device: Optional[str] = "cpu"  # 임베딩 디바이스: "cpu" (meta tensor 문제 방지), "cuda"(GPU 강제), None/"auto"(자동 감지)
    
    # 문서/기업 임베딩 모델 구분 (선택사항)
    doc_embed_model: str = "BAAI/bge-m3"  # 문서 임베딩: 법률/계약서/공고문 (1024차원, 다국어)
    company_embed_model: str = "BAAI/bge-small-en-v1.5"  # 기업 임베딩: 기업/팀 기술스택 및 수행이력 (384차원, 빠름, 레거시)
    
    # LLM Model (Groq 사용)
    llm_temperature: float = 0.5
    disable_llm: bool = False  # True면 LLM 분석 비활성화 (개발/테스트용)
    
    # Groq 설정 (Groq LLM 사용)
    groq_model: str = "llama-3.1-8b-instant"  # Groq 모델명 (빠르고 저렴한 모델)
    use_groq: bool = True  # Groq 사용 (기본값: True)
    
    # Ollama 설정 (로컬 LLM 사용 - 레거시, Groq 사용 시 비활성화)
    ollama_base_url: str = "http://localhost:11434"  # Ollama 서버 주소
    ollama_model: str = "mistral"  # mistral (한국어 성능 우수), llama3, phi3 등
    use_ollama: bool = False  # Ollama 사용 (로컬 LLM, 무료) - Groq 사용 시 False
    
    # 벡터 DB 선택
    use_chromadb: bool = False  # True면 ChromaDB 사용 (로컬), False면 Supabase
    
    # Chunk Settings
    chunk_size: int = 1000
    chunk_overlap: int = 200
    
    # Embedding Cache Settings
    embedding_cache_size: int = 100  # LRU 캐시 최대 크기 (기본값: 100)
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
        extra="ignore"  # 정의되지 않은 필드 무시
    )


settings = Settings()

