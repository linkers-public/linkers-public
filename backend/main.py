# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes_v2 import router, router_v2  # v2 라우터 사용
from api.routes_legal import router_legal  # 법률 RAG 라우터
from api.routes_legal_v2 import router as router_legal_v2  # 법률 RAG 라우터 v2
from config import settings
import uvicorn
import logging
from logging.handlers import RotatingFileHandler
import os
from datetime import datetime

# 로그 디렉토리 생성
LOG_DIR = "./logs"
os.makedirs(LOG_DIR, exist_ok=True)

# 로그 파일 경로
LOG_FILE = os.path.join(LOG_DIR, f"server_{datetime.now().strftime('%Y%m%d')}.log")

# 루트 로거 설정
root_logger = logging.getLogger()
root_logger.setLevel(logging.INFO)

# 기존 핸들러 제거 (중복 방지)
for handler in root_logger.handlers[:]:
    root_logger.removeHandler(handler)

# 콘솔 핸들러
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.INFO)
console_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(console_formatter)

# 파일 핸들러 (로테이션)
file_handler = RotatingFileHandler(
    LOG_FILE,
    maxBytes=10 * 1024 * 1024,  # 10MB
    backupCount=5,
    encoding='utf-8'
)
file_handler.setLevel(logging.INFO)
file_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
file_handler.setFormatter(file_formatter)

# 핸들러 추가
root_logger.addHandler(console_handler)
root_logger.addHandler(file_handler)

# uvicorn 로거 설정 (파일에도 출력되도록)
uvicorn_logger = logging.getLogger("uvicorn")
uvicorn_logger.setLevel(logging.INFO)
uvicorn_logger.addHandler(file_handler)
uvicorn_logger.propagate = True

uvicorn_access_logger = logging.getLogger("uvicorn.access")
uvicorn_access_logger.setLevel(logging.INFO)
uvicorn_access_logger.addHandler(file_handler)
uvicorn_access_logger.propagate = True

uvicorn_error_logger = logging.getLogger("uvicorn.error")
uvicorn_error_logger.setLevel(logging.INFO)
uvicorn_error_logger.addHandler(file_handler)
uvicorn_error_logger.propagate = True

# FastAPI 앱 생성
app = FastAPI(
    title="Linkus Public RAG API",
    description="공공입찰 자동 분석 및 팀 매칭 시스템 + 법률 리스크 분석",
    version="1.0.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인만 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
# 중요: 더 구체적인 경로를 가진 라우터를 먼저 등록해야 함
app.include_router(router)
app.include_router(router_legal_v2)  # 법률 RAG 엔드포인트 (v2 - 가이드 스펙) - 먼저 등록 (더 구체적)
app.include_router(router_legal)  # 법률 RAG 엔드포인트 (v1)
app.include_router(router_v2)  # v2 엔드포인트 - 나중에 등록 (덜 구체적)


@app.get("/")
async def root():
    return {
        "message": "Linkus Public RAG API",
        "docs": "/docs",
        "health": "/api/health",
        "legal_v2_health": "/api/v2/legal/health"
    }

@app.get("/api/health")
async def health():
    """헬스 체크 (공통)"""
    return {
        "status": "ok",
        "message": "Linkus Public RAG API is running"
    }


if __name__ == "__main__":
    # 로그 파일 경로 출력
    print(f"[로그] 서버 로그가 저장됩니다: {os.path.abspath(LOG_FILE)}")
    
    # uvicorn 로그 설정 (파일과 콘솔 모두 출력)
    log_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            },
            "access": {
                "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            },
        },
        "handlers": {
            "default": {
                "formatter": "default",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
            },
            "file": {
                "formatter": "default",
                "class": "logging.handlers.RotatingFileHandler",
                "filename": LOG_FILE,
                "maxBytes": 10 * 1024 * 1024,  # 10MB
                "backupCount": 5,
                "encoding": "utf-8",
            },
            "access": {
                "formatter": "access",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
            },
            "access_file": {
                "formatter": "access",
                "class": "logging.handlers.RotatingFileHandler",
                "filename": LOG_FILE,
                "maxBytes": 10 * 1024 * 1024,  # 10MB
                "backupCount": 5,
                "encoding": "utf-8",
            },
        },
        "loggers": {
            "uvicorn": {
                "handlers": ["default", "file"],
                "level": "INFO",
                "propagate": False,
            },
            "uvicorn.error": {
                "handlers": ["default", "file"],
                "level": "INFO",
                "propagate": False,
            },
            "uvicorn.access": {
                "handlers": ["access", "access_file"],
                "level": "INFO",
                "propagate": False,
            },
        },
    }
    
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
        log_config=log_config
    )

