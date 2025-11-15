# backend/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes_v2 import router, router_v2  # v2 라우터 사용
from api.routes_legal import router_legal  # 법률 RAG 라우터
from config import settings
import uvicorn

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
app.include_router(router)
app.include_router(router_v2)  # v2 엔드포인트
app.include_router(router_legal)  # 법률 RAG 엔드포인트


@app.get("/")
async def root():
    return {
        "message": "Linkus Public RAG API",
        "docs": "/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True
    )

